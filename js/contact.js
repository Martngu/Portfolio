/* ==========================================================================
   contact.js — Contact Form Validation & Feedback State
   Portfolio: Martin Nguyen
   ==========================================================================
   Handles:
   - Real-time inline validation (on blur)
   - Full form validation on submit
   - Simulated async submission with success / error state
   - Accessible error messages linked to fields via aria-describedby
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     SELECTORS — All tied to IDs in contact.html, easy to update.
  ------------------------------------------------------------------ */
  const FORM_ID         = 'contact-form';
  const SUCCESS_ID      = 'form-success';
  const SUBMIT_BTN_ID   = 'form-submit';

  /* Validation rules per field: { fieldId, validate fn, errorMsg } */
  const FIELDS = [
    {
      id:       'field-name',
      validate: function (v) { return v.trim().length >= 2; },
      error:    'Please enter your full name (at least 2 characters).',
    },
    {
      id:       'field-email',
      validate: function (v) {
        /* Standard RFC-5322 simplified regex */
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
      },
      error:    'Please enter a valid email address.',
    },
    {
      id:       'field-subject',
      validate: function (v) { return v.trim().length >= 3; },
      error:    'Please enter a subject (at least 3 characters).',
    },
    {
      id:       'field-message',
      validate: function (v) { return v.trim().length >= 20; },
      error:    'Please write a message (at least 20 characters).',
    },
  ];


  /* ------------------------------------------------------------------
     SHOW / CLEAR field error
  ------------------------------------------------------------------ */

  /**
   * showError — marks a field invalid and shows the error message.
   * @param {HTMLElement} field
   * @param {string} message
   */
  function showError(field, message) {
    field.classList.add('field--error');
    field.classList.remove('field--valid');
    field.setAttribute('aria-invalid', 'true');

    /* Error message element sits right after the field in the DOM */
    const errorEl = document.getElementById(field.id + '-error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('visible');
    }
  }

  /**
   * clearError — removes error state from a field.
   * @param {HTMLElement} field
   */
  function clearError(field) {
    field.classList.remove('field--error');
    field.classList.add('field--valid');
    field.setAttribute('aria-invalid', 'false');

    const errorEl = document.getElementById(field.id + '-error');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }
  }

  /**
   * validateField — run one field's validation rule.
   * @param {{ id, validate, error }} rule
   * @returns {boolean} true if valid
   */
  function validateField(rule) {
    const field = document.getElementById(rule.id);
    if (!field) return true; /* Skip missing fields gracefully */

    const isValid = rule.validate(field.value);

    if (isValid) {
      clearError(field);
    } else {
      showError(field, rule.error);
    }

    return isValid;
  }


  /* ------------------------------------------------------------------
     REAL-TIME VALIDATION (on blur)
  ------------------------------------------------------------------ */

  function attachBlurValidation() {
    FIELDS.forEach(function (rule) {
      const field = document.getElementById(rule.id);
      if (!field) return;

      /* Validate when user leaves the field */
      field.addEventListener('blur', function () {
        validateField(rule);
      });

      /* Clear error as soon as user starts typing again */
      field.addEventListener('input', function () {
        if (field.classList.contains('field--error')) {
          /* Soft-clear: remove error styling but don't mark as valid yet */
          field.classList.remove('field--error');
          const errorEl = document.getElementById(field.id + '-error');
          if (errorEl) errorEl.classList.remove('visible');
        }
      });
    });
  }


  /* ------------------------------------------------------------------
     SUBMIT HANDLER
  ------------------------------------------------------------------ */

  function initForm() {
    const form      = document.getElementById(FORM_ID);
    const submitBtn = document.getElementById(SUBMIT_BTN_ID);
    const successEl = document.getElementById(SUCCESS_ID);

    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      /* Validate all fields */
      const results = FIELDS.map(validateField);
      const allValid = results.every(Boolean);

      if (!allValid) {
        /* Focus the first invalid field for accessibility */
        const firstErrorField = FIELDS.find(function (rule) {
          const el = document.getElementById(rule.id);
          return el && el.classList.contains('field--error');
        });
        if (firstErrorField) {
          document.getElementById(firstErrorField.id).focus();
        }
        return;
      }

      /* ---- Simulate sending ---- */
      /* In production: replace this block with your real fetch() call  */
      /* e.g. fetch('/api/contact', { method: 'POST', body: ... })      */

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      /* Fake network delay */
      setTimeout(function () {
        /* Hide form & show success message */
        form.style.opacity = '0';
        form.style.transform = 'translateY(-12px)';
        form.style.transition = 'opacity 0.4s ease, transform 0.4s ease';

        setTimeout(function () {
          form.style.display = 'none';
          if (successEl) {
            successEl.classList.add('visible');
          }
        }, 400);

      }, 1200 /* ms simulated delay */);
    });

    attachBlurValidation();
  }


  /* ==================================================================
     INIT
  ================================================================== */

  document.addEventListener('DOMContentLoaded', initForm);

}());
