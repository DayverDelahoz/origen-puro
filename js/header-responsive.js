// ========================================
// HEADER RESPONSIVE - JAVASCRIPT COMPLETO Y FUNCIONAL
// ========================================

console.log('🍔 Header-responsive.js cargado - Versión completa');

// Función principal para alternar el menú hamburguesa
function toggleMenu() {
    console.log('🍔 toggleMenu() llamada');
    
    const nav = document.getElementById('nav-menu');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (!nav) {
        console.error('❌ Elemento nav-menu no encontrado - Verifica que tenga id="nav-menu"');
        return;
    }
    
    if (!menuToggle) {
        console.error('❌ Elemento menu-toggle no encontrado');
        return;
    }
    
    const isActive = nav.classList.contains('active');
    console.log('📱 Estado actual del menú:', isActive ? 'abierto' : 'cerrado');
    
    if (isActive) {
        // Cerrar menú
        nav.classList.remove('active');
        menuToggle.classList.remove('open');
        // show hamburger icon via CSS
        menuToggle.setAttribute('aria-expanded', 'false');
        // remove focus trap when closed
        releaseFocusTrap(nav, menuToggle);
        console.log('📱 Menú cerrado');
    } else {
        // Abrir menú
        nav.classList.add('active');
        menuToggle.classList.add('open');
        menuToggle.setAttribute('aria-expanded', 'true');
        // trap focus inside menu
        trapFocus(nav, menuToggle);
        console.log('📱 Menú abierto');
    }
}

// Función para cerrar el menú al hacer clic en un enlace
function closeMenuOnLinkClick() {
    console.log('🔗 Cerrando menú por clic en enlace');
    
    const nav = document.getElementById('nav-menu');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (nav && nav.classList.contains('active')) {
        nav.classList.remove('active');
        if (menuToggle) {
            menuToggle.innerHTML = '☰';
            menuToggle.setAttribute('aria-expanded', 'false');
        }
        console.log('📱 Menú cerrado automáticamente por enlace');
    }
}

// Función para cerrar el menú al redimensionar la ventana
function handleResize() {
    const nav = document.getElementById('nav-menu');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (window.innerWidth > 768) {
        // En escritorio/tablet grande, cerrar menú móvil
        if (nav && nav.classList.contains('active')) {
            nav.classList.remove('active');
            console.log('📱 Menú cerrado por redimensión a escritorio');
        }
        if (menuToggle) {
            menuToggle.classList.remove('open');
            menuToggle.setAttribute('aria-expanded', 'false');
        }
    }
}

// Función para manejar el scroll del header (efecto de reducción)
function handleHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;
    
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
}

// Función para cerrar menú al hacer clic fuera de él
function handleOutsideClick(event) {
    const nav = document.getElementById('nav-menu');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (!nav || !menuToggle) return;
    
    // Si el menú está abierto y el clic no fue dentro del nav ni en el botón
    if (nav.classList.contains('active')) {
        if (!nav.contains(event.target) && !menuToggle.contains(event.target)) {
            closeMenuOnLinkClick();
            console.log('📱 Menú cerrado por clic fuera');
        }
    }
}

// Función para manejar teclas de escape
function handleKeyDown(event) {
    if (event.key === 'Escape') {
        const nav = document.getElementById('nav-menu');
        if (nav && nav.classList.contains('active')) {
            closeMenuOnLinkClick();
            console.log('📱 Menú cerrado por tecla Escape');
        }
    }
}

