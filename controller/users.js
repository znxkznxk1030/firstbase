const connection = require('../database/db');
const async = require('async');
const getImageUrl = require("./files").getImageUrl;
const profileDefaultKey = 'profiledefault.png';
const _ = require('underscore');
var passwordUtil = require("../auth/password");
var xss = require("xss");
var util = require("../utils/util");
var User = require("../database/user").User;
var signToken = require("../auth/auth").signToken;
var uploadUserImage = require("./files").uploadUserImage;

// language=JSRegexp
const acceptTokenRe = /[^a-zA-Zㄱ-ㅎㅏ-ㅣ가-힣0-9]/g,
    acceptIdRe = /[^a-zA-Z0-9]/g;

const MSG_REGISTRATE_ERROR = '회원가입 오류';


var nicknameCheck = function (req, res) {

    const nickName = req.param.nickName;
    const sql = "SELECT * FROM user WHERE user.displayName = ?";

    //todo: validate nickName
    if (!nickName) {
        return res.status(200)
            .json({
                code: -1,
                isPossible: -1,
                message: "nickName should be not null"
            });
    }


    connection.query(sql, [nickName],
        function (err, profile) {
            if (err) return res.status(400)
                .json({
                    code: -1,
                    message: err
                });

            if (profile.displayName) {
                return res.status(200)
                    .json({
                        code: 1,
                        isPossible: -1,
                        message: 'this name is already existed!'
                    });
            } else {
                return res.status(200)
                    .json({
                        code: 1,
                        isPossible: 1,
                        message: 'possible to use'
                    });
            }
        })
};

var isExistDisplayName = function (displayName, cb) {
    const sqlIsExistDisplayName = "SELECT * FROM user WHERE displayName = ?";

    connection.query(sqlIsExistDisplayName, displayName, function (err, result) {
        if (err || result.length > 0) return cb('이미 존재하는 닉네임 입니다.');
        else {
            return cb();
        }
    });
};


/*
    find operations
 */
var findOne = function findOne(id, cb) {
    var sql = 'SELECT * FROM user WHERE id = ?';
    connection.query(sql, [id], function (err, result) {
        if (err) {
            return cb('해당 유저가 존재하지 않습니다.');
        }

        var user = JSON.parse(JSON.stringify(result))[0];
        console.log(user);
        return cb(null, user);
    });
};

var findOneWithProvider = function findOne(profile, cb) {
    var sql = 'SELECT * FROM user WHERE id = ? AND provider = ?';
    connection.query(sql, [profile.id, profile.provider], function (err, result) {
        if (err) {
            return cb('해당 유저가 존재하지 않습니다.');
        }

        var user = JSON.parse(JSON.stringify(result))[0];
        console.log(user);
        return cb(null, user);
    });
};

var updateDeviceToken = function (id, deviceToken) {
    var sql = 'UPDATE user SET device_token = ? WHERE id = ?';

    connection.query(sql, [id, deviceToken], function (err, result) {
        if (err) return false;
        else return true;
    });
};

var findPassword = function findPassword(id, cb) {
    connection.query('SELECT * FROM password WHERE id=?', [id], function (err, result) {
        if (err) throw err;

        var ret = JSON.parse(JSON.stringify(result));
        console.log(ret);
        if (typeof ret[0] !== 'undefined') {
            cb(null, ret[0].password);
        } else {
            cb({error: "not found"}, false);
        }
    });
};


/*
    retrieve operations
 */
