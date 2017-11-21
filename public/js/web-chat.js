

$(document).on('click', '#chat-button', function(){

    $("#chatPage").css("display", "flex");
    $('#chatPage').css("overflow", "hidden");

    $("#chatPage").animate({left: "65vw"});
});

socket.emit('login', {
    id: '1',
    displayName: 'sdaf'
});

socket.on('load old msgs', function (docs) {
    console.log(docs);
    docs.forEach(function (doc) {
        $('#chatLogs').append("<div><h3>" + doc.displayName + " : <strong>" + doc.msg + "</strong>(" + doc.time + ")</h3></div>");
    });
});

socket.on('login', function (data) {
    $('#chatLogs').append('<div><h3>' + data + '님이 왔어요~!</h3></div>');
});

socket.on('chat', function (data) {
    console.log(data);
    $('#chatLogs').append("<div><h3>" + data.displayName + " : <strong>" + data.msg + "</strong>(" + data.time + ")</h3></div>");
});



$("#chat-form").submit(function (e) {
    e.preventDefault();
    var $msgForm = $('#msgForm');
    var msg = $msgForm.val();


    msg = msg.replace('script', '고마해라 마이묵었다');
    msg = msg.replace('<', ' ');
    msg = msg.replace('>', ' ');
    msg = msg.replace('{', ' ');
    msg = msg.replace('}', ' ');
    msg = msg.replace('$', ' ');
    msg = msg.replace('null', '널');

    console.log(msg);

    socket.emit('chat', {msg: msg});
    $msgForm.val("");
});