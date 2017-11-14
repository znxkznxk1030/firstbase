

var getLocalInfomation = function (cb){
    $.ajax({
        type: 'GET',
        url: '/users/profile',
        success: cb
    });
};

$.ajax({
    type: 'GET',
    url: "https://openapi.naver.com/v1/search/local.xml?query=%EC%A3%BC%EC%8B%9D&display=10&start=1&sort=random",
    headers: {
        "X-Naver-Client-Id":"3WGB6rDBj4WmIKeoAuDG",
        "X-Naver-Client-Secret":"KH7kJFEf3T"
    },
    success: function(data){
        console.log(data);
    }
});