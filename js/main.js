// ========================================
// MAIN.JS - FUNCIONES PRINCIPALES SIN DUPLICACIONES
// ========================================

console.log('🚀 Main.js cargado - Versión limpia');

// ========================================
// INICIALIZACIÓN PRINCIPAL DE PÁGINAS
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM cargado en main.js');
    
    // Detectar página actual
    const currentPage = window.location.pathname.split('/').pop();
    console.log('📍 Página actual:', currentPage);
    
    // Inicializar según la página
    switch(currentPage) {
        case 'index.html':
        case '':
            console.log('🏠 Inicializando página principal');
            initHomePage();
            break;
            
        case 'producto.html':
            console.log('☕ Inicializando página de producto');
            initProductPage();
            break;
            
        case 'carrito.html':
            console.log('Inicializando página de carrito');
            initCartPage();
            break;
            
        case 'mis-compras.html':
            console.log('📦 Inicializando página de compras');
            initOrdersPage();
            break;
            
        default:
            console.log('📄 Página genérica, inicialización básica');
            initBasicPage();
    }
    
    // Funciones comunes para todas las páginas
    initCommonFeatures();
});

// ========================================
// FUNCIONES DE INICIALIZACIÓN POR PÁGINA
// ========================================

function initHomePage() {
    console.log('🏠 Configurando página principal...');
    
    // Verificar si las funciones de config.js están disponibles
    if (typeof cargarProductosTop === 'function') {
        setTimeout(() => {
            cargarProductosTop();
            console.log('📦 Productos TOP solicitados');
        }, 500);
    }
    
    if (typeof cargarTodosProductos === 'function') {
        setTimeout(() => {
            cargarTodosProductos();
            console.log('📦 Todos los productos solicitados');
        }, 1000);
    }
}

function initProductPage() {
    console.log('☕ Configurando página de producto...');
    
    // Obtener ID del producto de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (productId) {
        console.log('🔍 ID de producto encontrado:', productId);
        
        // Verificar si la función de config.js está disponible
        if (typeof cargarProducto === 'function') {
            cargarProducto(productId);
        } else {
            console.warn('⚠️ Función cargarProducto no disponible');
        }
    } else {
        console.error('❌ No se encontró ID de producto en la URL');
        // Redirigir a la página principal si no hay ID
        window.location.href = 'index.html';
    }
}

function initCartPage() {
    console.log('Configurando página de carrito...');
    
    // La página de carrito maneja su propia inicialización
    // Solo verificamos que las funciones estén disponibles
    if (typeof mostrarCarrito === 'function') {
        console.log('✅ Función mostrarCarrito disponible');
    } else {
        console.warn('⚠️ Función mostrarCarrito no disponible');
    }
}

function initOrdersPage() {
    console.log('📦 Configurando página de pedidos...');
    
    // Verificar si la función de config.js está disponible
    if (typeof mostrarPedidos === 'function') {
        mostrarPedidos();
        console.log('📋 Pedidos solicitados');
    } else {
        console.warn('⚠️ Función mostrarPedidos no disponible');
    }
}

function initBasicPage() {
    console.log('📄 Inicialización básica para página genérica');
    
    // Solo inicialización común
    // Las páginas específicas manejan su propia lógica
}

// ========================================
// FUNCIONES COMUNES PARA TODAS LAS PÁGINAS
// ========================================

function initCommonFeatures() {
    console.log('🔧 Inicializando funciones comunes...');
    
    // Actualizar contador del carrito si está disponible
    if (typeof carrito !== 'undefined' && carrito.actualizarContador) {
        carrito.actualizarContador();
        console.log('Contador de carrito actualizado');
    }
    
    if (typeof updateCartCounter === 'function') {
        updateCartCounter();
    }
    
    // Inicializar elementos del sitio (footer, etc.)
    if (typeof initializeSiteElements === 'function') {
        initializeSiteElements();
        console.log('🏗️ Elementos del sitio inicializados');
    }
    
    // Configurar enlaces activos del menú
    setActiveMenuLink();
    
    console.log('✅ Funciones comunes inicializadas');
}

