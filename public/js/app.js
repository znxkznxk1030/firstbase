
var point = false;

$(document).on('mousedown', '.emoticon img', function(){
    crossMap();
});

function crossMap(){
    $(document).on('mouseenter', '#map', function(){
        $( ".emoticon img" ).draggable({
            containment: "#map"
        });
    });
}

$(document).on('mouseup', '.emoticon img', function(event){
    x = event.pageX;
    y = event.pageY;
    calMap(x,y);
});

$(document).ready(function(){
    $.ajax({
        type: 'GET',
        data: "",
        url: '/footprint/list',
        success: function(data) {
            // var myJSON = JSON.stringify(data);
            var cnt = Math.min(data.length, 5);
            var $list = $('<div style="width:100%;"></div>').appendTo($('#contents1'));

            //data[i] 또는 foreach(data)
            var fnAppendPage = function(start){
                var end = start+5;
                for(var i=start; i<end; i++) {
                    var o = data[i];
                    var $content = $('<div class="content"></div>').appendTo($list);
                    var $title = $('<div class="title"></div>').appendTo($content).text(o.title);
                    var $post = $('<div class="post"></div>').appendTo($content).text(o.content);
                }
            };


            var $page = $('<div></div>').appendTo($('#contents1'));

            var pageCnt = data.length / 5;
            for(i=0; i<pageCnt; i++) {
                $('<span style="border: 1px solid #ddd; padding: 5px; margin: 3px;"></span>').data('page', i).text(i+1).appendTo($page).click(function(){
                        var pageIdx = $(this).data('page');
                        fnAppendPage(pageIdx * 5);
                });
            }
            // console.log(data);
            // alert(myJSON);
            // var list = $.parseJSON(json);
            // var title = "#title";
            // var post = "#post";
            // for(var i=1; i<6; i++){
            //     alert(list[i-1].title);
            // }
        }
    });
});

function calMap(x,y){
    a = $("#map").outerWidth();
    b = $("#map").outerHeight();
    if( (a>x) && (b>y) ){
        $( ".emoticon img" ).draggable({
            disabled: true
        });
    }
    point = true;

    $.ajax({
        type: 'GET',
        data: "",
        url: '/footprint/new',
        success: function(data) {
            $("#contents-area").html(data);
        }
    });
}

var mapOptions = {
    center: new naver.maps.LatLng(37.3595704, 127.105399),
    zoom: 10
};

var map = new naver.maps.Map('map', mapOptions);

var marker1 = new naver.maps.Marker({
    position: new naver.maps.LatLng(37.3595704, 127.105399),
    map: map
});

var marker2 = new naver.maps.Marker({
    position: new naver.maps.LatLng(37.3495704, 127.105399),
    map: map
});

var marker3 = new naver.maps.Marker({
    position: new naver.maps.LatLng(37.3695704, 127.105399),
    map: map
});

var marker4 = new naver.maps.Marker({
    position: new naver.maps.LatLng(37.3595704, 127.085399),
    map: map
});

var marker5 = new naver.maps.Marker({
    position: new naver.maps.LatLng(37.3595704, 127.125399),
    map: map
});


var listener = naver.maps.Event.addListener(map, 'mousemove', function(e) {
    if(point == true){
        var here = e.coord;
        checkHere(here);
        /*naver.maps.Event.removeListener(listener);*/
        point = false
    }
});

function checkHere(here) {
    var markerOptions = {
        position:  new naver.maps.LatLng(here.y, here.x),
        map: map,
        icon: {
            url: 'https://image.flaticon.com/icons/png/128/45/45873.png'
        }
    };

    var marker11 = new naver.maps.Marker(markerOptions);
    $("#contents-area .footprint-new #icon_url").val('/img/layout/travel.png');
    $("#contents-area .footprint-new #latitude").val(here.x);
    $("#contents-area .footprint-new #longitude").val(here.y);
}

function button1_click() {
    $("#contents-area").html("<div class='emoticon'><img src='/img/layout/travel.png'></div><div class='emoticon'><img src='/img/layout/travel.png'></div><div class='emoticon'><img src='/img/layout/travel.png'></div><div class='emoticon'><img src='/img/layout/travel.png'></div><div class='emoticon'><img src='/img/layout/travel.png'></div><div class='emoticon'><img src='/img/layout/travel.png'></div><div class='emoticon'><img src='/img/layout/travel.png'></div><div class='emoticon'><img src='/img/layout/travel.png'></div><div class='emoticon'><img src='/img/layout/travel.png'></div>");

    $(".emoticon img").draggable({
        containment: "body"
    });
}