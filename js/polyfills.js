/**
 * Polyfills for Cross-Browser Compatibility
 * Ensures the portfolio works on older browsers
 */

// Intersection Observer Polyfill (for older browsers)
if (!('IntersectionObserver' in window)) {
    console.warn('IntersectionObserver not supported, loading polyfill...');
    
    // Simple fallback - immediately show all elements
    window.IntersectionObserver = class IntersectionObserver {
        constructor(callback, options) {
            this.callback = callback;
            this.options = options || {};
            this.elements = [];
        }
        
        observe(element) {
            this.elements.push(element);
            // Immediately trigger callback
            setTimeout(() => {
                this.callback([{
                    target: element,
                    isIntersecting: true,
                    intersectionRatio: 1
                }], this);
            }, 0);
        }
        
        unobserve(element) {
            this.elements = this.elements.filter(el => el !== element);
        }
        
        disconnect() {
            this.elements = [];
        }
    };
}

// Fetch API Polyfill (for IE11 and older browsers)
if (!window.fetch) {
    console.warn('Fetch API not supported, using XMLHttpRequest fallback...');
    
    window.fetch = function(url, options) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const method = (options && options.method) || 'GET';
            
            xhr.open(method, url);
            
            // Set headers
            if (options && options.headers) {
                Object.keys(options.headers).forEach(key => {
                    xhr.setRequestHeader(key, options.headers[key]);
                });
            }
            
            xhr.onload = function() {
                resolve({
                    ok: xhr.status >= 200 && xhr.status < 300,
                    status: xhr.status,
                    statusText: xhr.statusText,
                    json: function() {
                        return Promise.resolve(JSON.parse(xhr.responseText));
                    },
                    text: function() {
                        return Promise.resolve(xhr.responseText);
                    }
                });
            };
            
            xhr.onerror = function() {
                reject(new Error('Network error'));
            };
            
            xhr.send((options && options.body) || null);
        });
    };
}

// Promise.finally Polyfill (for older browsers)
if (!Promise.prototype.finally) {
    Promise.prototype.finally = function(callback) {
        const constructor = this.constructor;
        return this.then(
            value => constructor.resolve(callback()).then(() => value),
            reason => constructor.resolve(callback()).then(() => { throw reason; })
        );
    };
}

// Object.assign Polyfill (for IE11)
if (typeof Object.assign !== 'function') {
    Object.assign = function(target) {
        if (target == null) {
            throw new TypeError('Cannot convert undefined or null to object');
        }
        
        const to = Object(target);
        
        for (let index = 1; index < arguments.length; index++) {
            const nextSource = arguments[index];
            
            if (nextSource != null) {
                for (const nextKey in nextSource) {
                    if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                        to[nextKey] = nextSource[nextKey];
                    }
                }
            }
        }
        return to;
    };
}

// Array.from Polyfill (for IE11)
if (!Array.from) {
    Array.from = function(arrayLike) {
        return Array.prototype.slice.call(arrayLike);
    };
}

// Array.prototype.includes Polyfill (for IE11)
if (!Array.prototype.includes) {
    Array.prototype.includes = function(searchElement, fromIndex) {
        if (this == null) {
            throw new TypeError('"this" is null or not defined');
        }
        
        const o = Object(this);
        const len = o.length >>> 0;
        
        if (len === 0) {
            return false;
        }
        
        const n = fromIndex | 0;
        let k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
        
        while (k < len) {
            if (o[k] === searchElement) {
                return true;
            }
            k++;
        }
        
        return false;
    };
}

// String.prototype.includes Polyfill (for IE11)
if (!String.prototype.includes) {
    String.prototype.includes = function(search, start) {
        if (typeof start !== 'number') {
            start = 0;
        }
        
        if (start + search.length > this.length) {
            return false;
        } else {
            return this.indexOf(search, start) !== -1;
        }
    };
}

// CustomEvent Polyfill (for IE11)
if (typeof window.CustomEvent !== 'function') {
    function CustomEvent(event, params) {
        params = params || { bubbles: false, cancelable: false, detail: null };
        const evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
    }
    
    window.CustomEvent = CustomEvent;
}

// Element.closest Polyfill (for IE11)
if (!Element.prototype.closest) {
    Element.prototype.closest = function(selector) {
        let el = this;
        
        while (el) {
            if (el.matches(selector)) {
                return el;
            }
            el = el.parentElement;
        }
        
        return null;
    };
}

