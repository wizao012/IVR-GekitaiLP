'use strict';
(() => {
  const form = document.querySelector('#consultation-form');
  if (!form) return;
  const button = form.querySelector('button[type="submit"]');
  const status = document.querySelector('#form-status');
  const originalButton = button.innerHTML;
  const landingPage = new URL(location.href);
  landingPage.hash = '';
  const formatJapanTime = date => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}:${values.second}`;
  };
  let sending = false;
  // Reused during a retry so downstream Zapier actions can deduplicate if needed.
  let submissionId = '';
  const showError = message => {
    status.classList.add('form-error');
    status.textContent = message;
    status.focus();
  };
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending) return;
    for (const key of ['company', 'name', 'phone', 'email', 'message']) {
      form.elements[key].value = form.elements[key].value.trim();
    }
    const phone = form.elements.phone;
    phone.value = phone.value.replace(/[０-９]/g, char => String.fromCharCode(char.charCodeAt(0) - 0xFEE0));
    phone.setCustomValidity('');
    if (!/^[+\d\s()（）ー－-]+$/.test(phone.value) || phone.value.replace(/\D/g, '').length < 10 || phone.value.replace(/\D/g, '').length > 15) {
      phone.setCustomValidity('電話番号を10〜15桁の数字で入力してください。ハイフンも使えます。');
    }
    if (!form.reportValidity()) return;
    sending = true;
    button.disabled = true;
    button.textContent = '送信しています…';
    form.setAttribute('aria-busy', 'true');
    status.classList.remove('form-error');
    status.textContent = '送信が完了するまで、この画面を閉じずにお待ちください。';
    if (!submissionId) submissionId = globalThis.crypto?.randomUUID?.() || `gekitai-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const submittedAt = new Date();
    // Existing Zap actions map Querystring Company / Tel / etc.
    // Put these fields in the actual URL query so Zapier creates that same group.
    const webhook = new URL(form.action);
    const legacyFields = {
      company: form.elements.company.value,
      name: form.elements.name.value,
      tel: (phone.value.startsWith('+') ? '+' : '') + phone.value.replace(/\D/g, ''),
      email: form.elements.email.value,
      utm_source: landingPage.searchParams.get('utm_source') || '',
      utm_content: landingPage.searchParams.get('utm_content') || '',
      utm_term: landingPage.searchParams.get('utm_term') || '',
      submitted_at: formatJapanTime(submittedAt),
      submitted_at_iso: submittedAt.toISOString(),
      source: 'cloudphone_sns_form',
      page_url: landingPage.href,
      lp_name: '撃退くん'
    };
    for (const [key, value] of Object.entries(legacyFields)) webhook.searchParams.set(key, value);
    // Keep the potentially long free-text message in the body, not in the URL.
    const data = new FormData(form);
    const payload = new URLSearchParams({
      message: form.elements.message.value,
      privacy_consent: data.get('privacy_consent') || '',
      submission_id: submissionId,
      lp_name: '撃退くん'
    });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      // URLSearchParams supplies the standard form Content-Type automatically.
      // No custom headers / no opaque no-cors response: only confirmed HTTP success redirects.
      const response = await fetch(webhook.href, {
        method: 'POST', body: payload, mode: 'cors', credentials: 'omit',
        referrerPolicy: 'no-referrer', signal: controller.signal
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      form.reset();
      // Only a confirmed webhook success is a Lead. Analytics errors must
      // never turn an accepted inquiry into a form error or trigger resubmission.
      try {
        await window.gekitaiMeta?.lead(submissionId);
      } catch (_) { /* Continue to the completion page if measurement fails. */ }
      location.assign(new URL('./thank-you.html', location.href).href);
    } catch (error) {
      showError(error.name === 'AbortError'
        ? '送信結果を確認できませんでした。既に届いている可能性があります。重複を避けるため、お電話（050-5291-8069）でご確認ください。'
        : '送信の完了を確認できませんでした。入力内容はそのまま残しています。通信環境をご確認いただくか、お電話（050-5291-8069）でお問い合わせください。');
      sending = false;
      button.disabled = false;
      button.innerHTML = originalButton;
    } finally {
      clearTimeout(timeout);
      form.removeAttribute('aria-busy');
    }
  });
  form.elements.phone.addEventListener('input', () => form.elements.phone.setCustomValidity(''));
  // Return from the completion page without retaining an in-progress button.
  window.addEventListener('pageshow', event => {
    if (event.persisted) {
      sending = false;
      submissionId = '';
      button.disabled = false;
      button.innerHTML = originalButton;
      status.textContent = '';
      form.removeAttribute('aria-busy');
    }
  });
})();
