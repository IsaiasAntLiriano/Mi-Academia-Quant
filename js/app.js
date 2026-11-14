/* ==========================================================================
   Academia Quant — Application Controller (UX Masterclass Pro 2.0)
   Coordina la navegación por acordeones, el progreso del estudiante,
   el buscador instantáneo, atajos de teclado y reactividad de simulación.
   ========================================================================== */

import { modules } from './data/modules.js';
import { handleResize } from './core/chartEngine.js';

let currentModuleId = 1;
const completedModules = new Set(JSON.parse(localStorage.getItem('quant_completed_modules') || '[]'));
const openCategories = new Set();
let searchQuery = '';

// Metadata visual por categoría (iconos y colores temáticos Quant)
const CATEGORY_META = {
    "Fundamentos y Mecánica Operativa": {
        icon: "📐",
        badgeColor: "text-emerald-400",
        badgeBg: "bg-emerald-500/10",
        badgeBorder: "border-emerald-500/30"
    },
    "Las Griegas y Modelado Cuantitativo": {
        icon: "📊",
        badgeColor: "text-purple-400",
        badgeBg: "bg-purple-500/10",
        badgeBorder: "border-purple-500/30"
    },
    "Estructura de Mercado y GEX": {
        icon: "⚡",
        badgeColor: "text-cyan-400",
        badgeBg: "bg-cyan-500/10",
        badgeBorder: "border-cyan-500/30"
    },
    "Estrategias de Ingresos y Cobertura": {
        icon: "🛡️",
        badgeColor: "text-amber-400",
        badgeBg: "bg-amber-500/10",
        badgeBorder: "border-amber-500/30"
    },
    "Spreads y Volatilidad": {
        icon: "🎯",
        badgeColor: "text-blue-400",
        badgeBg: "bg-blue-500/10",
        badgeBorder: "border-blue-500/30"
    }
};

/**
 * Obtiene los módulos únicos garantizados por ID.
 */
export function getUniqueModules() {
    const seenIds = new Set();
    const unique = [];

    modules.forEach(mod => {
        if (!seenIds.has(mod.id)) {
            seenIds.add(mod.id);
            unique.push(mod);
        }
    });

    return unique.sort((a, b) => a.id - b.id);
}

/**
 * Inicializa la aplicación completa.
 */
export function initApp() {
    // Abrir por defecto la primera categoría
    const uniqueMods = getUniqueModules();
    if (uniqueMods.length > 0) {
        openCategories.add(uniqueMods[0].category);
    }

    setupEventListeners();
    updateProgressUI();
    renderNavigation();
    loadModule(1);

    window.addEventListener('resize', handleResize);
}

/**
 * Configura los eventos globales de UI (Buscador, Teclado, Sidebar Toggle, etc.)
 */
function setupEventListeners() {
    // Buscador instantáneo
    const searchInput = document.getElementById('module-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            // Si hay búsqueda, expandir todas las categorías
            if (searchQuery.length > 0) {
                const uniqueMods = getUniqueModules();
                uniqueMods.forEach(m => openCategories.add(m.category));
            }
            renderNavigation();
        });
    }

    // Toggle de colapsar / expandir todas las categorías
    const toggleAllBtn = document.getElementById('toggle-all-cats-btn');
    if (toggleAllBtn) {
        toggleAllBtn.addEventListener('click', () => {
            const uniqueMods = getUniqueModules();
            const allCats = new Set(uniqueMods.map(m => m.category));
            if (openCategories.size >= allCats.size) {
                openCategories.clear();
                toggleAllBtn.innerText = 'Expandir todo';
            } else {
                allCats.forEach(c => openCategories.add(c));
                toggleAllBtn.innerText = 'Colapsar todo';
            }
            renderNavigation();
        });
    }

    // Toggle de la barra lateral (Modo Estudio Inmersivo)
    const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
    const sidebar = document.getElementById('sidebar-container');
    if (toggleSidebarBtn && sidebar) {
        toggleSidebarBtn.addEventListener('click', () => {
            sidebar.classList.toggle('hidden');
            handleResize();
        });
    }

    // Botones de navegación del Header
    const headerPrev = document.getElementById('header-prev-btn');
    const headerNext = document.getElementById('header-next-btn');
    if (headerPrev) headerPrev.addEventListener('click', navigatePrevious);
    if (headerNext) headerNext.addEventListener('click', navigateNext);

    // Botones de navegación del Footer
    const footerPrev = document.getElementById('footer-prev-btn');
    const footerNext = document.getElementById('footer-next-btn');
    if (footerPrev) footerPrev.addEventListener('click', navigatePrevious);
    if (footerNext) footerNext.addEventListener('click', navigateNext);

    // Botón de marcar como estudiado / completado
    const markBtn = document.getElementById('mark-completed-btn');
    if (markBtn) {
        markBtn.addEventListener('click', toggleModuleCompleted);
    }

    // Atajos de teclado para estudio ergonómico
    window.addEventListener('keydown', (e) => {
        // Ignorar si el usuario está escribiendo en el buscador
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.key === 'ArrowLeft') {
            navigatePrevious();
        } else if (e.key === 'ArrowRight') {
            navigateNext();
        } else if (e.key === '/') {
            e.preventDefault();
            searchInput?.focus();
        }
    });
}

