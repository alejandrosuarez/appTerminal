const params = {
    voice: 'UK English Female', // Default; updated for en/es prefixes
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0
};

function initializeTalk(ws) {
    // Store the original onmessage handler
    const originalOnMessage = ws.onmessage;

    // Override onmessage to handle speak commands
    ws.onmessage = function(event) {
        const message = event.data;

        // Handle speak: commands
        if (typeof message === 'string' && message.startsWith('speak:')) {
            let text = message.substring(6).trim();
            let lang = null;

            // Check for language prefix (e.g., speak:es: hola)
            if (text.startsWith('en:') || text.startsWith('es:')) {
                lang = text.substring(0, 2);
                text = text.substring(3).trim();
            }

            if (typeof responsiveVoice !== 'undefined' && text) {
                // Use the existing unlockAudio function for iOS compatibility
                if (typeof unlockAudio === 'function') {
                    unlockAudio();
                }
                params.voice = lang === 'es' ? 'Spanish Latin American Male' : 'UK English Female';
                responsiveVoice.speak(text, params.voice, { rate: params.rate, pitch: params.rate, volume: params.volume });
            } else {
                console.error('ResponsiveVoice not loaded or empty text');
            }
            return; // Prevent further processing by original handler
        }

        // Call the original handler for all other messages
        if (originalOnMessage) {
            originalOnMessage.call(ws, event);
        }
    };
}

// Expose to global scope only in browser
if (typeof window !== 'undefined') {
    window.initializeTalk = initializeTalk;
}