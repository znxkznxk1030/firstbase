var connection = require('../database/db');

var nicknameCheck = function(req, res){

    var nickName = req.param.nickName;
    var sql = "SELECT * FROM user WHERE user.displayName = ?";
    connection.query(sql, [nickName], function(err, profile){
        if (err) throw err;

        if(profile.displayName){
            res.json({code:1, message : "this name is already existed!"});
        }else{
            res.json({code:0, message : "possible to use"});
        }

    })
};

exports.nicknameCheck = nicknameCheck;