/**
 * Alterna el estado de completado del módulo actual y lo persiste.
 */
function toggleModuleCompleted() {
    if (completedModules.has(currentModuleId)) {
        completedModules.delete(currentModuleId);
    } else {
        completedModules.add(currentModuleId);
    }

    localStorage.setItem('quant_completed_modules', JSON.stringify([...completedModules]));
    updateProgressUI();
    updateModuleCompletedButton();
    renderNavigation();
}

/**
 * Actualiza la barra de progreso general en Header y Sidebar.
 */
function updateProgressUI() {
    const total = getUniqueModules().length;
    const completed = completedModules.size;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Header
    const headerText = document.getElementById('header-progress-text');
    const headerBar = document.getElementById('header-progress-bar');
    if (headerText) headerText.innerText = `${percent}%`;
    if (headerBar) headerBar.style.width = `${percent}%`;

    // Sidebar
    const sidePercent = document.getElementById('sidebar-progress-percent');
    const sideBar = document.getElementById('sidebar-progress-bar');
    const sideCount = document.getElementById('sidebar-completed-count');
    if (sidePercent) sidePercent.innerText = `${percent}%`;
    if (sideBar) sideBar.style.width = `${percent}%`;
    if (sideCount) sideCount.innerText = `${completed} de ${total} módulos`;
}

/**
 * Actualiza el botón de estado "Marcar completado" en el header del módulo.
 */
function updateModuleCompletedButton() {
    const isDone = completedModules.has(currentModuleId);
    const icon = document.getElementById('mark-completed-icon');
    const text = document.getElementById('mark-completed-text');
    const btn = document.getElementById('mark-completed-btn');

    if (icon) icon.innerText = isDone ? '●' : '○';
    if (text) text.innerText = isDone ? 'Completado' : 'Marcar estudiado';

    if (btn) {
        if (isDone) {
            btn.className = 'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all';
        } else {
            btn.className = 'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all';
        }
    }
}

/**
 * Renderiza el menú lateral con acordeones, búsqueda y badges de progreso.
 */
