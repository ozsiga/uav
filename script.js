var map = L.map('map').setView([47.529349, 19.032751], 10)
// realtime = L.realtime(getCustomData, {
//     interval: 0.1 * 1000

// }).addTo(map);

setInterval(() => {
    getCustomData();
}, 100);

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

map.fitBounds([
    [47.52934912, 19.03275112],
    [47.77412312, 19.12512312]
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

let marker1 = L.marker([47.529349, 19.032751]).addTo(map);
let marker2 = L.marker([47.529360, 19.032760]).addTo(map);


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

    setTimeout(() => {
        var uav = document.getElementsByClassName('leaflet-marker-icon');
        var line = document.getElementsByTagName("svg");
        for (var i = 0; i < uav.length; i++) {
            line[i].style.transform = uav[i].style.transform + " translate(" + -offsetX + "px ," + -offsetY + "px)";
            line[i].style.marginTop = -22;
            line[i].style.marginLeft = 9;
        };
    }, 50);

    // //return the GeoJSON FeatureCollection
    var fsFeatures = fs.features;
    // //console.log(fsFeatures) // lat, long, id

    marker1.setLatLng(getMarkerLatLon(fsFeatures, 0));
    marker2.setLatLng(getMarkerLatLon(fsFeatures, 1));

    return fsFeatures;
}

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function getMarkerLatLon(fs, i) {
    var latlon = [];
    latlon.push(fs[i].properties.latitude, fs[i].properties.longitude);
    // console.log(latlon)
    return latlon;
}