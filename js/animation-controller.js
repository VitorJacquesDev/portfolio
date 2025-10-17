/**
 * Animation Controller Module
 * Handles scroll-triggered animations, skill bar animations, and performance optimizations
 */

class AnimationController {
    constructor() {
        this.observers = [];
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.animatedElements = new Set();
        this.skillBarsAnimated = false;
    }

    /**
     * Initialize the animation controller
     */
    init() {
        if (this.prefersReducedMotion) {
            console.log('Reduced motion preference detected - animations disabled');
            this.disableAnimations();
            return;
        }

        this.setupScrollAnimations();
        this.setupSkillBarAnimations();
        this.setupTimelineAnimations();
        this.setupHoverEffects();
        this.setupScrollProgress();

        console.log('Animation Controller initialized');
    }

    /**
     * Disable animations for users who prefer reduced motion
     */
    disableAnimations() {
        // Remove animation classes from all elements
        const animatedElements = document.querySelectorAll('[class*="scroll-reveal"], [class*="fade-in"], [class*="slide-"]');
        animatedElements.forEach(element => {
            element.style.opacity = '1';
            element.style.transform = 'none';
            element.classList.add('revealed');
        });
    }

    /**
     * Setup Intersection Observer for scroll-triggered animations
     */
    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
                    this.animateElement(entry.target);
                    this.animatedElements.add(entry.target);
                }
            });
        }, observerOptions);

        // Observe all scroll-reveal elements
        const scrollRevealElements = document.querySelectorAll(
            '.scroll-reveal, .scroll-reveal-up, .scroll-reveal-down, ' +
            '.scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale'
        );

        scrollRevealElements.forEach(element => {
            observer.observe(element);
        });

        this.observers.push(observer);
    }

    /**
     * Animate an element when it enters the viewport
     */
    animateElement(element) {
        // Add revealed class to trigger CSS animations
        element.classList.add('revealed');

        // Handle staggered animations for child elements
        const staggerChildren = element.querySelectorAll('[class*="stagger-"]');
        if (staggerChildren.length > 0) {
            staggerChildren.forEach((child, index) => {
                setTimeout(() => {
                    child.classList.add('revealed');
                }, index * 100);
            });
        }
    }

    /**
     * Setup skill bar animations
     */
    setupSkillBarAnimations() {
        const skillsSection = document.querySelector('#skills');
        if (!skillsSection) return;

        const observerOptions = {
            threshold: 0.3
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.skillBarsAnimated) {
                    this.animateSkillBars();
                    this.skillBarsAnimated = true;
                }
            });
        }, observerOptions);

        observer.observe(skillsSection);
        this.observers.push(observer);
    }

    /**
     * Setup timeline animations
     */
    setupTimelineAnimations() {
        const timelineItems = document.querySelectorAll('.timeline-item');
        if (timelineItems.length === 0) return;

        const observerOptions = {
            threshold: 0.15,
            rootMargin: '0px 0px -80px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('animate-in')) {
                    // Add animation class for CSS animations
                    entry.target.classList.add('animate-in');

                    // Also add revealed class for scroll-reveal animations
                    entry.target.classList.add('revealed');

                    // Animate the timeline marker with pulse effect
                    this.animateTimelineMarker(entry.target);
                }
            });
        }, observerOptions);

        // Observe all timeline items
        timelineItems.forEach(item => {
            observer.observe(item);
        });

        this.observers.push(observer);

        // Animate timeline line drawing on scroll
        this.setupTimelineLineAnimation();
    }

    /**
     * Animate timeline marker with pulse effect
     */
    animateTimelineMarker(timelineItem) {
        const marker = timelineItem.querySelector('.timeline-marker');
        if (marker) {
            // The marker animation is now handled by CSS via .timeline-item.animate-in .timeline-marker
            // This method is kept for potential future enhancements
            // Add a subtle glow effect on reveal
            marker.style.boxShadow = '0 0 0 4px var(--background-color), 0 0 0 8px var(--primary-color), 0 0 30px rgba(100, 255, 218, 0.8)';

            // Reset to normal after animation
            setTimeout(() => {
                marker.style.boxShadow = '';
            }, 800);
        }
    }

    /**
     * Setup timeline line drawing animation
     */
    setupTimelineLineAnimation() {
        const timeline = document.querySelector('.timeline');
        if (!timeline) return;

        // Create animated line overlay
        const animatedLine = document.createElement('div');
        animatedLine.classList.add('timeline-line-animated');
        animatedLine.style.cssText = `
            position: absolute;
            left: 50%;
            top: 0;
            width: 2px;
            height: 0;
            background: linear-gradient(to bottom, var(--primary-color), var(--secondary-color));
            transform: translateX(-50%);
            transition: height 0.3s ease-out;
            z-index: 1;
        `;

        // Insert the animated line
        timeline.style.position = 'relative';
        timeline.insertBefore(animatedLine, timeline.firstChild);

        // Update line height on scroll
        const updateLineHeight = this.throttle(() => {
            const timelineRect = timeline.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            // Calculate how much of the timeline is visible
            if (timelineRect.top < windowHeight && timelineRect.bottom > 0) {
                const visibleHeight = Math.min(
                    windowHeight - Math.max(timelineRect.top, 0),
                    timelineRect.height
                );

                const percentage = (visibleHeight / timelineRect.height) * 100;
                animatedLine.style.height = Math.min(percentage, 100) + '%';
            }
        }, 10);

        window.addEventListener('scroll', updateLineHeight);
        updateLineHeight(); // Initial call
    }

    /**
     * Animate skill progress bars
     */
    animateSkillBars() {
        const skillBars = document.querySelectorAll('.skill-progress');

        skillBars.forEach((bar, index) => {
            const targetWidth = bar.style.width;
            bar.style.width = '0%';

            setTimeout(() => {
                bar.style.transition = 'width 1.5s ease-out';
                bar.style.width = targetWidth;
            }, index * 100);
        });
    }

    /**
     * Setup hover effects and micro-interactions
     */
    setupHoverEffects() {
        // Add hover lift effect to cards
        const cards = document.querySelectorAll('.project-card, .skill-card');
        cards.forEach(card => {
            if (!card.classList.contains('hover-lift')) {
                card.classList.add('hover-lift');
            }
        });

        // Add hover grow effect to buttons
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            if (!button.classList.contains('hover-grow')) {
                button.classList.add('hover-grow');
            }
        });

        // Setup ripple effect on buttons
        this.setupRippleEffect();

        // Setup card elevation on hover
        this.setupCardElevation();

        // Setup smooth scroll
        this.setupSmoothScroll();

        // Setup loading states
        this.setupLoadingStates();
    }

    /**
     * Add ripple effect to buttons on click
     */
    setupRippleEffect() {
        const buttons = document.querySelectorAll('.btn, button');

        buttons.forEach(button => {
            button.addEventListener('click', function (e) {
                // Create ripple element
                const ripple = document.createElement('span');
                ripple.classList.add('ripple-effect');

                // Calculate position
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;

                // Set ripple styles
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';

                // Add ripple to button
                this.style.position = 'relative';
                this.style.overflow = 'hidden';
                this.appendChild(ripple);

                // Remove ripple after animation
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });
    }

    /**
     * Implement card elevation on hover
     */
    setupCardElevation() {
        const cards = document.querySelectorAll('.project-card, .skill-card, .about-details .detail, .contact-item');

        cards.forEach(card => {
            card.addEventListener('mouseenter', function () {
                this.style.transform = 'translateY(-8px)';
                this.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
            });

            card.addEventListener('mouseleave', function () {
                this.style.transform = 'translateY(0)';
            });
        });
    }

    /**
     * Add smooth scroll with custom easing
     */
    setupSmoothScroll() {
        // Smooth scroll is already handled in script.js
        // This adds custom easing for scroll behavior
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;

                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    e.preventDefault();

                    const headerOffset = 80;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    /**
     * Create loading states for async operations
     */
    setupLoadingStates() {
        // Add loading state to form submission
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', function (e) {
                const submitButton = this.querySelector('button[type="submit"]');
                if (submitButton && !submitButton.classList.contains('loading')) {
                    submitButton.classList.add('loading');
                    submitButton.disabled = true;

                    const originalText = submitButton.textContent;
                    submitButton.innerHTML = '<span class="spinner"></span> Enviando...';

                    // Reset after form processing (this will be handled by form handler)
                    setTimeout(() => {
                        submitButton.classList.remove('loading');
                        submitButton.disabled = false;
                        submitButton.textContent = originalText;
                    }, 2000);
                }
            });
        }
    }

    /**
     * Debounce utility for performance optimization
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle utility for performance optimization
     */
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Setup scroll progress indicator
     */
    setupScrollProgress() {
        // Create scroll progress bar
        const progressBar = document.createElement('div');
        progressBar.classList.add('scroll-progress');
        document.body.appendChild(progressBar);

        // Update progress on scroll
        const updateProgress = this.throttle(() => {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;

            progressBar.style.width = scrollPercent + '%';
        }, 10);

        window.addEventListener('scroll', updateProgress);
        updateProgress(); // Initial call
    }

    /**
     * Cleanup observers
     */
    destroy() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
        this.animatedElements.clear();

        // Remove scroll progress bar
        const progressBar = document.querySelector('.scroll-progress');
        if (progressBar) {
            progressBar.remove();
        }
    }
}

// Create singleton instance
const animationController = new AnimationController();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimationController;
}