export function renderNavigation() {
    const navMenu = document.getElementById('nav-menu');
    const mobileNav = document.getElementById('mobile-nav');

    if (!navMenu || !mobileNav) return;

    navMenu.replaceChildren();
    mobileNav.replaceChildren();

    const uniqueModules = getUniqueModules();

    // Agrupar por categoría
    const categories = {};
    uniqueModules.forEach(mod => {
        if (!categories[mod.category]) categories[mod.category] = [];
        categories[mod.category].push(mod);
    });

    for (const [categoryName, mods] of Object.entries(categories)) {
        // Filtrar módulos si hay búsqueda activa
        const filteredMods = searchQuery
            ? mods.filter(m => m.title.toLowerCase().includes(searchQuery) || categoryName.toLowerCase().includes(searchQuery))
            : mods;

        if (filteredMods.length === 0) continue;

        const meta = CATEGORY_META[categoryName] || { icon: "📌", badgeColor: "text-blue-400", badgeBg: "bg-blue-500/10", badgeBorder: "border-blue-500/30" };
        const isOpen = openCategories.has(categoryName) || searchQuery.length > 0;

        // Contenedor del Acordeón
        const catWrapper = document.createElement('div');
        catWrapper.className = 'rounded-xl overflow-hidden border border-slate-800/80 bg-slate-900/30 mb-2';

        // Cabecera clickeable del Acordeón
        const catHeader = document.createElement('button');
        catHeader.className = 'w-full flex items-center justify-between p-2.5 text-left bg-slate-800/50 hover:bg-slate-800/80 transition-colors text-xs font-bold text-slate-300 select-none';
        
        const leftGroup = document.createElement('div');
        leftGroup.className = 'flex items-center gap-2 truncate pr-2';
        leftGroup.innerHTML = `
            <span class="text-sm">${meta.icon}</span>
            <span class="truncate uppercase tracking-wider text-[11px] text-slate-300">${categoryName}</span>
        `;

        const rightGroup = document.createElement('div');
        rightGroup.className = 'flex items-center gap-1.5 flex-shrink-0';
        rightGroup.innerHTML = `
            <span class="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-700/60 text-slate-400">${filteredMods.length}</span>
            <span class="category-chevron text-slate-500 text-xs ${isOpen ? '' : 'rotated'}">▼</span>
        `;

        catHeader.appendChild(leftGroup);
        catHeader.appendChild(rightGroup);

        catHeader.onclick = () => {
            if (openCategories.has(categoryName)) {
                openCategories.delete(categoryName);
            } else {
                openCategories.add(categoryName);
            }
            renderNavigation();
        };

        catWrapper.appendChild(catHeader);

        // Lista de Módulos (Contenido del acordeón)
        const modList = document.createElement('div');
        modList.className = `category-content p-1 space-y-1 ${isOpen ? '' : 'collapsed'}`;

        filteredMods.forEach(mod => {
            const isCurrent = mod.id === currentModuleId;
            const isCompleted = completedModules.has(mod.id);

            const btn = document.createElement('button');
            btn.className = `sidebar-module-btn w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between mb-0.5 ${isCurrent ? 'active-module' : 'text-slate-300'}`;

            const modLeft = document.createElement('div');
            modLeft.className = 'flex items-center gap-2 truncate pr-2';

            const statusDot = document.createElement('span');
            statusDot.className = `w-1.5 h-1.5 rounded-full flex-shrink-0 ${isCompleted ? 'bg-emerald-400' : (isCurrent ? 'bg-blue-400' : 'bg-slate-600')}`;

            const titleSpan = document.createElement('span');
            titleSpan.className = 'truncate';
            titleSpan.innerText = mod.title;

            modLeft.appendChild(statusDot);
            modLeft.appendChild(titleSpan);

            btn.appendChild(modLeft);

            if (isCompleted) {
                const check = document.createElement('span');
                check.className = 'text-[10px] text-emerald-400 flex-shrink-0 font-mono';
                check.innerText = '✓';
                btn.appendChild(check);
            }

            btn.onclick = () => loadModule(mod.id);
            modList.appendChild(btn);

            // Opción Mobile
            const opt = document.createElement('option');
            opt.value = mod.id;
            opt.innerText = `${mod.id}. ${mod.title}`;
            if (isCurrent) opt.selected = true;
            mobileNav.appendChild(opt);
        });

        catWrapper.appendChild(modList);
        navMenu.appendChild(catWrapper);
    }

    mobileNav.onchange = (e) => loadModule(parseInt(e.target.value));
}

/**
 * Carga un módulo por su ID con actualización integral de la vista.
 * @param {number} id Identificador del módulo
 */
