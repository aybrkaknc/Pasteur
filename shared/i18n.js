// shared/i18n.js - fills elements marked with data-i18n from _locales.
document.querySelectorAll('[data-i18n]').forEach((el) => {
  el.textContent = api.i18n.getMessage(el.dataset.i18n);
});
document.documentElement.lang = api.i18n.getUILanguage();
