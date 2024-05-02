const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(bodyParser.json());

let users = [];

app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 8);

    const userExists = users.find(user => user.username === username);

    if (userExists) {
      return res.status(400).send('User already exists');
    }

    users.push({
      username,
      password: hashedPassword
    });

    res.status(201).send('User registered successfully');
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = users.find(user => user.username === username);
    if (!user) {
      return res.status(400).send('User does not exist');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).send('Invalid password');
    }

    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '2h' });

    res.status(200).send({ token });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(403).send('A token is required for authentication');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    return res.status(401).send('Invalid Token');
  }
  return next();
};

app.get('/profile', verifyToken, (req, res) => {
  res.status(200).send(`Welcome ${req.user.username}, you are authenticated.`);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});