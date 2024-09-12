'use strict';
require("dotenv").config()

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
// const jwt = require('jsonwebtoken');
const fs = require('fs');
const axios = require('axios');
// const connect = require('./crypto/connect');

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

let Users;
fs.readFile("./users.json", "utf8", (error, data) => {
	if (error) {
	  console.log(error);
	  return;
	}
	Users = JSON.parse(data);
	// console.log(Users);
  });



// Backend routes
app.get("/api/options", async (req, res) => {
	try {
		const { data } = await axios.get(END_POINT);
		res.status(200).send(data);
	  } catch(ex) {
		res.status(500).send(ex.data);
	  }
});

app.post("/SignIn", async (req, res) => {
	try {
		const { username, password } = req.body;
		for (let i = 0; i<Users.length; i++)
			if (Users[i].username == username){
                if (Users[i].password != password){
					console.log("Invalid password:\n")
                    return res.status(401).json({ message: "Invalid password" });

                } else {
                    console.log("Identity Verified!\n");
                    req.session.loggedin = true;
                    req.session.username = username;
					req.session.userId = Users[i].userId;
					// console.log(req.session.username, req.session.userId);
					res.redirect("/voting");
                    break;
                }
            }
	} catch (error) {
		console.log(error);
	}
});

app.post("/voting/submit", async (req, res) => { 
	const userId = req.session.userId;
	const optionId = req.body.optionId;
	// console.log('so far so good', userId, optionId);

	await connect.castVote(userId, optionId);

	res.redirect("/voting");
});

app.post("/dashboard/addOption", async (req, res) => {
	try {
		let options;
		fs.readFile("./src/components/options.json", "utf8", (error, response) => {
			if (error) {
				console.log(error);
				return;
			}
			options = JSON.parse(response);
			console.log(options);
			options.push(req.body);
			fs.writeFileSync("./src/components/options.json", JSON.stringify(options));
			res.redirect("/dashboard");
		})
	} catch (err) {
		console.log(err);
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
