// charts.js
// Funciones que crean/actualizan charts con Chart.js
// Cada función devuelve la instancia del chart creada.

export function makeVisitsLine(ctx, labels, data) {
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Visitas',
        data,
        fill: true,
        tension: 0.25,
        backgroundColor: 'rgba(48,113,214,0.12)',
        borderColor: '#3071d6',
        pointRadius: 3,
        pointBackgroundColor: '#3071d6'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display:false } },
        y: { beginAtZero:true }
      }
    }
  });
}

export function makeDeviceDoughnut(ctx, labels, data, colors) {
  return new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets:[{ data, backgroundColor: colors, borderWidth:1 }] },
    options: { responsive:true, plugins:{ legend:{ position:'bottom' } } }
  });
}

export function makeEventsBar(ctx, labels, data, color='#5a9bd8') {
  return new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets:[{ label:'Eventos', data, backgroundColor: color }] },
    options: {
      responsive:true,
      plugins:{ legend:{ display:false } },
      scales:{ y:{ beginAtZero:true } }
    }
  });
}

export function makeHorizontalBar(ctx, labels, data, color='#6b7280') {
  return new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets:[{ data, backgroundColor: color }] },
    options: {
      indexAxis: 'y',
      responsive:true,
      plugins:{ legend:{ display:false } },
      scales:{ x:{ beginAtZero:true } }
    }
  });
}

export function makeSimpleBar(ctx, labels, data, color='#78c6ff') {
  return new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets:[{ label:'Cantidad', data, backgroundColor: color }] },
    options:{ responsive:true, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true } } }
  });
}
