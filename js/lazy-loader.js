/**
 * LazyLoader - Handles lazy loading of images using Intersection Observer
 * Implements loading placeholders and modern image format support
 */
class LazyLoader {
  constructor() {
    this.images = [];
    this.observer = null;
    this.options = {
      root: null,
      rootMargin: '200px', // Increased for better UX
      threshold: 0.01
    };
  }

  /**
   * Initialize the lazy loader
   */
  init() {
    // Check if Intersection Observer is supported
    if (!('IntersectionObserver' in window)) {
      // Fallback: load all images immediately
      this.loadAllImages();
      return;
    }

    // Setup Intersection Observer
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      this.options
    );

    // Find all images with data-src attribute
    this.images = document.querySelectorAll('img[data-src]');

    // Prioritize above-the-fold images
    const viewportHeight = window.innerHeight;
    const priorityImages = [];
    const deferredImages = [];

    this.images.forEach(img => {
      const rect = img.getBoundingClientRect();
      if (rect.top < viewportHeight * 1.5) {
        priorityImages.push(img);
      } else {
        deferredImages.push(img);
      }
    });

    // Load priority images immediately
    priorityImages.forEach(img => {
      img.classList.add('lazy-loading');
      this.loadImage(img);
    });

    // Observe deferred images
    deferredImages.forEach(img => {
      this.observer.observe(img);
      img.classList.add('lazy-loading');
    });
  }

  /**
   * Handle intersection events
   * @param {IntersectionObserverEntry[]} entries
   */
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.loadImage(entry.target);
      }
    });
  }

  /**
   * Load a single image
   * @param {HTMLImageElement} img
   */
  loadImage(img) {
    const src = img.dataset.src;
    const srcset = img.dataset.srcset;

    if (!src) return;

    // Create a new image to preload
    const tempImg = new Image();

    tempImg.onload = () => {
      // Set the actual src
      img.src = src;

      // Set srcset if available (for responsive images)
      if (srcset) {
        img.srcset = srcset;
      }

      // Remove loading class and add loaded class
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-loaded');

      // Remove data attributes
      delete img.dataset.src;
      if (srcset) delete img.dataset.srcset;

      // Stop observing this image
      if (this.observer) {
        this.observer.unobserve(img);
      }
    };

    tempImg.onerror = () => {
      console.error(`Failed to load image: ${src}`);
      img.classList.remove('lazy-loading');
      img.classList.add('lazy-error');

      if (this.observer) {
        this.observer.unobserve(img);
      }
    };

    // Start loading
    tempImg.src = src;
  }

  /**
   * Fallback: Load all images immediately (for browsers without Intersection Observer)
   */
  loadAllImages() {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => {
      const src = img.dataset.src;
      const srcset = img.dataset.srcset;

      if (src) {
        img.src = src;
        delete img.dataset.src;
      }

      if (srcset) {
        img.srcset = srcset;
        delete img.dataset.srcset;
      }
    });
  }

  /**
   * Manually trigger loading of a specific image
   * @param {HTMLImageElement} img
   */
  loadImageNow(img) {
    if (img.dataset.src) {
      this.loadImage(img);
    }
  }

  /**
   * Disconnect the observer
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LazyLoader;
}
