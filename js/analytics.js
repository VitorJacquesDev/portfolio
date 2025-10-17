/**
 * Analytics Manager
 * Handles analytics tracking for user interactions and events
 * Supports Google Analytics 4 (GA4) and custom event tracking
 */

class AnalyticsManager {
    constructor(config = {}) {
        this.config = {
            enabled: true,
            trackingId: config.trackingId || null,
            debug: config.debug || false,
            anonymizeIp: config.anonymizeIp !== false,
            cookieConsent: config.cookieConsent !== false,
            customDimensions: config.customDimensions || {},
            ...config
        };
        
        this.initialized = false;
        this.consentGiven = false;
        this.queue = [];
    }

    /**
     * Initialize analytics
     */
    async init() {
        if (this.initialized) {
            console.warn('Analytics already initialized');
            return;
        }

        try {
            // Check if analytics is enabled
            if (!this.config.enabled) {
                console.log('Analytics disabled');
                return;
            }

            // Check for tracking ID
            if (!this.config.trackingId) {
                console.warn('Analytics tracking ID not provided');
                return;
            }

            // Check cookie consent if required
            if (this.config.cookieConsent) {
                this.consentGiven = this.checkCookieConsent();
                if (!this.consentGiven) {
                    this.showCookieConsent();
                    return;
                }
            } else {
                this.consentGiven = true;
            }

            // Load Google Analytics
            await this.loadGoogleAnalytics();

            // Setup event tracking
            this.setupEventTracking();

            // Process queued events
            this.processQueue();

            this.initialized = true;
            console.log('✓ Analytics initialized');

        } catch (error) {
            console.error('Failed to initialize analytics:', error);
        }
    }

