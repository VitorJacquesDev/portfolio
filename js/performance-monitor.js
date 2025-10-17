/**
 * PerformanceMonitor - Tracks and reports performance metrics
 * Monitors Core Web Vitals, custom marks, and errors
 */
class PerformanceMonitor {
  constructor(config = {}) {
    this.config = {
      enableLogging: config.enableLogging !== false,
      enableReporting: config.enableReporting || false,
      reportingEndpoint: config.reportingEndpoint || null,
      sampleRate: config.sampleRate || 1.0, // 100% by default
      ...config
    };
    
    this.metrics = {
      navigation: {},
      resources: [],
      marks: {},
      measures: {},
      vitals: {},
      errors: []
    };
    
    this.observers = [];
  }

  /**
   * Initialize performance monitoring
   */
  init() {
    // Check if we should monitor based on sample rate
    if (Math.random() > this.config.sampleRate) {
      console.log('[Performance] Monitoring disabled for this session (sampling)');
      return;
    }
    
    // Monitor Core Web Vitals
    this.monitorCoreWebVitals();
    
    // Monitor navigation timing
    this.monitorNavigationTiming();
    
    // Monitor resource timing
    this.monitorResourceTiming();
    
    // Monitor long tasks
    this.monitorLongTasks();
    
    // Monitor errors
    this.monitorErrors();
    
    // Setup custom marks and measures
    this.setupCustomMetrics();
    
    // Report metrics on page unload
    this.setupReporting();
    
    if (this.config.enableLogging) {
      console.log('[Performance] Monitoring initialized');
    }
  }

  /**
   * Monitor Core Web Vitals (LCP, FID, CLS)
   */
  monitorCoreWebVitals() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          
          this.metrics.vitals.lcp = {
            value: lastEntry.renderTime || lastEntry.loadTime,
            rating: this.rateLCP(lastEntry.renderTime || lastEntry.loadTime),
            element: lastEntry.element?.tagName || 'unknown'
          };
          
