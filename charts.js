// charts.js
// Funciones que crean/actualizan charts con Chart.js
// Cada función devuelve la instancia del chart creada.

// Opciones de configuración global para el tema (Modo Oscuro/Claro)
const globalChartOptions = {
    responsive: true,
    animation: { duration: 500, easing: 'easeOutQuart' },
    maintainAspectRatio: false,
    plugins: {
        legend: {
            labels: {
                color: getComputedStyle(document.body).getPropertyValue('--text') || '#222',
            }
        },
        tooltip: {
            backgroundColor: getComputedStyle(document.body).getPropertyValue('--card') || '#fff',
            titleColor: getComputedStyle(document.body).getPropertyValue('--text') || '#222',
            bodyColor: getComputedStyle(document.body).getPropertyValue('--muted') || '#666',
            borderColor: getComputedStyle(document.body).getPropertyValue('--kpi-border') || '#e6eefc',
            borderWidth: 1,
            cornerRadius: 6
        }
    },
    scales: {
        x: {
            grid: {
                color: getComputedStyle(document.body).getPropertyValue('--kpi-border') || '#e6eefc',
                drawBorder: false,
            },
            ticks: {
                color: getComputedStyle(document.body).getPropertyValue('--muted') || '#666',
            }
        },
        y: {
            beginAtZero: true,
            grid: {
                color: getComputedStyle(document.body).getPropertyValue('--kpi-border') || '#e6eefc',
                drawBorder: false,
            },
            ticks: {
                color: getComputedStyle(document.body).getPropertyValue('--muted') || '#666',
                // Formatear ticks grandes
                callback: function(value) {
                    if (value >= 1000) return value / 1000 + 'k';
                    return value;
                }
            }
        }
    }
};

// Función de utilidad para obtener opciones específicas de un gráfico
function getOptions(chartType, customOptions = {}) {
    const options = JSON.parse(JSON.stringify(globalChartOptions)); // Deep clone
    
    // Configuraciones específicas por tipo
    if (chartType === 'line' || chartType === 'bar') {
        options.plugins.legend.display = false;
    }
    
    // Merge con opciones personalizadas
    return Object.assign(options, customOptions);
}


/* =====================================================
   GRÁFICAS INDIVIDUALES
===================================================== */

export function makeVisitsLine(ctx, labels, data) {
  // Opciones específicas para la línea de visitas
  const customLineOptions = {
    scales: {
      x: { ...globalChartOptions.scales.x, grid: { display:false } },
      y: globalChartOptions.scales.y
    },
    // Añadimos un título al tooltip
    plugins: {
        ...globalChartOptions.plugins,
        tooltip: {
            ...globalChartOptions.plugins.tooltip,
            callbacks: {
                title: (items) => `${items[0].label} - Visitas`,
                label: (item) => `Total: ${item.formattedValue}`
            }
        }
    }
  };

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Visitas',
        data,
        fill: true,
        tension: 0.3, // Curva más suave
        backgroundColor: 'rgba(48,113,214,0.12)',
        borderColor: getComputedStyle(document.body).getPropertyValue('--accent') || '#3071d6',
        pointRadius: 4,
        pointBackgroundColor: getComputedStyle(document.body).getPropertyValue('--accent') || '#3071d6',
        pointHoverRadius: 6,
      }]
    },
    options: getOptions('line', customLineOptions)
  });
}

export function makeDeviceDoughnut(ctx, labels, data, colors) {
  // Opciones específicas para el doughnut (leyenda abajo)
  const customDoughnutOptions = {
    plugins: {
      ...globalChartOptions.plugins,
      legend: { 
        position:'bottom', 
        labels: globalChartOptions.plugins.legend.labels
      }
    },
    // Quitamos los ejes X/Y para el doughnut
    scales: {}
  };

  return new Chart(ctx, {
    type: 'doughnut',
    data: { 
        labels, 
        datasets:[{ 
            data, 
            backgroundColor: colors, 
            borderColor: getComputedStyle(document.body).getPropertyValue('--card') || '#fff',
            borderWidth: 4, // Borde más grueso para separar segmentos
        }] 
    },
    options: getOptions('doughnut', customDoughnutOptions)
  });
}

export function makeEventsBar(ctx, labels, data, color) {
    const customBarOptions = {
        plugins: {
            ...globalChartOptions.plugins,
            // Tooltip más informativo para eventos
            tooltip: {
                ...globalChartOptions.plugins.tooltip,
                callbacks: {
                    title: (items) => `${items[0].label}`,
                    label: (item) => `Clicks: ${item.formattedValue}`
                }
            }
        }
    };

    return new Chart(ctx, {
        type: 'bar',
        data: { 
            labels, 
            datasets:[{ 
                label:'Eventos', 
                data, 
                backgroundColor: getComputedStyle(document.body).getPropertyValue('--accent') || '#3071d6',
                borderRadius: 4, // Barras redondeadas
            }] 
        },
        options: getOptions('bar', customBarOptions)
    });
}

export function makeHorizontalBar(ctx, labels, data, color) {
    const customHBarOptions = {
        indexAxis: 'y',
        scales: {
            y: {
                ...globalChartOptions.scales.x, // Usamos la configuración X para el nuevo eje Y
                // Las etiquetas de país deben ser pequeñas, no se escalan
                ticks: {
                    color: getComputedStyle(document.body).getPropertyValue('--muted') || '#666',
                },
                grid: {
                    display:false // Sin líneas horizontales
                }
            },
            x: globalChartOptions.scales.y // Usamos la configuración Y para el nuevo eje X
        }
    };

    return new Chart(ctx, {
        type: 'bar',
        data: { 
            labels, 
            datasets:[{ 
                data, 
                backgroundColor: color || '#b79ec9', 
                borderRadius: 4,
            }] 
        },
        options: getOptions('horizontalBar', customHBarOptions)
    });
}

export function makeSimpleBar(ctx, labels, data, color) {
    // Top Pokémon es una barra vertical simple
    return new Chart(ctx, {
        type: 'bar',
        data: { 
            labels, 
            datasets:[{ 
                data, 
                backgroundColor: color || '#8dd3c7',
                borderRadius: 4,
            }] 
        },
        options: getOptions('bar')
    });
}