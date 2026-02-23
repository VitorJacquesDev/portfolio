/**
 * Main Application Controller
 * Initializes and coordinates all modules in the portfolio application
 */

class App {
    constructor() {
        this.modules = {};
        this.initialized = false;
        this.eventBus = new EventBus();
        this.anchorScrollCorrectionTimeout = null;
        this.anchorScrollLoadHandler = null;

        // Use global config if available, otherwise use defaults
        const globalConfig = window.AppConfig || {};
        this.config = {
            debug: globalConfig.debug || false,
            retryAttempts: 3,
            retryDelay: 100,
            analyticsTrackingId: globalConfig.analytics?.trackingId,
            analyticsEnabled: globalConfig.analytics?.enabled || false,
            ...globalConfig
        };
    }

    /**
     * Initialize the application
     */
    async init() {
        if (this.initialized) {
            console.warn('App already initialized');
            return;
        }

        try {
            console.log('🚀 Initializing Portfolio Application...');

            // Initialize critical modules first
            await this.initializeI18n();
            await this.initializeLazyLoading();

            // Setup critical event listeners
            this.setupEventListeners();

            // Defer non-critical modules using requestIdleCallback
            this.deferNonCriticalInit();

            this.initialized = true;
            console.log('✅ Application initialized successfully');

            // Emit app ready event
            this.eventBus.emit('app:ready');

        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Defer non-critical initialization
     */
    deferNonCriticalInit() {
        const initNonCritical = async () => {
            await this.initializeAnimations();
            await this.initializeProjectModal();
            await this.initializeFormHandler();
            await this.initializePerformanceMonitor();
            await this.initializeAnalytics();

            // Setup inter-module communication
            this.setupModuleCommunication();
        };

        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => initNonCritical(), { timeout: 2000 });
        } else {
            setTimeout(() => initNonCritical(), 100);
        }
    }

    /**
     * Initialize i18n Manager
     */
    async initializeI18n() {
        try {
            if (typeof I18nManager === 'undefined') {
                throw new Error('I18nManager not loaded');
            }

            this.modules.i18n = new I18nManager();
            await this.modules.i18n.init();

            console.log('✓ i18n initialized');
            this.eventBus.emit('module:loaded', { name: 'i18n' });

        } catch (error) {
            console.error('Failed to initialize i18n:', error);
            throw error;
        }
    }



    /**
     * Initialize Animation Controller
     */
    async initializeAnimations() {
        try {
            if (typeof AnimationController === 'undefined') {
                throw new Error('AnimationController not loaded');
            }

            this.modules.animations = new AnimationController();
            this.modules.animations.init();

            console.log('✓ Animation Controller initialized');
            this.eventBus.emit('module:loaded', { name: 'animations' });

        } catch (error) {
            console.error('Failed to initialize Animation Controller:', error);
            throw error;
        }
    }

    /**
     * Initialize Lazy Loading
     */
    async initializeLazyLoading() {
        try {
            if (typeof LazyLoader === 'undefined') {
                throw new Error('LazyLoader not loaded');
            }

            this.modules.lazyLoader = new LazyLoader();
            this.modules.lazyLoader.init();

            console.log('✓ Lazy Loader initialized');
            this.eventBus.emit('module:loaded', { name: 'lazyLoader' });

        } catch (error) {
            console.error('Failed to initialize Lazy Loader:', error);
            // Non-critical, continue
        }
    }

    /**
     * Initialize Project Modal
     */
    async initializeProjectModal() {
        try {
            if (typeof ProjectModal === 'undefined') {
                throw new Error('ProjectModal not loaded');
            }

            this.modules.projectModal = new ProjectModal();
            this.modules.projectModal.init();

            console.log('✓ Project Modal initialized');
            this.eventBus.emit('module:loaded', { name: 'projectModal' });

        } catch (error) {
            console.error('Failed to initialize Project Modal:', error);
            // Non-critical, continue
        }
    }

