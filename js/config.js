// ========================================
// CONFIGURACIÓN DEFINITIVA
// ========================================

const API_URL = 'http://localhost:8080/api';
const API_PHP = 'api/productos.php';
const API_PHP_PEDIDOS = 'api/pedidos.php';
const COSTO_ENVIO = 4.95;

console.log('🔧 Config.js cargado - Origen Puro Coffee');

// ========================================
// CLASE CARRITO
// ========================================

class Carrito {
    constructor() {
    this.items = JSON.parse(localStorage.getItem('carrito')) || [];
    console.log('Carrito inicializado con', this.items.length, 'items');
    }

    agregar(producto, cantidad = 1) {
        const existe = this.items.find(item => item.id === producto.id);
        
        if (existe) {
            existe.cantidad += cantidad;
        } else {
            this.items.push({ 
                ...producto, 
                cantidad: cantidad 
            });
        }
        
        this.guardar();
        this.actualizarContador();
        console.log('✅ Producto agregado al carrito:', producto.name);
    }

    eliminar(productoId) {
        this.items = this.items.filter(item => item.id !== productoId);
        this.guardar();
        this.actualizarContador();
    }

    actualizarCantidad(productoId, cantidad) {
        const item = this.items.find(item => item.id === productoId);
        if (item) {
            item.cantidad = parseInt(cantidad);
            if (item.cantidad <= 0) {
                this.eliminar(productoId);
            } else {
                this.guardar();
            }
        }
    }

    obtenerSubtotal() {
        return this.items.reduce((total, item) => {
            const precio = this.calcularPrecioFinal(item.price, item.discount);
            return total + (precio * item.cantidad);
        }, 0);
    }

    obtenerTotal() {
        return this.obtenerSubtotal() + COSTO_ENVIO;
    }

    calcularPrecioFinal(precio, descuento = 0) {
        return precio * (1 - descuento);
    }

    vaciar() {
        this.items = [];
        this.guardar();
        this.actualizarContador();
    }

    guardar() {
        localStorage.setItem('carrito', JSON.stringify(this.items));
    }

    actualizarContador() {
        const contador = document.getElementById('cart-count');
        if (contador) {
            const total = this.items.reduce((sum, item) => sum + item.cantidad, 0);
            contador.textContent = total;
        }
    }

    obtenerCantidadTotal() {
        return this.items.reduce((sum, item) => sum + item.cantidad, 0);
    }
}

// Instancia global del carrito
const carrito = new Carrito();

// ========================================
// FUNCIONES GLOBALES NECESARIAS
// ========================================

function updateCartCounter() {
    if (carrito && carrito.actualizarContador) {
        carrito.actualizarContador();
    }
}

// ========================================
// FUNCIONES PARA CHECKOUT PAYPAL - USADAS DESDE checkout.html
// ========================================

async function procesarPagoCompletado(orderData, metodoPago) {
    try {
        console.log('🔄 Procesando pago completado desde config.js...');
        
        // Obtener datos del formulario (desde checkout.html)
        const datosFormulario = {
            nombre: document.getElementById('nombre')?.value || 'Cliente',
            email: document.getElementById('email')?.value || 'email@ejemplo.com',
            telefono: document.getElementById('telefono')?.value || '000000000',
            direccion: document.getElementById('direccion')?.value || 'Dirección',
            ciudad: document.getElementById('ciudad')?.value || 'Ciudad',
            codigoPostal: document.getElementById('codigo-postal')?.value || '00000',
            pais: document.getElementById('pais')?.value || 'ES'
        };
        
        // Obtener datos del carrito (variables globales de checkout.html)
        const carritoActual = typeof carritoData !== 'undefined' ? carritoData : JSON.parse(localStorage.getItem('carrito') || '[]');
        const montoTotal = typeof totalAmount !== 'undefined' ? totalAmount : carrito.obtenerTotal();
        
        // Crear pedido
        const pedido = {
            reference: `REF_${Date.now()}`,
            total_amount: montoTotal,
            status: 'paid',
            payment_method: metodoPago,
            customer_name: datosFormulario.nombre,
            customer_email: datosFormulario.email,
            customer_phone: datosFormulario.telefono,
            shipping_address: `${datosFormulario.direccion}, ${datosFormulario.ciudad}, ${datosFormulario.codigoPostal}, ${datosFormulario.pais}`,
            items: carritoActual.map(item => ({
                product_id: item.id,
                product_name: item.name,
                quantity: item.cantidad || 1,
                unit_price: item.price * (1 - (item.discount || 0))
            })),
            paypal_order_id: metodoPago === 'paypal' ? orderData.id : null,
            paypal_payer_id: metodoPago === 'paypal' && orderData.payer ? orderData.payer.payer_id : null
        };
        
        // Guardar pedido en historial
        guardarPedidoEnHistorial({
            ...pedido,
            id: Date.now(),
            productos: [...carritoActual],
            fecha: new Date().toISOString(),
            referencia_pago: orderData.id
        });
        
        // Mostrar confirmación
        mostrarConfirmacionPago(orderData, pedido, montoTotal);
        
        // Vaciar carrito
        localStorage.removeItem('carrito');
        updateCartCounter();
        
        console.log('✅ Pago procesado completamente desde config.js');
        
    } catch (error) {
        console.error('❌ Error procesando pago en config.js:', error);
        alert('El pago se completó, pero hubo un error guardando el pedido. ID: ' + orderData.id);
    }
}

