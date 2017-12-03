

$(document).ready(function () {
    checkLogin();
});

$(document).on('click', '#loginSubmit', loginComplete);
function loginComplete() {
    var id = $("#loginId input").val();
    var password = $("#loginPw input").val();
    var ajaxData = {
        "id" : id,
        "password" : password
    }
    $.ajax({
        type: 'POST',
        data: ajaxData,
        url: baseUrl + '/users/login',
        success: function (data) {
            $('#myModal').modal('hide');
        },
        error: function (error) {
            alert(error);
            debugger;
        },
        complete: function () {
            $('#login-register-button button').text("로그아웃");
            $('#login-register-button button').attr("data-toggle", "");
            $('#login-register-button button').attr("data-target", "");
            $('#login-register-button button').attr("onclick", "logOut();");
        }
    });
}

function logOut() {
    var checkOut = confirm("로그아웃하시겠습니까?");
    if(checkOut == true){
        Cookies.remove('jwt');
        $('#login-register-button button').text("로그인");
        $('#login-register-button button').attr("data-toggle", "modal");
        $('#login-register-button button').attr("data-target", "#myModal");
        $('#myModal').modal('hide');
        $('#login-register-button button').attr("onclick", "");
    }
    else if(checkOut == false){
    }
}

function checkLogin() {
    console.log("쿠키 값 확인");
    console.log(Cookies.get('jwt'));
    if(Cookies.get('jwt') != null){
        $('#login-register-button button').text("로그아웃");
        $('#login-register-button button').attr("data-toggle", "");
        $('#login-register-button button').attr("data-target", "");
        $('#login-register-button button').attr("onclick", "logOut();");
    }
    else {
        $('#login-register-button button').text("로그인");
        $('#login-register-button button').attr("data-toggle", "modal");
        $('#login-register-button button').attr("data-target", "#myModal");
        $('#login-register-button button').attr("onclick", "");
    }
}
