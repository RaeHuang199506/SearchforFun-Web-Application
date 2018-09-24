const http = require('http');
const https = require('https');
const fs = require('fs');
const url = require('url');
const querystring = require('querystring');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookie = require('cookie');
const cookieParser  = require('cookie-parser');

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const dburl = 'mongodb://localhost:27017/app';

// Use connect method to connect to the server
MongoClient.connect(dburl, function(err, db) {
  assert.equal(null, err);
  console.log("Connected successfully to server");
  users = db.collection('users');
});

app.listen(4000, () => {
	console.log('Server has started on port 4000');
});


app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

app.use(cookieParser());
app.use(function (req, res, next) {
	if(req.cookies && req.cookies.username) {
		let usernameVal = req.cookies.username;
		let passwordVal = req.cookies.password;
		users.find({ username: usernameVal, password: passwordVal }).toArray((err, results) => {
			if(!err && results.length != 0) {
				res.cookie('username', usernameVal, {path: '/', maxAge: 1000 * 60 * 5});
				res.cookie('password', passwordVal, {path: '/', maxAge: 1000 * 60 * 5});
				req.loginName = usernameVal;
			}
			next()
		});
	} else {
		next()
	}
	
});

app.use(express.static('public'));

app.post('/signUp', (req, res) => {
	let usernameVal = req.body.username;
	let passwordVal = req.body.password;
	users.find({ username: usernameVal}).toArray((err, results) => {
		if(err) {
			res.send("An error occurred!");
		} else if(results.length != 0) {
			res.send("The username has already existed.");
		} else {
			users.insertOne({
				username: usernameVal,
				password: passwordVal
			});
			res.cookie('username', usernameVal, {path: '/', maxAge: 1000 * 60 * 5});
			res.cookie('password', passwordVal, {path: '/', maxAge: 1000 * 60 * 5});
			res.send("Sign up successfully.");
		}
	});
});

app.get('/signIn', (req, res) => {
	let usernameVal = req.query.username;
	let passwordVal = req.query.password;
	users.find({ username: usernameVal, password: passwordVal }).toArray((err, results) => {
		if(err || results.length == 0) {
			res.send("The username or the password may be wrong.");
		} else {
			res.cookie('username', usernameVal, {path: '/', maxAge: 1000 * 60 * 5});
			res.cookie('password', passwordVal, {path: '/', maxAge: 1000 * 60 * 5});
			res.send("Sign in successfully.");
		}
	});
});

app.get('/generalSearch', (req, res) => {
	var options = {
		hostname: 'maps.googleapis.com',
		path: '/maps/api/place/nearbysearch/json?' + decodeURIComponent(querystring.stringify(req.query)).replace(/\s/g, "+") + '&key=AIzaSyDcPmk9sHYh8FEtMugUYbkk660CKC-4Rik',
		method: 'GET'
	};
	console.log(querystring.stringify(req.query));
	console.log(decodeURIComponent(options.path));
	var currRequest = https.request(options, (response) => {
		var currResults = "";
		response.on('data', (chunk) => {
			currResults += chunk;
		});
		response.on('end', () => {
			res.end(currResults);
		});
	});
	currRequest.end();
});

app.get('/detailSearch', (req, res) => {
	var options = {
		hostname: 'maps.googleapis.com',
		path: '/maps/api/place/nearbysearch/json?' + decodeURIComponent(querystring.stringify(req.query)).replace(/\s/g, "+") + '&key=AIzaSyDcPmk9sHYh8FEtMugUYbkk660CKC-4Rik',
	}
	var currRequest = https.request(options,(response) => {
		var currResults = "";
		response.on('data', (chunk) => {
			currResults += chunk;
		});
		response.on('end', () => {
			res.end(currResults);
		});
	});
	currRequest.end();
});

app.get('/yelpSearch', (req, res) => {
	var options = {
		hostname: 'api.yelp.com',
		path: '/v3/businesses/matches/best?' + decodeURIComponent(querystring.stringify(req.query)).replace(/\s/g, "+"),
		headers: {
			authorization: "Bearer pMwa0AjAJSy3BFQjyH27ZBlpv4VAvmiy9Jhrny737KsTjHhBhukcjeu3ONp3OdQL3SwkUCpL63UsxPXDV5UtjCpKNRTCaXPuQ7cDHsZcPT81VU-rFdHdzJx716LPWnYx"
		} 
	}
	var currRequest = https.request(options,(response) => {
		var currResults = "";
		response.on('data', (chunk) => {
			currResults += chunk;
		});
		response.on('end', () => {
			if(JSON.parse(currResults).businesses == undefined || JSON.parse(currResults).businesses == null || JSON.parse(currResults).businesses.length == 0) {
				res.end('{"hasReview": false}');
			} else {
				var optionsNext = {
					hostname: 'api.yelp.com',
					path: '/v3/businesses/'+ JSON.parse(currResults).businesses[0].id +'/reviews',
					headers: {
						authorization: "Bearer pMwa0AjAJSy3BFQjyH27ZBlpv4VAvmiy9Jhrny737KsTjHhBhukcjeu3ONp3OdQL3SwkUCpL63UsxPXDV5UtjCpKNRTCaXPuQ7cDHsZcPT81VU-rFdHdzJx716LPWnYx"
					}
				}
				var currRequestNext = https.request(optionsNext,(responseNext) => {
					var currResultsNext = "";
					if(responseNext.statusCode == 200) {
						responseNext.on('data', (chunkNext) => {
							currResultsNext += chunkNext;
						});
					}
					responseNext.on('end', () => {
						res.end(currResultsNext);
					});
				});
				currRequestNext.end();
			}
		});
	});
	currRequest.end();
});
