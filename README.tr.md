# Pasteur

[English](README.md) | Türkçe

Seçilen metni panoya kopyalayan ve izole bir bildirim üzerinden hızlı arama sunan hafif bir Firefox ve Chrome eklentisi.

## Özellikler
- **Otomatik kopyalama:** fareyi bıraktığınızda veya klavyeyle seçimi bitirdiğinizde metin hemen kopyalanır.
- **Manuel mod:** otomatik kopyalamayı kapatırsanız seçimin yanında "Kopyala" butonu görünür.
- **Metin alanları:** input ve textarea içindeki seçimler de kopyalanabilir (isteğe bağlı). Şifre alanları asla kopyalanmaz.
- **Hızlı arama:** bildirimdeki mercek seçili metni Google, DuckDuckGo, Bing veya Yandex ile aratır.
- **Vurgulayıcı:** bildirimdeki kalem seçimi sarı, yeşil, pembe veya mavi ile işaretler. Vurgular sayfa bazında saklanır, sayfaya döndüğünüzde geri gelir. Kaldırmak için vurguya tıklayın ya da popup'tan sayfadaki tüm vurguları temizleyin.
- **Bildirim konumu:** seçimin üstü veya altı, imlecin yanı, ekranın herhangi bir köşesi ya da seçime göre özel X/Y kaydırması.
- **Site hariç tutma:** eklentiyi belirli alan adlarında kapatabilirsiniz (alt alan adları dahil).
- **İzole arayüz:** bildirim Shadow DOM içinde çalışır, sayfa stilleri onu etkilemez.
- **Gizlilik:** veri toplanmaz. Ayarlar tarayıcının senkronizasyon deposunda tutulur.

## Kullanım
- **Araç çubuğu popup'ı:** tüm ayarlar tek yerde: aç/kapat, "Bu sitede kapat", otomatik kopyalama, metin alanları, bildirim süresi, minimum seçim uzunluğu, arama motoru, bildirim konumu ve hariç tutulan siteler. Değişiklikler anında uygulanır.
- **Bildirimdeki dişli:** aynı ayarlar popup'ını açar.

## Geliştirme
Node.js gerektirir.
```bash
npm install
npm start       # geçici bir Firefox profilinde çalıştır
npm run start:chrome  # geçici bir Chrome profilinde çalıştır
npm run lint    # web-ext lint ile doğrula
npm run build   # web-ext-artifacts/ altına paketle (aynı zip iki mağazada da kullanılır)
```

## Lisans
ISC