    /**
     * Initialize Form Handler
     */
    async initializeFormHandler() {
        try {
            const contactForm = document.getElementById('contactForm');
            if (!contactForm) {
                console.warn('Contact form not found, skipping form handler initialization');
                return;
            }

            if (typeof FormHandler === 'undefined') {
                throw new Error('FormHandler not loaded');
            }

            this.modules.formHandler = new FormHandler('contactForm', {
                validateOnBlur: true,
                validateOnInput: false,
                showSuccessMessage: true,
                clearOnSuccess: true,
                emailService: 'formsubmit',
                emailServiceConfig: {
                    email: 'vitorjacquesdev@gmail.com'
                }
            });

            console.log('✓ Form Handler initialized');
            this.eventBus.emit('module:loaded', { name: 'formHandler' });

        } catch (error) {
            console.error('Failed to initialize Form Handler:', error);
            // Non-critical, continue
        }
    }

    /**
     * Initialize Performance Monitor
     */
    async initializePerformanceMonitor() {
        try {
            if (typeof PerformanceMonitor === 'undefined') {
                console.warn('PerformanceMonitor not loaded, skipping');
                return;
            }

            this.modules.performanceMonitor = new PerformanceMonitor({
                enableLogging: false,
                enableReporting: false,
                sampleRate: 1.0
            });

            this.modules.performanceMonitor.init();

            console.log('✓ Performance Monitor initialized');
            this.eventBus.emit('module:loaded', { name: 'performanceMonitor' });

        } catch (error) {
            console.error('Failed to initialize Performance Monitor:', error);
            // Non-critical, continue
        }
    }

