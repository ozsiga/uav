var map = L.map('map').setView([47.529349, 19.032751], 10),
    realtime = L.realtime(getCustomData, {
        interval: 0.1 * 1000
    }).addTo(map);

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

map.fitBounds([
    [47.52934912, 19.03275112],
    [47.77412312, 19.12512312]
], );

//Get data from server

function getCustomData(success, error) {
    let url = "http://localhost:8080/UAVServerPOC/rest/fake"; //url of service
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = function () {
        if (xhr.status === 200) {
            var res = convertToGeoJSON(xhr.responseText);
            success(res);
        } else {
            var e = new Error("HTTP Rquest")
            error(e, xhr.status);
        }
    };
    xhr.send();



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
                    "coordinates": [ele['lon'], ele['lat']]
                }
            };


            feature.properties = ele;
            //set the id
            feature.properties["id"] = i;
            //check that the elements are numeric and only then insert
            if (isNumeric(ele['lon']) && isNumeric(ele['lat'])) {
                //add this feature to the features array
                fs.features.push(feature)
            }
        }


        var svg = d3.select('#svgview').selectAll("svg").data(input.data, function (d) {
            return d.id
        });

        svg.exit().remove();

        var newSvg = svg.enter().append("svg");
        newSvg.attr("z-index", 1000)
        newSvg.append("line");
        svg = newSvg.merge(svg);



        svg.select("line")
            .attr("x1", 10)
            .attr("y1", 10)
            .attr("x2", function (d) {
                return d.speed.x * 30
            })
            .attr("y2", function (d) {
                return d.speed.y * 30
            })
            .attr("stroke", "red")
            .attr("stroke-width", 2)

        //return the GeoJSON FeatureCollection

        return fs;
    }

    function isNumeric(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

}

const uav = document.getElementsByClassName('leaflet-marker-icon');
const line = document.getElementsByTagName("line")



for (let i = 0; i < uav.length; i++) {
    console.log(uav[i]);
}
for (let k = 0; k < line.length; k++) {
    console.log(line[k]);
}


console.log(uav)
console.log(line)