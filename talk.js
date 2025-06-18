const defaultVoice = 'UK English Female';
const defaultRate = 1.0;
const defaultPitch = 1.0;
const defaultVolume = 1.0;
const shortcutVoices = {
    'male': { voice: 'UK English Male', rate: 1.0, pitch: 1.0 },
    'female': { voice: 'UK English Female', rate: 1.0, pitch: 1.0 },
    'slow': { voice: 'UK English Female', rate: 0.5, pitch: 1.0 },
    'fast': { voice: 'UK English Female', rate: 1.5, pitch: 1.0 },
    'robot': { voice: 'UK English Male', rate: 0.8, pitch: 0.5 }
};
const validVoices = [
    'UK English Female', 'UK English Male',
    'US English Female', 'US English Male',
    'Australian Female', 'Australian Male'
];

let isResponsiveVoiceLoaded = false;

function loadResponsiveVoice(callback) {
    if (typeof responsiveVoice !== 'undefined') {
        isResponsiveVoiceLoaded = true;
        console.log('ResponsiveVoice already loaded');
        callback();
        return;
    }

    const script = document.createElement('script');
    script.src = 'https://code.responsivevoice.org/responsivevoice.js?key=3FtHJch9';
    script.onload = () => {
        isResponsiveVoiceLoaded = true;
        console.log('ResponsiveVoice loaded successfully');
        callback();
    };
    script.onerror = () => {
        console.error('Failed to load ResponsiveVoice');
    };
    document.head.appendChild(script);
}

function parseSpeakCommand(message) {
    console.log('Parsing command:', message);
    if (!message.startsWith('speak:')) {
        console.log('Not a speak command');
        return null;
    }

    const parts = message.split(':');
    console.log('Command parts:', parts);

    if (parts.length < 2 || parts.length > 3) {
        console.log('Invalid command: expected 2 or 3 parts, got', parts.length);
        return null;
    }

    let text, options = {};

    // Advanced mode (e.g., speak:voice=UK English Male,rate=0.8,pitch=1.2: This is a test message)
    if (parts.length === 3 && parts[1].includes('=')) {
        const optionsStr = parts[1].trim();
        text = parts[2].trim();
        console.log('Detected advanced mode - Options:', optionsStr, 'Text:', text);
        if (!text) {
            console.log('No text provided for advanced mode');
            return null;
        }
        const pairs = optionsStr.split(',').map(pair => pair.trim());
        let isValid = true;
        pairs.forEach(pair => {
            if (!pair.includes('=')) {
                console.log('Invalid option pair, missing "=":', pair);
                isValid = false;
                return;
            }
            let [key, value] = pair.split('=').map(s => s.trim());
            if (!key || !value) {
                console.log('Invalid option pair, empty key or value:', pair);
                isValid = false;
                return;
            }
            if (key === 'voice') {
                const normalizedValue = value.toLowerCase();
                const foundVoice = validVoices.find(v => v.toLowerCase() === normalizedValue);
                if (foundVoice) {
                    options.voice = foundVoice;
                } else {
                    console.log('Invalid voice:', value);
                    isValid = false;
                }
            } else if (key === 'rate') {
                const rate = parseFloat(value);
                if (!isNaN(rate) && rate >= 0.1 && rate <= 2.0) {
                    options.rate = rate;
                } else {
                    console.log('Invalid rate, must be 0.1-2.0:', value);
                    isValid = false;
                }
            } else if (key === 'pitch') {
                const pitch = parseFloat(value);
                if (!isNaN(pitch) && pitch >= 0.5 && pitch <= 2.0) {
                    options.pitch = pitch;
                } else {
                    console.log('Invalid pitch, must be 0.5-2.0:', value);
                    isValid = false;
                }
            } else {
                console.log('Unrecognized option key:', key);
                isValid = false;
            }
        });
        if (!isValid) {
            console.log('Advanced mode options invalid, skipping');
            return null;
        }
    }
    // Shortcut mode (e.g., speak:male: Hello world)
    else if (parts.length === 3) {
        const shortcut = parts[1].toLowerCase().trim();
        text = parts[2].trim();
        console.log('Detected shortcut:', shortcut, 'Text:', text);
        if (!shortcutVoices[shortcut]) {
            console.log('Invalid shortcut:', shortcut);
            return null;
        }
        if (!text) {
            console.log('No text provided for shortcut');
            return null;
        }
        options = { ...shortcutVoices[shortcut] };
    }
    // Basic mode (e.g., speak: Hello everyone!)
    else {
        text = parts[1].trim();
        console.log('Detected basic mode - Text:', text);
        if (!text) {
            console.log('No text provided for basic mode');
            return null;
        }
    }

    return {
        text,
        voice: options.voice || defaultVoice,
        rate: options.rate || defaultRate,
        pitch: options.pitch || defaultPitch,
        volume: defaultVolume
    };
}

function initializeTalk(ws) {
    // Load ResponsiveVoice and initialize WebSocket handler
    loadResponsiveVoice(() => {
        const originalOnMessage = ws.onmessage;

        ws.onmessage = function(event) {
            const message = event.data;

            if (typeof message === 'string' && message.startsWith('speak:')) {
                console.log('Received speak command:', message);
                if (!isResponsiveVoiceLoaded || typeof responsiveVoice === 'undefined') {
                    console.error('ResponsiveVoice not loaded');
                    return;
                }

                const parsed = parseSpeakCommand(message);
                if (!parsed) {
                    console.log('Skipping speech due to invalid command');
                    return;
                }

                console.log('Speaking with parameters:', parsed);

                if (typeof unlockAudio === 'function') {
                    console.log('Unlocking audio context');
                    unlockAudio();
                } else {
                    console.warn('unlockAudio function not found, audio may not play on iOS');
                }

                try {
                    responsiveVoice.speak(parsed.text, parsed.voice, {
                        rate: parsed.rate,
                        pitch: parsed.pitch,
                        volume: parsed.volume,
                        onstart: () => console.log('Speech started:', parsed.text),
                        onend: () => console.log('Speech ended:', parsed.text),
                        onerror: (err) => console.error('Speech error:', err)
                    });
                } catch (err) {
                    console.error('Error in responsiveVoice.speak:', err);
                }
                return;
            }

            if (originalOnMessage) {
                originalOnMessage.call(ws, event);
            }
        };
    });
}

if (typeof window !== 'undefined') {
    window.initializeTalk = initializeTalk;
}