// content/main.js - start-up (loaded last)

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeNotification);
} else {
  initializeNotification();
}
