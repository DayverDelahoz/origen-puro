// ========================================
// MEJORAS INTERACTIVAS Y HEADER FIJO
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Header fijo con scroll
    initStickyHeader();
    
    // Menú hamburguesa en móvil (si no existe el header-responsive global)
    if (typeof window.toggleMenu !== 'function') {
        initMobileMenu();
    }
    
    // Mejoras en las tarjetas de productos
    initProductCardInteractions();
    
    // Smooth scrolling para enlaces internos
    initSmoothScrolling();
});

// ========================================
// HEADER FIJO CON SCROLL
// ========================================

function initStickyHeader() {
    const header = document.querySelector('.header');
    let lastScrollY = window.scrollY;
    
    function updateHeader() {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScrollY = currentScrollY;
    }
    
    // Throttle scroll events para mejor performance
    let ticking = false;
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                updateHeader();
                ticking = false;
            });
            ticking = true;
        }
    });
    
    // Llamar una vez para establecer estado inicial
    updateHeader();
}

// ========================================
// MENÚ HAMBURGESA MÓVIL
// ========================================
function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.nav');
    if (!menuToggle || !nav) return;

    function openMenu() {
        nav.classList.add('active');
        menuToggle.setAttribute('aria-expanded', 'true');
        menuToggle.classList.add('open');
        const firstLink = nav.querySelector('a');
        if (firstLink) firstLink.focus();
    }

    function closeMenu() {
        nav.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.classList.remove('open');
        menuToggle.focus();
    }

    menuToggle.addEventListener('click', (e) => {
        const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
        if (expanded) closeMenu(); else openMenu();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && nav.classList.contains('active')) {
            closeMenu();
        }
    });

    document.addEventListener('click', (e) => {
        if (!nav.classList.contains('active')) return;
        const target = e.target;
        if (!nav.contains(target) && !menuToggle.contains(target)) {
            closeMenu();
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && nav.classList.contains('active')) {
            closeMenu();
        }
    });
}

// ========================================
// MEJORAS EN TARJETAS DE PRODUCTOS
// ========================================

function initProductCardInteractions() {
    // Esperar a que los productos se carguen
    setTimeout(() => {
        addClickToImages();
        addQuickAddButtons();
    }, 1000);
    
    // Observer para productos que se cargan dinámicamente
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                const addedNodes = Array.from(mutation.addedNodes);
                const hasProductCards = addedNodes.some(node => 
                    node.classList && node.classList.contains('producto-card')
                );
                
                if (hasProductCards) {
                    setTimeout(() => {
                        addClickToImages();
                        addQuickAddButtons();
                    }, 100);
                }
            }
        });
    });
    
    const productGrids = document.querySelectorAll('.productos-grid');
    productGrids.forEach(grid => {
        observer.observe(grid, { childList: true });
    });
}

function addClickToImages() {
    const productCards = document.querySelectorAll('.producto-card');
    
    productCards.forEach(card => {
        const image = card.querySelector('img');
        const link = card.querySelector('a[href*="producto.html"]');
        
        if (image && link && !image.hasAttribute('data-click-added')) {
            image.style.cursor = 'pointer';
            image.setAttribute('data-click-added', 'true');
            
            image.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = link.href;
            });
            
            // Agregar efecto hover adicional
            image.addEventListener('mouseenter', () => {
                image.style.transform = 'scale(1.05)';
            });
            
            image.addEventListener('mouseleave', () => {
                image.style.transform = 'scale(1)';
            });
        }
    });
}

function addQuickAddButtons() {
    const productCards = document.querySelectorAll('.producto-card');
    
    productCards.forEach(card => {
        // Solo agregar si no existe ya
        if (card.querySelector('.btn-add-cart')) {
            return;
        }
        
        const content = card.querySelector('.producto-card-content');
        const existingButton = card.querySelector('.btn');
        
        if (content && existingButton) {
            // Extraer ID del producto del link existente
            const productLink = existingButton.getAttribute('href');
            const productId = new URLSearchParams(productLink.split('?')[1]).get('id');
            
            if (productId) {
                // Crear contenedor de acciones
                const actionsContainer = document.createElement('div');
                actionsContainer.className = 'producto-actions';
                
                // Botón de agregar al carrito
                const addButton = document.createElement('button');
                addButton.className = 'btn-add-cart btn-add-cart--minimal';
                addButton.innerHTML = 'Añadir';
                addButton.setAttribute('data-product-id', productId);
                
                // Event listener para agregar al carrito
                addButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    quickAddToCart(productId, addButton);
                });
                
                // Cambiar el botón existente a "Ver detalle"
                existingButton.textContent = 'Ver detalle';
                existingButton.className = 'btn btn-secondary';
                
                // Agregar botones al contenedor
                actionsContainer.appendChild(addButton);
                actionsContainer.appendChild(existingButton);
                
                // Reemplazar el botón existente con el contenedor
                content.appendChild(actionsContainer);
                existingButton.remove();
            }
        }
    });
}

async function quickAddToCart(productId, button) {
    const originalText = button.innerHTML;
    button.innerHTML = '⏳ Agregando...';
    button.disabled = true;
    
    try {
        // Buscar el producto en los datos ya cargados o hacer petición
        let producto = null;
        
        // Intentar encontrar el producto en las tarjetas existentes
        const card = button.closest('.producto-card');
        if (card) {
            const nombre = card.querySelector('h3').textContent;
            const precioText = card.querySelector('.producto-precio').textContent;
            const precio = parseFloat(precioText.replace('€', '').replace(',', '.'));
            const imagen = card.querySelector('img').src;
            const origen = card.querySelector('.producto-origen')?.textContent || '';
            
            producto = {
                id: parseInt(productId),
                name: nombre,
                price: precio,
                main_image: imagen,
                discount: 0,
                description: `Café premium de ${origen}`
            };
        }
        
        if (producto && typeof carrito !== 'undefined') {
            carrito.agregar(producto, 1);
            
            // Feedback visual
            button.innerHTML = '✅ ¡Agregado!';
            button.style.background = 'linear-gradient(135deg, #6B8E3D 0%, #5A7A2E 100%)';
            
            // Mostrar notificación
            showAddedNotification(producto.name);
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.style.background = '';
                button.disabled = false;
            }, 2000);
            
        } else {
            throw new Error('Producto no encontrado');
        }
        
    } catch (error) {
        console.error('Error agregando al carrito:', error);
        button.innerHTML = '❌ Error';
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.disabled = false;
        }, 2000);
    }
}

function showAddedNotification(productName) {
    // Crear notificación
    const notification = document.createElement('div');
    notification.className = 'add-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">✅</span>
            <span class="notification-text">"${productName}" agregado al carrito</span>
        </div>
    `;
    
    // Estilos de la notificación
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #6B8E3D 0%, #5A7A2E 100%);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(139, 90, 60, 0.3);
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Animar salida y remover
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// ========================================
// SMOOTH SCROLLING
// ========================================

function initSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ========================================
// EXPORT PARA USO GLOBAL
// ========================================

window.elegantInteractions = {
    initStickyHeader,
    initProductCardInteractions,
    quickAddToCart,
    showAddedNotification
};