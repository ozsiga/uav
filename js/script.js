import * as sensor from './sensor.js';
import * as marker from './marker.js';

// Set map view
let map = L.map("map", {
    zoomAnimation: false
}).setView([47.529349, 19.032751], 11);
//create tooltip div
let tooltipPane = d3.select(map.getPanes().tooltipPane)
tooltipPane
    .style("z-index", 10000)
    .style("display", "none")
    .html(`<div class="tooltip"></div>`)

// if zoom repositioning svg
map.on("zoom", function () {
    marker.setLinezoomWidth();
    marker.setLineLength();
    sensor.positionSvgContainer();
});

map.doubleClickZoom.disable();

// set server request interval
setInterval(() => {
    marker.getMarkerData();
    sensor.getSensorData();
}, 50);

//set maps layer
L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

//console.log click latlng + pixel points
// map.on("click", function (e) {
//     let coord = e.latlng;
//     let lat = coord.lat;
//     let lng = coord.lng;
//     let xy = map.latLngToLayerPoint(e.latlng);
//     console.log(
//         "You clicked the map at latitude: " +
//         lat +
//         " and longitude: " +
//         lng +
//         " xy:" +
//         xy
//     );
// });

export {
    map
}