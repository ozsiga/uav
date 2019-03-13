import {
    map
} from './script.js';

//Set markers default value

// let marker1 = L.marker([47.529349, 19.032751]).addTo(map);
// let marker2 = L.marker([47.52936, 19.03276]).addTo(map);


//Get marker data from server
function getMarkerData() {
    let url = "http://192.168.8.149:8080/UAVServerPOC/rest/fake"; //url of service
    let xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onload = () => {
        if (xhr.status === 200) {

            // Kapott adatok feldolgozása
            let markerData = JSON.parse(xhr.responseText).data;
            let markerLatLon = [];
            let coords = markerData.map(data => Object(data.position));

            for (let i = 0; i < coords.length; i++) {
                if (isNumeric(coords[i].latitude) && isNumeric(coords[i].longitude)) {
                    markerLatLon.push([coords[i].latitude, coords[i].longitude]);
                }
            }

            // Meglévő markerek kigyűjtése
            //markersInMap a tömb a fentlévő markerekkel
            var markersInMap = getFeaturesInView(map)
            //console.log(markersInMap, markerData);
            // Meglévő markerekből a nem megkapottak levétele
            for (let i = 0; i < markersInMap.length; i++) {
                var found = false;
                for (let k = 0; k < markerData.length; k++) {
                    //console.log(markerData[k]);
                    if (markersInMap[i].options.customId == markerData[k].id) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    map.removeLayer(markersInMap[i])
                }
            }

            // Megkapott, de fent nem lévő markerek létrehozása, térkééhez adása
            for (let k = 0; k < markerData.length; k++) {
                var matchedMarker = undefined;
                for (let i = 0; i < markersInMap.length; i++) {
                    if (markersInMap[i].options.customId == markerData[k].id) {
                        matchedMarker = markersInMap[i];
                        break;
                    }
                }
                if (matchedMarker == undefined) {
                    let marker = L.marker(markerLatLon[k], {
                        customId: markerData[k].id
                    });
                    marker.addTo(map)


                } else {
                    matchedMarker.setLatLng(markerLatLon[k]);
                }
            }

            //add droneMarkerIcon class to uavs

            // let l = document.getElementsByClassName("leaflet-marker-icon");
            // for (let k = 0; k < llMarkers.length; k++) {
            //     llMarkers[k].classList.add("droneMarkerIcon");
            // }


            //A meglévő markerek pozicionálása, nyíl kirajzolása
            setMarkerSvg(markerData);

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
    let uav = document.getElementsByClassName("droneMarkerIcon");
    let line = document.getElementsByClassName("lineSvg");
    for (let i = 0; i < uav.length; i++) {
        for (let k = 0; k < line.length; k++) {

            line[k].style.transform =
                uav[i].style.transform +
                " translate(" +
                -offsetX +
                "px ," +
                -offsetY +
                "px)";
            line[k].style.marginTop = -20.5;
            line[k].style.marginLeft = 9;
        }
    }
}

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

//function getMarkerByCustomId(id) {}

// get all marker from layer

function getFeaturesInView(map) {
    var markersInMap = [];
    map.eachLayer(function (layer) {
        //console.log(layer);
        if (layer instanceof L.Marker) {
            if (layer.options.customId) {
                markersInMap.push(layer);
                //      console.log(layer.options.customId);
            }
        }
    });
    return markersInMap;
}

export {
    getMarkerData,
    getFeaturesInView
}