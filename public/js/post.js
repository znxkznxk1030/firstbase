
var baseUrl = "http://ec2-13-124-219-114.ap-northeast-2.compute.amazonaws.com:8080";
var baseUrl2 = "http://localhost:8080";

var allIcon = {};
var markers = [];
var currentData;

$.ajax({
    type: 'GET',
    data: "",
    url: baseUrl + '/files/retrieveIconAll',
    success: function (data) {
        saveIcons(data);
    },
    error: function (error) {
        location.href = baseUrl + "/404";
        console.log(error);
        debugger;
    }
});

function saveIcons(data) {
    var o = data.iconUrls;
    for (i = 0; i < o.length; i++) {
        var key = o[i].key;
        var value = o[i].value;
        allIcon[key] = value;
    }
    console.log(allIcon);
}

$.ajax({
    type: 'GET',
    data: '',
    url: baseUrl + '/post/ajax',
    success: function (htmlData) {
        $("#detail-area").html(htmlData);
    },
    error: function (error) {
        location.href = baseUrl + "/404";
        console.log(error);
        debugger;
    },
    complete: function () {

        var map2 = new naver.maps.Map('detail-map', {
            size: new naver.maps.Size($(window).width() * 0.9 - 20, 280),
            center: new naver.maps.LatLng(37.504479, 127.048941), //지도의 초기 중심 좌표
            zoom: 10, //지도의 초기 줌 레벨
            minZoom: 2, //지도의 최소 줌 레벨 //축소
            maxZoom: 14, //확대
            zoomControl: true, //줌 컨트롤의 표시 여부
            zoomControlOptions: { //줌 컨트롤의 옵션
                style: naver.maps.ZoomControlStyle.SMALL, // 바가 아니라 확대 축소로.
                position: naver.maps.Position.RIGHT_CENTER
            },
            logoControl: false, //네이버 로고 삭제
            scaleControl: false, //거리 단위 표시 삭제
            mapDataControl: false, //네이버 Corp. 삭제
        });

        var Bounds = map2.getBounds();
        getMarkers(Bounds);
        naver.maps.Event.addListener(map2, 'bounds_changed', function (bounds) {
            getMarkers(bounds);
        });

        var param = window.location.href.split('id=')[1];
        console.log("param:" + param);

        var ajaxData = {
            footprintId: param
        };

        $.ajax({
            type: 'GET',
            data: ajaxData,
            url: baseUrl + '/footprint/detail/',
            success: function (data) {
                console.log("바로 밑");
                console.log(data);
                fillDetail(data);
            },
            error: function (error) {
                location.href = baseUrl + "/404";
                console.log(error);
                debugger;
            }
        });

        function fillDetail(data) {

            currentData = data;
            map2.setCenter(new naver.maps.LatLng(currentData.latitude, currentData.longitude)); // 얻은 좌표를 지도의 중심으로 설정합니다.
            map2.setZoom(10); // 지도의 줌 레벨을 변경합니다.

            console.log("야호");
            console.log(data);
            $("#detail-icon").empty();
            $("#detail-images").empty();
            $("#detail-profileImg").empty();

            var icon_key = data.icon_key;
            var $icon;
            $.each(allIcon, function (key, value) {
                if (key == icon_key) {
                    $icon = '<img src=' + value + '>';
                }
            });
            $($icon).appendTo($("#detail-icon"));
            $("#detail-title").text(data.title);
            $("#detail-id").text(data.displayName);
            $detailDate = '' + data.modified_date.substring(2, 10) + ' ' + data.modified_date.substring(11, 16);
            $("#detail-modified_date").text($detailDate);
            $("#detail-countView span").html('&nbsp;' + data.countView);
            $("#detail-countComments span").html('&nbsp;' + data.countComments);

            for (i = 0; i < data.imageUrls.length; i++) {
                $img = '<img src=' + data.imageUrls[i] + '>';
                $($img).appendTo($("#detail-images"));
            }

            $("#detail-content").text(data.content);
            $("#detail-like-count").text(data.countLike);
            $("#detail-dislike-count").text(data.countDisLike);

            $profileImg = '<img src=' + data.profileUrl + '>';
            // $($profileImg).appendTo($("#detail-profileImg"));

            $("#detail-profileImg").css("background-image", 'url(' + data.profileUrl + ')');

            $("#detail-cmt-count").text(data.countComments);

            history.pushState(null, null, baseUrl + '/post?id=' + data.footprint_id);
        }

        function getMarkers(Bounds) {

            var pickBounds = _.pick(Bounds, "_min", "_max");

            var startlat = pickBounds._min._lat;
            var startlng = pickBounds._min._lng;
            var endlat = pickBounds._max._lat;
            var endlng = pickBounds._max._lng;

            var ajaxData = {
                startlat: endlat,
                startlng: startlng,
                endlat: startlat,
                endlng: endlng
            };

            $.ajax({
                type: 'GET',
                data: ajaxData,
                url: baseUrl + '/footprint/listbylocation/',
                success: function (data) {
                    makeMarkers(data);
                },
                error: function (error) {
                    location.href = baseUrl + "/404";
                    console.log(error);
                    debugger;
                }
            });
        }

        function makeMarkers(data) {
            if (data.length > 0) {
                for (var i = 0; i < data.length; i++) {
                    var o = data[i];
                    var latitude = o.latitude;
                    var longitude = o.longitude;

                    var icon_key = o.icon_key;
                    var iconUrl = "";

                    $.each(allIcon, function (key, value) {
                        if (key == icon_key) {
                            iconUrl = value;
                        }
                    });

                    var marker = new naver.maps.Marker({
                        map: map2,
                        position: new naver.maps.LatLng(latitude, longitude),
                        icon: {
                            url: iconUrl,
                            size: new naver.maps.Size(30, 30),
                            scaledSize: new naver.maps.Size(30, 30),
                            origin: new naver.maps.Point(0, 0),
                            anchor: new naver.maps.Point(15, 15)
                        },
                        title: o.footprint_id
                    });
                    markers.push(marker);
                }

                function getClickHandler(seq) {
                    return function () {
                        var id = markers[seq].getTitle();
                        $.ajax({
                            type: 'GET',
                            data: {footprintId: id},
                            url: baseUrl + '/footprint/detail',
                            success: function (data) {
                                fillDetail(data);
                            },
                            error: function (error) {
                                location.href = baseUrl + "/404";
                                console.log(error);
                                debugger;
                            }
                        });
                    }
                }

                for (var i = 0, ii = markers.length; i < ii; i++) {
                    naver.maps.Event.addListener(markers[i], 'click', getClickHandler(i));
                }
            }
        }

        $(window).resize(
            function () {
                map2.setSize(new naver.maps.Size($(window).width() * 0.9 - 20, 280));
                map2.setCenter(new naver.maps.LatLng(currentData.latitude, currentData.longitude));
            }
        );
    }
});

$(window).on('load', function () {
    $('#loading').remove();
});