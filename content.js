// content.js - copy2select (v1.1.101)
// Shadow DOM izolasyonu + Hızlı Arama Özelliği

let shadowRoot = null;
let notificationElement = null;
let currentSelectedText = '';
let lastCopiedText = ''; // Çift kopyalama önleme için son kopyalanan metin
const MIN_SELECTION_LENGTH = 2; // Minimum seçim uzunluğu eşiği

// Modern UI Stilleri
const NOTIF_STYLES = `
  #copy2select-notif {
    position: fixed;
    color: #ffffff;
    padding: 0 8px 0 16px; /* Sağ taraf butona daha yakın olması için daraltıldı */
    height: 38px;
    border-radius: 12px;
    font-family: 'Inter', -apple-system, system-ui, sans-serif;
    font-size: 13px;
    font-weight: 600;
    z-index: 2147483647;
    opacity: 0;
    transform: scale(0.9) translateY(10px) translateX(-50%);
    transition: opacity 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), 
                transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    pointer-events: auto;
    white-space: nowrap;
    box-shadow: 0 12px 24px -6px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.15);
    display: flex;
    align-items: center;
    gap: 12px; /* Elemanlar arası mesafe artırılarak denge sağlandı */
    left: 50%;
  }

  .notif-text {
    /* margin-right kaldırıldı, denge gap ile sağlanıyor */
  }

  .separator {
    width: 1px;
    height: 20px;
    background-color: rgba(255, 255, 255, 0.2);
  }

  /* Arama Butonu (Mercek) */
  #notif-search-btn {
    cursor: pointer;
    background: transparent;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border-radius: 6px;
    transition: background-color 0.2s ease;
    user-select: none;
  }

  #notif-search-btn:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  #notif-search-btn svg {
    width: 18px;
    height: 18px;
    fill: #ffffff;
    display: block; /* Taşmaları önler */
  }

  #copy2select-notif.success { background-color: #1a1c1e; }
  #copy2select-notif.error { background-color: #2c1a1a; border-color: rgba(255, 0, 0, 0.2); }
  #copy2select-notif.show { opacity: 1; transform: scale(1) translateY(0) translateX(-50%); }
  #copy2select-notif.hide { pointer-events: none; opacity: 0; transform: scale(0.95) translateY(-5px) translateX(-50%); }
`;

function initializeNotification() {
  if (notificationElement && notificationElement.isConnected) return;
  const staleHost = document.getElementById('copy2select-host');
  if (staleHost) staleHost.remove();

  const host = document.createElement('div');
  host.id = 'copy2select-host';
  document.body.appendChild(host);

  shadowRoot = host.attachShadow({ mode: 'open' });

  const styleTag = document.createElement('style');
  styleTag.textContent = NOTIF_STYLES;
  shadowRoot.appendChild(styleTag);

  notificationElement = document.createElement('div');
  notificationElement.id = 'copy2select-notif';
  
  // İçerik yapısı: Metin + Ayırıcı + Arama Butonu (Güvenli DOM)
  const textSpan = document.createElement('span');
  textSpan.className = 'notif-text';

  const separator = document.createElement('div');
  separator.className = 'separator';

  const searchBtn = document.createElement('button');
  searchBtn.id = 'notif-search-btn';
  searchBtn.title = chrome.i18n.getMessage('searchTitle');
  
  // SVG'yi güvenli ve doğru bir şekilde oluşturalım (Namespace)
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  
  const path = document.createElementNS(svgNS, "path");
  path.setAttribute("d", "M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z");
  
  svg.appendChild(path);
  searchBtn.appendChild(svg);

  notificationElement.appendChild(textSpan);
  notificationElement.appendChild(separator);
  notificationElement.appendChild(searchBtn);

  // Arama butonu olay dinleyicisi
  searchBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentSelectedText) {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(currentSelectedText)}`;
      window.open(searchUrl, '_blank', 'noopener,noreferrer');
    }
  });

  shadowRoot.appendChild(notificationElement);
}

// Hazırlık yap
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeNotification);
} else {
  initializeNotification();
}

document.addEventListener('mouseup', function() {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  // Minimum karakter eşiği (#8) ve çift kopyalama önleme (#9)
  if (selectedText.length >= MIN_SELECTION_LENGTH && document.hasFocus() && selectedText !== lastCopiedText) {
    currentSelectedText = selectedText;
    navigator.clipboard.writeText(selectedText)
      .then(() => {
        lastCopiedText = selectedText;
        showStatusNotification(selection, chrome.i18n.getMessage('copiedMessage'), 'success');
      })
      .catch((err) => {
        console.error('Copy Failed:', err);
        showStatusNotification(selection, chrome.i18n.getMessage('failedMessage'), 'error');
      });
  }
});

// Seçim temizlendiğinde (click) lastCopiedText'i sıfırla
document.addEventListener('mousedown', function() {
  const selection = window.getSelection();
  if (selection.toString().trim().length === 0) {
    lastCopiedText = '';
  }
});

let hideTimeout = null;

function showStatusNotification(selection, text, type) {
  initializeNotification();

  const textSpan = notificationElement.querySelector('.notif-text');
  const separator = notificationElement.querySelector('.separator');
  const searchBtn = notificationElement.querySelector('#notif-search-btn');

  notificationElement.className = ''; 
  notificationElement.classList.add(type);
  textSpan.textContent = text;

  // Sadece başarı durumunda aramayı göster, hatalarda gizle
  if (type === 'success') {
    separator.style.display = 'block';
    searchBtn.style.display = 'flex';
  } else {
    separator.style.display = 'none';
    searchBtn.style.display = 'none';
  }

  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    // Viewport üst kenarına taşma kontrolü: minimum 8px mesafe bırak
    const topPosition = Math.max(8, rect.top - 50);
    notificationElement.style.top = `${topPosition}px`;
    notificationElement.style.left = `${rect.left + (rect.width / 2)}px`;
  }

  requestAnimationFrame(() => {
    notificationElement.classList.add('show');
  });

  // Zamanlayıcıyı temizle (tekrar kopyalama durumunda bildirim açık kalsın)
  if (hideTimeout) clearTimeout(hideTimeout);

  hideTimeout = setTimeout(() => {
    notificationElement.classList.replace('show', 'hide');
  }, 2500); // Kullanıcının butona tıklaması için süreyi biraz uzatıyoruz (2.5 sn)
}
