
var baseUrl = "http://ec2-13-124-219-114.ap-northeast-2.compute.amazonaws.com:8080";
var baseUrl2 = "http://localhost:8080";

var markers = [];
var linkArrays = [];
var currentIndex;
var currentData;

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
                checkLink(data);
            },
            error: function (error) {
                location.href = baseUrl + "/404";
                console.log(error);
                debugger;
            }
        });

        function checkLink(data) {
            linkArrays = [];
            currentIndex = 0;
            currentData = data;

            if(data.type != 'single'){
                linkArrays.push(data);

                var linkedFootprintList = data.linkedFootprintList;

                linkedFootprintList.forEach(function (item, index) {
                    linkArrays.push(item);
                });
            }
            else {
                linkArrays.push(data);
            }

            fillDetail(data, 0);
            initialMap(data);
        }

        function fillDetail(data, index) {

            currentIndex = index;
            currentData = linkArrays[index];
            // map2.setCenter(new naver.maps.LatLng(currentData.latitude, currentData.longitude)); // 얻은 좌표를 지도의 중심으로 설정합니다.
            // map2.setZoom(11); // 지도의 줌 레벨을 변경합니다.

            console.log("야호");
            console.log(data);
            $("#detail-icon").empty();
            $("#detail-images").empty();
            $("#detail-profileImg").empty();

            var $icon = '<img src=' + data.iconUrl + '>';
            $($icon).appendTo($("#detail-icon"));
            $("#detail-title").text(data.title);
            $("#detail-id").text(data.displayName);
            $detailDate = '' + data.modified_date.substring(2, 10) + ' ' + data.modified_date.substring(11, 16);
            $("#detail-modified_date").text($detailDate);
            $("#detail-countView span").html('&nbsp;' + linkArrays[0].countView);
            $("#detail-countComments span").html('&nbsp;' + linkArrays[0].countComments);

            for (i = 0; i < data.imageUrls.length; i++) {
                $img = '<img src=' + data.imageUrls[i] + '>';
                $($img).appendTo($("#detail-images"));
            }

            $("#detail-content").text(data.content);
            $("#detail-like-count").text(linkArrays[0].countLike);
            $("#detail-dislike-count").text(linkArrays[0].countDisLike);

            $profileImg = '<img src=' + data.profileUrl + '>';
            // $($profileImg).appendTo($("#detail-profileImg"));

            $("#detail-profileImg").css("background-image", 'url(' + linkArrays[0].profileUrl + ')');

            $("#detail-cmt-count").text(linkArrays[0].countComments);
        }

        function initialMap(data) {
            map2 = new naver.maps.Map('detail-map', {
                size: new naver.maps.Size($("#detail-map-area").width(), 280),
                center: new naver.maps.LatLng(37.504479, 127.048941), //지도의 초기 중심 좌표
                zoom: 11, //지도의 초기 줌 레벨
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
            naver.maps.Event.addListener(map2, 'idle', fillMarkers(data));
        }

        function fillMarkers(data) {

            if( data.type == 'single'){
                var marker = new naver.maps.Marker({
                    map: map2,
                    position: new naver.maps.LatLng(data.latitude, data.longitude),
                    icon: {
                        url: data.iconUrl,
                        size: new naver.maps.Size(30, 30),
                        scaledSize: new naver.maps.Size(30, 30),
                        origin: new naver.maps.Point(0, 0),
                        anchor: new naver.maps.Point(15, 15)
                    },
                    // title: o.footprint_id
                });
                $(".floating").css("display","none");
                $(".detail-left-icon").css("display","none");
                $(".detail-right-icon").css("display","none");
            }
            else {

                linkArrays.forEach(function (item, index) {
                    var marker = new naver.maps.Marker({
                        map: map2,
                        position: new naver.maps.LatLng(item.latitude, item.longitude),
                        icon: {
                            url: item.iconUrl,
                            size: new naver.maps.Size(30, 30),
                            scaledSize: new naver.maps.Size(30, 30),
                            origin: new naver.maps.Point(0, 0),
                            anchor: new naver.maps.Point(15, 15)
                        },
                        title: index
                    });
                    markers.push(marker);
                    naver.maps.Event.addListener(markers[index], 'click', getClickHandler(index));

                    if(index < linkArrays.length-1){
                        var openArrowLine = new naver.maps.Polyline({
                            path: [
                                new naver.maps.LatLng(item.latitude, item.longitude),
                                new naver.maps.LatLng(linkArrays[index+1].latitude, linkArrays[index+1].longitude)
                            ],
                            map: map2,
                            endIcon: naver.maps.PointingIcon.OPEN_ARROW,
                            strokeColor: '#ffcf15',
                            strokeWeight: 6
                        });
                    }

                });

                function getClickHandler(index) {
                    return function () {
                        fillDetail(linkArrays[index], index);
                        setCenter(linkArrays[index]);
                    };
                }
            }
            setCenter(data);
        }

        function setCenter(data) {
            map2.setCenter(new naver.maps.LatLng(data.latitude, data.longitude)); // 얻은 좌표를 지도의 중심으로 설정합니다.
            map2.setZoom(11); // 지도의 줌 레벨을 변경합니다.
        }

        $(document).on('click', '.detail-left-icon', function(){
            if(currentIndex -1 < 0){
                fillDetail(linkArrays[linkArrays.length-1], linkArrays.length-1);
                setCenter(linkArrays[linkArrays.length-1]);
            }
            else {
                fillDetail(linkArrays[currentIndex-1], currentIndex-1);
                setCenter(linkArrays[currentIndex-1]);
            }
        });

        $(document).on('click', '.detail-right-icon', function(){
            if(currentIndex + 1 > linkArrays.length-1){
                fillDetail(linkArrays[0], 0);
                setCenter(linkArrays[0]);
            }
            else {
                fillDetail(linkArrays[currentIndex+1], currentIndex+1);
                setCenter(linkArrays[currentIndex+1]);
            }
        });

        $(window).resize(function (){
            map2.setSize(new naver.maps.Size($("#detail-map-area").width(), 280));
            debugger;
            map2.setCenter(new naver.maps.LatLng(currentData.latitude, currentData.longitude));
        });

    }
});

$(window).on('load', function () {
    $('#loading').remove();
});