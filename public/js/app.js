
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

$(document).ready(function(){
    $.ajax({
        type: 'GET',
        data: "",
        url: '/footprint/list',
        success: function(data) {
            // var myJSON = JSON.stringify(data);
            var cnt = Math.min(data.length, 5);
            var $list = $('<div class="content-wrapper"></div>').appendTo($('#contents'));

            //data[i] 또는 foreach(data)
            var fnAppendPage = function(start){
                $('.content-wrapper').html("");
                var end = Math.min(data.length, start+5);
                for(var i=start; i<end; i++) {
                    var o = data[i];
                    var $content = $('<div class="content"></div>').appendTo($list);
                    var $title = $('<div class="title"></div>').appendTo($content).text(o.title);
                    var $post = $('<div class="post"></div>').appendTo($content).text(o.content);
                }
            };

            var $page = $('<div class="contents-page"></div>').appendTo($('#contents'));

            var pageCnt = data.length / 5;
            for(i=0; i<pageCnt; i++) {
                $('<span class="page"></span>').data('page', i).text(i+1).appendTo($page).click(function(){
                    var pageIdx = $(this).data('page');
                    fnAppendPage(pageIdx * 5);
                });
            }

            fnAppendPage(0);
        }
    });
});

function write_button_click() {
    $("#contents-area").html("<div class='emoticon'><img src='/img/layout/travel.png'></div><div class='emoticon'><img src='/img/layout/travel.png'></div><div class='emoticon'><img src='/img/layout/travel.png'></div><div class='emoticon'><img src='/img/layout/travel.png'></div><div class='emoticon'><img src='/img/layout/travel.png'></div><div class='emoticon'><img src='/img/layout/travel.png'></div><div class='emoticon'><img src='/img/layout/travel.png'></div><div class='emoticon'><img src='/img/layout/travel.png'></div><div class='emoticon'><img src='/img/layout/travel.png'></div>");

    $(".emoticon img").draggable({
        containment: "body"
    });
}

var ActivateWriteHere = false;

$(document).on('mousedown', '.emoticon img', function(){
    $( ".emoticon img" ).draggable({
        containment: "#map"
    });
    /* lock icon in map. user could drag icon only in map */
});

$(document).on('mouseup', '.emoticon img', function(event){
    x = event.pageX;
    y = event.pageY;
    calCoord(x,y);
});

function calCoord(x,y){

    ActivateWriteHere = true;

    $( ".emoticon img" ).draggable({
        disabled: true
    });

    /*
    a = $("#map").outerWidth();
    b = $("#map").outerHeight();
    if( (a>x) && (b>y) ){
        $( ".emoticon img" ).draggable({
            disabled: true
        });
    }
    */

    $.ajax({
        type: 'GET',
        data: "",
        url: '/footprint/new',
        success: function(data) {
            $("#contents-area").html(data);
        }
    });
}


var listener = naver.maps.Event.addListener(map, 'mousemove', function(e) {
    if(ActivateWriteHere == true){
        var here = e.coord;
        writeHere(here);
        /*naver.maps.Event.removeListener(listener);*/
        ActivateWriteHere = false
    }
});

function writeHere(here) {
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
