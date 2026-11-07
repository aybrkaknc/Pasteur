# copy2select

English | [Türkçe](README.tr.md)

A lightweight Firefox extension that copies selected text to the clipboard and offers a quick search from an isolated notification.

## Features
- **Automatic copy:** selected text is copied as soon as you release the mouse or finish a keyboard selection.
- **Manual mode:** turn auto copy off and a "Copy" button appears next to the selection instead.
- **Text fields:** selections inside inputs and textareas can be copied too (optional). Password fields are never copied.
- **Quick search:** the magnifier in the notification searches the selection with Google, DuckDuckGo, Bing or Yandex.
- **Site exclusion:** disable the extension on specific domains (subdomains included).
- **Isolated UI:** the notification lives in a Shadow DOM, so page styles cannot affect it.
- **Privacy:** no data collection. Settings are stored in Firefox sync storage.

## Usage
- **Toolbar popup:** auto copy switch, "Disable on this site" switch and a link to the settings.
- **Settings page** (about:addons > copy2select > Preferences): enable/disable, auto copy, text fields, notification duration, minimum selection length, search engine, excluded sites.

## Development
Requires Node.js.
```bash
npm install
npm start       # run in a temporary Firefox profile
npm run lint    # validate with web-ext lint
npm run build   # package into web-ext-artifacts/
```

## License
ISC
