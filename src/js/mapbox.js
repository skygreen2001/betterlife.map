// 全局配置
var config = {
    at     : 'pk.eyJ1Ijoic2t5Z3JlZW4yMDAxIiwiYSI6ImNqd2tnbG15eTB0ank0OG1yam55c25ybjYifQ.dkQ1RMRIPzENlEfd-BhdRw',
    is3D   : false, // 是否显示3D地图
    showCtl: true, // 是否显示控制工具
    zoom   : 16,
    // center: [120.48976236979166,30.7478857421875], //乌镇
    // center: [121.420106,31.256928], //品尊国际
    center : [116.33719, 39.942384], //北京动物园
    style  : 'mapbox://styles/mapbox/streets-v11', // 'mapbox://styles/mapbox/outdoors-v11'
    image  : {
        opacity: 0.5, // 0.3
        zooms: [0, 24] // [15, 18] 在哪些地图层级区间可见
    },
    autocomplete: 2 // 三种方式，1:自定义，2: Mapbox系统自带， 3: Mapbox系统自带并自定义
};

// 结果数据
var data = {
    "start": {
        "lng": 0,
        "lat": 0
    },
    "end"  : {
        "lng": 0,
        "lat": 0
    },
    // image: '../img/cover.png' // 'http://amappc.cn-hangzhou.oss-pub.aliyun-inc.com/lbs/static/img/dongwuyuan.jpg'
    image: '../img/cover.png'
};

/*                             基础功能                                  */
mapboxgl.accessToken = config.at;
var map = new mapboxgl.Map({
    container: 'map',
    style: config.style,
    center: config.center, // 地图中心点
    // bearing: -12, // 地图旋转角度
    // pitch: 60, // 45 地图倾斜角度
    zoom: config.zoom
});
 
map.on('style.load', function () {
    // 默认中文
    map.setLayoutProperty('country-label', 'text-field', ['get', 'name_zh-Hans']);

    if (config.is3D) { // 3D配置
        // [Display buildings in 3D](https://docs.mapbox.com/mapbox-gl-js/example/3d-buildings/)
        // Insert the layer beneath any symbol layer.
        var layers = map.getStyle().layers;
        
        var labelLayerId;
        for (var i = 0; i < layers.length; i++) {
            if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
                labelLayerId = layers[i].id;
                break;
            }
        }
        
        map.addLayer({
            'id': '3d-buildings',
            'source': 'composite',
            'source-layer': 'building',
            'filter': ['==', 'extrude', 'true'],
            'type': 'fill-extrusion',
            'minzoom': 15,
            'paint': {
                'fill-extrusion-color': '#aaa',
                
                // use an 'interpolate' expression to add a smooth transition effect to the
                // buildings as the user zooms in
                'fill-extrusion-height': [
                    "interpolate", ["linear"], ["zoom"],
                    15, 0,
                    15.05, ["get", "height"]
                ],
                'fill-extrusion-base': [
                    "interpolate", ["linear"], ["zoom"],
                    15, 0,
                    15.05, ["get", "min_height"]
                ],
                'fill-extrusion-opacity': .6
            }
        }, labelLayerId);
    }

    // 键盘控制导航: [Navigate the map with game-like controls](https://docs.mapbox.com/mapbox-gl-js/example/game-controls/)
    map.getCanvas().focus();
    // pixels the map pans when the up or down arrow is clicked
    var deltaDistance = 100;
    
    // degrees the map rotates when the left or right arrow is clicked
    var deltaDegrees = 25;
    map.getCanvas().addEventListener('keydown', function(e) {
        e.preventDefault();
        if (e.which === 38) { // up
            map.panBy([0, -deltaDistance], {
                easing: easing
            });
        } else if (e.which === 40) { // down
            map.panBy([0, deltaDistance], {
                easing: easing
            });
        } else if (e.which === 37) { // left
            map.easeTo({
                bearing: map.getBearing() - deltaDegrees,
                easing: easing
            });
        } else if (e.which === 39) { // right
            map.easeTo({
                bearing: map.getBearing() + deltaDegrees,
                easing: easing
            });
        }
    }, true);
});

if (config.showCtl) {
    var nav = new mapboxgl.NavigationControl();
    map.addControl(new mapboxgl.FullscreenControl({container: document.querySelector('body')}));
    map.addControl(nav, 'top-right'); // 'top-left', 'bottom-right'
    map.addControl(new mapboxgl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        trackUserLocation: true
    }));
}


var geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl
});
if (config.autocomplete == 2) {
    map.addControl(geocoder);
} 
if (config.autocomplete == 3) {
    document.getElementById('input-item').appendChild(geocoder.onAdd(map));
}


// [Get coordinates of the mouse pointer](https://docs.mapbox.com/mapbox-gl-js/example/mouse-position/)
// [Create a draggable Marker](https://docs.mapbox.com/mapbox-gl-js/example/drag-a-marker/)
// map.on('mousemove', function (e) {
// map.on('mouseleave', function (e) {
map.on('click', function (e) {
    addMarker(e);
    document.getElementById("lnglat").value = e.lngLat.lng + ',' + e.lngLat.lat;
    // // e.point is the x, y coordinates of the mousemove event relative
    // // to the top-left corner of the map
    // JSON.stringify(e.point) + '<br />' +
    // // e.lngLat is the longitude, latitude geographical position of the event
    // console.log(JSON.stringify(e.lngLat));
});

document.querySelector("#btn-query").onclick = function() {
    queryLatlng();
}

function queryLatlng() {
    var lnglat = document.getElementById("lnglat");
    query = lnglat.value;
    map.setZoom(18);
    if (query.includes(".")&&query.includes(",")) {
        query = query.split(',');
        var lng = query[0];
        var lat = query[1];
        map.setCenter([lng, lat]); 
        map.setZoom(config.zoom); 
    } else {
        var apiEndpoint = 'https://api.mapbox.com/geocoding/v5/mapbox.places/'+query+'.json?access_token=' + config.at + '&autocomplete=true'

        //ajax call to get location data from the zipcode
        $.get(apiEndpoint)
            .then(function(mapData) {
                var coordinates = mapData.features[0].center; //array [long, lat]
                map.setZoom(config.zoom);
                map.setCenter(coordinates);
                var marker = new mapboxgl.Marker({
                    riseOnHover: true,
                    focus: true,
                    draggable: true
                })
                .setLngLat(coordinates)
                .addTo(map);
                
            });

        // AMap.plugin('AMap.PlaceSearch', function(){
        //     var autoOptions = {
        //     city: '全国'
        //     }
        //     var placeSearch = new AMap.PlaceSearch(autoOptions);
        //     placeSearch.search(query, function(status, result) {
        //         // console.log(result);
        //         if (result && result.poiList && result.poiList.pois) {
        //             var location = result.poiList.pois[0];
        //             if (location&&location.location){
        //                 map.setZoom(17);
        //                 map.setCenter(location.location);
        //             }
        //         }
        //     });
        // });
    }
}

document.getElementById('buttons').addEventListener('click', function(event) {
    var language = event.target.id.substr('button-'.length);
    // Use setLayoutProperty to set the value of a layout property in a style layer.
    // The three arguments are the id of the layer, the name of the layout property,
    // and the new property value.
    map.setLayoutProperty('country-label', 'text-field', ['get', 'name_' + language]);
});

function easing(t) {
    return t * (2 - t);
}

/*                             高级功能                                  */
var markers = [];
var i = 0; 

/**
 * 添加Marker点位，放置图片
 * 在图片上右键可删除点位
 * 点击两个marker，即确定图片位置
 */
function addMarker(source) {
    var location = source.lngLat;
    if (markers && markers.length <= 1) {
        var el = document.createElement('div');
        el.id = "m" + i;
        var marker = new mapboxgl.Marker({
                        element: el,
                        draggable: true
                    })
                    .setLngLat([location.lng, location.lat])
                    .addTo(map);
        marker.on('dragend', markerDragging);
        // marker.on('dragend', _.debounce(markerDragging, 15, false));
        // marker.on('dragend', function(e){
        //     markerDragging(e);
        // });
        i += 1;
        markers.push(marker);
        if (markers.length == 2) {
            refreshImg();
        }
    }
}
// 拖拽点位
function markerDragging(e) {
    // console.log(e);
    if (e && e.target && e.target._element &&  e.target._element.id && e.target._lngLat && markers && markers.length == 2) {
        if (e.target._element.id == 'm0') {
            markers[0]._lngLat = e.target._lngLat;
        }
        if (e.target._element.id == 'm1') {
            markers[1]._lngLat = e.target._lngLat;
        }
        refreshImg();
    }
};

