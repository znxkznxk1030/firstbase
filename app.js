var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');

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

var app = express();
var http = require('http');
var https = require('https');

var passport = require('./passport_auth/index');
var flash = require('connect-flash');
var config = require("./config");
var jwt = require("jsonwebtoken");

var SECRET = config.token_secret;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname + '/node_modules'));

app.all('/*', function(req, res, next) {
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

//swagger
app.use('/swagger-ui', express.static(path.join('./node_modules/swagger-ui/dist')));
app.use('/v1/swagger.json', function(req, res) {
    res.json(require('./swagger.json'));
});

app.use('/swagger', function(req, res){
  res.redirect('/swagger-ui?url=/v1/swagger.json');
});

passport.routes(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

console.log("start2 : " + config.port);

var server = http.createServer(app).listen(config.port, function(){
    console.log('server running port : ' + config.port);
});

var io = require('socket.io')(server);


/**
 * chat (socket.io)
 */
io.on('connection', function(socket){

    socket.on('login', function(data){
        //console.log('Client logged-in\n name : ' + data.id + '\n userid: ' + data.displayName);
        socket.id = data.id;
        socket.displayName = data.displayName;

        io.emit('login', data.displayName);

    });

    socket.on('login-android', function(token){

        console.log('token : ' + token);

        if(!token)
        {
            jwt.verify(token, SECRET, function(err, decoded){
                //if(err) socket.);


                socket.id = decoded.id;
                socket.displayName = decoded.displayName;

                console.log('Client logged-in\n name : ' + socket.id + '\n userid: ' + socket.displayName);

                //
            });
        }else
        {
           //
        }
    });

    socket.on('chat', function(data){

        console.log(data);

        var msg = {
          from : {
            id : socket.id,
            displayName : socket.displayName
          },
            msg : data.msg
        };

        console.log('Message from %s: %s', socket.displayName, msg);

        io.emit('chat', msg);
    });

});

module.exports = app;
