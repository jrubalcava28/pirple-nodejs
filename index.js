/*
*
* Primary file for the API
*
*/

// Dependencies
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder
var config = require('./config');
var fs = require('fs');


// Instantiate the http server
var httpServer = http.createServer(function(req,res){
  unifiedServer(req,res);
});


// Start the server and have it listen on port 3000
httpServer.listen(config.httpPort,function(){
  console.log("The server is listening on port "+config.httpPort);
});

//Instantiate the https Server
var httpsServerOptions = {
  'key': fs.readFileSync('https/key.pem'),
  'cert': fs.readFileSync('https/cert.pem')
};
var httpsServer = https.createServer(httpsServerOptions,function(req,res){
  unifiedServer(req,res);
});

// Start the https server
httpsServer.listen(config.httpsPort,function(){
  console.log("The server is listening on port "+config.httpsPort);
});

// All the server logic for both the http and https Server
var unifiedServer = function(req,res){


    // Get the URL and Parse interval
    var parsedUrl = url.parse(req.url, true);

    // Get the Path
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g,'');

    // get the query string as an object

    var queryStringObject = parsedUrl.query;

    //Get te http method
    var method = req.method.toLowerCase();

    // Get the headers as an object
    var headers = req.headers;


    // Get the payloads, if any
    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data',function(data){
      buffer += decoder.write(data);
    });
    req.on('end',function(){
      buffer += decoder.end();

      // Choose the handler this request should go to, If one is not found use notFound handlers

      var chooseHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

      // Construct data object to sent to handlers
      var data = {
        'trimmedPath' : trimmedPath,
        'queryStringObject': queryStringObject,
        'method' : method,
        'headers': headers,
        'payload': buffer
      };

      //Route the equest to the handler specified in the router
      chooseHandler(data,function(statusCode, payload){
        // use the status code called back by the handler or default to 200
        statusCode = typeof(statusCode) == 'number' ? statusCode: 200;
        // User the payload called by the handler, or default an emply object
        payload = typeof(payload) == 'object' ? payload : {};

        // convert the payload to a string_decoder
        var payloadString = JSON.stringify(payload);

        // return the response
        res.setHeader('Content-Type','application/json');
        res.writeHead(statusCode);
        res.end(payloadString);

        // Log the request path
        console.log('Return this response ',statusCode,payloadString);
      });
    });
}

// Define handlers
var handlers = {};

// Ping Handlers

handlers.ping = function(data,callback) {
  callback(200);

};

// Hello Handlers
handlers.hello = function(data,callback) {
  callback(200,{message:'no NPM course'});

};

// Not Found handlers
handlers.notFound = function(data,callback){
  callback(404);
};

// Defina a request router
var router = {
  'ping' : handlers.ping,
  'hello' : handlers.hello
};