var getUserInfoByReqHeader = function (req, res) {

    const sql = "SELECT * " +
        "FROM user " +
        "WHERE user.id = ? ";

    const sqlGetFollowerCount =
        "SELECT count(*) AS countFollower FROM follow WHERE follow.target_id = ? ";

    const sqlGetFollowingCount =
        "SELECT count(*) AS countFollowing FROM follow WHERE follow.follower_id = ? ";

    const task = [
        function (cb) {
            //console.log("dd" + req.user.id);
            if (req.user) cb(null, req.user);
            else cb({code: -1, message: 'Not Authenticated'}, null);
        },
        function (user, cb) {
            //console.log(user);
            connection.query(sql, user.id, function (err, profile) {
                if (err) return cb({code: -1, message: 'sql error'}, null);

                return cb(null, profile);
            });
        },
        function (profile, cb) {
            var profileUrl, profileKey = JSON.parse(JSON.stringify(profile))[0].profile_key;
            //console.log(profileKey);
            if (profileKey) profileUrl = getImageUrl(profileKey);
            else profileUrl = getImageUrl(profileDefaultKey);

            return cb(null, _.extend(JSON.parse(JSON.stringify(profile))[0], {profileUrl: profileUrl}));
        },
        function (profile, cb) {
            console.log(profile.id);
            connection.query(sqlGetFollowerCount, [profile.id], function (err, countFollower) {
                if (err) return cb({code: -1, message: err}, null);
                return cb(null, _.extend(profile, JSON.parse(JSON.stringify(countFollower[0]))));
            });
        },
        function (profile, cb) {
            connection.query(sqlGetFollowingCount, [profile.id], function (err, countFollowing) {
                if (err) return cb({code: -1, message: err}, null);
                return cb(null, _.extend(profile, JSON.parse(JSON.stringify(countFollowing[0]))));
            });
        }
    ];

    async.waterfall(task,
        function (err, profile) {
            if (err) return res.status(400)
                .json({
                    code: -1,
                    message: err
                });
            else {
                delete profile.id;

                return res.status(200)
                    .json(_.extend(profile, {isFollow: false}));
            }
        });
};

var getUserInfoByUserDisplayName = function (req, res) {
    if(req.query.displayName.isNullOrUndefined){
        return res.status(400).json(util.message(-1, '닉네임 파라미터 오류'));
    }

    User({
        user: req.user,
        displayName: req.query.displayName
    }).getUserInfoByUserDisplayName(function (err, result) {
        if (err) return res.status(400).json(util.message(-1, err));
        else {
            delete result.id;
            return res.status(200).json(result);
        }
    });
};

var getUserInfoByUserId = function (req, res) {

    const sql = "SELECT * " +
        "FROM user " +
        "WHERE user.id = ? ";

    const sqlGetFollowerCount =
        "SELECT count(*) AS countFollower FROM follow WHERE follow.target_id = ? ";

    const sqlGetFollowingCount =
        "SELECT count(*) AS countFollowing FROM follow WHERE follow.follower_id = ? ";

    const id = req.query.id;

    const task = [
        function (cb) {
            //console.log("dd" + req.user.id);
            if (!id.isNullOrUndefined) return cb(null, id);
            else return cb({code: -1, message: 'Not Authenticated'}, null);
        },
        function (id, cb) {
            connection.query(sql, id, function (err, profile) {
                if (err) return cb({code: -1, message: 'sql error'}, null);

                return cb(null, profile);
            });
        },
        function (profile, cb) {
            var profileUrl, profileKey = JSON.parse(JSON.stringify(profile))[0].profile_key;
            //console.log(profileKey);
            if (profileKey) profileUrl = getImageUrl(profileKey);
            else profileUrl = getImageUrl(profileDefaultKey);

            return cb(null, _.extend(JSON.parse(JSON.stringify(profile))[0], {profileUrl: profileUrl}));
        },
        function (profile, cb) {
            console.log(profile.id);
            connection.query(sqlGetFollowerCount, [profile.id], function (err, countFollower) {
                if (err) return cb({code: -1, message: err}, null);
                return cb(null, _.extend(profile, JSON.parse(JSON.stringify(countFollower[0]))));
            });
        },
        function (profile, cb) {
            connection.query(sqlGetFollowingCount, [profile.id], function (err, countFollowing) {
                if (err) return cb({code: -1, message: err}, null);
                return cb(null, _.extend(profile, JSON.parse(JSON.stringify(countFollowing[0]))));
            });
        }
    ];

    async.waterfall(task,
        function (err, profile) {
            if (err) return res.status(400)
                .json({
                    code: -1,
                    message: err
                });
            else {
                delete profile.id;

                return res.status(200)
                    .json(profile);
            }
        });
};

