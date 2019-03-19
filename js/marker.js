import {
    map
} from './script.js';

//Get marker data from server
function getMarkerData() {
    let url = "http://192.168.8.149:8080/UAVFusionPOC/rest/fusion/detection/all"; //url of service
    let xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onload = () => {
        if (xhr.status === 200) {

            // Kapott adatok feldolgozása
            let markerData = JSON.parse(xhr.responseText);
            let markerLatLon = [];
            let coords = markerData.map(data => Object(data.domain.coordinate));

            for (let i = 0; i < coords.length; i++) {
                if (isNumeric(coords[i].latitude) && isNumeric(coords[i].longitude)) {
                    markerLatLon.push([coords[i].latitude, coords[i].longitude]);
                }
            }

            // Meglévő markerek kigyűjtése
            //markersInMap a tömb a fentlévő markerekkel
            var markersInMap = getMarkersOnMap(map);
            // Meglévő markerekből a nem megkapottak levétele
            for (let i = 0; i < markersInMap.length; i++) {
                var found = false;
                for (let k = 0; k < markerData.length; k++) {
                    if (markersInMap[i].options.customId == markerData[k].id) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    map.removeLayer(markersInMap[i])
                }
            }

            // Megkapott, de fent nem lévő markerek létrehozása, térképhez adása
            for (let k = 0; k < markerData.length; k++) {
                var matchedMarker = undefined;
                for (let i = 0; i < markersInMap.length; i++) {
                    if (markersInMap[i].options.customId == markerData[k].id) {
                        matchedMarker = markersInMap[i];
                        break;
                    }
                }

                if (matchedMarker == undefined) {
                    L.marker(markerLatLon[k], {
                        customId: markerData[k].id
                    }).addTo(map)
                } else {
                    matchedMarker.setLatLng(markerLatLon[k]);
                }

            }

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
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .attr("marker-end", "url(#arrow)");
    svg
        .style("transform", function (d) {
            let droneLL = [
                d.domain.coordinate.latitude,
                d.domain.coordinate.longitude
            ];
            return (
                "translate3d(" +
                (map.latLngToLayerPoint(droneLL).x - 200) +
                "px, " +
                (map.latLngToLayerPoint(droneLL).y - 200) +
                "px, 0px)"
            );
        })
        .style("margin-top", -20.5)
        .style("margin-left", 9)
}

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

// get all marker from layer

function getMarkersOnMap(map) {
    var markersInMap = [];
    map.eachLayer(function (layer) {
        if (layer instanceof L.Marker) {
            if (layer.options.customId) {
                markersInMap.push(layer);
            }
        }
    });
    return markersInMap;
}

export {
    getMarkerData,
    getMarkersOnMap
}