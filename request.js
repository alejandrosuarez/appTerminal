const clients = new Map();
const soundCommands = require('./sound-commands');

/**
 * Initializes a chat room for a specific chatId with the provided name.
 * @param {string} chatId - The unique chat room ID.
 * @param {string} name - The user's name from the URL.
 * @param {WebSocket} ws - The client's WebSocket connection.
 * @param {function} broadcast - The broadcast function from chat.js.
 */
function initializeChatRoom(chatId, name, ws, broadcast) {
    // Initialize sound commands with broadcast function if not already done
    if (!soundCommands.isInitialized) {
        soundCommands.initialize(broadcast);
        soundCommands.isInitialized = true;
    }
    
    if (!clients.has(chatId)) {
        clients.set(chatId, new Map());
    }
    const client = { name: name || `Guest_${Math.random().toString(36).slice(2, 8)}`, state: 'active', chatId };
    clients.get(chatId).set(ws, client);
    console.log(`Client ${client.name} joined chatId ${chatId}. Total clients: ${clients.get(chatId).size}`);
    ws.send(JSON.stringify({ type: 'session_established', name: client.name, chatId }));
    ws.send(`Welcome, ${client.name}! You are now in chat room ${chatId}.`);
    
    // Send walkie-talkie instructions for private chat rooms
    setTimeout(() => {
        ws.send('Push-to-Talk: Click the red button or hold SPACEBAR to talk like a walkie-talkie!');
    }, 1000);
    
    broadcast(`${client.name} has joined the chat room.`, ws, chatId);
}

/**
 * Handles messages in a specific chat room.
 * @param {string} chatId - The unique chat room ID.
 * @param {WebSocket} ws - The client's WebSocket connection.
 * @param {string} message - The message from the client.
 * @param {function} broadcast - The broadcast function from chat.js.
 * @returns {boolean} - True if the message was handled.
 */
function handleChatRoomMessage(chatId, ws, message, broadcast) {
    const roomClients = clients.get(chatId);
    if (!roomClients || !roomClients.has(ws)) {
        console.log(`No room or client found for chatId ${chatId}`);
        return false;
    }

    const client = roomClients.get(ws);
    const input = message.toString().trim();
    const lowered = input.toLowerCase();
    console.log(`Message from ${client.name} in chatId ${chatId}: ${input}`);

    // Handle sound commands first (speak, scream, direct mp3 URLs)
    // Create a custom broadcast function for this private chat room
    const privateChatBroadcast = (msg, sender) => {
        const roomClients = clients.get(chatId);
        if (roomClients) {
            for (const [clientWs] of roomClients.entries()) {
                if (clientWs !== sender && clientWs.readyState === 1) {
                    clientWs.send(msg);
                }
            }
        }
    };
    
    // Check for sound commands manually with private chat broadcast
    const text = input.toString().trim();
    
    // Handle direct .mp3 URLs
    if (text.startsWith('http') && text.endsWith('.mp3')) {
        privateChatBroadcast(text, ws);
        return true;
    }
    
    // Handle "scream:" command
    if (text.toLowerCase().startsWith('scream:')) {
        const searchTerm = text.substring(7).trim();
        if (searchTerm) {
            const apiUrl = `https://myinstants-api-one.vercel.app/search?q=${encodeURIComponent(searchTerm)}`;
            const fetch = require('node-fetch');
            
            fetch(apiUrl)
                .then(res => res.json())
                .then(json => {
                    if (json.data && json.data.length > 0) {
                        const soundUrl = json.data[0].mp3;
                        if (soundUrl) {
                            privateChatBroadcast(soundUrl, ws);
                        }
                    }
                })
                .catch(error => console.error('MyInstants API Error:', error));
        }
        return true;
    }
    
    // Handle "speak:" command
    if (text.toLowerCase().startsWith('speak:')) {
        const speakText = text.substring(6).trim();
        if (speakText) {
            privateChatBroadcast(`speak: ${speakText}`, ws);
        }
        return true;
    }

    // Handle voice messages (walkie-talkie recordings)
    if (client.state === 'active' && input.startsWith('data:audio/')) {
        // Send the voice message back to the sender so they get a "Play" button
        ws.send(input);
        // Broadcast to everyone else in the private chat room
        const roomClients = clients.get(chatId);
        if (roomClients) {
            for (const [clientWs] of roomClients.entries()) {
                if (clientWs !== ws && clientWs.readyState === 1) {
                    clientWs.send(input);
                }
            }
        }
        return true;
    }

    if (client.state === 'active') {
        if (lowered === 'exit-chat') {
            broadcast(`${client.name} has left the chat room.`, ws, chatId);
            ws.send('You have left the chat room.');
            roomClients.delete(ws);
            if (roomClients.size === 0) clients.delete(chatId);
            console.log(`Client ${client.name} left chatId ${chatId}. Room deleted: ${!clients.has(chatId)}`);
            return true;
        }
        
        // Regular chat message
        broadcast(`${client.name}: ${input}`, ws, chatId);
        return true;
    }

    console.log(`Unhandled message from ${client.name} in state ${client.state}`);
    return false;
}

/**
 * Removes a client from a chat room.
 * @param {string} chatId - The unique chat room ID.
 * @param {WebSocket} ws - The client's WebSocket connection.
 * @param {function} broadcast - The broadcast function from chat.js.
 */
function removeClientFromChatRoom(chatId, ws, broadcast) {
    const roomClients = clients.get(chatId);
    if (roomClients && roomClients.has(ws)) {
        const client = roomClients.get(ws);
        if (client.name) {
            broadcast(`${client.name} has disconnected.`, ws, chatId);
        }
        roomClients.delete(ws);
        if (roomClients.size === 0) clients.delete(chatId);
        console.log(`Client removed from chatId ${chatId}. Remaining clients: ${roomClients.size}`);
    }
}

// Expose clients for broadcasting
function getClientsForChatId(chatId) {
    return clients.get(chatId);
}

module.exports = { initializeChatRoom, handleChatRoomMessage, removeClientFromChatRoom, getClientsForChatId };