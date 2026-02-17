// --- DEBUG SYSTEM ---
let debugActive = false;
chrome.storage.local.get(['debugMode'], (res) => { debugActive = !!res.debugMode; });
chrome.storage.onChanged.addListener((changes) => {
    if (changes.debugMode) debugActive = changes.debugMode.newValue;
});

const sendLog = (message) => {
    if (debugActive) {
        console.log(`[TwitchSpeedFix] ${message}`);
        chrome.runtime.sendMessage({ type: "LOG_EVENT", message }).catch(() => {});
    }
};

// --- CORE LOGIC: Property Hijacking ---
// Wir injizieren ein Script direkt in die Seite, um die playbackRate Eigenschaft zu "kapern"
const injectScript = () => {
    const script = document.createElement('script');
    script.textContent = `
        (function() {
            const originalDescriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'playbackRate');
            
            Object.defineProperty(HTMLMediaElement.prototype, 'playbackRate', {
                set: function(value) {
                    if (value !== 1) {
                        // Hier wird Twitch blockiert, bevor es den Wert setzen kann
                        window.dispatchEvent(new CustomEvent('twitch-speed-blocked', { detail: value }));
                        return originalDescriptor.set.call(this, 1.0);
                    }
                    return originalDescriptor.set.call(this, value);
                },
                get: function() {
                    return originalDescriptor.get.call(this);
                },
                configurable: true
            });
            console.log("[TwitchSpeedFix] Injection successful: playbackRate protected.");
        })();
    `;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
};

// Listener für das injizierte Script, um Logs ans Popup zu senden
window.addEventListener('twitch-speed-blocked', (e) => {
    sendLog(`Twitch tried to set Speed to ${e.detail}. Forced back to 1.0.`);
});

// Sofort ausführen
injectScript();

// Sicherheits-Check alle 2 Sekunden (falls das Hijacking umgangen wird)
setInterval(() => {
    const video = document.querySelector('video');
    if (video && video.playbackRate !== 1) {
        video.playbackRate = 1.0;
        sendLog("Polled check: Speed was not 1.0, corrected.");
    }
}, 2000);