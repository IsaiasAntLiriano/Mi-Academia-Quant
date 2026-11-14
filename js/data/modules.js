/* ============================================
   Academia Quant — Base de Datos de Módulos
   Ruta Pedagógica Secuencial (1 al 9)
   ============================================ */

import {
    updateChartInstance,
    destroyCurrentChart,
    applyChartDefaults,
    setCurrentChart
} from '../core/chartEngine.js';

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
            <p class="text-slate-300 mb-3">Una opción es un contrato que te da el <strong>derecho</strong> (pero no la obligación) de comprar o vender un activo a un precio fijo (<strong>Strike</strong>) en o antes de una fecha determinada (<strong>Expiración</strong>).</p>
            <ul class="list-disc pl-5 text-slate-300 space-y-2 mb-4">
                <li><strong class="text-green-400">CALL:</strong> Apuesta a que el precio subirá. Ganas si el precio de la acción supera el Strike + la prima que pagaste.</li>
                <li><strong class="text-red-400">PUT:</strong> Apuesta a que el precio bajará. Funciona como un seguro contra caídas.</li>
            </ul>
            <p class="text-sm text-slate-400">Mueve los controles abajo para ver cómo cambia el perfil de riesgo (Payoff) de comprar una opción Call.</p>
        `,
        chartTitle: "Perfil de Riesgo: Long Call",
        chartDesc: "La pérdida máxima está limitada a la prima pagada. Las ganancias teóricas son ilimitadas a medida que sube la acción.",
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
    // 2. FUNDAMENTOS — Las Griegas y Gamma
    // =============================================
    {
        id: 2,
        category: "Fundamentos",
        title: "2. Las Griegas y Gamma",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">La aceleración (Gamma)</h2>
            <p class="text-slate-300 mb-3">Para hacer trading cuantitativo, no miras solo el precio, miras las "Griegas".</p>
            <ul class="list-disc pl-5 text-slate-300 space-y-2 mb-4">
                <li><strong>Delta:</strong> Cuánto cambia el precio de la opción si la acción se mueve $1.</li>
                <li><strong class="text-blue-300">Gamma:</strong> Cuánto cambia <em>Delta</em> si la acción se mueve $1. Es la <strong>aceleración</strong>.</li>
            </ul>
            <p class="text-slate-300 mb-3">Gamma es más alta cuando la acción está exactamente en el precio Strike (At-The-Money). Aquí es donde el Delta cambia más violentamente.</p>
        `,
        chartTitle: "Curva de Gamma",
        chartDesc: "Nota cómo Gamma forma una 'campana' centrada en el Strike. Las opciones At-The-Money (ATM) tienen el Gamma más alto.",
        controls: [
            { id: 'gammaStrike', label: 'Precio Strike de la Opción ($)', type: 'range', min: 80, max: 120, value: 100, step: 1 },
        ],
        renderChart: () => {
            const strike = parseFloat(document.getElementById('gammaStrike').value);
            const prices = [];
            const gammaVals = [];
            for (let i = 70; i <= 130; i++) {
                prices.push(i);
                gammaVals.push(Math.exp(-0.5 * Math.pow((i - strike) / 5, 2)) * 0.1);
            }
            updateChartInstance('line', prices, gammaVals, 'Valor de Gamma', 'rgba(59, 130, 246, 0.8)', true);
        }
    },

    // =============================================
    // 3. LAS GRIEGAS — Theta y Decaimiento del Tiempo
    // =============================================
    {
        id: 3,
        category: "Las Griegas",
        title: "3. Theta: El Decaimiento del Tiempo",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Theta (Θ): El Decaimiento del Tiempo</h2>
            <p class="text-slate-300 mb-3"><strong>Theta (Θ)</strong> mide cuánto valor pierde una opción por cada día que pasa, manteniendo todo lo demás constante (precio del subyacente, volatilidad, etc.). Es literalmente el <em>precio del tiempo</em>.</p>
            <div class="bg-slate-800 p-4 rounded-lg mb-4 border-l-4 border-amber-500">
                <strong class="text-amber-400">💡 La Regla de Oro:</strong><br>
                <p class="text-slate-300 mt-1">El tiempo es el <strong>peor enemigo</strong> del comprador de opciones y el <strong>mejor amigo</strong> del vendedor. Cada día que pasa sin que el mercado se mueva a tu favor, tu opción pierde valor — y ese dinero va directo al bolsillo de quien te la vendió.</p>
            </div>
            <h3 class="text-lg font-semibold text-white mt-6 mb-2">📉 Theta Negativa vs. Theta Positiva</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div class="bg-slate-800 p-4 rounded-lg border-t-4 border-red-500">
                    <p class="font-bold text-red-400 mb-1">Θ Negativa — Comprador (Long)</p>
                    <ul class="list-disc pl-4 text-slate-300 text-sm mt-1 space-y-1">
                        <li>Compraste un Call o un Put → <strong>pagas Theta</strong> cada día.</li>
                        <li>Tu opción se deprecia con el tiempo como un auto nuevo sale del concesionario.</li>
                        <li>Necesitas que el mercado se mueva <em>rápido y fuerte</em> para compensar el sangrado.</li>
                        <li>Ejemplo: Θ = -0.05 → pierdes $5/día por contrato (×100 acciones).</li>
                    </ul>
                </div>
                <div class="bg-slate-800 p-4 rounded-lg border-t-4 border-green-500">
                    <p class="font-bold text-green-400 mb-1">Θ Positiva — Vendedor (Short)</p>
                    <ul class="list-disc pl-4 text-slate-300 text-sm mt-1 space-y-1">
                        <li>Vendiste un Call o un Put → <strong>cobras Theta</strong> cada día.</li>
                        <li>El tiempo trabaja <em>a tu favor</em> — ganas dinero simplemente esperando.</li>
                        <li>Estrategias como Credit Spreads, Iron Condors y Covered Calls se benefician de esto.</li>
                        <li>Ejemplo: Θ = +0.05 → ganas $5/día por contrato vendido.</li>
                    </ul>
                </div>
            </div>
            <h3 class="text-lg font-semibold text-white mt-6 mb-2">⚡ El Decaimiento NO es Lineal</h3>
            <p class="text-slate-300 mb-3">Este es el concepto más importante: la pérdida de valor temporal <strong>no es constante</strong>. La opción no pierde la misma cantidad cada día. El decaimiento sigue una curva que se <em>acelera brutalmente</em> en los últimos 30 días.</p>
            <div class="bg-slate-800 p-4 rounded-lg mb-4 border-l-4 border-purple-500">
                <strong class="text-purple-400">📐 Modelo Matemático Simplificado:</strong><br>
                <p class="text-slate-300 mt-1">El valor extrínseco (temporal) decae proporcionalmente a la <strong>raíz cuadrada del tiempo restante</strong>:</p>
                <p class="text-blue-300 font-mono mt-2 text-center text-lg">Valor ≈ k × √(DTE)</p>
                <p class="text-slate-400 text-sm mt-2">Donde DTE = Días Hasta Expiración. Esto significa que pasar de 60 a 50 DTE pierde poco valor, pero pasar de 10 a 0 DTE destruye la mayor parte del valor restante.</p>
            </div>
            <h3 class="text-lg font-semibold text-white mt-6 mb-2">🎯 ¿Quién Sufre Más Theta?</h3>
            <div class="overflow-x-auto mb-4">
                <table class="w-full text-sm text-left"><thead class="text-xs text-slate-400 uppercase bg-slate-800"><tr><th class="px-3 py-2 rounded-tl-lg">Tipo</th><th class="px-3 py-2">Theta Relativa</th><th class="px-3 py-2 rounded-tr-lg">¿Por qué?</th></tr></thead>
                <tbody class="text-slate-300">
                    <tr class="border-b border-slate-700"><td class="px-3 py-2 font-semibold text-yellow-400">ATM</td><td class="px-3 py-2 text-red-400 font-bold">🔥 Máxima</td><td class="px-3 py-2">Todo su valor es extrínseco (temporal). No tiene valor intrínseco. El decaimiento es devastador.</td></tr>
                    <tr class="border-b border-slate-700"><td class="px-3 py-2 font-semibold text-blue-400">OTM</td><td class="px-3 py-2 text-orange-400 font-bold">Media-Alta</td><td class="px-3 py-2">También es 100% valor extrínseco, pero empieza con menos valor absoluto, así que pierde menos en términos nominales.</td></tr>
                    <tr><td class="px-3 py-2 font-semibold text-green-400">ITM</td><td class="px-3 py-2 text-slate-400 font-bold">Baja</td><td class="px-3 py-2">Gran parte de su precio es valor intrínseco (real), que <strong>NO</strong> decae con el tiempo. Solo pierde la porción extrínseca.</td></tr>
                </tbody></table>
            </div>
            <h3 class="text-lg font-semibold text-white mt-6 mb-2">🛠️ Implicaciones Prácticas para Tu Trading</h3>
            <div class="bg-slate-800 p-4 rounded-lg mb-4 border-l-4 border-blue-500">
                <ul class="list-disc pl-5 text-slate-300 space-y-2">
                    <li><strong>Si compras opciones (Long):</strong> Usa expiraciones lejanas (45-60+ DTE) para minimizar el sangrado diario. Evita comprar opciones con menos de 21 DTE a menos que busques un evento binario (earnings, FOMC).</li>
                    <li><strong>Si vendes opciones (Short):</strong> Vende opciones con 30-45 DTE para capturar la zona de máxima aceleración de Theta. El "sweet spot" de los vendedores es entrar a 45 DTE y cerrar a 21 DTE.</li>
                    <li><strong>Fin de semana:</strong> Theta se cobra los 7 días de la semana (incluidos sábado y domingo). El viernes por la tarde, las opciones pierden ~3 días de Theta de golpe (se refleja el lunes al abrir).</li>
                </ul>
            </div>
            <p class="text-sm text-slate-400 italic mt-4">💡 Usa el selector en el gráfico para comparar cómo el decaimiento afecta a opciones ATM, OTM e ITM. Observa cómo la curva ATM colapsa exponencialmente en los últimos 20 días.</p>
        `,
        chartTitle: "Theta Decay: Valor Extrínseco vs. Días a Expiración",
        chartDesc: "Observa cómo el valor extrínseco decae según los días restantes. Las opciones ATM sufren el decaimiento más severo y no-lineal.",
        controls: [
            { id: 'thetaMoneyness', label: 'Moneyness (tipo de opción)', type: 'range', min: 1, max: 3, value: 1, step: 1 },
            { id: 'thetaIV', label: 'Volatilidad Implícita (%)', type: 'range', min: 15, max: 60, value: 30, step: 1 }
        ],
        renderChart: () => {
            const moneynessVal = parseInt(document.getElementById('thetaMoneyness').value);
            const iv = parseFloat(document.getElementById('thetaIV').value) / 100;
            const moneynessMap = { 1: 'ATM', 2: 'OTM', 3: 'ITM' };
            document.getElementById('thetaMoneyness-val').innerText = moneynessMap[moneynessVal];

            const dteLabels = [], atmValues = [], otmValues = [], itmValues = [];
            const strike = 100, spotATM = 100, spotOTM = 95, spotITM = 110;

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

            const mkDataset = (label, data, color, idx) => ({
                label, data,
                borderColor: moneynessVal === idx ? color.replace('0.25)', '1)').replace('0.8)', '1)') : color.replace('1)', '0.25)'),
                backgroundColor: moneynessVal === idx ? color.replace('1)', '0.1)') : 'transparent',
                borderWidth: moneynessVal === idx ? 3 : 1,
                fill: moneynessVal === idx, tension: 0.4, pointRadius: 0,
                pointHoverRadius: moneynessVal === idx ? 6 : 3,
                borderDash: moneynessVal === idx ? [] : [5, 5]
            });

            const datasets = [
                mkDataset('ATM (At-The-Money)', atmValues, 'rgba(250, 204, 21, 1)', 1),
                mkDataset('OTM (Out-Of-The-Money)', otmValues, 'rgba(59, 130, 246, 1)', 2),
                mkDataset('ITM (In-The-Money — solo extrínseco)', itmValues, 'rgba(34, 197, 94, 1)', 3)
            ];

            const descriptions = {
                1: '🟡 ATM destacada — Observa el colapso exponencial: el decaimiento se acelera brutalmente a partir de 30 DTE. A 10 DTE, la opción ATM ya perdió ~60% de su valor temporal.',
                2: '🔵 OTM destacada — Decaimiento más suave pero constante. Empieza con menos valor y se erosiona de forma más lineal. Llega a cero antes que la ATM en muchos casos.',
                3: '🟢 ITM destacada (solo valor extrínseco) — La porción temporal es pequeña respecto al precio total. El valor intrínseco ($10 en este ejemplo) NO decae con el tiempo.'
            };
            document.getElementById('chart-description').innerHTML = descriptions[moneynessVal];

            const chart = new Chart(ctx, {
                type: 'line',
                data: { labels: dteLabels, datasets },
                plugins: [{
                    id: 'thetaDangerZone',
                    afterDraw: (chart) => {
                        const xAxis = chart.scales.x, yAxis = chart.scales.y, ctx2 = chart.ctx;
                        const idx30 = dteLabels.indexOf(30), idx0 = dteLabels.indexOf(0);
                        if (idx30 >= 0 && idx0 >= 0) {
                            const xStart = xAxis.getPixelForValue(idx30), xEnd = xAxis.getPixelForValue(idx0);
                            ctx2.save(); ctx2.fillStyle = 'rgba(239, 68, 68, 0.06)';
                            ctx2.fillRect(xStart, yAxis.top, xEnd - xStart, yAxis.bottom - yAxis.top);
                            ctx2.fillStyle = 'rgba(239, 68, 68, 0.5)'; ctx2.font = 'bold 10px Inter, sans-serif'; ctx2.textAlign = 'center';
                            ctx2.fillText('⚠ ZONA DE ACELERACIÓN', (xStart + xEnd) / 2, yAxis.top + 14); ctx2.restore();
                        }
                        const idx21 = dteLabels.indexOf(21);
                        if (idx21 >= 0) {
                            const xPos = xAxis.getPixelForValue(idx21);
                            ctx2.save(); ctx2.strokeStyle = 'rgba(168, 85, 247, 0.6)'; ctx2.lineWidth = 1.5; ctx2.setLineDash([4, 4]);
                            ctx2.beginPath(); ctx2.moveTo(xPos, yAxis.top); ctx2.lineTo(xPos, yAxis.bottom); ctx2.stroke();
                            ctx2.fillStyle = 'rgba(168, 85, 247, 0.7)'; ctx2.font = '9px Inter, sans-serif'; ctx2.textAlign = 'center';
                            ctx2.fillText('21 DTE', xPos, yAxis.bottom + 12); ctx2.restore();
                        }
                    }
                }],
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    layout: { padding: { bottom: 16 } },
                    plugins: {
                        legend: { display: true, position: 'top', labels: { boxWidth: 12, font: { size: 10 }, color: '#94a3b8', usePointStyle: true } },
                        tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.95)', titleColor: '#fff', bodyColor: '#cbd5e1', borderColor: 'rgba(250, 204, 21, 0.5)', borderWidth: 1, callbacks: { title: (items) => 'DTE: ' + items[0].label + ' días', afterBody: (items) => { const dte = parseInt(items[0].label); if (dte <= 7) return '🔥 Zona crítica — Theta máxima'; if (dte <= 21) return '⚡ Aceleración fuerte del decaimiento'; if (dte <= 30) return '⚠ Comienza la aceleración'; return '✅ Decaimiento moderado'; } } }
                    },
                    scales: {
                        x: { reverse: true, grid: { display: false }, title: { display: true, text: 'Días hasta Expiración (DTE) →', color: '#94a3b8', font: { size: 11 } }, ticks: { callback: function(value) { const label = this.getLabelForValue(value); if ([60, 45, 30, 21, 14, 7, 0].includes(parseInt(label))) return label; return ''; }, font: { size: 10 } } },
                        y: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, title: { display: true, text: 'Valor Extrínseco ($)', color: '#94a3b8', font: { size: 11 } }, beginAtZero: true }
                    }
                }
            });
            setCurrentChart(chart);
        }
    },

    // =============================================
    // 4. QUANT TRADING — El Edge: Niveles Gamma (GEX)
    // =============================================
    {
        id: 4,
        category: "Quant Trading",
        title: "4. El Edge: Niveles Gamma (GEX)",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Gamma Exposure (GEX)</h2>
            <p class="text-slate-300 mb-3">Aquí está tu <strong>Edge (ventaja)</strong>. El mercado está dominado por Market Makers (creadores de mercado) que te venden las opciones. Ellos deben cubrirse (hedging).</p>
            <div class="bg-slate-800 p-4 rounded-lg mb-4 border-l-4 border-green-500">
                <strong class="text-green-400">Gamma Positivo (Sticky Market):</strong><br>
                Los Market Makers tienen Gamma +. Si el mercado sube, ellos venden acciones. Si baja, compran. Esto actúa como un <em>imán</em>, reduciendo la volatilidad. El precio se queda pegado en los "Niveles Gamma" altos.
            </div>
            <div class="bg-slate-800 p-4 rounded-lg mb-4 border-l-4 border-red-500">
                <strong class="text-red-400">Gamma Negativo (Volatile Market):</strong><br>
                Los Market Makers tienen Gamma -. Si el mercado baja, ellos <em>venden más</em> para cubrirse, acelerando la caída. Aumenta la volatilidad y hay movimientos bruscos.
            </div>
            <p class="text-sm text-slate-400">En la data cuantitativa buscas el "Zero Gamma Level" (Flip Point). Por encima es mercado tranquilo, por debajo es peligro/volatilidad.</p>
        `,
        chartTitle: "Perfil de Gamma por Strike (Market Makers)",
        chartDesc: "Las barras hacia arriba indican Gamma Positiva (actúan como resistencia/soporte magnético). Barras hacia abajo indican Gamma Negativo (riesgo de aceleración).",
        controls: [
            { id: 'spotPrice', label: 'Precio Actual del Mercado (Spot)', type: 'range', min: 3800, max: 4200, value: 4000, step: 10 },
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
    // 5. QUANT TRADING — Volatility Skew
    // =============================================
    {
        id: 5,
        category: "Quant Trading",
        title: "5. Volatility Skew",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">La "Sonrisa" de la Volatilidad</h2>
            <p class="text-slate-300 mb-3">En teoría, un Call y un Put equidistantes del precio actual deberían costar lo mismo en volatilidad. En la vida real, <strong>no es así</strong>.</p>
            <p class="text-slate-300 mb-3">Por el miedo a las caídas (Crash del 87), los inversores pagan mucho más por los Puts (seguros) que por los Calls. Esto deforma la volatilidad implícita creando un "Skew" o "Smirk".</p>
            <ul class="list-disc pl-5 text-slate-300 space-y-2 mb-4">
                <li><strong>Cómo usarlo:</strong> Si el Skew se empina mucho (Puts carísimos), el mercado tiene mucho miedo. Suele preceder rebotes. Si se aplana, hay complacencia.</li>
            </ul>
        `,
        chartTitle: "Curva de Volatility Skew (Smirk)",
        chartDesc: "El eje Y es Volatilidad Implícita (IV). Observa cómo los strikes bajos (Puts OTM) tienen mayor IV que los strikes altos (Calls OTM).",
        controls: [
            { id: 'fearLevel', label: 'Nivel de Miedo en el Mercado (VIX)', type: 'range', min: 10, max: 40, value: 20, step: 1 },
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
    // 6. ESTRUCTURA DE MERCADO Y GEX — Net Gamma Multi-Expiración
    // =============================================
    {
        id: 6,
        category: "Estructura de Mercado y GEX",
        title: "6. Net Gamma Multi-Expiración",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Net Gamma Multi-Expiración</h2>
            <p class="text-slate-300 mb-3">El <strong>Gamma Exposure (GEX)</strong> mide la exposición neta de Gamma que los Market Makers (dealers) mantienen en el mercado de opciones. A diferencia de los flujos 0DTE (que expiran el mismo día y solo reflejan el <em>ruido intradía</em>), el <strong>Net Gamma Multi-Expiración</strong> agrega <em>todas</em> las cadenas de opciones abiertas —semanales, mensuales, trimestrales— para revelar los verdaderos niveles estructurales donde los dealers deben cubrir (hedge) sus posiciones masivamente.</p>
            <p class="text-slate-300 mb-4">Cuando los dealers venden opciones a los clientes, heredan un perfil de Gamma que les <em>obliga</em> a comprar o vender el subyacente para mantenerse delta-neutral. Este comportamiento mecánico crea <strong>zonas de imán, muros y aceleradores</strong> en el precio.</p>
            <h3 class="text-lg font-semibold text-white mt-6 mb-2">📊 Anatomía del Gráfico</h3>
            <div class="bg-slate-800 p-4 rounded-lg mb-3 border-l-4 border-green-500">
                <strong class="text-green-400">Barras Verdes — GEX Positivo (Dealers Largos Gamma):</strong><br>
                <ul class="list-disc pl-5 text-slate-300 mt-1 space-y-1">
                    <li>Los dealers están <strong>largos gamma</strong>: si el precio sube, venden; si baja, compran.</li>
                    <li>Efecto: actúan como <strong>imán y freno</strong>, absorbiendo volatilidad.</li>
                    <li>El strike con la barra verde más alta es el <strong class="text-blue-300">Call Wall</strong> (techo magnético).</li>
                </ul>
            </div>
            <div class="bg-slate-800 p-4 rounded-lg mb-3 border-l-4 border-red-500">
                <strong class="text-red-400">Barras Rojas — GEX Negativo (Dealers Cortos Gamma):</strong><br>
                <ul class="list-disc pl-5 text-slate-300 mt-1 space-y-1">
                    <li>Los dealers están <strong>cortos gamma</strong>: si el precio baja, deben vender más; si sube, deben comprar más.</li>
                    <li>Efecto: actúan como <strong>acelerador</strong>, amplificando cada movimiento.</li>
                    <li>El strike con la barra roja más profunda es el <strong class="text-red-300">Put Wall</strong> (piso o zona de crash).</li>
                </ul>
            </div>
            <h3 class="text-lg font-semibold text-white mt-6 mb-2">🎯 Niveles Clave</h3>
            <div class="overflow-x-auto mb-4">
                <table class="w-full text-sm text-left"><thead class="text-xs text-slate-400 uppercase bg-slate-800"><tr><th class="px-3 py-2 rounded-tl-lg">Nivel</th><th class="px-3 py-2 rounded-tr-lg">Significado</th></tr></thead>
                <tbody class="text-slate-300">
                    <tr class="border-b border-slate-700"><td class="px-3 py-2 font-semibold text-blue-400">Call Wall</td><td class="px-3 py-2">Strike con mayor GEX positivo. Actúa como <strong>resistencia magnética</strong> (techo).</td></tr>
                    <tr class="border-b border-slate-700"><td class="px-3 py-2 font-semibold text-red-400">Put Wall</td><td class="px-3 py-2">Strike con mayor GEX negativo. Actúa como <strong>soporte o acelerador de caída</strong>.</td></tr>
                    <tr class="border-b border-slate-700"><td class="px-3 py-2 font-semibold text-yellow-400">Gamma Flip</td><td class="px-3 py-2">El punto donde GEX neto cruza de positivo a negativo. <strong>La frontera crítica</strong> entre regímenes.</td></tr>
                    <tr><td class="px-3 py-2 font-semibold text-slate-400">Niveles Secundarios</td><td class="px-3 py-2">Strikes con concentración notable de gamma pero menor al Wall. Actúan como soportes/resistencias intermedios.</td></tr>
                </tbody></table>
            </div>
            <h3 class="text-lg font-semibold text-white mt-6 mb-2">⚡ Los Dos Regímenes del Mercado</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div class="bg-slate-800 p-4 rounded-lg border-t-4 border-green-500">
                    <p class="font-bold text-green-400 mb-1">🟢 Spot ENCIMA del Gamma Flip</p>
                    <p class="text-slate-300 text-sm"><strong>Régimen:</strong> Gamma Positiva</p>
                    <ul class="list-disc pl-4 text-slate-300 text-sm mt-1 space-y-1">
                        <li>Volatilidad <strong>suprimida</strong> — los dealers absorben movimientos.</li>
                        <li>Estrategia ideal: <strong>Mean-reversion</strong> (comprar dips, vender rips).</li>
                        <li>El precio tiende a quedarse "pegado" cerca de los strikes de alto GEX.</li>
                        <li>Entorno de baja volatilidad realizada vs. implícita → vender premium funciona.</li>
                    </ul>
                </div>
                <div class="bg-slate-800 p-4 rounded-lg border-t-4 border-red-500">
                    <p class="font-bold text-red-400 mb-1">🔴 Spot DEBAJO del Gamma Flip</p>
                    <p class="text-slate-300 text-sm"><strong>Régimen:</strong> Gamma Negativa</p>
                    <ul class="list-disc pl-4 text-slate-300 text-sm mt-1 space-y-1">
                        <li>Volatilidad <strong>amplificada</strong> — los dealers aceleran cada movimiento.</li>
                        <li>Estrategia ideal: <strong>Momentum / Breakouts</strong> (seguir la tendencia).</li>
                        <li>El precio puede caer en cascada hacia el Put Wall.</li>
                        <li>Entorno de vol realizada > implícita → comprar premium funciona.</li>
                    </ul>
                </div>
            </div>
            <h3 class="text-lg font-semibold text-white mt-6 mb-2">✅ Checklist de Lectura Rápida (30 seg)</h3>
            <ol class="list-decimal pl-5 text-slate-300 space-y-2 mb-4">
                <li><strong>Ubica el Gamma Flip</strong> → ¿El spot está arriba o abajo? Define tu régimen.</li>
                <li><strong>Identifica el Call Wall</strong> → Ese es el techo del día / semana.</li>
                <li><strong>Identifica el Put Wall</strong> → Ese es el piso (o zona de peligro si se rompe).</li>
                <li><strong>Evalúa la magnitud</strong> → Barras muy altas = niveles con alto conviction. Barras pequeñas = débiles.</li>
                <li><strong>Compara con el precio actual</strong> → ¿Qué tan cerca estás del Flip? ¿Del Wall?</li>
            </ol>
            <h3 class="text-lg font-semibold text-white mt-6 mb-2">🚫 Errores Comunes a Evitar</h3>
            <div class="bg-red-900/20 border border-red-800 p-4 rounded-lg mb-3">
                <ul class="list-disc pl-5 text-slate-300 space-y-2">
                    <li><strong>Confundir 0DTE con Multi-Exp:</strong> Los flujos 0DTE son ruidosos y cambian minuto a minuto. Los niveles multi-expiración son <em>estructurales</em> y cambian gradualmente.</li>
                    <li><strong>Operar contra el régimen:</strong> Hacer mean-reversion en gamma negativa o perseguir momentum en gamma positiva destruye tu P&L.</li>
                    <li><strong>Ignorar la magnitud:</strong> No todos los Gamma Flips son iguales. Un Flip con barras pequeñas a ambos lados tiene poca fuerza. Busca concentración alta.</li>
                    <li><strong>Tratar los Walls como niveles exactos al pip:</strong> Son <em>zonas</em> (±5-10 puntos), no líneas exactas.</li>
                    <li><strong>No actualizar diariamente:</strong> El GEX cambia con cada sesión a medida que se abren y cierran posiciones en opciones.</li>
                </ul>
            </div>
            <p class="text-sm text-slate-400 italic mt-4">💡 Mueve el slider del Spot Price en los controles para ver cómo el perfil de gamma y el régimen del mercado cambian en tiempo real.</p>
        `,
        chartTitle: "Net Gamma Multi-Expiración (Simulación QQQ)",
        chartDesc: "Las barras verdes representan GEX positivo (imán/freno), las rojas GEX negativo (acelerador). La línea amarilla punteada marca el Gamma Flip.",
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
            const secondaryCallLevel = flipPoint + 10;
            const secondaryPutLevel = flipPoint - 8;

            const gexData = strikes.map(s => {
                let base = (s - flipPoint) * 1.2;
                base += 180 * Math.exp(-0.5 * Math.pow((s - callWall) / 3, 2));
                base -= 150 * Math.exp(-0.5 * Math.pow((s - putWall) / 3, 2));
                base += 80 * Math.exp(-0.5 * Math.pow((s - secondaryCallLevel) / 4, 2));
                base -= 60 * Math.exp(-0.5 * Math.pow((s - secondaryPutLevel) / 4, 2));
                base += 40 * Math.exp(-0.5 * Math.pow((s - spot) / 5, 2));
                return Math.round(base * magnitude);
            });

            const regimeColor = spot >= flipPoint ? '#22c55e' : '#ef4444';
            const regimeText = spot >= flipPoint
                ? '🟢 Gamma POSITIVA — Volatilidad suprimida, operar Mean-Reversion'
                : '🔴 Gamma NEGATIVA — Volatilidad amplificada, operar Momentum/Breakouts';

            let maxGex = -Infinity, minGex = Infinity;
            let callWallStrike = strikes[0], putWallStrike = strikes[0];
            gexData.forEach((val, i) => {
                if (val > maxGex) { maxGex = val; callWallStrike = strikes[i]; }
                if (val < minGex) { minGex = val; putWallStrike = strikes[i]; }
            });

            document.getElementById('chart-description').innerHTML =
                '<span style="color:' + regimeColor + '; font-weight:bold;">' + regimeText + '</span>' +
                '<br><span class="text-slate-400">Spot: <strong class="text-white">' + spot + '</strong> | ' +
                'Gamma Flip: <strong class="text-yellow-400">' + flipPoint + '</strong> | ' +
                'Call Wall: <strong class="text-blue-400">' + callWallStrike + '</strong> | ' +
                'Put Wall: <strong class="text-red-400">' + putWallStrike + '</strong></span>';

            const ctx = document.getElementById('mainChart').getContext('2d');
            destroyCurrentChart();
            applyChartDefaults();

            const bgColors = gexData.map((val, i) => {
                if (strikes[i] === callWallStrike && val > 0) return 'rgba(59, 130, 246, 0.9)';
                if (strikes[i] === putWallStrike && val < 0) return 'rgba(239, 68, 68, 0.9)';
                return val >= 0 ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.5)';
            });
            const borderColors = gexData.map((val, i) => {
                if (strikes[i] === callWallStrike && val > 0) return 'rgba(59, 130, 246, 1)';
                if (strikes[i] === putWallStrike && val < 0) return 'rgba(239, 68, 68, 1)';
                return val >= 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.7)';
            });

            const chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: strikes.map(s => {
                        if (s === callWallStrike && maxGex > 0) return s + ' (CW)';
                        if (s === putWallStrike && minGex < 0) return s + ' (PW)';
                        if (Math.abs(s - flipPoint) <= 1) return s + ' (Flip)';
                        return s;
                    }),
                    datasets: [{ label: 'Net GEX ($M notional)', data: gexData, backgroundColor: bgColors, borderColor: borderColors, borderWidth: 1, borderRadius: 3 }]
                },
                plugins: [{
                    id: 'gammaFlipLine',
                    afterDraw: (chart) => {
                        const xAxis = chart.scales.x, yAxis = chart.scales.y, ctx2 = chart.ctx;
                        const flipIdx = strikes.findIndex(s => Math.abs(s - flipPoint) <= 1);
                        if (flipIdx >= 0 && flipIdx < xAxis.ticks.length) {
                            const xPos = xAxis.getPixelForValue(flipIdx);
                            ctx2.save(); ctx2.strokeStyle = '#facc15'; ctx2.lineWidth = 2; ctx2.setLineDash([6, 4]);
                            ctx2.beginPath(); ctx2.moveTo(xPos, yAxis.top); ctx2.lineTo(xPos, yAxis.bottom); ctx2.stroke(); ctx2.restore();
                            ctx2.save(); ctx2.fillStyle = '#facc15'; ctx2.font = 'bold 10px Inter, sans-serif'; ctx2.textAlign = 'center';
                            ctx2.fillText('GAMMA FLIP', xPos, yAxis.top - 6); ctx2.restore();
                        }
                        const spotIdx = strikes.findIndex(s => Math.abs(s - spot) <= 1);
                        if (spotIdx >= 0 && spotIdx < xAxis.ticks.length) {
                            const xPos2 = xAxis.getPixelForValue(spotIdx);
                            ctx2.save(); ctx2.strokeStyle = '#ffffff'; ctx2.lineWidth = 2; ctx2.setLineDash([2, 3]);
                            ctx2.beginPath(); ctx2.moveTo(xPos2, yAxis.top); ctx2.lineTo(xPos2, yAxis.bottom); ctx2.stroke(); ctx2.restore();
                            ctx2.save(); ctx2.fillStyle = '#ffffff'; ctx2.font = 'bold 10px Inter, sans-serif'; ctx2.textAlign = 'center';
                            ctx2.fillText('SPOT ' + spot, xPos2, yAxis.bottom + 14); ctx2.restore();
                        }
                        const yZero = yAxis.getPixelForValue(0);
                        ctx2.save(); ctx2.strokeStyle = 'rgba(148, 163, 184, 0.4)'; ctx2.lineWidth = 1; ctx2.setLineDash([]);
                        ctx2.beginPath(); ctx2.moveTo(xAxis.left, yZero); ctx2.lineTo(xAxis.right, yZero); ctx2.stroke(); ctx2.restore();
                    }
                }],
                options: {
                    responsive: true, maintainAspectRatio: false,
                    layout: { padding: { bottom: 20, top: 16 } },
                    plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.95)', titleColor: '#fff', bodyColor: '#cbd5e1', borderColor: 'rgba(59, 130, 246, 0.5)', borderWidth: 1, callbacks: { afterBody: (items) => { const val = items[0].raw; if (val > 0) return '↑ Dealers largos gamma — efecto imán/freno'; if (val < 0) return '↓ Dealers cortos gamma — efecto acelerador'; return '— Zona neutral (Gamma Flip)'; } } } },
                    scales: { x: { grid: { display: false }, ticks: { maxRotation: 60, font: { size: 9 }, callback: function(value, index) { return index % 2 === 0 ? this.getLabelForValue(value) : ''; } } }, y: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, title: { display: true, text: 'Net GEX ($M)', color: '#94a3b8', font: { size: 11 } } } }
                }
            });
            setCurrentChart(chart);
        }
    },

    // =============================================
    // 7. PLAN DE ACCIÓN — Leyendo tu Data Cuantitativa
    // =============================================
    {
        id: 7,
        category: "Plan de Acción",
        title: "7. Leyendo tu Data Cuantitativa",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">El Plan de Trading</h2>
            <p class="text-slate-300 mb-3">Cuando abras tus herramientas de data cuantitativa cada mañana, busca estos 3 datos:</p>
            <ol class="list-decimal pl-5 text-slate-300 space-y-3 mb-4">
                <li><strong>Zero Gamma (Nivel Flip):</strong> Si el SPX está en 4100 y el Zero Gamma es 4050, estamos en Gamma Positivo. Operamos <em>Mean Reversion</em> (comprar soportes, vender resistencias). Si caemos bajo 4050, operamos <em>Breakouts/Momentum</em>.</li>
                <li><strong>Call Wall:</strong> El strike superior con más Gamma. Actúa como el "techo" absoluto del mercado ese día.</li>
                <li><strong>Put Wall:</strong> El strike inferior con más Gamma negativo. Actúa como piso (o como imán de crash si se rompe).</li>
            </ol>
            <p class="text-green-400 font-bold mt-4">¡Pídeme a través de Gémini que agregue calculadoras específicas o que profundice en estrategias como Iron Condors, Straddles o análisis de Order Flow en futuros módulos!</p>
        `,
        chartTitle: "Mapa de Calor Estructural del Mercado",
        chartDesc: "Visualización de Muros (Walls). El Call Wall frena las subidas, el Put Wall frena las bajadas.",
        controls: [],
        renderChart: () => {
            const strikes = ['3900 (Put Wall)', '3950', '4000 (Zero Gamma)', '4050', '4100 (Call Wall)'];
            const data = [-1500, -200, 50, 400, 2000];
            updateChartInstance('bar', strikes, data, 'Magnitud (Contratos x Gamma)',
                (ctx) => {
                    const val = ctx.raw;
                    if (val > 1000) return 'rgba(59, 130, 246, 0.8)';
                    if (val < -1000) return 'rgba(239, 68, 68, 0.8)';
                    return 'rgba(148, 163, 184, 0.5)';
                }
            );
        }
    },

    // =============================================
    // 8. ESTRATEGIAS — Straddle (Volatilidad)
    // =============================================
    {
        id: 8,
        category: "Estrategias",
        title: "8. Straddle (Volatilidad)",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Long Straddle</h2>
            <p class="text-slate-300 mb-3">Un <strong>Straddle</strong> consiste en comprar un Call y un Put exactamente al mismo precio Strike y misma fecha de expiración.</p>
            <p class="text-slate-300 mb-3">Se utiliza cuando esperas un <strong>movimiento explosivo</strong> (gran volatilidad, como un reporte de ganancias o datos de inflación CPI), pero no sabes en qué dirección.</p>
            <ul class="list-disc pl-5 text-slate-300 space-y-2 mb-4">
                <li><strong class="text-green-400">Riesgo:</strong> Limitado a las primas que pagaste. Ganas si el mercado se mueve fuerte hacia arriba o hacia abajo.</li>
                <li><strong class="text-red-400">Enemigo:</strong> El paso del tiempo (Theta) y que el mercado se quede lateralizado cerca del Strike original.</li>
            </ul>
        `,
        chartTitle: "Perfil de Riesgo: Long Straddle",
        chartDesc: "Ganas si el precio se aleja del Strike lo suficiente en cualquier dirección para cubrir el costo de ambas opciones.",
        controls: [
            { id: 'straddleStrike', label: 'Strike (Call & Put)', type: 'range', min: 3800, max: 4200, value: 4000, step: 10 },
            { id: 'straddlePremium', label: 'Costo Total (Call + Put)', type: 'range', min: 10, max: 200, value: 100, step: 5 }
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
    // 9. ESTRATEGIAS — Iron Condor (Theta en Acción)
    // =============================================
    {
        id: 9,
        category: "Estrategias",
        title: "9. Iron Condor (Theta en Acción)",
        theory: `
            <h2 class="text-2xl font-bold text-blue-400 mb-3">Iron Condor: Vendiendo Tiempo</h2>
            <p class="text-slate-300 mb-3">El <strong>Iron Condor</strong> es la estrategia reina de los traders que venden <em>Theta</em>. Combina dos credit spreads (uno de Calls arriba y uno de Puts abajo) para crear una zona de ganancia donde apuestas a que el precio se queda <strong>dentro de un rango</strong>.</p>
            <div class="bg-slate-800 p-4 rounded-lg mb-4 border-l-4 border-amber-500">
                <strong class="text-amber-400">💰 La Filosofía:</strong><br>
                <p class="text-slate-300 mt-1">No necesitas predecir la dirección. Solo necesitas que el mercado <strong>no se mueva demasiado</strong>. El paso del tiempo (Theta) trabaja a tu favor cada día, erosionando el valor de las opciones que vendiste.</p>
            </div>
            <h3 class="text-lg font-semibold text-white mt-6 mb-2">🦵 Las 4 Patas del Iron Condor</h3>
            <div class="overflow-x-auto mb-4">
                <table class="w-full text-sm text-left"><thead class="text-xs text-slate-400 uppercase bg-slate-800"><tr><th class="px-3 py-2 rounded-tl-lg">Pata</th><th class="px-3 py-2">Acción</th><th class="px-3 py-2">Strike</th><th class="px-3 py-2 rounded-tr-lg">Propósito</th></tr></thead>
                <tbody class="text-slate-300">
                    <tr class="border-b border-slate-700"><td class="px-3 py-2 font-semibold text-green-400">1. Buy Put</td><td class="px-3 py-2">Comprar</td><td class="px-3 py-2">Más bajo (A)</td><td class="px-3 py-2">Protección: limita tu pérdida máxima abajo</td></tr>
                    <tr class="border-b border-slate-700"><td class="px-3 py-2 font-semibold text-red-400">2. Sell Put</td><td class="px-3 py-2">Vender</td><td class="px-3 py-2">Bajo (B)</td><td class="px-3 py-2">Ingresos: cobras prima (Put Credit Spread)</td></tr>
                    <tr class="border-b border-slate-700"><td class="px-3 py-2 font-semibold text-red-400">3. Sell Call</td><td class="px-3 py-2">Vender</td><td class="px-3 py-2">Alto (C)</td><td class="px-3 py-2">Ingresos: cobras prima (Call Credit Spread)</td></tr>
                    <tr><td class="px-3 py-2 font-semibold text-green-400">4. Buy Call</td><td class="px-3 py-2">Comprar</td><td class="px-3 py-2">Más alto (D)</td><td class="px-3 py-2">Protección: limita tu pérdida máxima arriba</td></tr>
                </tbody></table>
            </div>
            <div class="bg-slate-800 p-4 rounded-lg mb-4 border-l-4 border-blue-500">
                <strong class="text-blue-400">Ejemplo concreto (SPY a $450):</strong><br>
                <p class="text-slate-300 mt-1 text-sm font-mono">Buy Put 420 | <strong class="text-red-300">Sell Put 430</strong> | <strong class="text-red-300">Sell Call 470</strong> | Buy Call 480<br>Prima neta cobrada: ~$2.50 × 100 = <strong class="text-green-400">$250 crédito</strong><br>Pérdida máxima: (10 - 2.50) × 100 = <strong class="text-red-400">$750</strong><br>Zona de ganancia: SPY entre <strong>430</strong> y <strong>470</strong> al vencimiento.</p>
            </div>
            <h3 class="text-lg font-semibold text-white mt-6 mb-2">⚖️ Perfil de Riesgo / Recompensa</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div class="bg-slate-800 p-4 rounded-lg border-t-4 border-green-500">
                    <p class="font-bold text-green-400 mb-1">✅ Ganancia Máxima</p>
                    <p class="text-slate-300 text-sm">= Prima neta cobrada</p>
                    <p class="text-slate-400 text-xs mt-1">Se obtiene si el precio cierra entre los dos strikes vendidos (B y C) al vencimiento. Las 4 opciones expiran sin valor → te quedas con todo el crédito.</p>
                </div>
                <div class="bg-slate-800 p-4 rounded-lg border-t-4 border-red-500">
                    <p class="font-bold text-red-400 mb-1">❌ Pérdida Máxima</p>
                    <p class="text-slate-300 text-sm">= Ancho del spread – Prima cobrada</p>
                    <p class="text-slate-400 text-xs mt-1">Se da si el precio cierra más allá de los strikes comprados (A o D). El ancho del spread limita tu pérdida gracias a las patas de protección.</p>
                </div>
            </div>
            <h3 class="text-lg font-semibold text-white mt-6 mb-2">🧠 Cuándo Usar un Iron Condor</h3>
            <ul class="list-disc pl-5 text-slate-300 space-y-2 mb-4">
                <li><strong>Gamma Positiva (Spot > Gamma Flip):</strong> El mercado está en modo "sticky", volatilidad suprimida → ambiente ideal para vender opciones.</li>
                <li><strong>IV Rank alto (>50%):</strong> La volatilidad implícita está inflada → las primas son caras → cobras más por vender.</li>
                <li><strong>Sin eventos binarios cercanos:</strong> Evita earnings, FOMC, CPI dentro del período de la operación.</li>
                <li><strong>DTE óptimo: 30-45 días:</strong> Maximiza la curva de Theta decay (el "sweet spot" que viste en el módulo anterior).</li>
            </ul>
            <h3 class="text-lg font-semibold text-white mt-6 mb-2">🔧 Gestión de la Posición</h3>
            <div class="bg-slate-800 p-4 rounded-lg mb-4 border-l-4 border-purple-500">
                <ul class="list-disc pl-5 text-slate-300 space-y-2 text-sm">
                    <li><strong>Take Profit:</strong> Cierra al 50% del crédito máximo (si cobraste $250, cierra cuando puedas recomprar por $125). No esperes a expiración.</li>
                    <li><strong>Stop Loss:</strong> Cierra si la pérdida alcanza 2× el crédito cobrado ($500 en el ejemplo).</li>
                    <li><strong>Rolling:</strong> Si un lado está amenazado, puedes "rolar" (cerrar y reabrir más lejos) para dar más espacio al precio.</li>
                    <li><strong>Delta neutral:</strong> Un Iron Condor bien centrado empieza con Delta ≈ 0, Theta > 0, Vega < 0.</li>
                </ul>
            </div>
            <p class="text-sm text-slate-400 italic mt-4">💡 Mueve los sliders para ver cómo cambia el perfil de P&L al ajustar los strikes y la prima cobrada. Observa la "meseta" de ganancia máxima entre los strikes vendidos.</p>
        `,
        chartTitle: "Perfil de P&L: Iron Condor al Vencimiento",
        chartDesc: "La meseta verde central es tu zona de ganancia máxima. Más allá de los strikes vendidos, la pérdida crece hasta el strike comprado donde se limita.",
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
                '<span class="text-slate-400">Strikes: </span><strong class="text-green-400">' + sA + '</strong> — <strong class="text-red-400">' + sB + '</strong> ← <span class="text-green-300">zona de ganancia</span> → <strong class="text-red-400">' + sC + '</strong> — <strong class="text-green-400">' + sD + '</strong>' +
                '<br><span class="text-green-400">Ganancia máx: $' + premium + '</span> | <span class="text-red-400">Pérdida máx: -$' + maxLoss + '</span> | <span class="text-slate-400">Breakevens: ' + (sB - premium / 100).toFixed(0) + ' / ' + (sC + premium / 100).toFixed(0) + '</span>';

            const ctx = document.getElementById('mainChart').getContext('2d');
            destroyCurrentChart();
            applyChartDefaults();

            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: prices,
                    datasets: [{
                        label: 'P&L al Vencimiento ($)', data: pnl,
                        borderColor: 'rgba(59, 130, 246, 1)', backgroundColor: 'rgba(59, 130, 246, 0.05)',
                        borderWidth: 2.5, fill: true, tension: 0, pointRadius: 0, pointHoverRadius: 6,
                        segment: {
                            borderColor: (ctx) => { const y = ctx.p0?.parsed?.y; return y === undefined ? 'rgba(59,130,246,1)' : y >= 0 ? 'rgba(34,197,94,1)' : 'rgba(239,68,68,1)'; },
                            backgroundColor: (ctx) => { const y = ctx.p0?.parsed?.y; return y === undefined ? 'rgba(59,130,246,0.05)' : y >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'; }
                        }
                    }]
                },
                plugins: [{
                    id: 'ironCondorAnnotations',
                    afterDraw: (chart) => {
                        const xAxis = chart.scales.x, yAxis = chart.scales.y, ctx2 = chart.ctx;
                        const yZero = yAxis.getPixelForValue(0);
                        ctx2.save(); ctx2.strokeStyle = 'rgba(148,163,184,0.3)'; ctx2.lineWidth = 1; ctx2.setLineDash([4, 4]);
                        ctx2.beginPath(); ctx2.moveTo(xAxis.left, yZero); ctx2.lineTo(xAxis.right, yZero); ctx2.stroke(); ctx2.restore();
                        [{ val: sA, color: '#22c55e', label: 'A: ' + sA, dash: [3, 3] }, { val: sB, color: '#ef4444', label: 'B: ' + sB, dash: [6, 3] }, { val: sC, color: '#ef4444', label: 'C: ' + sC, dash: [6, 3] }, { val: sD, color: '#22c55e', label: 'D: ' + sD, dash: [3, 3] }].forEach(s => {
                            const idx = prices.indexOf(s.val); if (idx < 0) return;
                            const xPos = xAxis.getPixelForValue(idx);
                            ctx2.save(); ctx2.strokeStyle = s.color; ctx2.lineWidth = 1.5; ctx2.setLineDash(s.dash); ctx2.globalAlpha = 0.6;
                            ctx2.beginPath(); ctx2.moveTo(xPos, yAxis.top); ctx2.lineTo(xPos, yAxis.bottom); ctx2.stroke(); ctx2.restore();
                            ctx2.save(); ctx2.fillStyle = s.color; ctx2.font = 'bold 9px Inter, sans-serif'; ctx2.textAlign = 'center';
                            ctx2.fillText(s.label, xPos, yAxis.top - 4); ctx2.restore();
                        });
                        const idxB = prices.indexOf(sB), idxC = prices.indexOf(sC);
                        if (idxB >= 0 && idxC >= 0) {
                            ctx2.save(); ctx2.fillStyle = 'rgba(34,197,94,0.06)';
                            ctx2.fillRect(xAxis.getPixelForValue(idxB), yAxis.top, xAxis.getPixelForValue(idxC) - xAxis.getPixelForValue(idxB), yAxis.bottom - yAxis.top);
                            ctx2.restore();
                        }
                    }
                }],
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    layout: { padding: { top: 16, bottom: 8 } },
                    plugins: {
                        legend: { display: false },
                        tooltip: { backgroundColor: 'rgba(15,23,42,0.95)', titleColor: '#fff', bodyColor: '#cbd5e1', borderColor: 'rgba(59,130,246,0.5)', borderWidth: 1, callbacks: { title: (items) => 'Precio al Vencimiento: $' + items[0].label, label: (item) => { const v = item.raw; return 'P&L: ' + (v >= 0 ? '+' : '') + '$' + v.toFixed(0); }, afterBody: (items) => { const p = parseFloat(items[0].label); if (p >= sB && p <= sC) return '✅ Zona de ganancia máxima'; if (p < sA || p > sD) return '❌ Pérdida máxima alcanzada'; return '⚠ Zona de pérdida parcial'; } } }
                    },
                    scales: {
                        x: { grid: { display: false }, title: { display: true, text: 'Precio del Subyacente al Vencimiento ($)', color: '#94a3b8', font: { size: 11 } }, ticks: { callback: function(value) { const l = parseInt(this.getLabelForValue(value)); if (l === sA || l === sB || l === sC || l === sD) return '$' + l; if (l % 10 === 0) return '$' + l; return ''; }, font: { size: 9 } } },
                        y: { grid: { color: 'rgba(148,163,184,0.1)' }, title: { display: true, text: 'Ganancia / Pérdida ($)', color: '#94a3b8', font: { size: 11 } } }
                    }
                }
            });
            setCurrentChart(chart);
        }
    }
];
