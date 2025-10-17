/**
 * I18nManager - Internationalization Manager
 * Handles language detection, translation loading, and DOM updates
 */
class I18nManager {
  constructor() {
    // Singleton pattern
    if (I18nManager.instance) {
      return I18nManager.instance;
    }
    I18nManager.instance = this;

    this.currentLang = null;
    this.translations = {};
    this.supportedLanguages = ['pt-BR', 'en-US', 'es-ES'];
    this.defaultLanguage = 'pt-BR';
    this.observers = [];
  }

  /**
   * Initialize the i18n system
   */
  async init() {
    try {
      // Detect language from browser
      const detectedLang = this.detectLanguage();
      await this.setLanguage(detectedLang);
      return true;
    } catch (error) {
      console.error('Failed to initialize i18n:', error);
      // Fallback to default language
      await this.setLanguage(this.defaultLanguage);
      return false;
    }
  }

  /**
   * Detect user's preferred language
   * Priority: browser language > default
   */
  detectLanguage() {
    // Check browser language
    const browserLang = navigator.language || navigator.userLanguage;

    // Try exact match first
    if (this.supportedLanguages.includes(browserLang)) {
      return browserLang;
    }

    // Try language code without region (e.g., 'en' from 'en-GB')
    const langCode = browserLang.split('-')[0];
    const matchedLang = this.supportedLanguages.find(lang =>
      lang.startsWith(langCode)
    );

    return matchedLang || this.defaultLanguage;
  }

  /**
   * Load translation file for a specific language
   */
  async loadLanguage(lang) {
    try {
      const response = await fetch(`/locales/${lang}.json`);

      if (!response.ok) {
        throw new Error(`Failed to load ${lang}.json: ${response.status}`);
      }

      const translations = await response.json();
      this.translations[lang] = translations;
      return translations;
    } catch (error) {
      console.error(`Error loading language file ${lang}:`, error);

      // If not default language, try loading default as fallback
      if (lang !== this.defaultLanguage && !this.translations[this.defaultLanguage]) {
        console.log(`Falling back to default language: ${this.defaultLanguage}`);
        return await this.loadLanguage(this.defaultLanguage);
      }

      throw error;
    }
  }

  /**
   * Set the current language and apply translations
   */
  async setLanguage(lang) {
    if (!this.supportedLanguages.includes(lang)) {
      console.warn(`Language ${lang} not supported, using default`);
      lang = this.defaultLanguage;
    }

    try {
      // Load translations if not already loaded
      await this.loadLanguage(lang);

      // Update current language
      const previousLang = this.currentLang;
      this.currentLang = lang;

      // Update HTML lang attribute
      document.documentElement.lang = lang;

      // Apply translations to DOM
      this.applyTranslations();

      // Update meta tags
      this.updateMetaTags();

      // Notify observers
      this.notifyObservers(lang, previousLang);

      // Announce language change for screen readers
      this.announceLanguageChange(lang);

      return true;
    } catch (error) {
      console.error(`Failed to set language to ${lang}:`, error);
      return false;
    }
  }

  /**
   * Get translation for a key using dot notation
   * Example: translate('nav.home') returns translations.nav.home
   */
  translate(key, fallback = '') {
    if (!this.currentLang || !this.translations[this.currentLang]) {
      return fallback || key;
    }

    const keys = key.split('.');
    let value = this.translations[this.currentLang];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Key not found, try default language
        if (this.currentLang !== this.defaultLanguage && this.translations[this.defaultLanguage]) {
          let defaultValue = this.translations[this.defaultLanguage];
          for (const dk of keys) {
            if (defaultValue && typeof defaultValue === 'object' && dk in defaultValue) {
              defaultValue = defaultValue[dk];
            } else {
              return fallback || key;
            }
          }
          return defaultValue;
        }
        return fallback || key;
      }
    }

    return value;
  }

  /**
   * Apply translations to all elements with data-i18n attribute
   */
  applyTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');

    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.translate(key);

      // Update text content
      if (translation && translation !== key) {
        // Check if element has data-i18n-attr for attribute translation
        const attr = element.getAttribute('data-i18n-attr');
        if (attr) {
          element.setAttribute(attr, translation);
        } else {
          // Check if element contains only text (no child elements)
          // If it has child elements, preserve them and only update text nodes
          if (element.children.length === 0) {
            element.textContent = translation;
          } else {
            // Find and update only text nodes, preserving child elements
            const textNodes = Array.from(element.childNodes).filter(
              node => node.nodeType === Node.TEXT_NODE
            );
            if (textNodes.length > 0) {
              textNodes[0].textContent = translation;
            }
          }
        }
      }
    });
  }

  /**
   * Update meta tags based on current language
   */
  updateMetaTags() {
    const meta = this.translate('meta');

    if (meta && typeof meta === 'object') {
      // Update title
      if (meta.title) {
        document.title = meta.title;
      }

      // Update meta description
      const descMeta = document.querySelector('meta[name="description"]');
      if (descMeta && meta.description) {
        descMeta.setAttribute('content', meta.description);
      }

      // Update meta keywords
      const keywordsMeta = document.querySelector('meta[name="keywords"]');
      if (keywordsMeta && meta.keywords) {
        keywordsMeta.setAttribute('content', meta.keywords);
      }

      // Update Open Graph title
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle && meta.title) {
        ogTitle.setAttribute('content', meta.title);
      }

      // Update Open Graph description
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc && meta.description) {
        ogDesc.setAttribute('content', meta.description);
      }
    }
  }

  /**
   * Subscribe to language change events
   */
  subscribe(callback) {
    this.observers.push(callback);
  }

  /**
   * Unsubscribe from language change events
   */
  unsubscribe(callback) {
    this.observers = this.observers.filter(obs => obs !== callback);
  }

  /**
   * Notify all observers of language change
   */
  notifyObservers(newLang, oldLang) {
    this.observers.forEach(callback => {
      try {
        callback(newLang, oldLang);
      } catch (error) {
        console.error('Error in i18n observer:', error);
      }
    });
  }

  /**
   * Get current language
   */
  getCurrentLanguage() {
    return this.currentLang;
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages() {
    return [...this.supportedLanguages];
  }

  /**
   * Check if a language is supported
   */
  isLanguageSupported(lang) {
    return this.supportedLanguages.includes(lang);
  }

  /**
   * Announce language change for screen readers
   * @param {string} lang - The new language code
   */
  announceLanguageChange(lang) {
    const langNames = {
      'pt-BR': 'Português',
      'en-US': 'English',
      'es-ES': 'Español'
    };

    const liveRegion = document.getElementById('aria-live-region');
    if (liveRegion) {
      liveRegion.textContent = `Language changed to ${langNames[lang] || lang}`;

      // Clear after announcement
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  }
}

// Export singleton instance
const i18nManager = new I18nManager();
