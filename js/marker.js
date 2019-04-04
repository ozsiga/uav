import {
    map
} from "./script.js";
import {
    getScale
} from "./sensor.js";

let zoomLevel = -1;
let tooltip;
let tooltiphtml;
let showTooltip;

// fetch request for marker datas
function getMarkerData() {
    const url = "http://192.168.8.149:8080/UAVFusionPOC/rest/fusion/detection/all"; //url of service
    fetch(url)
        .then(res => res.json())
        .then(data => {
            makeMarkerandLineSvg(data);
            makeSidebarData(data);
            var removeNecessary = true;
            for (let i = 0; i < data.length; i++) {
                if (data[i].id == showTooltip) {
                    createTooltipValueandPosition(data[i]);
                    removeNecessary = false;
                    break
                }
            }
            if (removeNecessary && tooltiphtml) {
                tooltiphtml.style("display", "none");
                showTooltip = undefined
            }


        })
        .catch(err => console.log(err));
}

//Create marker and line svg 
function makeMarkerandLineSvg(input) {
    let lineSvgContainer = d3
        .select(".leaflet-pane")
        .selectAll("svg.lineSvg")
        .data(input, d => {
            return d.id;
        });

    let droneSvgContainer = d3
        .select(".leaflet-pane")
        .selectAll("svg.droneSvg")
        .data(input, d => {
            return d.id;
        });
    lineSvgContainer.exit().remove();
    droneSvgContainer.exit().remove();
    let offsetX = 400;
    let offsetY = 400;
    let newSvg = droneSvgContainer.enter().append("svg");
    newSvg.attr("class", "droneSvg");
    newSvg.attr("customId", function (d) {
        return d.id;
    });
    newSvg.style("width", 50);
    newSvg.style("height", 50);
    newSvg.style("z-index", 1000);
    droneSvgContainer = newSvg.merge(droneSvgContainer);
    droneSvgContainer
        .style("transform", function (d) {
            let droneLL = [
                d.domain.coordinate.latitude,
                d.domain.coordinate.longitude
            ];
            return (
                "translate3d(" +
                map.latLngToLayerPoint(droneLL).x +
                "px, " +
                map.latLngToLayerPoint(droneLL).y +
                "px, 0px)"
            );
        })
        .style("margin-top", -25)
        .style("margin-left", -25);
    let newCircleGroup = newSvg
        .append("g")
        .attr("class", "circle")
        .attr("width", 50)
        .attr("height", 50);
    newCircleGroup
        .append("circle")
        .attr("cx", 25)
        .attr("cy", 25)
        .attr("r", 6)
        .attr("opacity", 1)
        .attr("stroke", "white")
        .attr("stroke-width", "1")
        .style("z-index", 1000);
    newCircleGroup
        .on("click", function (d) {
            createTooltipValueandPosition(d)

            let detectorsInTooltip = d.detectors
            let mrPath = d3.selectAll(".path")
            for (let i = 0; i < mrPath._groups[0].length; i++) {
                let mrPathSvg = mrPath._groups[0][i];
                for (let k = 0; k < detectorsInTooltip.length; k++) {
                    if (detectorsInTooltip[k] == mrPathSvg.id) {
                        d3.select(mrPathSvg).style("stroke", "blue");
                        break;
                    } else {
                        d3.select(mrPathSvg).style("stroke", "#2f4f4f");
                    }
                }
                d3.event.stopImmediatePropagation();
            }
        })
        .append("text").attr("class", "markerText")
        .attr("x", 16)
        .attr("y", 42);
    let mapDiv = d3.select('#map');
    mapDiv.on("click", function () {
        showTooltip = undefined;
        if (tooltip !== undefined) {
            tooltiphtml.style("display", "none");
        }
        let mrPath = d3.selectAll(".path");
        for (let i = 0; i < mrPath._groups[0].length; i++) {
            let mrPathSvg = mrPath._groups[0][i];
            d3.select(mrPathSvg).style("stroke", "#2f4f4f");
        }
    });

    droneSvgContainer.select('g.circle').select('text').text(function (d) {
        let height = Math.round(d.domain.height);
        return `${height} m`;
    });
    droneSvgContainer.select('g.circle').select('circle')
        .attr("fill", function (d) {
            return colorScale(d.domain.height);
        })

    let newSvg1 = lineSvgContainer.enter().append("svg");
    newSvg1.attr("class", "lineSvg");
    newSvg1.attr("width", 2 * offsetX);
    newSvg1.attr("height", 2 * offsetY);

    newSvg1.style("z-index", 900);
    newSvg1.append("line");
    lineSvgContainer = newSvg1.merge(lineSvgContainer);

    lineSvgContainer
        .select("line")
        .attr("x1", offsetX)
        .attr("y1", offsetY)
        .attr("x2", d => {
            return offsetX + d.speed.x * setLineLength();
        })
        .attr("y2", d => {
            return offsetY - d.speed.y * setLineLength();
        })
        .attr("stroke", "#000")
        .attr("stroke-width", setLinezoomWidth());
    lineSvgContainer.style("transform", function (d) {
        let droneLL = [d.domain.coordinate.latitude, d.domain.coordinate.longitude];
        return (
            "translate3d(" +
            (map.latLngToLayerPoint(droneLL).x - 400) +
            "px, " +
            (map.latLngToLayerPoint(droneLL).y - 400) +
            "px, 0px)"
        );
    });
    if (newSvg1 !== null) {
        positionLineSvg();
        zoomLevel = -1;
    }
}