function guardarPedidoEnHistorial(pedido) {
    console.log('💾 Guardando pedido en historial desde config.js:', pedido.reference);
    
    try {
        let historial = JSON.parse(localStorage.getItem('historial_pedidos')) || [];
        historial.unshift(pedido);
        
        if (historial.length > 20) {
            historial = historial.slice(0, 20);
        }
        
        localStorage.setItem('historial_pedidos', JSON.stringify(historial));
        console.log('✅ Pedido guardado en historial correctamente desde config.js');
    } catch (error) {
        console.error('❌ Error guardando en historial desde config.js:', error);
    }
}

function mostrarConfirmacionPago(orderData, pedido, total) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    // Ensure Phosphor icons script is present (so <i class="ph ..."> renders)
    try {
        const phScriptSelector = 'script[src*="@phosphor-icons/web"]';
        if (!document.querySelector(phScriptSelector)) {
            const ph = document.createElement('script');
            ph.src = 'https://unpkg.com/@phosphor-icons/web';
            ph.defer = true;
            document.head.appendChild(ph);
            console.log('🔌 Phosphor icons script injected for modal');
        }
    } catch (e) {
        console.warn('⚠️ Could not inject Phosphor script for modal:', e);
    }

    modal.innerHTML = `
        <div class="modal-container">
            <div class="modal-header">
                <div class="modal-icon"><i class="ph ph-check-circle" aria-hidden="true"></i></div>
                <h2>¡Pago realizado con éxito!</h2>
                <p>Tu pedido ha sido procesado correctamente</p>
            </div>
            <div class="modal-body">
                <div class="modal-details">
                    <div class="modal-detail-item">
                        <span class="modal-detail-label"><i class="ph ph-hash" aria-hidden="true"></i> ID de Transacción:</span>
                        <span class="modal-detail-value">${orderData.id}</span>
                    </div>
                    <div class="modal-detail-item">
                        <span class="modal-detail-label"><i class="ph ph-clipboard-text" aria-hidden="true"></i> Referencia del pedido:</span>
                        <span class="modal-detail-value">${pedido.reference}</span>
                    </div>
                    <div class="modal-detail-item">
                        <span class="modal-detail-label"><i class="ph ph-credit-card" aria-hidden="true"></i> Método de pago:</span>
                        <span class="modal-detail-value">${pedido.payment_method === 'paypal' ? 'PayPal' : 'Redsys (Tarjeta)'}</span>
                    </div>
                    <div class="modal-detail-item">
                        <span class="modal-detail-label"><i class="ph ph-badge-check" aria-hidden="true"></i> Estado:</span>
                        <span class="modal-detail-value">Pagado</span>
                    </div>
                    <div class="modal-detail-item">
                        <span class="modal-detail-label"><i class="ph ph-calendar" aria-hidden="true"></i> Fecha:</span>
                        <span class="modal-detail-value">${new Date().toLocaleString('es-ES')}</span>
                    </div>
                </div>
                <div class="modal-total">
                    <span class="modal-total-label"><i class="ph ph-coins" aria-hidden="true"></i> Total pagado</span>
                    <span class="modal-total-value">€${total.toFixed(2)}</span>
                </div>
                <div class="modal-footer">
                    <p class="modal-message">
                        <strong>¡Gracias por tu compra!</strong><br>
                        Recibirás un email de confirmación en breve. Serás redirigido a "Mis Compras" automáticamente.
                    </p>
                    <button class="modal-button" onclick="window.location.href='mis-compras.html'">
                        <i class="ph ph-package" aria-hidden="true"></i> Ver mis compras
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Agregar estilos del modal si no existen
    if (!document.getElementById('modal-styles')) {
        const modalStyles = document.createElement('style');
        modalStyles.id = 'modal-styles';
        modalStyles.innerHTML = `
            .modal-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(6px) saturate(120%);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                padding: var(--spacing-md);
            }
            .modal-container {
                background: linear-gradient(180deg, rgba(255,255,255,0.98), #fff);
                border-radius: 16px;
                box-shadow: 0 12px 40px rgba(11,20,30,0.28);
                max-width: 640px;
                width: 100%;
                max-height: 92vh;
                overflow-y: auto;
                animation: modalSlideIn 320ms cubic-bezier(.2,.9,.3,1);
                border: 1px solid rgba(11,20,30,0.04);
            }
            @keyframes modalSlideIn {
                from { opacity: 0; transform: translateY(-18px) scale(.992); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
            .modal-header {
                text-align: center;
                padding: 1.6rem 1.5rem 1rem;
                background: linear-gradient(135deg, var(--color-success) 0%, #5A7A2E 100%);
                color: white;
                border-radius: 12px 12px 0 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.6rem;
            }
            .modal-icon i.ph { font-size: 3.6rem; color: white; background: rgba(255,255,255,0.06); padding: 8px; border-radius: 12px; }
            .modal-header h2 { font-family: var(--font-heading); font-size: 1.45rem; margin: 0; font-weight: 700; }
            .modal-header p { margin: 0; opacity: 0.95; }
            .modal-body { padding: 1.25rem; }
            .modal-details { background: var(--color-light-cream); padding: 0.8rem; border-radius: 10px; margin-bottom: 1rem; }
            .modal-detail-item { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid rgba(139,90,60,0.06); }
            .modal-detail-item:last-child { border-bottom: none; }
            .modal-detail-label { display: inline-flex; align-items: center; gap: 0.5rem; color: var(--color-text); font-weight: 600; }
            .modal-detail-label i.ph { font-size: 1rem; color: var(--color-accent); }
            .modal-detail-value { font-family: monospace; font-weight: 700; color: var(--color-text); }
            .modal-total { background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%); color: white; padding: 0.9rem 1rem; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
            .modal-total-label { display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 700; }
            .modal-total-label i.ph { font-size: 1.1rem; }
            .modal-total-value { font-size: 1.6rem; font-weight: 800; font-family: var(--font-heading); }
            .modal-message { text-align: center; color: var(--color-text); line-height: 1.5; margin-bottom: 1rem; }
            .modal-button { width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 0.6rem; background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%); color: white; border: none; padding: 0.95rem 1rem; border-radius: 10px; font-size: 1rem; font-weight: 700; cursor: pointer; box-shadow: var(--shadow-md); }
            .modal-button i.ph { font-size: 1.1rem; }
            .modal-button:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
            @media (max-width: 520px) { .modal-container { padding: 0; margin: 0 8px; } .modal-header { padding-top: 1rem; } }
        `;
        document.head.appendChild(modalStyles);
    }
    
    document.body.appendChild(modal);
    
    // Auto-redirigir después de 5 segundos (ajustado según preferencia)
    setTimeout(() => {
        window.location.href = 'mis-compras.html';
    }, 5000);
}

// ========================================
// FUNCIONES PARA PÁGINA PRINCIPAL
// ========================================

async function cargarProductosTop() {
    try {
        console.log('📦 Cargando productos TOP desde PHP...');
        const response = await fetch(`${API_PHP}?tipo=top`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const productos = await response.json();
        console.log('✅ Productos TOP cargados desde PHP:', productos.length);
        
        mostrarProductos(productos, 'productos-top');
    } catch (error) {
        console.error('❌ Error cargando productos destacados desde PHP:', error);
        // Fallback a API original si falla PHP
        try {
            console.log('🔄 Intentando con API Node.js...');
            const response = await fetch(`${API_URL}/products/top`);
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            
            const productos = await response.json();
            console.log('✅ Productos TOP cargados desde Node.js (fallback)');
            mostrarProductos(productos, 'productos-top');
        } catch (fallbackError) {
            console.error('❌ Fallback también falló:', fallbackError);
            const container = document.getElementById('productos-top');
            if (container) {
                container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #d32f2f;">Error cargando productos destacados</div>';
            }
        }
    }
}

async function cargarTodosProductos() {
    try {
        console.log('📦 Cargando TODOS los productos desde PHP...');
        const response = await fetch(`${API_PHP}?tipo=all`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const productos = await response.json();
        console.log('✅ Todos los productos cargados desde PHP:', productos.length);
        
        mostrarProductos(productos, 'productos-todos');
    } catch (error) {
        console.error('❌ Error cargando productos desde PHP:', error);
        // Fallback a API original si falla PHP
        try {
            console.log('🔄 Intentando con API Node.js...');
            const response = await fetch(`${API_URL}/products`);
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            
            const productos = await response.json();
            console.log('✅ Todos los productos cargados desde Node.js (fallback)');
            mostrarProductos(productos, 'productos-todos');
        } catch (fallbackError) {
            console.error('❌ Fallback también falló:', fallbackError);
            const container = document.getElementById('productos-todos');
            if (container) {
                container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #d32f2f;">Error cargando productos</div>';
            }
        }
    }
}

function mostrarProductos(productos, contenedorId) {
    const container = document.getElementById(contenedorId);
    if (!container) {
        console.error('❌ Container no encontrado:', contenedorId);
        return;
    }
    
    if (!productos || productos.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">No hay productos disponibles</div>';
        return;
    }
    
    container.innerHTML = '';
    
    productos.forEach(producto => {
        const precioOriginal = producto.price;
        const precioFinal = precioOriginal * (1 - (producto.discount || 0));
        const tieneDescuento = (producto.discount || 0) > 0;
        const imagenUrl = producto.main_image || 'https://via.placeholder.com/300x250?text=Café';
        
        const card = document.createElement('div');
        card.className = 'producto-card';
        card.innerHTML = `
            <img src="${imagenUrl}" alt="${producto.name}" onerror="this.src='https://via.placeholder.com/300x250?text=Café'">
            <div class="producto-card-content">
                <h3>${producto.name}</h3>
                <p class="producto-origen">${obtenerOrigen(producto.name)}</p>
                <p>${producto.description}</p>
                
                <div class="producto-precio-container">
                    ${tieneDescuento ? `<span class="producto-precio-original">€${precioOriginal.toFixed(2)}</span>` : ''}
                    <span class="producto-precio">€${precioFinal.toFixed(2)}</span>
                    ${tieneDescuento ? `<span class="producto-descuento">-${(producto.discount * 100).toFixed(0)}%</span>` : ''}
                </div>
                
                <a href="producto.html?id=${producto.id}" class="btn btn-primary">Ver producto</a>
            </div>
        `;
        
        container.appendChild(card);
    });
    
    console.log('✅ Productos mostrados en', contenedorId);
}

function obtenerOrigen(nombre) {
    if (!nombre) return 'Origen selecto';
    
    const origenes = {
        'Colombia': 'Colombia',
        'Etiopía': 'Etiopía',
        'Etiopia': 'Etiopía',
        'Brasil': 'Brasil',
        'Kenya': 'Kenya',
        'Guatemala': 'Guatemala',
        'Costa Rica': 'Costa Rica',
        'Sumatra': 'Indonesia',
        'Java': 'Indonesia'
    };
    
    for (let clave in origenes) {
        if (nombre.includes(clave)) {
            return origenes[clave];
        }
    }
    
    return 'Origen selecto';
}

// ========================================
// FUNCIONES PARA CARRITO
// ========================================

function mostrarCarrito() {
    const carritoVacio = document.getElementById('carrito-vacio');
    const carritoContenido = document.getElementById('carrito-contenido');
    const listaProductos = document.getElementById('lista-productos');
    
    if (carrito.items.length === 0) {
        if (carritoVacio) carritoVacio.style.display = 'block';
        if (carritoContenido) carritoContenido.style.display = 'none';
        return;
    }
    
    if (carritoVacio) carritoVacio.style.display = 'none';
    if (carritoContenido) carritoContenido.style.display = 'grid';
    
    if (!listaProductos) return;
    
    listaProductos.innerHTML = '';
    
    carrito.items.forEach(item => {
        const precioFinal = carrito.calcularPrecioFinal(item.price, item.discount);
        const subtotal = precioFinal * item.cantidad;
        const imagenUrl = item.main_image || 'https://via.placeholder.com/100x100?text=Café';
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'carrito-item';
        itemDiv.innerHTML = `
            <img src="${imagenUrl}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/100x100?text=Café'">
            
            <div class="carrito-item-info">
                <h3>${item.name}</h3>
                <p>${obtenerOrigen(item.name)}</p>
                
                <div class="carrito-item-cantidad">
                    <label>Cantidad:</label>
                    <input type="number" value="${item.cantidad}" min="1" max="10" 
                           onchange="actualizarCantidadCarrito(${item.id}, this.value)"
                           style="width: 60px; padding: 0.25rem; text-align: center;">
                    <button class="btn-eliminar" onclick="eliminarDelCarrito(${item.id})">
                        Eliminar
                    </button>
                </div>
            </div>
            
            <div class="carrito-item-precio">
                <span class="precio-unitario">€${precioFinal.toFixed(2)} c/u</span>
                <span class="precio-total">€${subtotal.toFixed(2)}</span>
            </div>
        `;
        
        listaProductos.appendChild(itemDiv);
    });
    
    actualizarTotalesCarrito();
}

function actualizarCantidadCarrito(productoId, cantidad) {
    carrito.actualizarCantidad(productoId, cantidad);
    mostrarCarrito();
}

function eliminarDelCarrito(productoId) {
    if (confirm('¿Eliminar este producto del carrito?')) {
        carrito.eliminar(productoId);
        mostrarCarrito();
    }
}

function actualizarTotalesCarrito() {
    const subtotal = carrito.obtenerSubtotal();
    const total = carrito.obtenerTotal();
    
    const subtotalEl = document.getElementById('subtotal');
    const envioEl = document.getElementById('envio');
    const totalEl = document.getElementById('total');
    
    if (subtotalEl) subtotalEl.textContent = `€${subtotal.toFixed(2)}`;
    if (envioEl) envioEl.textContent = `€${COSTO_ENVIO.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `€${total.toFixed(2)}`;
}

// ========================================
// HISTORIAL DE PEDIDOS
// ========================================

function obtenerHistorialPedidos() {
    return JSON.parse(localStorage.getItem('historial_pedidos')) || [];
}

function mostrarPedidos() {
    console.log('📦 Cargando página Mis Compras desde config.js...');
    
    const historial = obtenerHistorialPedidos();
    console.log('📋 Pedidos en historial:', historial.length);
    
    const sinPedidos = document.getElementById('sin-pedidos');
    const listaPedidos = document.getElementById('lista-pedidos');
    
    if (!listaPedidos) {
        console.error('❌ ERROR: Elemento "lista-pedidos" no encontrado en el DOM');
        return;
    }
    
    if (historial.length === 0) {
        console.log('⚠️ No hay pedidos para mostrar');
        if (sinPedidos) sinPedidos.style.display = 'block';
        listaPedidos.style.display = 'none';
        return;
    }
    
    console.log('✅ Mostrando', historial.length, 'pedidos');
    if (sinPedidos) sinPedidos.style.display = 'none';
    listaPedidos.style.display = 'block';
    listaPedidos.innerHTML = '';
    
    historial.forEach((pedido) => {
        const fecha = new Date(pedido.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        const estadoClase = pedido.status === 'paid' ? 'estado-completado' : 'estado-creado';
        const estadoTexto = pedido.status === 'paid' ? 'Completado' : 'Pendiente';
        
        const pedidoDiv = document.createElement('div');
        pedidoDiv.className = 'pedido-card';
        pedidoDiv.innerHTML = `
            <div class="pedido-header">
                <div>
                    <h3>OPC-${pedido.reference.replace('REF_', '').substring(0, 8)}</h3>
                    <p class="pedido-fecha">${fechaFormateada}</p>
                </div>
                <span class="pedido-estado ${estadoClase}">${estadoTexto}</span>
            </div>
            
            <div class="pedido-productos">
                ${pedido.productos.map(item => {
                    const precio = carrito.calcularPrecioFinal(item.price, item.discount || 0);
                    return `
                        <div class="pedido-producto-item">
                            <img src="${item.main_image || 'img/default-coffee.jpg'}" alt="${item.name}">
                            <div class="pedido-producto-info">
                                <div class="pedido-producto-nombre">${item.name}</div>
                                <div class="pedido-producto-detalle">x${item.cantidad}</div>
                            </div>
                            <div class="pedido-producto-precio">€${(precio * item.cantidad).toFixed(2)}</div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div class="pedido-footer">
                <div class="pedido-total">Total: €${pedido.total_amount.toFixed(2)}</div>
                ${pedido.referencia_pago ? `
                    <div class="pedido-referencia">ID: ${pedido.referencia_pago.substring(0, 16)}...</div>
                ` : ''}
            </div>
        `;
        
        listaPedidos.appendChild(pedidoDiv);
    });
    
    console.log('✅ Pedidos renderizados correctamente desde config.js');
}

// ========================================
// INICIALIZACIÓN GLOBAL
// ========================================

// Ejecutar cuando config.js se carga
console.log('✅ Config.js completamente cargado - Funciones disponibles:', {
    carrito: !!carrito,
    cargarProductosTop: typeof cargarProductosTop,
    cargarTodosProductos: typeof cargarTodosProductos,
    mostrarPedidos: typeof mostrarPedidos,
    procesarPagoCompletado: typeof procesarPagoCompletado
});