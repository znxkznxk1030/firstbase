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
    var token = req.cookies.jwt;

    /**
     * verify token
     */
    if(!token)
    {
        return res.status(401)
            .json({code: -2,
                message: 'not logged in'});
    }else
    {
        jwt.verify(req.cookies.jwt, SECRET, function(err, decoded){
            if(err) {
                return res.status(401)
                    .json({code: -2,
                        message:'token is wrong'});
            }

            req.user = decoded;
            next();
        });
    }
};

var passMiddleware = function passMiddleware(req, res, next){
    var token = req.cookies.jwt;

    if(!token)
    {
        jwt.verify(token, SECRET, function(err, decoded){
            if(err) return next();

            if(decoded)
                req.user = decoded;
            return next();
        });
    }else
    {
        return next();
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
    res.clearCookie('jwt').send(req.cookies.jwt);
};

exports.signToken = signToken;
exports.isAuthenticated = isAuthenticated;
exports.testAuthenticated = testAuthenticated;
exports.authMiddleware = authMiddleware;
exports.clearCookieClear = clearCookieClear;
exports.passMiddleware = passMiddleware;