// Set map view
let map = L.map('map').setView([47.529349, 19.032751], 11);

//Set markers default value
let marker1 = L.marker([47.529349, 19.032751]).addTo(map);
let marker2 = L.marker([47.529360, 19.032760]).addTo(map);

let sensor1;
let sensor2;
let sensor3;

let sensorIcon = L.icon({
    iconUrl: './img/sensor-icon.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32]
});

// set server request interval
setInterval(() => {
    getMarkerData();
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

//Get marker data from server
function getMarkerData() {
    let url = "http://localhost:8080/UAVServerPOC/rest/fake"; //url of service
    let xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = () => {
        if (xhr.status === 200) {
            let markerData = JSON.parse(xhr.responseText).data;
            let markerLatLon = [];
            let coords = markerData.map(data => Object(data.position));

            for (let i = 0; i < coords.length; i++) {
                if (isNumeric(coords[i].latitude) && isNumeric(coords[i].longitude)) {
                    markerLatLon.push([coords[i].latitude, coords[i].longitude]);
                }
            }

            setMarkerSvg(markerData);

            marker1.setLatLng(markerLatLon[0]);
            marker2.setLatLng(markerLatLon[1]);
        } else {
            let e = new Error("HTTP Request")
            error(e, xhr.status);
        }
    };
    xhr.send();
}

// Set SVG arrow to markers
function setMarkerSvg(input) {
    //initialize svg
    let svg = d3.select('.leaflet-pane').selectAll("svg.lineSvg").data(input, (d) => {
        return d.id
    });

    svg.exit().remove();

    let offsetX = 200;
    let offsetY = 200

    let newSvg = svg.enter().append("svg");
    newSvg.attr('class', 'lineSvg');
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
        let uav = document.getElementsByClassName('droneMarkerIcon');
        let line = document.getElementsByClassName("lineSvg");
        for (let i = 0; i < uav.length; i++) {
            line[i].style.transform = uav[i].style.transform + " translate(" + -offsetX + "px ," + -offsetY + "px)";
            line[i].style.marginTop = -20.5;
            line[i].style.marginLeft = 9;
        };
    }, 50);
}

// Check if values are numeric
function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

// Get sensor data from server
function getSensorData() {
    let url = 'http://localhost:8080/UAVServerPOC/rest/sensor/all';
    let xml = new XMLHttpRequest();
    xml.open("GET", url);
    xml.onload = () => {
        if (xml.status === 200) {
            let sensorData = JSON.parse(xml.responseText).sensors;
            let sensorsLatLon = [];
            let coords = sensorData.map(data => Object(data.domain.cordinate))

            for (let i = 0; i < coords.length; i++) {
                sensorsLatLon.push([coords[i].latitude, coords[i].longitude]);
            }

            sensor1 = L.marker(sensorsLatLon[0], {
                icon: sensorIcon
            }).addTo(map);
            // console.log(sensor1)
            console.log(map.latLngToLayerPoint(sensorsLatLon[1]))

            sensor2 = L.marker(sensorsLatLon[1], {
                icon: sensorIcon
            }).addTo(map);
            sensor3 = L.marker(sensorsLatLon[2], {
                icon: sensorIcon
            }).addTo(map);
            console.log(sensorData)
            szenzorRajz(sensorData[1].domain, 3)

        } else {
            let e = new Error("HTTP Request")
            error(e, xml.status);
        }


    };
    xml.send();

    //add droneMarkerIcon class to uavs

    llMarkers = document.getElementsByClassName('leaflet-marker-icon')
    for (var k = 0; k < llMarkers.length; k++) {
        llMarkers[k].classList.add('droneMarkerIcon');
    }
}

function elemikörcikk(rmin, rmax, minAng, maxAng, x, y) {
    //console.log(rmax, rmin)
    x = 0;
    y = 0;
    var element = {};
    radius = rmin + (rmax - rmin) / 2
    startx = radius * Math.cos(minAng) + x;
    starty = -radius * Math.sin(minAng) - y;
    endx = radius * Math.cos(maxAng) + x;
    endy = -radius * Math.sin(maxAng) - y;
    if (maxAng - minAng == Math.PI) {
        maxAng = maxAng + 0.00000001;
    }
    largeArcFlag = maxAng - minAng <= Math.PI ? "0" : "1";
    element.d = [
        "M", startx, starty,
        "A", radius, radius, 0, largeArcFlag, 0, endx, endy
    ].join(" ");
    element.width = (rmax - rmin) / 2
    //console.log(element)
    return element;
}

function interpol(min, max, n, i) {
    return min + i * (max - min) / n
}

function szenzorRajz(domain, n) {
    var rmin0 = domain.r.min0 * Math.cos(domain.theta.min0);
    var rmin1 = domain.r.min1 * Math.cos(domain.theta.min0);
    var rmax0 = domain.r.max0 * Math.cos(domain.theta.min0);
    var rmax1 = domain.r.max1 * Math.cos(domain.theta.min0);
    var angMin0 = domain.fi.min0;
    var angMin1 = domain.fi.min1;
    var angMax0 = domain.fi.max0;
    var angMax1 = domain.fi.max1;
    // xy = map.latLngToLayerPoint(sensorsLatLon);
    for (var i = 0; i <= n; i++) {
        element1 = elemikörcikk(interpol(rmin0, rmin1, n, i), interpol(rmax0, rmax1, n, i), interpol(angMin0, angMin1, n, i), interpol(angMax0, angMax1, n, i), 100, 100)
        document.getElementById('arc' + i).setAttribute("d", element1.d)
        document.getElementById('arc' + i).setAttribute("stroke-width", element1.width)
    }
}

