import {
    map
} from './script.js';
import {
    getScale
} from './sensor.js';

let zoomLevel = -1;

//Get marker data from server
function getMarkerData() {
    let url = "http://192.168.8.149:8080/UAVFusionPOC/rest/fusion/detection/all"; //url of service

    fetch(url)
        .then(res => res.json())
        .then(data => {
            makeMarkerSvg(data);
            makeSidebarData(data);
        })
        .catch(err => console.log(err));
}

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
        .html(function (d) {
            let height = Math.round(d.domain.height)
            return `${height} m`
        })
    // circle.append('text')
    //     .attr('class', 'markerText1')
    //     .attr('x', 18)
    //     .attr('y', 15)
    // svgContainer.selectAll('text')
    //     .html(function (d) {
    //         let height = Math.round(d.domain.height)
    //         return `${height} m`
    //     })
    // svgContainer.selectAll('.markerText1')
    //     .text(function (d) {
    //         let id = d.id
    //         return `${id}`
    //     })

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
        .attr("stroke-width", zoom());
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
        d3
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
        svgContainer.attr("transform-origin", (d) => {
            return `
                0 0 `;
        });
    }
}

function zoom() {
    let strokeW = [9, 8.5, 8, 7.5, 7, 6.5, 6, 5.5, 5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1, 0.5]
    var zoom = map.getZoom();
    let width = strokeW[zoom - 1];
    return width;
}

var colorScale = d3.scaleLinear()
    .domain([0, 150])
    .range(["red", "white"]);

function makeSidebarData(input) {

    let item = d3
        .select(".uavData")
        .selectAll("p")
        .data(input, d => {
            return d.id;
        });

    item.exit().remove();

    let newItem = item.enter().append("p");
    item = newItem.merge(item);
    item.html(function (d) {

        let type = checkType(d);

        function checkType(d) {
            if (d.type == null) {
                return 'ismeretlen';
            }
            return d.type;
        }

        return `ID: ${d.id} <br>
                    Magasság: ${Math.round(d.domain.height)} m <br>
                    Típus: ${type}`;
    })

}

export {
    getMarkerData,
    zoom
}