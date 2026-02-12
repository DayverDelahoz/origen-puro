// ========================================
// FOOTER SIMPLIFICADO - FUNCIONAL
// ========================================

console.log('🦶 Footer.js cargado');

// Configuración del footer
const footerConfig = {
    siteName: "Origen Puro Coffee",
    tagline: "Café de especialidad premium",
    student: {
        name: "Davinci",
        code: "UO312162",
        university: "Universidad de Oviedo",
        course: "MIW Shop"
    },
    contact: {
        email: "info@origenpurocoffee.com",
        address: "Oviedo, Asturias, España"
    },
    social: [
        { platform: "Instagram", icon: '<i class="ph ph-instagram-logo" aria-hidden="true"></i>', url: "#" },
        { platform: "X", icon: '<i class="ph ph-x-logo" aria-hidden="true"></i>', url: "#" },
        { platform: "Facebook", icon: '<i class="ph ph-facebook-logo" aria-hidden="true"></i>', url: "#" }
    ]
};

// Función para generar el HTML del footer
function generateFooterHTML() {
    return `
        <footer class="footer">
            <div class="container">
                <div class="footer-content">
                    <!-- Contenido principal del footer -->
                    <div class="footer-main">
                        <div class="footer-brand">
                            <img src="img/logo.png" alt="Origen Puro Coffee" class="footer-logo">
                            <div class="footer-brand-text">
                                <h3>${footerConfig.siteName}</h3>
                                <p>${footerConfig.tagline}</p>
                            </div>
                        </div>
                        
                        <div class="footer-nav">
                            <h4>Navegación</h4>
                            <ul>
                                <li><a href="index.html">Inicio</a></li>
                                <li><a href="mis-compras.html">Mis Compras</a></li>
                                <li><a href="carrito.html">Carrito</a></li>
                            </ul>
                        </div>
                        
                        <div class="footer-contact">
                            <h4>Contacto</h4>
                            <p><span><i class="ph ph-envelope"></i></span> ${footerConfig.contact.email}</p>
                            <p><span><i class="ph ph-gps"></i></span> ${footerConfig.contact.address}</p>
                        </div>
                        
                        <div class="footer-social">
                            <h4>Síguenos</h4>
                            <div class="social-links">
                                ${footerConfig.social.map(social => `
                                    <a href="${social.url}" class="social-link" title="${social.platform}" aria-label="${social.platform}">
                                        ${social.icon}
                                    </a>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Footer bottom -->
                    <div class="footer-bottom">
                        <div class="footer-student">
                            <span><strong>${footerConfig.student.name}</strong> - ${footerConfig.student.code}</span>
                            <span>${footerConfig.student.university}</span>
                        </div>
                        <div class="footer-copyright">
                            <span>&copy; ${new Date().getFullYear()} ${footerConfig.siteName} - Todos los derechos reservados</span>
                            <span class="footer-academic">Proyecto académico - ${footerConfig.student.course}</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    `;
}

// Función para renderizar el footer
function renderFooter() {
    console.log('🦶 Renderizando footer...');
    
    // Buscar si ya existe un footer
    const existingFooter = document.querySelector('.footer');
    if (existingFooter) {
        existingFooter.remove();
        console.log('🗑️ Footer existente eliminado');
    }
    
    // Asegurar que las Phosphor icons estén cargadas (si no, insertarlas)
    try {
        const phScriptSelector = 'script[src*="@phosphor-icons/web"]';
        if (!document.querySelector(phScriptSelector)) {
            const ph = document.createElement('script');
            ph.src = 'https://unpkg.com/@phosphor-icons/web';
            ph.defer = true;
            document.head.appendChild(ph);
            console.log('🔌 Phosphor icons script inyectado dinámicamente');
        }
    } catch (e) {
        console.warn('⚠️ No se pudo inyectar Phosphor script:', e);
    }
    
    // Agregar el nuevo footer al final del body
    document.body.insertAdjacentHTML('beforeend', generateFooterHTML());
    console.log('✅ Footer renderizado correctamente');
}

// Función de inicialización
function initializeFooter() {
    console.log('🔧 Inicializando footer...');
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderFooter);
    } else {
        renderFooter();
    }
}

// Auto-inicializar
initializeFooter();

// Función global para inicializar elementos del sitio
function initializeSiteElements() {
    console.log('🏗️ Inicializando elementos del sitio...');
    
    // Asegurar que el footer esté presente
    if (!document.querySelector('.footer')) {
        renderFooter();
    }
    
    // Agregar cualquier otro elemento que sea necesario
    console.log('✅ Elementos del sitio inicializados');
}

// Hacer disponible globalmente
window.initializeSiteElements = initializeSiteElements;
window.renderFooter = renderFooter;

console.log('✅ Footer.js completamente cargado');