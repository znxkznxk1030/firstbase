var displayName = '나그네';
var profileUrl = 'http://d2w40mi5mo8vk7.cloudfront.net/';


var getProfile = function (cb){
    $.ajax({
        type: 'GET',
        url: '/users/profile',
        success: cb
    });
};


getProfile(function (data){
        displayName = data.displayName;
        profileUrl = data.profileUrl;
        console.log(displayName, profileUrl);
});

//cross request error

// $.ajax({
//     type: 'GET',
//     url: "https://openapi.naver.com/v1/search/local.json?query=%EC%A3%BC%EC%8B%9D&display=10&start=1&sort=random",
//     accept:{
//         All: '*/*'
//     },
//     headers: {
//         "X-Naver-Client-Id":"",
//         "X-Naver-Client-Secret":"KH7kJFEf3T"
//     },
//     success: function(data){
//         console.log(data);
//     }
// });