//Position line svg to leaflet-map-pane
function positionLineSvg() {
    if (zoomLevel !== map.getZoom()) {
        zoomLevel = map.getZoom();

        let droneSvgContainer = d3.select(map.getPanes().mapPane).selectAll(".lineSvg");

        droneSvgContainer.style("transform", function (d) {
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
        droneSvgContainer.attr("transform-origin", () => {
            return `
                0 0 `;
        });
    }
}


function createTooltipValueandPosition(data) {
    let tooltipPane = d3.select(map.getPanes().tooltipPane)
    let tooltipDiv = d3.select('.tooltip')
    showTooltip = data.id
    var tooltipString = `id: ${data.id} <br> detector(s) : ${data.detectors}`;
    tooltiphtml = tooltipDiv.html(`${tooltipString}`).style("display", "block")
    tooltipPane.style("display", "block")
    tooltipDiv.style("transform", function () {
        let droneLL;
        droneLL = [
            data.domain.coordinate.latitude,
            data.domain.coordinate.longitude
        ];
        return (
            "translate3d(" +
            (map.latLngToLayerPoint(droneLL).x - 85) +
            "px, " +
            (map.latLngToLayerPoint(droneLL).y - 57) +
            "px, 0px)"
        )
    })
}




//Change line svg width with zoom
function setLinezoomWidth() {
    let strokeW = [
        15,
        8.5,
        8,
        7.5,
        7,
        6.5,
        6,
        5.5,
        5,
        4.5,
        4,
        3.5,
        3,
        4,
        2,
        1.9,
        1.8,
        1.1
    ];
    let zoom = map.getZoom();
    let width = strokeW[zoom - 1];
    return width;
}

//Change line svg length with zoom
function setLineLength() {
    let speed = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 3, 3, 3, 3, 2, 2];
    let zoom = map.getZoom();
    let length = speed[zoom - 1];
    return length;
}
//Drone marker svg color scale
let colorScale = d3
    .scaleLinear()
    .domain([0, 150])
    .range(["red", "white"]);

//Create sidebar to log drone's data
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
                return "ismeretlen";
            }
            return d.type;
        }

        return `ID: ${d.id} <br>
                Magasság: ${Math.round(d.domain.height)} m <br>
                Típus: ${type}`;
    });
}

export {
    getMarkerData,
    setLinezoomWidth,
    setLineLength
};