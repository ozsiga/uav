// Set map view
let map = L.map("map").setView([47.529349, 19.032751], 11);

// if zoom repositioning svg
map.on("zoom", function() {
  var svgContainer = d3.select(map.getPanes().overlayPane).selectAll("svg");
  var svg = svgContainer.selectAll("svg");
  positionSvgContainer();
});

//Set markers default value
let marker1 = L.marker([47.529349, 19.032751]).addTo(map);
let marker2 = L.marker([47.52936, 19.03276]).addTo(map);

//sensor markers
let sensor1;
let sensor2;
let sensor3;
//sensor icon
let sensorIcon = L.icon({
  iconUrl: "./img/sensor-icon.png",
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

// set server request interval
setInterval(() => {
  getMarkerData();
}, 100);
getSensorData();

//set maps layer
L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

//Get marker data from server
function getMarkerData() {
  let url = "http://localhost:8080/UAVServerPOC/rest/fake"; //url of service
  let xhr = new XMLHttpRequest();
  xhr.open("GET", url);
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
      let e = new Error("HTTP Request");
      error(e, xhr.status);
    }
  };
  xhr.send();
}

// Set SVG arrow to markers
function setMarkerSvg(input) {
  //initialize svg
  let svg = d3
    .select(".leaflet-pane")
    .selectAll("svg.lineSvg")
    .data(input, d => {
      return d.id;
    });

  svg.exit().remove();

  let offsetX = 200;
  let offsetY = 200;

  let newSvg = svg.enter().append("svg");
  newSvg.attr("class", "lineSvg");
  newSvg.style("width", 2 * offsetX);
  newSvg.style("height", 2 * offsetY);

  newSvg.style("z-index", 1000);
  newSvg.append("line");
  svg = newSvg.merge(svg);

  svg
    .select("line")
    .attr("x1", offsetX)
    .attr("y1", offsetY)
    .attr("x2", d => {
      return offsetX + d.speed.x;
    })
    .attr("y2", d => {
      return offsetY - d.speed.y;
    })
    .attr("stroke", "red")
    .attr("stroke-width", 2)
    .attr("marker-end", "url(#arrow)");

  // bind line to marker icon
  setTimeout(() => {
    let uav = document.getElementsByClassName("droneMarkerIcon");
    let line = document.getElementsByClassName("lineSvg");
    for (let i = 0; i < uav.length; i++) {
      line[i].style.transform =
        uav[i].style.transform +
        " translate(" +
        -offsetX +
        "px ," +
        -offsetY +
        "px)";
      line[i].style.marginTop = -20.5;
      line[i].style.marginLeft = 9;
    }
  }, 50);
}

// Check if values are numeric
function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

// Get sensor data from server
function getSensorData() {
  let url = "http://localhost:8080/UAVServerPOC/rest/sensor/all";
  let xml = new XMLHttpRequest();
  xml.open("GET", url);
  xml.onload = () => {
    if (xml.status === 200) {
      let sensorData = JSON.parse(xml.responseText).sensors;
      let sensorsLatLon = [];
      let coords = sensorData.map(data => Object(data.domain.cordinate));

      for (let i = 0; i < coords.length; i++) {
        sensorsLatLon.push([coords[i].latitude, coords[i].longitude]);
      }

      sensor1 = L.marker(sensorsLatLon[0], {
        icon: sensorIcon
      }).addTo(map);

      sensor2 = L.marker(sensorsLatLon[1], {
        icon: sensorIcon
      }).addTo(map);

      sensor3 = L.marker(sensorsLatLon[2], {
        icon: sensorIcon
      }).addTo(map);

      igazi(sensorData, 10);
    } else {
      let e = new Error("HTTP Request");
      error(e, xml.status);
    }
  };
  xml.send();

  //add droneMarkerIcon class to uavs

  llMarkers = document.getElementsByClassName("leaflet-marker-icon");
  for (var k = 0; k < llMarkers.length; k++) {
    llMarkers[k].classList.add("droneMarkerIcon");
  }
}

//create circular sector svg from sensor data

function elemikorcikk(rmin, rmax, minAng, maxAng, x, y) {
  x = 0;
  y = 0;
  var element = {};
  radius = rmin + (rmax - rmin) / 2;
  startx = radius * Math.cos(minAng) + x;
  starty = -radius * Math.sin(minAng) - y;
  endx = radius * Math.cos(maxAng) + x;
  endy = -radius * Math.sin(maxAng) - y;
  if (maxAng - minAng == Math.PI) {
    maxAng = maxAng + 0.00000001;
  }
  largeArcFlag = maxAng - minAng <= Math.PI ? "0" : "1";
  element.d = [
    "M",
    startx,
    starty,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    endx,
    endy
  ].join(" ");
  return element;
}

function interpol(min, max, n, i) {
  return min + (i * (max - min)) / n;
}

//Create all mrSvgs->groups->paths

function getScale() {
  var pB = map.getPixelBounds();
  var b = map.getBounds();
  var atloinPixel = Math.sqrt(
    (pB.max.x - pB.min.x) * (pB.max.x - pB.min.x) +
      (pB.max.y - pB.min.y) * (pB.max.y - pB.min.y)
  );
  return atloinPixel / map.distance(b._southWest, b._northEast);
}

