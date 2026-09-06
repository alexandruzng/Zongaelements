/* Simulador de sync.js: dos dispositivos contra una nube de Firestore en memoria.
   Reproduce los escenarios que provocaban perdida de datos con el esquema
   antiguo (chunks-v1) y comprueba que kv-v2 los aguanta.

   Ejecutar:  node tests/sync.test.mjs

   Como funciona: se lee sync.js, se le quitan los imports y se ejecuta dentro
   de un `new Function` inyectando firebase, localStorage, window y document
   simulados. Cada "dispositivo" es una instancia con su propio localStorage
   (y opcionalmente su propia cuota y su propio desfase de reloj). */
import fs from "node:fs";

const SRC_PATH = new URL("../sync.js", import.meta.url);
let src = fs.readFileSync(SRC_PATH, "utf8").split(String.fromCharCode(13)).join("");
// Quitar los imports (las dependencias se inyectan como parámetros).
src = src.replace(/import \{ auth, db \}[^\n]*\n/, "");
src = src.replace(/import \{ onAuthStateChanged \}[^\n]*\n/, "");
src = src.replace(/import \{\n[\s\S]*?\} from "https:\/\/www\.gstatic\.com[^"]*";\n/, "");
if (/^\s*import /m.test(src)) throw new Error("quedan imports sin quitar");

/* ── Nube en memoria ─────────────────────────────────────────────────────── */
function makeCloud() {
  const store = new Map();               // path -> data
  const listeners = [];                  // { collPath, cb }
  let failNextWrites = 0;                // para simular subidas cortadas

  const depth = (p) => p.split("/").length;

  function notify() {
    for (const l of listeners) {
      const docs = [...store.entries()]
        .filter(([p]) => p.startsWith(l.collPath + "/") && depth(p) === depth(l.collPath) + 1)
        .map(([p, d]) => ({ id: p.slice(l.collPath.length + 1), data: () => d, ref: { path: p } }));
      l.cb({ docs, empty: docs.length === 0, metadata: { fromCache: false } });
    }
  }

  return {
    store, listeners,
    cortarSubidas(n) { failNextWrites = n; },
    api: {
      doc: (_db, ...seg) => ({ path: seg.join("/") }),
      collection: (_db, ...seg) => ({ path: seg.join("/"), __coll: true }),
      setDoc: async (ref, data, opts) => {
        if (failNextWrites > 0) { failNextWrites--; throw new Error("red cortada (simulado)"); }
        const prev = opts?.merge ? (store.get(ref.path) || {}) : {};
        store.set(ref.path, { ...prev, ...JSON.parse(JSON.stringify(data)) });
        notify();
      },
      deleteDoc: async (ref) => { store.delete(ref.path); notify(); },
      getDoc: async (ref) => {
        const d = store.get(ref.path);
        return { exists: () => d !== undefined, data: () => d };
      },
      getDocs: async (ref) => {
        const docs = [...store.entries()]
          .filter(([p]) => p.startsWith(ref.path + "/") && depth(p) === depth(ref.path) + 1)
          .map(([p, d]) => ({ id: p.slice(ref.path.length + 1), data: () => d, ref: { path: p } }));
        return { docs, empty: docs.length === 0 };
      },
      onSnapshot: (ref, _opts, cb) => {
        const l = { collPath: ref.path, cb };
        listeners.push(l);
        setTimeout(() => {
          const docs = [...store.entries()]
            .filter(([p]) => p.startsWith(ref.path + "/") && depth(p) === depth(ref.path) + 1)
            .map(([p, d]) => ({ id: p.slice(ref.path.length + 1), data: () => d, ref: { path: p } }));
          cb({ docs, empty: docs.length === 0, metadata: { fromCache: false } });
        }, 0);
        return () => { const i = listeners.indexOf(l); if (i >= 0) listeners.splice(i, 1); };
      },
    },
  };
}

