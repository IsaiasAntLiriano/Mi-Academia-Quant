/* ============================================
   Academia Quant — Chart Engine
   Motor visual cuantitativo basado en Chart.js
   ============================================ */

// Referencia global a la instancia activa del gráfico
let currentChart = null;

/**
 * Obtiene la referencia al chart activo.
 * Los módulos avanzados (GEX, Theta, Iron Condor) que crean
 * charts con plugins propios necesitan leer/escribir esta ref.
 */
export function getCurrentChart() {
    return currentChart;
}

export function setCurrentChart(chart) {
    currentChart = chart;
}

/**
 * Destruye el chart activo si existe.
 */
export function destroyCurrentChart() {
    if (currentChart) {
        currentChart.destroy();
        currentChart = null;
    }
}

/**
 * Aplica los defaults globales del tema Quant oscuro a Chart.js.
 */
export function applyChartDefaults() {
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = 'rgba(148, 163, 184, 0.1)';
}

/**
 * Crea o reemplaza el chart principal usando la API simplificada.
 * Usado por los módulos básicos (1-6) que siguen el patrón simple.
 *
 * @param {'line'|'bar'} type            Tipo de gráfico
 * @param {Array}        labels          Etiquetas del eje X
 * @param {Array}        data            Datos del eje Y
 * @param {string}       datasetLabel    Nombre del dataset
 * @param {string|Function} colorFunctionOrString  Color o función de color por segmento
 * @param {boolean}      fill            Si se rellena el área bajo la curva
 */
export function updateChartInstance(type, labels, data, datasetLabel, colorFunctionOrString, fill = false) {
    const ctx = document.getElementById('mainChart').getContext('2d');

    destroyCurrentChart();
    applyChartDefaults();

    const isColorFn = typeof colorFunctionOrString === 'function';

    currentChart = new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                label: datasetLabel,
                data: data,
                borderColor: isColorFn ? 'rgba(59, 130, 246, 1)' : colorFunctionOrString,
                backgroundColor: (isColorFn && type === 'bar')
                    ? colorFunctionOrString
                    : (isColorFn ? 'rgba(59, 130, 246, 0.1)' : colorFunctionOrString),
                borderWidth: 2,
                fill: fill,
                tension: 0.4,
                pointRadius: type === 'line' ? 0 : undefined,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(59, 130, 246, 0.5)',
                    borderWidth: 1
                }
            },
            scales: {
                x: { grid: { display: false } },
                y: { grid: { color: 'rgba(148, 163, 184, 0.1)' } }
            },
            segment: type === 'line' && isColorFn ? {
                borderColor: colorFunctionOrString
            } : {}
        }
    });
}

/**
 * Handler de resize para el chart activo.
 */
export function handleResize() {
    if (currentChart) currentChart.resize();
}