          if (this.config.enableLogging) {
            console.log('[Performance] LCP:', this.metrics.vitals.lcp);
          }
        });
        
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (e) {
        console.warn('[Performance] LCP monitoring not supported');
      }
      
      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            this.metrics.vitals.fid = {
              value: entry.processingStart - entry.startTime,
              rating: this.rateFID(entry.processingStart - entry.startTime),
              eventType: entry.name
            };
            
            if (this.config.enableLogging) {
              console.log('[Performance] FID:', this.metrics.vitals.fid);
            }
          });
        });
        
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (e) {
        console.warn('[Performance] FID monitoring not supported');
      }
      
      // Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              
              this.metrics.vitals.cls = {
                value: clsValue,
                rating: this.rateCLS(clsValue)
              };
            }
          });
          
          if (this.config.enableLogging) {
            console.log('[Performance] CLS:', this.metrics.vitals.cls);
          }
        });
        
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (e) {
        console.warn('[Performance] CLS monitoring not supported');
      }
    }
  }

  /**
   * Monitor navigation timing
   */
  monitorNavigationTiming() {
    if ('performance' in window && 'getEntriesByType' in performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navTiming = performance.getEntriesByType('navigation')[0];
          
          if (navTiming) {
            this.metrics.navigation = {
              dns: navTiming.domainLookupEnd - navTiming.domainLookupStart,
              tcp: navTiming.connectEnd - navTiming.connectStart,
              ttfb: navTiming.responseStart - navTiming.requestStart,
              download: navTiming.responseEnd - navTiming.responseStart,
              domInteractive: navTiming.domInteractive,
              domComplete: navTiming.domComplete,
              loadComplete: navTiming.loadEventEnd,
              totalTime: navTiming.loadEventEnd - navTiming.fetchStart
            };
            
            if (this.config.enableLogging) {
              console.log('[Performance] Navigation Timing:', this.metrics.navigation);
            }
          }
        }, 0);
      });
    }
  }

  /**
   * Monitor resource timing
   */
  monitorResourceTiming() {
    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            this.metrics.resources.push({
              name: entry.name,
              type: entry.initiatorType,
              duration: entry.duration,
              size: entry.transferSize || 0,
              cached: entry.transferSize === 0 && entry.decodedBodySize > 0
            });
          });
        });
        
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (e) {
        console.warn('[Performance] Resource timing monitoring not supported');
      }
    }
  }

  /**
   * Monitor long tasks (tasks > 50ms)
   */
  monitorLongTasks() {
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (this.config.enableLogging) {
              console.warn('[Performance] Long task detected:', {
                duration: entry.duration,
                startTime: entry.startTime
              });
            }
            
            if (!this.metrics.longTasks) {
              this.metrics.longTasks = [];
            }
            
            this.metrics.longTasks.push({
              duration: entry.duration,
              startTime: entry.startTime
            });
          });
        });
        
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (e) {
        console.warn('[Performance] Long task monitoring not supported');
      }
    }
  }

  /**
   * Monitor JavaScript errors
   */
  monitorErrors() {
    window.addEventListener('error', (event) => {
      this.metrics.errors.push({
        type: 'error',
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        timestamp: Date.now()
      });
      
      if (this.config.enableLogging) {
        console.error('[Performance] Error tracked:', event.message);
      }
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      this.metrics.errors.push({
        type: 'unhandledRejection',
        message: event.reason?.message || event.reason,
        timestamp: Date.now()
      });
      
      if (this.config.enableLogging) {
        console.error('[Performance] Unhandled rejection tracked:', event.reason);
      }
    });
  }

  /**
   * Setup custom performance marks and measures
   */
  setupCustomMetrics() {
    // Mark when critical resources are loaded
    window.addEventListener('load', () => {
      this.mark('page-loaded');
    });
    
    // Mark when DOM is interactive
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.mark('dom-interactive');
      });
    } else {
      this.mark('dom-interactive');
    }
  }

  /**
   * Create a performance mark
   */
  mark(name) {
    if ('performance' in window && 'mark' in performance) {
      try {
        performance.mark(name);
        this.metrics.marks[name] = performance.now();
        
        if (this.config.enableLogging) {
          console.log(`[Performance] Mark: ${name} at ${this.metrics.marks[name].toFixed(2)}ms`);
        }
      } catch (e) {
        console.warn(`[Performance] Failed to create mark: ${name}`);
      }
    }
  }

  /**
   * Create a performance measure
   */
  measure(name, startMark, endMark) {
    if ('performance' in window && 'measure' in performance) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name, 'measure')[0];
        
        if (measure) {
          this.metrics.measures[name] = measure.duration;
          
          if (this.config.enableLogging) {
            console.log(`[Performance] Measure: ${name} = ${measure.duration.toFixed(2)}ms`);
          }
        }
      } catch (e) {
        console.warn(`[Performance] Failed to create measure: ${name}`);
      }
    }
  }

  /**
   * Rate LCP (Largest Contentful Paint)
   */
  rateLCP(value) {
    if (value <= 2500) return 'good';
    if (value <= 4000) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Rate FID (First Input Delay)
   */
  rateFID(value) {
    if (value <= 100) return 'good';
    if (value <= 300) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Rate CLS (Cumulative Layout Shift)
   */
  rateCLS(value) {
    if (value <= 0.1) return 'good';
    if (value <= 0.25) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Get all metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connection: this.getConnectionInfo()
    };
  }

  /**
   * Get connection information
   */
  getConnectionInfo() {
    if ('connection' in navigator) {
      const conn = navigator.connection;
      return {
        effectiveType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt,
        saveData: conn.saveData
      };
    }
    return null;
  }

  /**
   * Setup reporting on page unload
   */
  setupReporting() {
    if (!this.config.enableReporting || !this.config.reportingEndpoint) {
      return;
    }
    
    // Use sendBeacon for reliable reporting on page unload
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.report();
      }
    });
    
    // Fallback for older browsers
    window.addEventListener('beforeunload', () => {
      this.report();
    });
  }

  /**
   * Report metrics to endpoint
   */
  report() {
    if (!this.config.reportingEndpoint) {
      return;
    }
    
    const metrics = this.getMetrics();
    const data = JSON.stringify(metrics);
    
    // Use sendBeacon for reliable delivery
    if ('sendBeacon' in navigator) {
      navigator.sendBeacon(this.config.reportingEndpoint, data);
    } else {
      // Fallback to fetch with keepalive
      fetch(this.config.reportingEndpoint, {
        method: 'POST',
        body: data,
        headers: {
          'Content-Type': 'application/json'
        },
        keepalive: true
      }).catch(err => {
        console.error('[Performance] Failed to report metrics:', err);
      });
    }
  }

  /**
   * Log current metrics to console
   */
  logMetrics() {
    const metrics = this.getMetrics();
    
    console.group('[Performance] Current Metrics');
    
    if (metrics.vitals.lcp) {
      console.log(`LCP: ${metrics.vitals.lcp.value.toFixed(2)}ms (${metrics.vitals.lcp.rating})`);
    }
    
    if (metrics.vitals.fid) {
      console.log(`FID: ${metrics.vitals.fid.value.toFixed(2)}ms (${metrics.vitals.fid.rating})`);
    }
    
    if (metrics.vitals.cls) {
      console.log(`CLS: ${metrics.vitals.cls.value.toFixed(3)} (${metrics.vitals.cls.rating})`);
    }
    
    if (metrics.navigation.totalTime) {
      console.log(`Total Load Time: ${metrics.navigation.totalTime.toFixed(2)}ms`);
      console.log(`TTFB: ${metrics.navigation.ttfb.toFixed(2)}ms`);
    }
    
    if (metrics.resources.length > 0) {
      const totalSize = metrics.resources.reduce((sum, r) => sum + r.size, 0);
      const cachedCount = metrics.resources.filter(r => r.cached).length;
      console.log(`Resources: ${metrics.resources.length} (${cachedCount} cached)`);
      console.log(`Total Size: ${(totalSize / 1024).toFixed(2)} KB`);
    }
    
    if (metrics.errors.length > 0) {
      console.warn(`Errors: ${metrics.errors.length}`);
    }
    
    if (metrics.longTasks && metrics.longTasks.length > 0) {
      console.warn(`Long Tasks: ${metrics.longTasks.length}`);
    }
    
    console.groupEnd();
  }

  /**
   * Disconnect all observers
   */
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceMonitor;
}
