const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve a simple HTML page for testing (optional)
app.get('/', (req, res) => {
  res.send('<h1>Terminal Simulator</h1><p>Connect via WebSocket at ws://your-url.onrender.com</p>');
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
      ws.send(`You entered: ${input}\n`);
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