function igazi(sensorData, n) {
  var svgContainer = d3.select(map.getPanes().overlayPane);

  var svg = svgContainer.selectAll("svg").data(sensorData, d => {
    return d.id;
  });

  svg.exit().remove();
  var newSvg = svg.enter().append("svg");
  svg = newSvg.merge(svg);
  svg.attr("viewBox", function(d) {
    var rMax = d.domain.r.max0 * Math.cos(d.domain.theta.min0);
    return " " + -rMax + " " + -rMax + " " + 2 * rMax + " " + 2 * rMax;
  });
  svg
    .attr("z-index", 1000)
    .attr("height", function(d) {
      var rMax = d.domain.r.max1 * Math.cos(d.domain.theta.min0);
      return 2 * rMax;
    })
    .attr("width", function(d) {
      var rMax = d.domain.r.max1 * Math.cos(d.domain.theta.min0);
      return 2 * rMax;
    })
    .attr("id", "mr");

  svg.each(function(d, i) {
    var path = d3
      .select(this)
      .selectAll("path")
      .data(new Array(n + 1));
    path.exit().remove();
    let newPath = path.enter().append("path");
    path = newPath.merge(path);
    path
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("opacity", "0.1")
      .attr("stroke-width", function(d2, i) {
        //console.log(sensorData);
        return getSensorPathWidth(d.domain, n, i);
      })
      .attr("d", function(d2, i) {
        return getSensorPath(d.domain, n, i);
      });
  });
}

function getSvgOffsetToCenterPoint(pointX, svgWidth, svgScale) {
  //return ( ( svgWidth / 2 ) - pointX ) / svgScale;
  var initialPositionScaled = svgScale * pointX;
  var desiredPosition = svgWidth / 2;
  return (desiredPosition - initialPositionScaled) * -1;
}

// set svg container position to leaflet-map-pane position
function positionSvgContainer() {
  var svgContainer = d3.select(map.getPanes().overlayPane).selectAll("svg");
  var tr = d3
    .selectAll(".leaflet-map-pane")
    .style("transform")
    .split(",");
  var tx = -1 * tr[0].match(/-*\d+\.*\d*px/)[0].match(/-*\d+\.*\d*/)[0];
  var ty = -1 * tr[1].match(/-*\d+\.*\d*px/)[0].match(/-*\d+\.*\d*/)[0];
  var height = svgContainer.attr("height");
  var width = svgContainer.attr("width");
  svgContainer.style(
    "transform",
    "scale(" +
      getScale() +
      ") translate3d(" +
      getSvgOffsetToCenterPoint(tx, width, getScale()) +
      "px, " +
      getSvgOffsetToCenterPoint(ty, height, getScale()) +
      "px, 0px)"
  );
  svgContainer
    //.attr("class", "svgSVG")
    .attr("transform-origin", function(d) {
      var sensorLL = [
        d.domain.cordinate.latitude,
        d.domain.cordinate.longitude
      ];
      //console.log(map.latLngToLayerPoint(sensorLL));
      return (
        map.latLngToLayerPoint(sensorLL).x +
        " " +
        map.latLngToLayerPoint(sensorLL).y
      );
    });
}

//calculate svg paths from sensor data

function getSensorPath(domain, n, i) {
  var rmin0 = domain.r.min0 * Math.cos(domain.theta.min0);
  var rmin1 = domain.r.min1 * Math.cos(domain.theta.min0);
  var rmax0 = domain.r.max0 * Math.cos(domain.theta.min0);
  var rmax1 = domain.r.max1 * Math.cos(domain.theta.min0);
  var angMin0 = domain.fi.min0;
  var angMin1 = domain.fi.min1;
  var angMax0 = domain.fi.max0;
  var angMax1 = domain.fi.max1;

  //var pathArr = [];
  element1 = elemikorcikk(
    interpol(rmin0, rmin1, n, i),
    interpol(rmax0, rmax1, n, i),
    interpol(angMin0, angMin1, n, i),
    interpol(angMax0, angMax1, n, i),
    0,
    0
  );
  //console.log(element1.d);
  return element1.d;
}
function getSensorPathWidth(domain, n, i) {
  var rmin0 = domain.r.min0 * Math.cos(domain.theta.min0);
  var rmin1 = domain.r.min1 * Math.cos(domain.theta.min0);
  var rmax0 = domain.r.max0 * Math.cos(domain.theta.min0);
  var rmax1 = domain.r.max1 * Math.cos(domain.theta.min0);
  var width = interpol(rmax0, rmax1, n, i) - interpol(rmin0, rmin1, n, i);
  //console.log(n, i, rmin0, rmin1, rmax0, rmax1, width);
  return width;
}

//console.log click latlng + pixel points
map.on("click", function(e) {
  var coord = e.latlng;
  var lat = coord.lat;
  var lng = coord.lng;
  var xy = map.latLngToLayerPoint(e.latlng);
  console.log(
    "You clicked the map at latitude: " +
      lat +
      " and longitude: " +
      lng +
      " xy:" +
      xy
  );
});
