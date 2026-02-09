// ========================================
// CONFIGURACIÓN
// ========================================

const API_URL = 'http://localhost:8080/api';
const COSTO_ENVIO = 4.95;

// ========================================
// CLASE CARRITO
// ========================================

class Carrito {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('carrito')) || [];
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

    calcularPrecioFinal(precio, descuento) {
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
}

// Instancia global del carrito
const carrito = new Carrito();

// ========================================
// FUNCIONES PARA PÁGINA PRINCIPAL
// ========================================

async function cargarProductosTop() {
    try {
        const response = await fetch(`${API_URL}/products/top`);
        const productos = await response.json();
        
        mostrarProductos(productos, 'productos-top');
    } catch (error) {
        console.error('Error cargando productos destacados:', error);
    }
}

async function cargarTodosProductos() {
    try {
        const response = await fetch(`${API_URL}/products`);
        const productos = await response.json();
        
        mostrarProductos(productos, 'productos-todos');
    } catch (error) {
        console.error('Error cargando productos:', error);
    }
}

function mostrarProductos(productos, contenedorId) {
    const container = document.getElementById(contenedorId);
    if (!container) return;
    
    container.innerHTML = '';
    
    productos.forEach(producto => {
        const precioOriginal = producto.price;
        const precioFinal = precioOriginal * (1 - producto.discount);
        const tieneDescuento = producto.discount > 0;
        
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
}

function obtenerOrigen(nombre) {
    // Verificar que nombre existe
    if (!nombre) return 'Origen selecto';
    
    // Mapeo de productos a orígenes de café
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
// FUNCIONES PARA PÁGINA DE PRODUCTO
// ========================================

async function cargarProducto(id) {
    try {
        console.log('Intentando cargar producto ID:', id);
        console.log('URL de la API:', `${API_URL}/products/${id}`);
        
        const response = await fetch(`${API_URL}/products/${id}`);
        
        console.log('Respuesta de la API:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }
        
        let producto = await response.json();
        
        console.log('Datos recibidos:', producto);
        
        // FIX: Si la API devuelve un array, tomar el primer elemento
        if (Array.isArray(producto)) {
            console.log('API devolvió array, tomando primer elemento');
            producto = producto[0];
        }
        
        if (!producto || !producto.id) {
            throw new Error('Producto inválido o vacío');
        }
        
        mostrarDetalleProducto(producto);
        
        // Guardar producto en variable global para agregar al carrito
        window.productoActual = producto;
        
        console.log('Producto cargado exitosamente');
        
    } catch (error) {
        console.error('❌ ERROR COMPLETO:', error);
        console.error('Detalles del error:', error.message);
        
        // Mostrar error en la página en lugar de redirigir
        const nombreElement = document.getElementById('producto-nombre');
        const descripcionElement = document.querySelector('.producto-info .producto-descripcion p');
        
        if (nombreElement) {
            nombreElement.textContent = 'Error cargando producto';
        }
        
        if (descripcionElement) {
            descripcionElement.innerHTML = `
                <strong>Error:</strong> ${error.message}<br><br>
                <a href="index.html" class="btn btn-primary">Volver a la tienda</a>
            `;
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

function agregarAlCarrito() {
    const cantidad = parseInt(document.getElementById('cantidad').value);
    
    if (window.productoActual) {
        carrito.agregar(window.productoActual, cantidad);
        
        // Mostrar mensaje de confirmación
        const mensaje = document.getElementById('mensaje-agregado');
        mensaje.style.display = 'block';
        
        setTimeout(() => {
            mensaje.style.display = 'none';
        }, 3000);
        
        // Resetear cantidad
        document.getElementById('cantidad').value = 1;
    }
}

// ========================================
// FUNCIONES PARA PÁGINA DE CARRITO
// ========================================

function mostrarCarrito() {
    const carritoVacio = document.getElementById('carrito-vacio');
    const carritoContenido = document.getElementById('carrito-contenido');
    const listaProductos = document.getElementById('lista-productos');
    
    if (carrito.items.length === 0) {
        carritoVacio.style.display = 'block';
        carritoContenido.style.display = 'none';
        return;
    }
    
    carritoVacio.style.display = 'none';
    carritoContenido.style.display = 'grid';
    
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
    
    document.getElementById('subtotal').textContent = `€${subtotal.toFixed(2)}`;
    document.getElementById('envio').textContent = `€${COSTO_ENVIO.toFixed(2)}`;
    document.getElementById('total').textContent = `€${total.toFixed(2)}`;
}

// ========================================
// FUNCIONES PARA CHECKOUT
// ========================================

function mostrarResumenCheckout() {
    const resumenProductos = document.getElementById('resumen-productos');
    
    resumenProductos.innerHTML = '';
    
    carrito.items.forEach(item => {
        const precioFinal = carrito.calcularPrecioFinal(item.price, item.discount);
        const subtotal = precioFinal * item.cantidad;
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'resumen-item';
        itemDiv.innerHTML = `
            <div class="resumen-item-info">
                <h4>${item.name}</h4>
                <p>Cantidad: ${item.cantidad} × €${precioFinal.toFixed(2)}</p>
            </div>
            <div class="resumen-item-precio">
                €${subtotal.toFixed(2)}
            </div>
        `;
        
        resumenProductos.appendChild(itemDiv);
    });
    
    const subtotal = carrito.obtenerSubtotal();
    const total = carrito.obtenerTotal();
    
    document.getElementById('checkout-subtotal').textContent = `€${subtotal.toFixed(2)}`;
    document.getElementById('checkout-envio').textContent = `€${COSTO_ENVIO.toFixed(2)}`;
    document.getElementById('checkout-total').textContent = `€${total.toFixed(2)}`;
}

// ========================================
// INTEGRACIÓN CON PAYPAL
// ========================================

function inicializarPayPal() {
    // Verifica si PayPal SDK está cargado
    if (typeof paypal === 'undefined') {
        console.error('PayPal SDK no está cargado');
        document.getElementById('paypal-button-container').innerHTML = 
            '<p style="color: red; padding: 1rem; background: #fee; border-radius: 4px;">⚠️ Error: Configura tu Client ID de PayPal en checkout.html línea 65</p>';
        return;
    }
    
    paypal.Buttons({
        // Estilo de los botones
        style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal'
        },
        
        // Crear la orden
        createOrder: function(data, actions) {
            const total = carrito.obtenerTotal();
            
            console.log('Creando orden PayPal por:', total.toFixed(2), 'EUR');
            
            return actions.order.create({
                purchase_units: [{
                    amount: {
                        value: total.toFixed(2),
                        currency_code: 'EUR'
                    },
                    description: 'Compra en Origen Puro Coffee'
                }]
            });
        },
        
        // Cuando el usuario aprueba el pago
        onApprove: async function(data, actions) {
            try {
                // Capturar el pago
                const detalles = await actions.order.capture();
                console.log('✅ Pago completado:', detalles);
                
                // Crear pedido en la API con estado "paid"
                const pedido = await crearPedidoEnAPI('paid', detalles.id);
                console.log('✅ Pedido guardado en BD:', pedido);
                
                // Vaciar carrito
                carrito.vaciar();
                
                // Mostrar modal de confirmación
                const total = detalles.purchase_units[0].amount.value;
                const transaccionId = detalles.id;
                
                mostrarModalConfirmacion({
                    total: total,
                    transaccionId: transaccionId,
                    referenciaPedido: pedido.reference || 'N/A'
                });
                
            } catch (error) {
                console.error('❌ Error procesando el pago:', error);
                alert(`❌ Error al procesar el pago\n\nHubo un problema al guardar tu pedido.\nPor favor, contacta con soporte.\n\nError: ${error.message}`);
            }
        },
        
        // Si hay error en PayPal
        onError: function(err) {
            console.error('❌ Error en PayPal:', err);
            alert('Error al procesar el pago con PayPal. Por favor, inténtalo de nuevo.');
        },
        
        // Si el usuario cancela
        onCancel: function(data) {
            console.log('⚠️ Usuario canceló el pago');
            alert('Pago cancelado. Puedes volver a intentarlo cuando quieras.');
        }
        
    }).render('#paypal-button-container');
    
    console.log('✅ Botones de PayPal inicializados');
}

// ========================================
// API - CREAR PEDIDO
// ========================================

async function crearPedidoEnAPI(estado = 'created', referenciaExterna = '') {
    try {
        const nombreUsuario = document.getElementById('nombre')?.value || 'usuario_invitado';
        const referencia = `REF_${Date.now()}`;
        
        const pedido = {
            reference: referencia,
            user: nombreUsuario,
            total_amount: carrito.obtenerTotal(),
            product_count: carrito.items.length,
            status: estado
        };
        
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pedido)
        });
        
        if (!response.ok) {
            throw new Error('Error al crear el pedido');
        }
        
        const resultado = await response.json();
        console.log('Pedido creado:', resultado);
        
        // Guardar pedido en historial local
        guardarPedidoEnHistorial({
            ...pedido,
            id: resultado.id || Date.now(),
            productos: [...carrito.items],
            fecha: new Date().toISOString(),
            referencia_pago: referenciaExterna
        });
        
        return resultado;
        
    } catch (error) {
        console.error('Error creando pedido:', error);
        throw error;
    }
}

// ========================================
// HISTORIAL DE PEDIDOS (LocalStorage)
// ========================================

function guardarPedidoEnHistorial(pedido) {
    console.log('🔄 Guardando pedido en historial:', pedido);
    
    let historial = JSON.parse(localStorage.getItem('historial_pedidos')) || [];
    console.log('📋 Historial ANTES:', historial.length, 'pedidos');
    
    historial.unshift(pedido); // Agregar al inicio
    
    // Limitar a últimos 20 pedidos
    if (historial.length > 20) {
        historial = historial.slice(0, 20);
    }
    
    localStorage.setItem('historial_pedidos', JSON.stringify(historial));
    console.log('✅ Historial DESPUÉS:', historial.length, 'pedidos');
    console.log('💾 Guardado en LocalStorage correctamente');
    
    // Verificar que se guardó
    const verificacion = JSON.parse(localStorage.getItem('historial_pedidos'));
    console.log('🔍 Verificación - pedidos guardados:', verificacion.length);
}

function obtenerHistorialPedidos() {
    return JSON.parse(localStorage.getItem('historial_pedidos')) || [];
}

// ========================================
// MODAL DE CONFIRMACIÓN DE PAGO
// ========================================

function mostrarModalConfirmacion(datos) {
    // Crear overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    // Truncar ID de transacción para mostrar
    const idCorto = datos.transaccionId.substring(0, 16) + '...';
    
    overlay.innerHTML = `
        <div class="modal-container">
            <div class="modal-header">
                <div class="modal-icon">✓</div>
                <h2>¡Pago Completado!</h2>
                <p>Tu pedido ha sido procesado correctamente</p>
            </div>
            
            <div class="modal-body">
                <div class="modal-total">
                    <span class="modal-total-label">Total Pagado</span>
                    <span class="modal-total-value">€${datos.total}</span>
                </div>
                
                <div class="modal-details">
                    <div class="modal-detail-item">
                        <span class="modal-detail-label">🔖 ID Transacción</span>
                        <span class="modal-detail-value">${idCorto}</span>
                    </div>
                    <div class="modal-detail-item">
                        <span class="modal-detail-label">📦 Referencia</span>
                        <span class="modal-detail-value">${datos.referenciaPedido}</span>
                    </div>
                    <div class="modal-detail-item">
                        <span class="modal-detail-label">📅 Fecha</span>
                        <span class="modal-detail-value">${new Date().toLocaleString('es-ES')}</span>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <p class="modal-message">
                        Gracias por tu compra en <strong>Origen Puro Coffee</strong> ☕<br>
                        Serás redirigido a tus compras en unos segundos...
                    </p>
                    <button class="modal-button" onclick="irAMisCompras()">
                        Ver Mis Compras
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Auto-redirigir después de 5 segundos
    setTimeout(() => {
        window.location.href = 'mis-compras.html';
    }, 5000);
}

function irAMisCompras() {
    window.location.href = 'mis-compras.html';
}


function mostrarPedidos() {
    console.log('📦 Cargando página Mis Compras...');
    
    const historial = obtenerHistorialPedidos();
    console.log('📋 Pedidos en historial:', historial.length);
    console.log('📄 Datos completos:', historial);
    
    const sinPedidos = document.getElementById('sin-pedidos');
    const listaPedidos = document.getElementById('lista-pedidos');
    
    if (!listaPedidos) {
        console.error('❌ ERROR: Elemento "lista-pedidos" no encontrado en el DOM');
        return;
    }
    
    if (historial.length === 0) {
        console.log('⚠️ No hay pedidos para mostrar');
        sinPedidos.style.display = 'block';
        listaPedidos.style.display = 'none';
        return;
    }
    
    console.log('✅ Mostrando', historial.length, 'pedidos');
    sinPedidos.style.display = 'none';
    listaPedidos.style.display = 'block';
    listaPedidos.innerHTML = '';
    
    historial.forEach((pedido, index) => {
        console.log(`  Pedido ${index + 1}:`, pedido.reference);
        
        const fecha = new Date(pedido.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const estadoClase = pedido.status === 'paid' ? 'estado-pagado' : 
                           pedido.status === 'canceled' ? 'estado-cancelado' : 
                           'estado-creado';
        
        const estadoTexto = pedido.status === 'paid' ? 'Pagado' : 
                           pedido.status === 'canceled' ? 'Cancelado' : 
                           'Pendiente';
        
        const pedidoDiv = document.createElement('div');
        pedidoDiv.className = 'pedido-card';
        pedidoDiv.innerHTML = `
            <div class="pedido-header">
                <div>
                    <h3>Pedido ${pedido.reference}</h3>
                    <p class="pedido-fecha">${fechaFormateada}</p>
                </div>
                <span class="pedido-estado ${estadoClase}">${estadoTexto}</span>
            </div>
            
            <div class="pedido-productos">
                <div class="pedido-productos-titulo">Productos</div>
                ${pedido.productos.map(item => {
                    const precio = carrito.calcularPrecioFinal(item.price, item.discount);
                    return `
                        <div class="pedido-producto-item">
                            <span class="pedido-producto-nombre">${item.cantidad}x ${item.name}</span>
                            <span class="pedido-producto-precio">€${(precio * item.cantidad).toFixed(2)}</span>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div class="pedido-footer">
                <div class="pedido-total">
                    <strong>Total:</strong>
                    <strong>€${pedido.total_amount.toFixed(2)}</strong>
                </div>
                ${pedido.referencia_pago ? `
                    <p class="pedido-referencia">ID: ${pedido.referencia_pago.substring(0, 16)}...</p>
                ` : ''}
            </div>
        `;
        
        listaPedidos.appendChild(pedidoDiv);
    });
    
    console.log('✅ Pedidos renderizados correctamente');
}