/* ── localStorage con cuota ──────────────────────────────────────────────── */
function makeLS(initial = {}, quotaChars = Infinity) {
  const m = new Map(Object.entries(initial));
  const size = () => [...m.entries()].reduce((n, [k, v]) => n + k.length + v.length, 0);
  const ls = {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => {
      v = String(v);
      const nuevo = size() - (m.has(k) ? k.length + m.get(k).length : 0) + k.length + v.length;
      if (nuevo > quotaChars) { const e = new Error("quota"); e.name = "QuotaExceededError"; throw e; }
      m.set(k, v);
    },
    removeItem: (k) => m.delete(k),
    clear: () => m.clear(),
    key: (i) => [...m.keys()][i],
    get length() { return m.size; },
    __map: m,
    __size: size,
  };
  return ls;
}

/* ── Un "dispositivo": una instancia de sync.js con su propio localStorage ── */
let authCb = null;
function makeDevice(cloud, ls, { clockOffset = 0, name = "dev" } = {}) {
  const listeners = {};
  const win = {
    addEventListener: (t, f) => { (listeners[t] ||= []).push(f); },
    dispatchEvent: () => {},
    ZongaLS: undefined,
  };
  const doc_ = {
    getElementById: () => null,
    createElement: () => ({ style: {}, setAttribute() {}, appendChild() {}, addEventListener() {},
                            querySelector: () => ({ style: {}, textContent: "", addEventListener() {} }),
                            remove() {}, set innerHTML(_) {}, set textContent(_) {} }),
    body: { appendChild() {} },
    addEventListener: () => {},
    visibilityState: "visible",
  };
  const realNow = Date.now;
  const factory = new Function(
    "auth", "db", "onAuthStateChanged", "doc", "collection", "setDoc", "deleteDoc",
    "getDoc", "getDocs", "onSnapshot", "localStorage", "window", "document", "crypto",
    "location", "TextEncoder", "console", "Date", "requestAnimationFrame", "setTimeout",
    src + "\n; return { api: window.__zongaSync, fire: (u) => __cb(u) };"
  );

  let cb = null;
  const onAuth = (a, f) => { cb = f; };
  const DateShim = new Proxy(Date, { get(t, p) { return p === "now" ? () => realNow() + clockOffset : t[p]; },
                                     construct(t, a) { return new t(...a); } });

  const res = factory(
    {}, {}, onAuth,
    cloud.api.doc, cloud.api.collection, cloud.api.setDoc, cloud.api.deleteDoc,
    cloud.api.getDoc, cloud.api.getDocs, cloud.api.onSnapshot,
    ls, win, doc_, { randomUUID: () => name + "-uuid" },
    { hostname: "test", reload: () => {} }, TextEncoder,
    { log(){}, info(){}, warn(){}, error(){} },
    DateShim, (f) => f(), setTimeout
  );

  return { ls, win, sync: win.__zongaSync, login: (uid) => cb({ uid }), listeners };
}

const wait = (ms = 60) => new Promise(r => setTimeout(r, ms));

/* ── Aserciones ──────────────────────────────────────────────────────────── */
let pasan = 0, fallan = 0;
function check(nombre, cond, detalle = "") {
  if (cond) { pasan++; console.log("  ✓ " + nombre); }
  else { fallan++; console.log("  ✗ " + nombre + (detalle ? "  → " + detalle : "")); }
}

/* ════════════════════════════════════════════════════════════════════════ */
console.log("\n1. Dispositivo nuevo baja todo lo que hay en la nube");
{
  const cloud = makeCloud();
  const pc = makeDevice(cloud, makeLS({ bp_products_v1: '["camiseta","gorra"]', diario_entries_v2: "x".repeat(500) }), { name: "pc" });
  pc.login("u1"); await wait(150);

  const mac = makeDevice(cloud, makeLS({}), { name: "mac" });
  mac.login("u1"); await wait(150);

  check("el MacBook recibe los productos", mac.ls.getItem("bp_products_v1") === '["camiseta","gorra"]',
        String(mac.ls.getItem("bp_products_v1")));
  check("el MacBook recibe el diario", mac.ls.getItem("diario_entries_v2")?.length === 500);
}

