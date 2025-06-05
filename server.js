const net = require('net');

const server = net.createServer((socket) => {
  socket.write('Welcome to the app!\n');
});

server.listen(5000, () => {
  console.log('Server listening on port 5000');
});