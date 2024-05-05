import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import 'react-quill/dist/quill.snow.css';
import ReactQuill from 'react-quill';

const SOCKET_IO_URL = process.env.REACT_APP_SOCKET_IO_URL;

const App = () => {
  const [socket, setSocket] = useState(null);
  const [document, setDocument] = useState('');

  useEffect(() => {
    const newSocket = io(SOCKET_IO_URL);
    setSocket(newSocket);

    newSocket.on('documentUpdate', (updatedDocument) => {
      console.log('Document update received:', updatedDocument);
      setDocument(updatedDocument);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleTextChange = (content, delta, source, editor) => {
    if (source === 'user') {
      console.log('Sending update to socket:', editor.getContents());
      socket.emit('updateDocument', editor.getContents());
    }
  };

  const saveDocument = () => {
    const element = document.createElement("a");
    const file = new Blob([document], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "SavedDocument.txt";
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    document.body.removeChild(element);
  }

  return (
    <div className="app">
      <h2>Collaborative Text Editor</h2>
      <ReactQuill theme="snow" value={document} onChange={handleTextChange} />
      <button onClick={saveDocument} style={{marginTop: '20px'}}>
        Save Document
      </button>
    </div>
  );
};

export default App;