    /**
     * Initialize Analytics
     */
    async initializeAnalytics() {
        try {
            if (typeof AnalyticsManager === 'undefined') {
                console.warn('AnalyticsManager not loaded, skipping');
                return;
            }

            // Get analytics config
            const analyticsConfig = this.config.analytics || {};
            const trackingId = analyticsConfig.trackingId || null;

            this.modules.analytics = new AnalyticsManager({
                trackingId: trackingId,
                debug: analyticsConfig.debug || this.config.debug,
                anonymizeIp: analyticsConfig.anonymizeIp !== false,
                cookieConsent: analyticsConfig.cookieConsent !== false,
                enabled: Boolean(analyticsConfig.enabled && trackingId),
                customDimensions: analyticsConfig.customDimensions || {}
            });

            await this.modules.analytics.init();

            // Expose analytics globally for cookie consent buttons
            window.analytics = this.modules.analytics;

            console.log('✓ Analytics initialized');
            this.eventBus.emit('module:loaded', { name: 'analytics' });

        } catch (error) {
            console.error('Failed to initialize Analytics:', error);
            // Non-critical, continue
        }
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Language switcher buttons
        this.setupLanguageSwitcher();

        // Mobile menu toggle
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const mobileNav = document.querySelector('.mobile-nav');

        if (mobileMenuBtn && mobileNav) {
            mobileMenuBtn.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }

        // Close mobile menu on link click
        const navLinks = document.querySelectorAll('header nav a, .mobile-nav a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (mobileNav && mobileNav.classList.contains('active')) {
                    this.toggleMobileMenu();
                }
            });
        });

        // Close mobile menu with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileNav && mobileNav.classList.contains('active')) {
                this.toggleMobileMenu();
            }
        });

        // Sticky header on scroll
        window.addEventListener('scroll', () => {
            this.handleScroll();
        });

        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                this.handleSmoothScroll(e);
            });
        });

        // Update active nav link on scroll
        window.addEventListener('scroll', () => {
            this.updateActiveNavLink();
        });

        // Project card click handlers
        this.setupProjectCardHandlers();

        // Project filter buttons
        this.setupProjectFilters();
    }

    /**
     * Setup language switcher buttons
     */
    setupLanguageSwitcher() {
        const langButtons = document.querySelectorAll('.lang-btn');

        langButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const lang = button.getAttribute('data-lang');

                if (!lang) return;

                // Set language using i18n manager
                if (this.modules.i18n) {
                    const success = await this.modules.i18n.setLanguage(lang);

                    if (success) {
                        // Update button states
                        langButtons.forEach(btn => {
                            btn.classList.remove('active');
                            btn.setAttribute('aria-pressed', 'false');
                        });

                        button.classList.add('active');
                        button.setAttribute('aria-pressed', 'true');

                        // Emit language change event
                        this.eventBus.emit('language:changed', {
                            language: lang,
                            languageName: button.getAttribute('aria-label')
                        });
                    }
                }
            });
        });
    }

    /**
     * Setup project card click handlers
     */
    setupProjectCardHandlers() {
        // Use event delegation for better performance
        document.addEventListener('click', (e) => {
            // Check if clicked element is within project overlay
            const overlayContent = e.target.closest('.project-overlay-content');
            const overlayClose = e.target.closest('.project-overlay-close');
            const projectCard = e.target.closest('.project-card');

            if (overlayClose) {
                // Close overlay
                e.stopPropagation();
                const card = overlayClose.closest('.project-card');
                if (card) {
                    card.classList.remove('overlay-active');
                }
                return;
            }

            if (overlayContent) {
                // Get project card and open modal
                e.stopPropagation();
                const card = overlayContent.closest('.project-card');
                if (card) {
                    const projectId = card.getAttribute('data-project-id');
                    this.openProjectModal(projectId);
                }
                return;
            }

            // For touch devices - toggle overlay on card tap
            if (projectCard && !overlayContent && !overlayClose) {
                const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
                if (isTouchDevice) {
                    const isActive = projectCard.classList.contains('overlay-active');

                    // Close all other overlays
                    document.querySelectorAll('.project-card.overlay-active').forEach(card => {
                        if (card !== projectCard) {
                            card.classList.remove('overlay-active');
                        }
                    });

                    // Toggle current overlay
                    if (!isActive) {
                        projectCard.classList.add('overlay-active');
                    }
                }
            }
        });

        // For desktop - open modal on card click (when not hovering overlay)
        const projectCards = document.querySelectorAll('.project-card');
        projectCards.forEach(card => {
            // Desktop: click on card image opens modal directly
            const projectImg = card.querySelector('.project-img');
            if (projectImg) {
                projectImg.addEventListener('click', (e) => {
                    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

                    // On desktop, if clicking the image area but not the overlay, open modal
                    if (!isTouchDevice && !e.target.closest('.project-overlay-content')) {
                        const projectId = card.getAttribute('data-project-id');
                        this.openProjectModal(projectId);
                    }
                });
            }
        });
    }

    /**
     * Setup project filter buttons
     */
    setupProjectFilters() {
        const projectsFilter = document.querySelector('.projects-filter');
        const projectsGrid = document.querySelector('.projects-grid');

        if (!projectsFilter || !projectsGrid) return;

        const filterButtons = Array.from(projectsFilter.querySelectorAll('.filter-btn'));
        const projectCards = Array.from(projectsGrid.querySelectorAll('.project-card'));

        if (filterButtons.length === 0 || projectCards.length === 0) return;

        projectsFilter.addEventListener('click', (e) => {
            const button = e.target.closest('.filter-btn');
            if (!button) return;

            const filter = button.getAttribute('data-filter');
            if (!filter) return;

            this.applyProjectFilter(filter, {
                button,
                filterButtons,
                projectCards,
                projectsGrid
            });
        });
    }

    /**
     * Apply project filter to cards
     */
    applyProjectFilter(filter, context) {
        const { button, filterButtons, projectCards, projectsGrid } = context;

        // Update active button state
        filterButtons.forEach(filterButton => {
            const isActive = filterButton === button;
            filterButton.classList.toggle('active', isActive);
            filterButton.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            filterButton.classList.remove('activating');
        });

        button.classList.add('activating');
        setTimeout(() => button.classList.remove('activating'), 300);

        projectsGrid.classList.add('reflowing');

        projectCards.forEach(card => {
            const category = card.getAttribute('data-category');
            const shouldShow = filter === 'all' || category === filter;

            card.classList.remove('filtering-in', 'filtering-out');

            if (shouldShow) {
                card.classList.remove('filtered-out', 'overlay-active');
                card.classList.add('filtered-in');
                card.setAttribute('aria-hidden', 'false');

                // Restart entrance animation for visible cards
                void card.offsetWidth;
                card.classList.add('filtering-in');
            } else {
                card.classList.remove('filtered-in', 'overlay-active');
                card.classList.add('filtered-out');
                card.setAttribute('aria-hidden', 'true');
            }
        });

        setTimeout(() => {
            projectsGrid.classList.remove('reflowing');
            projectCards.forEach(card => card.classList.remove('filtering-in'));
        }, 450);
    }

    /**
     * Get project data merged with available i18n translations
     * @param {string} projectId
     * @returns {Object|null}
     */
    getProjectData(projectId) {
        if (!projectId || typeof projectsData === 'undefined') {
            return null;
        }

        const baseProject = projectsData[projectId];
        if (!baseProject) {
            return null;
        }

        return this.getLocalizedProjectData(baseProject, projectId);
    }

    /**
     * Merge base project data with locale-specific values when available
     * @param {Object} baseProject
     * @param {string} projectId
     * @returns {Object}
     */
    getLocalizedProjectData(baseProject, projectId) {
        const i18n = this.modules.i18n;
        if (!i18n || typeof i18n.translate !== 'function') {
            return { ...baseProject };
        }

        const keyPrefix = `projects.${projectId}`;
        const currentLanguage = typeof i18n.getCurrentLanguage === 'function'
            ? i18n.getCurrentLanguage()
            : null;

        const localizedTitle = i18n.translate(`${keyPrefix}.title`, baseProject.title);
        const localizedDescription = i18n.translate(`${keyPrefix}.description`, baseProject.description);
        const localizedTags = i18n.translate(`${keyPrefix}.tags`, baseProject.tags);
        const localizedFeatures = i18n.translate(`${keyPrefix}.features`, baseProject.features);
        const localizedTechnologies = i18n.translate(`${keyPrefix}.technologies`, baseProject.technologies);
        const localizedLongDescription = i18n.translate(`${keyPrefix}.longDescription`);
        const hasLongDescriptionTranslation =
            typeof localizedLongDescription === 'string' &&
            localizedLongDescription !== `${keyPrefix}.longDescription`;

        return {
            ...baseProject,
            title: localizedTitle,
            description: localizedDescription,
            tags: Array.isArray(localizedTags) ? localizedTags : baseProject.tags,
            features: Array.isArray(localizedFeatures) ? localizedFeatures : baseProject.features,
            technologies: Array.isArray(localizedTechnologies) ? localizedTechnologies : baseProject.technologies,
            longDescription: hasLongDescriptionTranslation
                ? localizedLongDescription
                : (currentLanguage && currentLanguage !== 'en-US'
                    ? localizedDescription
                    : baseProject.longDescription)
        };
    }

    /**
     * Refresh modal content with translated project data if it is currently open
     */
    refreshOpenProjectModal() {
        const modal = this.modules.projectModal;
        if (!modal || !modal.isOpen || !modal.currentProject || !modal.currentProject.id) {
            return;
        }

        const localizedProject = this.getProjectData(modal.currentProject.id);
        if (!localizedProject) {
            return;
        }

        if (typeof modal.refreshContent === 'function') {
            modal.refreshContent(localizedProject);
            return;
        }

        if (typeof modal.populateModal === 'function') {
            modal.currentProject = localizedProject;
            modal.populateModal(localizedProject);
        }
    }

    /**
     * Open project modal with project data
     */
    openProjectModal(projectId) {
        if (!projectId || typeof projectsData === 'undefined') {
            console.error('Project data not available');
            return;
        }

        const projectData = this.getProjectData(projectId);

        if (!projectData) {
            console.error('Project not found:', projectId);
            return;
        }

        // Wait for modal to be initialized
        if (this.modules.projectModal) {
            this.modules.projectModal.open(projectData);
            this.eventBus.emit('modal:opened', {
                projectId: projectId,
                projectTitle: projectData.title
            });
        } else {
            console.warn('Project modal not initialized yet');
        }
    }

    /**
     * Setup inter-module communication
     */
    setupModuleCommunication() {
        // Language change events
        this.eventBus.on('language:changed', (data) => {
            console.log('Language changed to:', data.language);

            // Update HTML lang attribute
            document.documentElement.lang = data.language;

            // Announce to screen readers
            this.announceToScreenReader(`Language changed to ${data.languageName}`);

            // Track with analytics
            if (this.modules.analytics) {
                this.modules.analytics.trackLanguageChange(data.language);
            }

            this.refreshOpenProjectModal();
        });

        // Form submission events
        this.eventBus.on('form:submitted', (data) => {
            console.log('Form submitted:', data);

            // Track with performance monitor if available
            if (this.modules.performanceMonitor) {
                this.modules.performanceMonitor.trackEvent('form_submission', {
                    success: data.success
                });
            }

            // Track with analytics
            if (this.modules.analytics) {
                this.modules.analytics.trackContactAttempt('form');
            }
        });

        // Modal events
        this.eventBus.on('modal:opened', (data) => {
            console.log('Modal opened:', data);
            document.body.style.overflow = 'hidden';

            // Track project view with analytics
            if (this.modules.analytics && data.projectId) {
                this.modules.analytics.trackProjectView(data.projectId, data.projectTitle || 'Unknown Project');
            }
        });

        this.eventBus.on('modal:closed', (data) => {
            console.log('Modal closed:', data);
            document.body.style.overflow = '';
        });
    }

    /**
     * Toggle mobile menu
     */
    toggleMobileMenu() {
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const mobileNav = document.querySelector('.mobile-nav');

        if (!mobileMenuBtn || !mobileNav) return;

        const isActive = mobileMenuBtn.classList.toggle('active');
        mobileNav.classList.toggle('active');

        // Update ARIA attributes
        mobileMenuBtn.setAttribute('aria-expanded', isActive);
        mobileNav.setAttribute('aria-hidden', !isActive);

        // Transform hamburger to X
        const bars = mobileMenuBtn.querySelectorAll('.bar');
        if (isActive) {
            bars[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            bars[1].style.opacity = '0';
            bars[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
            document.body.style.overflow = 'hidden';

            // Focus first link
            setTimeout(() => {
                const firstLink = mobileNav.querySelector('a');
                if (firstLink) firstLink.focus();
            }, 300);
        } else {
            bars[0].style.transform = 'none';
            bars[1].style.opacity = '1';
            bars[2].style.transform = 'none';
            document.body.style.overflow = '';
        }

        this.eventBus.emit('mobile-menu:toggled', { isActive });
    }

    /**
     * Handle scroll events
     */
    handleScroll() {
        const header = document.querySelector('header');
        const backToTopBtn = document.querySelector('.back-to-top');

        if (window.scrollY > 50) {
            header?.classList.add('scrolled');
            backToTopBtn?.classList.add('active');
        } else {
            header?.classList.remove('scrolled');
            backToTopBtn?.classList.remove('active');
        }
    }

    /**
     * Handle smooth scroll
     */
    handleSmoothScroll(e) {
        const targetId = e.currentTarget.getAttribute('href');

        // Don't handle external links, mailto, tel, etc.
        if (!targetId || targetId === '#' || !targetId.startsWith('#')) return;

        const targetElement = document.querySelector(targetId);
        if (!targetElement) return;

        e.preventDefault();

        const offsetPosition = this.getAnchorScrollPosition(targetElement);

        window.scrollTo({
            top: Math.max(0, offsetPosition),
            behavior: 'smooth'
        });

        this.scheduleAnchorScrollCorrection(targetElement);
    }

    /**
     * Get scroll position for an anchor target accounting for the current header height
     */
    getAnchorScrollPosition(targetElement) {
        const header = document.querySelector('header');
        const headerOffset = header ? header.getBoundingClientRect().height : 80;
        const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;

        return elementPosition - headerOffset;
    }

    /**
     * Correct anchor position after smooth scroll in case layout shifts on first load
     */
    scheduleAnchorScrollCorrection(targetElement) {
        if (!targetElement) return;

        if (this.anchorScrollCorrectionTimeout) {
            clearTimeout(this.anchorScrollCorrectionTimeout);
        }

        const correctPosition = () => {
            const correctedPosition = Math.max(0, this.getAnchorScrollPosition(targetElement));
            const difference = Math.abs(window.pageYOffset - correctedPosition);
            this.anchorScrollCorrectionTimeout = null;

            // Only correct when there is a visible mismatch
            if (difference > 8) {
                window.scrollTo(0, correctedPosition);
            }
        };

        this.anchorScrollCorrectionTimeout = setTimeout(correctPosition, 700);

        // First visit can still shift layout after click (fonts/images). Re-align once page finishes loading.
        if (document.readyState !== 'complete') {
            if (this.anchorScrollLoadHandler) {
                window.removeEventListener('load', this.anchorScrollLoadHandler);
            }

            this.anchorScrollLoadHandler = () => {
                correctPosition();
                this.anchorScrollLoadHandler = null;
            };

            window.addEventListener('load', this.anchorScrollLoadHandler, { once: true });
        }
    }

    /**
     * Update active navigation link
     */
    updateActiveNavLink() {
        const sections = document.querySelectorAll('section');
        const headerOffset = 80;
        const scrollPosition = window.scrollY + headerOffset + 1;

        let currentSection = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSection = sectionId;
            }
        });

        if (currentSection) {
            document.querySelectorAll('nav a').forEach(link => {
                link.classList.remove('active');
                link.removeAttribute('aria-current');
                if (link.getAttribute('href') === `#${currentSection}`) {
                    link.classList.add('active');
                    link.setAttribute('aria-current', 'page');
                }
            });
        }
    }

    /**
     * Announce message to screen readers
     */
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        document.body.appendChild(announcement);

        setTimeout(() => announcement.remove(), 1000);
    }

    /**
     * Handle initialization errors
     */
    handleInitializationError(error) {
        console.error('Application initialization failed:', error);

        // Show user-friendly error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'app-error';
        errorMessage.innerHTML = `
            <div class="app-error-content">
                <h3>Oops! Something went wrong</h3>
                <p>We're having trouble loading the application. Please refresh the page to try again.</p>
                <button onclick="window.location.reload()">Refresh Page</button>
            </div>
        `;
        document.body.appendChild(errorMessage);
    }

    /**
     * Get module instance
     */
    getModule(name) {
        return this.modules[name];
    }

    /**
     * Get event bus
     */
    getEventBus() {
        return this.eventBus;
    }
}

/**
 * Event Bus for inter-module communication
 */
class EventBus {
    constructor() {
        this.events = {};
    }

    /**
     * Subscribe to an event
     */
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    /**
     * Unsubscribe from an event
     */
    off(event, callback) {
        if (!this.events[event]) return;

        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }

    /**
     * Emit an event
     */
    emit(event, data) {
        if (!this.events[event]) return;

        this.events[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event handler for ${event}:`, error);
            }
        });
    }

    /**
     * Subscribe to an event once
     */
    once(event, callback) {
        const onceCallback = (data) => {
            callback(data);
            this.off(event, onceCallback);
        };
        this.on(event, onceCallback);
    }
}

// Create global app instance
const app = new App();

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

// Expose app to window for debugging
window.app = app;
