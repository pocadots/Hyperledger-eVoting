'use strict';
require("dotenv").config()

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
// const fs = require('fs');
const axios = require('axios');
const bcrypt = require("bcrypt");

const connectDB = require("./config/db-config");
const User = require("./models/user");
const Option = require("./models/option");

// Hyperledger Fabric connection, comment out during development to disengage the blockchain network component
const connect = require('./crypto/connect');

const app = express();
const port = process.env.PORT || '3003';;

// Middleware setup
// app.use(cors());
app.use(cors( { origin: '*'}));
app.use(bodyParser.json());
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static(path.join(__dirname, ".", "build")));

// connect to db
connectDB();

//Middleware Helpers
function isAuthenticated(req, res, next) {
    if (req.session.username) {
        return next();
    }
    res.redirect("/");
}

function isNotAuthenticated(req, res, next) {
    if (!(req.session.username)) {
        return next();
    }
    res.redirect("/voting");
}

function isAdminSeeking(req, res, next) {
    if (req.session.role === 'admin') {
        return next();
    }
    res.redirect("/voting")
}

function isUserSeeking(req, res, next) {
    if (req.session.role !== 'admin') {
        return next();
    }
    res.redirect("/dashboard")
}

function generateId() {	
    let uId = "";
	const chars = '0123456789'; // List of digits

	for (let i = 0; i < 16; i++) {
		const randomIndex = Math.floor(Math.random() * chars.length);
		uId += chars.charAt(randomIndex);
	}

	return uId;
}

// Backend routes
app.get("/api/opt", async (req, res) => {
	try {
		const { data } = await axios.get(END_POINT);
		res.status(200).send(data);
	  } catch(ex) {
		res.status(500).send(ex.data);
	  }
});

app.post("/SignIn", isNotAuthenticated, async (req, res) => {
	try {
		const { username, password } = req.body;
		const user = await User.findOne({ username: username });
		if (!user) return res.status(401).send("Invalid username.");

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) return res.status(401).send("Invalid password.");

		req.session.loggedin = true;
		req.session.username = username;
		req.session.userId = user.id;
		req.session.role = user.role;

		console.log('Successful sign in...');

		if (req.session.role === 'admin') {
			res.redirect('/dashboard');
		} else {
			res.redirect("/voting");
		}
	} catch (err) {
		console.error("Error signing in:", err);
		res.status(500).send("Error signing in.");
	}
});


// User authenticate/sign up
app.post("/SignUp/submit", isNotAuthenticated, async (req, res) => {
	try {
		const { username, password } = req.body;
		const id = await generateId();

		//check duplicate username
		const user = await User.findOne({ username: username });
		if (user) return res.status(401).send("Username already in use.");

		const newUser = new User({ username, password, id });
		await newUser.save();

		// create a vote object with the new user's id in the fabric network
		await connect.addVote(id);

		// res.status(201).send("User registered successfully");
		console.log("Successfully registered user:", username);
		res.redirect('/');
		
	} catch (err) {
		console.error("Error signing up:", err);
		res.status(500).send("Error signing up.");
	}
})

app.post("/SignOut", isAuthenticated, async (req, res, next) => {
	try {
		if (req.session) {
			req.session.destroy(function (err) {
				console.log('Sign out successful.')
			})
			// res.redirect('/');
			return next();
		}
	} catch (err) {
		console.log("Error signing out.", err);
		res.status(500).send("Error signing out.");
	}
})

// ===================================

app.post("/voting/submit", isAuthenticated, isUserSeeking, async (req, res) => { 
	const userId = req.session.userId;
	const optionId = req.body.optionId;
	console.log('so far so good', userId, optionId);

	await connect.castVote(userId, optionId);

	res.redirect("/voting");
});

app.post("/dashboard/addOption", isAuthenticated, isAdminSeeking, async (req, res) => {
	try {
		console.log(req.body);
		const { description } = req.body;
		const id = await generateId();

		//check duplicate username
		const options = await Option.findOne({ description : description });
		if (options) return res.status(401).send("Option already registered in election.");

		const newOption = new Option({ id, description });
		await newOption.save();

		console.log("Successfully registered option:", description);
		res.redirect("/dashboard");

	} catch (err) {
		console.log(err);
	}

});

app.post('/dashboard/addDate', isAuthenticated, isAdminSeeking, async (req, res) => {
	try {
		const { duration } = req.body;
		const endDate = new Date(duration).getTime();
		console.log(endDate);
		await connect.setEndTime(endDate);
		res.redirect('/dashboard');
	} catch (err) {
		console.log('Error adding date:', err);
	}
});

// Fetch and forward the voting list data from mongoDB
app.get('/api/voting', (req, res) => {
	Option
	  .find()
	  .then((response) => {
		// console.log(response);
		res.send(response);
       })
	  .catch((error) => res.send(error));
  });

// Fetch voting results
app.get('/api/results', async (req, res) => {
	try {
		const results = await connect.getResults();
		console.log(results);
		res.send(results);

	} catch (err) {
		console.log('Error getting results from blockchain:', err);
	}
});
  

//Let React frontend handle other routes
app.use((req, res, next) => {
	res.sendFile(path.join(__dirname, ".", "build", "index.html"));
});

// Start the server
app.listen(port, () => {
  console.log(`Congratulations!  The Server is running on http://localhost:${port}`);
});        


module.exports = { isAuthenticated, isNotAuthenticated, isAdminSeeking, isUserSeeking };