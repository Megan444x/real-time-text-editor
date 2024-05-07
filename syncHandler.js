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
  try {
    return Operation.fromJSON(operation).apply(doc.content);
  } catch (error) {
    console.error('Error applying operation:', error);
    throw new Error('Failed to apply operation.');
  }
}

function invertOperation(doc, operation) {
  // Assumes Operation has an invert method that generates the inverse of a given operation
  try {
    return Operation.fromJSON(operation).invert(doc.content);
  } catch (error) {
    console.error('Error inverting operation:', error);
    throw new Error('Failed to invert operation.');
  }
}

io.on('connection', (socket) => {
  socket.emit('doc', doc);

  socket.on('operation', (operation, revision) => {
    if (revision < doc.revision) {
      socket.emit('resync', doc); // Suggest resyncing instead of sending doc directly; might need to implement based on the client's handling
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
        console.error(error);
        socket.emit('error', 'Error applying operation: ' + error.message);
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
        console.error(error);
        socket.emit('error', 'Error undoing operation: ' + error.message);
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
        console.error(error);
        socket.emit('error', 'Error redoing operation: ' + error.message);
      }
    }
  });

  socket.on('disconnect', () => {
    // Optional: add logic to handle disconnection if needed, such as cleaning up user sessions
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});