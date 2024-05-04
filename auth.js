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

app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedUserPassword = await bcrypt.hash(password, 8); 

    const existingUser = registeredUsers.find(user => user.username === username); 

    if (existingUser) {
      return res.status(400).send('User already exists');
    }

    registeredUsers.push({
      username,
      password: hashedUserPassword, 
    });

    res.status(201).send('User registered successfully');
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const userToLogin = registeredUsers.find(user => user.username === username); 
    if (!userToLogin) {
      return res.status(400).send('User does not exist');
    }

    const isValidPassword = await bcrypt.compare(password, userToLogin.password); 
    if (!isValidPassword) {
      return res.status(401).send('Invalid password');
    }

    const authToken = jwt.sign({ username: userToLogin.username }, jwtSecretKey, { expiresIn: '2h' }); 

    res.status(200).send({ authToken }); 
  } catch (error) {
    res.status(500).send(error.message);
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
  } catch (err) {
    return res.status(401).send('Invalid Token');
  }
  return next();
};

app.get('/profile', authenticateToken, (req, res) => {
  res.status(200).send(`Welcome ${req.user.username}, you are authenticated.`);
});

app.listen(serverPort, () => {
  console.log(`Server running at http://localhost:${serverPort}`);
});