// Element.matches Polyfill (for IE11)
if (!Element.prototype.matches) {
    Element.prototype.matches = 
        Element.prototype.matchesSelector ||
        Element.prototype.mozMatchesSelector ||
        Element.prototype.msMatchesSelector ||
        Element.prototype.oMatchesSelector ||
        Element.prototype.webkitMatchesSelector ||
        function(s) {
            const matches = (this.document || this.ownerDocument).querySelectorAll(s);
            let i = matches.length;
            while (--i >= 0 && matches.item(i) !== this) {}
            return i > -1;
        };
}

// NodeList.forEach Polyfill (for IE11)
if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
}

// requestAnimationFrame Polyfill (for older browsers)
(function() {
    let lastTime = 0;
    const vendors = ['webkit', 'moz'];
    
    for (let x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] ||
                                      window[vendors[x] + 'CancelRequestAnimationFrame'];
    }
    
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback) {
            const currTime = new Date().getTime();
            const timeToCall = Math.max(0, 16 - (currTime - lastTime));
            const id = window.setTimeout(function() {
                callback(currTime + timeToCall);
            }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }
    
    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    }
})();

// CSS.supports Polyfill (for feature detection)
if (!window.CSS || !window.CSS.supports) {
    window.CSS = window.CSS || {};
    window.CSS.supports = function(property, value) {
        // Simple fallback - assume modern features are not supported
        const modernFeatures = [
            'backdrop-filter',
            'grid',
            'display: grid',
            'gap',
            'content-visibility'
        ];
        
        const query = value ? `${property}: ${value}` : property;
        
        // Check if it's a modern feature
        for (const feature of modernFeatures) {
            if (query.includes(feature)) {
                return false;
            }
        }
        
        return true;
    };
}

// matchMedia Polyfill (for older browsers)
if (!window.matchMedia) {
    window.matchMedia = function(query) {
        return {
            matches: false,
            media: query,
            addListener: function() {},
            removeListener: function() {}
        };
    };
}

// Console polyfill (for IE9 and older)
if (!window.console) {
    window.console = {
        log: function() {},
        warn: function() {},
        error: function() {},
        info: function() {},
        debug: function() {}
    };
}

// Performance.now Polyfill (for older browsers)
if (!window.performance || !window.performance.now) {
    window.performance = window.performance || {};
    
    const nowOffset = Date.now();
    
    window.performance.now = function() {
        return Date.now() - nowOffset;
    };
}

// classList Polyfill for SVG elements (for IE11)
if (!('classList' in SVGElement.prototype)) {
    Object.defineProperty(SVGElement.prototype, 'classList', {
        get: function() {
            const element = this;
            
            return {
                contains: function(className) {
                    return element.className.baseVal.split(' ').indexOf(className) !== -1;
                },
                add: function(className) {
                    const classes = element.className.baseVal.split(' ');
                    if (classes.indexOf(className) === -1) {
                        classes.push(className);
                        element.className.baseVal = classes.join(' ');
                    }
                },
                remove: function(className) {
                    const classes = element.className.baseVal.split(' ');
                    const index = classes.indexOf(className);
                    if (index !== -1) {
                        classes.splice(index, 1);
                        element.className.baseVal = classes.join(' ');
                    }
                },
                toggle: function(className) {
                    if (this.contains(className)) {
                        this.remove(className);
                        return false;
                    } else {
                        this.add(className);
                        return true;
                    }
                }
            };
        }
    });
}

// Smooth scroll behavior polyfill (for browsers that don't support it)
if (!('scrollBehavior' in document.documentElement.style)) {
    // Override window.scrollTo to add smooth scrolling
    const originalScrollTo = window.scrollTo;
    
    window.scrollTo = function(options) {
        if (typeof options === 'object' && options.behavior === 'smooth') {
            const startY = window.pageYOffset;
            const targetY = options.top || 0;
            const distance = targetY - startY;
            const duration = 500; // ms
            let start = null;
            
            function step(timestamp) {
                if (!start) start = timestamp;
                const progress = timestamp - start;
                const percent = Math.min(progress / duration, 1);
                
                // Easing function (ease-in-out)
                const ease = percent < 0.5
                    ? 2 * percent * percent
                    : -1 + (4 - 2 * percent) * percent;
                
                window.scrollTo(0, startY + distance * ease);
                
                if (progress < duration) {
                    window.requestAnimationFrame(step);
                }
            }
            
            window.requestAnimationFrame(step);
        } else {
            originalScrollTo.apply(window, arguments);
        }
    };
}

console.log('✓ Polyfills loaded for cross-browser compatibility');