/*
    update operations
 */
var updateUserInfo = function (req, res) {
    const sql = "UPDATE user SET displayName = ?, description = ? WHERE user.id = ? ";
    const body = req.body;

    const user = req.user;

    const displayName = body.displayName;
    var description = body.description;

    var task = [
        function (cb) {
            connection.query(sql, [displayName, description, user.id],
                function (err, userUpdated) {
                    if (err) return cb('유저 정보 수정 실패');
                    else {
                        userUpdated = JSON.parse(JSON.stringify(userUpdated));
                        return cb(null, userUpdated);
                    }
                });
        }
    ];

    async.series(task, function (err, userUpdated) {
        if (err)
            return res.status(400)
                .json({
                    code: -1,
                    message: err
                });

        else {
            console.log(userUpdated);

            var profile = {
                id: user.id,
                displayName: displayName,
                provider: user.provider
            };
            const token = signToken(profile);

            return res.cookie('jwt', token).json({
                code: 1,
                message: '로그인 성공',
                accessToken: token,
                displayName: profile.displayName
            });
        }
    });
};

var updateUserImage = function (req, res) {
    const sql = "UPDATE user SET profile_key = ? WHERE user.id = ? ";

    uploadUserImage(req, function (err, profileImage) {
        if (err) res.json(err);
        connection.query(sql, [profileImage.key, req.user.id],
            function (err, userUpdated) {
                if (err) return res.status(400)
                    .json({
                        code: -1,
                        message: '프로필 업데이트 오류'
                    });

                if (userUpdated) {
                    return res.status(200)
                        .json({
                            code: 1,
                            profileUrl: profileImage.url
                        });
                } else {
                    return res.status(400)
                        .json({
                            code: -1,
                            message: 'update error'
                        });
                }
            });
    });
};


/*
    registration operations
 */
var registrateSocialUser = function registrateSocialLoginUser(data, cb) {
    var sql = 'INSERT INTO user (id, displayName, provider) VALUES (?, ?, ?)';
    connection.query(sql, [data.id, data.displayName, data.provider], function (err, result) {
        if (err) {
            console.log(err);
            return cb(true);
        }
        console.log('#debug registrateSocialUser result : ' + result);
        cb(null, true);
    });
};

/**
 *
 * @param formData
 * @param callback
 */
var registrateUser = function registrateUser(req, res) {
    // todo: refactoring
    // callback hell -> async heaven

    const id = req.body.id,
        displayName = req.body.displayName,
        provider = 'Local',
        password1 = req.body.password1;

    const sqlIsExistId = "SELECT * FROM user WHERE id = ?"
        , sqlIsExistDisplayName = "SELECT * FROM user WHERE displayName = ?"
        , sqlCreateUser = "INSERT INTO user (id, displayName, provider) VALUES (?, ?, ?)"
        , sqlCreatePassword = "INSERT INTO password (id, password) VALUES (?, ?)"
        , sqlDeleteUser = "DELETE FROM user WHERE id = ?";

    var task = [
        function (cb) {
            connection.query(sqlIsExistId, id, function (err, user) {
                if (err) {
                    return cb(MSG_REGISTRATE_ERROR);
                } else {
                    user = JSON.parse(JSON.stringify(user))[0];

                    if (user) {
                        return cb('이미 존재하는 아이디 입니다.');
                    }
                    return cb(null);
                }
            });
        },
        function (cb) {
            connection.query(sqlIsExistDisplayName, displayName, function (err, user) {
                if (err) {
                    return cb(MSG_REGISTRATE_ERROR);
                } else {
                    user = JSON.parse(JSON.stringify(user))[0];

                    if (user) {
                        return cb('이미 존재하는 닉네임 입니다.');
                    }
                    return cb(null);
                }
            });
        },
        function (cb) {
            connection.query(sqlCreateUser, [id, displayName, provider], function (err, user) {
                if (err) {
                    return cb(MSG_REGISTRATE_ERROR);
                } else {
                    return cb(null);
                }
            });
        },
        function (cb) {
            passwordUtil.passwordCreate(password1, function (err, password) {
                if (err) return cb(MSG_REGISTRATE_ERROR);

                connection.query(sqlCreatePassword, [id, password], function (err, password) {
                    if (err) {
                        return cb(MSG_REGISTRATE_ERROR);
                    } else {
                        return cb(null);
                    }
                });
            });
        }
    ];

    async.series(task, function (err, result) {
        if (err) {
            return res.status(401).json({
                code: -1,
                message: err
            });
        }
        else {
            return res.status(200).json({
                code: 1,
                message: "퍼스트베이스에 오신걸 환영합니다! \n 회원가입 성공"
            });
        }
    });


};


