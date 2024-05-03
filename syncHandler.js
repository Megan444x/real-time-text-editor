const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Operation } = require('ot');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let doc = {
  content: '',
  revision: 0,
  operations: [],
};

function applyOperation(doc, operation) {
  return Operation.fromJSON(operation).apply(doc.content);
}

io.on('connection', (socket) => {
  socket.emit('doc', doc);

  socket.on('operation', (operation, revision) => {
    if (revision < doc.revision) {
      socket.emit('doc', doc);
    } else {
      try {
        doc.content = applyOperation(doc, operation);
        doc.operations.push(operation);
        doc.revision++;
        io.emit('doc', doc);
      } catch (error) {
        socket.emit('error', 'Error applying operation');
      }
    }
  });

  socket.on('disconnect', () => {
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
});