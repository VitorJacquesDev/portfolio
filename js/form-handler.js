/**
 * FormHandler - Enhanced form validation and submission handler
 * Provides real-time validation, error messaging, and email service integration
 */

class FormHandler {
    constructor(formId, options = {}) {
        this.form = document.getElementById(formId);
        if (!this.form) {
            console.error(`Form with id "${formId}" not found`);
            return;
        }

        this.fields = {};
        this.isSubmitting = false;
        
        // Configuration options
        this.options = {
            validateOnBlur: true,
            validateOnInput: false,
            showSuccessMessage: true,
            clearOnSuccess: true,
            emailService: 'formsubmit', // 'formsubmit' or 'emailjs'
            emailServiceConfig: {},
            ...options
        };

        // Validation rules
        this.validators = {
            required: (value) => {
                return value.trim().length > 0;
            },
            email: (value) => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(value);
            },
            minLength: (value, min) => {
                return value.trim().length >= min;
            },
            maxLength: (value, max) => {
                return value.trim().length <= max;
            },
            pattern: (value, pattern) => {
                const regex = new RegExp(pattern);
                return regex.test(value);
            }
        };

        // Error messages (will be overridden by i18n if available)
        this.errorMessages = {
            required: 'This field is required',
            email: 'Please enter a valid email address',
            minLength: 'This field must be at least {min} characters',
            maxLength: 'This field must not exceed {max} characters',
            pattern: 'Please enter a valid format',
            generic: 'Please check this field'
        };

