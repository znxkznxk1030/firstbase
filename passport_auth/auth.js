var jwt = require('jsonwebtoken');
var compose = require('composable-middleware');
var config = require('../config');
var SECRET = config.token_secret;
var EXPIRES = 60*60*24;

var signToken = function signToken(user){
    return jwt.sign(user, SECRET, { expiresIn: EXPIRES});
};

var isAuthenticated = function isAuthenticated(){
    return compose().use(function(req, res, next){
        console.log('#debug isAuthenticated : ' + req.cookies.jwt);
            var decoded = jwt.verify(req.cookies.jwt, SECRET);
            console.log(decoded);
            req.user = decoded;
        }).use(function(req, res, next){
            req.user = {
                id: req.user.id,
                displayName : req.user.displayName,
                provider: req.user.provider,
                created_date: req.user.created_date,
                modified_date: req.user.modified_date
            };
            next();
        });
};

var authMiddleware = function authMiddleware(req, res, next){
    var token = req.cookies.jwt || req.query.jwt;
    console.log(req.cookies.jwt);
    if(!token){
        return res.json({message: 'not logged in'});
    }
    else{
        jwt.verify(req.cookies.jwt, SECRET, function(err, decoded){
            if(err) return res.json({message:'token is wrong'});

            console.log(decoded);
            req.user = decoded;
            next();
        });
    }
};

var testAuthenticated = function(req, res){
    var token = req.cookies.jwt || req.query.jwt;
    console.log('#debug testAuthenticated : ' + token);
    var decoded = jwt.verify(token, SECRET);
    console.log(decoded);
    req.user = decoded;
    res.json(decoded);
};

var clearCookieClear = function(req, res){
    res.clearCookie('jws').send(req.cookies.jws);
};


exports.signToken = signToken;
exports.isAuthenticated = isAuthenticated;
exports.testAuthenticated = testAuthenticated;
exports.authMiddleware = authMiddleware;
exports.clearCookieClear = clearCookieClear;