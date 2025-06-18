function initializeTalk(ws) {
    // Store the original onmessage handler
    const originalOnMessage = ws.onmessage;

    // Override onmessage to handle speak commands
    ws.onmessage = function(event) {
        const message = event.data;

        // Handle speak: commands
        if (typeof message === 'string' && message.startsWith('speak:')) {
            const text = message.substring(6).trim();
            if (typeof responsiveVoice !== 'undefined' && text) {
                // Use the existing unlockAudio function for iOS compatibility
                if (typeof unlockAudio === 'function') {
                    unlockAudio();
                }
                responsiveVoice.speak(text);
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