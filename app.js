/**
 * Basic express server
 *
 */
var express = require('express');
var http = require('http');
var path = require('path');
var app = express();
var exec = require('child_process').exec;

app.use(express.logger('dev'));
var root = path.join(__dirname);
app.use(express.methodOverride())
  .use(express.cookieParser())
  .use(express.session({ secret: 'my!blog'}))
  .use(express.static(root))
  .use(express.directory(root));

var server = http.createServer(app).listen(9527, function(){
  console.log('server listening at 9527');
  exec('open http://localhost:9527');
})

app.get('/notice', function(req, res, next) {
  res.json({});
})
