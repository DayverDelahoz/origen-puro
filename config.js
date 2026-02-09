// ========================================
// CONFIGURACIÓN DEL SITIO
// ========================================

const siteConfig = {
    // Información del sitio
    siteName: "Origen Puro Coffee",
    tagline: "Café de especialidad seleccionado",
    description: "Descubre cafés excepcionales de las mejores regiones del mundo",
    
    // Logo configuración
    logo: {
        main: "img/logo.png",
        alt: "Origen Puro Coffee",
        headerWidth: "200px",
        footerWidth: "150px"
    },
    
    // Información del estudiante
    student: {
        name: "Dayver De la hoz T",
        code: "UO312162",
        university: "Universidad de Oviedo",
        course: "MIW Shop"
    },
    
    // Enlaces del menú
    navigation: [
        { text: "Inicio", url: "index.html", icon: "🏠" },
        { text: "Mis Compras", url: "mis-compras.html", icon: "📦" },
        { text: "Carrito", url: "carrito.html", icon: "🛒", id: "cart-link" }
    ],
    
    // Información del footer
    footer: {
        sections: [
            {
                title: "Navegación",
                links: [
                    { text: "Inicio", url: "index.html" },
                    { text: "Mis Compras", url: "mis-compras.html" },
                    { text: "Carrito", url: "carrito.html" }
                ]
            },
            {
                title: "Información",
                links: [
                    { text: "Sobre nosotros", url: "#" },
                    { text: "Contacto", url: "#" },
                    { text: "Términos", url: "#" }
                ]
            }
        ],
        social: [
            { platform: "Instagram", url: "#", icon: "📸" },
            { platform: "Facebook", url: "#", icon: "👥" },
            { platform: "Twitter", url: "#", icon: "🐦" }
        ]
    },
    
    // Configuración de contacto
    contact: {
        email: "info@origenpurocoffee.com",
        phone: "+34 985 123 456",
        address: "Oviedo, Asturias, España"
    }
};

// Función para inicializar elementos dinámicos del sitio
function initializeSiteElements() {
    // Actualizar logo del sitio (solo imagen, sin texto)
    const logoElement = document.querySelector('.logo');
    if (logoElement) {
        logoElement.innerHTML = `
            <img src="${siteConfig.logo.main}" 
                 alt="${siteConfig.logo.alt}" 
                 class="header-logo-only" 
                 style="max-width: ${siteConfig.logo.headerWidth}; height: auto;">
        `;
    }
    
    // Actualizar contador del carrito siempre
    updateCartCounter();
}

// Función para actualizar contador del carrito
function updateCartCounter() {
    const cartLink = document.querySelector('#cart-count');
    if (cartLink) {
        try {
            // Intentar con objeto carrito primero
            if (typeof carrito !== 'undefined' && carrito.obtenerCantidadTotal && typeof carrito.obtenerCantidadTotal === 'function') {
                const count = carrito.obtenerCantidadTotal();
                cartLink.textContent = count;
                return;
            }
            
            // Si no funciona, usar localStorage directamente
            const carritoLS = localStorage.getItem('carrito');
            if (carritoLS) {
                const items = JSON.parse(carritoLS);
                const totalItems = items.reduce((total, item) => total + (item.cantidad || 1), 0);
                cartLink.textContent = totalItems;
                console.log('🔄 Contador actualizado desde localStorage:', totalItems);
            } else {
                cartLink.textContent = '0';
            }
        } catch (error) {
            console.error('Error actualizando contador:', error);
            // Fallback básico
            cartLink.textContent = '0';
        }
    }
}

// Exportar configuración para uso global
window.siteConfig = siteConfig;

// Función para integrar con el sistema de carrito existente
function integrarConCarrito() {
    // Sobrescribir actualizarContador del carrito si existe
    if (typeof carrito !== 'undefined' && carrito.actualizarContador) {
        const originalActualizarContador = carrito.actualizarContador;
        carrito.actualizarContador = function() {
            originalActualizarContador.call(this);
            updateCartCounter();
        };
    }
}

// Llamar integración cuando el carrito esté disponible
document.addEventListener('DOMContentLoaded', () => {
    // Esperar un poco para asegurar que main.js se ha cargado
    setTimeout(integrarConCarrito, 100);
});