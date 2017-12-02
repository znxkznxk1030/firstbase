var firebase = require('firebase');
var admin = require('firebase-admin');
const user = require('../controller/users');

var serviceAccount = require('./serviceAccount.json');
var async = require("async");
var signToken = require("./auth").signToken;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

var route = function(app){

    app.post('/app/google-login', function(req, res){


        const loginToken = req.body.loginToken;
        console.log(loginToken);

        admin.auth().verifyIdToken(loginToken)
            .then(function(decodedToken){
                console.log(decodedToken);

                decodedToken = JSON.parse(JSON.stringify(decodedToken));

                const profile = {
                    id : decodedToken.email,
                    displayName : decodedToken.name,
                    provider : decodedToken.firebase.sign_in_provider
                };

                console.log(profile);

                const task = [
                    function(cb){
                        user.findOne(profile, function (err, one) {
                            if (one) {

                                one = JSON.parse(JSON.stringify(one))[0];

                                if(one.provider === 'google.com'){
                                    return cb(true);
                                }else{
                                    return cb('이미 가입한 아이디 입니다.');
                                }
                            } else {
                                return cb();
                            }
                        });
                    },
                    function(cb){
                        user.registrateSocialUser(profile, function (err, result) {
                            if (err) return cb('소셜로그인 회원가입 오류');
                            //console.log("debug passport social user registration : " + result);
                            return cb();
                        });
                    }
                ];

                async.series(task, function(err){
                    if(err && err !== true){
                        console.log(err);
                        res.status(400).json({
                            code : -1,
                            message : err
                        });
                    }else{
                        const token = signToken(profile);

                        res.cookie('jwt', token).json({
                            code: 1,
                            message: 'success to login',
                            accessToken: token,
                            displayName: profile.displayName
                        });
                    }
                });
            })
            .catch(function(err){
                return res.status(400).json({
                    code : -1,
                    message : '소셜 로그인 토큰이 만료되었습니다'
                });
            });
    });

    app.get('/app/login/test', function(req, res){
        admin.auth().verifyIdToken('eyJhbGciOiJSUzI1NiIsImtpZCI6ImUxNjNjMTUyOWYyZDVlZTQ0ZGE2YzZiNzI1M2RjYmVkMzlmMzRhNzUifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vZmlyc3RiYXNlLTdiN2M0IiwibmFtZSI6IuydtOyasOywrCIsInBpY3R1cmUiOiJodHRwczovL2xoNS5nb29nbGV1c2VyY29udGVudC5jb20vLVl6N3BOUFRFTk5RL0FBQUFBQUFBQUFJL0FBQUFBQUFBQUMwLzgtOWl6YnFmVWJjL3M5Ni1jL3Bob3RvLmpwZyIsImF1ZCI6ImZpcnN0YmFzZS03YjdjNCIsImF1dGhfdGltZSI6MTUxMjE5MTY5OCwidXNlcl9pZCI6IlNXZDd5c2J2ZXRka0Y2dFoweXdUTzF5TkE1QzMiLCJzdWIiOiJTV2Q3eXNidmV0ZGtGNnRaMHl3VE8xeU5BNUMzIiwiaWF0IjoxNTEyMTkxNjk5LCJleHAiOjE1MTIxOTUyOTksImVtYWlsIjoiZGxkbmNrczkzQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7Imdvb2dsZS5jb20iOlsiMTE4MTcwMjk2NjAwNDUyOTU2MDM4Il0sImVtYWlsIjpbImRsZG5ja3M5M0BnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJnb29nbGUuY29tIn19.cb5e06wa_6Raj1kOnPyiwROtOzcCgbXEhbsl6ds5VEl2s5Q23eKlO9RpjVgP-U-uVVX-xEWccuFnQqzfZbTdO7cwUA42DW87RbBoB-qLo6x_B3pJcQOPEGXVTJXEHyErdseEBC8yxHy2a-HQnPyuZ65Al30iDl84FMxH4OaNfdxxvwu2M_DBDINJHXW3jlsb2FBic0cGreZV4Ayj4Z0cQJ_VnQ7u4fAUFjPCdEEWCWHCTcTuHvt-W1GQrxbcfFGQV7SCTDGwugxyQSQNbDoRXMT1lCa3uK1Eg0LSdsogCxq3ojunhCNr3tCdcmyIwCG4orxJj6RThRY3cnc3gW5LMQ')
            .then(function(decodedToken){
                console.log(decodedToken);
                return res.json(decodedToken);
            })
            .catch(function(err){
                return res.json(err);
            });
    });
};

exports.route = route;