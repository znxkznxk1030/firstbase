var crypto = require('crypto'), //node.js has 'crpyto' already.
    scmp = require('scmp'),
    config = require('../config');

const Buffer = require('safe-buffer').Buffer;

var passwordCreate = function passwordCreate(password, cb){
        crypto.randomBytes(config.crypto.randomSize,
            function(err, salt){
                if(err) return cb(err, null);

                crypto.pbkdf2(password, config.salt.toString('base64'),
                        config.crypto.workFactor, config.crypto.keylen,
                    function(err, key){
                            cb(null, key.toString('base64'));
                        });

        });
};

var passwordCheck = function passwordCheck(password, derivedPassword, cb){

        crypto.pbkdf2(password, config.salt.toString('base64'), config.crypto.workFactor, config.crypto.keylen,
                function(err, key){
                    // console.log(key.toString('base64'));
                    // console.log(derivedPassword);
                    // const bPassword = Buffer.from(key.toString('base64'), 'hex');
                    // const bDerivedPassword = Buffer.from(derivedPassword, 'hex');
                    // console.log(bDerivedPassword, bPassword);
                        cb(null, key.toString('base64') === derivedPassword);
                });
};

exports.passwordCreate = passwordCreate;
exports.passwordCheck = passwordCheck;
