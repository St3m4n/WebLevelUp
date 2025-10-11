// js/admin/ventas-grafico.js
// Gráfico resumen de ventas para dashboard admin
// Requiere Chart.js


// Simulación de datos de ventas (reemplazar con fetch real en producción)
// Cada punto tiene: ventas ($), ordenes (cantidad), ticket promedio ($)
const ventasDemo = {
  hora: Array.from({length: 12}, (_,i) => {
    const ordenes = Math.floor(Math.random()*5+1);
    const ventas = ordenes * (Math.floor(Math.random()*8000+2000));
    return {
      label: `${i+1} min`,
      ventas,
      ordenes,
      ticket: ordenes ? Math.round(ventas/ordenes) : 0
    };
  }),
  dia: Array.from({length: 24}, (_,i) => {
    const ordenes = Math.floor(Math.random()*20+5);
    const ventas = ordenes * (Math.floor(Math.random()*12000+4000));
    return {
      label: `${i}:00`,
      ventas,
      ordenes,
      ticket: ordenes ? Math.round(ventas/ordenes) : 0
    };
  }),
  semana: Array.from({length: 7}, (_,i) => {
    const ordenes = Math.floor(Math.random()*100+20);
    const ventas = ordenes * (Math.floor(Math.random()*15000+5000));
    return {
      label: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][i],
      ventas,
      ordenes,
      ticket: ordenes ? Math.round(ventas/ordenes) : 0
    };
  }),
  mes: Array.from({length: 30}, (_,i) => {
    const ordenes = Math.floor(Math.random()*120+30);
    const ventas = ordenes * (Math.floor(Math.random()*20000+7000));
    return {
      label: `${i+1}`,
      ventas,
      ordenes,
      ticket: ordenes ? Math.round(ventas/ordenes) : 0
    };
  })
};


let ventasChart;
let currentRango = 'dia';
let currentTipo = 'ventas';

function renderVentasChart(rango = currentRango, tipo = currentTipo) {
  currentRango = rango;
  currentTipo = tipo;
  const ctx = document.getElementById('ventasChart').getContext('2d');
  const data = ventasDemo[rango] || ventasDemo.dia;
  let label = '';
  let color = '#0d6efd';
  let bg = 'rgba(13,110,253,0.1)';
  if (tipo === 'ventas') { label = 'Ventas ($)'; color = '#0d6efd'; bg = 'rgba(13,110,253,0.1)'; }
  if (tipo === 'ordenes') { label = 'Órdenes'; color = '#198754'; bg = 'rgba(25,135,84,0.1)'; }
  if (tipo === 'ticket') { label = 'Ticket Promedio ($)'; color = '#fd7e14'; bg = 'rgba(253,126,20,0.1)'; }
  if (ventasChart) ventasChart.destroy();
  ventasChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.label),
      datasets: [{
        label,
        data: data.map(d => d[tipo]),
        borderColor: color,
        backgroundColor: bg,
        tension: 0.3,
        pointRadius: 3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  const selectRango = document.getElementById('ventasRango');
  const selectTipo = document.getElementById('ventasTipo');
  if (selectRango) {
    selectRango.addEventListener('change', e => renderVentasChart(e.target.value, selectTipo ? selectTipo.value : 'ventas'));
  }
  if (selectTipo) {
    selectTipo.addEventListener('change', e => renderVentasChart(selectRango ? selectRango.value : 'dia', e.target.value));
  }
  renderVentasChart('dia', 'ventas');
});
