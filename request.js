const clients = new Map();

/**
 * Initializes a chat room for a specific chatId with the provided name.
 * @param {string} chatId - The unique chat room ID.
 * @param {string} name - The user's name from the URL.
 * @param {WebSocket} ws - The client's WebSocket connection.
 * @param {function} broadcast - The broadcast function from chat.js.
 */
function initializeChatRoom(chatId, name, ws, broadcast) {
    if (!clients.has(chatId)) {
        clients.set(chatId, new Map());
    }
    const client = { name: name || `Guest_${Math.random().toString(36).slice(2, 8)}`, state: 'active', chatId };
    clients.get(chatId).set(ws, client);
    console.log(`Client ${client.name} joined chatId ${chatId}. Total clients: ${clients.get(chatId).size}`);
    ws.send(JSON.stringify({ type: 'session_established', name: client.name, chatId }));
    ws.send(`Welcome, ${client.name}! You are now in chat room ${chatId}.`);
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

    if (client.state === 'active') {
        if (lowered === 'exit-chat') {
            broadcast(`${client.name} has left the chat room.`, ws, chatId);
            ws.send('You have left the chat room.');
            roomClients.delete(ws);
            if (roomClients.size === 0) clients.delete(chatId);
            console.log(`Client ${client.name} left chatId ${chatId}. Room deleted: ${!clients.has(chatId)}`);
            return true;
        }
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