console.log("\n2. Añadir un producto en el MacBook NO borra los que ya había (el fallo reportado)");
{
  const cloud = makeCloud();
  const pc = makeDevice(cloud, makeLS({ bp_products_v1: '["camiseta","gorra"]', tracker_habitos_v1: "{}" }), { name: "pc" });
  pc.login("u1"); await wait(150);

  const mac = makeDevice(cloud, makeLS({}), { name: "mac" });
  mac.login("u1"); await wait(150);

  mac.ls.setItem("bp_products_v1", '["camiseta","gorra","sudadera"]');
  await wait(1200);

  const enNube = [...cloud.store.entries()].find(([p]) => p.includes("kv/k_bp_products_v1"))?.[1];
  check("la nube tiene los 3 productos", enNube?.v === '["camiseta","gorra","sudadera"]', JSON.stringify(enNube?.v));

  // El PC recarga desde cero (simula refrescar la página)
  const pc2 = makeDevice(cloud, pc.ls, { name: "pc" });
  pc2.login("u1"); await wait(200);
  check("el PC ve los 3 productos", pc2.ls.getItem("bp_products_v1") === '["camiseta","gorra","sudadera"]',
        String(pc2.ls.getItem("bp_products_v1")));
  check("el PC conserva el tracker (otra herramienta intacta)", pc2.ls.getItem("tracker_habitos_v1") === "{}");
}

console.log("\n3. Subida cortada a la mitad (refrescar mientras sube) no corrompe la nube");
{
  const cloud = makeCloud();
  const grande = "A".repeat(600_000);   // 3 partes
  const pc = makeDevice(cloud, makeLS({ diario_entries_v2: grande, bp_products_v1: '["ok"]' }), { name: "pc" });
  pc.login("u1"); await wait(300);

  const antes = [...cloud.store.keys()].filter(k => k.includes("k_diario_entries_v2")).length;
  check("el valor grande se guarda en varias partes", antes === 3, "partes=" + antes);

  // Nueva versión, pero la red se corta antes de escribir la cabecera.
  cloud.cortarSubidas(1);
  pc.ls.setItem("diario_entries_v2", "B".repeat(600_000));
  await wait(1200);

  // Un dispositivo nuevo NO debe ver un valor mezclado ni vacío.
  const mac = makeDevice(cloud, makeLS({}), { name: "mac" });
  mac.login("u1"); await wait(200);
  const v = mac.ls.getItem("diario_entries_v2");
  check("el MacBook no ve datos corruptos", v === null || v === grande || v === "B".repeat(600_000),
        "longitud=" + (v?.length ?? "null"));
  check("las demás claves llegan igual", mac.ls.getItem("bp_products_v1") === '["ok"]');
}

console.log("\n4. Estado semilla al arrancar NO sobrescribe la nube");
{
  const cloud = makeCloud();
  const pc = makeDevice(cloud, makeLS({ bp_products_v1: '["camiseta","gorra","sudadera"]' }), { name: "pc" });
  pc.login("u1"); await wait(150);

  // El MacBook arranca con el almacenamiento vacío y la app escribe su semilla
  // ANTES de que llegue la respuesta del servidor.
  const macLs = makeLS({});
  const mac = makeDevice(cloud, macLs, { name: "mac" });
  macLs.setItem("bp_products_v1", "[]");        // semilla directa, antes del login
  mac.login("u1"); await wait(400);

  check("el MacBook NO sube la semilla vacía",
        cloud.store.get("users/u1/kv/k_bp_products_v1")?.v === '["camiseta","gorra","sudadera"]',
        JSON.stringify(cloud.store.get("users/u1/kv/k_bp_products_v1")?.v));
  check("el MacBook se queda con los datos buenos",
        macLs.getItem("bp_products_v1") === '["camiseta","gorra","sudadera"]');
}

