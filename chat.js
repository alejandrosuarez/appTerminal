const clients = new Map();

// Simplified broadcast: sends a message to ALL connected clients.
function broadcast(messagePayload) {
  const messageString = JSON.stringify(messagePayload);
  for (const [clientWs] of clients.entries()) {
    if (clientWs.readyState === 1) { // 1 means WebSocket.OPEN
      clientWs.send(messageString);
    }
  }
}

function handleChat(ws, message) {
    let input;
    try {
        input = JSON.parse(message.toString());
    } catch (e) {
        input = message.toString().trim();
    }

    // Handle a reconnecting user
    if (input.type === 'reconnect') {
        const client = { name: input.name, state: 'active' };
        clients.set(ws, client);
        // Send a specific welcome back message to the user
        ws.send(JSON.stringify({ type: 'system_update', message: `Welcome back, ${client.name}! Your session is restored.` }));
        // Announce the reconnection to everyone
        broadcast({ type: 'system_update', message: `${client.name} has reconnected.` });
        return true;
    }

    const client = clients.get(ws);
    const textInput = typeof input === 'string' ? input : '';

    // Handle a voice message
    if (client?.state === 'active' && textInput.startsWith('data:audio/')) {
        broadcast({ type: 'voiceMessage', senderName: client.name, audioData: textInput });
        return true;
    }

    // Handle a new user typing "chat"
    if (!clients.has(ws) && textInput.toLowerCase() === 'chat') {
        ws.send(JSON.stringify({ type: 'system_update', message: 'Enter your guest name:' }));
        clients.set(ws, { state: 'awaitingName' });
        return true;
    }

    // Handle a new user submitting their name
    if (client?.state === 'awaitingName') {
        client.name = textInput;
        client.state = 'active';
        
        ws.send(JSON.stringify({ type: 'session_established', name: client.name }));
        ws.send(JSON.stringify({ type: 'system_update', message: `Welcome, ${client.name}! You can now chat. Type "exit" to leave.` }));
        broadcast({ type: 'system_update', message: `${client.name} has joined the chat.` });
        return true;
    }
    
    // Handle leaving the chat
    if (client?.state === 'active' && textInput.toLowerCase() === 'exit') {
        broadcast({ type: 'system_update', message: `${client.name} has left the chat.` });
        ws.send(JSON.stringify({ type: 'system_update', message: 'You have left the chat. Type "chat" to join again.' }));
        clients.delete(ws);
        return true;
    }

    // Handle a regular text message
    if (client?.state === 'active') {
        broadcast({ type: 'text_message', senderName: client.name, message: textInput });
        return true;
    }

    return false; // Not handled by chat module
}

function removeClient(ws) {
  const client = clients.get(ws);
  if (client?.state === 'active') {
    broadcast({ type: 'system_update', message: `${client.name} has disconnected.` });
  }
  clients.delete(ws);
}

module.exports = { handleChat, removeClient };