    /**
     * Load Google Analytics script
     */
    async loadGoogleAnalytics() {
        return new Promise((resolve, reject) => {
            try {
                // Create gtag script
                const script = document.createElement('script');
                script.async = true;
                script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.trackingId}`;
                script.onload = () => {
                    // Initialize gtag
                    window.dataLayer = window.dataLayer || [];
                    window.gtag = function() {
                        window.dataLayer.push(arguments);
                    };
                    
                    gtag('js', new Date());
                    gtag('config', this.config.trackingId, {
                        anonymize_ip: this.config.anonymizeIp,
                        cookie_flags: 'SameSite=None;Secure',
                        ...this.config.customDimensions
                    });

                    if (this.config.debug) {
                        console.log('Google Analytics loaded:', this.config.trackingId);
                    }

                    resolve();
                };
                script.onerror = () => {
                    reject(new Error('Failed to load Google Analytics'));
                };

                document.head.appendChild(script);

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Setup automatic event tracking
     */
    setupEventTracking() {
        // Track page views
        this.trackPageView();

        // Track outbound links
        this.trackOutboundLinks();

        // Track downloads
        this.trackDownloads();

        // Track form submissions
        this.trackFormSubmissions();

        // Track scroll depth
        this.trackScrollDepth();

        // Track time on page
        this.trackTimeOnPage();

        // Track errors
        this.trackErrors();
    }

    /**
     * Track page view
     */
    trackPageView(path = null) {
        const page = path || window.location.pathname + window.location.search;
        
        this.trackEvent('page_view', {
            page_path: page,
            page_title: document.title,
            page_location: window.location.href
        });

        if (this.config.debug) {
            console.log('Page view tracked:', page);
        }
    }

    /**
     * Track outbound links
     */
    trackOutboundLinks() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;

            const href = link.getAttribute('href');
            if (!href) return;

            // Check if it's an outbound link
            const isOutbound = href.startsWith('http') && 
                              !href.includes(window.location.hostname);

            if (isOutbound) {
                this.trackEvent('click', {
                    event_category: 'outbound',
                    event_label: href,
                    link_text: link.textContent.trim(),
                    link_url: href
                });
            }
        });
    }

    /**
     * Track downloads
     */
    trackDownloads() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;

            const href = link.getAttribute('href');
            if (!href) return;

            // Check if it's a download link
            const downloadExtensions = ['.pdf', '.doc', '.docx', '.zip', '.rar', '.exe', '.dmg'];
            const isDownload = downloadExtensions.some(ext => href.toLowerCase().endsWith(ext));

            if (isDownload) {
                this.trackEvent('file_download', {
                    event_category: 'download',
                    event_label: href,
                    file_name: href.split('/').pop(),
                    file_extension: href.split('.').pop()
                });
            }
        });
    }

    /**
     * Track form submissions
     */
    trackFormSubmissions() {
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (!form || form.tagName !== 'FORM') return;

            const formId = form.id || 'unknown';
            const formName = form.name || formId;

            this.trackEvent('form_submit', {
                event_category: 'form',
                event_label: formName,
                form_id: formId,
                form_name: formName
            });
        });
    }

    /**
     * Track scroll depth
     */
    trackScrollDepth() {
        const thresholds = [25, 50, 75, 100];
        const tracked = new Set();

        const checkScrollDepth = () => {
            const scrollPercentage = Math.round(
                (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100
            );

            thresholds.forEach(threshold => {
                if (scrollPercentage >= threshold && !tracked.has(threshold)) {
                    tracked.add(threshold);
                    
                    this.trackEvent('scroll', {
                        event_category: 'engagement',
                        event_label: `${threshold}%`,
                        scroll_depth: threshold
                    });
                }
            });
        };

        // Throttle scroll events
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            if (scrollTimeout) return;
            
            scrollTimeout = setTimeout(() => {
                checkScrollDepth();
                scrollTimeout = null;
            }, 500);
        });
    }

    /**
     * Track time on page
     */
    trackTimeOnPage() {
        const startTime = Date.now();
        const intervals = [30, 60, 120, 300]; // seconds
        const tracked = new Set();

        setInterval(() => {
            const timeOnPage = Math.floor((Date.now() - startTime) / 1000);

            intervals.forEach(interval => {
                if (timeOnPage >= interval && !tracked.has(interval)) {
                    tracked.add(interval);
                    
                    this.trackEvent('timing', {
                        event_category: 'engagement',
                        event_label: `${interval}s`,
                        time_on_page: interval
                    });
                }
            });
        }, 10000); // Check every 10 seconds
    }

    /**
     * Track JavaScript errors
     */
    trackErrors() {
        window.addEventListener('error', (e) => {
            this.trackEvent('exception', {
                description: e.message,
                fatal: false,
                error_message: e.message,
                error_file: e.filename,
                error_line: e.lineno,
                error_column: e.colno
            });
        });

        window.addEventListener('unhandledrejection', (e) => {
            this.trackEvent('exception', {
                description: e.reason?.message || 'Unhandled Promise Rejection',
                fatal: false,
                error_type: 'promise_rejection'
            });
        });
    }

    /**
     * Track custom event
     */
    trackEvent(eventName, eventParams = {}) {
        if (!this.initialized || !this.consentGiven) {
            // Queue event for later
            this.queue.push({ eventName, eventParams });
            return;
        }

        try {
            if (typeof gtag !== 'undefined') {
                gtag('event', eventName, eventParams);

                if (this.config.debug) {
                    console.log('Event tracked:', eventName, eventParams);
                }
            }
        } catch (error) {
            console.error('Failed to track event:', error);
        }
    }

    /**
     * Track user interaction
     */
    trackInteraction(category, action, label = null, value = null) {
        this.trackEvent('interaction', {
            event_category: category,
            event_action: action,
            event_label: label,
            value: value
        });
    }

    /**
     * Track language change
     */
    trackLanguageChange(language) {
        this.trackEvent('language_change', {
            event_category: 'user_preference',
            event_label: language,
            language: language
        });
    }

    /**
     * Track theme change
     */
    trackThemeChange(theme) {
        this.trackEvent('theme_change', {
            event_category: 'user_preference',
            event_label: theme,
            theme: theme
        });
    }

    /**
     * Track project view
     */
    trackProjectView(projectId, projectTitle) {
        this.trackEvent('view_item', {
            event_category: 'project',
            event_label: projectTitle,
            item_id: projectId,
            item_name: projectTitle
        });
    }

    /**
     * Track contact attempt
     */
    trackContactAttempt(method = 'form') {
        this.trackEvent('contact', {
            event_category: 'engagement',
            event_label: method,
            contact_method: method
        });
    }

    /**
     * Check cookie consent
     */
    checkCookieConsent() {
        return localStorage.getItem('analytics-consent') === 'true';
    }

    /**
     * Grant cookie consent
     */
    grantConsent() {
        localStorage.setItem('analytics-consent', 'true');
        this.consentGiven = true;
        
        // Hide consent banner
        const banner = document.querySelector('.cookie-consent-banner');
        if (banner) {
            banner.classList.remove('show');
            setTimeout(() => banner.remove(), 300);
        }

        // Initialize analytics
        this.init();
    }

    /**
     * Deny cookie consent
     */
    denyConsent() {
        localStorage.setItem('analytics-consent', 'false');
        this.consentGiven = false;
        
        // Hide consent banner
        const banner = document.querySelector('.cookie-consent-banner');
        if (banner) {
            banner.classList.remove('show');
            setTimeout(() => banner.remove(), 300);
        }
    }

    /**
     * Show cookie consent banner
     */
    showCookieConsent() {
        // Check if already shown
        if (document.querySelector('.cookie-consent-banner')) {
            return;
        }

        const banner = document.createElement('div');
        banner.className = 'cookie-consent-banner';
        banner.innerHTML = `
            <div class="cookie-consent-content">
                <div class="cookie-consent-text">
                    <h3>🍪 Cookie Notice</h3>
                    <p>We use cookies and analytics to improve your experience and understand how you use our site. Your privacy is important to us.</p>
                </div>
                <div class="cookie-consent-buttons">
                    <button class="btn primary-btn" onclick="window.analytics.grantConsent()">Accept</button>
                    <button class="btn secondary-btn" onclick="window.analytics.denyConsent()">Decline</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(banner);
        
        // Show banner with animation
        setTimeout(() => banner.classList.add('show'), 100);
    }

    /**
     * Process queued events
     */
    processQueue() {
        if (this.queue.length === 0) return;

        this.queue.forEach(({ eventName, eventParams }) => {
            this.trackEvent(eventName, eventParams);
        });

        this.queue = [];
    }

    /**
     * Set user properties
     */
    setUserProperties(properties) {
        if (!this.initialized || !this.consentGiven) return;

        try {
            if (typeof gtag !== 'undefined') {
                gtag('set', 'user_properties', properties);

                if (this.config.debug) {
                    console.log('User properties set:', properties);
                }
            }
        } catch (error) {
            console.error('Failed to set user properties:', error);
        }
    }

    /**
     * Disable analytics
     */
    disable() {
        this.config.enabled = false;
        this.initialized = false;
        
        // Disable Google Analytics
        if (this.config.trackingId) {
            window[`ga-disable-${this.config.trackingId}`] = true;
        }

        console.log('Analytics disabled');
    }

    /**
     * Enable analytics
     */
    enable() {
        this.config.enabled = true;
        
        // Enable Google Analytics
        if (this.config.trackingId) {
            window[`ga-disable-${this.config.trackingId}`] = false;
        }

        this.init();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsManager;
}
