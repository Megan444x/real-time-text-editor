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
  operations: [], // History of operations for 'redo'
  undoStack: [], // Stack of operations for 'undo'
  redoStack: [] // Stack of operations for 'redo'
};

function applyOperation(doc, operation) {
  return Operation.fromJSON(operation).apply(doc.content);
}

function invertOperation(doc, operation) {
  // Assumes Operation has an invert method that generates the inverse of a given operation
  return Operation.fromJSON(operation).invert(doc.content);
}

io.on('connection', (socket) => {
  socket.emit('doc', doc);

  socket.on('operation', (operation, revision) => {
    if (revision < doc.revision) {
      socket.emit('doc', doc);
    } else {
      try {
        const operationInverted = invertOperation(doc, operation);
        doc.content = applyOperation(doc, operation);
        doc.operations.push(operation);
        doc.undoStack.push(operationInverted); // Save inverted operation for undo
        doc.revision++;
        doc.redoStack = []; // Clear redo stack upon new operation
        io.emit('doc', doc);
      } catch (error) {
        socket.emit('error', 'Error applying operation');
      }
    }
  });

  socket.on('undo', () => {
    if (doc.undoStack.length > 0) {
      const operationToUndo = doc.undoStack.pop();
      try {
        doc.content = applyOperation(doc, operationToUndo);
        doc.redoStack.push(operationToUndo); // Add to redo stack after undo
        io.emit('doc', doc);
      } catch (error) {
        socket.emit('error', 'Error undoing operation');
      }
    }
  });

  socket.on('redo', () => {
    if (doc.redoStack.length > 0) {
      const operationToRedo = doc.redoStack.pop();
      try {
        doc.content = applyOperation(doc, operationToRedo);
        const operationInverted = invertOperation(doc, operationToRedo);
        doc.undoStack.push(operationInverted); // Re-invert the operation for undo stack
        io.emit('doc', doc);
      } catch (error) {
        socket.emit('error', 'Error redoing operation');
      }
    }
  });

  socket.on('disconnect', () => {});
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});