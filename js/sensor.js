import {
    map
} from './script.js';

let zoomLevel = -1;

let url = "http://192.168.8.149:8080/UAVFusionPOC/rest/fusion/sensor/all";

function getSensorData() {
    fetch(url)
        .then(response => {
            return response.json();
        })
        .then(data => {
            let sensorData = data.sensors;

            makeSensorIconSvg(sensorData);
        })
        .catch(err => {
            console.log(err);
        });
}

function getSensorSVGData() {
    fetch(url)
        .then(response => {
            return response.json();
        })
        .then(data => {
            let sensorData = data.sensors;
            getSensorSvgPath(sensorData, 10);
        })
        .catch(err => {
            console.log(err);
        });
}

function makeSensorIconSvg(input) {
    let svgContainer = d3
        .select(".leaflet-pane")
        .selectAll("svg.iconSvg")
        .data(input, d => {
            return d.id;
        });

    svgContainer.exit().remove();
    let newSvg = svgContainer.enter().append("svg");
    newSvg.attr("class", "iconSvg");
    newSvg.style("width", 50);
    newSvg.style("height", 50);
    newSvg.style("z-index", 1500);
    svgContainer = newSvg.merge(svgContainer);
    svgContainer.style("transform", function (d) {
        let sensorLL = [
            d.domain.coordinate.latitude,
            d.domain.coordinate.longitude
        ];
        return (
            "translate3d(" +
            (map.latLngToLayerPoint(sensorLL).x - 25) +
            "px, " +
            (map.latLngToLayerPoint(sensorLL).y - 25) +
            "px, 0px)"
        );
    })
    let circle = newSvg.append('g')
        .attr('class', 'circle')
        .attr("width", 50)
        .attr("height", 50);
    circle.append("circle")
        .attr("cx", 25)
        .attr("cy", 25)
        .attr("r", 6)
        .attr('fill', 'black')
        .attr('opacity', 1)
        .style("z-index", 1500)
        .append("svg:title")
        .text(function (d) {
            return `Szenzor: ${d.id} <br> Név: ${d.type}`;
        });

}

//Create all mrSvgs->groups->paths
function getSensorSvgPath(sensorData, n) {
    let svgContainer = d3.select(map.getPanes().overlayPane);

    let svg = svgContainer.selectAll("svg").data(sensorData, d => {
        return d.id;
    });

    svg.exit().remove();
    let newSvg = svg.enter().append("svg");
    svg = newSvg.merge(svg);
    svg.attr("viewBox", function (d) {
        let rMax = d.domain.r.max0 * Math.cos(d.domain.theta.min0);
        return " " + -rMax + " " + -rMax + " " + 2 * rMax + " " + 2 * rMax;
    });
    svg
        .attr("z-index", 1000)
        .attr("height", function (d) {
            let rMax = d.domain.r.max1 * Math.cos(d.domain.theta.min0);
            return 2 * rMax;
        })
        .attr("width", function (d) {
            let rMax = d.domain.r.max1 * Math.cos(d.domain.theta.min0);
            return 2 * rMax;
        })
        .attr("id", "mr")
        .attr("class", "mrSvg");

    svg.each(function (d, i) {
        let path = d3
            .select(this)
            .selectAll("path")
            .data(new Array(n));
        path.exit().remove();
        let newPath = path.enter().append("path");
        path = newPath.merge(path);
        path
            .attr("fill", "none")
            .attr("stroke", () => {
                if (d.type == "dynamic") {
                    return '#FF0000';
                } else {
                    return '#2f4f4f';
                }
            })
            .attr("opacity", "0.1")
            .attr("stroke-width", function (d2, i) {
                return getSensorPathWidth(d.domain, n, i);
            })
            .attr("d", function (d2, i) {
                return getSensorPath(d.domain, n, i);
            });
    });
    if (newSvg !== null) {
        positionSvgContainer();
        zoomLevel = -1;
    }
}

function interpol(min, max, n, i) {
    return min + (i * (max - min)) / n;
}

//calculate svg paths from sensor data
function getSensorPath(domain, n, i) {
    let rmin0 = domain.r.min0 * Math.cos(domain.theta.min0);
    let rmin1 = domain.r.min1 * Math.cos(domain.theta.min0);
    let rmax0 = domain.r.max0 * Math.cos(domain.theta.min0);
    let rmax1 = domain.r.max1 * Math.cos(domain.theta.min0);
    let angMin0 = domain.fi.min0;
    let angMin1 = domain.fi.min1;
    let angMax0 = domain.fi.max0;
    let angMax1 = domain.fi.max1;

    let element1 = elemikorcikk(
        interpol(rmin0, rmin1, n, i),
        interpol(rmax0, rmax1, n, i),
        interpol(angMin0, angMin1, n, i),
        interpol(angMax0, angMax1, n, i),
        0,
        0
    );
    return element1.d;
}

//Calculate MR SVG path width
function getSensorPathWidth(domain, n, i) {
    let rmin0 = domain.r.min0 * Math.cos(domain.theta.min0);
    let rmin1 = domain.r.min1 * Math.cos(domain.theta.min0);
    let rmax0 = domain.r.max0 * Math.cos(domain.theta.min0);
    let rmax1 = domain.r.max1 * Math.cos(domain.theta.min0);
    let width = interpol(rmax0, rmax1, n, i) - interpol(rmin0, rmin1, n, i);
    return width;
}

//create circular sector svg from sensor data
function elemikorcikk(rmin, rmax, minAng, maxAng, x, y) {
    x = 0;
    y = 0;
    let element = {};
    let radius = rmin + (rmax - rmin) / 2;
    let startx = radius * Math.cos(minAng) + x;
    let starty = -radius * Math.sin(minAng) - y;
    let endx = radius * Math.cos(maxAng) + x;
    let endy = -radius * Math.sin(maxAng) - y;
    if (maxAng - minAng == Math.PI) {
        maxAng = maxAng + 0.00000001;
    }
    let largeArcFlag = maxAng - minAng <= Math.PI ? "0" : "1";
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

// set svg container position to leaflet-map-pane position
function positionSvgContainer() {
    if (zoomLevel !== map.getZoom()) {
        zoomLevel = map.getZoom();

        let svgContainer = d3.select(map.getPanes().overlayPane).selectAll("svg");
        let tr = d3
            .selectAll(".leaflet-map-pane")
            .style("transform")
            .split(",");

        svgContainer.style("transform", function (d) {
            // let height = d3.select(this).attr("height");
            let width = d3.select(this).attr("width");
            let sensorLL = [
                d.domain.coordinate.latitude,
                d.domain.coordinate.longitude
            ];

            return (
                "translate3d(" +
                map.latLngToLayerPoint(sensorLL).x +
                "px, " +
                map.latLngToLayerPoint(sensorLL).y +
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
            let sensorLL = [
                d.domain.coordinate.latitude,
                d.domain.coordinate.longitude
            ];
            return "0 0";
        });
    }
}

//Calculate scale for MR SVG
function getScale() {
    let pB = map.getPixelBounds();
    let b = map.getBounds();
    let atloinPixel = Math.sqrt(
        (pB.max.x - pB.min.x) * (pB.max.x - pB.min.x) +
        (pB.max.y - pB.min.y) * (pB.max.y - pB.min.y)
    );
    return atloinPixel / map.distance(b._southWest, b._northEast);
}

export {
    getSensorData,
    getSensorSVGData,
    positionSvgContainer,
    getScale
}