const btn = document.getElementById('toggleDebug');
const logContainer = document.getElementById('logContainer');

// UI Update Funktion
const updateUI = (active) => {
  btn.innerText = `Debug Mode: ${active ? 'ON' : 'OFF'}`;
  btn.style.backgroundColor = active ? "#53921f" : "#f0eee5"; // Twitch-Lila vs Grau
  logContainer.style.display = active ? "block" : "none";
};

// Initialen Status laden
chrome.storage.local.get(['debugMode'], (res) => updateUI(!!res.debugMode));

// Klick-Event
btn.onclick = () => {
  chrome.storage.local.get(['debugMode'], (res) => {
    const newState = !res.debugMode;
    chrome.storage.local.set({ debugMode: newState }, () => updateUI(newState));
  });
};

// Nachrichten vom Content-Script empfangen
chrome.runtime.onMessage.addListener((request) => {
    if (logContainer.children.length > 50) {
    logContainer.removeChild(logContainer.lastChild);
}
  if (request.type === "LOG_EVENT") {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    entry.innerHTML = `<span>[${now}]</span> ${request.message}`;
    logContainer.prepend(entry); // Neueste Logs oben
  }
});