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


        var svg = d3.select('.leaflet-pane').selectAll("svg").data(input.data, function (d) {
            return d.id
        });

        svg.exit().remove();


        var offsetX = 200;
        var offsetY = 200;

        var newSvg = svg.enter().append("svg");
        newSvg.style("width", 2 * offsetX);
        newSvg.style("height", 2 * offsetY);

        newSvg.style("z-index", 1000)
        newSvg.append("line");
        svg = newSvg.merge(svg);



        svg.select("line")
            .attr("x1", offsetX)
            .attr("y1", offsetY)
            .attr("x2", function (d) {
                return offsetX + d.speed.x ;
            })
            .attr("y2", function (d) {
                return offsetY -d.speed.y ;
            })
            .attr("stroke", "red")
            .attr("stroke-width", 2)

            
            
            setTimeout(function(){
                var uav = document.getElementsByClassName('leaflet-marker-icon');
             var line = document.getElementsByTagName("svg");
             for (var i = 0; i < uav.length; i++) {
                 line[i].style.transform = uav[i].style.transform + " translate(" + -offsetX + "px ," + -offsetY + "px)";      
                 line[i].style.marginTop = uav[i].style.marginTop ;      
                 line[i].style.marginLeft = uav[i].style.marginLeft ;
                 line[i].style.position = "absolute" ;     
                 console.log(uav[i].style);
                 console.log(line[i].style);
                };
            }, 50);
            
        //return the GeoJSON FeatureCollection
        return fs;
    }

    function isNumeric(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }
}