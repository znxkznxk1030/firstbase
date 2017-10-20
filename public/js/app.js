
var baseUrl = "http://ec2-13-124-219-114.ap-northeast-2.compute.amazonaws.com:8080";

var mapWidth = $("#map-area").outerWidth();
var mapHeight = $("#map-area").outerHeight();

$(window).resize(function() {
    mapWidth = $("#map-area").outerWidth();
    mapHeight = $("#map-area").outerHeight();
    $("#add-button").css("margin-left",mapWidth-70);
    $("#add-button").css("margin-top",mapHeight-70);
    $("#radar-button").css("margin-left",mapWidth-38);
});

//지도 생성시에 옵션을 지정할 수 있습니다.
var map = new naver.maps.Map('map', {
        center: new naver.maps.LatLng(37.504479, 127.048941), //지도의 초기 중심 좌표
        zoom: 10, //지도의 초기 줌 레벨
        minZoom: 2, //지도의 최소 줌 레벨 //축소
        maxZoom: 12, //확대
        zoomControl: true, //줌 컨트롤의 표시 여부
        zoomControlOptions: { //줌 컨트롤의 옵션
            style: naver.maps.ZoomControlStyle.SMALL, // 바가 아니라 확대 축소로.
            position: naver.maps.Position.RIGHT_CENTER
        },
        logoControl: false, //네이버 로고 삭제
        scaleControl: false, //거리 단위 표시 삭제
        mapDataControl: false, //네이버 Corp. 삭제
    });

//setOptions 메서드를 통해 옵션을 조정할 수도 있습니다.
map.setOptions("minZoom", 2);

var markers = [];

$(document).ready(function(){
    $.ajax({
        type: 'GET',
        data: "",
        url: '/footprint/list',
        success: function(data) {
            makePage(data);
        }
    });

    $("#add-button").css("margin-left",mapWidth-70);
    $("#add-button").css("margin-top",mapHeight-70);
    $("#radar-button").css("margin-left",mapWidth-38);

    var Bounds = map.getBounds();
    getMarkers(Bounds);
    naver.maps.Event.addListener(map, 'bounds_changed', function(bounds) {
        getMarkers(bounds);
    });
    search_positon();
});

function makeMarkers(data){
    if(data.length > 0) {
        for(var i=0; i<data.length; i++) {
            var o = data[i];
            var latitude = o.latitude;
            var longitude = o.longitude;

            var marker = new naver.maps.Marker({
                map: map,
                position: new naver.maps.LatLng(latitude, longitude)
            });
        }
    }
}

function showMarker(map, marker) {
    if (marker.setMap()) return;
    marker.setMap(map);
}

function makePage(data) {
    // var myJSON = JSON.stringify(data);
    var cnt = Math.min(data.length, 5);
    var $list = $('<div id="content-wrapper"></div>').appendTo($('#contents'));

    //data[i] 또는 foreach(data)
    var fnAppendPage = function(start){
        $('#content-wrapper').html("");
        var end = Math.min(data.length, start+5);
        for(var i=start; i<end; i++) {
            var o = data[i];
            var $content = $('<div class="content"></div>').appendTo($list);
            var $title = $('<div class="title"></div>').appendTo($content).text(o.title);
            var $post = $('<div class="post"></div>').appendTo($content).text(o.content);
        }
    };

    var $page = $('<div id="contents-page"></div>').appendTo($('#contents'));

    var pageCnt = data.length / 5;
    for(i=0; i<pageCnt; i++) {
        $('<span class="page"></span>').data('page', i).text(i+1).appendTo($page).click(function(){
            var pageIdx = $(this).data('page');
            fnAppendPage(pageIdx * 5);
        });
    }

    fnAppendPage(0);
}

function renderPage(data) {
    if(data.length > 0) {
        var cnt = Math.min(data.length, 5);
        $('#content-wrapper').html("");
        $('#contents-page').html("");
        var fnAppendPage = function(start){
            var end = Math.min(data.length, start+5);
            for(var i=start; i<end; i++) {
                var o = data[i];
                var $content = $('<div class="content"></div>').appendTo($("#content-wrapper"));
                var $title = $('<div class="title"></div>').appendTo($content).text(o.title);
                var $post = $('<div class="post"></div>').appendTo($content).text(o.content);
            }
        };
        var pageCnt = data.length / 5;
        for(i=0; i<pageCnt; i++) {
            $('<span class="page"></span>').data('page', i).text(i+1).appendTo($("#contents-page")).click(function(){
                var pageIdx = $(this).data('page');
                fnAppendPage(pageIdx * 5);
            });
        }

        fnAppendPage(0);
    }
    makeMarkers(data);
}

function getMarkers(Bounds) {

    var pickBounds = _.pick(Bounds,"_min","_max");


    var startlat = pickBounds._min._lat;
    var startlng = pickBounds._min._lng;
    var endlat = pickBounds._max._lat;
    var endlng = pickBounds._max._lng;

    var ajaxData = {
        startlat : endlat,
        startlng : startlng,
        endlat : startlat,
        endlng : endlng
    }
    console.log(ajaxData);

    $.ajax({
        type: 'GET',
        data: ajaxData,
        url: baseUrl+'/footprint/listbylocation/',
        success: function(data) {
            renderPage(data);
        }
    });
}

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

function search_positon(){
    navigator.geolocation.getCurrentPosition(onSuccessGeolocation);
}

function onSuccessGeolocation(position) {
    var location = new naver.maps.LatLng(position.coords.latitude,
     position.coords.longitude);

    map.setCenter(location); // 얻은 좌표를 지도의 중심으로 설정합니다.
    map.setZoom(10); // 지도의 줌 레벨을 변경합니다.
}