/*
    verify form operations
 */


/*
            Check DisplayName's validation.
            1. length (5 < && < 25)
         */

var isDisplayNameVaild = function (displayName, oldDisplayName, cb) {

    // console.log(displayName, oldDisplayName);
    // console.log(typeof displayName, typeof oldDisplayName);

    if (typeof oldDisplayName !== 'undefined' && displayName === oldDisplayName) {
        // console.log(displayName, oldDisplayName);
        return cb(null);
    }

    if (acceptTokenRe.test(displayName)) {
        return cb('닉네임은 한글,영문,숫자만 가능합니다');
    }

    //todo: 띄어쓰기 방지, 영문, 숫자
    if (displayName === null || displayName === '' || displayName === 'undefined')
        return cb('닉네임 입력 칸이 비어있습니다.');

    const length = displayName.length;

    if (length < 2)
        return cb('닉네임의 길이가 너무 짧습니다.');
    if (length > 10)
        return cb('닉네임의 길이가 너무 깁니다.');

    const sqlDisplayCheck = "SELECT * FROM user WHERE displayName = ? ";

    connection.query(sqlDisplayCheck, [displayName], function (err, result) {
        if (err) return cb('에러 났습니다');

        if (result.length > 0) {
            return cb('이미 존재하는 닉네임입니다');
        } else {
            return cb(null);
        }
    });
};

/*
            Check ID is valid.

            1. Check id form is not blank.
            2. Check length of id is between 8 and 20.
            3. Check id has a valid email domain.
            4. Check id is unique.
         */
var isIDVaild = function (id) {
    if (id === null || id === 'undefined' || id === '')
        return 'ID 입력 칸이 비어있습니다';

    const length = id.length;
    const userIdSplitByDomain = id.split('@');
    const ACCEPTED_DOMAIN = [
        'naver.com',
        'gmail.com',
        'daum.net',
        'hanmail.net',
        'paran.com'
    ];

    if (length < 8)
        return 'ID의 길이가 너무 짧습니다.';
    if (length > 25)
        return 'ID의 길이가 너무 깁니다.';

    console.log(userIdSplitByDomain);

    if (userIdSplitByDomain.length !== 2)
        return 'ID의 형식은 e-mail 형식이여야 합니다.';

    var emailId = userIdSplitByDomain[0],
        domain = userIdSplitByDomain[1];

    var hasAcceptedDomain = false;

    // console.log(emailId);
    // if(acceptIdRe.test(emailId) === false){
    //     return 'id 에는 영문, 숫자만 가능합니다.';
    // }

    domain = domain.trim();


    ACCEPTED_DOMAIN.forEach(function (acceptedDomain) {
        if (acceptedDomain === domain)
            hasAcceptedDomain = true;
    });

    if (hasAcceptedDomain === false)
        return '사용가능한 도메인을 사용해주세요.(gmail, naver, daum)';


    const sqlIsExisted =
        "SELECT * FROM user WHERE id = ?";

    connection.query(sqlIsExisted, [id],
        function (err, user) {
            if (err)
                return err;
            console.log(user);
            if (user[0])
                return '존재하는 아이디 입니다.';

            else return null;
        });
};