// ========================================
// UTILIDADES GENERALES
// ========================================

function setActiveMenuLink() {
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav a');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        
        // Obtener el href del enlace
        const linkPage = link.getAttribute('href');
        
        // Marcar como activo si coincide con la página actual
        if (linkPage === currentPage || 
            (currentPage === '' && linkPage === 'index.html') ||
            (currentPage === 'index.html' && linkPage === 'index.html')) {
            link.classList.add('active');
            console.log('🔗 Enlace activo marcado:', linkPage);
        }
    });
}

// ========================================
// FUNCIONES GLOBALES ADICIONALES
// ========================================

// Función global para agregar productos al carrito desde cualquier página
function agregarAlCarritoGlobal(producto, cantidad = 1) {
    console.log('Agregando al carrito desde main.js:', producto.name);
    
    if (typeof carrito !== 'undefined' && carrito.agregar) {
        carrito.agregar(producto, cantidad);
        
        // Mostrar mensaje de confirmación
        mostrarNotificacion('✅ Producto agregado al carrito', 'success');
        
        return true;
    } else {
        console.error('❌ Carrito no disponible');
        mostrarNotificacion('❌ Error agregando producto', 'error');
        return false;
    }
}

// Función para mostrar notificaciones temporales
function mostrarNotificacion(mensaje, tipo = 'info') {
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion notificacion-${tipo}`;
    notificacion.textContent = mensaje;
    
    // Estilos básicos para la notificación
    notificacion.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        z-index: 9999;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    // Colores según el tipo
    switch(tipo) {
        case 'success':
            notificacion.style.background = '#d4edda';
            notificacion.style.color = '#155724';
            notificacion.style.border = '1px solid #c3e6cb';
            break;
        case 'error':
            notificacion.style.background = '#f8d7da';
            notificacion.style.color = '#721c24';
            notificacion.style.border = '1px solid #f5c6cb';
            break;
        default:
            notificacion.style.background = '#d1ecf1';
            notificacion.style.color = '#0c5460';
            notificacion.style.border = '1px solid #bee5eb';
    }
    
    document.body.appendChild(notificacion);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        if (notificacion.parentNode) {
            notificacion.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                notificacion.parentNode.removeChild(notificacion);
            }, 300);
        }
    }, 3000);
}

// Función para formatear precios
function formatearPrecio(precio) {
    return `€${precio.toFixed(2)}`;
}

// Función para obtener parámetros de URL
function obtenerParametroURL(nombre) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(nombre);
}

// ========================================
// FUNCIONES PARA PÁGINA DE PRODUCTO (MIGRADA A PHP)
// ========================================

async function cargarProducto(id) {
    try {
        console.log('📦 Cargando producto desde PHP, ID:', id);
        console.log('🌐 URL PHP:', `${API_PHP}?id=${id}`);
        
        const response = await fetch(`${API_PHP}?id=${id}`);
        
        console.log('📡 Respuesta PHP:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }
        
        let producto = await response.json();
        
        console.log('📄 Datos recibidos desde PHP:', producto);
        
        // FIX: Si la API devuelve un array, tomar el primer elemento
        if (Array.isArray(producto)) {
            console.log('📋 API devolvió array, tomando primer elemento');
            producto = producto[0];
        }
        
        if (!producto || !producto.id) {
            throw new Error('Producto inválido o vacío');
        }
        
        mostrarDetalleProducto(producto);
        
        // Guardar producto en variable global para agregar al carrito
        window.productoActual = producto;
        
        console.log('✅ Producto cargado exitosamente desde PHP');
        
    } catch (error) {
        console.error('❌ ERROR cargando producto desde PHP:', error);
        console.error('🔍 Detalles del error:', error.message);
        
        // Fallback a API original
        try {
            console.log('🔄 Intentando con API Node.js...');
            console.log('🌐 URL Node.js:', `${API_URL}/products/${id}`);
            
            const response = await fetch(`${API_URL}/products/${id}`);
            
            console.log('📡 Respuesta Node.js:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
            }
            
            let producto = await response.json();
            
            console.log('📄 Datos recibidos desde Node.js:', producto);
            
            // FIX: Si la API devuelve un array, tomar el primer elemento
            if (Array.isArray(producto)) {
                console.log('📋 API devolvió array, tomando primer elemento');
                producto = producto[0];
            }
            
            if (!producto || !producto.id) {
                throw new Error('Producto inválido o vacío');
            }
            
            mostrarDetalleProducto(producto);
            window.productoActual = producto;
            
            console.log('✅ Producto cargado exitosamente desde Node.js (fallback)');
            
        } catch (fallbackError) {
            console.error('❌ Fallback también falló:', fallbackError);
            
            // Mostrar error en la página en lugar de redirigir
            const nombreElement = document.getElementById('producto-nombre');
            const descripcionElement = document.querySelector('.producto-info .producto-descripcion p');
            
            if (nombreElement) {
                nombreElement.textContent = 'Error cargando producto';
            }
            
            if (descripcionElement) {
                descripcionElement.innerHTML = `
                    <strong>Error:</strong> ${fallbackError.message}<br><br>
                    <a href="index.html" class="btn btn-primary">Volver a la tienda</a>
                `;
            }
        }
    }
}

function mostrarDetalleProducto(producto) {
    const precioOriginal = producto.price;
    const precioFinal = precioOriginal * (1 - producto.discount);
    const tieneDescuento = producto.discount > 0;
    
    const imagenPrincipal = producto.main_image || 'https://via.placeholder.com/600x600?text=Café';
    const imagenSecundaria = producto.secondary_image || '';
    
    document.getElementById('producto-nombre').textContent = producto.name;
    document.getElementById('producto-origen').textContent = obtenerOrigen(producto.name);
    document.getElementById('producto-descripcion').textContent = producto.description;
    
    document.getElementById('producto-img').src = imagenPrincipal;
    document.getElementById('producto-img').onerror = function() {
        this.src = 'https://via.placeholder.com/600x600?text=Café';
    };
    
    if (imagenSecundaria) {
        document.getElementById('producto-img-secondary').src = imagenSecundaria;
        document.getElementById('producto-img-secondary').style.display = 'block';
    } else {
        document.getElementById('producto-img-secondary').style.display = 'none';
    }
    
    document.getElementById('producto-precio').textContent = `€${precioFinal.toFixed(2)}`;
    
    if (tieneDescuento) {
        document.getElementById('precio-original').textContent = `€${precioOriginal.toFixed(2)}`;
        document.getElementById('precio-original').style.display = 'inline';
        document.getElementById('producto-descuento').textContent = `-${(producto.discount * 100).toFixed(0)}%`;
        document.getElementById('producto-descuento').style.display = 'inline';
    } else {
        document.getElementById('precio-original').style.display = 'none';
        document.getElementById('producto-descuento').style.display = 'none';
    }
}

// ========================================
// HACER FUNCIONES DISPONIBLES GLOBALMENTE
// ========================================

window.agregarAlCarritoGlobal = agregarAlCarritoGlobal;
window.mostrarNotificacion = mostrarNotificacion;
window.formatearPrecio = formatearPrecio;
window.obtenerParametroURL = obtenerParametroURL;

console.log('✅ Main.js completamente cargado - Sin duplicaciones');
console.log('🌐 Funciones globales de main.js:', {
    agregarAlCarritoGlobal: typeof window.agregarAlCarritoGlobal,
    mostrarNotificacion: typeof window.mostrarNotificacion,
    formatearPrecio: typeof window.formatearPrecio,
    obtenerParametroURL: typeof window.obtenerParametroURL
});

// Agregar estilos CSS para las animaciones de notificación
const styles = document.createElement('style');
styles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(styles);