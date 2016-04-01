//server
////
// CONFIGURATION SETTINGS
///
//PORT sur lequel on ecoute 
var PORT = 4000;
//interval entre chaque refresh de data
var INTERVAL = 5000;
//afficher propremement le JSON
var PRETTY_PRINT_JSON = false;

///
// START OF APPLICATION
///
var express = require('express');
var http = require('http');
var io = require('socket.io');

var app = express();
var server = http.createServer(app);
var io = io.listen(server);
io.set('log level', 1);

server.listen(PORT);

//creation de la route "/" vers index.html 
// app.get('/', function(req, res) {
// 	res.sendfile(__dirname + '/index.html');
// });
//creation de la route "/" vers index_stream.html 
app.get('/stream', function(req, res) {
	res.sendfile(__dirname + '/index_stream.html');
});

io.sockets.on('connection', function(socket) {
	socket.on('ticker', function(ticker) {
		track_ticker(socket, ticker);
	});
});

function track_ticker(socket, ticker) {

	console.log("Appliction START!!!");
	//Run the first time immediately
	get_quote(socket, ticker);

	//Every N seconds
	var timer = setInterval(function() {
		//get data every N second
		get_quote(socket, ticker)
	}, INTERVAL);

	socket.on('disconnect', function() {
		clearInterval(timer);
	});
}

function get_quote(p_socket, p_ticker) {

	http.get({

			//URL to access to data  
			host: 'www.google.com',
			port: 80,
			//p_ticker -> symbol of the company
			path: '/finance/info?client=ig&q=' + p_ticker
		},
		function(response) {
			//encode the response utf8
			response.setEncoding('utf8');
			var data = "";

			response.on('data', function(chunk) {
				data += chunk;
			});

			response.on('end', function() {
				if (data.length > 0) {
					try {
						var data_object = JSON.parse(data.substring(3));
					} catch (e) {
						return;
					}
					//put the data in the list 					
					var quote = {};
					quote.ticker = data_object[0].t;
					quote.exchange = data_object[0].e;
					quote.price = data_object[0].l_cur;
					quote.change = data_object[0].c;
					quote.change_percent = data_object[0].cp;
					quote.last_trade_time = data_object[0].lt;
					quote.dividend = data_object[0].div;
					quote.yield = data_object[0].yld;

					//emit the data to client side using socket 
					p_socket.emit('send_quote_client', PRETTY_PRINT_JSON ? JSON.stringify(quote, true, '\t') : JSON.stringify(quote));

					//server side 
					console.log("the price of the " + quote.ticker + " quote: " + quote.price + " USD");
				}
			});
		});
}


