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
  undoStack: [],
  redoStack: []
};

function applyOperation(doc, operationJson) {
  try {
    const operation = Operation.fromJSON(operationJson);
    return operation.apply(doc.content);
  } catch (error) {
    console.error('Error applying operation:', error);
    throw new Error('Failed to apply operation.');
  }
}

function invertOperation(doc, operationJson) {
  try {
    const operation = Operation.fromJSON(operationJson);
    return operation.invert(doc.content);
  } catch (error) {
    console.error('Error inverting operation:', error);
    throw new Error('Failed to invert operation.');
  }
}

io.on('connection', (socket) => {
  socket.emit('doc', doc);

  socket.on('operation', (operation, revision) => {
    if (revision < doc.revision) {
      socket.emit('resync', doc); 
    } else {
      try {
        const operationInverted = invertOperation(doc, operation);
        doc.content = applyOperation(doc, operation);
        doc.operations.push(operation);
        doc.undoStack.push(operationInverted);
        doc.revision++;
        doc.redoStack = [];
        io.emit('doc', doc);
      } catch (error) {
        console.error(error);
        socket.emit('error', `Error applying operation: ${error.message}`);
      }
    }
  });

  socket.on('undo', () => {
    if (doc.undoStack.length > 0) {
      const operationToUndo = doc.undoStack.pop();
      try {
        doc.content = applyOperation(doc, operationToUndo);
        doc.redoStack.push(operationToUndo);
        io.emit('doc', doc);
      } catch (error) {
        console.error(error);
        socket.emit('error', `Error undoing operation: ${error.message}`);
      }
    }
  });

  socket.on('redo', () => {
    if (doc.redoStack.length > 0) {
      const operationToRedo = doc.redoStack.pop();
      try {
        doc.content = applyOperation(doc, operationToRedo);
        const operationInverted = invertOperation(doc, operationToRedo);
        doc.undoStack.push(operationInverted);
        io.emit('doc', doc);
      } catch (error) {
        console.error(error);
        socket.emit('error', `Error redoing operation: ${error.message}`);
      }
    }
  });

  socket.on('disconnect', () => {
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});