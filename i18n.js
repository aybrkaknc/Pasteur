// Fills elements marked with data-i18n from _locales.
document.querySelectorAll('[data-i18n]').forEach((el) => {
  el.textContent = browser.i18n.getMessage(el.dataset.i18n);
});
document.documentElement.lang = browser.i18n.getUILanguage();
