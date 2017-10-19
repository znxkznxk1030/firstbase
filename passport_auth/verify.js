var connection = require('../database/db');

var verifyForm = function(data){
        if(verifyUsernameForm(data.username)){
        }

        if(verifyEmailForm(data.email)){

        }

        if(verifyPasswordForm(data.password1, data.password2)){

        }

        return true;
};

var verifyUsernameForm = function(username){

        console.log('#debug - verifyUsernameForm\nusername:' + username);
        if(!username){
                return false;
        }

        return true;
};

var verifyEmailForm = function(email){
        if(!email){
                return false;
        }
        return true;
};

var verifyPasswordForm = function(password1, password2){
    if(!password1){
        return false;
    }

    if(!password2){
        return false;
    }
    
    return true;
};

var findByUsername = function(username){
        return connection.query('SELECT user_id FROM user WHERE user_id=?', [username], function(err, result){
                if(err){
                        throw err;
                }

                var ret = JSON.parse(JSON.stringify(result));
                console.log('#debug - findByUsername\nret : ' + ret[0]);
                if(typeof ret[0] !== 'undefined'){
                        console.log('FIND USER : ' + ret[0]);
                        return ret[0].user_id;
                }else{
                        return null;
                }
        });
};


module.exports = {
    verifyForm : verifyForm
} 
