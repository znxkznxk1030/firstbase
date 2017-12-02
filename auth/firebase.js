var firebase = require('firebase');
var admin = require('firebase-admin');
const user = require('../controller/users');

var serviceAccount = require('./serviceAccount.json');
var async = require("async");
var signToken = require("./auth").signToken;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

var route = function (app) {

    app.post('/app/google-signup', function (req, res) {

        const data = req.body;

        if (typeof data.loginToken === 'undefined') {
            return res.status(400).json({
                code: -1,
                message: '소셜 로그인 토큰이 존재하지 않습니다.'
            });
        }

        if (typeof data.displayName === 'undefined') {
            return res.status(400).json({
                code: -1,
                message: '닉네임란이 존재하지 않습니다.'
            });
        }

        function isDisplayNameVaild(cb){
            return cb(user.isDisplayNameVaild(data.displayName, null));
        }

        if (typeof data.deviceToken === 'undefined') {
            return res.status(400).json({
                code: -1,
                message: '디바이스 토큰이 유효하지 않습니다.'
            });
        }

        isDisplayNameVaild(function(err){
            if(err){
                return res.status(400).json({
                    code: -1,
                    message: err
                });
            }else{
                const loginToken = data.loginToken
                    , displayName = xss(data.displayName)
                    , deviceToken = data.deviceToken;

                admin.auth().verifyIdToken(loginToken)
                    .then(function (decodedToken) {
                        decodedToken = JSON.parse(JSON.stringify(decodedToken));

                        const profile = {
                            id: decodedToken.email,
                            displayName: displayName,
                            provider: decodedToken.firebase.sign_in_provider
                        };
                        user.registrateSocialUser(profile, function (err, result) {
                            if (err) {
                                return res.status(400).json({code: -2, message: '소셜로그인 회원가입 오류'});
                            }
                            else {
                                const token = signToken(profile);

                                user.updateDeviceToken(profile.id, deviceToken);

                                return res.cookie('jwt', token).json({
                                    code: 1,
                                    message: '로그인 성공',
                                    accessToken: token,
                                    displayName: profile.displayName
                                });
                            }
                        });

                    })
                    .catch(function (err) {
                        return res.status(400).json({
                            code: -1,
                            message: '소셜 로그인 토큰이 유효하지 않습니다.'
                        });
                    });
            }
        });
    });

    app.post('/app/google-login', function (req, res) {


        const loginToken = req.body.loginToken
            , deviceToken = req.body.deviceToken;

        admin.auth().verifyIdToken(loginToken)
            .then(function (decodedToken) {

                decodedToken = JSON.parse(JSON.stringify(decodedToken));

                const profile = {
                    id: decodedToken.email,
                    displayName: decodedToken.name,
                    provider: decodedToken.firebase.sign_in_provider
                };

                user.findOne(profile.id, function (err, one) {

                    if (err) {
                        return res.status(400).json({code: -2, message: '소셜로그인 오류'});
                    }

                    if (one) {
                        if (one.provider === profile.provider) {
                            const token = signToken(profile);

                            user.updateDeviceToken(profile.id, deviceToken);

                            return res.cookie('jwt', token).json({
                                code: 1,
                                message: '로그인 성공',
                                isMember: true,
                                accessToken: token,
                                displayName: profile.displayName
                            });
                        } else {
                            return res.status(400).json({
                                code: -1,
                                message: '이미 가입된 유저입니다(Local)',
                                isMember: true,
                                displayName: one.displayName
                            });
                        }
                    } else {
                        res.status(200).json({
                            code: 1,
                            message: '회원가입 필요',
                            isMember: false
                        });
                    }
                });
            })
            .catch(function (err) {
                return res.status(400).json({
                    code: -1,
                    message: '소셜 로그인 토큰이 만료되었습니다'
                });
            });
    });

    app.get('/app/login/test', function (req, res) {
        admin.auth().verifyIdToken('eyJhbGciOiJSUzI1NiIsImtpZCI6ImUxNjNjMTUyOWYyZDVlZTQ0ZGE2YzZiNzI1M2RjYmVkMzlmMzRhNzUifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vZmlyc3RiYXNlLTdiN2M0IiwibmFtZSI6IuydtOyasOywrCIsInBpY3R1cmUiOiJodHRwczovL2xoNS5nb29nbGV1c2VyY29udGVudC5jb20vLVl6N3BOUFRFTk5RL0FBQUFBQUFBQUFJL0FBQUFBQUFBQUMwLzgtOWl6YnFmVWJjL3M5Ni1jL3Bob3RvLmpwZyIsImF1ZCI6ImZpcnN0YmFzZS03YjdjNCIsImF1dGhfdGltZSI6MTUxMjE5MTY5OCwidXNlcl9pZCI6IlNXZDd5c2J2ZXRka0Y2dFoweXdUTzF5TkE1QzMiLCJzdWIiOiJTV2Q3eXNidmV0ZGtGNnRaMHl3VE8xeU5BNUMzIiwiaWF0IjoxNTEyMTkxNjk5LCJleHAiOjE1MTIxOTUyOTksImVtYWlsIjoiZGxkbmNrczkzQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7Imdvb2dsZS5jb20iOlsiMTE4MTcwMjk2NjAwNDUyOTU2MDM4Il0sImVtYWlsIjpbImRsZG5ja3M5M0BnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJnb29nbGUuY29tIn19.cb5e06wa_6Raj1kOnPyiwROtOzcCgbXEhbsl6ds5VEl2s5Q23eKlO9RpjVgP-U-uVVX-xEWccuFnQqzfZbTdO7cwUA42DW87RbBoB-qLo6x_B3pJcQOPEGXVTJXEHyErdseEBC8yxHy2a-HQnPyuZ65Al30iDl84FMxH4OaNfdxxvwu2M_DBDINJHXW3jlsb2FBic0cGreZV4Ayj4Z0cQJ_VnQ7u4fAUFjPCdEEWCWHCTcTuHvt-W1GQrxbcfFGQV7SCTDGwugxyQSQNbDoRXMT1lCa3uK1Eg0LSdsogCxq3ojunhCNr3tCdcmyIwCG4orxJj6RThRY3cnc3gW5LMQ')
            .then(function (decodedToken) {
                console.log(decodedToken);
                return res.json(decodedToken);
            })
            .catch(function (err) {
                return res.json(err);
            });
    });
};

exports.route = route;