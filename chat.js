const clients = new Map();

function broadcast(message, sender) {
    // Send to everyone EXCEPT the original sender
    for (const [clientWs] of clients.entries()) {
        if (clientWs !== sender && clientWs.readyState === 1) {
            clientWs.send(message);
        }
    }
}

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

    const lowered = input.toLowerCase();
    const client = clients.get(ws);

    // Voice messages from an active user
    if (client?.state === 'active' && input.startsWith('data:audio/')) {
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

module.exports = { handleChat, removeClient };