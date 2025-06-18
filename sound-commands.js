// sound-commands.js
// This new file handles all logic for playing sounds from URLs or API lookups.

// You will need to install this package by running: npm install node-fetch@2
const fetch = require('node-fetch');

// This will be assigned the broadcast function from chat.js
let broadcastFunction = null;

/**
 * Initializes the module with the broadcast function from chat.js
 * @param {function} broadcast - The broadcast function.
 */
function initialize(broadcast) {
    broadcastFunction = broadcast;
}

/**
 * Checks if a message is a sound command and handles it.
 * @param {string} message - The chat message from the user.
 * @param {object} client - The client's data ({ name, state }).
 * @param {WebSocket} ws - The client's WebSocket connection instance.
 * @returns {boolean} - True if the message was handled as a sound command.
 */
function handleSoundCommand(message, client, ws) {
    if (!client || client.state !== 'active') {
        return false;
    }

    const text = message.toString().trim();

    // --- Feature 1: Handle direct .mp3 URLs ---
    if (text.startsWith('http') && text.endsWith('.mp3')) {
        if (broadcastFunction) {
            // Broadcast the URL to everyone *except the sender* (ws).
            broadcastFunction(text, ws);
        }
        return true;
    }

    // --- Feature 2: Handle "scream:" command ---
    if (text.toLowerCase().startsWith('scream:')) {
        const searchTerm = text.substring(7).trim();
        if (!searchTerm) return false;

        const apiUrl = `https://myinstants-api-one.vercel.app/search?q=${encodeURIComponent(searchTerm)}`;

        fetch(apiUrl)
            .then(res => res.json())
            .then(json => {
                if (json.data && json.data.length > 0) {
                    const soundUrl = json.data[0].mp3;
                    if (soundUrl && broadcastFunction) {
                        // Broadcast the URL to everyone *except the sender* (ws).
                        broadcastFunction(soundUrl, ws);
                    }
                }
            })
            .catch(error => console.error('MyInstants API Error:', error));
        
        return true;
    }

    // Handle "speak:" command
    if (text.toLowerCase().startsWith('speak:')) {
        const speakText = text.substring(6).trim();
        if (speakText && broadcastFunction) {
            broadcastFunction(`speak: ${speakText}`, ws);
        }
        return true;
    }

    return false;
}

module.exports = { initialize, handleSoundCommand };
