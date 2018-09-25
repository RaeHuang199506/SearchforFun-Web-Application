var http = require('http');
var https = require('https');
var fs = require('fs');
var url = require('url');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var url = '/*mongoDB url here*/';


// Use connect method to connect to the server
MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  console.log("Connected successfully to server");
  users = db.collection('users');
  db.close();
});

function wait(time){
	var startTime=new Date().getTime();
	while(new Date().getTime()<startTime+time);
}

http.createServer(function(req, res){
	if(req.url.includes('keyword')) {
		var options = {
			hostname: 'maps.googleapis.com',
			path: '/maps/api/place/nearbysearch/json' + (req.url.substring(1)) + '&key=/*Google API Key here*/',
			method: 'GET'
		};
		console.log(options.path);
		var currRequest = https.request(options, (response) => {
			var currResults = "";
			if(response.statusCode == 200) {
				response.on('data', (chunk) => {
					currResults += chunk;
				});
			}
			response.on('end', () => {
				res.end(currResults);
			});
		});
		currRequest.end();
	} else if(req.url.includes('pagetoken')) {
		wait(900);
		var options = {
			hostname: 'maps.googleapis.com',
			path: '/maps/api/place/nearbysearch/json' + (req.url.substring(1)) + '&key=/*Google API Key here*/',
		}
		var currRequest = https.request(options,(response) => {
			var currResults = "";
			if(response.statusCode == 200) {
				response.on('data', (chunk) => {
					currResults += chunk;
				});
			}
			response.on('end', () => {
				res.end(currResults);
			});
		});
		currRequest.end();
	} else if(req.url.includes('country')) {
		var options = {
			hostname: 'api.yelp.com',
			path: '/v3/businesses/matches/best' + (req.url.substring(1)),
			headers: {
				authorization: "Bearer /*Yelp API Key here*/"
			} 
		}
		var currRequest = https.request(options,(response) => {
			var currResults = "";
			if(response.statusCode == 200) {
				response.on('data', (chunk) => {
					currResults += chunk;
				});
			}
			response.on('end', () => {
				if(JSON.parse(currResults).businesses == undefined || JSON.parse(currResults).businesses == null || JSON.parse(currResults).businesses.length == 0) {
					res.end('{"hasReview": false}');
				} else {
					var optionsNext = {
						hostname: 'api.yelp.com',
						path: '/v3/businesses/'+ JSON.parse(currResults).businesses[0].id +'/reviews',
						headers: {
							authorization: "Bearer /*Yelp API Key here*/"
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
	}else {
		fs.readFile('public/index.html', (err, data) => {
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.end(data);
		});
	}
	
}).listen(4000);

//process.env.PORT
