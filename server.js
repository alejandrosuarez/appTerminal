const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const nlp = require('compromise');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve a simple HTML page for testing (optional)
app.get('/', (req, res) => {
  res.send('<h1>Terminal Simulator</h1><p>Connect via WebSocket at wss://appterminal.onrender.com</p>');
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.send('Welcome to the terminal simulator! Type "exit" to quit.\n');

  ws.on('message', (message) => {
    const input = message.toString().trim();
    if (input.toLowerCase() === 'exit') {
      ws.send('Session ended. Goodbye!\n');
      ws.close();
    } else {
      // Process input with compromise for basic conversation
      const doc = nlp(input);
      const isGreeting = doc.has('hi') || doc.has('hello') || doc.has('hey');
      const isQuestion = doc.questions().found;

      let response = '';
      if (isGreeting) {
        response = 'Hello! Nice to meet you. How can I assist you today?\n';
      } else if (isQuestion) {
        response = 'Interesting question! I’m a simple AI, so I can only respond to basic greetings or commands for now. Try "hi" or "exit".\n';
      } else {
        response = `You entered: ${input}. I’m a basic AI—try a greeting like "hi" or type "exit" to quit.\n`;
      }
      ws.send(response);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});