// Set map view
var map = L.map('map').setView([47.529349, 19.032751], 11);

//Set markers default value
let marker1 = L.marker([47.529349, 19.032751]).addTo(map);
let marker2 = L.marker([47.529360, 19.032760]).addTo(map);

let sensor1;
let sensor2;

let sensorIcon = L.icon({
    iconUrl: './img/sensor-icon.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32]
});

// set server request interval
setInterval(() => {
    getCustomData();
}, 1);

getSensorData();

//set maps layer
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);


//set maps default bounds
map.fitBounds([
    [marker1.getBounds()],
    [marker2.getBounds()]
], );

//Get data from server
function getCustomData() {
    let url = "http://localhost:8080/UAVServerPOC/rest/fake"; //url of service
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = () => {
        if (xhr.status === 200) {
            var res = convertToGeoJSON(xhr.responseText);
        } else {
            var e = new Error("HTTP Request")
            error(e, xhr.status);
        }
    };
    xhr.send();
}

//Convert JSON to GeoJson

function convertToGeoJSON(input) {
    //convert input to Object, if it is of type string
    if (typeof (input) == "string") {
        input = JSON.parse(input);
    }

    var fs = {
        "type": "FeatureCollection",
        "features": []
    };
    for (var i = 0; i < input.data.length; i++) {
        var ele = input.data[i].position;
        var feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [ele['longitude'], ele['latitude']]
            }
        };

        feature.properties = ele;

        //set the id
        feature.properties["id"] = input.data[i].id;

        //check that the elements are numeric and only then insert
        if (isNumeric(ele['longitude']) && isNumeric(ele['latitude'])) {
            //add this feature to the features array
            fs.features.push(feature)
        }
    }


    // initialize svg
    var svg = d3.select('.leaflet-pane').selectAll("svg").data(input.data, (d) => {
        return d.id
    });

    svg.exit().remove();

    var offsetX = 200;
    var offsetY = 200

    var newSvg = svg.enter().append("svg");
    newSvg.style("width", 2 * offsetX);
    newSvg.style("height", 2 * offsetY);

    newSvg.style("z-index", 1000)
    newSvg.append("line");
    svg = newSvg.merge(svg);

    svg.select("line")
        .attr("x1", offsetX)
        .attr("y1", offsetY)
        .attr("x2", (d) => {
            return offsetX + d.speed.x;
        })
        .attr("y2", (d) => {
            return offsetY - d.speed.y;
        })
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("marker-end", "url(#arrow)");


    // bind line to marker icon
    setTimeout(() => {
        var uav = document.getElementsByClassName('leaflet-marker-icon');
        var line = document.getElementsByTagName("svg");
        for (var i = 0; i < uav.length; i++) {
            line[i].style.transform = uav[i].style.transform + " translate(" + -offsetX + "px ," + -offsetY + "px)";
            line[i].style.marginTop = -22;
            line[i].style.marginLeft = 9;
        };
    }, 50);


    // set marker latlng 
    var fsFeatures = fs.features;
    var customPopup = "UAV in da MAP<br/><img src='https://media.giphy.com/media/xUA7bcuTndaPQ6jtew/giphy.gif' alt='maptime logo gif' width='350px'/>";

    // specify popup options 
    var customOptions = {
        'maxWidth': '500',
        'className': 'custom'
    }

    //set marker latlng
    marker1.setLatLng(getMarkerLatLon(fsFeatures, 0)) //.bindPopup(customPopup,customOptions).openPopup();
    marker2.setLatLng(getMarkerLatLon(fsFeatures, 1)) //.bindPopup(`${getMarkerLatLon(fsFeatures, 1)}`).openPopup();

    //return the GeoJSON FeatureCollection
    return fsFeatures;
}

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

// get markers latitude and longitude
function getMarkerLatLon(fs, i) {
    var latlon = [];
    latlon.push(fs[i].properties.latitude, fs[i].properties.longitude);
    // console.log(latlon)
    return latlon;
}

//useless
function getAllMarker() {
    var markers = [];
    map.eachLayer(function (layer) {
        if (layer instanceof L.Marker) {
            if (map.getBounds().contains(layer.getLatLng())) {
                markers.push(layer.feature);
            }
        }
    });
    return markers;
}

// Get sensor data from server
function getSensorData() {
    let url = 'http://localhost:8080/UAVServerPOC/rest/sensor/all';
    let xml = new XMLHttpRequest();
    xml.open("GET", url);
    xml.onload = () => {
        if (xml.status === 200) {
            let sensorData = JSON.parse(xml.responseText).sensors;
            let sensorsLatLon = sensorData.map(data => Object.values(data.domain.cordinate));
            console.log(sensorsLatLon);

            sensor1 = L.marker(sensorsLatLon[0], {
                icon: sensorIcon
            }).addTo(map);
            sensor2 = L.marker(sensorsLatLon[1], {
                icon: sensorIcon
            }).addTo(map);
        } else {
            let e = new Error("HTTP Request")
            error(e, xml.status);
        }
    };
    xml.send();
}