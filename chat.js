const clients = new Map();
const soundCommands = require('./sound-commands'); 

function broadcast(message, sender, chatId = null) {
    if (chatId) {
        const request = require('./request');
        const roomClients = request.getClientsForChatId(chatId);
        if (roomClients) {
            console.log(`Broadcasting to chatId ${chatId}: ${message}. Clients: ${roomClients.size}`);
            for (const [clientWs] of roomClients.entries()) {
                if (clientWs !== sender && clientWs.readyState === 1) {
                    console.log(`Sending to client in chatId ${chatId}`);
                    clientWs.send(message);
                }
            }
        } else {
            console.log(`No clients found for chatId ${chatId}`);
        }
        return;
    }

    console.log(`Broadcasting to main chat: ${message}`);
    for (const [clientWs] of clients.entries()) {
        if (clientWs !== sender && clientWs.readyState === 1) {
            clientWs.send(message);
        }
    }
}

// Expose clients for request.js to use in broadcasting
function getClients() {
    return clients;
}

soundCommands.initialize(broadcast);

function handleChat(ws, message) {
    let input;
    try {
        // Check for our special reconnect message
        input = JSON.parse(message.toString());
        if (input.type === 'reconnect') {
            const client = { name: input.name, state: 'active' };
            clients.set(ws, client);
            ws.send(`Welcome back, ${client.name}! Your session is restored.`);
            broadcast(`${client.name} has reconnected.`, ws);
            return true;
        }
    } catch (e) {
        // If not JSON, treat it as a regular text command
        input = message.toString().trim();
    }

    const client = clients.get(ws);

     // Let the sound handler check the message first.
    const wasSoundCommand = soundCommands.handleSoundCommand(message, client, ws);
    if (wasSoundCommand) {
        return true; // If it was a sound command, we're done.
    }

    const lowered = input.toLowerCase();

    // Voice messages from an active user
    if (client?.state === 'active' && input.startsWith('data:audio/')) {
      // Send the message back to the sender so they get a "Play" button.
        ws.send(input);
        // Broadcast to everyone else.
        broadcast(input, ws);
        return true;
    }

    // New user joining
    if (!clients.has(ws) && lowered === 'chat') {
        ws.send('Enter your guest name:');
        clients.set(ws, { state: 'awaitingName' });
        return true;
    }

    // New user providing name
    if (client?.state === 'awaitingName') {
        client.name = input;
        client.state = 'active';
        // Tell the client to save their session info
        ws.send(JSON.stringify({ type: 'session_established', name: client.name }));
        ws.send(`Welcome, ${client.name}! You can now chat.`);
        broadcast(`${client.name} has joined the chat.`, ws);
        return true;
    }
    
    // An active user leaving the chat
    if (client?.state === 'active' && lowered === 'exit-chat') { // Use a specific command
        broadcast(`${client.name} has left the chat.`, ws);
        ws.send('You have left the chat. Type "chat" to join again.');
        clients.delete(ws);
        return true;
    }
    
    // If an active user types anything else, it's a chat message
    if (client?.state === 'active') {
        // If the message looks like a command for the server, let it pass through.
        if (input.toLowerCase().startsWith('sql ')) {
            return false;
        }
        // Otherwise, it's a regular chat message.
        broadcast(`${client.name}: ${input}`, ws);
        return true;
    }

    // If none of the above, it's a command for server.js (like 'sql')
    return false;
}

function removeClient(ws) {
  const client = clients.get(ws);
  if (client) {
    broadcast(`${client.name} has disconnected.`, ws);
    clients.delete(ws);
  }
}

module.exports = { handleChat, removeClient, broadcast, getClients };