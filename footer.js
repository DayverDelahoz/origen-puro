// ========================================
// COMPONENTE DE FOOTER
// ========================================

class FooterComponent {
    constructor(config = window.siteConfig) {
        this.config = config;
    }

    // Generar HTML del footer
    generateHTML() {
        return `
            <footer class="footer">
                <div class="container">
                    <div class="footer-content">
                        <!-- Contenido principal del footer -->
                        <div class="footer-main">
                            <div class="footer-brand">
                                <img src="${this.config.logo.main}" 
                                     alt="${this.config.logo.alt}" 
                                     class="footer-logo"
                                     style="max-width: ${this.config.logo.footerWidth}; height: auto;">
                                <div class="footer-brand-text">
                                    <h3>${this.config.siteName}</h3>
                                    <p>${this.config.tagline}</p>
                                </div>
                            </div>
                            
                            <div class="footer-nav">
                                <h4>Navegación</h4>
                                <ul>
                                    ${this.config.navigation.slice(0, 3).map(nav => `
                                        <li><a href="${nav.url}">${nav.text}</a></li>
                                    `).join('')}
                                </ul>
                            </div>
                            
                            <div class="footer-contact">
                                <h4>Contacto</h4>
                                <p><span>📧</span> ${this.config.contact.email}</p>
                                <p><span>📍</span> ${this.config.contact.address}</p>
                            </div>
                            
                            <div class="footer-social">
                                <h4>Síguenos</h4>
                                <div class="social-links">
                                    ${this.generateSocialLinks()}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Footer bottom compacto -->
                        <div class="footer-bottom">
                            <div class="footer-student">
                                <span><strong>${this.config.student.name}</strong> - ${this.config.student.code}</span>
                                <span>${this.config.student.university}</span>
                            </div>
                            <div class="footer-copyright">
                                <span>&copy; ${new Date().getFullYear()} ${this.config.siteName} - Todos los derechos reservados</span>
                                <span class="footer-academic">Proyecto académico - ${this.config.student.course}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        `;
    }

    // Generar enlaces sociales compactos
    generateSocialLinks() {
        return this.config.footer.social.map(social => `
            <a href="${social.url}" class="social-link" title="${social.platform}">
                <span>${social.icon}</span>
            </a>
        `).join('');
    }

    // Renderizar footer en el DOM
    render(targetSelector = 'body') {
        const target = document.querySelector(targetSelector);
        if (!target) {
            console.error('No se encontró el elemento destino para el footer');
            return;
        }

        // Buscar footer existente y reemplazarlo
        const existingFooter = target.querySelector('.footer');
        if (existingFooter) {
            existingFooter.remove();
        }

        // Insertar nuevo footer
        target.insertAdjacentHTML('beforeend', this.generateHTML());
    }

    // Inicializar footer automáticamente cuando se carga la página
    static init() {
        document.addEventListener('DOMContentLoaded', () => {
            const footer = new FooterComponent();
            footer.render();
        });
    }
}

// Auto-inicializar el footer
FooterComponent.init();

// Exportar para uso manual si es necesario
window.FooterComponent = FooterComponent;