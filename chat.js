// chat.js
const clients = new Map(); // ws => { name, state }

function handleChat(ws, message) {
  const input = message.toString().trim();
  const client = clients.get(ws);

  // If the client is in an active chat and sends audio data
  if (client?.state === 'active' && input.startsWith('data:audio/')) {
    // Create a structured payload for the voice message
    const voicePayload = {
      type: 'voiceMessage',
      senderName: client.name,
      audioData: input,
      timestamp: new Date().getTime() // Unique ID for the audio element
    };
    
    // Broadcast the JSON object to all clients
    broadcast(JSON.stringify(voicePayload));
    return true; // Mark the message as handled
  }
  
  const lowered = input.toLowerCase();

  // Not in chat yet
  if (!clients.has(ws) && lowered === 'chat') {
    ws.send('Enter your guest name:');
    clients.set(ws, { state: 'awaitingName' });
    return true;
  }

  

  // Awaiting name
  if (client?.state === 'awaitingName') {
    client.name = input;
    client.state = 'active';
    ws.send(`Welcome, ${client.name}! You can now chat. Type "exit" to leave.`);
    broadcast(`${client.name} has joined the chat.`, ws);
    return true;
  }

  // Leaving chat
  if (client?.state === 'active' && lowered === 'exit') {
    ws.send('You have left the chat. Type "chat" to join again.');
    broadcast(`${client.name} has left the chat.`, ws);
    clients.delete(ws);
    return true;
  }

  // Chatting
  if (client?.state === 'active') {
    broadcast(`${client.name}: ${input}`, ws);
    return true;
  }

  return false; // Not handled by chat module
}

function broadcast(message, sender) {
  for (const [clientWs] of clients.entries()) {
    if (clientWs !== sender && clientWs.readyState === 1) {
      clientWs.send(message);
    }
  }
}

function removeClient(ws) {
  const client = clients.get(ws);
  if (client && client.state === 'active') {
    broadcast(`${client.name} has disconnected.`, ws);
  }
  clients.delete(ws);
}

module.exports = {
  handleChat,
  removeClient,
  broadcast // Export broadcast for potential use in voice.js
};