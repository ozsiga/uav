// Set map view
var map = L.map('map').setView([47.529349, 19.032751], 11);

//Set markers default value
let marker1 = L.marker([47.529349, 19.032751]).addTo(map);
let marker2 = L.marker([47.529360, 19.032760]).addTo(map);


let sensor1;
let sensor2;
let sensor3;
var sector1;
var sector2;
var sector3;

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



function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;
  
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  }
  
  function describeArc(x, y, radius, startAngle, endAngle){
  
      var start = polarToCartesian(x, y, radius, endAngle);
      var end = polarToCartesian(x, y, radius, startAngle);
  
      var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  
      var d = [
          "M", start.x, start.y, 
          "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
      ].join(" ");
  
      return d;       
  }
  
  

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


    //initialize svg
    var svg = d3.select('.leaflet-pane').selectAll("svg.lineSvg").data(input.data, (d) => {
        return d.id
    });

    svg.exit().remove();

    var offsetX = 200;
    var offsetY = 200

    var newSvg = svg.enter().append("svg");
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
        var uav = document.getElementsByClassName('droneMarkerIcon');
        var line = document.getElementsByClassName("lineSvg");
        for (var i = 0; i < uav.length; i++) {
            line[i].style.transform = uav[i].style.transform + " translate(" + -offsetX + "px ," + -offsetY + "px)";
            line[i].style.marginTop = -20.5;
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
            let sensorsLatLon = []
            let coor = sensorData.map(data => Object(data.domain.cordinate))
            for (var i = 0; i < coor.length; i++) {
                sensorsLatLon.push([coor[i].latitude, coor[i].longitude]);
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
function elemikörcikk (rmin, rmax, minAng, maxAng, x,y){
    //console.log(rmax, rmin)
    x = 0;
    y= 0;
    var element = {};
    radius = rmin + (rmax - rmin) /  2
    startx = radius * Math.cos(minAng) + x;
    starty = - radius * Math.sin(minAng) - y;
    endx = radius * Math.cos(maxAng) + x;
    endy = - radius * Math.sin(maxAng) - y;
    if(maxAng - minAng == Math.PI){
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
function interpol (min, max, n, i){
   return min + i * ( max - min ) / n 
}
function szenzorRajz(domain, n){
        var rmin0 = domain.r.min0 * Math.cos(domain.theta.min0);
        var rmin1 = domain.r.min1 * Math.cos(domain.theta.min0);
        var rmax0 = domain.r.max0 * Math.cos(domain.theta.min0);
        var rmax1 = domain.r.max1 * Math.cos(domain.theta.min0);
        var angMin0 = domain.fi.min0;
        var angMin1 = domain.fi.min1;
        var angMax0 = domain.fi.max0;
        var angMax1 = domain.fi.max1;
        // xy = map.latLngToLayerPoint(sensorsLatLon);
        for(var i =0 ; i <= n; i++){
          element1 = elemikörcikk(interpol(rmin0, rmin1, n ,i), interpol(rmax0, rmax1, n, i ), interpol(angMin0, angMin1, n ,i), interpol(angMax0, angMax1, n ,i),100,100)
          document.getElementById('arc' + i).setAttribute("d", element1.d)
          document.getElementById('arc' + i).setAttribute("stroke-width", element1.width)
        }
    }

 