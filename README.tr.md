# copy2select

[English](README.md) | Türkçe

Seçilen metni panoya kopyalayan ve izole bir bildirim üzerinden hızlı arama sunan hafif bir Firefox eklentisi.

## Özellikler
- **Otomatik kopyalama:** fareyi bıraktığınızda veya klavyeyle seçimi bitirdiğinizde metin hemen kopyalanır.
- **Manuel mod:** otomatik kopyalamayı kapatırsanız seçimin yanında "Kopyala" butonu görünür.
- **Metin alanları:** input ve textarea içindeki seçimler de kopyalanabilir (isteğe bağlı). Şifre alanları asla kopyalanmaz.
- **Hızlı arama:** bildirimdeki mercek seçili metni Google, DuckDuckGo, Bing veya Yandex ile aratır.
- **Site hariç tutma:** eklentiyi belirli alan adlarında kapatabilirsiniz (alt alan adları dahil).
- **İzole arayüz:** bildirim Shadow DOM içinde çalışır, sayfa stilleri onu etkilemez.
- **Gizlilik:** veri toplanmaz. Ayarlar Firefox senkronizasyon deposunda tutulur.

## Kullanım
- **Araç çubuğu popup'ı:** otomatik kopyalama anahtarı, "Bu sitede kapat" anahtarı ve ayarlar bağlantısı.
- **Ayarlar sayfası** (about:addons > copy2select > Seçenekler): aç/kapat, otomatik kopyalama, metin alanları, bildirim süresi, minimum seçim uzunluğu, arama motoru, hariç tutulan siteler.

## Geliştirme
Node.js gerektirir.
```bash
npm install
npm start       # geçici bir Firefox profilinde çalıştır
npm run lint    # web-ext lint ile doğrula
npm run build   # web-ext-artifacts/ altına paketle
```

## Lisans
ISC