        this.init();
    }

    init() {
        this.setupFields();
        this.setupValidation();
        this.setupSubmitHandler();
        this.enhanceFormUI();
    }

    setupFields() {
        // Get all form inputs
        const inputs = this.form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            const fieldName = input.name || input.id;
            
            this.fields[fieldName] = {
                element: input,
                valid: false,
                touched: false,
                rules: this.getValidationRules(input)
            };
        });
    }

    getValidationRules(input) {
        const rules = [];
        
        // Check for required attribute
        if (input.hasAttribute('required')) {
            rules.push({ type: 'required' });
        }
        
        // Check for email type
        if (input.type === 'email') {
            rules.push({ type: 'email' });
        }
        
        // Check for minlength attribute
        if (input.hasAttribute('minlength')) {
            rules.push({ 
                type: 'minLength', 
                value: parseInt(input.getAttribute('minlength'))
            });
        }
        
        // Check for maxlength attribute
        if (input.hasAttribute('maxlength')) {
            rules.push({ 
                type: 'maxLength', 
                value: parseInt(input.getAttribute('maxlength'))
            });
        }
        
        // Check for pattern attribute
        if (input.hasAttribute('pattern')) {
            rules.push({ 
                type: 'pattern', 
                value: input.getAttribute('pattern')
            });
        }
        
        // Check for custom validation rules via data attributes
        if (input.dataset.validate) {
            const customRules = input.dataset.validate.split(',');
            customRules.forEach(rule => {
                const [type, value] = rule.split(':');
                rules.push({ type: type.trim(), value: value ? value.trim() : undefined });
            });
        }
        
        return rules;
    }

    setupValidation() {
        Object.keys(this.fields).forEach(fieldName => {
            const field = this.fields[fieldName];
            const input = field.element;
            
            // Validate on blur
            if (this.options.validateOnBlur) {
                input.addEventListener('blur', () => {
                    field.touched = true;
                    this.validateField(fieldName);
                });
            }
            
            // Validate on input (real-time)
            if (this.options.validateOnInput) {
                input.addEventListener('input', () => {
                    if (field.touched) {
                        this.validateField(fieldName);
                    }
                });
            }
            
            // Clear error on focus
            input.addEventListener('focus', () => {
                this.clearFieldError(fieldName);
            });
        });
    }

    validateField(fieldName) {
        const field = this.fields[fieldName];
        if (!field) return true;
        
        const input = field.element;
        const value = input.value;
        let isValid = true;
        let errorMessage = '';
        
        // Run through all validation rules
        for (const rule of field.rules) {
            const validator = this.validators[rule.type];
            
            if (!validator) {
                console.warn(`Validator "${rule.type}" not found`);
                continue;
            }
            
            const result = rule.value !== undefined 
                ? validator(value, rule.value)
                : validator(value);
            
            if (!result) {
                isValid = false;
                errorMessage = this.getErrorMessage(rule.type, rule.value);
                break;
            }
        }
        
        field.valid = isValid;
        
        if (!isValid && field.touched) {
            this.showFieldError(fieldName, errorMessage);
        } else {
            this.clearFieldError(fieldName);
        }
        
        return isValid;
    }

    validateForm() {
        let isValid = true;
        
        Object.keys(this.fields).forEach(fieldName => {
            const field = this.fields[fieldName];
            field.touched = true;
            
            if (!this.validateField(fieldName)) {
                isValid = false;
            }
        });
        
        return isValid;
    }

    getErrorMessage(ruleType, ruleValue) {
        let message = this.errorMessages[ruleType] || this.errorMessages.generic;
        
        // Replace placeholders
        if (ruleValue !== undefined) {
            message = message.replace('{min}', ruleValue).replace('{max}', ruleValue);
        }
        
        // Try to get translated message if i18n is available
        if (typeof i18nManager !== 'undefined') {
            const translatedMessage = i18nManager.translate(`contact.validation.${ruleType}`);
            if (translatedMessage && !translatedMessage.startsWith('contact.validation')) {
                message = translatedMessage;
                if (ruleValue !== undefined) {
                    message = message.replace('{min}', ruleValue).replace('{max}', ruleValue);
                }
            }
        }
        
        return message;
    }

    showFieldError(fieldName, message) {
        const field = this.fields[fieldName];
        if (!field) return;
        
        const input = field.element;
        const formGroup = input.closest('.form-group');
        
        if (!formGroup) return;
        
        // Add error class
        formGroup.classList.add('error');
        formGroup.classList.remove('success');
        input.setAttribute('aria-invalid', 'true');
        
        // Create or update error message
        let errorElement = formGroup.querySelector('.error-message');
        
        if (!errorElement) {
            errorElement = document.createElement('span');
            errorElement.className = 'error-message';
            errorElement.setAttribute('role', 'alert');
            
            // Add error icon
            const icon = document.createElement('i');
            icon.className = 'fas fa-exclamation-circle';
            errorElement.appendChild(icon);
            
            const textSpan = document.createElement('span');
            textSpan.className = 'error-text';
            errorElement.appendChild(textSpan);
            
            formGroup.appendChild(errorElement);
        }
        
        const textSpan = errorElement.querySelector('.error-text');
        textSpan.textContent = message;
        
        // Associate error with input for accessibility
        const errorId = `${fieldName}-error`;
        errorElement.id = errorId;
        input.setAttribute('aria-describedby', errorId);
    }

    clearFieldError(fieldName) {
        const field = this.fields[fieldName];
        if (!field) return;
        
        const input = field.element;
        const formGroup = input.closest('.form-group');
        
        if (!formGroup) return;
        
        formGroup.classList.remove('error');
        input.removeAttribute('aria-invalid');
        input.removeAttribute('aria-describedby');
        
        const errorElement = formGroup.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
    }

    showFieldSuccess(fieldName) {
        const field = this.fields[fieldName];
        if (!field) return;
        
        const formGroup = field.element.closest('.form-group');
        if (!formGroup) return;
        
        formGroup.classList.add('success');
        formGroup.classList.remove('error');
    }

    setupSubmitHandler() {
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (this.isSubmitting) return;
            
            // Validate all fields
            if (!this.validateForm()) {
                this.showNotification(
                    this.getTranslation('contact.validation.formInvalid', 'Please fix the errors before submitting'),
                    'error'
                );
                
                // Focus on first invalid field
                const firstInvalidField = Object.keys(this.fields).find(
                    fieldName => !this.fields[fieldName].valid
                );
                
                if (firstInvalidField) {
                    this.fields[firstInvalidField].element.focus();
                }
                
                return;
            }
            
            // Submit form
            await this.submitForm();
        });
    }

    async submitForm() {
        this.isSubmitting = true;
        this.showLoading();
        
        try {
            // Get form data
            const formData = this.getFormData();
            
            // Submit based on configured service
            let success = false;
            
            if (this.options.emailService === 'formsubmit') {
                success = await this.submitToFormSubmit(formData);
            } else if (this.options.emailService === 'emailjs') {
                success = await this.submitToEmailJS(formData);
            } else {
                // Custom submission handler
                if (this.options.onSubmit) {
                    success = await this.options.onSubmit(formData);
                }
            }
            
            if (success) {
                this.handleSuccess();
            } else {
                this.handleError();
            }
        } catch (error) {
            console.error('Form submission error:', error);
            this.handleError(error.message);
        } finally {
            this.isSubmitting = false;
            this.hideLoading();
        }
    }

    getFormData() {
        const data = {};
        
        Object.keys(this.fields).forEach(fieldName => {
            data[fieldName] = this.fields[fieldName].element.value;
        });
        
        return data;
    }

    async submitToFormSubmit(formData) {
        // FormSubmit.co integration
        const email = this.options.emailServiceConfig.email || 'vitorjacquesdev@gmail.com';
        const endpoint = `https://formsubmit.co/${email}`;
        
        const form = new FormData();
        Object.keys(formData).forEach(key => {
            form.append(key, formData[key]);
        });
        
        // Add FormSubmit configuration
        form.append('_subject', formData.subject || 'New Portfolio Contact');
        form.append('_captcha', 'false');
        form.append('_template', 'table');
        
        const response = await fetch(endpoint, {
            method: 'POST',
            body: form,
            headers: {
                'Accept': 'application/json'
            }
        });
        
        return response.ok;
    }

    async submitToEmailJS(formData) {
        // EmailJS integration (requires EmailJS library)
        if (typeof emailjs === 'undefined') {
            console.error('EmailJS library not loaded');
            return false;
        }
        
        const config = this.options.emailServiceConfig;
        
        try {
            const response = await emailjs.send(
                config.serviceId,
                config.templateId,
                formData,
                config.publicKey
            );
            
            return response.status === 200;
        } catch (error) {
            console.error('EmailJS error:', error);
            return false;
        }
    }

    handleSuccess() {
        const successMessage = this.getTranslation('contact.successMessage', 'Message sent successfully! I will get back to you soon.');
        
        this.showNotification(successMessage, 'success');
        
        // Announce success for screen readers
        this.announceToScreenReader(successMessage);
        
        // Clear form if configured
        if (this.options.clearOnSuccess) {
            this.form.reset();
            
            // Reset field states
            Object.keys(this.fields).forEach(fieldName => {
                this.fields[fieldName].valid = false;
                this.fields[fieldName].touched = false;
                this.clearFieldError(fieldName);
            });
        }
        
        // Call success callback if provided
        if (this.options.onSuccess) {
            this.options.onSuccess();
        }
    }

    handleError(message) {
        const errorMessage = message || this.getTranslation(
            'contact.errorMessage',
            'Error sending message. Please try again.'
        );
        
        this.showNotification(errorMessage, 'error');
        
        // Announce error for screen readers
        this.announceToScreenReader(errorMessage);
        
        // Call error callback if provided
        if (this.options.onError) {
            this.options.onError(message);
        }
    }

    showLoading() {
        const submitBtn = this.form.querySelector('button[type="submit"]');
        if (!submitBtn) return;
        
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        
        // Store original text
        if (!submitBtn.dataset.originalText) {
            submitBtn.dataset.originalText = submitBtn.textContent;
        }
        
        // Show loading text
        const loadingText = this.getTranslation('contact.sending', 'Sending...');
        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${loadingText}`;
    }

    hideLoading() {
        const submitBtn = this.form.querySelector('button[type="submit"]');
        if (!submitBtn) return;
        
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        
        // Restore original text
        if (submitBtn.dataset.originalText) {
            submitBtn.textContent = submitBtn.dataset.originalText;
        }
    }

    showNotification(message, type = 'info') {
        // Remove existing notification
        const existingNotification = document.querySelector('.form-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `form-notification ${type}`;
        notification.setAttribute('role', type === 'error' ? 'alert' : 'status');
        notification.setAttribute('aria-live', 'polite');
        
        // Add icon based on type
        const icon = document.createElement('i');
        icon.className = type === 'success' 
            ? 'fas fa-check-circle' 
            : type === 'error' 
            ? 'fas fa-exclamation-circle'
            : 'fas fa-info-circle';
        
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification-close';
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.setAttribute('aria-label', 'Close notification');
        closeBtn.addEventListener('click', () => {
            notification.classList.add('hiding');
            setTimeout(() => notification.remove(), 300);
        });
        
        notification.appendChild(icon);
        notification.appendChild(messageSpan);
        notification.appendChild(closeBtn);
        
        // Add to form
        this.form.insertBefore(notification, this.form.firstChild);
        
        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.add('hiding');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
    }

    enhanceFormUI() {
        // Add floating label functionality
        Object.keys(this.fields).forEach(fieldName => {
            const field = this.fields[fieldName];
            const input = field.element;
            const formGroup = input.closest('.form-group');
            
            if (!formGroup) return;
            
            // Check if input has value on load
            if (input.value) {
                formGroup.classList.add('has-value');
            }
            
            // Add has-value class when input has content
            input.addEventListener('input', () => {
                if (input.value) {
                    formGroup.classList.add('has-value');
                } else {
                    formGroup.classList.remove('has-value');
                }
            });
            
            // Add focused class
            input.addEventListener('focus', () => {
                formGroup.classList.add('focused');
            });
            
            input.addEventListener('blur', () => {
                formGroup.classList.remove('focused');
            });
        });
    }

    getTranslation(key, fallback) {
        if (typeof i18nManager !== 'undefined') {
            const translation = i18nManager.translate(key);
            if (translation && !translation.startsWith(key)) {
                return translation;
            }
        }
        return fallback;
    }

    /**
     * Announce message to screen readers using ARIA live region
     * @param {string} message - Message to announce
     */
    announceToScreenReader(message) {
        const liveRegion = document.getElementById('aria-live-region');
        if (liveRegion) {
            liveRegion.textContent = message;
            
            // Clear after announcement
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
    }

    // Public API methods
    reset() {
        this.form.reset();
        Object.keys(this.fields).forEach(fieldName => {
            this.fields[fieldName].valid = false;
            this.fields[fieldName].touched = false;
            this.clearFieldError(fieldName);
        });
    }

    destroy() {
        // Clean up event listeners and references
        this.form = null;
        this.fields = {};
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormHandler;
}
