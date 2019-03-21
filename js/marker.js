import {
    map
} from './script.js';
import {
    getScale
} from './sensor.js';


let zoomLevel = -1;

function makeSidebarData(input) {

    let item = d3
        .select(".uavData")
        .selectAll("li")
        .data(input, d => {
            return d.id;
        });

    item.exit().remove();

    let newItem = item.enter().append("li");
    item = newItem.merge(item);
    item.text(function (d) {
        return d.id;
    });

}

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

            //A meglévő markerek pozicionálása, nyíl kirajzolása
            makeMarkerSvg(markerData)
            makeSidebarData(markerData);

        } else {
            let e = new Error("HTTP Request");
            console.log(e, xhr.status);
        }
    };
    xhr.send();
}

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

var colorScale = d3.scaleLinear()
    .domain([0, 150])
    .range(["red", "white"]);


function makeMarkerSvg(input) {
    let svg = d3
        .select(".leaflet-pane")
        .selectAll("svg.lineSvg")
        .data(input, d => {
            return d.id;
        });

    let svgContainer = d3
        .select(".leaflet-pane")
        .selectAll("svg.droneSvg")
        .data(input, d => {
            return d.id;
        });
    svg.exit().remove();
    svgContainer.exit().remove();
    let offsetX = 400;
    let offsetY = 400;
    let newSvg = svgContainer.enter().append("svg");
    newSvg.attr("class", "droneSvg");
    newSvg.attr("customId", function (d) {
        return d.id;
    })
    newSvg.style("width", 50);
    newSvg.style("height", 50);
    newSvg.style("z-index", 1500);
    svgContainer = newSvg.merge(svgContainer);
    svgContainer.style("transform", function (d) {
            let droneLL = [
                d.domain.coordinate.latitude,
                d.domain.coordinate.longitude
            ];
            return (
                "translate3d(" +
                (map.latLngToLayerPoint(droneLL).x) +
                "px, " +
                (map.latLngToLayerPoint(droneLL).y) +
                "px, 0px)"
            );
        })
        .style("margin-top", -25)
        .style("margin-left", -25)
    let circle = newSvg.append('g')
        .attr('class', 'circle')
        .attr("width", 50)
        .attr("height", 50);
    circle.append("circle")
        .attr("cx", 25)
        .attr("cy", 25)
        .attr("r", 6)
        .attr('fill', function (d) {
            return colorScale(d.domain.height);
        })
        .attr('opacity', 1)
        .attr('stroke', 'white')
        .attr('stroke-width', '1')
        .style("z-index", 1500)
        .append("svg:title")
        .text(function (d) {
            let height = Math.round(d.domain.height);
            return `Height: ${height} m \nDetected by sensor #${d.detectors} \nDrone id: ${d.id}`;
        });
    circle.append('text')
        .attr('class', 'markerText')
        .attr('x', 16)
        .attr('y', 42)
    svgContainer.selectAll('text')
        .text(function (d) {
            let height = Math.round(d.domain.height)
            return `${height} m`
        })
    let newSvg1 = svg.enter().append("svg");
    newSvg1.attr("class", "lineSvg");
    newSvg1.attr("width", 2 * offsetX);
    newSvg1.attr("height", 2 * offsetY);

    newSvg1.style("z-index", 900);
    newSvg1.append("line");
    svg = newSvg1.merge(svg);

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
        .attr("stroke", "#000")
        .attr("stroke-width", 1.5);
    //.attr("marker-end", "url(#arrow)");
    svg
        .style("transform", function (d) {
            let droneLL = [
                d.domain.coordinate.latitude,
                d.domain.coordinate.longitude
            ];
            return (
                "translate3d(" +
                (map.latLngToLayerPoint(droneLL).x - 400) +
                "px, " +
                (map.latLngToLayerPoint(droneLL).y - 400) +
                "px, 0px)"
            );
        })
    if (newSvg1 !== null) {
        positionArrowSvg();
        zoomLevel = -1;
    }
}

function positionArrowSvg() {
    if (zoomLevel !== map.getZoom()) {
        zoomLevel = map.getZoom();

        let svgContainer = d3.select(map.getPanes().mapPane).selectAll(".lineSvg");
        let tr = d3
            .selectAll(".leaflet-map-pane")
            .style("transform")
            .split(",");

        svgContainer.style("transform", function (d) {
            let width = d3.select(this).attr("width");
            let droneLL = [
                d.domain.coordinate.latitude,
                d.domain.coordinate.longitude
            ];

            return (
                "translate3d(" +
                map.latLngToLayerPoint(droneLL).x +
                "px, " +
                map.latLngToLayerPoint(droneLL).y +
                "px, 0px) scale(" +
                getScale() +
                ") translate3d(" +
                (width / 2) * -1 +
                "px, " +
                (width / 2) * -1 +
                "px, 0px)"
            );
        });
        svgContainer.attr("transform-origin", function (d) {
            let droneLL = [
                d.domain.coordinate.latitude,
                d.domain.coordinate.longitude
            ];
            return `0 0`;
        });

    }


}


export {
    getMarkerData
}