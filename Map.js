
import VG from './VG.js';
import Marker from './Marker.js';
import { newCircle } from './Marker.js';

const MAP_ID =
    "mapid";
const MAP_ATTRIBUTION =
    'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> '
    + 'contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>';
const MAP_URL =
    'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token='
    + 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw'
const MAP_ERROR =
    "https://upload.wikimedia.org/wikipedia/commons/e/e0/SNice.svg";
const MAP_LAYERS =
    ["streets-v11", "outdoors-v11", "light-v10", "dark-v10", "satellite-v9",
        "satellite-streets-v11", "navigation-day-v1", "navigation-night-v1"]
const RESOURCES_DIR =
    "resources/";
const VG_ORDERS =
    ["order1", "order2", "order3", "order4"];
const RGN_FILE_NAME =
    "rgn.xml";


// Capitalize the first letter of a string.
function capitalize(str) {
    return str.length > 0
        ? str[0].toUpperCase() + str.slice(1)
        : str;
}

function loadXMLDoc(filename) {
    let xhttp = new XMLHttpRequest();
    xhttp.open("GET", filename, false);
    try {
        xhttp.send();
    }
    catch (err) {
        alert("Could not access the local geocaching database via AJAX.\n"
            + "Therefore, no POIs will be visible.\n");
    }
    return xhttp.responseXML;
}

export function getAllValuesByTagName(xml, name) {
    return xml.getElementsByTagName(name);
}
const markers = {
    markers: {},
    markersCluster: null,
    heightCluster: null,
    ordCluster: null,
    orderClusterNumber: -1,
}
export default class Map {
    constructor(center, zoom) {
        this.markers = markers;
        this.lmap = L.map(MAP_ID).setView(center, zoom);
        this.addBaseLayers(MAP_LAYERS);
        let icons = this.loadIcons(RESOURCES_DIR);
        let vgs = this.loadRGN(RESOURCES_DIR + RGN_FILE_NAME);
        this.addClickHandler(e =>
            L.popup()
                .setLatLng(e.latlng)
                .setContent("You clicked the map at " + e.latlng.toString())

        );
        this.populate(icons, vgs);
        for (let i = 1; i <= Object.keys(this.markers.markers).length; i++) {
            const id = 'order' + i;
            let nVGS = document.getElementById(id);
            nVGS.checked = true;
        }
        this.updateStatisticalInformation();
    }

    getOrders() {
        return Object.keys(this.markers.markers);
    }

    addBaseLayers(specs) {
        let baseMaps = [];
        for (let i in specs)
            baseMaps[capitalize(specs[i])] =
                this.makeMapLayer(specs[i], "mapbox/" + specs[i]);
        baseMaps[capitalize(specs[0])].addTo(this.lmap);
        L.control.scale({ maxWidth: 150, metric: true, imperial: false })
            .setPosition("topleft").addTo(this.lmap);
        L.control.layers(baseMaps, {}).setPosition("topleft").addTo(this.lmap);
        return baseMaps;
    }

    makeMapLayer(name, spec) {
        let urlTemplate = MAP_URL;
        let attr = MAP_ATTRIBUTION;
        let errorTileUrl = MAP_ERROR;
        let layer =
            L.tileLayer(urlTemplate, {
                minZoom: 6,
                maxZoom: 19,
                errorTileUrl: errorTileUrl,
                id: spec,
                tileSize: 512,
                zoomOffset: -1,
                attribution: attr
            });
        return layer;
    }

    loadIcons(dir) {
        let icons = [];
        let iconOptions = {
            iconUrl: "??",
            shadowUrl: "??",
            iconSize: [16, 16],
            shadowSize: [16, 16],
            iconAnchor: [8, 8],
            shadowAnchor: [8, 8],
            popupAnchor: [0, -6] // offset the determines where the popup should open
        };
        for (let i = 0; i < VG_ORDERS.length; i++) {
            iconOptions.iconUrl = dir + VG_ORDERS[i] + ".png";
            icons[VG_ORDERS[i]] = L.icon(iconOptions);
        }
        return icons;
    }

    loadRGN(filename) {
        let xmlDoc = loadXMLDoc(filename);
        let xs = getAllValuesByTagName(xmlDoc, "vg");
        let vgs = [];
        if (xs.length == 0)
            alert("Empty file");
        else {
            for (let i = 0; i < xs.length; i++) {
                vgs[i] = new VG(xs[i]);
            }
        }
        return vgs;
    }

    addClickHandler(handler) {
        let m = this.lmap;
        let markers = this.markers;
        function handler2(e) {
            if (markers.ordCluster != null)
                m.removeLayer(markers.ordCluster);
            return handler(e).openOn(m);
        }
        return this.lmap.on('click', handler2);
    }

    populate(icons, vgs) {
        for (let i = 0; i < vgs.length; i++)
            this.addMarker(icons, vgs[i]);
    }

    addMarkerToCluster(cluster, marker) {
        if (cluster == null)
            cluster = L.markerClusterGroup();
        cluster.addLayer(marker);
        return cluster
    }

