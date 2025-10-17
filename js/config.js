/**
 * Application Configuration
 * Centralized configuration for the portfolio application
 */

const AppConfig = {
    // Analytics Configuration
    analytics: {
        // Google Analytics 4 Tracking ID
        // Replace 'G-XXXXXXXXXX' with your actual GA4 tracking ID
        trackingId: 'G-XXXXXXXXXX',

        // Enable/disable analytics
        enabled: false, // Set to true when you have a valid tracking ID

        // Debug mode - logs analytics events to console
        debug: false,

        // Anonymize IP addresses for privacy
        anonymizeIp: true,

        // Require cookie consent before tracking
        cookieConsent: true,

        // Custom dimensions (optional)
        customDimensions: {
            // Add custom dimensions here
            // Example: user_type: 'visitor'
        }
    },

    // i18n Configuration
    i18n: {
        defaultLanguage: 'pt-BR',
        supportedLanguages: ['pt-BR', 'en-US', 'es-ES'],
        fallbackLanguage: 'pt-BR'
    },

    // Theme Configuration
    theme: {
        defaultTheme: 'dark',
        enableSystemDetection: true
    },

    // Performance Configuration
    performance: {
        enableMonitoring: true,
        enableReporting: false,
        sampleRate: 1.0
    },

    // Form Configuration
    form: {
        emailService: 'formsubmit',
        emailServiceConfig: {
            email: 'vitorjacquesdev@gmail.com'
        }
    },

    // Feature Flags
    features: {
        enableLazyLoading: true,
        enableAnimations: true
    },

    // Environment
    environment: 'production', // 'development' or 'production'

    // Debug mode
    debug: false
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppConfig;
}

// Make available globally
window.AppConfig = AppConfig;
