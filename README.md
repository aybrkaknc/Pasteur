# copy2select

[English](#english) | [Türkçe](#türkçe)

---

## English

**copy2select** is a lightweight, high-performance browser extension designed to streamline your copy-and-search workflow.

### ✨ Key Features
*   **Automatic Clipboard Sync:** Instantly sync any selected text to your clipboard without manual shortcuts.
*   **Isolated Notification UI:** A sleek notification confirms your actions. Built with **Shadow DOM** technology, the interface remains visually consistent and protected from website-specific CSS styling.
*   **Quick Search Functionality:** A minimalist magnifying glass icon appears within the notification, allowing you to search the selected text on Google in a new tab with one click.
*   **Manifest V3 & Cross-Browser:** Optimized for both **Firefox** and **Chrome** (and other Chromium-based browsers) with full MV3 support.
*   **Privacy First:** No data collection, no background tracking, and minimal permissions required.

### 🛠️ Developer & Build System
This project uses an NPM-based build system for easy debugging and packaging.
```bash
# Build for all platforms (creates folders in /dist)
npm run build

# Package for store submission (creates .zip files)
npm run zip:all
```

---

## Türkçe

**copy2select**, metin kopyalama ve arama süreçlerinizi hızlandırmak için tasarlanmış, hafif ve yüksek performanslı bir tarayıcı eklentisidir.

### ✨ Öne Çıkan Özellikler
*   **Otomatik Pano Senkronizasyonu:** Seçilen herhangi bir metni kısayol kullanmanıza gerek kalmadan anında panoya kopyalar.
*   **İzole Bildirim Arayüzü:** Tasarımı modern bir bildirim penceresiyle onaylanır. **Shadow DOM** teknolojisi sayesinde, bildirimlerin görünümü sitelerin kendi stillerinden etkilenmez ve her yerde tutarlı kalır.
*   **Hızlı Arama İşlevi:** Bildirim içerisinde yer alan minimalist mercek (büyüteç) simgesi ile seçtiğiniz metni tek tıkla yeni sekmede Google'da aratabilirsiniz.
*   **Manifest V3 & Çapraz Tarayıcı:** Hem **Firefox** hem de **Chrome** (ve diğer Chromium tabanlı tarayıcılar) için tam MV3 desteği ile optimize edilmiştir.
*   **Gizlilik Odaklı:** Veri toplamaz, arka planda izleme yapmaz ve minimum izinlerle çalışır.

### 🛠️ Kurulum ve Geliştirme
Proje, kolay hata ayıklama ve paketleme için NPM tabanlı bir build sistemine sahiptir.
```bash
# Tüm platformlar için derleme yapar (/dist klasörü oluşturur)
npm run build

# Mağaza yayını için paketleme yapar (.zip dosyaları oluşturur)
npm run zip:all
```

---
**Version:** 0.0.114  
**License:** ISC
