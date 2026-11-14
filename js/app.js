/* ============================================
   Academia Quant — Application Controller
   Coordina la navegación, el renderizado de módulos
   y la reactividad de los controles interactivos.
   ============================================ */

import { modules } from './data/modules.js';
import { handleResize } from './core/chartEngine.js';

let currentModuleId = 1;

/**
 * Obtiene los módulos sin duplicados basados en ID y título.
 */
function getUniqueModules() {
    const seenIds = new Set();
    const seenTitles = new Set();
    const unique = [];

    modules.forEach(mod => {
        if (!seenIds.has(mod.id) && !seenTitles.has(mod.title)) {
            seenIds.add(mod.id);
            seenTitles.add(mod.title);
            unique.push(mod);
        }
    });

    return unique;
}

/**
 * Inicializa la aplicación: navegación, carga del primer módulo
 * y listeners globales.
 */
export function initApp() {
    renderNavigation();
    loadModule(1);

    // Ajustar el canvas del gráfico al redimensionar la ventana
    window.addEventListener('resize', handleResize);
}

/**
 * Renderiza el menú de navegación tanto para desktop (sidebar)
 * como para mobile (select dropdown), agrupados por categoría.
 */
export function renderNavigation() {
    const navMenu = document.getElementById('nav-menu');
    const mobileNav = document.getElementById('mobile-nav');

    if (!navMenu || !mobileNav) return;

    // Limpieza total del contenedor para evitar cualquier duplicación
    navMenu.replaceChildren();
    mobileNav.replaceChildren();

    const uniqueModules = getUniqueModules();

    // Agrupar módulos por categoría preservando el orden de aparición
    const categories = {};
    uniqueModules.forEach(mod => {
        if (!categories[mod.category]) categories[mod.category] = [];
        categories[mod.category].push(mod);
    });

    for (const [categoryName, mods] of Object.entries(categories)) {
        // Cabecera de Categoría para Desktop
        const catHeader = document.createElement('h3');
        catHeader.className = 'text-xs font-bold text-slate-500 uppercase tracking-wider mt-6 mb-2 pl-2';
        catHeader.innerText = categoryName;
        navMenu.appendChild(catHeader);

        // OptGroup de Categoría para Mobile
        const optGroup = document.createElement('optgroup');
        optGroup.label = categoryName;

        mods.forEach(mod => {
            // Botón Desktop
            const btn = document.createElement('button');
            btn.className = `w-full text-left px-4 py-2 rounded-lg transition-colors duration-200 text-sm text-slate-300 hover:bg-slate-700 hover:text-white mb-1 ${mod.id === currentModuleId ? 'active-tab' : ''}`;
            btn.innerText = mod.title;
            btn.onclick = () => loadModule(mod.id);
            navMenu.appendChild(btn);

            // Opción Mobile
            const opt = document.createElement('option');
            opt.value = mod.id;
            opt.innerText = mod.title;
            if (mod.id === currentModuleId) opt.selected = true;
            optGroup.appendChild(opt);
        });

        mobileNav.appendChild(optGroup);
    }

    // Evento para selector en pantallas móviles
    mobileNav.onchange = (e) => loadModule(parseInt(e.target.value));
}

/**
 * Carga un módulo por su ID: actualiza contenido teórico, controles y gráfico.
 * @param {number} id Identificador único del módulo
 */
export function loadModule(id) {
    currentModuleId = id;
    const uniqueModules = getUniqueModules();
    const module = uniqueModules.find(m => m.id === id);

    if (!module) {
        console.error(`Módulo con ID ${id} no encontrado.`);
        return;
    }

    // Actualizar estado visual de navegación
    renderNavigation();

    // Actualizar textos y títulos
    const headerTitle = document.getElementById('header-module-title');
    const theoryContent = document.getElementById('theory-content');
    const chartTitle = document.getElementById('chart-title');
    const chartDesc = document.getElementById('chart-description');

    if (headerTitle) headerTitle.innerText = module.title;
    if (theoryContent) theoryContent.innerHTML = module.theory;
    if (chartTitle) chartTitle.innerText = module.chartTitle;
    if (chartDesc) chartDesc.innerHTML = module.chartDesc;

    // Renderizar controles interactivos
    const controlsContainer = document.getElementById('controls-container');
    const interactivePanel = document.getElementById('interactive-controls');

    if (module.controls && module.controls.length > 0) {
        if (interactivePanel) interactivePanel.classList.remove('hidden');
        if (controlsContainer) {
            controlsContainer.replaceChildren();

            module.controls.forEach(ctrl => {
                const wrapper = document.createElement('div');
                wrapper.className = 'flex flex-col';

                const label = document.createElement('label');
                label.className = 'text-sm font-semibold text-slate-300 mb-1';
                label.innerText = `${ctrl.label}: `;

                const valSpan = document.createElement('span');
                valSpan.id = `${ctrl.id}-val`;
                valSpan.className = 'text-blue-400 font-bold';
                valSpan.innerText = ctrl.value;
                label.appendChild(valSpan);

                const input = document.createElement('input');
                input.type = ctrl.type;
                input.id = ctrl.id;
                input.min = ctrl.min;
                input.max = ctrl.max;
                input.value = ctrl.value;
                input.step = ctrl.step;
                input.className = 'w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500';

                input.addEventListener('input', (e) => {
                    const spanEl = document.getElementById(`${ctrl.id}-val`);
                    if (spanEl) spanEl.innerText = e.target.value;
                    module.renderChart(); // Re-renderizar gráfico en tiempo real al mover el control
                });

                wrapper.appendChild(label);
                wrapper.appendChild(input);
                controlsContainer.appendChild(wrapper);
            });
        }
    } else {
        if (interactivePanel) interactivePanel.classList.add('hidden');
    }

    // Renderizar gráfico inicial del módulo
    if (typeof module.renderChart === 'function') {
        module.renderChart();
    }
}

// Iniciar aplicación al cargar el DOM
window.addEventListener('DOMContentLoaded', initApp);
