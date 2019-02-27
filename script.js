// Set map view
let map = L.map("map").setView([47.529349, 19.032751], 11);
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
map.on("zoom", function() {
  var svgContainer = d3.select(map.getPanes().overlayPane).select("svg");
  var g = svgContainer.selectAll("g");
  positionSvgContainer();
  setPosition(g);
});

function positionSvgContainer() {
  var svgContainer = d3.select(map.getPanes().overlayPane).select("svg");
  var tr = d3
    .selectAll(".leaflet-map-pane")
    .style("transform")
    .split(",");
  var tx = -1 * tr[0].match(/-*\d+px/)[0].match(/-*\d+/)[0];
  var ty = -1 * tr[1].match(/-*\d+px/)[0].match(/-*\d+/)[0];
  var height = svgContainer.attr("height");
  var width = svgContainer.attr("width");
  svgContainer.style(
    "transform",
    "translate3d(" + tx + "px, " + ty + "px, 0px)"
  );
  svgContainer.attr("viewBox", tx + " " + ty + " " + width + " " + height);
}

//Set markers default value
let marker1 = L.marker([47.529349, 19.032751]).addTo(map);
let marker2 = L.marker([47.52936, 19.03276]).addTo(map);

let sensor1;
let sensor2;
let sensor3;

let sensorIcon = L.icon({
  iconUrl: "./img/sensor-icon.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

// set server request interval
setInterval(() => {
  getMarkerData();
}, 1);

getSensorData();

//set maps layer
L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

//set maps default bounds
// map.fitBounds([
//     [sensor1.getBounds()],
//     [sensor2.getBounds()]
// ], );

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

      pixelPosition = map.latLngToLayerPoint(sensorsLatLon[1]);
      //console.log(" LatLng = " + sensorsLatLon[1] + "\n Pixel position = " + pixelPosition);

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
  element.width = (rmax - rmin) / 2;
  //console.log(element)
  return element;
}

function interpol(min, max, n, i) {
  return min + (i * (max - min)) / n;
}

function igazi(sensorData, n) {
  var svgContainer = d3.select(map.getPanes().overlayPane).append("svg");
  d3.select("svg")
    .attr("z-index", 1000)
    .attr("height", 686)
    .attr("width", 1162)
    .attr("id", "mr");
  var g = svgContainer.selectAll("g").data(sensorData, d => {
    return d.id;
  });
  //console.log(map.latLngToLayerPoint((map.getSize())));
  g.exit().remove();
  let newG = g.enter().append("g");
  g = newG.merge(g);

  setPosition(g);
  // g.attr("class", "svgG")
  //     .attr("transform-origin", function (d) {
  //         var sensorLL = [d.domain.cordinate.latitude, d.domain.cordinate.longitude];
  //         //console.log(map.latLngToLayerPoint(sensorLL))
  //         return (map.latLngToLayerPoint(sensorLL).x) + " " + (map.latLngToLayerPoint(sensorLL).y);
  //     })
  //     .attr("transform", function (d) {
  //         var sensorLL = [d.domain.cordinate.latitude, d.domain.cordinate.longitude];
  //         //console.log(map.latLngToLayerPoint(sensorLL))
  //         return "scale(0.1, 0.1), translate(" + (map.latLngToLayerPoint(sensorLL).x) + " " + (map.latLngToLayerPoint(sensorLL).y) + ")";
  //     });
  for (i = 0; i < n; i++) {
    var path = g
      .append("path")
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("opacity", "0.1")
      .attr("stroke-width", 500 + i)
      .attr("d", function(d) {
        //console.log(getSensorPath(d.domain, n, i))
        return getSensorPath(d.domain, n, i);
      });
  }
}

function setPosition(g) {
  g.attr("class", "svgG")
    .attr("transform-origin", function(d) {
      var sensorLL = [
        d.domain.cordinate.latitude,
        d.domain.cordinate.longitude
      ];
      //console.log(map.latLngToLayerPoint(sensorLL))
      return (
        map.latLngToLayerPoint(sensorLL).x +
        " " +
        map.latLngToLayerPoint(sensorLL).y
      );
    })
    .attr("transform", function(d) {
      var sensorLL = [
        d.domain.cordinate.latitude,
        d.domain.cordinate.longitude
      ];
      //console.log(map.latLngToLayerPoint(sensorLL))
      return (
        "scale(0.08, 0.08), translate(" +
        map.latLngToLayerPoint(sensorLL).x +
        " " +
        map.latLngToLayerPoint(sensorLL).y +
        ")"
      );
    });
}

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

  return element1.d;
}

// function resetView() {
//   var svgContainer = d3.select(map.getPanes().overlayPane).select("svg");
//   console.log(svgContainer);
//   bounds = [
//     [map.getBounds()._southWest.lat, map.getBounds()._southWest.lng],
//     [map.getBounds()._northEast.lat, map.getBounds()._northEast.lng]
//   ];

//   var bottomLeft = map.project(bounds[0]);
//   var topRight = map.project(bounds[1]);

//   svgContainer
//     .attr("width", topRight.x - bottomLeft.x)
//     .attr("height", bottomLeft.y - topRight.y)
//     .attr("transform", "translate(" + -bottomLeft.x + "," + -topRight.y + ")")
//     .style("margin-left", bottomLeft.x + "px")
//     .style("margin-top", topRight.y + "px");
// }
