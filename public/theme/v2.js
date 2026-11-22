(() => {
  const root = document.documentElement;
  if (!root.hasAttribute('data-patrik-color') || root.hasAttribute('data-patrik-theme-ready')) return;
  root.setAttribute('data-patrik-theme-ready', '');

  const storageKey = 'patrik-theme';
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const isChoice = value => ['auto', 'light', 'dark'].includes(value);

  function loadPreference() {
    try {
      const saved = localStorage.getItem(storageKey);
      return isChoice(saved) ? saved : 'auto';
    } catch {
      return 'auto';
    }
  }

  let preference = loadPreference();
  function applyTheme() {
    root.dataset.theme = preference === 'auto' ? (system.matches ? 'dark' : 'light') : preference;
    document.querySelectorAll('select[data-patrik-theme]').forEach(select => {
      select.value = preference;
    });
    const browserColor = document.querySelector('meta[name="theme-color"][data-patrik-theme-color]');
    if (browserColor) {
      browserColor.content = getComputedStyle(root).getPropertyValue('--patrik-bg').trim() ||
        (root.dataset.theme === 'dark' ? '#171917' : '#f4f0e8');
    }
  }

  applyTheme();
  document.addEventListener('DOMContentLoaded', applyTheme, { once: true });
  document.addEventListener('nav', applyTheme);
  window.addEventListener('load', applyTheme, { once: true });
  system.addEventListener('change', applyTheme);
  window.addEventListener('storage', event => {
    if (event.key !== storageKey && event.key !== null) return;
    preference = loadPreference();
    applyTheme();
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted) {
      preference = loadPreference();
      applyTheme();
    }
  });
  document.addEventListener('change', event => {
    const select = event.target;
    if (!(select instanceof HTMLSelectElement) || !select.matches('[data-patrik-theme]') || !isChoice(select.value)) return;
    preference = select.value;
    try {
      localStorage.setItem(storageKey, preference);
    } catch {
      // The current page still honors the choice when browser storage is unavailable.
    }
    applyTheme();
  });
})();
