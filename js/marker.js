//Get marker data from server
function getMarkerData(marker1, marker2) {
    let url = "http://192.168.8.149:8080/UAVServerPOC/rest/fake"; //url of service
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

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

export {
    getMarkerData
}