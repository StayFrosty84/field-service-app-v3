// Light/Dark theme handling. Preference is device-specific (localStorage), not backed up.
const THEME_KEY = 'fs-theme';

// Status-bar / PWA theme-color per resolved theme (matches the app background).
const META_COLOR = { light: '#ffffff', dark: '#0b1220' };

export function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'system';
}

function resolve(theme) {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme = getTheme()) {
  const resolved = resolve(theme);
  document.documentElement.dataset.theme = resolved;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', META_COLOR[resolved]);
  return resolved;
}

export function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}

let mediaListener = null;
export function initTheme() {
  applyTheme();
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  if (mediaListener) mq.removeEventListener('change', mediaListener);
  mediaListener = () => {
    if (getTheme() === 'system') applyTheme('system');
  };
  mq.addEventListener('change', mediaListener);
}
