/* ============================================
   Academia Quant — Base de Datos de Módulos
   Masterclass Cuantitativa Completa (14 Módulos)
   ============================================ */

import {
    updateChartInstance,
    destroyCurrentChart,
    applyChartDefaults,
    setCurrentChart
} from '../core/chartEngine.js';

// --- Utilidades Matemáticas de Black-Scholes para Gráficos de Griegas ---
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
    // =============================================
    // 1. FUNDAMENTOS — Conceptos Básicos
    // =============================================
    {
        id: 1,
        category: "Fundamentos",
        title: "1. Conceptos Básicos",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Introducción a las Opciones</h2>
            <p class="text-slate-300 mb-3">Una opción es un contrato derivado que te otorga el <strong>derecho</strong> (pero no la obligación) de comprar o vender un activo a un precio fijado de antemano (<strong>Strike</strong>) en o antes de una fecha determinada (<strong>Expiración</strong>).</p>
            <ul class="list-disc pl-5 text-slate-300 space-y-2 mb-4">
                <li><strong class="text-green-400">CALL:</strong> Derecho a <em>comprar</em>. Se beneficia cuando el precio sube. Ganas si el activo supera el Strike + la prima pagada.</li>
                <li><strong class="text-red-400">PUT:</strong> Derecho a <em>vender</em>. Funciona como una póliza de seguro ante caídas. Ganas si el precio cae por debajo del Strike - la prima pagada.</li>
            </ul>
            <div class="bg-slate-800 p-4 rounded-lg mb-3 border-l-4 border-blue-500">
                <strong class="text-blue-400">Componentes del Precio (Prima):</strong>
                <p class="text-slate-300 text-sm mt-1"><strong>Prima = Valor Intrínseco + Valor Extrínseco (Temporal + Volatilidad)</strong>.</p>
            </div>
            <p class="text-sm text-slate-400">Mueve los controles de Strike y Prima para explorar la curva de pagos (Payoff) de un Long Call al vencimiento.</p>
        `,
        chartTitle: "Perfil de Riesgo: Long Call",
        chartDesc: "La pérdida máxima está limitada al 100% de la prima pagada. Las ganancias teóricas son ilimitadas si la acción sube con fuerza.",
        controls: [
            { id: 'strikePrice', label: 'Precio Strike ($)', type: 'range', min: 80, max: 120, value: 100, step: 1 },
            { id: 'premium', label: 'Prima Pagada ($)', type: 'range', min: 1, max: 10, value: 5, step: 0.5 }
        ],
        renderChart: () => {
            const strike = parseFloat(document.getElementById('strikePrice').value);
            const premium = parseFloat(document.getElementById('premium').value);
            const prices = [];
            const pnl = [];
            for (let i = 70; i <= 130; i++) {
                prices.push(i);
                pnl.push(Math.max(0, i - strike) - premium);
            }
            updateChartInstance('line', prices, pnl, 'Ganancia / Pérdida ($)',
                (ctx) => (ctx.p0?.parsed?.y < 0) ? 'rgba(239, 68, 68, 0.8)' : 'rgba(34, 197, 94, 0.8)'
            );
        }
    },

    // =============================================
    // 2. LAS GRIEGAS — Delta (Δ)
    // =============================================
    {
        id: 2,
        category: "Las Griegas",
        title: "2. Delta: Dirección y Cobertura (Δ)",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Delta (Δ): Dirección, Probabilidad y Hedge</h2>
            <p class="text-slate-300 mb-3"><strong>Delta</strong> mide la tasa de cambio del precio de la opción por cada $1 de movimiento en el precio del activo subyacente. Matemáticamente es la primera derivada del precio de la opción respecto al spot:</p>
            
            <div class="bg-slate-900 border border-slate-700 p-2 rounded-lg text-center font-mono text-blue-300 text-sm mb-4">
                Δ = ∂V / ∂S &nbsp;&nbsp;|&nbsp;&nbsp; Calls: [0.00 a +1.00] &nbsp;&nbsp;|&nbsp;&nbsp; Puts: [-1.00 a 0.00]
            </div>

            <h3 class="text-lg font-semibold text-white mt-4 mb-2">🧠 Las 3 Interpretaciones del Trader Cuantitativo</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div class="bg-slate-800 p-3 rounded-lg border-t-2 border-green-500">
                    <p class="font-bold text-green-400 text-sm mb-1">1. Sensibilidad Direccional</p>
                    <p class="text-slate-300 text-xs">Si un Call tiene Δ = 0.60 y la acción sube $1.00, el valor de la opción se incrementa en aproximadamente $0.60.</p>
                </div>
                <div class="bg-slate-800 p-3 rounded-lg border-t-2 border-blue-500">
                    <p class="font-bold text-blue-400 text-sm mb-1">2. Equivalente en Acciones</p>
                    <p class="text-slate-300 text-xs">Un contrato de opciones con Δ = 0.50 representa exactamente la exposición direccional de poseer 50 acciones (0.50 × 100).</p>
                </div>
                <div class="bg-slate-800 p-3 rounded-lg border-t-2 border-purple-500">
                    <p class="font-bold text-purple-400 text-sm mb-1">3. Probabilidad ITM</p>
                    <p class="text-slate-300 text-xs">Un Delta de 0.25 refleja una probabilidad aproximada del 25% de que la opción expire dentro del dinero (In-The-Money).</p>
                </div>
            </div>

            <h3 class="text-lg font-semibold text-white mt-4 mb-2">⚡ Delta-Hedging de los Market Makers</h3>
            <div class="bg-slate-800 p-4 rounded-lg mb-4 border-l-4 border-yellow-500">
                <p class="text-slate-300 text-sm">Cuando compras 10 contratos Call con Delta 0.50, el Market Maker te vendió esos contratos y tiene una posición de <strong>-500 Deltas</strong>. Para neutralizar su riesgo de quiebra (Delta Neutral), el creador de mercado debe comprar de inmediato <strong>500 acciones del activo subyacente</strong> en la bolsa. Esta mecánica es el motor de los flujos institucionales.</p>
            </div>

            <p class="text-sm text-slate-400 italic">💡 Ajusta el control de DTE (Días a Expiración). Observa cómo con 60 DTE la curva es suave, pero al acercarse a 1 DTE colapsa en un escalón casi vertical en el Strike (riesgo binario extremo).</p>
        `,
        chartTitle: "Curva de Delta vs Precio Spot (Efecto DTE)",
        chartDesc: "Línea verde: Call Delta (0 a 1). Línea roja: Put Delta (-1 a 0). En ATM (Spot=Strike), Call Delta ronda 0.50 y Put Delta -0.50.",
        controls: [
            { id: 'deltaStrike', label: 'Strike ($)', type: 'range', min: 80, max: 120, value: 100, step: 1 },
            { id: 'deltaDTE', label: 'Días a Expiración (DTE)', type: 'range', min: 1, max: 90, value: 30, step: 1 },
            { id: 'deltaIV', label: 'Volatilidad Implícita (%)', type: 'range', min: 15, max: 80, value: 25, step: 1 }
        ],
        renderChart: () => {
            const K = parseFloat(document.getElementById('deltaStrike').value);
            const dte = parseFloat(document.getElementById('deltaDTE').value);
            const iv = parseFloat(document.getElementById('deltaIV').value) / 100;
            const T = Math.max(dte / 365, 0.0001);
            const r = 0.04;

            const spots = [];
            const callDeltas = [];
            const putDeltas = [];

            for (let s = 70; s <= 130; s++) {
                spots.push(s);
                const d1 = (Math.log(s / K) + (r + 0.5 * iv * iv) * T) / (iv * Math.sqrt(T));
                const cDelta = normCdf(d1);
                const pDelta = cDelta - 1.0;
                callDeltas.push(Number(cDelta.toFixed(3)));
                putDeltas.push(Number(pDelta.toFixed(3)));
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
                            label: 'Call Delta (Δ)',
                            data: callDeltas,
                            borderColor: '#20c997',
                            backgroundColor: 'rgba(32, 201, 151, 0.1)',
                            borderWidth: 2.5,
                            tension: 0.2,
                            pointRadius: 0
                        },
                        {
                            label: 'Put Delta (Δ)',
                            data: putDeltas,
                            borderColor: '#ff3366',
                            backgroundColor: 'rgba(255, 51, 102, 0.1)',
                            borderWidth: 2.5,
                            tension: 0.2,
                            pointRadius: 0
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: { display: true, position: 'top', labels: { color: '#94a3b8', font: { size: 10 } } },
                        tooltip: { backgroundColor: 'rgba(15,23,42,0.95)', titleColor: '#fff', bodyColor: '#cbd5e1' }
                    },
                    scales: {
                        x: { grid: { display: false }, title: { display: true, text: 'Precio Spot ($)', color: '#94a3b8', font: { size: 10 } } },
                        y: { min: -1.05, max: 1.05, grid: { color: 'rgba(148,163,184,0.1)' }, title: { display: true, text: 'Valor de Delta', color: '#94a3b8', font: { size: 10 } } }
                    }
                }
            });
            setCurrentChart(chart);

            document.getElementById('chart-description').innerHTML =
                'DTE: <strong class="text-white">' + dte + ' días</strong> | Strike: <strong class="text-yellow-400">$' + K + '</strong> | IV: <strong class="text-blue-400">' + (iv * 100).toFixed(0) + '%</strong><br>' +
                (dte <= 5 ? '⚠ <span class="text-red-400 font-semibold">Zona 0DTE/Pinning:</span> Delta pasa de 0 a 1 instantáneamente en el Strike. Máximo riesgo direccional.' : '✅ <span class="text-green-400 font-semibold">Curva Suave:</span> Transición gradual de probabilidades entre OTM, ATM e ITM.');
        }
    },

    // =============================================
    // 3. LAS GRIEGAS — Gamma (Γ)
    // =============================================
    {
        id: 3,
        category: "Las Griegas",
        title: "3. Gamma: Aceleración y Convexidad (Γ)",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Gamma (Γ): La Segunda Derivada</h2>
            <p class="text-slate-300 mb-3">Si Delta es la velocidad, <strong>Gamma</strong> es la <strong>aceleración</strong>. Mide cuánto cambia Delta por cada $1 de variación en el subyacente:</p>

            <div class="bg-slate-900 border border-slate-700 p-2 rounded-lg text-center font-mono text-blue-300 text-sm mb-4">
                Γ = ∂²V / ∂S² = ∂Δ / ∂S &nbsp;&nbsp;|&nbsp;&nbsp; Siempre positivo para compradores (Longs)
            </div>

            <h3 class="text-lg font-semibold text-white mt-4 mb-2">⚡ Propiedades Cruciales de Gamma</h3>
            <ul class="list-disc pl-5 text-slate-300 text-sm space-y-2 mb-4">
                <li><strong>Máximo en ATM:</strong> Gamma siempre forma una curva en campana con su cúspide centrada exactamente en el Strike At-The-Money.</li>
                <li><strong>La Explosión de Gamma en 0DTE:</strong> A medida que el vencimiento se acerca (T → 0), la campana de Gamma se estrecha brutalmente y su altura tiende al infinito. Esto explica por qué las opciones con poco tiempo restante son armas de doble filo que pueden multiplicar su valor o esfumarse en minutos.</li>
                <li><strong>El dolor de los vendedores (Short Gamma):</strong> Quien vende opciones tiene Gamma negativo; los movimientos en su contra se aceleran con violencia.</li>
            </ul>

            <div class="bg-slate-800 p-4 rounded-lg mb-3 border-l-4 border-green-500">
                <strong class="text-green-400">Convexidad Positiva:</strong>
                <p class="text-slate-300 text-sm mt-1">Estar largo de Gamma significa que cuando aciertas la dirección, Delta crece a tu favor (ganas más rápido); y si te equivocas, Delta se reduce (pierdes más lento).</p>
            </div>
        `,
        chartTitle: "Curva de Gamma: La Campana de Aceleración",
        chartDesc: "Gamma se concentra fuertemente en el precio Strike. Al reducir DTE, la campana se vuelve ultra estrecha y puntiaguda.",
        controls: [
            { id: 'gammaStrike', label: 'Precio Strike ($)', type: 'range', min: 80, max: 120, value: 100, step: 1 },
            { id: 'gammaDTE', label: 'Días a Expiración (DTE)', type: 'range', min: 1, max: 90, value: 20, step: 1 },
            { id: 'gammaIV', label: 'Volatilidad (%)', type: 'range', min: 15, max: 60, value: 25, step: 1 }
        ],
        renderChart: () => {
            const K = parseFloat(document.getElementById('gammaStrike').value);
            const dte = parseFloat(document.getElementById('gammaDTE').value);
            const iv = parseFloat(document.getElementById('gammaIV').value) / 100;
            const T = Math.max(dte / 365, 0.0001);
            const r = 0.04;

            const spots = [];
            const gammas = [];

            for (let s = 70; s <= 130; s++) {
                spots.push(s);
                const d1 = (Math.log(s / K) + (r + 0.5 * iv * iv) * T) / (iv * Math.sqrt(T));
                const gammaVal = normPdf(d1) / (s * iv * Math.sqrt(T));
                gammas.push(Number(gammaVal.toFixed(4)));
            }

            const ctx = document.getElementById('mainChart').getContext('2d');
            destroyCurrentChart();
            applyChartDefaults();

            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: spots,
                    datasets: [{
                        label: 'Gamma (Γ)',
                        data: gammas,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.3,
                        pointRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(15,23,42,0.95)' } },
                    scales: {
                        x: { grid: { display: false }, title: { display: true, text: 'Precio Spot ($)', color: '#94a3b8', font: { size: 10 } } },
                        y: { grid: { color: 'rgba(148,163,184,0.1)' }, title: { display: true, text: 'Magnitud Gamma', color: '#94a3b8', font: { size: 10 } } }
                    }
                }
            });
            setCurrentChart(chart);

            document.getElementById('chart-description').innerHTML =
                'Pico de Gamma en ATM ($' + K + '): <strong class="text-blue-400">' + Math.max(...gammas) + '</strong> | DTE: <strong class="text-white">' + dte + 'd</strong><br>' +
                (dte <= 7 ? '🔥 <span class="text-red-400 font-semibold">Gamma Riesgoso:</span> Pico extremo centrado en el strike. Desfase agresivo de deltas.' : '🌊 <span class="text-slate-400">Gamma Estable:</span> Riesgo distribuido en un rango amplio de precios.');
        }
    },

    // =============================================
    // 4. LAS GRIEGAS — Theta (Θ)
    // =============================================
    {
        id: 4,
        category: "Las Griegas",
        title: "4. Theta: El Decaimiento del Tiempo (Θ)",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Theta (Θ): El Costo del Tiempo</h2>
            <p class="text-slate-300 mb-3"><strong>Theta</strong> mide cuánto valor pierde una opción por cada día calendario que transcurre. Matemáticamente representa la derivada negativa del precio respecto al tiempo:</p>

            <div class="bg-slate-900 border border-slate-700 p-2 rounded-lg text-center font-mono text-blue-300 text-sm mb-4">
                Θ = - ∂V / ∂t &nbsp;&nbsp;|&nbsp;&nbsp; Comprador: Θ < 0 (sangrado) &nbsp;&nbsp;|&nbsp;&nbsp; Vendedor: Θ > 0 (ingreso)
            </div>

            <div class="bg-slate-800 p-4 rounded-lg mb-4 border-l-4 border-amber-500">
                <strong class="text-amber-400">💡 La Ley de la Raíz Cuadrada:</strong>
                <p class="text-slate-300 text-sm mt-1">El valor temporal decae proporcional a <strong>√(T)</strong>. El paso de 60 a 50 DTE apenas reduce la prima; el paso de 15 a 0 DTE destruye la mayor parte del valor temporal restante.</p>
            </div>

            <h3 class="text-lg font-semibold text-white mt-4 mb-2">🎯 ¿Quién sufre más Theta?</h3>
            <div class="overflow-x-auto mb-4">
                <table class="w-full text-sm text-left">
                    <thead class="text-xs text-slate-400 uppercase bg-slate-800">
                        <tr><th class="px-3 py-2">Moneyness</th><th class="px-3 py-2">Intensidad</th><th class="px-3 py-2">Explicación</th></tr>
                    </thead>
                    <tbody class="text-slate-300">
                        <tr class="border-b border-slate-700"><td class="px-3 py-2 text-yellow-400 font-bold">ATM</td><td class="px-3 py-2 text-red-400 font-semibold">Extrema</td><td class="px-3 py-2 text-xs">100% valor temporal; colapso exponencial.</td></tr>
                        <tr class="border-b border-slate-700"><td class="px-3 py-2 text-blue-400 font-bold">OTM</td><td class="px-3 py-2 text-orange-400 font-semibold">Moderada</td><td class="px-3 py-2 text-xs">Decaimiento continuo hacia cero.</td></tr>
                        <tr><td class="px-3 py-2 text-green-400 font-bold">ITM</td><td class="px-3 py-2 text-slate-400 font-semibold">Baja</td><td class="px-3 py-2 text-xs">Protegido por el valor intrínseco.</td></tr>
                    </tbody>
                </table>
            </div>
        `,
        chartTitle: "Theta Decay: Valor Extrínseco vs Días a Expiración",
        chartDesc: "Curva ATM en amarillo colapsando en los últimos 30 días. Las curvas OTM (azul) e ITM (verde) tienen decaimientos más suaves.",
        controls: [
            { id: 'thetaMoneyness', label: 'Moneyness (1: ATM, 2: OTM, 3: ITM)', type: 'range', min: 1, max: 3, value: 1, step: 1 },
            { id: 'thetaIV', label: 'Volatilidad Implícita (%)', type: 'range', min: 15, max: 60, value: 30, step: 1 }
        ],
        renderChart: () => {
            const moneynessVal = parseInt(document.getElementById('thetaMoneyness').value);
            const iv = parseFloat(document.getElementById('thetaIV').value) / 100;
            const moneynessMap = { 1: 'ATM', 2: 'OTM', 3: 'ITM' };
            const mSpan = document.getElementById('thetaMoneyness-val');
            if (mSpan) mSpan.innerText = moneynessMap[moneynessVal];

            const dteLabels = [], atmValues = [], otmValues = [], itmValues = [];
            const spotATM = 100, spotOTM = 95, spotITM = 110;

            for (let dte = 60; dte >= 0; dte--) {
                dteLabels.push(dte);
                const T = dte / 365, sqrtT = Math.sqrt(Math.max(T, 0));
                atmValues.push(Math.max(spotATM * iv * sqrtT * 0.4, 0));
                otmValues.push(Math.max(spotOTM * iv * sqrtT * 0.25, 0));
                itmValues.push(Math.max(spotITM * iv * sqrtT * 0.2, 0));
            }

            const ctx = document.getElementById('mainChart').getContext('2d');
            destroyCurrentChart();
            applyChartDefaults();

            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dteLabels,
                    datasets: [
                        { label: 'ATM (At-The-Money)', data: atmValues, borderColor: moneynessVal === 1 ? '#facc15' : 'rgba(250,204,21,0.25)', borderWidth: moneynessVal === 1 ? 3 : 1, tension: 0.3, pointRadius: 0 },
                        { label: 'OTM (Out-Of-The-Money)', data: otmValues, borderColor: moneynessVal === 2 ? '#3b82f6' : 'rgba(59,130,246,0.25)', borderWidth: moneynessVal === 2 ? 3 : 1, tension: 0.3, pointRadius: 0 },
                        { label: 'ITM (In-The-Money)', data: itmValues, borderColor: moneynessVal === 3 ? '#22c55e' : 'rgba(34,197,94,0.25)', borderWidth: moneynessVal === 3 ? 3 : 1, tension: 0.3, pointRadius: 0 }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { reverse: true, grid: { display: false }, title: { display: true, text: 'Días a Expiración (DTE) →', color: '#94a3b8', font: { size: 10 } } },
                        y: { grid: { color: 'rgba(148,163,184,0.1)' }, title: { display: true, text: 'Valor Extrínseco ($)', color: '#94a3b8', font: { size: 10 } } }
                    }
                }
            });
            setCurrentChart(chart);

            document.getElementById('chart-description').innerHTML =
                'Modo seleccionado: <strong class="text-white">' + moneynessMap[moneynessVal] + '</strong> | Sweet spot para vendedores: <strong class="text-purple-400">45 a 21 DTE</strong> (aceleración sin riesgo binario terminal).';
        }
    },

    // =============================================
    // 5. LAS GRIEGAS — Vega (ν)
    // =============================================
    {
        id: 5,
        category: "Las Griegas",
        title: "5. Vega: Volatilidad e IV Crush (ν)",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Vega (ν): El Multiplicador de Volatilidad</h2>
            <p class="text-slate-300 mb-3"><strong>Vega</strong> mide cuántos dólares varía el precio de una opción por cada <strong>1% (1 punto porcentual)</strong> de cambio en la Volatilidad Implícita (IV):</p>

            <div class="bg-slate-900 border border-slate-700 p-2 rounded-lg text-center font-mono text-blue-300 text-sm mb-4">
                ν = ∂V / ∂σ &nbsp;&nbsp;|&nbsp;&nbsp; Comprador: Vega Positivo &nbsp;&nbsp;|&nbsp;&nbsp; Vendedor: Vega Negativo
            </div>

            <h3 class="text-lg font-semibold text-white mt-4 mb-2">💥 El Fenómeno Mortal del "IV Crush" en Earnings</h3>
            <p class="text-slate-300 text-sm mb-3">El error más costoso de los principiantes es comprar calls o puts justo antes de un reporte de resultados (Earnings, CPI o FOMC). La volatilidad implícita se infla a niveles del 100%-150% antes del anuncio. Inmediatamente publicado el evento, el IV colapsa al 35%:</p>
            
            <div class="bg-slate-800 p-4 rounded-lg mb-4 border-l-4 border-red-500">
                <strong class="text-red-400">Ejemplo Real de IV Crush:</strong>
                <p class="text-slate-300 text-xs mt-1 font-mono">
                    Compraste un Call con Vega = 0.20 y Delta = 0.40.<br>
                    La acción sube +$3.00 (ganas por Delta: 3 × 0.40 = +$1.20).<br>
                    El IV se desploma -40% (pierdes por Vega: 40 × 0.20 = -$8.00).<br>
                    <strong>Resultado neto: -$6.80 de pérdida</strong> ¡a pesar de haber acertado la dirección!
                </p>
            </div>

            <h3 class="text-lg font-semibold text-white mt-4 mb-2">⏳ Relación con el Tiempo</h3>
            <p class="text-slate-300 text-sm mb-3">Vega es directamente proporcional a <strong>√T</strong>. Las opciones LEAPs (1 a 2 años) tienen un Vega gigantesco (ideales para especular con ciclos de volatilidad). Las opciones 0DTE tienen un Vega prácticamente cero.</p>
        `,
        chartTitle: "Impacto del IV Crush en la Prima de la Opción",
        chartDesc: "Compara la prima de la opción con IV inflado antes de un evento vs la prima tras el desplome de volatilidad (IV Crush).",
        controls: [
            { id: 'vegaIVBefore', label: 'IV Pre-Evento (%)', type: 'range', min: 40, max: 150, value: 90, step: 5 },
            { id: 'vegaIVAfter', label: 'IV Post-Evento (%)', type: 'range', min: 15, max: 60, value: 30, step: 5 },
            { id: 'vegaDTE', label: 'Días a Expiración (DTE)', type: 'range', min: 5, max: 90, value: 30, step: 5 }
        ],
        renderChart: () => {
            const ivBefore = parseFloat(document.getElementById('vegaIVBefore').value) / 100;
            const ivAfter = parseFloat(document.getElementById('vegaIVAfter').value) / 100;
            const dte = parseFloat(document.getElementById('vegaDTE').value);
            const T = dte / 365;
            const K = 100;
            const r = 0.04;

            const spots = [];
            const pricesBefore = [];
            const pricesAfter = [];

            for (let s = 80; s <= 120; s += 2) {
                spots.push(s);
                // Black Scholes Call Price Before
                const d1B = (Math.log(s / K) + (r + 0.5 * ivBefore * ivBefore) * T) / (ivBefore * Math.sqrt(T));
                const d2B = d1B - ivBefore * Math.sqrt(T);
                const callB = s * normCdf(d1B) - K * Math.exp(-r * T) * normCdf(d2B);

                // Call Price After
                const d1A = (Math.log(s / K) + (r + 0.5 * ivAfter * ivAfter) * T) / (ivAfter * Math.sqrt(T));
                const d2A = d1A - ivAfter * Math.sqrt(T);
                const callA = s * normCdf(d1A) - K * Math.exp(-r * T) * normCdf(d2A);

                pricesBefore.push(Number(callB.toFixed(2)));
                pricesAfter.push(Number(callA.toFixed(2)));
            }

            const ctx = document.getElementById('mainChart').getContext('2d');
            destroyCurrentChart();
            applyChartDefaults();

            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: spots,
                    datasets: [
                        { label: 'Prima Pre-Evento (IV ' + (ivBefore * 100).toFixed(0) + '%)', data: pricesBefore, borderColor: '#facc15', backgroundColor: 'rgba(250,204,21,0.1)', borderWidth: 2.5, tension: 0.2 },
                        { label: 'Prima Post-Crush (IV ' + (ivAfter * 100).toFixed(0) + '%)', data: pricesAfter, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 2.5, tension: 0.2 }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: true, position: 'top', labels: { color: '#94a3b8', font: { size: 10 } } } },
                    scales: {
                        x: { grid: { display: false }, title: { display: true, text: 'Precio Spot ($)', color: '#94a3b8', font: { size: 10 } } },
                        y: { grid: { color: 'rgba(148,163,184,0.1)' }, title: { display: true, text: 'Precio de la Opción ($)', color: '#94a3b8', font: { size: 10 } } }
                    }
                }
            });
            setCurrentChart(chart);

            const dropATM = (pricesBefore[10] - pricesAfter[10]).toFixed(2);
            document.getElementById('chart-description').innerHTML =
                'Colapso en ATM ($100): de <strong class="text-yellow-400">$' + pricesBefore[10] + '</strong> a <strong class="text-red-400">$' + pricesAfter[10] + '</strong> (Pérdida por Vega: <strong class="text-red-500">-$' + dropATM + '</strong> por contrato).';
        }
    },

    // =============================================
    // 6. LAS GRIEGAS — Rho (ρ)
    // =============================================
    {
        id: 6,
        category: "Las Griegas",
        title: "6. Rho: Tasas de Interés y Carry (ρ)",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Rho (ρ): El Impacto de las Tasas de Interés</h2>
            <p class="text-slate-300 mb-3"><strong>Rho</strong> mide la sensibilidad de la prima de una opción ante un cambio del 1% (100 puntos básicos) en la tasa de interés libre de riesgo (como las letras del Tesoro de EE.UU.):</p>

            <div class="bg-slate-900 border border-slate-700 p-2 rounded-lg text-center font-mono text-blue-300 text-sm mb-4">
                ρ = ∂V / ∂r &nbsp;&nbsp;|&nbsp;&nbsp; Calls: Rho Positivo (+) &nbsp;&nbsp;|&nbsp;&nbsp; Puts: Rho Negativo (-)
            </div>

            <h3 class="text-lg font-semibold text-white mt-4 mb-2">🏦 ¿Por qué las tasas afectan a las opciones?</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div class="bg-slate-800 p-3 rounded-lg border-t-2 border-green-500">
                    <p class="font-bold text-green-400 text-sm mb-1">Calls (Rho +): Se Encarecen</p>
                    <p class="text-slate-300 text-xs">Comprar un Call te da apalancamiento sin desembolsar el 100% del valor de las acciones. Ese capital ahorrado puede invertirse a una tasa del 5% en bonos soberanos. Además, el vendedor del call debe pagar intereses para financiar la compra de las acciones de cobertura.</p>
                </div>
                <div class="bg-slate-800 p-3 rounded-lg border-t-2 border-red-500">
                    <p class="font-bold text-red-400 text-sm mb-1">Puts (Rho -): Se Abaratan</p>
                    <p class="text-slate-300 text-xs">Un Put te da el derecho de vender y recibir efectivo en el futuro. A tasas de interés elevadas, el dinero recibido dentro de 6 o 12 meses tiene un valor presente descontado menor, reduciendo el precio del put hoy.</p>
                </div>
            </div>

            <div class="bg-slate-800 p-4 rounded-lg mb-3 border-l-4 border-blue-500">
                <strong class="text-blue-400">Relevancia en la Era de Tasas Altas (Fed Funds > 5%):</strong>
                <p class="text-slate-300 text-xs mt-1">En contratos LEAPs a 1 o 2 años, un cambio de tasa de 300 bps puede representar cientos de dólares de diferencia por contrato.</p>
            </div>
        `,
        chartTitle: "Curva de Rho: Impacto de las Tasas en Calls vs Puts",
        chartDesc: "Observa cómo tasas de interés más altas aumentan el valor de los Calls (verde) y deprimen el valor de los Puts (rojo).",
        controls: [
            { id: 'rhoRate', label: 'Tasa Libre de Riesgo (%)', type: 'range', min: 0, max: 10, value: 5, step: 0.5 },
            { id: 'rhoDTE', label: 'Plazo / DTE (días)', type: 'range', min: 30, max: 720, value: 365, step: 30 }
        ],
        renderChart: () => {
            const r = parseFloat(document.getElementById('rhoRate').value) / 100;
            const dte = parseFloat(document.getElementById('rhoDTE').value);
            const T = dte / 365;
            const K = 100;
            const iv = 0.25;

            const spots = [];
            const callRhos = [];
            const putRhos = [];

            for (let s = 80; s <= 120; s += 2) {
                spots.push(s);
                const d1 = (Math.log(s / K) + (r + 0.5 * iv * iv) * T) / (iv * Math.sqrt(T));
                const d2 = d1 - iv * Math.sqrt(T);

                const cRho = (K * T * Math.exp(-r * T) * normCdf(d2)) * 0.01;
                const pRho = (-K * T * Math.exp(-r * T) * normCdf(-d2)) * 0.01;

                callRhos.push(Number(cRho.toFixed(2)));
                putRhos.push(Number(pRho.toFixed(2)));
            }

            const ctx = document.getElementById('mainChart').getContext('2d');
            destroyCurrentChart();
            applyChartDefaults();

            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: spots,
                    datasets: [
                        { label: 'Call Rho ($ por 1% tasa)', data: callRhos, borderColor: '#20c997', borderWidth: 2.5, tension: 0.2 },
                        { label: 'Put Rho ($ por 1% tasa)', data: putRhos, borderColor: '#ff3366', borderWidth: 2.5, tension: 0.2 }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: true, position: 'top', labels: { color: '#94a3b8', font: { size: 10 } } } },
                    scales: {
                        x: { grid: { display: false }, title: { display: true, text: 'Precio Spot ($)', color: '#94a3b8', font: { size: 10 } } },
                        y: { grid: { color: 'rgba(148,163,184,0.1)' }, title: { display: true, text: 'Rho ($)', color: '#94a3b8', font: { size: 10 } } }
                    }
                }
            });
            setCurrentChart(chart);

            document.getElementById('chart-description').innerHTML =
                'Tasa actual: <strong class="text-white">' + (r * 100).toFixed(1) + '%</strong> | Plazo: <strong class="text-blue-400">' + dte + ' días</strong><br>' +
                'En contratos largos (LEAPs), Rho genera un <em>carry</em> favorable para los compradores de Calls y adverso para Puts.';
        }
    },

    // =============================================
    // 7. LAS GRIEGAS — Griegas de 2º Orden (Vanna, Charm, Volga)
    // =============================================
    {
        id: 7,
        category: "Las Griegas",
        title: "7. Griegas de 2º Orden: Vanna, Charm y Volga",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Griegas de Segundo Orden: El Arsenal Institucional</h2>
            <p class="text-slate-300 mb-3">En el trading cuantitativo avanzado y el modelado de Market Makers, las griegas de primer orden no son suficientes. Los grandes flujos de Wall Street son impulsados por las <strong>derivadas cruzadas</strong>:</p>

            <h3 class="text-lg font-semibold text-white mt-4 mb-2">1. Vanna (dΔ / dσ) y el "Vanna Rally"</h3>
            <p class="text-slate-300 text-sm mb-3">Mide cómo cambia Delta cuando cambia la Volatilidad Implícita (IV). Cuando el mercado cae en pánico, el VIX sube y los dealers tienen que vender más subyacente. Pero cuando el pánico se calma y el VIX se desploma, el <strong>efecto Vanna</strong> obliga mecánicamente a los creadores de mercado a recomprar millones de acciones/futuros para neutralizar su delta, provocando subidas explosivas sin catalizador fundamental.</p>

            <h3 class="text-lg font-semibold text-white mt-4 mb-2">2. Charm / Delta Decay (dΔ / dt)</h3>
            <p class="text-slate-300 text-sm mb-3">Mide cómo se desvanece Delta simplemente con el paso de los días. Los viernes de vencimiento semanal (OPEX), las deltas de las opciones OTM decaen hacia cero a marchas forzadas, forzando a los dealers a desarmar coberturas y produciendo el famoso efecto de arrastre de fin de semana.</p>

            <h3 class="text-lg font-semibold text-white mt-4 mb-2">3. Volga / Vomma (d²V / dσ²)</h3>
            <p class="text-slate-300 text-sm mb-3">Es la aceleración de Vega ante cambios de volatilidad. Explica por qué las opciones muy fuera del dinero (deep OTM) multiplican su valor por 10x o 50x en eventos de cisne negro (Black Swan).</p>
        `,
        chartTitle: "Perfil de Vanna a través de los Strikes",
        chartDesc: "Vanna es positivo en OTM Calls y negativo en OTM Puts. Un colapso de IV comprime este perfil y desata compras mecánicas.",
        controls: [
            { id: 'vannaIVShift', label: 'Cambio de IV / VIX (%)', type: 'range', min: -15, max: 15, value: 0, step: 1 },
            { id: 'vannaDTE', label: 'Días a Expiración', type: 'range', min: 5, max: 60, value: 25, step: 5 }
        ],
        renderChart: () => {
            const ivShift = parseFloat(document.getElementById('vannaIVShift').value) / 100;
            const dte = parseFloat(document.getElementById('vannaDTE').value);
            const T = dte / 365;
            const K = 100;
            const baseIV = Math.max(0.20 + ivShift, 0.05);

            const strikes = [];
            const vannaVals = [];

            for (let s = 80; s <= 120; s += 2) {
                strikes.push(s);
                const d1 = (Math.log(s / K) + (0.04 + 0.5 * baseIV * baseIV) * T) / (baseIV * Math.sqrt(T));
                const d2 = d1 - baseIV * Math.sqrt(T);
                // Vanna = -normPdf(d1) * d2 / baseIV
                const vanna = (-normPdf(d1) * d2 / baseIV) * 0.1;
                vannaVals.push(Number(vanna.toFixed(3)));
            }

            const ctx = document.getElementById('mainChart').getContext('2d');
            destroyCurrentChart();
            applyChartDefaults();

            const chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: strikes,
                    datasets: [{
                        label: 'Vanna Exposure',
                        data: vannaVals,
                        backgroundColor: vannaVals.map(v => v >= 0 ? 'rgba(32, 201, 151, 0.7)' : 'rgba(255, 51, 102, 0.7)'),
                        borderColor: vannaVals.map(v => v >= 0 ? '#20c997' : '#ff3366'),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false }, title: { display: true, text: 'Strikes ($)', color: '#94a3b8', font: { size: 10 } } },
                        y: { grid: { color: 'rgba(148,163,184,0.1)' }, title: { display: true, text: 'Vanna (dΔ / dσ)', color: '#94a3b8', font: { size: 10 } } }
                    }
                }
            });
            setCurrentChart(chart);

            document.getElementById('chart-description').innerHTML =
                'Cambio de IV: <strong class="' + (ivShift >= 0 ? 'text-red-400' : 'text-green-400') + '">' + (ivShift >= 0 ? '+' : '') + (ivShift * 100).toFixed(0) + '%</strong> | ' +
                (ivShift < 0 ? '🚀 <span class="text-green-400 font-semibold">Vanna Rally Activo:</span> El colapso del VIX obliga a los Market Makers a recomprar futuros para rebalancear Delta.' : '📉 <span class="text-red-400 font-semibold">Presión de Cobertura:</span> La expansión de IV fuerza ventas adicionales de subyacente.');
        }
    },

    // =============================================
    // 8. ESTRUCTURA DE MERCADO Y GEX — El Edge: Niveles Gamma (GEX)
    // =============================================
    {
        id: 8,
        category: "Estructura de Mercado y GEX",
        title: "8. El Edge: Niveles Gamma (GEX)",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Gamma Exposure (GEX)</h2>
            <p class="text-slate-300 mb-3">Aquí está tu <strong>Edge (ventaja cuantitativa)</strong>. El mercado está dominado por Market Makers que venden las opciones y deben cubrirse continuamente:</p>
            <div class="bg-slate-800 p-4 rounded-lg mb-4 border-l-4 border-green-500">
                <strong class="text-green-400">Gamma Positivo (Sticky Market):</strong><br>
                Los Market Makers tienen Gamma +. Si el mercado sube, ellos venden acciones. Si baja, compran. Esto actúa como un <em>imán</em>, suprimiendo la volatilidad.
            </div>
            <div class="bg-slate-800 p-4 rounded-lg mb-4 border-l-4 border-red-500">
                <strong class="text-red-400">Gamma Negativo (Volatile Market):</strong><br>
                Los Market Makers tienen Gamma -. Si el mercado baja, ellos <em>venden más</em> para cubrirse, acelerando la caída. Aumenta la volatilidad y hay movimientos bruscos.
            </div>
        `,
        chartTitle: "Perfil de Gamma por Strike (Market Makers)",
        chartDesc: "Barras verdes: Gamma positivo (imán y soporte/resistencia). Barras rojas: Gamma negativo (acelerador).",
        controls: [
            { id: 'spotPrice', label: 'Precio Actual del Mercado (Spot)', type: 'range', min: 3800, max: 4200, value: 4000, step: 10 }
        ],
        renderChart: () => {
            const spot = parseFloat(document.getElementById('spotPrice').value);
            const strikes = [3800, 3850, 3900, 3950, 4000, 4050, 4100, 4150, 4200];
            const gex = strikes.map(s => {
                let val = (s - 3950) * 2;
                if (s === 4000) val += 500;
                if (s === 3900) val -= 400;
                return val;
            });
            updateChartInstance('bar', strikes, gex, 'Exposición Gamma (GEX) en Millones',
                (ctx) => ctx.raw > 0 ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)'
            );
        }
    },

    // =============================================
    // 9. ESTRUCTURA DE MERCADO Y GEX — Volatility Skew
    // =============================================
    {
        id: 9,
        category: "Estructura de Mercado y GEX",
        title: "9. Volatility Skew",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">La "Sonrisa" de la Volatilidad</h2>
            <p class="text-slate-300 mb-3">Por el miedo a los colapsos de mercado (desde el Crash del 87), los inversores institucionales pagan primas sustancialmente más altas por los Puts (seguros) que por los Calls. Esto deforma la curva de Volatilidad Implícita creando el <strong>Volatility Smirk</strong>.</p>
            <ul class="list-disc pl-5 text-slate-300 space-y-2 mb-4">
                <li><strong>Skew muy empinado:</strong> Puts extremadamente caros = Pánico institucional. Frecuentemente precede rebotes alcistas.</li>
                <li><strong>Skew aplanado:</strong> Puts baratos = Complacencia en el mercado. Alerta de vulnerabilidad sistémica.</li>
            </ul>
        `,
        chartTitle: "Curva de Volatility Skew (Smirk)",
        chartDesc: "Eje Y: Volatilidad Implícita (%). Observa cómo los strikes bajos (Puts OTM) tienen mayor IV que los strikes altos (Calls OTM).",
        controls: [
            { id: 'fearLevel', label: 'Nivel de Miedo en el Mercado (VIX)', type: 'range', min: 10, max: 40, value: 20, step: 1 }
        ],
        renderChart: () => {
            const fear = parseFloat(document.getElementById('fearLevel').value);
            const strikes = [];
            const iv = [];
            for (let i = 80; i <= 120; i += 2) {
                strikes.push(i);
                let baseIv = 15;
                let slope = fear * 0.05;
                iv.push(baseIv + Math.pow(Math.max(0, 100 - i), 1.2) * slope + Math.pow(Math.max(0, i - 100), 1.1) * (slope * 0.3));
            }
            updateChartInstance('line', strikes, iv, 'Volatilidad Implícita (%)', 'rgba(168, 85, 247, 0.8)', true);
        }
    },

    // =============================================
    // 10. ESTRUCTURA DE MERCADO Y GEX — Net Gamma Multi-Expiración
    // =============================================
    {
        id: 10,
        category: "Estructura de Mercado y GEX",
        title: "10. Net Gamma Multi-Expiración",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Net Gamma Multi-Expiración</h2>
            <p class="text-slate-300 mb-3">El <strong>Net Gamma Multi-Expiración</strong> consolida todas las cadenas de opciones abiertas para mostrar los niveles estructurales definitivos:</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div class="bg-slate-800 p-3 rounded-lg border-t-2 border-green-500">
                    <p class="font-bold text-green-400 text-sm">Call Wall</p>
                    <p class="text-slate-300 text-xs">Strike con mayor GEX positivo. Actúa como resistencia magnética.</p>
                </div>
                <div class="bg-slate-800 p-3 rounded-lg border-t-2 border-red-500">
                    <p class="font-bold text-red-400 text-sm">Put Wall</p>
                    <p class="text-slate-300 text-xs">Strike con mayor GEX negativo. Soporte crítico o acelerador de caída.</p>
                </div>
            </div>
            <p class="text-slate-300 text-sm mb-3"><strong>Gamma Flip:</strong> La frontera crítica. Por encima = Volatilidad suprimida (Mean-Reversion). Por debajo = Volatilidad amplificada (Momentum).</p>
        `,
        chartTitle: "Net Gamma Multi-Expiración (Simulación QQQ)",
        chartDesc: "Barras verdes: GEX positivo. Barras rojas: GEX negativo. Línea amarilla punteada: Gamma Flip.",
        controls: [
            { id: 'gexSpotPrice', label: 'Spot Price (QQQ)', type: 'range', min: 460, max: 520, value: 490, step: 1 },
            { id: 'gexFlipPoint', label: 'Gamma Flip Level', type: 'range', min: 470, max: 510, value: 488, step: 1 },
            { id: 'gexMagnitude', label: 'Magnitud GEX (escala)', type: 'range', min: 50, max: 200, value: 100, step: 10 }
        ],
        renderChart: () => {
            const spot = parseFloat(document.getElementById('gexSpotPrice').value);
            const flipPoint = parseFloat(document.getElementById('gexFlipPoint').value);
            const magnitude = parseFloat(document.getElementById('gexMagnitude').value) / 100;

            const strikes = [];
            for (let s = 460; s <= 520; s += 2) strikes.push(s);

            const callWall = flipPoint + 22;
            const putWall = flipPoint - 18;

            const gexData = strikes.map(s => {
                let base = (s - flipPoint) * 1.2;
                base += 180 * Math.exp(-0.5 * Math.pow((s - callWall) / 3, 2));
                base -= 150 * Math.exp(-0.5 * Math.pow((s - putWall) / 3, 2));
                base += 40 * Math.exp(-0.5 * Math.pow((s - spot) / 5, 2));
                return Math.round(base * magnitude);
            });

            const regimeColor = spot >= flipPoint ? '#22c55e' : '#ef4444';
            const regimeText = spot >= flipPoint ? '🟢 Gamma POSITIVA (Mean-Reversion)' : '🔴 Gamma NEGATIVA (Momentum)';

            document.getElementById('chart-description').innerHTML =
                '<span style="color:' + regimeColor + '; font-weight:bold;">' + regimeText + '</span> | ' +
                'Spot: <strong class="text-white">' + spot + '</strong> | Flip: <strong class="text-yellow-400">' + flipPoint + '</strong>';

            const ctx = document.getElementById('mainChart').getContext('2d');
            destroyCurrentChart();
            applyChartDefaults();

            const chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: strikes,
                    datasets: [{
                        label: 'Net GEX ($M)',
                        data: gexData,
                        backgroundColor: gexData.map(v => v >= 0 ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.6)'),
                        borderColor: gexData.map(v => v >= 0 ? '#22c55e' : '#ef4444'),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false }, ticks: { callback: function(val, idx) { return idx % 2 === 0 ? this.getLabelForValue(val) : ''; } } },
                        y: { grid: { color: 'rgba(148,163,184,0.1)' } }
                    }
                }
            });
            setCurrentChart(chart);
        }
    },

    // =============================================
    // 11. ESTRUCTURA DE MERCADO Y GEX — Open Interest Multi-Expiración
    // =============================================
    {
        id: 11,
        category: "Estructura de Mercado y GEX",
        title: "11. Open Interest Multi-Expiración",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Open Interest Multi-Expiración</h2>
            <p class="text-slate-300 mb-3">El <strong>Open Interest (OI)</strong> representa el número total de contratos vivos que no han sido cerrados ni ejercidos. Al agregar <strong>todas las expiraciones</strong>, eliminamos el ruido del 0DTE y descubrimos las verdaderas murallas de capital institucional.</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div class="bg-slate-800 p-3 rounded-lg border-t-2 border-[#20c997]">
                    <p class="font-bold text-[#20c997] text-sm">🟢 Call OI: Techos y Covered Calls</p>
                    <p class="text-slate-300 text-xs">Concentración en strikes superiores (700-722). Resistencia institucional.</p>
                </div>
                <div class="bg-slate-800 p-3 rounded-lg border-t-2 border-[#ff3366]">
                    <p class="font-bold text-[#ff3366] text-sm">🔴 Put OI: Seguros Institucionales</p>
                    <p class="text-slate-300 text-xs">Picos masivos en strikes 650 y 680 (Put Walls). Soporte de cartera.</p>
                </div>
            </div>
            <p class="text-slate-300 text-sm"><strong>Horario del dato:</strong> El OI es auditado por la OCC una sola vez al día (publicado entre la 1:00 AM y las 6:30 AM EST).</p>
        `,
        chartTitle: "Open Interest Multi-Expiración (Distribución QQQ)",
        chartDesc: "Barras verdes: Call OI. Barras rojas: Put OI. Picos masivos de Puts en 650 y 680, y convergencia en 700.",
        controls: [
            { id: 'oiSpotPrice', label: 'Spot Price Simulado ($)', type: 'range', min: 630, max: 730, value: 692, step: 2 },
            { id: 'oiViewFilter', label: 'Modo (1: Ambos, 2: Solo Puts, 3: Solo Calls)', type: 'range', min: 1, max: 3, value: 1, step: 1 }
        ],
        renderChart: () => {
            const spot = parseFloat(document.getElementById('oiSpotPrice').value);
            const viewMode = parseInt(document.getElementById('oiViewFilter').value);

            const strikes = [];
            for (let s = 626; s <= 734; s += 2) strikes.push(s);

            const putPicks = { 630: 150, 640: 208, 644: 102, 650: 365, 662: 184, 670: 306, 676: 146, 680: 312, 690: 182, 700: 252, 710: 98, 716: 82, 722: 96, 726: 106, 730: 64 };
            const callPicks = { 630: 20, 640: 24, 650: 48, 662: 54, 670: 58, 680: 118, 690: 90, 700: 246, 704: 92, 710: 112, 716: 150, 722: 200, 726: 136, 730: 126 };

            const callData = strikes.map(s => callPicks[s] || Math.round(Math.sin(s * 0.5) * 4 + 7));
            const putData = strikes.map(s => putPicks[s] || Math.round(Math.cos(s * 0.4) * 5 + 9));

            const ctx = document.getElementById('mainChart').getContext('2d');
            destroyCurrentChart();
            applyChartDefaults();

            const datasets = [];
            if (viewMode === 1 || viewMode === 3) datasets.push({ label: 'Call OI (K)', data: callData, backgroundColor: '#20c997' });
            if (viewMode === 1 || viewMode === 2) datasets.push({ label: 'Put OI (K)', data: putData, backgroundColor: '#ff3366' });

            const chart = new Chart(ctx, {
                type: 'bar',
                data: { labels: strikes, datasets: datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: true, position: 'top', labels: { color: '#94a3b8', font: { size: 10 } } } },
                    scales: {
                        x: { grid: { display: false }, ticks: { callback: function(val, idx) { return [626,632,638,644,650,656,662,668,674,680,686,692,698,704,710,716,722,728,734].includes(strikes[idx]) ? strikes[idx] : ''; } } },
                        y: { grid: { color: 'rgba(148,163,184,0.1)' } }
                    }
                }
            });
            setCurrentChart(chart);

            document.getElementById('chart-description').innerHTML =
                'Put Wall Mayor: <strong class="text-red-400">$650 (365K)</strong> | Call Wall: <strong class="text-green-400">$722 (200K)</strong> | Convergencia: <strong class="text-yellow-400">$700</strong> | Spot: <strong class="text-white">$' + spot + '</strong>';
        }
    },

    // =============================================
    // 12. PLAN DE ACCIÓN — Leyendo tu Data Cuantitativa
    // =============================================
    {
        id: 12,
        category: "Plan de Acción",
        title: "12. Leyendo tu Data Cuantitativa",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">El Plan de Trading Cuantitativo</h2>
            <p class="text-slate-300 mb-3">Cada mañana antes de la campana, ejecuta esta rutina de 30 segundos:</p>
            <ol class="list-decimal pl-5 text-slate-300 space-y-3 mb-4">
                <li><strong>Ubica el Gamma Flip:</strong> Si el Spot está por encima, operamos <em>Mean Reversion</em>. Si cae por debajo, operamos <em>Breakouts y Momentum</em>.</li>
                <li><strong>Localiza el Call Wall:</strong> El techo máximo donde los creadores de mercado frenarán subidas.</li>
                <li><strong>Localiza el Put Wall:</strong> El piso estructural donde se concentra la mayor cobertura.</li>
            </ol>
        `,
        chartTitle: "Mapa de Calor Estructural del Mercado",
        chartDesc: "Visualización de Muros (Walls). El Call Wall frena las subidas, el Put Wall frena las bajadas.",
        controls: [],
        renderChart: () => {
            const strikes = ['3900 (Put Wall)', '3950', '4000 (Zero Gamma)', '4050', '4100 (Call Wall)'];
            const data = [-1500, -200, 50, 400, 2000];
            updateChartInstance('bar', strikes, data, 'Magnitud (Contratos x Gamma)',
                (ctx) => ctx.raw > 1000 ? 'rgba(59, 130, 246, 0.8)' : ctx.raw < -1000 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(148, 163, 184, 0.5)'
            );
        }
    },

    // =============================================
    // 13. ESTRATEGIAS — Long Straddle
    // =============================================
    {
        id: 13,
        category: "Estrategias",
        title: "13. Straddle (Volatilidad)",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Long Straddle: Comprar Volatilidad</h2>
            <p class="text-slate-300 mb-3">Consiste en comprar simultáneamente un Call y un Put exactamente al mismo strike y expiración. Apuesta a un <strong>movimiento explosivo</strong> sin importar la dirección.</p>
            <ul class="list-disc pl-5 text-slate-300 space-y-2 mb-4">
                <li><strong class="text-green-400">Griegas:</strong> Long Gamma (+), Long Vega (+), Short Theta (-).</li>
                <li><strong class="text-red-400">Enemigo:</strong> La lateralización y el sangrado temporal (Theta).</li>
            </ul>
        `,
        chartTitle: "Perfil de Riesgo: Long Straddle",
        chartDesc: "Ganas si el precio se aleja del Strike lo suficiente en cualquier dirección para cubrir el costo de ambas primas.",
        controls: [
            { id: 'straddleStrike', label: 'Strike (Call & Put)', type: 'range', min: 3800, max: 4200, value: 4000, step: 10 },
            { id: 'straddlePremium', label: 'Costo Total ($)', type: 'range', min: 10, max: 200, value: 100, step: 5 }
        ],
        renderChart: () => {
            const strike = parseFloat(document.getElementById('straddleStrike').value);
            const premium = parseFloat(document.getElementById('straddlePremium').value);
            const prices = [];
            const pnl = [];
            for (let i = 3700; i <= 4300; i += 10) {
                prices.push(i);
                pnl.push((Math.max(0, i - strike) + Math.max(0, strike - i)) - premium);
            }
            updateChartInstance('line', prices, pnl, 'P&L ($)',
                (ctx) => (ctx.p0?.parsed?.y < 0) ? 'rgba(239, 68, 68, 0.8)' : 'rgba(34, 197, 94, 0.8)'
            );
        }
    },

    // =============================================
    // 14. ESTRATEGIAS — Iron Condor
    // =============================================
    {
        id: 14,
        category: "Estrategias",
        title: "14. Iron Condor (Theta en Acción)",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Iron Condor: Cosechar el Tiempo</h2>
            <p class="text-slate-300 mb-3">Combina la venta de un Put Spread abajo y un Call Spread arriba para cobrar prima neta. Ganas el crédito completo si el precio se mantiene dentro del rango entre los strikes vendidos.</p>
            <ul class="list-disc pl-5 text-slate-300 space-y-2 mb-4">
                <li><strong class="text-green-400">Griegas:</strong> Delta Neutral (≈0), Long Theta (+), Short Vega (-).</li>
                <li><strong class="text-blue-400">Régimen Ideal:</strong> Gamma Positivo (Spot > Gamma Flip) y alta volatilidad implícita inicial.</li>
            </ul>
        `,
        chartTitle: "Perfil de P&L: Iron Condor al Vencimiento",
        chartDesc: "Meseta verde central de ganancia máxima limitada al crédito cobrado. Pérdida acotada por los strikes comprados.",
        controls: [
            { id: 'icBuyPut', label: 'Buy Put - Strike A', type: 'range', min: 410, max: 435, value: 420, step: 5 },
            { id: 'icSellPut', label: 'Sell Put - Strike B', type: 'range', min: 425, max: 445, value: 430, step: 5 },
            { id: 'icSellCall', label: 'Sell Call - Strike C', type: 'range', min: 455, max: 480, value: 470, step: 5 },
            { id: 'icBuyCall', label: 'Buy Call - Strike D', type: 'range', min: 465, max: 500, value: 480, step: 5 },
            { id: 'icPremium', label: 'Prima Neta Cobrada ($)', type: 'range', min: 50, max: 500, value: 250, step: 25 }
        ],
        renderChart: () => {
            const A = parseFloat(document.getElementById('icBuyPut').value);
            const B = parseFloat(document.getElementById('icSellPut').value);
            const C = parseFloat(document.getElementById('icSellCall').value);
            const D = parseFloat(document.getElementById('icBuyCall').value);
            const premium = parseFloat(document.getElementById('icPremium').value);

            const sorted = [A, B, C, D].sort((a, b) => a - b);
            const [sA, sB, sC, sD] = sorted;
            const maxLoss = Math.max((sB - sA) * 100, (sD - sC) * 100) - premium;

            const prices = [], pnl = [];
            for (let p = sA - 15; p <= sD + 15; p++) {
                prices.push(p);
                let putPnl = p <= sA ? -(sB - sA) * 100 : p < sB ? -(sB - p) * 100 : 0;
                let callPnl = p >= sD ? -(sD - sC) * 100 : p > sC ? -(p - sC) * 100 : 0;
                pnl.push(putPnl + callPnl + premium);
            }

            document.getElementById('chart-description').innerHTML =
                'Strikes: <strong class="text-green-400">' + sA + '</strong> — <strong class="text-red-400">' + sB + '</strong> ← <span class="text-green-300">Rango</span> → <strong class="text-red-400">' + sC + '</strong> — <strong class="text-green-400">' + sD + '</strong> | ' +
                'Ganancia Máx: <strong class="text-green-400">$' + premium + '</strong> | Pérdida Máx: <strong class="text-red-400">-$' + maxLoss + '</strong>';

            const ctx = document.getElementById('mainChart').getContext('2d');
            destroyCurrentChart();
            applyChartDefaults();

            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: prices,
                    datasets: [{
                        label: 'P&L ($)',
                        data: pnl,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.05)',
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0,
                        pointRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false } },
                        y: { grid: { color: 'rgba(148,163,184,0.1)' } }
                    }
                }
            });
            setCurrentChart(chart);
        }
    }
];