export function loadModule(id) {
    const uniqueMods = getUniqueModules();
    const targetMod = uniqueMods.find(m => m.id === id);

    if (!targetMod) {
        console.error(`Módulo con ID ${id} no encontrado.`);
        return;
    }

    currentModuleId = id;

    // Asegurar que la categoría del módulo actual esté abierta en el acordeón
    openCategories.add(targetMod.category);

    // Actualizar Header
    const headerTitle = document.getElementById('header-module-title');
    const headerCategory = document.getElementById('header-category-badge');
    if (headerTitle) headerTitle.innerText = targetMod.title;
    if (headerCategory) headerCategory.innerText = targetMod.category;

    // Actualizar Meta Barra Superior
    const metaCategory = document.getElementById('meta-category-badge');
    const metaInfo = CATEGORY_META[targetMod.category];
    if (metaCategory && metaInfo) {
        metaCategory.innerText = `${metaInfo.icon} ${targetMod.category.toUpperCase()}`;
        metaCategory.className = `text-xs font-semibold px-2.5 py-0.5 rounded-md ${metaInfo.badgeBg} ${metaInfo.badgeColor} border ${metaInfo.badgeBorder} font-mono`;
    }

    // Actualizar Contenido Teórico
    const theoryContent = document.getElementById('theory-content');
    if (theoryContent) theoryContent.innerHTML = targetMod.theory;

    // Actualizar Laboratorio Gráfico
    const chartTitle = document.getElementById('chart-title');
    const chartDesc = document.getElementById('chart-description');
    if (chartTitle) chartTitle.innerText = targetMod.chartTitle;
    if (chartDesc) chartDesc.innerHTML = targetMod.chartDesc;

    // Actualizar Controles Interactivos
    const controlsContainer = document.getElementById('controls-container');
    const interactivePanel = document.getElementById('interactive-controls');

    if (targetMod.controls && targetMod.controls.length > 0) {
        if (interactivePanel) interactivePanel.classList.remove('hidden');
        if (controlsContainer) {
            controlsContainer.replaceChildren();

            targetMod.controls.forEach(ctrl => {
                const wrapper = document.createElement('div');
                wrapper.className = 'flex flex-col gap-1';

                const labelRow = document.createElement('div');
                labelRow.className = 'flex justify-between items-center text-xs';

                const label = document.createElement('label');
                label.className = 'font-semibold text-slate-300';
                label.innerText = ctrl.label;

                const valSpan = document.createElement('span');
                valSpan.id = `${ctrl.id}-val`;
                valSpan.className = 'font-bold text-cyan-400 font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700';
                valSpan.innerText = ctrl.value;

                labelRow.appendChild(label);
                labelRow.appendChild(valSpan);

                const input = document.createElement('input');
                input.type = ctrl.type;
                input.id = ctrl.id;
                input.min = ctrl.min;
                input.max = ctrl.max;
                input.value = ctrl.value;
                input.step = ctrl.step;
                input.className = 'w-full cursor-pointer accent-blue-500';

                input.addEventListener('input', (e) => {
                    const spanEl = document.getElementById(`${ctrl.id}-val`);
                    if (spanEl) spanEl.innerText = e.target.value;
                    targetMod.renderChart(); // Actualización reactiva instantánea
                });

                wrapper.appendChild(labelRow);
                wrapper.appendChild(input);
                controlsContainer.appendChild(wrapper);
            });
        }
    } else {
        if (interactivePanel) interactivePanel.classList.add('hidden');
    }

    // Actualizar Botones de Navegación Anterior/Siguiente
    updateNavigationButtons(uniqueMods);

    // Actualizar Botón de Estado de Estudio
    updateModuleCompletedButton();

    // Actualizar Navegación en el Sidebar
    renderNavigation();

    // Renderizar gráfico del módulo
    if (typeof targetMod.renderChart === 'function') {
        targetMod.renderChart();
    }

    // Scroll al inicio del contenido en móviles y desktop
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Actualiza los botones Anterior y Siguiente del Header y Footer.
 */
function updateNavigationButtons(uniqueMods) {
    const currentIndex = uniqueMods.findIndex(m => m.id === currentModuleId);
    const prevMod = currentIndex > 0 ? uniqueMods[currentIndex - 1] : null;
    const nextMod = currentIndex < uniqueMods.length - 1 ? uniqueMods[currentIndex + 1] : null;

    // Header buttons
    const headerPrev = document.getElementById('header-prev-btn');
    const headerNext = document.getElementById('header-next-btn');
    if (headerPrev) headerPrev.disabled = !prevMod;
    if (headerNext) headerNext.disabled = !nextMod;

    // Footer buttons
    const footerPrev = document.getElementById('footer-prev-btn');
    const footerNext = document.getElementById('footer-next-btn');
    const footerPrevTitle = document.getElementById('footer-prev-title');
    const footerNextTitle = document.getElementById('footer-next-title');
    const footerCounter = document.getElementById('footer-module-counter');

    if (footerPrev) footerPrev.disabled = !prevMod;
    if (footerNext) footerNext.disabled = !nextMod;

    if (footerPrevTitle) footerPrevTitle.innerText = prevMod ? prevMod.title : 'Inicio';
    if (footerNextTitle) footerNextTitle.innerText = nextMod ? nextMod.title : 'Fin del curso';
    if (footerCounter) footerCounter.innerText = `Módulo ${currentModuleId} de ${uniqueMods.length}`;
}

/**
 * Navega al módulo anterior.
 */
export function navigatePrevious() {
    const uniqueMods = getUniqueModules();
    const currentIndex = uniqueMods.findIndex(m => m.id === currentModuleId);
    if (currentIndex > 0) {
        loadModule(uniqueMods[currentIndex - 1].id);
    }
}

/**
 * Navega al siguiente módulo.
 */
export function navigateNext() {
    const uniqueMods = getUniqueModules();
    const currentIndex = uniqueMods.findIndex(m => m.id === currentModuleId);
    if (currentIndex < uniqueMods.length - 1) {
        loadModule(uniqueMods[currentIndex + 1].id);
    }
}

// Exponer globalmente para eventos en HTML inline
window.loadModule = loadModule;

// Iniciar aplicación al cargar el DOM
window.addEventListener('DOMContentLoaded', initApp);
