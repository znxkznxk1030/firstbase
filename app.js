var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');

var session = require('express-session');
var db = require('./database/db');

var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');
var footprint = require('./routes/footprints');
var files = require('./routes/files');
var views = require('./routes/views');
var comments = require('./routes/comments');

var app = express();
var http = require('http');
var https = require('https');

var passport = require('./passport_auth/index');
var flash = require('connect-flash');
var config = require("./config");

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

app.all('/*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

// authentication
//app.use(session({ secret: config.secret, resave: true, saveUninitialized: false })); // 세션 활성화
app.use(passport.passport.initialize());
//app.use(passport.passport.session());
//app.use(flash());

app.use('/', index);
app.use('/users', users);
app.use('/footprint', footprint);
app.use('/files', files);
app.use('/views', views);
app.use('/comments', comments);

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

app.listen(52273, function(){});
console.log("start2 : " + config.port);
http.createServer(app).listen(config.port, function(){
  console.log('server running port : ' + config.port);
});


module.exports = app;
