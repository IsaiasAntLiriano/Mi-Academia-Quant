/* ==========================================================================
   Academia Quant — Base de Datos Central de Módulos (Masterclass Cuantitativa)
   Basado en la obra de W. Edward Olmstead "Options for the Beginner and Beyond"
   y Modelado Institucional de Market Maker Gamma Exposure (GEX)
   ========================================================================== */

import {
    updateChartInstance,
    destroyCurrentChart,
    applyChartDefaults,
    setCurrentChart
} from '../core/chartEngine.js';

// --- Utilidades Matemáticas de Black-Scholes para Gráficos Cuantitativos ---
function normCdf(x) {
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    const sign = x < 0 ? -1 : 1;
    const absX = Math.abs(x) / Math.sqrt(2.0);
    const t = 1.0 / (1.0 + p * absX);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
    return 0.5 * (1.0 + sign * y);
}

function normPdf(x) {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2.0 * Math.PI);
}

export const modules = [

    // =========================================================================
    // CATEGORÍA 1: FUNDAMENTOS Y MECÁNICA OPERATIVA
    // =========================================================================

    // Módulo 1: Conceptos Básicos y Apalancamiento (Olmstead Cap. 1)
    {
        id: 1,
        category: "Fundamentos y Mecánica Operativa",
        title: "1. Conceptos Básicos y Apalancamiento",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Introducción a las Opciones y Apalancamiento Cuantitativo</h2>
            <p class="text-slate-300 mb-3">Una opción es un contrato derivado formal que otorga al comprador el <strong>derecho</strong>, mas no la obligación, de comprar o vender un activo subyacente (generalmente 100 acciones) a un precio predeterminado llamado <strong>Strike Price</strong> (Precio de Ejercicio), en o antes de una fecha límite denominada <strong>Fecha de Expiración</strong>.</p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div class="bg-slate-800/80 p-4 rounded-lg border border-slate-700">
                    <h3 class="text-green-400 font-bold mb-1">CALL (Opción de Compra)</h3>
                    <p class="text-slate-300 text-sm">Otorga el derecho a comprar 100 acciones. El comprador es alcista: gana cuando el precio del activo supera el Strike más la prima pagada ($S > K + C$).</p>
                </div>
                <div class="bg-slate-800/80 p-4 rounded-lg border border-slate-700">
                    <h3 class="text-red-400 font-bold mb-1">PUT (Opción de Venta)</h3>
                    <p class="text-slate-300 text-sm">Otorga el derecho a vender 100 acciones. Funciona como una póliza de seguro ante colapsos del mercado. El comprador gana si el precio cae por debajo del Strike menos la prima ($S < K - P$).</p>
                </div>
            </div>

            <div class="bg-slate-800 p-4 rounded-lg mb-4 border-l-4 border-blue-500">
                <h4 class="text-blue-400 font-bold">El Poder y Peligro del Apalancamiento (Olmstead Cap. 1):</h4>
                <p class="text-slate-300 text-sm mt-1">Si una acción sube de $100 a $110 (+10%), un Call Strike 100 comprado a $3.00 puede pasar a valer $10.00 (+233%). Sin embargo, si la acción permanece en $99.90 al vencimiento, la opción expira valiendo exactamente $0 (-100%). Las opciones amplifican retornos y pérdidas asimétricamente.</p>
            </div>
            
            <h4 class="text-amber-400 font-bold mb-2">Anatomía de la Prima:</h4>
            <div class="bg-slate-900 p-3 rounded font-mono text-center text-sm text-slate-200 border border-slate-800 mb-3">
                Prima de la Opción = Valor Intrínseco + Valor Extrínseco (Temporal + Volatilidad)
            </div>
        `,
        chartTitle: "Curva de Payoff: Long Call al Vencimiento",
        chartDesc: "Visualiza la pérdida estrictamente limitada al costo de la prima y el potencial alcista ilimitado superado el Break-Even.",
        controls: [
            { id: "mod1-strike", label: "Strike Price ($)", type: "range", min: 80, max: 120, value: 100, step: 1 },
            { id: "mod1-premium", label: "Prima Pagada ($)", type: "range", min: 1, max: 15, value: 4, step: 0.5 }
        ],
        renderChart: function() {
            const strike = parseFloat(document.getElementById('mod1-strike')?.value || 100);
            const premium = parseFloat(document.getElementById('mod1-premium')?.value || 4);
            const labels = [];
            const data = [];

            for (let s = 70; s <= 130; s += 2) {
                labels.push('$' + s);
                const payoff = Math.max(0, s - strike) - premium;
                data.push(parseFloat(payoff.toFixed(2)));
            }

            updateChartInstance('line', labels, data, 'P&L Long Call ($)', (ctx) => {
                const val = ctx.raw !== undefined ? ctx.raw : (ctx.p1 ? ctx.p1.parsed.y : 0);
                return val >= 0 ? '#10b981' : '#ef4444';
            }, true);
        }
    },

    // Módulo 2: Selección de Opciones: Moneyness y Valor Extrínseco vs Intrínseco (Olmstead Cap. 2)
    {
        id: 2,
        category: "Fundamentos y Mecánica Operativa",
        title: "2. Selección de Opciones: Moneyness y Valor Extrínseco",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Moneyness: ¿Qué es Realmente una Opción 'Barata'?</h2>
            <p class="text-slate-300 mb-3">En el Capítulo 2, Olmstead derriba el mito novato más letal: <em>"Una opción de $0.20 es más barata que una de $4.00"</em>. Comprar opciones lejanas OTM de $0.20 suele ser comprar boletos de lotería con un 95% de probabilidad de expiración sin valor.</p>

            <h3 class="text-lg font-semibold text-white mb-2">Clasificación Estricta del Moneyness:</h3>
            <ul class="list-disc pl-5 text-slate-300 space-y-2 mb-4">
                <li><strong class="text-green-400">ITM (In-The-Money):</strong> Posee valor intrínseco inmediato. Para un Call: $S > K$. Mayor Delta (0.65 a 0.95), menor decaimiento porcentual.</li>
                <li><strong class="text-yellow-400">ATM (At-The-Money):</strong> El Strike coincide exactamente con el precio Spot ($S \approx K$). Su valor se compone 100% de <strong>Valor Extrínseco (Temporal)</strong>. Máxima sensibilidad Gamma.</li>
                <li><strong class="text-red-400">OTM (Out-Of-The-Money):</strong> Cero valor intrínseco. Para un Call: $S < K$. Solo contiene valor temporal. Si la acción no se mueve antes de la expiración, su valor se destruye al 100%.</li>
            </ul>

            <div class="bg-slate-800 p-4 rounded-lg mb-4 border-l-4 border-amber-500">
                <h4 class="text-amber-400 font-bold">Fórmula de Descomposición:</h4>
                <p class="text-slate-300 text-sm mt-1">Para un Call: $\\text{Valor Intrínseco} = \\max(0, S - K)$. $\\text{Valor Extrínseco} = \\text{Prima de Mercado} - \\text{Valor Intrínseco}$. En el punto ATM es donde el valor extrínseco alcanza su cúspide matemática.</p>
            </div>
        `,
        chartTitle: "Descomposición: Valor Intrínseco vs. Valor Temporal (Call)",
        chartDesc: "Observa cómo el valor intrínseco domina en ITM, mientras que el valor temporal se maximiza exactamente en el strike ATM.",
        controls: [
            { id: "mod2-spot", label: "Precio Spot Subyacente ($)", type: "range", min: 80, max: 120, value: 100, step: 1 }
        ],
        renderChart: function() {
            const spot = parseFloat(document.getElementById('mod2-spot')?.value || 100);
            const strikes = [];
            const intrinsicData = [];
            const extrinsicData = [];

            for (let k = 70; k <= 130; k += 5) {
                strikes.push('K: $' + k);
                const intrinsic = Math.max(0, spot - k);
                // Modelar valor extrínseco con curva acampanada alrededor del strike ATM
                const dist = Math.abs(spot - k);
                const extrinsic = Math.max(0, 6.0 * Math.exp(-0.5 * Math.pow(dist / 10, 2)));
                intrinsicData.push(parseFloat(intrinsic.toFixed(2)));
                extrinsicData.push(parseFloat(extrinsic.toFixed(2)));
            }

            const ctx = document.getElementById('mainChart').getContext('2d');
            destroyCurrentChart();
            applyChartDefaults();

            const chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: strikes,
                    datasets: [
                        {
                            label: 'Valor Intrínseco ($)',
                            data: intrinsicData,
                            backgroundColor: 'rgba(16, 185, 129, 0.7)',
                            borderColor: '#10b981',
                            borderWidth: 1
                        },
                        {
                            label: 'Valor Extrínseco / Temporal ($)',
                            data: extrinsicData,
                            backgroundColor: 'rgba(44, 153, 214, 0.7)',
                            borderColor: '#2C99D6',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { stacked: true, grid: { display: false } },
                        y: { stacked: true, grid: { color: 'rgba(148, 163, 184, 0.1)' } }
                    }
                }
            });
            setCurrentChart(chart);
        }
    },

    // Módulo 3: Mecánica de Ejecución: Bid/Ask, Slippage y Órdenes (Olmstead Cap. 3)
    {
        id: 3,
        category: "Fundamentos y Mecánica Operativa",
        title: "3. Mecánica de Ejecución: Bid/Ask y Órdenes",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">La Microestructura del Trade: Entrada, Salida y Slippage</h2>
            <p class="text-slate-300 mb-3">En el Capítulo 3, Olmstead expone una realidad crucial: un trader puede acertar la dirección de la acción pero perder dinero sistemáticamente debido a una mala mecánica de ejecución.</p>

            <div class="space-y-3 mb-4">
                <div class="bg-slate-800/80 p-3 rounded border border-slate-700">
                    <strong class="text-blue-400">El Spread Bid/Ask (Horquilla):</strong>
                    <p class="text-slate-300 text-sm mt-1"><strong>Bid</strong> es el precio al que los Market Makers compran; <strong>Ask</strong> es el precio al que venden. Si el Bid es $3.10 y el Ask es $3.40, un spread de $0.30 representa una fricción instantánea del 9.6% sobre tu inversión. <em>Regla de oro:</em> Nunca compres opciones con spreads mayores al 5-8% de la prima.</p>
                </div>
                <div class="bg-slate-800/80 p-3 rounded border border-slate-700">
                    <strong class="text-amber-400">Órdenes Limitadas vs. Mercado vs. Stop-Loss:</strong>
                    <p class="text-slate-300 text-sm mt-1"><strong>¡Prohibido usar órdenes a mercado en opciones!</strong> Siempre utiliza órdenes limitadas al precio medio (Mid-Price: $(Bid + Ask) / 2$). Los Stop-Loss en opciones son trampas de liquidez: en aperturas con gaps o volatilidad, un stop de $2.00 puede ejecutarse a $0.80.</p>
                </div>
            </div>

            <div class="bg-slate-900 p-4 rounded-lg border-l-4 border-red-500 text-sm text-slate-300">
                <strong class="text-red-400">El Costo Acumulativo del Slippage:</strong>
                Cruzar el spread en cada entrada y salida drena rápidamente la ventaja cuantitativa del sistema. Simula abajo el impacto del spread en 20 operaciones consecutivas.
            </div>
        `,
        chartTitle: "Impacto del Slippage: Ejecución Midpoint vs. Cruce a Mercado",
        chartDesc: "Compara el P&L neto ejecutando al Midpoint frente a perder el spread en cada operación a mercado.",
        controls: [
            { id: "mod3-spread", label: "Ancho del Spread Bid/Ask ($)", type: "range", min: 0.05, max: 0.50, value: 0.20, step: 0.05 }
        ],
        renderChart: function() {
            const spread = parseFloat(document.getElementById('mod3-spread')?.value || 0.20);
            const trades = [];
            const midData = [];
            const marketData = [];
            let cumMid = 0;
            let cumMarket = 0;

            for (let i = 1; i <= 15; i++) {
                trades.push('Trade ' + i);
                const win = (i % 3 !== 0) ? 120 : -90; // Rentabilidad base antes de comisiones
                cumMid += win;
                cumMarket += (win - (spread * 100)); // Pérdida de medio spread en entrada y salida
                midData.push(cumMid);
                marketData.push(cumMarket);
            }

            const ctx = document.getElementById('mainChart').getContext('2d');
            destroyCurrentChart();
            applyChartDefaults();

            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: trades,
                    datasets: [
                        {
                            label: 'Ejecución Disciplinada (Mid-Price)',
                            data: midData,
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderWidth: 2,
                            fill: false
                        },
                        {
                            label: 'Ejecución Descuidada (Cruzar Spread Ask/Bid)',
                            data: marketData,
                            borderColor: '#ef4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            fill: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { grid: { display: false } },
                        y: { grid: { color: 'rgba(148, 163, 184, 0.1)' } }
                    }
                }
            });
            setCurrentChart(chart);
        }
    },

    // Módulo 4: Perfiles de Riesgo Multitemporales (Olmstead Cap. 5)
    {
        id: 4,
        category: "Fundamentos y Mecánica Operativa",
        title: "4. Perfiles de Riesgo: Línea T+0 vs. Expiración",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">La Realidad Dinámica: Gráficos de Riesgo T+0</h2>
            <p class="text-slate-300 mb-3">Uno de los capítulos más formativos del libro de Olmstead (Cap. 5) demuestra que <strong>los gráficos de riesgo que muestran las plataformas casi siempre son a expiración (T+Expiración)</strong>. Pero los traders profesionales rara vez esperan al vencimiento.</p>

            <h3 class="text-lg font-semibold text-white mb-2">Comportamiento Multitemporal:</h3>
            <ul class="list-disc pl-5 text-slate-300 space-y-2 mb-4">
                <li><strong class="text-blue-400">Línea T+0 (Hoy):</strong> Representa el P&L si el subyacente se mueve inmediatamente en el día actual. Muestra curvatura suave debido a la presencia íntegra del valor temporal y Vega.</li>
                <li><strong class="text-purple-400">Línea T+Intermedia:</strong> Muestra la erosión gradual por Theta. El punto de empate (breakeven) no es fijo, se desplaza con el paso de los días.</li>
                <li><strong class="text-slate-400">Línea de Expiración (Vencimiento):</strong> Líneas rectas quebradas ("hockey-stick"). Todo el valor temporal se ha evaporado.</li>
            </ul>

            <div class="bg-slate-800 p-4 rounded-lg border-l-4 border-blue-500 text-sm text-slate-300">
                <strong class="text-blue-400">Regla Cuantitativa:</strong> Si compras un Call esperando un catalizador, debes monitorear la curva T+0 para capturar la ganancia rápida y cerrar antes de que la caída hacia la línea de expiración devore tu margen de retorno.
            </div>
        `,
        chartTitle: "Curvas Multitemporales: T+0, T+15 Días y Expiración (Long Call)",
        chartDesc: "Compara cómo una misma posición gana mucho más rápido hoy (T+0) que esperando a la fecha de vencimiento.",
        controls: [
            { id: "mod4-dte", label: "Días hasta Expiración Iniciales", type: "range", min: 30, max: 90, value: 45, step: 5 }
        ],
        renderChart: function() {
            const initialDte = parseFloat(document.getElementById('mod4-dte')?.value || 45);
            const strike = 100;
            const premium = 5.0;
            const spots = [];
            const t0Data = [];
            const tMidData = [];
            const tExpData = [];

            for (let s = 80; s <= 125; s += 2.5) {
                spots.push('$' + s.toFixed(1));
                // Expiración
                const expPnl = Math.max(0, s - strike) - premium;
                tExpData.push(parseFloat(expPnl.toFixed(2)));

                // T+0 aproximado con Black-Scholes simplificado
                const dist = (s - strike);
                const t0Val = Math.max(0, dist) + 5.0 * Math.sqrt(initialDte / 45) * Math.exp(-0.5 * Math.pow(dist / 15, 2));
                t0Data.push(parseFloat((t0Val - premium).toFixed(2)));

                // T+15 días
                const remDte = Math.max(1, initialDte - 15);
                const tMidVal = Math.max(0, dist) + 5.0 * Math.sqrt(remDte / 45) * Math.exp(-0.5 * Math.pow(dist / 15, 2));
                tMidData.push(parseFloat((tMidVal - premium).toFixed(2)));
            }

            const ctx = document.getElementById('mainChart').getContext('2d');
            destroyCurrentChart();
            applyChartDefaults();

            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: spots,
                    datasets: [
                        {
                            label: 'Línea T+0 (Hoy)',
                            data: t0Data,
                            borderColor: '#2C99D6',
                            borderWidth: 2,
                            tension: 0.3
                        },
                        {
                            label: 'Línea T+15 Días',
                            data: tMidData,
                            borderColor: '#a855f7',
                            borderWidth: 2,
                            tension: 0.3
                        },
                        {
                            label: 'Línea Expiración (Final)',
                            data: tExpData,
                            borderColor: '#64748b',
                            borderWidth: 2,
                            borderDash: [4, 4]
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { grid: { display: false } },
                        y: { grid: { color: 'rgba(148, 163, 184, 0.1)' } }
                    }
                }
            });
            setCurrentChart(chart);
        }
    },

    // Módulo 5: Opciones Semanales vs. LEAPS (Olmstead Cap. 6)
    {
        id: 5,
        category: "Fundamentos y Mecánica Operativa",
        title: "5. Opciones Semanales vs. LEAPS",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">El Espectro Temporal: Desde 0DTE/Semanales hasta LEAPS</h2>
            <p class="text-slate-300 mb-3">En el Capítulo 6, Olmstead analiza los dos extremos temporales de la cadena de opciones: las <strong>Opciones Semanales</strong> (Weekly Options) y los <strong>LEAPS</strong> (Long-Term Equity Anticipation Securities, con vencimiento hasta a 2.5 años).</p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div class="bg-slate-800/80 p-4 rounded-lg border border-slate-700">
                    <h3 class="text-emerald-400 font-bold mb-1">LEAPS (Largo Plazo: 1 a 2.5 años)</h3>
                    <ul class="text-slate-300 text-sm space-y-1 list-disc pl-4">
                        <li>Decaimiento Theta diario casi imperceptible.</li>
                        <li>Excelente sustituto de compra de acciones (Stock Replacement) con Delta > 0.80.</li>
                        <li>Tratamiento fiscal favorable a largo plazo si se retienen más de un año.</li>
                    </ul>
                </div>
                <div class="bg-slate-800/80 p-4 rounded-lg border border-slate-700">
                    <h3 class="text-amber-400 font-bold mb-1">Semanales (Corto Plazo: 1 a 7 días)</h3>
                    <ul class="text-slate-300 text-sm space-y-1 list-disc pl-4">
                        <li>Gamma extremadamente explosivo (riesgo y recompensa instantáneos).</li>
                        <li>Theta agresivo: ideales para vendedores de primas en rangos definidos.</li>
                        <li>Peligro de 'pinning' y alta sensibilidad al ruido intradiario.</li>
                    </ul>
                </div>
            </div>

            <div class="bg-slate-900 p-4 rounded border-l-4 border-emerald-500 text-sm text-slate-300">
                <strong class="text-emerald-400">Estrategia Sintética de Olmstead:</strong> Comprar LEAPS Deep ITM (Delta ~ 0.85) en activos de alta calidad te permite controlar 100 acciones con un tercio del capital, y luego vender opciones semanales OTM en su contra (Diagonal Calendar / Poor Man's Covered Call).
            </div>
        `,
        chartTitle: "Tasa de Erosión Temporal (Theta Diario) según Horizonte DTE",
        chartDesc: "Comprueba cómo el decaimiento diario es mínimo en LEAPS (> 300 días) y se dispara verticalmente en las últimas 2 semanas.",
        controls: [
            { id: "mod5-iv", label: "Volatilidad Implícita (%)", type: "range", min: 15, max: 60, value: 30, step: 5 }
        ],
        renderChart: function() {
            const iv = parseFloat(document.getElementById('mod5-iv')?.value || 30) / 100;
            const dteLabels = [];
            const dailyDecay = [];

            const dtePoints = [360, 270, 180, 120, 90, 60, 45, 30, 20, 14, 7, 3, 1];
            dtePoints.forEach(dte => {
                dteLabels.push(dte + ' DTE');
                // Tasa de decaimiento Theta proporcional a 1 / (2 * sqrt(t))
                const t = dte / 365;
                const decay = (100 * iv) / (2 * Math.sqrt(t) * 365);
                dailyDecay.push(parseFloat(decay.toFixed(2)));
            });

            updateChartInstance('bar', dteLabels, dailyDecay, 'Pérdida por Theta Diario ($/día)', '#f59e0b', false);
        }
    },

    // Módulo 6: Asignación Anticipada, Dividendos y Riesgo de Expiración (Olmstead Cap. 7)
    {
        id: 6,
        category: "Fundamentos y Mecánica Operativa",
        title: "6. Asignación Anticipada y Dividendos",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">La Ansiedad de Asignación y el Umbral Crítico</h2>
            <p class="text-slate-300 mb-3">En el Capítulo 7, titulado <em>"Early Exercise and Assignment Anxiety"</em>, Olmstead desmitifica el pavor irracional que sienten los novatos ante la asignación temprana de opciones vendidas (Short Call o Short Put).</p>

            <h3 class="text-lg font-semibold text-white mb-2">Las Reglas Cuantitativas de Asignación:</h3>
            <div class="space-y-3 mb-4">
                <div class="bg-slate-800/80 p-3 rounded border border-slate-700">
                    <strong class="text-amber-400">1. La Barrera del Valor Temporal ($0.15 - $0.20):</strong>
                    <p class="text-slate-300 text-sm mt-1">Casi ningún inversor institucional ejerce anticipadamente si la opción aún conserva más de <strong>$0.15 o $0.20 de valor temporal</strong>, porque ejercerla destruiría ese valor; en su lugar, prefieren venderla en el mercado secundario para embolsarse el valor intrínseco más el extrínseco.</p>
                </div>
                <div class="bg-slate-800/80 p-3 rounded border border-slate-700">
                    <strong class="text-red-400">2. El Peligro del Ex-Dividend Date (Short Call ITM):</strong>
                    <p class="text-slate-300 text-sm mt-1">El riesgo real de asignación ocurre la víspera de la fecha ex-dividendo. Si el dividendo es mayor que el valor extrínseco restante de tu Call vendida ($D > Extrinsic$), el tenedor ejercerá para cobrar el dividendo.</p>
                </div>
            </div>

            <div class="bg-slate-900 p-4 rounded border-l-4 border-blue-500 text-sm text-slate-300">
                <strong class="text-blue-400">Solución Táctica:</strong> Si tu Short Call está profundamente ITM y se acerca la fecha de dividendo, haz un <strong>Rollout</strong>: recompra la opción actual y vende una con un mes más de vencimiento para volver a inyectar valor temporal superior al dividendo.
            </div>
        `,
        chartTitle: "Frontera de Ejercicio Anticipado: Valor Temporal vs. Dividendo",
        chartDesc: "Zona de peligro de asignación cuando el valor extrínseco cae por debajo del importe del dividendo a repartir.",
        controls: [
            { id: "mod6-div", label: "Dividendo Próximo ($)", type: "range", min: 0.20, max: 2.00, value: 0.80, step: 0.10 }
        ],
        renderChart: function() {
            const dividend = parseFloat(document.getElementById('mod6-div')?.value || 0.80);
            const dteSteps = ['30 DTE', '20 DTE', '15 DTE', '10 DTE', '5 DTE', '2 DTE', '1 DTE'];
            const extrinsic = [1.80, 1.25, 0.95, 0.65, 0.35, 0.15, 0.05];
            const divLine = Array(dteSteps.length).fill(dividend);

            const ctx = document.getElementById('mainChart').getContext('2d');
            destroyCurrentChart();
            applyChartDefaults();

            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dteSteps,
                    datasets: [
                        {
                            label: 'Valor Extrínseco de la Call ITM ($)',
                            data: extrinsic,
                            borderColor: '#2C99D6',
                            backgroundColor: 'rgba(44, 153, 214, 0.2)',
                            fill: true,
                            tension: 0.2
                        },
                        {
                            label: 'Importe del Dividendo en Efectivo ($)',
                            data: divLine,
                            borderColor: '#ef4444',
                            borderWidth: 2,
                            borderDash: [6, 4],
                            fill: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { grid: { display: false } },
                        y: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, title: { display: true, text: 'Dólares ($)' } }
                    }
                }
            });
            setCurrentChart(chart);
        }
    },

    // Módulo 7: Gestión de Capital Cuantitativa y Regla del 15% (Olmstead Caps. 8 y 9)
    {
        id: 7,
        category: "Fundamentos y Mecánica Operativa",
        title: "7. Gestión de Capital Cuantitativa: Regla del 15%",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">La Regla del 15% y Disciplina de Supervivencia</h2>
            <p class="text-slate-300 mb-3">En los Capítulos 8 y 9, Olmstead establece la regla cardinal que distingue a los operadores que sobreviven décadas de los que quiebran su cuenta en 6 meses: <strong>la gestión matemática del riesgo</strong>.</p>

            <h3 class="text-lg font-semibold text-white mb-2">Las Leyes Inmutables de Olmstead:</h3>
            <ul class="list-disc pl-5 text-slate-300 space-y-2 mb-4">
                <li><strong class="text-yellow-400">Regla del 15% por Trade:</strong> Nunca asignes más del 15% del capital total destinado a opciones en una sola operación o subyacente.</li>
                <li><strong class="text-green-400">Límite de Opciones en Cartera:</strong> La cartera de opciones especulativas no debe superar el 10% al 20% de tu patrimonio líquido total. El 80% restante debe mantenerse en activos estables o efectivo que respalde márgenes.</li>
                <li><strong class="text-red-400">El Peligro de 'Averaging Down' (Promediar a la Baja):</strong> Comprar más contratos de una opción perdedora esperando un milagro es la forma más rápida de aniquilar una cuenta.</li>
            </ul>

            <div class="bg-slate-800 p-4 rounded-lg border-l-4 border-amber-500 text-sm text-slate-300">
                <strong class="text-amber-400">Impacto en la Esperanza Matemática:</strong> Con una regla de riesgo estricta del 15% máximo, incluso una racha adversa de 6 operaciones consecutivas fallidas preserva más del 62% del capital intacto, permitiendo una recuperación matemática viable.
            </div>
        `,
        chartTitle: "Simulación de Supervivencia: Cartera con Regla 15% vs. Sobre-apalancamiento (40%)",
        chartDesc: "Compara la trayectoria de capital ante una racha negativa típica de mercado entre una gestión disciplinada y una agresiva.",
        controls: [
            { id: "mod7-risk", label: "Riesgo Asignado por Trade (%)", type: "range", min: 5, max: 40, value: 15, step: 5 }
        ],
        renderChart: function() {
            const riskPct = parseFloat(document.getElementById('mod7-risk')?.value || 15) / 100;
            const steps = ['Inicio', 'Loss 1', 'Loss 2', 'Loss 3', 'Win 1', 'Loss 4', 'Win 2', 'Loss 5', 'Win 3'];
            const outcomes = [-1, -1, -1, 1.8, -1, 1.8, -1, 1.8]; // Secuencia de eventos con win de 1.8R
            
            const disciplinedCapital = [10000];
            const aggressiveCapital = [10000];
            let capDis = 10000;
            let capAgg = 10000;

            outcomes.forEach(out => {
                const betDis = capDis * 0.15;
                const betAgg = capAgg * (riskPct);

                capDis += betDis * out;
                capAgg += betAgg * out;

                disciplinedCapital.push(parseFloat(Math.max(0, capDis).toFixed(0)));
                aggressiveCapital.push(parseFloat(Math.max(0, capAgg).toFixed(0)));
            });

            const ctx = document.getElementById('mainChart').getContext('2d');
            destroyCurrentChart();
            applyChartDefaults();

            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: steps,
                    datasets: [
                        {
                            label: 'Gestión Disciplinada (15% Max Allocation)',
                            data: disciplinedCapital,
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderWidth: 2,
                            fill: true
                        },
                        {
                            label: `Riesgo Dinámico (${(riskPct*100).toFixed(0)}%)`,
                            data: aggressiveCapital,
                            borderColor: '#ef4444',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            fill: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { grid: { display: false } },
                        y: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, title: { display: true, text: 'Capital de Cuenta ($)' } }
                    }
                }
            });
            setCurrentChart(chart);
        }
    },

    // =========================================================================
    // CATEGORÍA 2: LAS GRIEGAS Y MODELADO CUANTITATIVO
    // =========================================================================

    // Módulo 8: Delta: Dirección, Probabilidad y Cobertura (Olmstead Cap. 4)
    {
        id: 8,
        category: "Las Griegas y Modelado Cuantitativo",
        title: "8. Delta: Dirección, Probabilidad y Cobertura (Δ)",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Delta ($\\Delta$): La Brújula Direccional</h2>
            <p class="text-slate-300 mb-3">Delta mide la tasa de cambio del precio de la opción por cada $1.00 de variación en el precio del activo subyacente: $\\Delta = \\frac{\\partial V}{\\partial S}$.</p>

            <h3 class="text-lg font-semibold text-white mb-2">Las Tres Interpretaciones de Delta (Olmstead Cap. 4):</h3>
            <ul class="list-disc pl-5 text-slate-300 space-y-2 mb-4">
                <li><strong class="text-green-400">1. Sensibilidad de Precio:</strong> Una opción Call con Delta 0.60 aumentará $0.60 en su prima si la acción sube $1.00.</li>
                <li><strong class="text-blue-400">2. Equivalencia en Acciones (Hedge Ratio):</strong> Poseer 1 contrato Call con Delta 0.50 equivale exactamente al riesgo direccional de poseer 50 acciones del subyacente.</li>
                <li><strong class="text-purple-400">3. Probabilidad Implícita:</strong> Cuantitativamente, el Delta aproxima la probabilidad neutral al riesgo de que la opción expire In-The-Money (ITM). Una opción ATM tiene Delta ~0.50 (50% de probabilidad).</li>
            </ul>

            <div class="bg-slate-800 p-4 rounded-lg border-l-4 border-blue-500 text-sm text-slate-300">
                <strong class="text-blue-400">Rango de Valores:</strong> Los Calls varían entre <strong>0 y +1.0</strong>. Los Puts varían entre <strong>-1.0 y 0</strong>.
            </div>
        `,
        chartTitle: "Curva S de Delta: Calls vs. Puts a lo Largo de los Strikes",
        chartDesc: "Observa la transición de Delta de 0 a 1 en Calls y de 0 a -1 en Puts, cruzando exactamente en ATM (~0.50 / -0.50).",
        controls: [
            { id: "mod8-vol", label: "Volatilidad Implícita (IV %)", type: "range", min: 10, max: 60, value: 25, step: 5 }
        ],
        renderChart: function() {
            const vol = parseFloat(document.getElementById('mod8-vol')?.value || 25) / 100;
            const spot = 100;
            const t = 30 / 365;
            const r = 0.04;
            const strikes = [];
            const callDeltas = [];
            const putDeltas = [];

            for (let k = 70; k <= 130; k += 2) {
                strikes.push('$' + k);
                const d1 = (Math.log(spot / k) + (r + 0.5 * vol * vol) * t) / (vol * Math.sqrt(t));
                const deltaCall = normCdf(d1);
                const deltaPut = deltaCall - 1;
                callDeltas.push(parseFloat(deltaCall.toFixed(3)));
                putDeltas.push(parseFloat(deltaPut.toFixed(3)));
            }

            const ctx = document.getElementById('mainChart').getContext('2d');
            destroyCurrentChart();
            applyChartDefaults();

            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: strikes,
                    datasets: [
                        {
                            label: 'Delta Call (Δ)',
                            data: callDeltas,
                            borderColor: '#10b981',
                            borderWidth: 2,
                            tension: 0.3
                        },
                        {
                            label: 'Delta Put (Δ)',
                            data: putDeltas,
                            borderColor: '#ef4444',
                            borderWidth: 2,
                            tension: 0.3
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { grid: { display: false } },
                        y: { min: -1.05, max: 1.05, grid: { color: 'rgba(148, 163, 184, 0.1)' } }
                    }
                }
            });
            setCurrentChart(chart);
        }
    },

    // Módulo 9: Gamma: Aceleración y Convexidad (Olmstead Cap. 4)
    {
        id: 9,
        category: "Las Griegas y Modelado Cuantitativo",
        title: "9. Gamma: Aceleración y Convexidad (Γ)",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Gamma ($\\Gamma$): La Aceleración y Riesgo del Dealer</h2>
            <p class="text-slate-300 mb-3">Si Delta es la velocidad, Gamma es la aceleración: $\\Gamma = \\frac{\\partial^2 V}{\\partial S^2} = \\frac{\\partial \\Delta}{\\partial S}$. Mide cuánto variará el Delta de una opción por cada dólar que se mueva el activo subyacente.</p>

            <h3 class="text-lg font-semibold text-white mb-2">Comportamiento Cuantitativo de Gamma:</h3>
            <ul class="list-disc pl-5 text-slate-300 space-y-2 mb-4">
                <li><strong class="text-amber-400">Siempre Positivo para Compradores:</strong> Comprar opciones (Calls o Puts) otorga Gamma positivo (convexidad favorable: ganas más a medida que te mueves en la dirección correcta).</li>
                <li><strong class="text-red-400">Peligro Mortal para Vendedores:</strong> Quien vende opciones desnudas tiene Gamma negativo severo. Una sacudida violenta del mercado dispara el Delta en su contra exponencialmente.</li>
                <li><strong class="text-blue-400">Pico Crítico en ATM y Expiración Cercana:</strong> A medida que el tiempo a expiración ($DTE \\to 0$) disminuye, el Gamma de las opciones ATM se dispara hacia el infinito, convirtiéndose en una función Delta de Dirac.</li>
            </ul>

            <div class="bg-slate-900 p-4 rounded border-l-4 border-amber-500 text-sm text-slate-300">
                <strong class="text-amber-400">El Riesgo 0DTE:</strong> El auge de las opciones de 0 días a expiración ha convertido al Gamma en el principal motor de liquidez y volatilidad intradiaria en el S&P 500.
            </div>
        `,
        chartTitle: "Distribución de Gamma ($\\Gamma$) vs. Tiempo a Expiración (DTE)",
        chartDesc: "Compara cómo Gamma se concentra violentamente en el strike ATM a 3 DTE frente a la dispersión amplia a 45 DTE.",
        controls: [
            { id: "mod9-dte", label: "Días hasta Expiración (DTE)", type: "range", min: 2, max: 60, value: 15, step: 1 }
        ],
        renderChart: function() {
            const dte = parseFloat(document.getElementById('mod9-dte')?.value || 15);
            const spot = 100;
            const vol = 0.25;
            const t = Math.max(1, dte) / 365;
            const r = 0.04;
            const strikes = [];
            const gammas = [];

            for (let k = 80; k <= 120; k += 1) {
                strikes.push('$' + k);
                const d1 = (Math.log(spot / k) + (r + 0.5 * vol * vol) * t) / (vol * Math.sqrt(t));
                const gamma = normPdf(d1) / (spot * vol * Math.sqrt(t));
                gammas.push(parseFloat(gamma.toFixed(4)));
            }

            const ctx = document.getElementById('mainChart').getContext('2d');
            destroyCurrentChart();
            applyChartDefaults();

            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: strikes,
                    datasets: [{
                        label: `Gamma ($\\Gamma$) a ${dte} DTE`,
                        data: gammas,
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.2)',
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { grid: { display: false } },
                        y: { grid: { color: 'rgba(148, 163, 184, 0.1)' } }
                    }
                }
            });
            setCurrentChart(chart);
        }
    },

    // Módulo 10: Theta: El Decaimiento del Tiempo (Olmstead Cap. 4)
    {
        id: 10,
        category: "Las Griegas y Modelado Cuantitativo",
        title: "10. Theta: El Decaimiento del Tiempo (Θ)",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Theta ($\\Theta$): El Costo del Tiempo y el Edge del Vendedor</h2>
            <p class="text-slate-300 mb-3">Theta mide la pérdida de valor que sufre una opción por el simple transcurso de un día en el calendario: $\\Theta = \\frac{\\partial V}{\\partial t}$.</p>

            <h3 class="text-lg font-semibold text-white mb-2">Las Tres Leyes de Theta según Olmstead:</h3>
            <ul class="list-disc pl-5 text-slate-300 space-y-2 mb-4">
                <li><strong class="text-red-400">1. Asimetría Comprador/Vendedor:</strong> El comprador de opciones tiene Theta negativo (paga un alquiler diario al mercado). El vendedor de opciones tiene Theta positivo (cobra ese alquiler).</li>
                <li><strong class="text-yellow-400">2. El 'Cliff' de los 30 Días:</strong> El decaimiento temporal <strong>no es una línea recta</strong>. Se mantiene relativamente plano entre 120 y 60 DTE, pero entre 45 y 0 DTE entra en caída libre vertical.</li>
                <li><strong class="text-green-400">3. Concentración en ATM:</strong> Las opciones ATM sufren la aceleración de Theta más brutal en la recta final hacia el vencimiento.</li>
            </ul>

            <div class="bg-slate-800 p-4 rounded-lg border-l-4 border-yellow-500 text-sm text-slate-300">
                <strong class="text-yellow-400">Estrategia de Ingresos Institucional:</strong> Por esta razón cuantitativa, la inmensa mayoría de vendedores de primas profesionales (Iron Condors, Credit Spreads, Covered Calls) eligen abrir contratos a <strong>30-45 DTE</strong> y recomprarlos a 15-20 DTE para capturar la pendiente más dulce de Theta sin exponerse al riesgo de Gamma final.
            </div>
        `,
        chartTitle: "Curva de Decaimiento del Valor Extrínseco (Theta) de 60 a 0 DTE",
        chartDesc: "Observa la pendiente del valor temporal según el moneyness: la opción ATM colapsa verticalmente al final.",
        controls: [
            { id: "mod10-moneyness", label: "Moneyness (1=ATM, 2=OTM, 3=ITM)", type: "range", min: 1, max: 3, value: 1, step: 1 }
        ],
        renderChart: function() {
            const mode = parseInt(document.getElementById('mod10-moneyness')?.value || 1);
            const dteLabels = [];
            const values = [];

            for (let dte = 60; dte >= 0; dte -= 2) {
                dteLabels.push(dte + 'd');
                let val = 0;
                if (mode === 1) {
                    // ATM: decae con raíz cuadrada del tiempo
                    val = 6.0 * Math.sqrt(dte / 60);
                } else if (mode === 2) {
                    // OTM: decaimiento más lineal y temprano
                    val = 3.5 * Math.pow(dte / 60, 1.3);
                } else {
                    // ITM: decaimiento casi lineal
                    val = 4.0 * (dte / 60);
                }
                values.push(parseFloat(val.toFixed(2)));
            }

            const ctx = document.getElementById('mainChart').getContext('2d');
            destroyCurrentChart();
            applyChartDefaults();

            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dteLabels,
                    datasets: [{
                        label: mode === 1 ? 'ATM (Caída Exponencial Severa)' : (mode === 2 ? 'OTM' : 'ITM'),
                        data: values,
                        borderColor: mode === 1 ? '#ef4444' : '#2C99D6',
                        backgroundColor: mode === 1 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(44, 153, 214, 0.15)',
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { title: { display: true, text: 'Días hasta Expiración (DTE)' } },
                        y: { title: { display: true, text: 'Valor Extrínseco ($)' } }
                    }
                }
            });
            setCurrentChart(chart);
        }
    },

    // Módulo 11: Vega: Volatilidad e IV Crush (Olmstead Cap. 4)
    {
        id: 11,
        category: "Las Griegas y Modelado Cuantitativo",
        title: "11. Vega: Volatilidad e IV Crush (ν)",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Vega ($\\nu$): El Impacto de la Volatilidad Implícita</h2>
            <p class="text-slate-300 mb-3">Vega mide cuánto se encarece o abarata el precio de una opción cuando la <strong>Volatilidad Implícita (IV)</strong> aumenta o disminuye 1 punto porcentual (1%): $\\nu = \\frac{\\partial V}{\\partial \\sigma}$.</p>

            <h3 class="text-lg font-semibold text-white mb-2">Aspectos Esenciales de Vega:</h3>
            <ul class="list-disc pl-5 text-slate-300 space-y-2 mb-4">
                <li><strong class="text-blue-400">Siempre Positivo para Opciones Compradas:</strong> Tanto Calls como Puts comprados ganan valor si la volatilidad implícita se dispara.</li>
                <li><strong class="text-purple-400">Directamente Proporcional al Tiempo:</strong> Cuanto más lejana sea la expiración (como en LEAPS), mayor es el Vega. Las opciones a 1 año son extremadamente sensibles a cambios de volatilidad.</li>
                <li><strong class="text-red-400">El Peligro del 'IV Crush' en Earnings:</strong> Antes de la publicación de resultados de una empresa, la IV se infla artificialmente. Minutos después del reporte, la incertidumbre desaparece, la IV colapsa un 40-70% y las opciones compradas pierden hasta la mitad de su valor aunque la acción se haya movido a favor.</li>
            </ul>
        `,
        chartTitle: "Sensibilidad de Vega ($\\nu$) según el Horizonte Temporal (DTE)",
        chartDesc: "Comprueba cómo las opciones de largo plazo (LEAPS) tienen un Vega masivo, mientras que en 5 DTE es casi nulo.",
        controls: [
            { id: "mod11-strike", label: "Strike Seleccionado ($)", type: "range", min: 80, max: 120, value: 100, step: 5 }
        ],
        renderChart: function() {
            const k = parseFloat(document.getElementById('mod11-strike')?.value || 100);
            const spot = 100;
            const vol = 0.25;
            const r = 0.04;
            const dtePoints = [5, 15, 30, 45, 60, 90, 180, 270, 360];
            const labels = [];
            const vegaData = [];

            dtePoints.forEach(dte => {
                labels.push(dte + ' DTE');
                const t = dte / 365;
                const d1 = (Math.log(spot / k) + (r + 0.5 * vol * vol) * t) / (vol * Math.sqrt(t));
                const vega = (spot * Math.sqrt(t) * normPdf(d1)) / 100; // Dividido por 100 para cambio por 1%
                vegaData.push(parseFloat(vega.toFixed(3)));
            });

            updateChartInstance('line', labels, vegaData, 'Vega (ν) por 1% de IV', '#a855f7', true);
        }
    },

    // Módulo 12: Rho: Tasas de Interés y Carry (Olmstead Cap. 4)
    {
        id: 12,
        category: "Las Griegas y Modelado Cuantitativo",
        title: "12. Rho: Tasas de Interés y Carry (ρ)",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Rho ($\\rho$): El Coste del Dinero en el Tiempo</h2>
            <p class="text-slate-300 mb-3">Rho mide la sensibilidad del precio de la opción ante un cambio del 1% en la <strong>Tasa de Interés Libre de Riesgo</strong> ($r$): $\\rho = \\frac{\\partial V}{\\partial r}$.</p>

            <h3 class="text-lg font-semibold text-white mb-2">Comportamiento Asimétrico:</h3>
            <ul class="list-disc pl-5 text-slate-300 space-y-2 mb-4">
                <li><strong class="text-green-400">Rho Positivo en CALLS:</strong> Si las tasas suben, las Calls se encarecen. Comprar un Call en vez de 100 acciones te permite dejar el 90% de tu dinero en bonos del tesoro generando rendimientos del 5% (Carry favorable).</li>
                <li><strong class="text-red-400">Rho Negativo en PUTS:</strong> Si las tasas suben, las Puts pierden valor. Vender en corto acciones te permite cobrar intereses por el efectivo generado; comprar un Put posterga ese cobro.</li>
            </ul>

            <div class="bg-slate-900 p-4 rounded border-l-4 border-indigo-500 text-sm text-slate-300">
                <strong class="text-indigo-400">Relevancia en LEAPS:</strong> Mientras que en opciones a 30 días Rho es casi despreciable, en contratos LEAPS a 2 años con tasas de interés al 5%, Rho representa una parte sustancial de la prima del contrato.
            </div>
        `,
        chartTitle: "Curvas de Rho: Calls (+) vs. Puts (-) a lo largo del tiempo",
        chartDesc: "Compara cómo la sensibilidad a las tasas de interés se magnifica a medida que aumenta la duración del contrato.",
        controls: [
            { id: "mod12-rate", label: "Tasa Libre de Riesgo (r %)", type: "range", min: 1, max: 8, value: 5, step: 0.5 }
        ],
        renderChart: function() {
            const r = parseFloat(document.getElementById('mod12-rate')?.value || 5) / 100;
            const spot = 100;
            const k = 100;
            const vol = 0.25;
            const dtePoints = [15, 30, 60, 90, 180, 270, 360, 540, 720];
            const labels = [];
            const callRho = [];
            const putRho = [];

            dtePoints.forEach(dte => {
                labels.push(dte + ' DTE');
                const t = dte / 365;
                const d1 = (Math.log(spot / k) + (r + 0.5 * vol * vol) * t) / (vol * Math.sqrt(t));
                const d2 = d1 - vol * Math.sqrt(t);
                
                const rhoC = (k * t * Math.exp(-r * t) * normCdf(d2)) / 100;
                const rhoP = (-k * t * Math.exp(-r * t) * normCdf(-d2)) / 100;
                callRho.push(parseFloat(rhoC.toFixed(3)));
                putRho.push(parseFloat(rhoP.toFixed(3)));
            });

            const ctx = document.getElementById('mainChart').getContext('2d');
            destroyCurrentChart();
            applyChartDefaults();

            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Rho Call (+)',
                            data: callRho,
                            borderColor: '#2C99D6',
                            borderWidth: 2,
                            tension: 0.2
                        },
                        {
                            label: 'Rho Put (-)',
                            data: putRho,
                            borderColor: '#ec4899',
                            borderWidth: 2,
                            tension: 0.2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { grid: { display: false } },
                        y: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, title: { display: true, text: 'Sensibilidad por 1% de Tasa' } }
                    }
                }
            });
            setCurrentChart(chart);
        }
    },

    // Módulo 13: Griegas de 2º Orden: Vanna, Charm y Volga
    {
        id: 13,
        category: "Las Griegas y Modelado Cuantitativo",
        title: "13. Griegas de 2º Orden: Vanna, Charm y Volga",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Modelado Cuantitativo Avanzado: Griegas de Orden Superior</h2>
            <p class="text-slate-300 mb-3">En el trading cuantitativo y los escritorios de derivados de Wall Street, las griegas de primer orden no son suficientes. Los Market Makers monitorean las <strong>derivadas cruzadas</strong> para gestionar riesgos no lineales.</p>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div class="bg-slate-800/80 p-3 rounded border border-slate-700">
                    <strong class="text-cyan-400">VANNA ($\\frac{\\partial \\Delta}{\\partial \\sigma}$):</strong>
                    <p class="text-slate-300 text-xs mt-1">Mide el cambio de Delta ante cambios en Volatilidad. Es el motor detrás de los <em>Vanna Rallies</em>: cuando la IV colapsa tras un evento, los dealers deben recomprar futuros masivamente.</p>
                </div>
                <div class="bg-slate-800/80 p-3 rounded border border-slate-700">
                    <strong class="text-fuchsia-400">CHARM ($\\frac{\\partial \\Delta}{\\partial t}$):</strong>
                    <p class="text-slate-300 text-xs mt-1">Conocido como 'Delta Decay'. Mide cómo cambia el Delta a medida que corre el reloj hacia el fin de semana o vencimiento, forzando flujos pasivos de rebalanceo.</p>
                </div>
                <div class="bg-slate-800/80 p-3 rounded border border-slate-700">
                    <strong class="text-emerald-400">VOLGA ($\\frac{\\partial^2 V}{\\partial \\sigma^2}$):</strong>
                    <p class="text-slate-300 text-xs mt-1">La convexidad de Vega. Mide qué tan rápido se infla el valor de las opciones lejanas OTM cuando ocurre un shock de pánico en la volatilidad.</p>
                </div>
            </div>
        `,
        chartTitle: "Perfil de Vanna ($\\partial \\Delta / \\partial \\sigma$) a lo Largo de los Strikes",
        chartDesc: "Comprueba cómo Vanna cambia de signo entre strikes OTM y ITM, generando flujos de cobertura automáticos para los creadores de mercado.",
        controls: [
            { id: "mod13-spot", label: "Precio Spot ($)", type: "range", min: 80, max: 120, value: 100, step: 2 }
        ],
        renderChart: function() {
            const spot = parseFloat(document.getElementById('mod13-spot')?.value || 100);
            const vol = 0.25;
            const t = 30 / 365;
            const r = 0.04;
            const strikes = [];
            const vannaData = [];

            for (let k = 80; k <= 120; k += 2) {
                strikes.push('$' + k);
                const d1 = (Math.log(spot / k) + (r + 0.5 * vol * vol) * t) / (vol * Math.sqrt(t));
                const d2 = d1 - vol * Math.sqrt(t);
                // Vanna = - normPdf(d1) * d2 / vol
                const vanna = (-normPdf(d1) * d2) / vol;
                vannaData.push(parseFloat(vanna.toFixed(3)));
            }

            updateChartInstance('line', strikes, vannaData, 'Exposición de Vanna', '#06b6d4', true);
        }
    },

    // Módulo 14: Volatilidad Implícita (IV) y Modelo Black-Scholes (Olmstead Cap. 29)
    {
        id: 14,
        category: "Las Griegas y Modelado Cuantitativo",
        title: "14. Volatilidad Implícita (IV) y Black-Scholes",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">La Ecuación de Black-Scholes-Merton (1973)</h2>
            <p class="text-slate-300 mb-3">En el Capítulo 29, Olmstead explica cómo el modelo ganador del Premio Nobel resolvió el enigma del precio justo de una opción resolviendo la ecuación en derivadas parciales del portafolio replicante:</p>

            <div class="bg-slate-900 p-3 rounded font-mono text-center text-sm text-cyan-300 border border-slate-800 mb-4">
                C = S \\cdot N(d_1) - K e^{-rT} N(d_2)
            </div>

            <h3 class="text-lg font-semibold text-white mb-2">IV vs. HV (Volatilidad Implícita vs. Histórica):</h3>
            <ul class="list-disc pl-5 text-slate-300 space-y-2 mb-4">
                <li><strong class="text-blue-400">Volatilidad Histórica (HV):</strong> Mide cuánto se ha movido realmente la acción en el pasado (retrovisor).</li>
                <li><strong class="text-yellow-400">Volatilidad Implícita (IV):</strong> Es el único parámetro no observable en la fórmula. Representa la expectativa de consenso del mercado hacia el futuro. Se despeja numéricamente invirtiendo Black-Scholes con el precio de cotización real.</li>
            </ul>

            <div class="bg-slate-800 p-4 rounded border-l-4 border-cyan-500 text-sm text-slate-300">
                <strong class="text-cyan-400">El Edge Cuantitativo:</strong> Cuando la IV cotiza con una prima extrema respecto a la HV realizada (IV > HV), los vendedores sistemáticos de opciones explotan la prima de riesgo de volatilidad (VRP).
            </div>
        `,
        chartTitle: "Precio Teórico Black-Scholes (Call) vs. Spot y Volatilidad",
        chartDesc: "Observa cómo la prima teórica calculada por Black-Scholes se incrementa en todos los strikes al subir la volatilidad.",
        controls: [
            { id: "mod14-iv", label: "Volatilidad Implícita (IV %)", type: "range", min: 10, max: 70, value: 30, step: 5 }
        ],
        renderChart: function() {
            const vol = parseFloat(document.getElementById('mod14-iv')?.value || 30) / 100;
            const k = 100;
            const t = 45 / 365;
            const r = 0.04;
            const spots = [];
            const prices = [];

            for (let s = 80; s <= 125; s += 2.5) {
                spots.push('$' + s.toFixed(1));
                const d1 = (Math.log(s / k) + (r + 0.5 * vol * vol) * t) / (vol * Math.sqrt(t));
                const d2 = d1 - vol * Math.sqrt(t);
                const callPrice = s * normCdf(d1) - k * Math.exp(-r * t) * normCdf(d2);
                prices.push(parseFloat(callPrice.toFixed(2)));
            }

            updateChartInstance('line', spots, prices, 'Precio Teórico Call ($)', '#06b6d4', true);
        }
    },

    // Módulo 15: Paridad Put-Call y Arbitraje Sintético (Olmstead Cap. 30)
    {
        id: 15,
        category: "Las Griegas y Modelado Cuantitativo",
        title: "15. Paridad Put-Call y Arbitraje Sintético",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">La Ley de la Paridad Put-Call y Arbitraje de Conversión</h2>
            <p class="text-slate-300 mb-3">En el Capítulo 30, Olmstead presenta la relación de arbitraje estricta que conecta los precios de Calls, Puts y la Acción subyacente para el mismo strike y fecha:</p>

            <div class="bg-slate-900 p-3 rounded font-mono text-center text-sm text-green-300 border border-slate-800 mb-4">
                C - P = S - K \\cdot e^{-rT}
            </div>

            <h3 class="text-lg font-semibold text-white mb-2">Relaciones Sintéticas Fundamentales:</h3>
            <ul class="list-disc pl-5 text-slate-300 space-y-2 mb-4">
                <li><strong class="text-green-400">Acción Sintética Larga:</strong> Comprar Call + Vender Put del mismo strike = Comprar 100 acciones a una fracción del costo de capital.</li>
                <li><strong class="text-purple-400">Conversión (Conversion):</strong> Comprar Acción + Comprar Put + Vender Call = Captura de rendimiento de tasa de interés garantizada sin riesgo direccional.</li>
                <li><strong class="text-red-400">Reversión (Reversal):</strong> Si las Puts cotizan desfasadas respecto a las Calls, los algoritmos institucionales ejecutan reversiones instantáneas restableciendo el equilibrio.</li>
            </ul>
        `,
        chartTitle: "Verificación de Paridad Put-Call: Curva Teórica vs. Desviaciones de Mercado",
        chartDesc: "Cualquier divergencia entre (C - P) y (S - K*e^-rT) genera una ventana instantánea de arbitraje libre de riesgo.",
        controls: [
            { id: "mod15-rate", label: "Tasa de Interés Libre de Riesgo (%)", type: "range", min: 1, max: 8, value: 4, step: 0.5 }
        ],
        renderChart: function() {
            const r = parseFloat(document.getElementById('mod15-rate')?.value || 4) / 100;
            const k = 100;
            const t = 60 / 365;
            const spots = [];
            const theoretical = [];
            const synthetic = [];

            for (let s = 85; s <= 115; s += 2) {
                spots.push('$' + s);
                const discountK = k * Math.exp(-r * t);
                const parityVal = s - discountK;
                theoretical.push(parseFloat(parityVal.toFixed(2)));
                // Sintético con ligeras micro-fluctuaciones de mercado
                synthetic.push(parseFloat((parityVal + 0.05 * Math.sin(s)).toFixed(2)));
            }

            const ctx = document.getElementById('mainChart').getContext('2d');
            destroyCurrentChart();
            applyChartDefaults();

            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: spots,
                    datasets: [
                        {
                            label: 'Línea de Paridad (S - K*e^-rT)',
                            data: theoretical,
                            borderColor: '#10b981',
                            borderWidth: 2
                        },
                        {
                            label: 'Diferencial de Mercado (Call - Put)',
                            data: synthetic,
                            borderColor: '#2C99D6',
                            borderDash: [4, 4],
                            borderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { grid: { display: false } },
                        y: { grid: { color: 'rgba(148, 163, 184, 0.1)' } }
                    }
                }
            });
            setCurrentChart(chart);
        }
    },

    // Módulo 16: Carteras Delta-Neutral y Rebalanceo Dinámico (Olmstead Cap. 27)
    {
        id: 16,
        category: "Las Griegas y Modelado Cuantitativo",
        title: "16. Carteras Delta-Neutral y Gamma Scalping",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Delta-Neutral Hedging y Extracción de Ganancias de la Volatilidad</h2>
            <p class="text-slate-300 mb-3">En el Capítulo 27, Olmstead explica cómo los fondos cuantitativos y market makers anulan por completo el riesgo direccional combinando opciones y acciones de modo que el <strong>Delta Total de la Cartera sea Cero ($\\Delta_{net} = 0$)</strong>.</p>

            <h3 class="text-lg font-semibold text-white mb-2">Mecánica del Rebalanceo Dinámico (Gamma Scalping):</h3>
            <ul class="list-disc pl-5 text-slate-300 space-y-2 mb-4">
                <li>Si compras un Straddle (Largo Gamma), comienzas con $\\Delta = 0$.</li>
                <li>Si el precio de la acción sube, el Gamma convierte tu Delta en positivo (+$\\Delta$). Para neutralizarlo, <strong>vendes acciones en máximos</strong>.</li>
                <li>Si la acción retrocede, el Delta se vuelve negativo (-$\\Delta$). Para neutralizarlo, <strong>compras acciones en mínimos</strong>.</li>
                <li>Este proceso sistemático compra bajo y vende alto continuamente, monetizando las oscilaciones del mercado sin predecir la dirección.</li>
            </ul>
        `,
        chartTitle: "Simulación de Gamma Scalping: P&L Dinámico Neutral vs. Exposición No Coberta",
        chartDesc: "Comprueba cómo el rebalanceo Delta-Neutral monetiza la volatilidad oscilante protegiendo el capital de caídas unilaterales.",
        controls: [
            { id: "mod16-vol", label: "Magnitud de Oscilación ($)", type: "range", min: 2, max: 15, value: 8, step: 1 }
        ],
        renderChart: function() {
            const swing = parseFloat(document.getElementById('mod16-vol')?.value || 8);
            const days = ['Día 1', 'Día 2', 'Día 3', 'Día 4', 'Día 5', 'Día 6', 'Día 7', 'Día 8'];
            const unhedged = [0, swing * 12, -swing * 8, swing * 15, -swing * 14, swing * 10, -swing * 12, swing * 5];
            const hedged = [0, 80, 150, 240, 310, 420, 510, 620]; // P&L acumulado positivo por arbitraje de oscilaciones

            const ctx = document.getElementById('mainChart').getContext('2d');
            destroyCurrentChart();
            applyChartDefaults();

            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: days,
                    datasets: [
                        {
                            label: 'Estrategia Delta-Neutral (Gamma Scalping)',
                            data: hedged,
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            fill: true,
                            borderWidth: 2
                        },
                        {
                            label: 'Posición No Coberturada (Volatilidad Direccional)',
                            data: unhedged,
                            borderColor: '#ef4444',
                            borderWidth: 2,
                            borderDash: [4, 4]
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { grid: { display: false } },
                        y: { grid: { color: 'rgba(148, 163, 184, 0.1)' } }
                    }
                }
            });
            setCurrentChart(chart);
        }
    },

    // =========================================================================
    // CATEGORÍA 3: ESTRUCTURA DE MERCADO Y GEX
    // =========================================================================

    // Módulo 17: El Edge: Niveles Gamma (GEX) Institucionales
    {
        id: 17,
        category: "Estructura de Mercado y GEX",
        title: "17. El Edge: Niveles Gamma (GEX)",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Microestructura Cuantitativa: Gamma Exposure (GEX)</h2>
            <p class="text-slate-300 mb-3">El <strong>Gamma Exposure (GEX)</strong> modela matemáticamente cómo los creadores de mercado (Market Makers) deben cubrirse (Dynamic Hedging) ante el movimiento del precio.</p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div class="bg-slate-800/80 p-4 rounded-lg border-l-4 border-green-500">
                    <h3 class="text-green-400 font-bold mb-1">GEX Positivo (+Gamma)</h3>
                    <p class="text-slate-300 text-sm">Los dealers están <strong>largos en gamma</strong>. Para cubrirse, compran cuando el precio cae y venden cuando sube. <strong>Actúan como amortiguador y freno de la volatilidad</strong>, propiciando reversión a la media.</p>
                </div>
                <div class="bg-slate-800/80 p-4 rounded-lg border-l-4 border-red-500">
                    <h3 class="text-red-400 font-bold mb-1">GEX Negativo (-Gamma)</h3>
                    <p class="text-slate-300 text-sm">Los dealers están <strong>cortos en gamma</strong>. Deben vender a la baja y comprar al alza. <strong>Actúan como un acelerador y amplificador de volatilidad</strong>, generando cascadas direccionales de momentum.</p>
                </div>
            </div>
        `,
        chartTitle: "Exposición GEX Teórica por Strike ($ Millones)",
        chartDesc: "Compara los niveles donde predomina el Gamma de Calls (verde / soporte de baja vol) vs. Gamma de Puts (rojo / riesgo de expansión).",
        controls: [
            { id: "mod17-spot", label: "Precio Spot Subyacente ($)", type: "range", min: 480, max: 520, value: 500, step: 2 }
        ],
        renderChart: function() {
            const spot = parseFloat(document.getElementById('mod17-spot')?.value || 500);
            const strikes = [];
            const gexValues = [];

            for (let k = 470; k <= 530; k += 5) {
                strikes.push('$' + k);
                // GEX positivo arriba del spot (Calls) y negativo abajo (Puts)
                const dist = (k - spot) / 10;
                const gex = dist * Math.exp(-0.5 * dist * dist) * 250;
                gexValues.push(parseFloat(gex.toFixed(1)));
            }

            updateChartInstance('bar', strikes, gexValues, 'Net GEX ($M)', (ctx) => {
                const val = ctx.raw !== undefined ? ctx.raw : (ctx.p1 ? ctx.p1.parsed.y : 0);
                return val >= 0 ? '#10b981' : '#ef4444';
            }, false);
        }
    },

    // Módulo 18: Volatility Skew y Smirk Estructural
    {
        id: 18,
        category: "Estructura de Mercado y GEX",
        title: "18. Volatility Skew y Smirk Estructural",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">La Asimetría Estructural: El Crash de 1987 y el Skew</h2>
            <p class="text-slate-300 mb-3">Antes del colapso del 'Black Monday' en octubre de 1987, Black-Scholes asumía que la volatilidad era idéntica para todos los strikes (una línea plana). Desde entonces, el mercado institucional paga una <strong>prima permanente por protección ante caídas</strong>, creando el <strong>Volatility Skew</strong> (o sesgo hacia Puts).</p>

            <h3 class="text-lg font-semibold text-white mb-2">Lectura del Skew para Traders Cuantitativos:</h3>
            <ul class="list-disc pl-5 text-slate-300 space-y-2 mb-4">
                <li><strong class="text-red-400">Puts OTM con IV Alta:</strong> Muestra la demanda implacable de coberturas por parte de fondos de pensiones y endowments.</li>
                <li><strong class="text-green-400">Calls OTM con IV Baja:</strong> El mercado castiga la prima de los calls lejanos porque los fondos suelen vender calls cubiertas de forma masiva.</li>
                <li><strong class="text-yellow-400">Inversión del Skew:</strong> En rallies parabólicos especulativos (como acciones meme o semiconductores), el skew se invierte bruscamente hacia los Calls (Call Skew).</li>
            </ul>
        `,
        chartTitle: "Curva del Volatility Skew: Sonrisa Asimétrica por Strike",
        chartDesc: "Observa cómo la volatilidad implícita se dispara en strikes OTM a la baja (Puts protectores).",
        controls: [
            { id: "mod18-fear", label: "Demanda Institucional de Puts (%)", type: "range", min: 10, max: 80, value: 40, step: 5 }
        ],
        renderChart: function() {
            const fear = parseFloat(document.getElementById('mod18-fear')?.value || 40) / 100;
            const strikes = [];
            const ivValues = [];
            const baseIv = 20;

            for (let k = 80; k <= 120; k += 2) {
                strikes.push('$' + k);
                const moneyness = (100 - k) / 10;
                // Skew asimétrico pronunciado en Puts
                const iv = baseIv + (moneyness > 0 ? moneyness * (8 * fear + 2) : moneyness * 1.5) + (moneyness * moneyness * 0.4);
                ivValues.push(parseFloat(Math.max(10, iv).toFixed(2)));
            }

            updateChartInstance('line', strikes, ivValues, 'Volatilidad Implícita (IV %)', '#ec4899', true);
        }
    },

    // Módulo 19: Net Gamma Multi-Expiración
    {
        id: 19,
        category: "Estructura de Mercado y GEX",
        title: "19. Net Gamma Multi-Expiración",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">La Geografía del Mercado: Call Wall, Put Wall y Gamma Flip</h2>
            <p class="text-slate-300 mb-3">El perfil de <strong>Net Gamma Multi-Expiración</strong> sintetiza todos los vencimientos abiertos para identificar los muros de liquidez institucionales que rigen la acción del precio.</p>

            <div class="space-y-3 mb-4">
                <div class="bg-slate-800/80 p-3 rounded border border-slate-700">
                    <strong class="text-green-400">1. Call Wall (Resistencia Primaria):</strong>
                    <p class="text-slate-300 text-sm mt-1">El strike con el mayor Gamma positivo acumulado de Calls. Actúa como un techo casi infranqueable; al acercarse el precio, las ventas de cobertura de los dealers frenan el avance.</p>
                </div>
                <div class="bg-slate-800/80 p-3 rounded border border-slate-700">
                    <strong class="text-red-400">2. Put Wall (Soporte Primario):</strong>
                    <p class="text-slate-300 text-sm mt-1">El strike con el mayor Gamma negativo acumulado de Puts. Funciona como suelo mayor del mercado.</p>
                </div>
                <div class="bg-slate-800/80 p-3 rounded border border-slate-700">
                    <strong class="text-yellow-400">3. Gamma Flip Point (La Frontera Crítica):</strong>
                    <p class="text-slate-300 text-sm mt-1">El nivel de precio donde el Net GEX total cruza de positivo a negativo. Por encima es un régimen de baja volatilidad y reversión; por debajo es caída acelerada y volatilidad violenta.</p>
                </div>
            </div>
        `,
        chartTitle: "Simulador de Régimen: Spot vs. Gamma Flip",
        chartDesc: "Mueve el precio Spot a través del Gamma Flip y observa cómo cambia el régimen de cobertura del mercado en tiempo real.",
        controls: [
            { id: "mod19-spot", label: "Precio Spot ($)", type: "range", min: 480, max: 520, value: 504, step: 1 }
        ],
        renderChart: function() {
            const spot = parseFloat(document.getElementById('mod19-spot')?.value || 504);
            const flipPoint = 500;
            const isPositiveRegime = spot >= flipPoint;

            const strikes = ['480 (Put Wall)', '485', '490', '495', '500 (Flip)', '505', '510', '515 (Call Wall)', '520'];
            const gexBars = [-850, -420, -280, -110, 0, 310, 520, 940, 260];

            const ctx = document.getElementById('mainChart').getContext('2d');
            destroyCurrentChart();
            applyChartDefaults();

            const chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: strikes,
                    datasets: [{
                        label: `Net GEX por Strike — Régimen Actual: ${isPositiveRegime ? '🟢 GAMMA POSITIVA (Baja Vol)' : '🔴 GAMMA NEGATIVA (Alta Vol)'}`,
                        data: gexBars,
                        backgroundColor: gexBars.map(val => val >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)'),
                        borderColor: gexBars.map(val => val >= 0 ? '#10b981' : '#ef4444'),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { grid: { display: false } },
                        y: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, title: { display: true, text: 'Net Gamma ($ Millones)' } }
                    }
                }
            });
            setCurrentChart(chart);
        }
    },    // Módulo 20: Net Open Interest Multi-Expiración (Guía Completa y Terminal Terminal Cuantitativa)
    {
        id: 20,
        category: "Estructura de Mercado y GEX",
        title: "20. Net Open Interest Multi-Expiración",
        theory: `
            <div class="border-b border-slate-700 pb-3 mb-4">
                <span class="text-xs font-bold text-cyan-400 uppercase tracking-wider">Estructura de Mercado Institucional</span>
                <h2 class="text-2xl font-extrabold text-white mt-1">Net Open Interest Multi-Expiración: Guía Completa</h2>
                <p class="text-sm text-slate-400 mt-1">El mapa definitivo de posiciones acumuladas vivas a través de todos los vencimientos.</p>
            </div>

            <!-- Sección 1: ¿Qué es el Open Interest? -->
            <div class="mb-5">
                <h3 class="text-lg font-bold text-blue-400 mb-2">1. ¿Qué es el Open Interest (OI)?</h3>
                <p class="text-slate-300 text-sm leading-relaxed mb-3">
                    El <strong>Open Interest</strong> es el número total de contratos de opciones que están <strong>abiertos y vigentes</strong> en un momento dado: contratos que alguien compró y todavía no cerró, ni venció, ni fue ejercido.
                </p>
                <div class="bg-slate-800/80 p-3 rounded-lg border border-slate-700 text-sm text-slate-300">
                    A diferencia del volumen (que cuenta cuántos contratos se negociaron hoy), el OI cuenta <strong>cuántos contratos siguen vivos</strong>. Es una foto de la <strong>posición acumulada del mercado</strong>, no del ruido transaccional del día.
                </div>
            </div>

            <!-- Sección 2: ¿Por qué Multi-Expiración? -->
            <div class="mb-5">
                <h3 class="text-lg font-bold text-blue-400 mb-2">2. ¿Por qué "Multi-Expiración"?</h3>
                <p class="text-slate-300 text-sm leading-relaxed mb-3">
                    El gráfico suma el OI de <strong>todas las expiraciones activas</strong> (semanales, mensuales, trimestrales y LEAPS) por cada strike. Esto te da la imagen completa de dónde está concentrado el interés del mercado en términos estructurales, no solo para el vencimiento más cercano.
                </p>
                <div class="overflow-x-auto mb-3">
                    <table class="w-full text-xs text-left text-slate-300 border border-slate-700 rounded-lg overflow-hidden">
                        <thead class="bg-slate-800 text-slate-200">
                            <tr>
                                <th class="p-2 border-b border-slate-700">Dimensión</th>
                                <th class="p-2 border-b border-slate-700 text-amber-400">OI de una Sola Expiración</th>
                                <th class="p-2 border-b border-slate-700 text-cyan-400">OI Multi-Expiración</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800 bg-slate-900/60">
                            <tr>
                                <td class="p-2 font-semibold">Visión</td>
                                <td class="p-2">Focalizada en un solo vencimiento</td>
                                <td class="p-2 text-cyan-300 font-semibold">Estructural, todos los vencimientos combinados</td>
                            </tr>
                            <tr>
                                <td class="p-2 font-semibold">Uso</td>
                                <td class="p-2">Análisis de expiración específica (0DTE/semanal)</td>
                                <td class="p-2 text-cyan-300 font-semibold">Niveles clave de mediano y largo plazo</td>
                            </tr>
                            <tr>
                                <td class="p-2 font-semibold">Riesgo</td>
                                <td class="p-2 text-red-400">Pierde contexto del cuadro macro completo</td>
                                <td class="p-2 text-green-400 font-semibold">El más robusto para trading diario y swing</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Sección 3: Anatomía del Gráfico Terminal Cuantitativa -->
            <div class="mb-5">
                <h3 class="text-lg font-bold text-blue-400 mb-2">3. Anatomía del Gráfico</h3>
                <div class="space-y-3">
                    <div class="bg-slate-800/70 p-3 rounded-lg border-l-4 border-cyan-500 text-sm">
                        <h4 class="font-bold text-white mb-1">Las Dos Capas del Chart y el Net OI:</h4>
                        <ul class="text-slate-300 space-y-1 list-disc pl-4 text-xs">
                            <li><strong class="text-emerald-400">Positive Net Open Interest (Barras Verdes):</strong> Strikes donde $OI_{Calls} > OI_{Puts}$. Predominio neto de interés comprador/alcista o cobertura larga.</li>
                            <li><strong class="text-rose-400">Negative Net Open Interest (Barras Rojas / Magenta):</strong> Strikes donde $OI_{Puts} > OI_{Calls}$. Predominio neto de contratos Put (coberturas institucionales bajistas).</li>
                        </ul>
                    </div>
                    <div class="bg-slate-800/70 p-3 rounded-lg border-l-4 border-yellow-500 text-sm">
                        <h4 class="font-bold text-white mb-1">El Spot y el Máximo Dolor (Max Pain):</h4>
                        <p class="text-slate-300 text-xs">
                            <strong>El Spot:</strong> La línea vertical que marca el precio actual. Su posición relativa a las concentraciones de OI es la lectura más importante.<br>
                            <strong>El Max Pain:</strong> Es el precio al que <em>vencen sin valor la mayor cantidad de contratos posible</em> (mínimo desembolso de dealers). Actúa como un potente imán gravitacional hacia el vencimiento, especialmente en las últimas horas del viernes de expiración mensual (OpEx).
                        </p>
                    </div>
                    <div class="bg-slate-800/70 p-3 rounded-lg border-l-4 border-purple-500 text-sm">
                        <h4 class="font-bold text-white mb-1">Los Niveles ITM (In-The-Money 40 / 80):</h4>
                        <p class="text-slate-300 text-xs">
                            Marcan los strikes donde Calls o Puts tienen delta ~0.40 y ~0.80. Indican cuánto se ha desplazado el precio respecto a donde estaba concentrado el OI original. Cuando el precio se adentra profundo en el ITM, los creadores de mercado deben cubrir agresivamente en futuros o acciones al contado.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Sección 4: Cómo leer las concentraciones -->
            <div class="mb-5">
                <h3 class="text-lg font-bold text-blue-400 mb-2">4. Cómo Leer las Concentraciones de OI</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div class="bg-slate-800/90 p-3 rounded border border-slate-700">
                        <span class="text-emerald-400 font-bold text-xs">Calls por Encima del Spot</span>
                        <div class="font-mono text-xs text-slate-300 mt-1">[Spot] &larr;───&rarr; [Call OI Alto]</div>
                        <p class="text-slate-400 text-xs mt-1">Actúa como <strong>resistencia estructural</strong>. Los vendedores de esas calls no quieren que el precio suba más allá; las ventas de cobertura frenan el movimiento.</p>
                    </div>
                    <div class="bg-slate-800/90 p-3 rounded border border-slate-700">
                        <span class="text-rose-400 font-bold text-xs">Puts por Debajo del Spot</span>
                        <div class="font-mono text-xs text-slate-300 mt-1">[Put OI Alto] &larr;───&rarr; [Spot]</div>
                        <p class="text-slate-400 text-xs mt-1">Actúa como <strong>soporte estructural</strong>. Los emisores defienden el nivel con compras de cobertura, complementando el Put Wall del GEX.</p>
                    </div>
                </div>
                <div class="bg-slate-900 p-3 rounded border border-amber-500/40 text-xs text-slate-300">
                    <strong class="text-amber-400">Concentración Bilateral en el Mismo Strike:</strong> Cuando Calls y Puts tienen volumen masivo en el mismo strike, el precio suele <strong>gravitar y quedarse congelado (pinned)</strong> en ese nivel hacia el vencimiento.
                </div>
            </div>

            <!-- Sección 5: Ratio Put/Call y Diferencia OI vs Volumen -->
            <div class="mb-5">
                <h3 class="text-lg font-bold text-blue-400 mb-2">5. Ratio Put/Call y Diferencia Crítica vs. Volumen</h3>
                <div class="bg-slate-800/80 p-3 rounded mb-3 text-xs text-slate-300">
                    <strong>Lectura del Ratio Put/Call de OI:</strong><br>
                    &bull; <strong>Ratio &gt; 1:</strong> Más puts que calls acumulados.<br>
                    &bull; <strong>Ratio &lt; 1:</strong> Predominio de calls abiertas.<br>
                    <span class="text-amber-400 font-semibold">&iexcl;Cuidado!</span> Un ratio alto de puts <strong>no siempre es bajista</strong>. Los grandes fondos compran puts sistemáticamente como póliza de seguro para cubrir carteras multimillonarias de acciones (hedging), no para especular a la baja.
                </div>

                <div class="bg-slate-900 p-3 rounded border border-slate-700 text-xs">
                    <h4 class="text-cyan-400 font-bold mb-1">Regla de Oro: Interacción Volumen vs. Open Interest</h4>
                    <ul class="text-slate-300 space-y-1 list-disc pl-4">
                        <li><strong>Volumen Alto + OI Sube:</strong> Nueva posición institucional abierta con convicción.</li>
                        <li><strong>Volumen Alto + OI Baja:</strong> Posición previa cerrada (liquidación o toma de beneficios).</li>
                        <li><strong>Volumen Alto + OI Sin Cambio:</strong> Rotación pura de manos (alguien entra, otro sale).</li>
                    </ul>
                </div>
            </div>

            <!-- Sección 6: OI Compare y Checklist 30 Segundos -->
            <div class="mb-5">
                <h3 class="text-lg font-bold text-blue-400 mb-2">6. Checklist de Lectura Diaria (30 Segundos)</h3>
                <div class="bg-slate-800/80 p-3 rounded font-mono text-xs text-slate-300 border-l-4 border-emerald-500 space-y-1">
                    <div>1. &iquest;D&oacute;nde est&aacute;n las mayores concentraciones de Calls? &rarr; <strong>Resistencia Estructural</strong></div>
                    <div>2. &iquest;D&oacute;nde est&aacute;n las mayores concentraciones de Puts? &rarr; <strong>Soporte Estructural</strong></div>
                    <div>3. &iquest;D&oacute;nde est&aacute; el Max Pain respecto al Spot? &rarr; <strong>Im&aacute;n gravitacional hacia OpEx</strong></div>
                    <div>4. &iquest;Cu&aacute;l es el ratio Put/Call de OI? &rarr; <strong>Sesgo de cobertura acumulado</strong></div>
                    <div>5. &iquest;Los niveles ITM est&aacute;n profundos? &rarr; <strong>Delta alto y cobertura dealer agresiva</strong></div>
                    <div>6. &iquest;Coinciden las concentraciones con los Walls del GEX? &rarr; <strong>Doble Respaldo Estructural</strong></div>
                </div>
            </div>

            <!-- Sección 7: La Combinación Ganadora OI + GEX -->
            <div class="mb-4">
                <div class="bg-gradient-to-r from-blue-900/40 to-cyan-900/40 p-4 rounded-lg border border-cyan-500/40">
                    <h4 class="text-sm font-bold text-cyan-300 mb-1">&iexcl;La Combinaci&oacute;n Ganadora: OI + GEX!</h4>
                    <p class="text-xs text-slate-300 leading-relaxed">
                        El <strong>GEX (Net Gamma)</strong> mide la presi&oacute;n din&aacute;mica de cobertura intrad&iacute;a de los creadores de mercado. El <strong>OI Multi-Expiraci&oacute;n</strong> mide d&oacute;nde est&aacute; anclado el capital del mercado global.<br>
                        <strong class="text-amber-300">Regla de Oro:</strong> Cuando un nivel de strike coincide como Wall en el GEX <em>Y</em> como pico m&aacute;ximo en el Net OI, ese strike posee un <strong>doble respaldo estructural</strong> casi infranqueable.
                    </p>
                </div>
            </div>
        `,
        chartTitle: "Net Open Interest Multi Expiration (Terminal Terminal Cuantitativa)",
        chartDesc: "Réplica exacta del monitor institucional Terminal Cuantitativa con barras de Net Open Interest (Negativo en magenta/rojo vs Positivo en verde).",
        controls: [
            { id: "mod20-spot", label: "Precio Spot Subyacente ($)", type: "range", min: 660, max: 730, value: 700, step: 2 },
            { id: "mod20-view", label: "Modo Vista (1=Net OI, 2=Calls vs Puts, 3=Compare)", type: "range", min: 1, max: 3, value: 1, step: 1 }
        ],
        renderChart: function() {
            const spot = parseFloat(document.getElementById('mod20-spot')?.value || 700);
            const viewMode = parseInt(document.getElementById('mod20-view')?.value || 1);

            // Strikes mapeados directamente del gráfico Terminal Cuantitativa (626 a 734)
            const strikes = [
                '626', '631', '636', '641', '646', '651', '656', '661', '666',
                '671', '676', '681', '686', '691', '696', '701', '706', '711',
                '716', '721', '726', '731', '734'
            ];

            // Datos de Call OI y Put OI (en miles de contratos) fieles a la terminal Terminal Cuantitativa
            const putOI = [
                12, 138, 52, 186, 90, 322, 65, 132, 50,
                248, 112, 194, 42, 94, 22, 18, 12, 8,
                6, 5, 4, 3, 2
            ];

            const callOI = [
                2, 4, 6, 8, 12, 22, 18, 24, 28,
                38, 42, 55, 48, 52, 35, 62, 98, 72,
                115, 155, 45, 82, 38
            ];

            // Net OI = Call OI - Put OI
            const netOI = callOI.map((c, i) => c - putOI[i]);

            // OI Compare: Cambio simulado respecto a la sesión anterior
            const compareChange = [
                -2, +15, -4, +22, +8, -35, +12, +18, -6,
                +45, -12, +28, +5, -14, +8, +19, +32, -8,
                +41, +58, -10, +24, +6
            ];

            const ctx = document.getElementById('mainChart').getContext('2d');
            destroyCurrentChart();
            applyChartDefaults();

            let datasets = [];

            if (viewMode === 1) {
                // Modo 1: Net Open Interest (como en la captura Terminal Cuantitativa)
                datasets = [{
                    label: 'Net Open Interest (Miles de Contratos)',
                    data: netOI.map(v => Math.abs(v)),
                    backgroundColor: netOI.map(v => v >= 0 ? 'rgba(16, 185, 129, 0.85)' : 'rgba(225, 29, 72, 0.85)'),
                    borderColor: netOI.map(v => v >= 0 ? '#10b981' : '#e11d48'),
                    borderWidth: 1.5
                }];
            } else if (viewMode === 2) {
                // Modo 2: Dos capas superpuestas (Calls vs Puts)
                datasets = [
                    {
                        label: 'Call Open Interest',
                        data: callOI,
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        borderColor: '#10b981',
                        borderWidth: 1
                    },
                    {
                        label: 'Put Open Interest',
                        data: putOI,
                        backgroundColor: 'rgba(225, 29, 72, 0.8)',
                        borderColor: '#e11d48',
                        borderWidth: 1
                    }
                ];
            } else {
                // Modo 3: OI Compare (Cambio Día a Día)
                datasets = [{
                    label: 'OI Compare: Cambio Neto vs. Ayer (Miles de Contratos)',
                    data: compareChange,
                    backgroundColor: compareChange.map(v => v >= 0 ? 'rgba(44, 153, 214, 0.85)' : 'rgba(245, 158, 11, 0.85)'),
                    borderColor: compareChange.map(v => v >= 0 ? '#2C99D6' : '#f59e0b'),
                    borderWidth: 1.5
                }];
            }

            // Calcular métricas cuantitativas en tiempo real
            const totalCalls = callOI.reduce((a, b) => a + b, 0);
            const totalPuts = putOI.reduce((a, b) => a + b, 0);
            const pcRatio = (totalPuts / totalCalls).toFixed(2);
            const maxPainStrike = '696';
            const putWallStrike = '651'; // Máximo Put OI (~322K)
            const callWallStrike = '721'; // Máximo Call OI (~155K)

            // Actualizar descripción dinámica del gráfico
            const descEl = document.getElementById('chart-description');
            if (descEl) {
                descEl.innerHTML = `
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono mt-2 bg-slate-900/90 p-3 rounded-lg border border-slate-700">
                        <div><span class="text-slate-400">Spot Actual:</span> <strong class="text-white">$${spot.toFixed(0)}</strong></div>
                        <div><span class="text-slate-400">Ratio Put/Call:</span> <strong class="text-amber-400">${pcRatio} (Hedging)</strong></div>
                        <div><span class="text-slate-400">Put Wall OI:</span> <strong class="text-rose-400">Strike $${putWallStrike} (322K)</strong></div>
                        <div><span class="text-slate-400">Call Wall OI:</span> <strong class="text-emerald-400">Strike $${callWallStrike} (155K)</strong></div>
                        <div class="col-span-2 md:col-span-4 text-slate-300 mt-1 border-t border-slate-800 pt-1">
                            🎯 <strong>Max Pain Estructural:</strong> Strike <span class="text-yellow-400 font-bold">$${maxPainStrike}</span> | 
                            ${spot < 700 ? '<span class="text-rose-400 font-semibold">⚠️ Spot bajo zona de Puts masivos (651-681): Fuerte gravedad alcista de reversión hacia Max Pain.</span>' : '<span class="text-emerald-400 font-semibold">✅ Spot sobre zona neutral: Desaceleración en resistencia Call Wall $721.</span>'}
                        </div>
                    </div>
                `;
            }

            const chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: strikes,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: { color: '#94a3b8', font: { size: 10 } }
                        },
                        y: {
                            grid: { color: 'rgba(148, 163, 184, 0.1)' },
                            title: { display: true, text: viewMode === 3 ? 'Variación de Contratos (Miles)' : 'Contratos (Miles)', color: '#94a3b8' },
                            ticks: { color: '#94a3b8' }
                        }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'bottom',
                            labels: {
                                color: '#cbd5e1',
                                boxWidth: 12,
                                font: { size: 11 }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const rawVal = context.raw;
                                    const strikeIdx = context.dataIndex;
                                    const net = netOI[strikeIdx];
                                    if (viewMode === 1) {
                                        return `${net >= 0 ? '🟢 Positive Net OI' : '🔴 Negative Net OI'}: ${rawVal}K contratos (${net >= 0 ? 'Calls Dominan' : 'Puts Dominan'})`;
                                    }
                                    return `${context.dataset.label}: ${rawVal}K contratos`;
                                }
                            }
                        }
                    }
                }
            });
            setCurrentChart(chart);
        }
    },

    // Módulo 21: Teoría del Máximo Dolor (Max Pain Theory & Strike Pinning) (Olmstead Cap. 28)
    {
        id: 21,
        category: "Estructura de Mercado y GEX",
        title: "21. Teoría del Máximo Dolor (Max Pain)",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">La Teoría del Máximo Dolor y 'Strike Pinning'</h2>
            <p class="text-slate-300 mb-3">En el Capítulo 28, Olmstead explora la célebre <strong>Teoría del Máximo Dolor (Max Pain Theory)</strong>: la observación empírica de que, a medida que se acerca la expiración de opciones, el precio de una acción tiende a gravitar hacia el strike exacto donde el valor total combinado en dólares de todas las opciones compradas (Calls + Puts) expira con el <strong>mínimo valor intrínseco posible</strong>.</p>

            <h3 class="text-lg font-semibold text-white mb-2">Por qué Funciona:</h3>
            <p class="text-slate-300 text-sm mb-3">Los emisores institucionales y creadores de mercado han vendido esas opciones. El strike de 'Max Pain' es aquel donde los compradores particulares sufren la máxima pérdida financiera combinada, maximizando las ganancias de los vendedores de primas.</p>

            <div class="bg-slate-900 p-4 rounded border-l-4 border-yellow-500 text-sm text-slate-300">
                <strong class="text-yellow-400">Efecto 'Pinning':</strong> En viernes de expiración mensual (OpEx), acciones con alto volumen suelen quedar 'clavadas' en números redondos (como $150 o $200) debido al balanceo forzado de coberturas de los dealers.
            </div>
        `,
        chartTitle: "Curva del Máximo Dolor: Pérdida Acumulada para Compradores por Strike",
        chartDesc: "El punto más bajo del valle representa el 'Max Pain Strike': el imán gravitacional hacia donde tiende el precio en OpEx.",
        controls: [
            { id: "mod21-center", label: "Strike Central Analizado ($)", type: "range", min: 90, max: 110, value: 100, step: 2 }
        ],
        renderChart: function() {
            const center = parseFloat(document.getElementById('mod21-center')?.value || 100);
            const strikes = [];
            const painValues = [];

            for (let k = center - 15; k <= center + 15; k += 2.5) {
                strikes.push('$' + k.toFixed(1));
                // Parábola de valor intrínseco combinado: valle mínimo en 'center'
                const dist = Math.abs(k - center);
                const pain = 20 + Math.pow(dist, 1.8) * 8.5;
                painValues.push(parseFloat(pain.toFixed(1)));
            }

            const ctx = document.getElementById('mainChart').getContext('2d');
            destroyCurrentChart();
            applyChartDefaults();

            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: strikes,
                    datasets: [{
                        label: 'Valor en Dólares Retenido por Compradores ($M) — Mínimo = Max Pain',
                        data: painValues,
                        borderColor: '#eab308',
                        backgroundColor: 'rgba(234, 179, 8, 0.15)',
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { grid: { display: false } },
                        y: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, title: { display: true, text: 'Pérdida en Dólares ($M)' } }
                    }
                }
            });
            setCurrentChart(chart);
        }
    },

    // Módulo 22: Leyendo tu Data Cuantitativa y Plan de Acción
    {
        id: 22,
        category: "Estructura de Mercado y GEX",
        title: "22. Leyendo tu Data Cuantitativa",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">El Protocolo Cuantitativo: Integrando Señales en 30 Segundos</h2>
            <p class="text-slate-300 mb-3">Ningún indicador debe usarse de forma aislada. La ventaja matemática (edge) surge de la <strong>confluencia estructural</strong> entre GEX, Open Interest, Volatility Skew y Max Pain.</p>

            <h3 class="text-lg font-semibold text-white mb-2">Checklist Operativo Cuantitativo:</h3>
            <ol class="list-decimal pl-5 text-slate-300 space-y-2 mb-4">
                <li><strong>¿Dónde está el Spot relativo al Gamma Flip?</strong> Si está por encima, buscar estrategias de reversión a la media (Iron Condors, Venta de Credit Spreads). Si está por debajo, operar momentum direccional o protección en Puts.</li>
                <li><strong>¿Dónde están los muros de liquidez?</strong> Usa el Put Wall como soporte y el Call Wall como toma de beneficios.</li>
                <li><strong>¿Existe convergencia con Max Pain?</strong> En semanas de vencimiento mensual, alinear operaciones esperando compresión hacia el strike de máximo dolor.</li>
            </ol>
        `,
        chartTitle: "Índice de Confluencia Cuantitativa y Probabilidad de Éxito",
        chartDesc: "Comprueba cómo el porcentaje de operaciones ganadoras aumenta sistemáticamente al sumar filtros de confluencia de mercado.",
        controls: [
            { id: "mod22-confl", label: "Número de Filtros Alineados (1 a 4)", type: "range", min: 1, max: 4, value: 3, step: 1 }
        ],
        renderChart: function() {
            const filters = parseInt(document.getElementById('mod22-confl')?.value || 3);
            const categories = ['1 Filtro (Solo Técnico)', '2 Filtros (+ Skew)', '3 Filtros (+ GEX/Flip)', '4 Filtros (+ Max Pain)'];
            const winRates = [48, 57, 68, 79];

            const ctx = document.getElementById('mainChart').getContext('2d');
            destroyCurrentChart();
            applyChartDefaults();

            const chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: categories,
                    datasets: [{
                        label: 'Tasa de Acierto Histórica (Win Rate %)',
                        data: winRates,
                        backgroundColor: categories.map((_, i) => i + 1 === filters ? '#2C99D6' : 'rgba(148, 163, 184, 0.4)'),
                        borderColor: '#2C99D6',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { grid: { display: false } },
                        y: { min: 30, max: 90, grid: { color: 'rgba(148, 163, 184, 0.1)' } }
                    }
                }
            });
            setCurrentChart(chart);
        }
    },

    // =========================================================================
    // CATEGORÍA 4: ESTRATEGIAS DE INGRESOS Y COBERTURA
    // =========================================================================

    // Módulo 23: Covered Calls (Llamadas Cubiertas) y Rollout (Olmstead Cap. 14)
    {
        id: 23,
        category: "Estrategias de Ingresos y Cobertura",
        title: "23. Covered Calls y Maniobra de Rollout",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Covered Calls: Monetización Sistemática de Cartera</h2>
            <p class="text-slate-300 mb-3">En el Capítulo 14, Olmstead detalla la estrategia reina de generación de rentas: poseer 100 acciones y vender 1 contrato Call OTM en su contra (<strong>Buy-Write</strong> u <strong>Overwrite</strong>).</p>

            <h3 class="text-lg font-semibold text-white mb-2">Realismo vs. Idealismo de Covered Calls:</h3>
            <ul class="list-disc pl-5 text-slate-300 space-y-2 mb-4">
                <li><strong class="text-green-400">Generación de Flujo:</strong> Cobras la prima inmediatamente, reduciendo tu precio base de compra y generando un rendimiento anualizado extra del 12-24%.</li>
                <li><strong class="text-amber-400">Techo al Beneficio:</strong> Si la acción explota al alza, estás obligado a entregar tus acciones al Strike vendido ($K$), renunciando a ganancias adicionales.</li>
                <li><strong class="text-blue-400">La Maniobra de Rollout:</strong> Si la acción sube rápido y amenaza con llevarse tus acciones, compras de vuelta la Call vendida y simultáneamente vendes una Call a un strike más alto y con un mes más de vencimiento (<strong>Roll Up and Out</strong>) para capturar más crédito neto y elevar el precio de venta de tus acciones.</li>
            </ul>
        `,
        chartTitle: "Curva de Payoff: Covered Call vs. Acción Sola",
        chartDesc: "Compara cómo la Covered Call supera a la acción en mercados laterales o bajistas moderados, sacrificando el tramo parabólico alcista.",
        controls: [
            { id: "mod23-strike", label: "Strike Call Vendida ($)", type: "range", min: 100, max: 120, value: 105, step: 1 },
            { id: "mod23-premium", label: "Prima Cobrada ($)", type: "range", min: 1, max: 8, value: 3.5, step: 0.5 }
        ],
        renderChart: function() {
            const strike = parseFloat(document.getElementById('mod23-strike')?.value || 105);
            const premium = parseFloat(document.getElementById('mod23-premium')?.value || 3.5);
            const stockBuyPrice = 100;
            const spots = [];
            const stockOnly = [];
            const coveredCall = [];

            for (let s = 80; s <= 125; s += 2.5) {
                spots.push('$' + s.toFixed(1));
                const sPnl = (s - stockBuyPrice);
                stockOnly.push(parseFloat(sPnl.toFixed(2)));

                // Covered Call = Stock P&L + Premium - Max(0, S - Strike)
                const ccPnl = sPnl + premium - Math.max(0, s - strike);
                coveredCall.push(parseFloat(ccPnl.toFixed(2)));
            }

            const ctx = document.getElementById('mainChart').getContext('2d');
            destroyCurrentChart();
            applyChartDefaults();

            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: spots,
                    datasets: [
                        {
                            label: 'Covered Call (Acción + Venta de Call)',
                            data: coveredCall,
                            borderColor: '#2C99D6',
                            backgroundColor: 'rgba(44, 153, 214, 0.15)',
                            fill: true,
                            borderWidth: 2
                        },
                        {
                            label: 'Solo Acción (100 acciones)',
                            data: stockOnly,
                            borderColor: '#64748b',
                            borderDash: [4, 4],
                            borderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { grid: { display: false } },
                        y: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, title: { display: true, text: 'P&L ($)' } }
                    }
                }
            });
            setCurrentChart(chart);
        }
    },

    // Módulo 24: Married Puts (Puts Casados) vs Stop-Loss Tradicional (Olmstead Cap. 17)
    {
        id: 24,
        category: "Estrategias de Ingresos y Cobertura",
        title: "24. Married Puts vs. Stop-Loss Tradicional",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">La Falacia del Stop-Loss y el Seguro Blindado de Married Put</h2>
            <p class="text-slate-300 mb-3">En el Capítulo 17, Olmstead explica por qué las órdenes Stop-Loss tradicionales fallan trágicamente: <strong>no protegen contra gaps overnight</strong>. Si tienes una acción en $100 con un stop en $90 y la empresa anuncia fraude abriendo a $60, tu stop se ejecutará en $60, perdiendo un 40%.</p>

            <h3 class="text-lg font-semibold text-white mb-2">La Solución Cuantitativa: Married Put</h3>
            <p class="text-slate-300 text-sm mb-3">Consiste en comprar simultáneamente 100 acciones y 1 contrato Put (generalmente ATM o ligeramente OTM). Otorga un <strong>suelo de hierro contractual garantizado</strong>:</p>

            <div class="bg-slate-900 p-3 rounded font-mono text-center text-sm text-green-300 border border-slate-800 mb-4">
                Pérdida Máxima = Precio de Compra Acción - Strike Put + Prima del Put
            </div>

            <div class="bg-slate-800 p-4 rounded border-l-4 border-green-500 text-sm text-slate-300">
                <strong class="text-green-400">Ventaja Inmune:</strong> No importa si la acción cae a $0 en una bancarrota absoluta; tienes el derecho inalienable de venderla al Strike acordado. Tu upside alcista permanece 100% abierto.
            </div>
        `,
        chartTitle: "Curva de Payoff: Married Put (Suelo Absoluto) vs. Riesgo de Gap en Stop-Loss",
        chartDesc: "Observa cómo el Married Put corta por completo la cola de pérdidas extremas manteniendo el beneficio ilimitado.",
        controls: [
            { id: "mod24-putk", label: "Strike Put Protector ($)", type: "range", min: 90, max: 100, value: 95, step: 1 },
            { id: "mod24-putcost", label: "Costo del Put ($)", type: "range", min: 1, max: 6, value: 3, step: 0.5 }
        ],
        renderChart: function() {
            const putK = parseFloat(document.getElementById('mod24-putk')?.value || 95);
            const putCost = parseFloat(document.getElementById('mod24-putcost')?.value || 3);
            const stockCost = 100;
            const spots = [];
            const marriedPut = [];
            const nakedStock = [];

            for (let s = 60; s <= 125; s += 2.5) {
                spots.push('$' + s.toFixed(1));
                nakedStock.push(parseFloat((s - stockCost).toFixed(2)));

                // Married Put = Stock P&L + Put Payoff - Cost
                const putPayoff = Math.max(0, putK - s);
                const mpPnl = (s - stockCost) + putPayoff - putCost;
                marriedPut.push(parseFloat(mpPnl.toFixed(2)));
            }

            const ctx = document.getElementById('mainChart').getContext('2d');
            destroyCurrentChart();
            applyChartDefaults();

            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: spots,
                    datasets: [
                        {
                            label: 'Married Put (Suelo Blindado Contractual)',
                            data: marriedPut,
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            fill: true,
                            borderWidth: 2
                        },
                        {
                            label: 'Acción sin Cobertura (Pérdida en Gap)',
                            data: nakedStock,
                            borderColor: '#ef4444',
                            borderDash: [4, 4],
                            borderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { grid: { display: false } },
                        y: { grid: { color: 'rgba(148, 163, 184, 0.1)' } }
                    }
                }
            });
            setCurrentChart(chart);
        }
    },

    // Módulo 25: Classic Collars (Collares Clásicos de Riesgo Cero) (Olmstead Cap. 18)
    {
        id: 25,
        category: "Estrategias de Ingresos y Cobertura",
        title: "25. Classic Collars (Collares de Costo Cero)",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Classic Collar: Protección Institucional a Coste Neto Cero</h2>
            <p class="text-slate-300 mb-3">En el Capítulo 18, Olmstead aborda una de las estrategias favoritas de directivos e instituciones (y celebridades que poseen millones en una sola acción): el <strong>Collar Clásico</strong>.</p>

            <h3 class="text-lg font-semibold text-white mb-2">Estructura de 3 Patas:</h3>
            <ul class="list-disc pl-5 text-slate-300 space-y-2 mb-4">
                <li><strong class="text-blue-400">1. Posición Larga:</strong> Poseer 100 acciones del activo subyacente.</li>
                <li><strong class="text-green-400">2. Seguro Protector:</strong> Comprar 1 Put OTM (ej. Strike $90) que fija el suelo máximo de pérdidas.</li>
                <li><strong class="text-amber-400">3. Financiación del Seguro:</strong> Vender 1 Call OTM (ej. Strike $110) cuya prima recibida <strong>paga exactamente el costo del Put</strong> ($Coste\ Neto \approx 0$).</li>
            </ul>

            <div class="bg-slate-900 p-4 rounded border-l-4 border-cyan-500 text-sm text-slate-300">
                <strong class="text-cyan-400">El Túnel de Rendimiento:</strong> Creas un túnel cerrado donde eliminas el 90% del riesgo de mercado sin sacar un solo dólar de tu bolsillo, a cambio de topar tus ganancias potenciales al Strike de la Call.
            </div>
        `,
        chartTitle: "Curva de Payoff: Classic Zero-Cost Collar",
        chartDesc: "Visualiza el túnel definido entre el Put Wall protector inferior y el Call Wall superior financiado a coste cero.",
        controls: [
            { id: "mod25-put", label: "Strike Put Protector ($)", type: "range", min: 85, max: 95, value: 90, step: 1 },
            { id: "mod25-call", label: "Strike Call Financiador ($)", type: "range", min: 105, max: 115, value: 110, step: 1 }
        ],
        renderChart: function() {
            const putK = parseFloat(document.getElementById('mod25-put')?.value || 90);
            const callK = parseFloat(document.getElementById('mod25-call')?.value || 110);
            const stockCost = 100;
            const spots = [];
            const collarPnl = [];

            for (let s = 75; s <= 125; s += 2) {
                spots.push('$' + s);
                // Collar Payoff: (S - S0) + max(0, putK - S) - max(0, S - callK)
                const stock = (s - stockCost);
                const put = Math.max(0, putK - s);
                const call = Math.max(0, s - callK);
                const pnl = stock + put - call;
                collarPnl.push(parseFloat(pnl.toFixed(2)));
            }

            updateChartInstance('line', spots, collarPnl, 'P&L Classic Collar ($)', (ctx) => {
                const val = ctx.raw !== undefined ? ctx.raw : (ctx.p1 ? ctx.p1.parsed.y : 0);
                return val >= 0 ? '#10b981' : '#ef4444';
            }, true);
        }
    },

    // Módulo 26: Advanced Collars (Collar Sintético con LEAPS y Ventas Semanales) (Olmstead Cap. 19)
    {
        id: 26,
        category: "Estrategias de Ingresos y Cobertura",
        title: "26. Advanced Collars y Sustitutos LEAPS",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Collares Avanzados: Menos Capital y Ventas Semanales Recurrentes</h2>
            <p class="text-slate-300 mb-3">En el Capítulo 19, Olmstead eleva la complejidad resolviendo dos limitaciones del collar tradicional: el inmenso requerimiento de capital de poseer 100 acciones y el tope fijo a la ganancia.</p>

            <div class="space-y-3 mb-4">
                <div class="bg-slate-800/80 p-3 rounded border border-slate-700">
                    <strong class="text-purple-400">1. Collar Sintético con LEAPS:</strong>
                    <p class="text-slate-300 text-sm mt-1">En vez de inmovilizar $10,000 comprando 100 acciones, compras 1 contrato LEAPS Call Deep ITM (Delta ~ 0.85) a 1 o 2 años por $3,000. Luego compras un Put protector más cercano y vendes Calls periódicas.</p>
                </div>
                <div class="bg-slate-800/80 p-3 rounded border border-slate-700">
                    <strong class="text-emerald-400">2. Contratos Desequilibrados (Unbalanced Collars):</strong>
                    <p class="text-slate-300 text-sm mt-1">Por cada 200 acciones que posees, vendes solo 1 Call OTM y compras 2 Puts OTM. Esto deja 100 acciones con potencial de subida completamente ilimitado mientras disfrutas de cobertura total a la baja.</p>
                </div>
            </div>
        `,
        chartTitle: "Curva de Rendimiento: Collar Sintético LEAPS vs. Collar Tradicional",
        chartDesc: "Comprueba el retorno sobre capital invertido (ROC %) significativamente superior que ofrece la versión sintética con LEAPS.",
        controls: [
            { id: "mod26-cap", label: "Eficiencia de Capital LEAPS (%)", type: "range", min: 30, max: 70, value: 50, step: 5 }
        ],
        renderChart: function() {
            const efficiency = parseFloat(document.getElementById('mod26-cap')?.value || 50) / 100;
            const spots = ['$80', '$90', '$100', '$110', '$120'];
            // Retorno en % sobre capital invertido
            const traditionalRoc = [-10, 0, 5, 10, 10]; // Base $10,000
            const syntheticRoc = traditionalRoc.map(r => r / efficiency); // Base reducida

            const ctx = document.getElementById('mainChart').getContext('2d');
            destroyCurrentChart();
            applyChartDefaults();

            const chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: spots,
                    datasets: [
                        {
                            label: 'Collar Sintético LEAPS (ROC %)',
                            data: syntheticRoc,
                            backgroundColor: 'rgba(168, 85, 247, 0.8)',
                            borderColor: '#a855f7',
                            borderWidth: 1
                        },
                        {
                            label: 'Collar Tradicional de Acciones (ROC %)',
                            data: traditionalRoc,
                            backgroundColor: 'rgba(100, 116, 139, 0.6)',
                            borderColor: '#64748b',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { grid: { display: false } },
                        y: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, title: { display: true, text: 'Retorno % sobre Capital' } }
                    }
                }
            });
            setCurrentChart(chart);
        }
    },

    // Módulo 27: Cash-Secured Puts: El Método Buffett de Adquisición con Descuento (Olmstead Cap. 20)
    {
        id: 27,
        category: "Estrategias de Ingresos y Cobertura",
        title: "27. Cash-Secured Puts (Método Buffett)",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Cash-Secured Puts: Cobrar Primas por Comprar Acciones con Descuento</h2>
            <p class="text-slate-300 mb-3">En el Capítulo 20, Olmstead formaliza la técnica utilizada legendariamente por Warren Buffett en acciones como Coca-Cola y Burlington Northern: la <strong>Venta de Puts Respaldadas por Efectivo (Cash-Secured Puts)</strong>.</p>

            <h3 class="text-lg font-semibold text-white mb-2">La Lógica del Inversor Inteligente:</h3>
            <p class="text-slate-300 text-sm mb-3">Si una gran empresa cotiza a $100 pero tú considerarías una ganga comprarla a $90, no pongas una orden de compra limitada pasiva. Vende un contrato Put Strike 90 y cobra inmediatamente una prima de $3.00:</p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div class="bg-slate-800/80 p-3 rounded border border-slate-700">
                    <strong class="text-green-400">Escenario A: La acción queda por encima de $90</strong>
                    <p class="text-slate-300 text-xs mt-1">El Put expira valiendo $0. Te embolsas los $300 de prima limpios, generando rentabilidad sobre tu efectivo sin haber comprado la acción.</p>
                </div>
                <div class="bg-slate-800/80 p-3 rounded border border-slate-700">
                    <strong class="text-blue-400">Escenario B: La acción cae por debajo de $90</strong>
                    <p class="text-slate-300 text-xs mt-1">Te asignan las 100 acciones a $90. Pero como ya cobraste $3.00 de prima, tu <strong>precio de compra real neto es de solo $87.00</strong> ($13% de descuento sobre el precio original).</p>
                </div>
            </div>
        `,
        chartTitle: "Curva de Payoff: Cash-Secured Put y Precio de Adquisición con Descuento",
        chartDesc: "Visualiza cómo el punto de equilibrio ($87) se sitúa con un margen de seguridad sustancial por debajo de la cotización actual.",
        controls: [
            { id: "mod27-strike", label: "Strike Put Vendida ($)", type: "range", min: 80, max: 98, value: 90, step: 2 },
            { id: "mod27-prem", label: "Prima Cobrada ($)", type: "range", min: 1, max: 6, value: 3.5, step: 0.5 }
        ],
        renderChart: function() {
            const strike = parseFloat(document.getElementById('mod27-strike')?.value || 90);
            const premium = parseFloat(document.getElementById('mod27-prem')?.value || 3.5);
            const spots = [];
            const data = [];

            for (let s = 70; s <= 110; s += 2) {
                spots.push('$' + s);
                // Short Put Payoff: Premium - max(0, Strike - S)
                const pnl = premium - Math.max(0, strike - s);
                data.push(parseFloat(pnl.toFixed(2)));
            }

            updateChartInstance('line', spots, data, 'P&L Cash-Secured Put ($)', (ctx) => {
                const val = ctx.raw !== undefined ? ctx.raw : (ctx.p1 ? ctx.p1.parsed.y : 0);
                return val >= 0 ? '#10b981' : '#ef4444';
            }, true);
        }
    },

    // Módulo 28: Estrategias Fiscales de Fin de Año: Qualified Covered Calls (Olmstead Cap. 25)
    {
        id: 28,
        category: "Estrategias de Ingresos y Cobertura",
        title: "28. Estrategias Fiscales: Qualified Covered Calls",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Optimización Fiscal y las Reglas IRS de Qualified Covered Calls</h2>
            <p class="text-slate-300 mb-3">En el Capítulo 25, Olmstead aborda un tema crítico ignorado por la mayoría de manuales: el <strong>impacto fiscal de operar opciones sobre carteras de acciones a largo plazo</strong> bajo la normativa tributaria estadounidense (reglas de 'Straddles' del IRS y Sección 1092).</p>

            <h3 class="text-lg font-semibold text-white mb-2">La Trampa Fiscal de Vender Calls ITM:</h3>
            <p class="text-slate-300 text-sm mb-3">Si posees acciones con grandes plusvalías acumuladas y vendes un Call muy ITM para protegerte a fin de año, el IRS considera que has eliminado el riesgo del activo. <strong>Consecuencia devastadora:</strong> se suspende o reinicia a cero el período de tenencia para ganancias de capital a largo plazo, obligándote a tributar como ingreso ordinario (tasas mucho más altas).</p>

            <div class="bg-slate-800 p-4 rounded border-l-4 border-amber-500 text-sm text-slate-300">
                <strong class="text-amber-400">Los Requisitos de una Qualified Covered Call (QCC):</strong>
                <ul class="list-disc pl-5 mt-2 space-y-1">
                    <li>El contrato debe tener más de 30 días hasta la expiración al momento de abrirse.</li>
                    <li>No puede venderse a un strike inferior al <strong>Lower Qualified Benchmark (LQB)</strong>, que suele ser el strike inmediatamente inferior al precio de cierre previo.</li>
                    <li>Al cumplir estas reglas, mantienes el tratamiento fiscal favorable de ganancias a largo plazo mientras cobras la prima.</li>
                </ul>
            </div>
        `,
        chartTitle: "Zona Calificada (QCC) vs. Zona Peligrosa de Suspensión Fiscal",
        chartDesc: "Muestra la frontera del Lower Qualified Benchmark (LQB): strikes permitidos para preservar el beneficio fiscal.",
        controls: [
            { id: "mod28-spot", label: "Precio de la Acción ($)", type: "range", min: 80, max: 120, value: 100, step: 2 }
        ],
        renderChart: function() {
            const spot = parseFloat(document.getElementById('mod28-spot')?.value || 100);
            const lqb = spot * 0.95; // Benchmark típico del 5% OTM/ATM
            const strikes = [];
            const compliance = [];

            for (let k = 80; k <= 120; k += 5) {
                strikes.push('K: $' + k);
                // Si K >= LQB, es calificado (1), si es inferior es descalificado (-1)
                compliance.push(k >= lqb ? 1 : -1);
            }

            const ctx = document.getElementById('mainChart').getContext('2d');
            destroyCurrentChart();
            applyChartDefaults();

            const chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: strikes,
                    datasets: [{
                        label: 'Estatus Fiscal IRS (1 = QCC Permitida, -1 = Penalización Fiscal)',
                        data: compliance,
                        backgroundColor: compliance.map(v => v === 1 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)'),
                        borderColor: compliance.map(v => v === 1 ? '#10b981' : '#ef4444'),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { grid: { display: false } },
                        y: { min: -1.5, max: 1.5, ticks: { display: false }, grid: { color: 'rgba(148, 163, 184, 0.1)' } }
                    }
                }
            });
            setCurrentChart(chart);
        }
    },

    // =========================================================================
    // CATEGORÍA 5: SPREADS DIRECCIONALES, VOLATILIDAD Y REPARACIÓN
    // =========================================================================

    // Módulo 29: Spreads Verticales de Débito y Crédito (Olmstead Cap. 10)
    {
        id: 29,
        category: "Spreads y Volatilidad",
        title: "29. Spreads Verticales de Débito y Crédito",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">La Arquitectura de los Spreads Verticales</h2>
            <p class="text-slate-300 mb-3">En el Capítulo 10, Olmstead presenta los bloques fundamentales del trading con derivados: los <strong>Spreads Verticales</strong> (misma expiración, distintos strikes).</p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div class="bg-slate-800/80 p-3 rounded border border-slate-700">
                    <h3 class="text-blue-400 font-bold mb-1">Spreads de Débito (Debit Spreads)</h3>
                    <p class="text-slate-300 text-xs mb-1">Pagas una prima neta inicial. Compras la opción más cercana al dinero y vendes una más lejana para abaratar el costo.</p>
                    <ul class="text-slate-400 text-xs list-disc pl-4">
                        <li><strong>Bull Call Spread:</strong> Comprar Call $100 + Vender Call $105.</li>
                        <li><strong>Bear Put Spread:</strong> Comprar Put $100 + Vender Put $95.</li>
                    </ul>
                </div>
                <div class="bg-slate-800/80 p-3 rounded border border-slate-700">
                    <h3 class="text-emerald-400 font-bold mb-1">Spreads de Crédito (Credit Spreads)</h3>
                    <p class="text-slate-300 text-xs mb-1">Cobras una prima neta inicial. Vendes la opción más cercana al dinero y compras una lejana de protección.</p>
                    <ul class="text-slate-400 text-xs list-disc pl-4">
                        <li><strong>Bull Put Spread:</strong> Vender Put $95 + Comprar Put $90.</li>
                        <li><strong>Bear Call Spread:</strong> Vender Call $105 + Comprar Call $110.</li>
                    </ul>
                </div>
            </div>

            <div class="bg-slate-900 p-4 rounded border-l-4 border-blue-500 text-sm text-slate-300">
                <strong class="text-blue-400">Ventaja Cuantitativa:</strong> Vender la segunda pata amortigua el decaimiento Theta y reduce drásticamente el impacto negativo de una caída de volatilidad (Vega neutralizado).
            </div>
        `,
        chartTitle: "Curva de Payoff: Bull Call Spread (Débito) vs. Bull Put Spread (Crédito)",
        chartDesc: "Compara los perfiles de riesgo acotado entre un spread financiado a débito y uno cobrado a crédito.",
        controls: [
            { id: "mod29-width", label: "Ancho entre Strikes ($)", type: "range", min: 2, max: 10, value: 5, step: 1 }
        ],
        renderChart: function() {
            const width = parseFloat(document.getElementById('mod29-width')?.value || 5);
            const lowerK = 100;
            const upperK = lowerK + width;
            const cost = width * 0.4; // Costo típico de débito: 40% del ancho
            const credit = width * 0.35; // Crédito típico recibido
            const spots = [];
            const debitData = [];
            const creditData = [];

            for (let s = 90; s <= 115; s += 1) {
                spots.push('$' + s);
                // Bull Call Payoff: max(0, s - lowerK) - max(0, s - upperK) - cost
                const bcPnl = Math.max(0, s - lowerK) - Math.max(0, s - upperK) - cost;
                debitData.push(parseFloat(bcPnl.toFixed(2)));

                // Bull Put Payoff: credit - (max(0, upperK - s) - max(0, lowerK - s))
                const bpPnl = credit - Math.max(0, Math.min(width, upperK - s));
                creditData.push(parseFloat(bpPnl.toFixed(2)));
            }

            const ctx = document.getElementById('mainChart').getContext('2d');
            destroyCurrentChart();
            applyChartDefaults();

            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: spots,
                    datasets: [
                        {
                            label: 'Bull Call Spread (Débito)',
                            data: debitData,
                            borderColor: '#2C99D6',
                            borderWidth: 2
                        },
                        {
                            label: 'Bull Put Spread (Crédito)',
                            data: creditData,
                            borderColor: '#10b981',
                            borderWidth: 2,
                            borderDash: [4, 4]
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { grid: { display: false } },
                        y: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, title: { display: true, text: 'P&L ($)' } }
                    }
                }
            });
            setCurrentChart(chart);
        }
    },

    // Módulo 30: Event-Driven Credit Spreads (Earnings y Macro Shocks) (Olmstead Cap. 11)
    {
        id: 30,
        category: "Spreads y Volatilidad",
        title: "30. Event-Driven Credit Spreads (Earnings)",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Operando Shocks de Volatilidad Post-Noticia</h2>
            <p class="text-slate-300 mb-3">En el Capítulo 11, Olmstead formula una estrategia de alta probabilidad: <strong>Event-Driven Credit Spreads</strong>. En vez de apostar a ciegas antes de los resultados trimestrales (earnings) donde la volatilidad implícita está inflada, se opera inmediatamente <em>después</em> o vendiendo strikes fuera del movimiento esperado (Implied Move).</p>

            <h3 class="text-lg font-semibold text-white mb-2">Protocolo Operativo de Olmstead:</h3>
            <ol class="list-decimal pl-5 text-slate-300 space-y-2 mb-4">
                <li>Calcular el movimiento esperado: $\\text{Implied Move} \\approx 0.85 \\times \\text{Precio Straddle ATM}$.</li>
                <li>Identificar la sobre-reacción exagerada del mercado tras la noticia.</li>
                <li>Vender un Credit Spread <strong>fuera del rango de 1.5 a 2 desviaciones típicas</strong> para capturar el desplome simultáneo de la volatilidad implícita (IV Crush) y la posterior reversión a la media.</li>
            </ol>
        `,
        chartTitle: "Captura de IV Crush: Desplome de la Prima Post-Earnings",
        chartDesc: "Comprueba cómo el valor del spread de crédito se evapora a nuestro favor tras el anuncio de resultados gracias al colapso de IV.",
        controls: [
            { id: "mod30-crush", label: "Caída de IV Post-Anuncio (%)", type: "range", min: 20, max: 70, value: 50, step: 5 }
        ],
        renderChart: function() {
            const crushPct = parseFloat(document.getElementById('mod30-crush')?.value || 50) / 100;
            const timeline = ['3 Días Antes', '1 Día Antes', 'Cierre Pre-Earnings', 'Apertura (+15m)', 'Fin de Día (+1D)', 'Expiración'];
            const spreadValue = [2.80, 3.40, 4.20, 4.20 * (1 - crushPct * 0.6), 4.20 * (1 - crushPct * 0.85), 0.05];

            updateChartInstance('line', timeline, spreadValue, 'Precio del Credit Spread Vendido ($)', '#ec4899', true);
        }
    },

    // Módulo 31: Calendar Spreads Horizontales y Diagonales (Olmstead Cap. 12)
    {
        id: 31,
        category: "Spreads y Volatilidad",
        title: "31. Calendar Spreads y Maniobras de Rollout",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Calendar Spreads: Explotando la Asimetría del Tiempo</h2>
            <p class="text-slate-300 mb-3">En el Capítulo 12, Olmstead desvela los <strong>Calendar Spreads</strong> (Spreads de Calendario u Horizontales): comprar una opción con vencimiento lejano y vender simultáneamente una opción con el mismo strike pero con vencimiento cercano (Front-Month).</p>

            <h3 class="text-lg font-semibold text-white mb-2">El Motor Matemático del Calendario:</h3>
            <p class="text-slate-300 text-sm mb-3">La opción cercana que vendiste decae a una velocidad Theta mucho más rápida que la opción lejana que compraste. A medida que la opción corta expira sin valor, te quedas con la opción lejana a un costo residual mínimo.</p>

            <div class="bg-slate-800 p-4 rounded border-l-4 border-indigo-500 text-sm text-slate-300">
                <strong class="text-indigo-400">Perfil 'Tienda de Campaña':</strong> La ganancia máxima ocurre si el activo se mantiene exactamente estacionario sobre el strike elegido en la fecha de expiración del mes cercano.
            </div>
        `,
        chartTitle: "Perfil de Payoff en Tienda de Campaña: Calendar Spread al Mes Cercano",
        chartDesc: "El pico de rentabilidad se sitúa exactamente sobre el Strike vendido ($100) en el momento de vencimiento del contrato cercano.",
        controls: [
            { id: "mod31-ivdiff", label: "Diferencial de IV (Mes Lejano vs Cercano %)", type: "range", min: -10, max: 20, value: 5, step: 2 }
        ],
        renderChart: function() {
            const ivDiff = parseFloat(document.getElementById('mod31-ivdiff')?.value || 5);
            const spots = [];
            const pnl = [];
            const centerK = 100;

            for (let s = 85; s <= 115; s += 1.5) {
                spots.push('$' + s.toFixed(1));
                const dist = Math.abs(s - centerK);
                // Forma de tienda de campaña parabólica
                const profit = (280 + ivDiff * 8) * Math.exp(-0.5 * Math.pow(dist / 4.5, 2)) - 110;
                pnl.push(parseFloat(profit.toFixed(1)));
            }

            updateChartInstance('line', spots, pnl, 'P&L Calendar Spread ($)', (ctx) => {
                const val = ctx.raw !== undefined ? ctx.raw : (ctx.p1 ? ctx.p1.parsed.y : 0);
                return val >= 0 ? '#10b981' : '#ef4444';
            }, true);
        }
    },

    // Módulo 32: Advanced Calendar Spreads: Ratio y Deep ITM LEAPS (Olmstead Cap. 13)
    {
        id: 32,
        category: "Spreads y Volatilidad",
        title: "32. Advanced Calendar Spreads y Ratio Calendars",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Calendarios Avanzados: Sesgo Intermensual y Ganancia Ilimitada</h2>
            <p class="text-slate-300 mb-3">En el Capítulo 13, Olmstead supera el techo de ganancia del calendario tradicional introduciendo variantes sofisticadas:</p>

            <ul class="list-disc pl-5 text-slate-300 space-y-2 mb-4">
                <li><strong class="text-emerald-400">Ratio Calendar Spreads:</strong> Comprar 2 opciones lejanas y vender solo 1 opción cercana. Si la acción explota en un rally violento, la segunda opción larga proporciona un <strong>potencial de ganancia ilimitado</strong>.</li>
                <li><strong class="text-cyan-400">Deep ITM LEAPS Put Calendars:</strong> Utilizar Puts profundamente dentro del dinero a 1 o 2 años para generar rentas continuas vendiendo puts OTM de corto plazo en su contra, blindando el portafolio ante mercados bajistas severos.</li>
            </ul>
        `,
        chartTitle: "Curva de Payoff: Ratio Calendar Spread (1 Corta x 2 Largas)",
        chartDesc: "Comprueba cómo el Ratio Calendar retiene el beneficio ilimitado en subidas fuertes a diferencia del calendario clásico.",
        controls: [
            { id: "mod32-spot", label: "Precio Spot Subyacente ($)", type: "range", min: 90, max: 130, value: 100, step: 2 }
        ],
        renderChart: function() {
            const spot = parseFloat(document.getElementById('mod32-spot')?.value || 100);
            const spots = [];
            const ratioData = [];

            for (let s = 80; s <= 135; s += 2.5) {
                spots.push('$' + s.toFixed(1));
                const dist = (s - 100);
                // Payoff con pico central y crecimiento alcista ilimitado por la segunda pata larga
                let val = -120;
                if (s <= 100) {
                    val = -120 + Math.max(0, 100 - dist) * 1.5;
                } else {
                    val = -120 + dist * 15 + Math.max(0, dist - 15) * 20;
                }
                ratioData.push(parseFloat(val.toFixed(1)));
            }

            updateChartInstance('line', spots, ratioData, 'P&L Ratio Calendar ($)', '#10b981', true);
        }
    },

    // Módulo 33: Straddles y Strangles (Volatilidad Pre-Catalizador) (Olmstead Cap. 15)
    {
        id: 33,
        category: "Spreads y Volatilidad",
        title: "33. Straddles y Strangles (Volatilidad Pura)",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Straddles y Strangles: Apostando por Explosión de Volatilidad</h2>
            <p class="text-slate-300 mb-3">En el Capítulo 15, Olmstead aborda las estrategias direccionalmente neutrales de pura volatilidad (<strong>Long Vega & Long Gamma</strong>):</p>

            <ul class="list-disc pl-5 text-slate-300 space-y-2 mb-4">
                <li><strong class="text-purple-400">Long Straddle:</strong> Comprar simultáneamente 1 Call ATM + 1 Put ATM del mismo strike y expiración. Te da igual hacia dónde se mueva la acción, solo necesitas un movimiento violento superior al costo conjunto de ambas primas ($C + P$).</li>
                <li><strong class="text-blue-400">Long Strangle:</strong> Comprar 1 Call OTM + 1 Put OTM. Más barato que el Straddle, pero exige un estallido direccional aún mayor para alcanzar la rentabilidad.</li>
            </ul>

            <div class="bg-slate-900 p-4 rounded border-l-4 border-purple-500 text-sm text-slate-300">
                <strong class="text-purple-400">Breakevens Simétricos:</strong> Superior = $Strike + Prima\ Total$. Inferior = $Strike - Prima\ Total$.
            </div>
        `,
        chartTitle: "Curva de Payoff en 'V': Long Straddle al Vencimiento",
        chartDesc: "Visualiza la pérdida acotada al coste de ambas primas en el centro y las alas alcista y bajista con beneficios ilimitados.",
        controls: [
            { id: "mod33-strike", label: "Strike Central ($)", type: "range", min: 90, max: 110, value: 100, step: 2 },
            { id: "mod33-cost", label: "Costo Total Combinado ($)", type: "range", min: 4, max: 16, value: 8, step: 1 }
        ],
        renderChart: function() {
            const strike = parseFloat(document.getElementById('mod33-strike')?.value || 100);
            const cost = parseFloat(document.getElementById('mod33-cost')?.value || 8);
            const spots = [];
            const data = [];

            for (let s = 75; s <= 125; s += 2) {
                spots.push('$' + s);
                // Straddle Payoff: max(0, s - K) + max(0, K - s) - cost = |s - K| - cost
                const pnl = Math.abs(s - strike) - cost;
                data.push(parseFloat(pnl.toFixed(2)));
            }

            updateChartInstance('line', spots, data, 'P&L Straddle ($)', (ctx) => {
                const val = ctx.raw !== undefined ? ctx.raw : (ctx.p1 ? ctx.p1.parsed.y : 0);
                return val >= 0 ? '#10b981' : '#ef4444';
            }, true);
        }
    },

    // Módulo 34: Stock Repair Strategy: Reparar Posiciones Caídas a Costo Cero (Olmstead Cap. 16)
    {
        id: 34,
        category: "Spreads y Volatilidad",
        title: "34. Stock Repair Strategy: Rescate a Costo Cero",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">La Obra Maestra de Olmstead: The Stock Repair Strategy</h2>
            <p class="text-slate-300 mb-3">En el Capítulo 16, Olmstead presenta una de las joyas matemáticas más valiosas del libro: la <strong>Stock Repair Strategy</strong>. ¿Qué haces si compraste 100 acciones de la empresa 'XYZ' a $35 y la acción se desploma a $23? Si esperas pasivamente, necesitas una subida descomunal del +52% solo para recuperar tu dinero.</p>

            <h3 class="text-lg font-semibold text-white mb-2">La Solución Matemática: 1x2 Ratio Call Spread a Costo Cero</h3>
            <ol class="list-decimal pl-5 text-slate-300 space-y-2 mb-4">
                <li><strong class="text-blue-400">Comprar 1 Call ATM:</strong> Compras 1 Call Strike 25 (cuesta $2.00).</li>
                <li><strong class="text-green-400">Vender 2 Calls OTM:</strong> Vendes 2 Calls Strike 30 (cobras $1.00 por cada una = $2.00 en total).</li>
                <li><strong class="text-amber-400">Costo Neto = $0.00:</strong> Las dos opciones vendidas pagan íntegramente la opción comprada. ¡No desembolsas ni un solo céntimo!</li>
            </ol>

            <div class="bg-slate-900 p-4 rounded border-l-4 border-green-500 text-sm text-slate-300">
                <strong class="text-green-400">El Milagro Cuantitativo:</strong> Si la acción sube solo hasta $30 (la mitad del camino original), ¡tu posición global alcanza el punto de empate (Break-Even) total! La Call comprada se ejerce a $25 aportando $5 de ganancia que, sumados a los $7 de subida de la acción, cubren íntegramente la pérdida de $12 inicial.
            </div>
        `,
        chartTitle: "Estrategia de Reparación: P&L Posición Original vs. Posición Reparada a Costo Cero",
        chartDesc: "Comprueba cómo el punto de equilibrio baja de $35 a solo $30 sin requerir capital adicional.",
        controls: [
            { id: "mod34-spot", label: "Precio Actual de la Acción ($)", type: "range", min: 20, max: 32, value: 23, step: 1 }
        ],
        renderChart: function() {
            const origBuy = 35;
            const spots = [];
            const unassisted = [];
            const repaired = [];

            for (let s = 18; s <= 40; s += 1) {
                spots.push('$' + s);
                // Posición no reparada
                const uPnl = (s - origBuy);
                unassisted.push(parseFloat(uPnl.toFixed(2)));

                // Posición reparada con Ratio Call 1x2 (Comprar 1 C25, Vender 2 C30 a coste neto 0)
                // Payoff = (S - 35) + max(0, S - 25) - 2 * max(0, S - 30)
                const c25 = Math.max(0, s - 25);
                const c30 = 2 * Math.max(0, s - 30);
                const rPnl = (s - origBuy) + c25 - c30;
                repaired.push(parseFloat(rPnl.toFixed(2)));
            }

            const ctx = document.getElementById('mainChart').getContext('2d');
            destroyCurrentChart();
            applyChartDefaults();

            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: spots,
                    datasets: [
                        {
                            label: 'Posición Reparada (Break-Even en $30)',
                            data: repaired,
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            fill: true,
                            borderWidth: 2
                        },
                        {
                            label: 'Posición Original sin Reparar (Break-Even en $35)',
                            data: unassisted,
                            borderColor: '#ef4444',
                            borderDash: [5, 5],
                            borderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { grid: { display: false } },
                        y: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, title: { display: true, text: 'P&L Total por Acción ($)' } }
                    }
                }
            });
            setCurrentChart(chart);
        }
    },

    // Módulo 35: Sustitutos Sintéticos de Acciones (Synthetic Long Stock & LEAPS) (Olmstead Cap. 21)
    {
        id: 35,
        category: "Spreads y Volatilidad",
        title: "35. Sustitutos Sintéticos de Acciones",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Synthetic Long Stock: Replicando 100 Acciones con un 15% de Capital</h2>
            <p class="text-slate-300 mb-3">En el Capítulo 21, Olmstead demuestra que comprar acciones en efectivo es ineficiente en términos de coste de oportunidad de capital. Mediante opciones puedes sintetizar con exactitud quirúrgica el comportamiento de 100 acciones:</p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div class="bg-slate-800/80 p-3 rounded border border-slate-700">
                    <strong class="text-cyan-400">Método 1: Synthetic Long (Delta = 1.0)</strong>
                    <p class="text-slate-300 text-xs mt-1">Comprar 1 Call ATM + Vender 1 Put ATM del mismo strike y fecha. El débito neto es casi cero. La posición se mueve centavo a centavo exactamente idéntica a 100 acciones reales.</p>
                </div>
                <div class="bg-slate-800/80 p-3 rounded border border-slate-700">
                    <strong class="text-purple-400">Método 2: Deep ITM LEAPS (Delta > 0.85)</strong>
                    <p class="text-slate-300 text-xs mt-1">Comprar 1 Call LEAPS a 1 o 2 años muy dentro del dinero. Riesgo bajista estrictamente limitado al costo de la prima, con un 85% de correlación alcista.</p>
                </div>
            </div>
        `,
        chartTitle: "Curva de Replicación: Synthetic Long Stock (Delta 1.0) vs. Acción Real",
        chartDesc: "Observa la superposición perfecta entre el perfil sintético derivado de opciones y la tenencia de acciones al contado.",
        controls: [
            { id: "mod35-strike", label: "Strike Sintético ATM ($)", type: "range", min: 90, max: 110, value: 100, step: 2 }
        ],
        renderChart: function() {
            const strike = parseFloat(document.getElementById('mod35-strike')?.value || 100);
            const spots = [];
            const synthetic = [];
            const stock = [];

            for (let s = 80; s <= 120; s += 2) {
                spots.push('$' + s);
                stock.push(parseFloat((s - strike).toFixed(2)));
                // Synthetic Long: max(0, S - K) - max(0, K - S) = S - K
                const syn = (s - strike);
                synthetic.push(parseFloat(syn.toFixed(2)));
            }

            const ctx = document.getElementById('mainChart').getContext('2d');
            destroyCurrentChart();
            applyChartDefaults();

            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: spots,
                    datasets: [
                        {
                            label: 'Synthetic Long Stock (Call ATM - Put ATM)',
                            data: synthetic,
                            borderColor: '#06b6d4',
                            borderWidth: 2
                        },
                        {
                            label: 'Acción al Contado ($100 Acciones Reales)',
                            data: stock,
                            borderColor: '#94a3b8',
                            borderDash: [4, 4],
                            borderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { grid: { display: false } },
                        y: { grid: { color: 'rgba(148, 163, 184, 0.1)' } }
                    }
                }
            });
            setCurrentChart(chart);
        }
    },

    // Módulo 36: Backspreads con Ratios (Call & Put Backspreads) (Olmstead Cap. 22)
    {
        id: 36,
        category: "Spreads y Volatilidad",
        title: "36. Backspreads con Ratios (Convexidad Pura)",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Backspreads: Financiando Convexidad Explosiva a Costo Cero</h2>
            <p class="text-slate-300 mb-3">En el Capítulo 22, Olmstead analiza los <strong>Backspreads con Ratios (2:1 o 3:2)</strong>. A diferencia de un ratio vertical convencional donde vendes más opciones de las que compras, en el Backspread <strong>compras más opciones de las que vendes</strong>.</p>

            <h3 class="text-lg font-semibold text-white mb-2">Anatomía del Call Backspread (2:1):</h3>
            <ul class="list-disc pl-5 text-slate-300 space-y-2 mb-4">
                <li>Vender 1 Call ITM/ATM más costoso.</li>
                <li>Comprar 2 Calls OTM más económicos.</li>
                <li>La prima del Call vendido paga íntegramente las dos Calls compradas, generando un <strong>pequeño crédito neto inicial</strong>.</li>
                <li>Si la acción se desploma, conservas el crédito neto. Si la acción explota hacia arriba, las 2 Calls compradas proporcionan <strong>ganancias ilimitadas con aceleración Gamma doble</strong>.</li>
            </ul>
        `,
        chartTitle: "Curva de Payoff: Call Backspread (1 Corta x 2 Largas)",
        chartDesc: "Observa la ganancia protegida ante caídas (crédito) y la pendiente alcista acelerada ilimitada.",
        controls: [
            { id: "mod36-credit", label: "Crédito Neto Inicial ($)", type: "range", min: 0.5, max: 3.0, value: 1.0, step: 0.5 }
        ],
        renderChart: function() {
            const credit = parseFloat(document.getElementById('mod36-credit')?.value || 1.0);
            const lowerK = 95;
            const upperK = 105;
            const spots = [];
            const data = [];

            for (let s = 80; s <= 130; s += 2) {
                spots.push('$' + s);
                // Call Backspread: credit - max(0, S - lowerK) + 2 * max(0, S - upperK)
                const shortCall = Math.max(0, s - lowerK);
                const longCalls = 2 * Math.max(0, s - upperK);
                const pnl = credit - shortCall + longCalls;
                data.push(parseFloat(pnl.toFixed(2)));
            }

            updateChartInstance('line', spots, data, 'P&L Call Backspread ($)', (ctx) => {
                const val = ctx.raw !== undefined ? ctx.raw : (ctx.p1 ? ctx.p1.parsed.y : 0);
                return val >= 0 ? '#10b981' : '#ef4444';
            }, true);
        }
    },

    // Módulo 37: Butterfly Spreads (Mariposa Clásica y Broken Wing) (Olmstead Cap. 23)
    {
        id: 37,
        category: "Spreads y Volatilidad",
        title: "37. Butterfly Spreads y Broken Wing",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Butterfly Spreads: Relaciones Riesgo/Beneficio Extremas (1:5+)</h2>
            <p class="text-slate-300 mb-3">En el Capítulo 23, Olmstead expone una de las estrategias más elegantes del trading cuantitativo: el <strong>Butterfly Spread (Mariposa)</strong> con ratio 1-2-1.</p>

            <h3 class="text-lg font-semibold text-white mb-2">Estructura de 3 Niveles:</h3>
            <ul class="list-disc pl-5 text-slate-300 space-y-2 mb-4">
                <li>Comprar 1 Call con strike inferior ($K_1$).</li>
                <li>Vender 2 Calls en el strike central o cuerpo ($K_2$).</li>
                <li>Comprar 1 Call con strike superior ($K_3$).</li>
            </ul>

            <div class="bg-slate-800 p-4 rounded border-l-4 border-amber-500 text-sm text-slate-300">
                <strong class="text-amber-400">Broken Wing Butterfly (Alas Rotas):</strong> Al desplazar un ala exterior más lejos, el spread se puede abrir con crédito neto, eliminando completamente el riesgo hacia uno de los dos lados del mercado.
            </div>
        `,
        chartTitle: "Curva de Payoff: Long Butterfly Spread al Vencimiento",
        chartDesc: "Pico de máxima ganancia en el strike central ($100) con riesgo estrictamente acotado al mínimo débito pagado.",
        controls: [
            { id: "mod37-wing", label: "Amplitud de las Alas ($)", type: "range", min: 2, max: 10, value: 5, step: 1 }
        ],
        renderChart: function() {
            const wing = parseFloat(document.getElementById('mod37-wing')?.value || 5);
            const centerK = 100;
            const lowerK = centerK - wing;
            const upperK = centerK + wing;
            const cost = wing * 0.15; // Costo típico: ~15% del ancho de alas
            const spots = [];
            const data = [];

            for (let s = 85; s <= 115; s += 1) {
                spots.push('$' + s);
                // Butterfly: max(0, S - lowerK) - 2 * max(0, S - centerK) + max(0, S - upperK) - cost
                const pnl = Math.max(0, s - lowerK) - 2 * Math.max(0, s - centerK) + Math.max(0, s - upperK) - cost;
                data.push(parseFloat(pnl.toFixed(2)));
            }

            updateChartInstance('line', spots, data, 'P&L Butterfly ($)', (ctx) => {
                const val = ctx.raw !== undefined ? ctx.raw : (ctx.p1 ? ctx.p1.parsed.y : 0);
                return val >= 0 ? '#10b981' : '#ef4444';
            }, true);
        }
    },

    // Módulo 38: Iron Condor (Generación Sistemática de Theta en Rango) (Olmstead Cap. 24)
    {
        id: 38,
        category: "Spreads y Volatilidad",
        title: "38. Iron Condor: Generación Sistemática de Rentas",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Iron Condor: El Buque Insignia de la Generación de Rentas</h2>
            <p class="text-slate-300 mb-3">En el Capítulo 24, Olmstead profundiza en la estrategia no direccional más popular entre fondos de cobertura y traders sistemáticos: el <strong>Iron Condor</strong> (venta simultánea de un Bull Put Credit Spread y un Bear Call Credit Spread).</p>

            <h3 class="text-lg font-semibold text-white mb-2">Las 4 Patas del Cóndor:</h3>
            <ul class="list-disc pl-5 text-slate-300 space-y-2 mb-4">
                <li><strong class="text-green-400">Ala Put:</strong> Vender Put OTM (ej. 90) + Comprar Put más OTM de protección (ej. 85).</li>
                <li><strong class="text-blue-400">Ala Call:</strong> Vender Call OTM (ej. 110) + Comprar Call más OTM de protección (ej. 115).</li>
            </ul>

            <div class="bg-slate-900 p-4 rounded border-l-4 border-emerald-500 text-sm text-slate-300">
                <strong class="text-emerald-400">Zona de Ganancia Máxima:</strong> Cobras un crédito neto inicial que retienes al 100% si el activo subyacente expira en cualquier lugar dentro del amplio pasillo delimitado entre los dos strikes vendidos.
            </div>
        `,
        chartTitle: "Curva de Payoff: Iron Condor al Vencimiento",
        chartDesc: "Meseta de beneficio máximo y pérdidas estrictamente delimitadas por las alas exteriores compradas.",
        controls: [
            { id: "mod38-credit", label: "Crédito Cobrado ($)", type: "range", min: 1, max: 4, value: 2.2, step: 0.2 }
        ],
        renderChart: function() {
            const credit = parseFloat(document.getElementById('mod38-credit')?.value || 2.2);
            const p1 = 85, p2 = 90, c1 = 110, c2 = 115;
            const spots = [];
            const data = [];

            for (let s = 78; s <= 122; s += 1) {
                spots.push('$' + s);
                // Payoff = credit - max(0, p2 - S) + max(0, p1 - S) - max(0, S - c1) + max(0, S - c2)
                const putLoss = Math.max(0, p2 - s) - Math.max(0, p1 - s);
                const callLoss = Math.max(0, s - c1) - Math.max(0, s - c2);
                const pnl = credit - putLoss - callLoss;
                data.push(parseFloat(pnl.toFixed(2)));
            }

            updateChartInstance('line', spots, data, 'P&L Iron Condor ($)', (ctx) => {
                const val = ctx.raw !== undefined ? ctx.raw : (ctx.p1 ? ctx.p1.parsed.y : 0);
                return val >= 0 ? '#10b981' : '#ef4444';
            }, true);
        }
    },

    // Módulo 39: Day Trading Cuantitativo con Opciones de Índices SPY/QQQ (Olmstead Cap. 26)
    {
        id: 39,
        category: "Spreads y Volatilidad",
        title: "39. Day Trading Cuantitativo de Índices SPY/QQQ",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Day Trading Sistemático de Opciones con SPY y QQQ</h2>
            <p class="text-slate-300 mb-3">En el Capítulo 26, Olmstead expone las reglas para hacer day trading intradía con opciones semanales o 0DTE sobre los índices más líquidos del mundo (SPY y QQQ).</p>

            <h3 class="text-lg font-semibold text-white mb-2">El Algoritmo de Reglas de Olmstead:</h3>
            <ol class="list-decimal pl-5 text-slate-300 space-y-2 mb-4">
                <li><strong class="text-blue-400">Instrumento:</strong> Operar únicamente opciones ATM o 1 strike ITM para garantizar Delta de 0.50 a 0.65 y spreads Bid/Ask ultra-estrechos ($0.01 a $0.02).</li>
                <li><strong class="text-yellow-400">Indicadores Cuantitativos:</strong> Fast Stochastic (14,3,3) y Bandas de Bollinger en gráficos de 5 minutos. Entradas solo en sobreventa extrema (< 20) o sobrecompra extrema (> 80).</li>
                <li><strong class="text-emerald-400">Ratio Asimétrico 2:1:</strong> Salida con beneficio al 40-50% de ganancia de la prima; Stop-loss inflexible al 20-25% de pérdida.</li>
                <li><strong class="text-red-400">Cierre Obligatorio al Final del Día:</strong> Jamás mantener una posición de day trading durante la noche (overnight), eliminando el 100% del riesgo de gaps sorpresivos.</li>
            </ol>
        `,
        chartTitle: "Simulación de Day Trading Intradía: Curva de Capital con Ratio Asimétrico 2:1",
        chartDesc: "Comprueba el crecimiento exponencial de la curva de capital ejecutando con estricta asimetría de beneficio 2:1 y stop-loss.",
        controls: [
            { id: "mod39-winrate", label: "Tasa de Aciertos (%)", type: "range", min: 40, max: 70, value: 55, step: 5 }
        ],
        renderChart: function() {
            const winRate = parseFloat(document.getElementById('mod39-winrate')?.value || 55) / 100;
            const days = ['Día 1', 'Día 2', 'Día 3', 'Día 4', 'Día 5', 'Día 6', 'Día 7', 'Día 8', 'Día 9', 'Día 10'];
            const capital = [5000];
            let current = 5000;

            const outcomes = [1, -1, 1, 1, -1, 1, -1, 1, 1, -1];
            outcomes.forEach((r, idx) => {
                const isWin = (idx % 10 < winRate * 10);
                const pnl = isWin ? 350 : -175; // Ratio 2:1 exacto
                current += pnl;
                capital.push(current);
            });

            updateChartInstance('line', days, capital, 'Curva de Capital Day Trading ($)', '#10b981', true);
        }
    }

];
