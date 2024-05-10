const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const serverPort = process.env.PORT || 3000;
const jwtSecretKey = process.env.JWT_SECRET;

app.use(bodyParser.json());

let registeredUsers = [];
let documents = [];

function checkRequiredFields(req, res, fields, message) {
  for (const field of fields) {
    if (!req.body[field]) {
      res.status(400).send(message);
      return false;
    }
  }
  return true;
}

app.post('/register', async (req, res) => {
  try {
    if(!checkRequiredFields(req, res, ['username', 'password'], 'Username and password are required')) {
      return;
    }
    
    const { username, password } = req.body;
    const hashedUserPassword = await bcrypt.hash(password, 8);

    if (registeredUsers.some(user => user.username === username)) {
      return res.status(400).send('User already exists');
    }

    registeredUsers.push({ username, password: hashedUserPassword });

    res.status(201).send('User registered successfully');
  } catch (error) {
    res.status(500).send('Failed to register user');
  }
});

app.post('/login', async (req, res) => {
  try {
    if(!checkRequiredFields(req, res, ['username', 'password'], 'Username and password are required for login')) {
      return;
    }

    const { username, password } = req.body;
    const userToLogin = registeredUsers.find(user => user.username === username);
    if (!userToLogin) {
      return res.status(400).send('User does not exist');
    }

    const isValidPassword = await bcrypt.compare(password, userToLogin.password);
    if (!isValidPassword) {
      return res.status(401).send('Invalid password');
    }

    const authToken = jwt.sign({ username }, jwtSecretKey, { expiresIn: '2h' });
    res.status(200).send({ authToken });
  } catch (error) {
    res.status(500).send('Login failed');
  }
});

const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(403).send('A token is required for authentication');
  }

  try {
    const decodedUser = jwt.verify(token, jwtSecretKey);
    req.user = decodedUser;
    next();
  } catch (err) {
    return res.status(401).send('Invalid Token');
  }
};

app.get('/profile', authenticateToken, (req, res) => {
  res.status(200).send(`Welcome ${req.user.username}, you are authenticated.`);
});

app.post('/documents', authenticateToken, (req, res) => {
  const { title, content } = req.body;

  if (!title) {
    return res.status(400).send('Document title is required');
  }

  const newDocument = { id: documents.length + 1, title, content, owner: req.user.username };
  documents.push(newDocument);
  res.status(201).send('Document created successfully');
});

app.get('/documents', authenticateToken, (req, res) => {
  const userDocuments = documents.filter(doc => doc.owner === req.user.username);
  res.status(200).send(userDocuments);
});

app.put('/documents/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const documentIndex = documents.findIndex(doc => doc.id == id && doc.owner === req.user.username);

  if (documentIndex === -1) {
    return res.status(404).send('Document not found or you are not the owner');
  }

  documents[documentIndex].content = content;
  res.status(200).send('Document updated successfully');
});

app.delete('/documents/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const documentIndex = documents.findIndex(doc => doc.id == id && doc.owner === req.user.username);

  if (documentIndex === -1) {
    return res.status(404).send('Document not found or you are not the owner');
  }

  documents.splice(documentIndex, 1);
  res.status(204).send();
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(serverPort, () => {
  console.log(`Server running at http://localhost:${serverPort}`);
});