    addMarker(icons, vg) {
        let marker = new Marker(vg, icons['order' + vg.order], this);
        marker.marker
            .bindPopup("I'm the marker of VG <b>" + vg.name + "</b>.")
            .bindTooltip(vg.name);
        let markersOrdArray = this.markers.markers[vg.order];
        if (markersOrdArray == null)
            markersOrdArray = [];
        marker.drawMarker(this);
        markersOrdArray.push(marker);
        this.markers.markers[vg.order] = markersOrdArray;
        if (marker.visible) {
            this.markers.markersCluster = this.addMarkerToCluster(this.markers.markersCluster, marker.getMarker());
            this.markers.heightCluster = this.addMarkerToCluster(this.markers.heightCluster, marker.getHeightCircle())
        }
        this.lmap.addLayer(this.markers.markersCluster);
    }

    updateClusters() {
        let hasHeightLayer = this.lmap.hasLayer(this.markers.heightCluster);
        if (this.markers.markersCluster != null) {
            this.lmap.removeLayer(this.markers.markersCluster);
            this.markers.markersCluster = null;
        }
        if (this.markers.heightCluster != null) {
            this.lmap.removeLayer(this.markers.heightCluster);
            this.markers.heightCluster = null;
        }
        for (let values of Object.values(this.markers.markers)) {
            for (let i = 0; i < values.length; i++)
                if (values[i].visible) {
                    this.markers.markersCluster = this.addMarkerToCluster(this.markers.markersCluster, values[i].getMarker());
                    this.markers.heightCluster = this.addMarkerToCluster(this.markers.heightCluster, values[i].getHeightCircle())
                }
        }
        if (this.markers.markersCluster != null)
            this.lmap.addLayer(this.markers.markersCluster);
        if (this.markers.heightCluster != null && hasHeightLayer)
            this.lmap.addLayer(this.markers.heightCluster)
    }

    updateHeightCircles() {
        if (this.markers.heightCluster != null)
            if (this.lmap.hasLayer(this.markers.heightCluster))
                this.lmap.removeLayer(this.markers.heightCluster);
            else
                this.lmap.addLayer(this.markers.heightCluster);
    }

    drawOrds(order) {
        if (this.markers.ordCluster != null)
            this.lmap.removeLayer(this.markers.ordCluster)
        let cluster = L.markerClusterGroup();
        for (let [key, value] of Object.entries(this.markers.markers))
            for (let i = 0; i < value.length; i++) {
                if (order == key && value[i].visible)
                    cluster.addLayer(value[i].ordCircle);
                else if (value[i].visible) cluster.addLayer(newCircle(value[i].getLatitude(), value[i].getLongitude(), 0, 'white', 'white', 0));

            }
        this.lmap.addLayer(cluster);
        this.markers.ordCluster = cluster;
        this.markers.orderClusterNumber = order;
    }


    checkboxUpdate(box) {
        const order = box.id.charAt(box.id.length - 1);
        let markers = this.markers.markers[order];
        if (!box.checked)
            for (let i = 0; i < markers.length; i++) {
                markers[i].setUnvisible();
                if (order == this.markers.orderClusterNumber && this.markers.ordCluster)
                    this.lmap.removeLayer(this.markers.ordCluster);
            }
        else
            for (let i = 0; i < markers.length; i++) {
                markers[i].setVisible();

            }
        this.updateClusters();
        this.updateStatisticalInformation();
    }


    numberVisibleMarkersOrd(order) {
        let markers = this.markers.markers[order];
        if (markers != null) {
            let count = 0;
            for (let i = 0; i < markers.length; i++) {
                if (markers[i].visible)
                    count++;
            }
            return count;
        }
        return 0;
    }

    updateStatisticalInformation() {
        let total = 0;
        for (var key of Object.keys(this.markers.markers)) {
            const id = 'visible_caches_order' + key;
            const nVGS = document.getElementById(id);
            let n = this.numberVisibleMarkersOrd(key);
            if (nVGS != null)
                nVGS.innerHTML = n;
            total += n;
        }
        document.getElementById('visible_caches').innerHTML = total;
    }

    distanceFaults() {
        const faults = document.getElementById("distance_faults");
        faults.innerHTML = ""
        let hasOne = false;
        for (let [order, markers] of Object.entries(this.markers.markers))
            for (let i = 0; i < markers.length; i++) {
                if (markers[i].visible) {
                    for (let j = 0; j < markers.length && !hasOne; j++) {
                        if (markers[j].visible) {
                            if (order == 1 && i != j && 30 <= markers[i].distanceBetweenmarkers(markers[j]) && markers[i].distanceBetweenmarkers(markers[j]) <= 60) {
                                hasOne = true;
                            } else if (order == 2 && i != j && 20 <= markers[i].distanceBetweenmarkers(markers[j]) && markers[i].distanceBetweenmarkers(markers[j]) <= 30) {
                                hasOne = true;
                            } else if (order == 3 && i != j && 5 <= markers[i].distanceBetweenmarkers(markers[j]) && markers[i].distanceBetweenmarkers(markers[j]) <= 10) {
                                hasOne = true;
                            } else if (order > 3)
                                hasOne = true;
                        }
                    }
                } else hasOne = true;

                if (!hasOne)
                    faults.innerHTML += "<li>" + markers[i].vg.name + "(order: " + markers[i].vg.order + ")</li>";
                hasOne = false;
            }
    }
}

