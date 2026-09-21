/* Shared by / (Türkçe) and /en/ (English). Runs before the page is painted. */
(() => {
  'use strict';
  const script = document.currentScript;
  const base = new URL('../', script.src);
  const pageLanguage = document.documentElement.lang === 'en' ? 'en' : 'tr';
  const storageKey = `zeen-language:${base.pathname}`;
  const current = new URL(location.href);
  const explicit = current.searchParams.get('lang');
  const valid = value => value === 'tr' || value === 'en';
  let saved = null;
  try { saved = localStorage.getItem(storageKey); } catch (_) {}
  if (valid(explicit)) {
    saved = explicit;
    try { localStorage.setItem(storageKey, explicit); } catch (_) {}
  }
  const destination = (language, source = current) => {
    const localFile = base.protocol === 'file:';
    const route = language === 'en' ? (localFile ? 'en/index.html' : 'en/') : (localFile ? 'index.html' : './');
    const result = new URL(route, base);
    result.search = source.search;
    result.hash = source.hash;
    return result;
  };
  const primaryLanguage = (navigator.languages && navigator.languages[0]) || navigator.language || 'tr';
  const browserLanguage = /^tr(?:-|$)/i.test(primaryLanguage) ? 'tr' : 'en';
  // A directly opened /en/ URL is always English. Automatic detection applies to the root page only.
  const preferred = valid(explicit) ? explicit : pageLanguage === 'en' ? 'en' : valid(saved) ? saved : browserLanguage;
  if (preferred !== pageLanguage) {
    location.replace(destination(preferred).href);
    return;
  }
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-language]').forEach(link => {
      const language = link.dataset.language;
      if (!valid(language)) return;
      const target = destination(language);
      target.searchParams.set('lang', language);
      link.href = target.href;
      link.addEventListener('click', event => {
        // Modified clicks can open another language in a tab without changing this tab's preference.
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button > 0) return;
        try { localStorage.setItem(storageKey, language); } catch (_) {}
        // Keep the current section when switching after an in-page navigation.
        const next = destination(language, new URL(location.href));
        next.searchParams.set('lang', language);
        link.href = next.href;
      });
    });
  });
})();
