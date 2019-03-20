import * as sensor from './sensor.js';
import * as marker from './marker.js';

// Set map view
let map = L.map("map").setView([47.529349, 19.032751], 11);

// if zoom repositioning svg
map.on("zoom", function () {
    sensor.positionSvgContainer();
});

map.on("zoomstart", function() {
    debug();
});

var debug = function () {
    var count = 0;
    
    setTimeout(
            function () {
                
                d3.selectAll('.leaflet-tile-container').each(
                        function (d, i) {
                            var sty = this.style.transform;
                            var repl = sty.replace(/.*scale\((.*)\).*/, '$1');
                            if (repl !== "1") {
                                console.log(sty, repl);
                                sensor.prePositionSvgContainer(repl);                    
                            }
                        }
                );

               
            
            }

    , 1)
    
//
//    var deb = setInterval(
//            function () {
//                count++;
//                if (count > 100) {
//                    clearInterval(deb);
//                }
//                d3.selectAll('.leaflet-tile-container').each(
//                        function (d, i) {
//                            console.log(this, d, i)
//                        }
//                );
//
//
//
//            }
//
//    , 10)

}

// set server request interval
setInterval(() => {
    marker.getMarkerData();
    sensor.getSensorSVGData();
    sensor.getSensorData();
}, 100);

//set maps layer
L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

//console.log click latlng + pixel points
map.on("click", function (e) {
    let coord = e.latlng;
    let lat = coord.lat;
    let lng = coord.lng;
    let xy = map.latLngToLayerPoint(e.latlng);
    console.log(
            "You clicked the map at latitude: " +
            lat +
            " and longitude: " +
            lng +
            " xy:" +
            xy
            );
});

export {
map
        }