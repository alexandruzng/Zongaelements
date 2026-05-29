/* ============================================================
   PRODUCT HUB — Chart.js helpers
   Revenue por día (14 días) con área degradada + break-even
   ============================================================ */

let _revChart = null;

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function renderRevenueChart(canvas, product) {
  if (!window.Chart) return;
  if (_revChart) { _revChart.destroy(); _revChart = null; }

  const ink = cssVar("--ink");
  const muted = cssVar("--muted");
  const grid = cssVar("--border");
  const blue = "#2563EB";

  const labels = product.series.map((d) => fmtDate(d.date));
  const data = product.series.map((d) => d.ingresos);
  const be = product.breakEven;

  const ctx = canvas.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, 0, 320);
  grad.addColorStop(0, "rgba(37,99,235,0.28)");
  grad.addColorStop(1, "rgba(37,99,235,0.01)");

  // break-even como dataset de línea punteada horizontal
  const beLine = labels.map(() => be);

  _revChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Break-even",
          data: beLine,
          borderColor: cssVar("--green") || "#16A34A",
          borderWidth: 1.5,
          borderDash: [6, 6],
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: false,
          tension: 0,
        },
        {
          label: "Ingresos del día",
          data,
          borderColor: blue,
          borderWidth: 3,
          fill: true,
          backgroundColor: grad,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: "#fff",
          pointBorderColor: blue,
          pointBorderWidth: 3,
          pointHoverBackgroundColor: blue,
          pointHoverBorderColor: "#fff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      animation: { duration: 1100, easing: "easeInOutQuart" },
      layout: { padding: { top: 8 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: cssVar("--surface") || "#fff",
          titleColor: ink,
          bodyColor: muted,
          borderColor: grid,
          borderWidth: 1,
          padding: 12,
          cornerRadius: 12,
          titleFont: { family: "Inter", weight: "700", size: 13 },
          bodyFont: { family: "Inter", weight: "600", size: 13 },
          displayColors: true,
          boxPadding: 5,
          usePointStyle: true,
          callbacks: {
            label: (c) => {
              if (c.datasetIndex === 0) return "  Break-even: " + fmtMoney(be);
              return "  Ingresos: " + fmtMoney(c.parsed.y);
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: muted, font: { family: "Inter", size: 12, weight: "500" } },
        },
        y: {
          beginAtZero: true,
          grid: { color: grid, drawTicks: false },
          border: { display: false },
          ticks: {
            color: muted, font: { family: "Inter", size: 12, weight: "500" }, padding: 8,
            callback: (v) => fmtNum(v) + " €",
          },
        },
      },
    },
  });
  return _revChart;
}
