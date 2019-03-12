import * as marker from './marker.js';
import * as sensor from './sensor.js';

// Set map view
let map = L.map("map").setView([47.529349, 19.032751], 11);

// if zoom repositioning svg
map.on("zoom", function () {
    sensor.positionSvgContainer();
});

//Set markers default value
let marker1 = L.marker([47.529349, 19.032751]).addTo(map);
let marker2 = L.marker([47.52936, 19.03276]).addTo(map);

// set server request interval
setInterval(() => {
    marker.getMarkerData(marker1, marker2);
    sensor.getSensorSVGData();
}, 100);
sensor.getSensorData();

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