console.log("\n5. Dispositivo sin espacio NO recorta la nube");
{
  const cloud = makeCloud();
  const pc = makeDevice(cloud, makeLS({ diario_entries_v2: "D".repeat(100_000), bp_products_v1: '["a","b"]' }), { name: "pc" });
  pc.login("u1"); await wait(250);

  // Tablet con muy poco espacio: el diario no le cabe.
  const chicaLs = makeLS({}, 3_000);
  const chica = makeDevice(cloud, chicaLs, { name: "chica" });
  chica.login("u1"); await wait(300);

  check("la tablet sí baja lo pequeño", chicaLs.getItem("bp_products_v1") === '["a","b"]');
  check("la tablet no puede bajar el diario", chicaLs.getItem("diario_entries_v2") === null);

  // Ahora edita algo en la tablet: no debe arrastrar el diario a la nada.
  chicaLs.setItem("bp_products_v1", '["a","b","c"]');
  await wait(1200);

  check("el diario sigue completo en la nube",
        cloud.store.get("users/u1/kv/k_diario_entries_v2")?.v?.length === 100_000,
        "longitud=" + (cloud.store.get("users/u1/kv/k_diario_entries_v2")?.v?.length ?? "null"));
  check("la edición de la tablet sí sube",
        cloud.store.get("users/u1/kv/k_bp_products_v1")?.v === '["a","b","c"]');
}

console.log("\n6. Reloj atrasado: la edición más reciente gana igualmente");
{
  const cloud = makeCloud();
  const pc = makeDevice(cloud, makeLS({ bp_products_v1: '["viejo"]' }), { name: "pc" });
  pc.login("u1"); await wait(150);

  // MacBook con el reloj 10 minutos atrasado
  const macLs = makeLS({});
  const mac = makeDevice(cloud, macLs, { clockOffset: -600_000, name: "mac" });
  mac.login("u1"); await wait(200);
  macLs.setItem("bp_products_v1", '["nuevo"]');
  await wait(1200);

  check("gana la edición del MacBook pese al reloj atrasado",
        cloud.store.get("users/u1/kv/k_bp_products_v1")?.v === '["nuevo"]',
        JSON.stringify(cloud.store.get("users/u1/kv/k_bp_products_v1")?.v));
}

console.log("\n7. Borrado explícito sí se propaga, y deja copia en la papelera");
{
  const cloud = makeCloud();
  const pc = makeDevice(cloud, makeLS({ bp_products_v1: '["a"]', notas: "hola" }), { name: "pc" });
  pc.login("u1"); await wait(150);
  const mac = makeDevice(cloud, makeLS({}), { name: "mac" });
  mac.login("u1"); await wait(200);

  pc.ls.removeItem("notas");
  await wait(1200);

  check("la nube marca la lápida", cloud.store.get("users/u1/kv/k_notas")?.del === true);
  const mac2 = makeDevice(cloud, mac.ls, { name: "mac" });
  mac2.login("u1"); await wait(250);
  check("el MacBook borra la nota", mac2.ls.getItem("notas") === null);
  const papelera = [...cloud.store.keys()].filter(k => k.startsWith("users/u1/trash/"));
  check("queda copia en la papelera", papelera.length > 0, "entradas=" + papelera.length);
}

console.log("\n8. Copia de seguridad diaria");
{
  const cloud = makeCloud();
  const pc = makeDevice(cloud, makeLS({ bp_products_v1: '["a","b"]' }), { name: "pc" });
  pc.login("u1"); await wait(300);
  const dia = new Date().toISOString().slice(0, 10);
  check("se ha creado la copia del día", cloud.store.has("users/u1/backups/" + dia));
  const partes = [...cloud.store.keys()].filter(k => k.startsWith(`users/u1/backups/${dia}/parts/`));
  check("la copia tiene contenido", partes.length > 0);
  const json = JSON.parse(cloud.store.get(partes[0]).v);
  check("la copia incluye los productos", json.bp_products_v1 === '["a","b"]');
}

console.log(`\n${pasan} correctas, ${fallan} fallidas\n`);
process.exit(fallan ? 1 : 0);
