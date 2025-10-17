/**
 * ProjectModal - Modal component for displaying project details
 * Handles modal display, image gallery, keyboard navigation, and accessibility
 */

class ProjectModal {
    constructor() {
        this.modal = null;
        this.currentProject = null;
        this.currentImageIndex = 0;
        this.focusableElements = [];
        this.previousFocusedElement = null;
        this.isOpen = false;
    }

    /**
     * Initialize the modal by creating HTML structure and attaching event listeners
     */
    init() {
        this.createModal();
        this.attachEventListeners();
    }

    /**
     * Create modal HTML structure and append to body
     */
    createModal() {
        const modalHTML = `
            <div class="project-modal" id="projectModal" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-hidden="true">
                <div class="modal-overlay" aria-hidden="true"></div>
                <div class="modal-content">
                    <button class="modal-close" aria-label="Close modal">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                    <div class="modal-body">
                        <div class="modal-gallery">
                            <div class="gallery-main">
                                <img src="" alt="" class="gallery-image">
                                <button class="gallery-nav gallery-prev" aria-label="Previous image">
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </button>
                                <button class="gallery-nav gallery-next" aria-label="Next image">
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </button>
                                <div class="gallery-counter" aria-live="polite" aria-atomic="true"></div>
                            </div>
                            <div class="gallery-thumbnails"></div>
                        </div>
                        <div class="modal-details">
                            <h2 id="modal-title" class="modal-title"></h2>
                            <div class="modal-tags"></div>
                            <p class="modal-description"></p>
                            <div class="modal-features">
                                <h3>Key Features</h3>
                                <ul class="features-list"></ul>
                            </div>
                            <div class="modal-tech-stack">
                                <h3>Technologies Used</h3>
                                <div class="tech-list"></div>
                            </div>
                            <div class="modal-links"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('projectModal');
    }

    /**
     * Attach event listeners for modal interactions
     */
    attachEventListeners() {
        // Close button
        const closeBtn = this.modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => this.close());

        // Overlay click
        const overlay = this.modal.querySelector('.modal-overlay');
        overlay.addEventListener('click', () => this.close());

        // Gallery navigation
        const prevBtn = this.modal.querySelector('.gallery-prev');
        const nextBtn = this.modal.querySelector('.gallery-next');
        
        prevBtn.addEventListener('click', () => this.previousImage());
        nextBtn.addEventListener('click', () => this.nextImage());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Prevent modal content click from closing
        const modalContent = this.modal.querySelector('.modal-content');
        modalContent.addEventListener('click', (e) => e.stopPropagation());
    }

    /**
     * Open modal with project data
     * @param {Object} projectData - Project information to display
     */
    open(projectData) {
        if (!projectData) return;

        this.currentProject = projectData;
        this.currentImageIndex = 0;
        this.previousFocusedElement = document.activeElement;

        // Populate modal content
        this.populateModal(projectData);

        // Show modal
        this.modal.classList.add('active');
        this.modal.setAttribute('aria-hidden', 'false');
        this.isOpen = true;

        // Lock body scroll
        this.lockBodyScroll();

        // Setup focus trap
        this.setupFocusTrap();

        // Focus on close button
        setTimeout(() => {
            this.modal.querySelector('.modal-close').focus();
        }, 100);

        // Announce modal opening for screen readers
        this.announce(`Project details modal opened: ${projectData.title}`);
    }

    /**
     * Close modal and restore previous state
     */
    close() {
        if (!this.isOpen) return;

        this.modal.classList.remove('active');
        this.modal.setAttribute('aria-hidden', 'true');
        this.isOpen = false;

        // Unlock body scroll
        this.unlockBodyScroll();

        // Restore focus to previous element
        if (this.previousFocusedElement) {
            this.previousFocusedElement.focus();
        }

        // Announce modal closing for screen readers
        this.announce('Project details modal closed');

        // Clear current project after animation
        setTimeout(() => {
            this.currentProject = null;
        }, 300);
    }

    /**
     * Populate modal with project data
     * @param {Object} project - Project data
     */
    populateModal(project) {
        // Title
        this.modal.querySelector('.modal-title').textContent = project.title;

        // Tags
        const tagsContainer = this.modal.querySelector('.modal-tags');
        tagsContainer.innerHTML = project.tags.map(tag => 
            `<span class="tag">${tag}</span>`
        ).join('');

        // Description
        this.modal.querySelector('.modal-description').textContent = 
            project.longDescription || project.description;

        // Features
        if (project.features && project.features.length > 0) {
            const featuresList = this.modal.querySelector('.features-list');
            featuresList.innerHTML = project.features.map(feature => 
                `<li>${feature}</li>`
            ).join('');
            this.modal.querySelector('.modal-features').style.display = 'block';
        } else {
            this.modal.querySelector('.modal-features').style.display = 'none';
        }

        // Technologies
        const techList = this.modal.querySelector('.tech-list');
        techList.innerHTML = project.technologies.map(tech => 
            `<span class="tech-badge">${tech}</span>`
        ).join('');

        // Links
        const linksContainer = this.modal.querySelector('.modal-links');
        let linksHTML = '';
        
        if (project.demoUrl && project.demoUrl !== '#') {
            linksHTML += `<a href="${project.demoUrl}" target="_blank" rel="noopener noreferrer" class="btn primary-btn">
                <i class="fas fa-external-link-alt"></i> Live Demo
            </a>`;
        }
        
        if (project.githubUrl && project.githubUrl !== '#') {
            linksHTML += `<a href="${project.githubUrl}" target="_blank" rel="noopener noreferrer" class="btn secondary-btn">
                <i class="fab fa-github"></i> Source Code
            </a>`;
        }
        
        linksContainer.innerHTML = linksHTML;

        // Gallery
        this.renderGallery(project.images || [project.thumbnail]);
    }

    /**
     * Render image gallery with thumbnails
     * @param {Array} images - Array of image URLs
     */
    renderGallery(images) {
        if (!images || images.length === 0) return;

        // Main image
        const mainImage = this.modal.querySelector('.gallery-image');
        mainImage.src = images[0];
        mainImage.alt = `${this.currentProject.title} - Image 1`;

        // Update counter
        this.updateGalleryCounter(images.length);

        // Show/hide navigation buttons
        const prevBtn = this.modal.querySelector('.gallery-prev');
        const nextBtn = this.modal.querySelector('.gallery-next');
        
        if (images.length <= 1) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';
        }

        // Thumbnails
        const thumbnailsContainer = this.modal.querySelector('.gallery-thumbnails');
        
        if (images.length > 1) {
            thumbnailsContainer.innerHTML = images.map((img, index) => `
                <button class="thumbnail ${index === 0 ? 'active' : ''}" 
                        data-index="${index}"
                        aria-label="View image ${index + 1}">
                    <img src="${img}" alt="${this.currentProject.title} thumbnail ${index + 1}">
                </button>
            `).join('');

            // Thumbnail click handlers
            thumbnailsContainer.querySelectorAll('.thumbnail').forEach(thumb => {
                thumb.addEventListener('click', (e) => {
                    const index = parseInt(e.currentTarget.dataset.index);
                    this.showImage(index);
                });
            });

            thumbnailsContainer.style.display = 'flex';
        } else {
            thumbnailsContainer.style.display = 'none';
        }
    }

    /**
     * Show specific image in gallery
     * @param {number} index - Image index
     */
    showImage(index) {
        const images = this.currentProject.images || [this.currentProject.thumbnail];
        
        if (index < 0 || index >= images.length) return;

        this.currentImageIndex = index;

        // Update main image
        const mainImage = this.modal.querySelector('.gallery-image');
        mainImage.src = images[index];
        mainImage.alt = `${this.currentProject.title} - Image ${index + 1}`;

        // Update thumbnails
        this.modal.querySelectorAll('.thumbnail').forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });

        // Update counter
        this.updateGalleryCounter(images.length);

        // Announce image change for screen readers
        this.announce(`Showing image ${index + 1} of ${images.length}`);
    }

    /**
     * Show next image in gallery
     */
    nextImage() {
        const images = this.currentProject.images || [this.currentProject.thumbnail];
        const nextIndex = (this.currentImageIndex + 1) % images.length;
        this.showImage(nextIndex);
    }

    /**
     * Show previous image in gallery
     */
    previousImage() {
        const images = this.currentProject.images || [this.currentProject.thumbnail];
        const prevIndex = (this.currentImageIndex - 1 + images.length) % images.length;
        this.showImage(prevIndex);
    }

    /**
     * Update gallery counter display
     * @param {number} total - Total number of images
     */
    updateGalleryCounter(total) {
        const counter = this.modal.querySelector('.gallery-counter');
        if (total > 1) {
            counter.textContent = `${this.currentImageIndex + 1} / ${total}`;
            counter.style.display = 'block';
        } else {
            counter.style.display = 'none';
        }
    }

    /**
     * Handle keyboard navigation
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyboard(e) {
        if (!this.isOpen) return;

        switch(e.key) {
            case 'Escape':
                e.preventDefault();
                this.close();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.previousImage();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextImage();
                break;
            case 'Tab':
                this.handleTabKey(e);
                break;
        }
    }

    /**
     * Setup focus trap within modal
     */
    setupFocusTrap() {
        const modalContent = this.modal.querySelector('.modal-content');
        
        // Get all focusable elements
        this.focusableElements = modalContent.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
    }

    /**
     * Handle Tab key for focus trap
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleTabKey(e) {
        if (this.focusableElements.length === 0) return;

        const firstElement = this.focusableElements[0];
        const lastElement = this.focusableElements[this.focusableElements.length - 1];

        if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            // Tab
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }

    /**
     * Lock body scroll when modal is open
     */
    lockBodyScroll() {
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = this.getScrollbarWidth() + 'px';
    }

    /**
     * Unlock body scroll when modal is closed
     */
    unlockBodyScroll() {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    }

    /**
     * Get scrollbar width to prevent layout shift
     * @returns {number} Scrollbar width in pixels
     */
    getScrollbarWidth() {
        return window.innerWidth - document.documentElement.clientWidth;
    }

    /**
     * Announce message for screen readers
     * @param {string} message - Message to announce
     */
    announce(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        document.body.appendChild(announcement);

        setTimeout(() => announcement.remove(), 1000);
    }
}

// Initialize modal when DOM is ready
let projectModal;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        projectModal = new ProjectModal();
        projectModal.init();
    });
} else {
    projectModal = new ProjectModal();
    projectModal.init();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectModal;
}
