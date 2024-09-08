'use strict';

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');


const app = express();
const port = 5000;

// Middleware setup
app.use(cors());
app.use(bodyParser.json());
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));







// Basic route
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Start the server
app.listen(port, () => {
  console.log(`Congratulations!  The Server is running on http://localhost:${port}`);
});        
