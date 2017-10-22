
var baseUrl = "http://ec2-13-124-219-114.ap-northeast-2.compute.amazonaws.com:8080";

var mapWidth = $("#map-area").outerWidth();
var mapHeight = $("#map-area").outerHeight();
var allIcon = {};

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
        url: baseUrl+'/footprint/list',
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

    $.ajax({
        type: 'GET',
        data: "",
        url: baseUrl+'/files/retrieveIconAll',
        success: function(data) {
            saveIcons(data);
        }
    });
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
            var $title = $('<div class="title""></div>').appendTo($content).text(o.title).data('data', o).click(function(){
                popUp($(this).data('data'));
            });
            var $post = $('<div class="post""></div>').appendTo($content).text(o.content).data('data', o).click(function(){
                popUp($(this).data('data'));
            });
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
        $('#contents-page').html("");
        var fnAppendPage = function(start){
            $('#content-wrapper').html("");
            var end = Math.min(data.length, start+5);
            for(var i=start; i<end; i++) {
                var o = data[i];
                var $content = $('<div class="content"></div>').appendTo($("#content-wrapper"));
                var $title = $('<div class="title""></div>').appendTo($content).text(o.title).data('data', o).click(function(){
                    popUp($(this).data('data'));
                });
                var $post = $('<div class="post""></div>').appendTo($content).text(o.content).data('data', o).click(function(){
                    popUp($(this).data('data'));
                });
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

function popUp(data) {
    $("#popUp").html('<div id="detail-cancel"><button type="button" class="close" onclick="cancel();">&times;</button></div><div id="detail-post"><div id = "detail-top"><div id = "detail-icon"></div><div id = "detail-title"></div></div><div id = "detail-data"><div id = "detail-id"></div><div id = "detail-modified_date"></div></div><div id = "detail-images"><div id = "detail-image"></div></div><div id = "detail-content"></div><div id = "detail-cmt-count"></div></div>');
    $("#popUp").css("width", "45vw");
    $("#popUp").css("height", "100vh");
    $("#popUp").css("top", "0");
    $("#popUp").css("left", "55vw");
    $("#popUp").css("display", "flex");
    var icon_key = data.icon_key;
    var $icon;
    $.each( allIcon, function( key, value ) {
        if(key == icon_key){
            $icon = '<img src='+value+'>';
        }
    });
    $($icon).appendTo($("#detail-icon"));
    console.log(data);
    console.log(data.image);
    $("#detail-title").text(data.title);
    $("#detail-id").text(data.id);
    $("#detail-modified_date").text(data.modified_date);
    $("#detail-image").text(data.image);
    $("#detail-content").text(data.content);
    $("#detail-cmt-count").text(data.commentCount);
    $.ajax({
        type: 'GET',
        data: {footprintId : data.footprint_id},
        url: baseUrl+'/footprint/detail',
        success: function(data) {
            var $img;
            for(i=0;i<data.imageUrls.length;i++){
                $icon = '<img src='+data.imageUrls[i]+'>';
                $($img).appendTo($("#detail-image"));
            }
        }
    });
}

function cancel(){
    $("#popUp").css("display", "none");
}

function saveIcons(data){
    var o = data.iconUrls;
    for(i = 0; i<o.length; i++){
        var key = o[i].key;
        var value = o[i].value;
        allIcon[key] = value;
        //var icon = JSON.stringify("{"+key+" : "+value+"}");
        //allIcon.push(JSON.parse(icon));
    }
    console.log(allIcon);
}