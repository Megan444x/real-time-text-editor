import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const SOCKET_IO_URL = process.env.REACT_APP_SOCKET_IO_URL;

const App = () => {
  const [socket, setSocket] = useState(null);
  const [document, setDocument] = useState('');

  useEffect(() => {
    const socket = io(SOCKET_IO_URL);
    setSocket(socket);

    socket.on('documentUpdate', (updatedDocument) => {
      setDocument(updatedDocument);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleTextChange = (content, delta, source, editor) => {
    if (source === 'user') {
      socket.emit('updateDocument', editor.getContents());
    }
  };

  return (
    <div className="app">
      <h2>Collaborative Text Editor</h2>
      <Quill theme="snow" value={document} onChange={handleTextChange} />
    </div>
  );
};

export default App;