/*
            Password Safety Term.
            1. Check two password is same
            2. Check password' length is between 8 and 20
            3. Check password has more than 3 digits, special char, char
*/
var isPasswordVaild = function (password1, password2) {
    if (password1 !== password2)
        return '두 패스워드 값이 일치하지 않습니다.';

    const length = password1.length;
    console.log(length);

    if (length < 8)
        return '패스워드의 길이가 너무 짧습니다.';

    if (length > 20)
        return '패스워드의 길이가 너무 깁니다.';

    var numOfDigit = 0,
        numOfSpecial = 0,
        numOfChar = 0,
        unVaildChar = false;

    for (var i = 0; i < password1.length; i++) {
        var code = password1.charCodeAt(i);

        console.log(code);

        if (33 <= code && code <= 47)
            numOfSpecial++;
        else if (58 <= code && code <= 64)
            numOfSpecial++;
        else if (91 <= code && code <= 96)
            numOfSpecial++;
        else if (48 <= code && code <= 57)
            numOfDigit++;
        else if (65 <= code && code <= 122)
            numOfChar++;
        else unVaildChar = true;
    }

    console.log("special : " + numOfSpecial);
    console.log("char : " + numOfChar);
    console.log("digit : " + numOfDigit);

    if (unVaildChar)
        return '입력된 패스워드 값에 인식되지 않는 값이 있습니다.';

    if (numOfDigit < 3)
        return '패스워드는 3개 이상의 숫자를 포함하여야 합니다.';

    if (numOfSpecial < 0)
        return '패스워드는 0개 이상의 특수문자를 포함하여야 합니다.';

    if (numOfChar < 3)
        return '패스워드는 3개 이상의 문자를 포함하여야 합니다.';


    return null;


};

var isUpdateFormVaild = function (req, res, next) {
    const displayName = xss(req.body.displayName),
        description = xss(req.body.description);

    if (description.length > 1000) {
        return res.status(401)
            .json({
                code: -2,
                message: '소개글 최대 길이초과 (최대 1000byte)'
            });
    }

    const task = [
        function (cb) {
            isDisplayNameVaild(displayName, req.user.displayName, function (err) {
                if (err) return cb(err);
                else return cb();
            })
        }
    ];

    async.series(task, function (err, result) {
        if (err)
            return res.status(401)
                .json({
                    code: -2,
                    message: err
                });
        else return next();
    });
};


var isFormVaild = function (req, res, next) {
    const id = xss(req.body.id),
        displayName = xss(req.body.displayName),
        description = xss(req.body.description),
        password1 = xss(req.body.password1),
        password2 = xss(req.body.password2);

    console.log(id + password1 + password2);

    if (description.length > 1000) {
        return res.status(401)
            .json({
                code: -2,
                message: '소개글 최대 길이초과 (최대 1000byte)'
            });
    }

    const task = [
        function (cb) {
            isDisplayNameVaild(displayName, null, function (err) {
                if (err) return cb(err);
                else cb();
            })
        },
        function (cb) {
            return cb(isIDVaild(id));
        },
        function (cb) {
            return cb(isPasswordVaild(password1, password2));
        }
    ];

    async.series(task, function (err, result) {
        if (err)
            return res.status(401)
                .json({
                    code: -2,
                    message: err
                });
        else return next();
    });
};


module.exports = {
    nicknameCheck: nicknameCheck,

    findOne: findOne,
    findOneWithProvider: findOneWithProvider,
    findPassword: findPassword,

    getUserInfoByReqHeader: getUserInfoByReqHeader,
    getUserInfoByUserDisplayName: getUserInfoByUserDisplayName,
    getUserInfoByUserId: getUserInfoByUserId,

    updateUserInfo: updateUserInfo,
    updateUserImage: updateUserImage,

    registrateSocialUser: registrateSocialUser,
    registrateUser: registrateUser,

    isUpdateFormVaild: isUpdateFormVaild,

    isFormVaild: isFormVaild,
    updateDeviceToken: updateDeviceToken,
    isExistDisplayName: isExistDisplayName,
    isDisplayNameVaild: isDisplayNameVaild
};