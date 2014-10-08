var express = require("express"),
    app = express(),
    bodyParser = require('body-parser'),
    errorHandler = require('errorhandler'),
    methodOverride = require('method-override'),
    port = parseInt(process.env.PORT, 10) || 3000,
    server = require('http').createServer(app);
    server.listen(port);
	
	/*for https*/
	var https = require('https');
	fs = require('fs');
	var options = {
	  key: fs.readFileSync('key.pem'),
	  cert: fs.readFileSync('key-cert.pem')
	};

	var secureserver = https.createServer(options,app);
	secureserver.listen(3030);

	// Force SSL - this is also necessary on heroku
	app.get('*',function(req,res,next){
	  // This checks on heroku - because the proxy forward can't just check normal request object
	  if(!req.connection.encrypted && req.headers['x-forwarded-proto'] != 'https') {
	      var url =  (req.headers.host.indexOf("localhost") > -1) ? 'localhost:3030' : req.headers.host;
	      res.redirect('https://' + url + req.url);
	  }
	  else{
	      next(); /* Continue to other routes if we're not redirecting */
	  }
	});

	app.get("/", function (req, res) {
	  res.redirect("/index.html");
	});

	app.use(methodOverride());
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({
	  extended: true
	}));
	app.use(express.static(__dirname + '/public'));
	app.use(errorHandler({
	  dumpExceptions: true,
	  showStack: true
	}));

	console.log("Simple static server listening at https://localhost:" + 3030);
