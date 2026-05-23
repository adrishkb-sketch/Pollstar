const express = require('express');
const next = require('next');
const http = require('http');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;

app.prepare().then(() => {
  const expressApp = express();
  const server = http.createServer(expressApp);
  
  // Initialize Socket.io on the shared HTTP server
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Attach socket.io instance to the global object
  // This allows Next.js API routes to trigger events seamlessly
  global.io = io;

  io.on('connection', (socket) => {
    socket.on('join-poll', (pollId) => {
      socket.join(`poll-${pollId}`);
      console.log(`Socket ${socket.id} joined room for poll: ${pollId}`);
    });

    socket.on('leave-poll', (pollId) => {
      socket.leave(`poll-${pollId}`);
      console.log(`Socket ${socket.id} left room for poll: ${pollId}`);
    });

    socket.on('disconnect', () => {
      // Clean up if necessary
    });
  });

  // Delegate all remaining traffic to Next.js handler
  expressApp.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Pollstar custom server running on http://localhost:${port}`);
  });
}).catch((ex) => {
  console.error(ex.stack);
  process.exit(1);
});
