// popup/unlock.js - warning card for pages that block right click or selection

function initUnlockCard() {
  const cardEl = document.getElementById('unlockCard');
  const buttonEl = document.getElementById('unlockNow');
  askPage('unlock-state').then((st) => { cardEl.hidden = !(st && st.blocked); }, () => {});
  // Turns the settings switch on (the change event saves it) and unlocks the open page at once
  buttonEl.addEventListener('click', () => {
    const switchEl = document.getElementById('unlockPage');
    switchEl.checked = true;
    switchEl.dispatchEvent(new Event('change'));
    askPage('unlock-now').then(() => { cardEl.hidden = true; }, () => {});
  });
}
