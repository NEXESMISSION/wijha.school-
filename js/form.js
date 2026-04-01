// ============================================
// Wijha Academy - Form Handler
// Validates, submits to Supabase, tracks events
// ============================================

const WijhaForm = (() => {
  // Use stateless anon client for public form submissions.
  const publicFormClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  let isSubmitting = false;
  let submitCount = 0;
  const MAX_SUBMITS = 3;

  function sanitize(str) {
    if (!str) return str;
    return str.replace(/[<>"'`]/g, '').trim().substring(0, 500);
  }

  function validatePhone(phone) {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    return /^\+?[0-9]{8,15}$/.test(cleaned);
  }

  function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorEl = field?.parentElement?.querySelector('.field-error');
    if (field) field.classList.add('error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
  }

  function clearError(fieldId) {
    const field = document.getElementById(fieldId);
    const errorEl = field?.parentElement?.querySelector('.field-error');
    if (field) field.classList.remove('error');
    if (errorEl) errorEl.style.display = 'none';
  }

  function clearAllErrors() {
    document.querySelectorAll('.field-error').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
  }

  function validate() {
    clearAllErrors();
    let valid = true;

    const name = document.getElementById('full_name').value.trim();
    if (!name || name.length < 2) {
      showError('full_name', 'الرجاء إدخال الاسم الكامل');
      valid = false;
    }

    const phone = document.getElementById('phone').value.trim();
    if (!phone) {
      showError('phone', 'الرجاء إدخال رقم الهاتف');
      valid = false;
    } else if (!validatePhone(phone)) {
      showError('phone', 'رقم الهاتف غير صحيح');
      valid = false;
    }

    const paymentMethod = document.getElementById('payment_method').value.trim();
    if (!paymentMethod) {
      showError('payment_method', 'الرجاء اختيار طريقة الدفع');
      valid = false;
    }

    return valid;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (isSubmitting) return;

    WijhaTracker.trackEvent('form_submit_attempt');

    if (!validate()) {
      WijhaTracker.trackEvent('form_validation_error', {
        errors: Array.from(document.querySelectorAll('.field-error'))
          .filter(el => el.style.display !== 'none')
          .map(el => el.textContent)
      });
      return;
    }

    if (submitCount >= MAX_SUBMITS) {
      showError('full_name', 'تم تجاوز الحد المسموح. حاول لاحقًا.');
      return;
    }
    submitCount++;

    isSubmitting = true;
    const btn = document.getElementById('submit-btn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoader = btn.querySelector('.btn-loader');
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';
    btn.disabled = true;

    const utm = WijhaTracker.getUTMParams();
    const formData = {
      session_id: WijhaTracker.getSessionId(),
      full_name: sanitize(document.getElementById('full_name').value),
      phone: sanitize(document.getElementById('phone').value),
      email: null,
      payment_method: sanitize(document.getElementById('payment_method').value),
      // Form is intentionally simplified for higher conversion
      city: null,
      experience_level: null,
      referral_source: null,
      device_type: WijhaTracker.getDeviceType(),
      browser: WijhaTracker.getBrowser(),
      os: WijhaTracker.getOS(),
      ip_country: WijhaTracker.getCountryFromTimezone(),
      ...utm,
    };

    try {
      const { error } = await publicFormClient.from('registrations').insert(formData);

      if (error) throw error;

      const formTime = WijhaTracker.getFieldInteractions();
      WijhaTracker.trackEvent('form_submit_success', {
        engagement_score: WijhaTracker.getEngagementScore(),
        field_interactions: formTime,
      });

      showSuccess();
    } catch (err) {
      console.error('Submit error:', err);
      WijhaTracker.trackEvent('form_submit_error', { error: err.message });
      showSubmitError();
    } finally {
      isSubmitting = false;
      btnText.style.display = 'inline';
      btnLoader.style.display = 'none';
      btn.disabled = false;
    }
  }

  function showSuccess() {
    const form = document.getElementById('wijha-form');
    const success = document.getElementById('form-success');
    form.style.display = 'none';
    success.style.display = 'block';
    success.classList.add('animate-in');

    confettiEffect();
  }

  function showSubmitError() {
    const errorBanner = document.getElementById('form-error-banner');
    if (errorBanner) {
      errorBanner.style.display = 'block';
      setTimeout(() => errorBanner.style.display = 'none', 5000);
    }
  }

  function confettiEffect() {
    const colors = ['#4ade80', '#3b82f6', '#fbbf24', '#f472b6', '#a78bfa'];
    const container = document.getElementById('confetti-container');
    if (!container) return;

    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti-piece';
      confetti.style.cssText = `
        left: ${Math.random() * 100}%;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        animation-delay: ${Math.random() * 0.5}s;
        animation-duration: ${1 + Math.random() * 2}s;
      `;
      container.appendChild(confetti);
    }
    setTimeout(() => container.innerHTML = '', 3000);
  }

  function init() {
    const form = document.getElementById('wijha-form');
    if (form) {
      form.addEventListener('submit', handleSubmit);
    }

    document.querySelectorAll('#wijha-form input, #wijha-form select').forEach(field => {
      field.addEventListener('input', () => clearError(field.id));
    });
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => WijhaForm.init());
