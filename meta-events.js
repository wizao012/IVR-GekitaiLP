'use strict';
(() => {
  if (window.gekitaiMeta) return;
  const pixelId = '931880797549354';
  const sentLeads = new Set();
  const eventId = () => globalThis.crypto?.randomUUID?.() || `gekitai-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const send = (name, method, id) => {
    if (typeof window.fbq !== 'function') return false;
    try {
      window.fbq('trackSingle', pixelId, name, {
        content_name: '撃退くん', contact_method: method
      }, { eventID: id });
      return true;
    } catch (_) {
      return false;
    }
  };
  window.gekitaiMeta = {
    lead: async id => {
      if (!id || sentLeads.has(id)) return;
      sentLeads.add(id);
      if (send('Lead', 'form', id)) {
        // fbq has no delivery acknowledgement. Give the browser a bounded
        // dispatch window before navigating; tracking must never block the form.
        await new Promise(resolve => setTimeout(resolve, 600));
      }
    }
  };
  document.addEventListener('click', event => {
    if (event.defaultPrevented || (event.button != null && event.button !== 0)) return;
    const link = event.target?.closest?.('a[href]');
    if (!link || link.getAttribute('href') !== 'tel:05052918069') return;
    send('Contact', 'phone', eventId());
  });
})();
