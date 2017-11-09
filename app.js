var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');

var fs = require('fs');

var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');
var footprint = require('./routes/footprints');
var files = require('./routes/files');
var views = require('./routes/views');
var comments = require('./routes/comments');
var traces = require('./routes/traces');
var chat = require('./routes/chat');
var eval = require('./routes/eval');
var follow = require('./routes/follow');
var version = require('./routes/version');

var app = express();
var config = require("./config");
var http = require('http');



var options = {
    host : config.host,
    key: fs.readFileSync('./server.key'),
    cert: fs.readFileSync('./server.crt'),
    agent: false
};
var https = require('https');

var passport = require('./auth/index');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname + '/node_modules'));

app.all('/*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

// authentication
app.use(passport.passport.initialize());


app.use('/', index);
app.use('/users', users);
app.use('/footprint', footprint);
app.use('/files', files);
app.use('/views', views);
app.use('/comments', comments);
app.use('/traces', traces);
app.use('/chat', chat);
app.use('/eval', eval);
app.use('/follow', follow);
app.use('/version', version);

//swagger
app.use('/swagger-ui', express.static(path.join('./node_modules/swagger-ui/dist')));
app.use('/v1/swagger.json', function (req, res) {
    res.json(require('./swagger.json'));
});

app.use('/swagger', function (req, res) {
    res.redirect('/swagger-ui?url=/v1/swagger.json');
});

passport.routes(app);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

console.log("start2 : " + config.port);

var server = http.createServer(app).listen(config.port, function () {
    console.log('server running port : ' + config.port);
});

require('./socketio').startSocketIO(server);

server = https.createServer(options, app).listen(config.ssl, function(err){
    if(err) throw err;

    console.log('https server running port : ' + config.ssl);
});

require('./teamMap').startSocketIO(server);

module.exports = app;