// Función de inicialización principal
function initializeResponsiveHeader() {
    console.log('🔧 Inicializando header responsive completo...');
    
    try {
        // Verificar elementos necesarios
        const menuToggle = document.querySelector('.menu-toggle');
        const nav = document.getElementById('nav-menu');
        
        if (!menuToggle) {
            console.warn('⚠️ Menú hamburguesa (.menu-toggle) no encontrado en esta página');
        } else {
            console.log('✅ Menú hamburguesa encontrado');
            
            // Configurar atributos de accesibilidad
            menuToggle.setAttribute('aria-label', 'Abrir menú de navegación');
            menuToggle.setAttribute('aria-expanded', 'false');
            menuToggle.setAttribute('aria-controls', 'nav-menu');
            // ensure icons visibility state
            const iconClose = menuToggle.querySelector('.icon-close');
            const iconOpen = menuToggle.querySelector('.icon-hamburger');
            if (iconClose) iconClose.style.display = 'none';
            if (iconOpen) iconOpen.style.display = '';
        }
        
        if (!nav) {
            console.warn('⚠️ Elemento nav (#nav-menu) no encontrado');
        } else {
            console.log('✅ Nav encontrado');
            nav.setAttribute('aria-hidden', 'false');
        }
        
        // Event listeners para enlaces del menú
        const navLinks = document.querySelectorAll('.nav a');
        console.log('🔗 Enlaces de navegación encontrados:', navLinks.length);
        
        navLinks.forEach((link, index) => {
            link.addEventListener('click', closeMenuOnLinkClick);
            console.log(`🔗 Event listener agregado al enlace ${index + 1}`);
        });
        
        // Event listeners globales
        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleHeaderScroll);
        document.addEventListener('click', handleOutsideClick);
        document.addEventListener('keydown', handleKeyDown);
        // update CSS variable for header height on init and on resize
        setHeaderHeight();
        window.addEventListener('resize', setHeaderHeight);

        // Observe header size changes (logo swapping, etc.)
        const headerEl = document.querySelector('.header');
        if (headerEl && 'ResizeObserver' in window) {
            const ro = new ResizeObserver(() => setHeaderHeight());
            ro.observe(headerEl);
        }
        
        console.log('✅ Event listeners configurados:');
        console.log('   - Resize window ✓');
        console.log('   - Scroll header ✓'); 
        console.log('   - Outside click ✓');
        console.log('   - Keyboard ✓');
        
        // Ejecutar handleHeaderScroll una vez para estado inicial
        handleHeaderScroll();
        
        console.log('✅ Header responsive inicializado completamente');
        
    } catch (error) {
        console.error('❌ Error inicializando header responsive:', error);
    }
}

// Set CSS variable --header-height to match header offsetHeight
function setHeaderHeight() {
    const header = document.querySelector('.header');
    if (!header) return;
    const h = header.offsetHeight || 80;
    document.documentElement.style.setProperty('--header-height', h + 'px');
}

// Focus trap utility: keep focus within nav and toggle while menu open
let _focusTrapHandler = null;
function trapFocus(nav, menuToggle) {
    const focusable = nav.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
    const nodes = Array.from(focusable);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];

    function handleTrap(e) {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }
    }

    _focusTrapHandler = handleTrap;
    document.addEventListener('keydown', handleTrap);
    // set initial focus
    setTimeout(() => {
        const focusTarget = nav.querySelector('a') || menuToggle;
        if (focusTarget) focusTarget.focus();
    }, 50);
}

function releaseFocusTrap(nav, menuToggle) {
    if (_focusTrapHandler) {
        document.removeEventListener('keydown', _focusTrapHandler);
        _focusTrapHandler = null;
    }
}

// Función de limpieza (para si es necesario remover listeners)
function cleanupResponsiveHeader() {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('scroll', handleHeaderScroll);
    document.removeEventListener('click', handleOutsideClick);
    document.removeEventListener('keydown', handleKeyDown);
    console.log('🧹 Event listeners del header removidos');
}

// Auto-inicializar cuando se carga el DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeResponsiveHeader);
    console.log('⏳ Esperando DOMContentLoaded...');
} else {
    // DOM ya está cargado
    initializeResponsiveHeader();
}

// Hacer funciones disponibles globalmente
window.toggleMenu = toggleMenu;
window.closeMenuOnLinkClick = closeMenuOnLinkClick;
window.handleResize = handleResize;
window.handleHeaderScroll = handleHeaderScroll;
window.initializeResponsiveHeader = initializeResponsiveHeader;
window.cleanupResponsiveHeader = cleanupResponsiveHeader;

// Debug info
console.log('✅ Header-responsive.js completamente cargado');
console.log('🌐 Funciones globales disponibles:', {
    toggleMenu: typeof window.toggleMenu,
    closeMenuOnLinkClick: typeof window.closeMenuOnLinkClick,
    handleResize: typeof window.handleResize,
    handleHeaderScroll: typeof window.handleHeaderScroll,
    initializeResponsiveHeader: typeof window.initializeResponsiveHeader
});