var imageSource = null;
var imageLayer  = null;
var img_source_id = "img_layer";
var img_layer_id = "overlay";
// 重置图片
function refreshImg() {
    if (markers[0] == null || markers[1] == null) return;
    if (markers[0]._lngLat == null || markers[1]._lngLat == null) return;
    var southWestLat = markers[0]._lngLat.lat;
    var northEastLat = markers[1]._lngLat.lat;
    if (southWestLat && northEastLat && southWestLat > northEastLat) {
        southWestLat = markers[1]._lngLat.lat;
        northEastLat = markers[0]._lngLat.lat;
    } 
    var southWestLng = markers[0]._lngLat.lng;
    var northEastLng = markers[1]._lngLat.lng; 
    if (southWestLng && northEastLng && southWestLng > northEastLng) {
        southWestLng = markers[1]._lngLat.lng;
        northEastLng = markers[0]._lngLat.lng;
    }
    data.start = {
        lng: southWestLng,
        lat: southWestLat
    };
    data.end   = {
        lng: northEastLng,
        lat: northEastLat
    };
    console.log(data);
    imageSource = map.getSource(img_source_id);
    if (imageSource == null) {
        map.addSource(img_source_id, {
            type: 'image',
            url: data.image,
            coordinates: [
                [data.start.lng, data.end.lat],
                [data.end.lng, data.end.lat],
                [data.end.lng, data.start.lat],
                [data.start.lng, data.start.lat]
            ]
        });

        map.addLayer({
            "id": img_layer_id,
            "source": img_source_id,
            "type": "raster",
            "paint": {
                "raster-opacity": config.image.opacity
            }
        });
        imageLayer = map.getLayer(img_layer_id); 
        if (imageLayer!=null) {
            map.on('contextmenu', function(e){
                if (imageLayer!=null && markers && markers.length == 2) {
                    markers.forEach(marker => {
                        marker.remove();
                    });
                    markers = [];
                    i = 0; 
                    if (imageSource!=null) {
                        map.removeLayer(img_layer_id);
                        map.removeSource(img_source_id);
                        imageLayer = null;
                        imageSource = null;
                    }
                }
                // var location = e.lngLat;
                // var popup = new mapboxgl.Popup({closeOnClick: false})
                //                 .setLngLat([location.lng, location.lat])
                //                 .setHTML('<p>lng:' + location.lng + '<br /> lat: ' + location.lat + '.</p>')
                //                 .addTo(map);
            });

            // map.on('contextmenu', img_layer_id, function(e){
            //     alert(e.lngLat);
            // });
        }
    } else {
        imageSource.setCoordinates([
            [data.start.lng, data.end.lat],
            [data.end.lng, data.end.lat],
            [data.end.lng, data.start.lat],
            [data.start.lng, data.start.lat]
        ]);
    }
    imageSource = map.getSource(img_source_id);
    if (imageSource) console.log(imageSource.coordinates);

}

// 获取图片本地路径
function previewHandle(fileDOM) {
    markers.forEach(marker => {
        marker.remove();
    });
    markers = [];
    i = 0; 
    if (imageSource!=null) {
        map.removeLayer(img_layer_id);
        map.removeSource(img_source_id);
    }
    var file = fileDOM.files[0], // 获取文件
        imageType = /^image\//,
        reader = '';
 
    // 文件是否为图片
    if (!imageType.test(file.type)) {
        alert("请选择图片！");
        return;
    }
    // 判断是否支持FileReader    
    if (window.FileReader) {
        reader = new FileReader();
    }
    // IE9及以下不支持FileReader
    else {
        alert("您的浏览器不支持图片预览功能，如需该功能请升级您的浏览器！");
        return;
    }
    // 读取完成    
    reader.onload = function (event) {
        // 图片路径设置为读取的图片    
        data.image = event.target.result;
    };
    reader.readAsDataURL(file);
}



$(function(){
    $.edit.fileBrowser("#img_url", "#img_urlTxt", "#img_urlDiv");

    if (config.showCtl && config.autocomplete==2) {
        $(".mapboxgl-ctrl-geocoder").css({"margin-top": "-170px", "margin-right": "50px"});
    }
    if (config.autocomplete==3) {
        $("#lnglat, #btn-query").css("display", "none");
        $("#lnglat").attr("id", "lnglat-origin");
        $("#input-item").removeClass("input-item");
        $(".mapboxgl-ctrl-geocoder--input").attr("id", "lnglat");
        $(".mapboxgl-ctrl-geocoder .suggestions").css({"bottom":"40px", "top": "auto"});
    }
});