# copy2select

English | [Türkçe](README.tr.md)

A lightweight Firefox and Chrome extension that copies selected text to the clipboard and offers a quick search from an isolated notification.

## Features
- **Automatic copy:** selected text is copied as soon as you release the mouse or finish a keyboard selection.
- **Manual mode:** turn auto copy off and a "Copy" button appears next to the selection instead.
- **Text fields:** selections inside inputs and textareas can be copied too (optional). Password fields are never copied.
- **Quick search:** the magnifier in the notification searches the selection with Google, DuckDuckGo, Bing or Yandex.
- **Notification position:** above or below the selection, next to the cursor, any screen corner, or a custom X/Y offset from the selection.
- **Site exclusion:** disable the extension on specific domains (subdomains included).
- **Isolated UI:** the notification lives in a Shadow DOM, so page styles cannot affect it.
- **Privacy:** no data collection. Settings are stored in the browser's sync storage.

## Usage
- **Toolbar popup:** all settings in one place: enable/disable, "Disable on this site", auto copy, text fields, notification duration, minimum selection length, search engine, notification position and excluded sites. Changes apply instantly.
- **Gear in the notification:** opens the same settings popup.

## Development
Requires Node.js.
```bash
npm install
npm start       # run in a temporary Firefox profile
npm run start:chrome  # run in a temporary Chrome profile
npm run lint    # validate with web-ext lint
npm run build   # package into web-ext-artifacts/ (same zip works for both stores)
```

## License
ISC
