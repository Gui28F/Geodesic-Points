/*     Rede Geodésica Nacional

Aluno 1: ?number ?name <-- mandatory to fill
Aluno 2: ?number ?name <-- mandatory to fill

Comentario:

O ficheiro "rng.js" tem de incluir, logo nas primeiras linhas,
um comentário inicial contendo: o nome e número dos dois alunos que
realizaram o projeto; indicação de quais as partes do trabalho que
foram feitas e das que não foram feitas (para facilitar uma correção
sem enganos); ainda possivelmente alertando para alguns aspetos da
implementação que possam ser menos óbvios para o avaliador.

0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789

HTML DOM documentation: https://www.w3schools.com/js/js_htmldom.asp
Leaflet documentation: https://leafletjs.com/reference-1.7.1.html
*/



/* GLOBAL CONSTANTS */

const MAP_CENTRE =
	[38.661, -9.2044];  // FCT coordinates
const MAP_ID =
	"mapid";
const MAP_ATTRIBUTION =
	'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> '
	+ 'contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>';
const MAP_URL =
	'https://www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}'
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


/* GLOBAL VARIABLES */

let map = null;



/* USEFUL FUNCTIONS */

// Capitalize the first letter of a string.
function capitalize(str) {
	return str.length > 0
		? str[0].toUpperCase() + str.slice(1)
		: str;
}

// Distance in km between to pairs of coordinates over the earth's surface.
// https://en.wikipedia.org/wiki/Haversine_formula
function haversine(lat1, lon1, lat2, lon2) {
	function toRad(deg) { return deg * 3.1415926535898 / 180.0; }
	let dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
	let sa = Math.sin(dLat / 2.0), so = Math.sin(dLon / 2.0);
	let a = sa * sa + so * so * Math.cos(toRad(lat1)) * Math.cos(toRad(lat2));
	return 6372.8 * 2.0 * Math.asin(Math.sqrt(a))
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

function getAllValuesByTagName(xml, name) {
	return xml.getElementsByTagName(name);
}

function getFirstValueByTagName(xml, name) {
	return getAllValuesByTagName(xml, name)[0].childNodes[0].nodeValue;
}


/* POI */

class VG {
	constructor(xml) {
		this.name = getFirstValueByTagName(xml, "name");
		this.latitude = getFirstValueByTagName(xml, "latitude");
		this.longitude = getFirstValueByTagName(xml, "longitude");
		this.order = getFirstValueByTagName(xml, "order");
		this.altitude = getFirstValueByTagName(xml, "altitude");
		this.type = getFirstValueByTagName(xml, "type");
	}
}

class MarkerStatus {
	constructor(marker) {
		this.marker = marker;
		this.visible = false;
		this.heightCircleIsVisible = false;
		this.ordCircleIsVisible = false;
		this.isClustered = false;
	}
}
class Marker {
	constructor(vg, icon) {
		this.vg = vg;
		this.icon = icon;
		this.marker = L.marker([this.vg.latitude, this.vg.longitude], { icon: this.icon });
		this.heightCircle = this.createCircle();
		this.maps = {};
		this.ordCircle = this.newOrdCircle();
	}
	mapMarkerStatus(map) {
		return this.maps[map];
	}
	drawMarker(map) {
		let mapsLink = `<input type='button' onclick="location.href='https://www.google.com/maps?q&layer=c&cbll=${this.vg.latitude},${this.vg.longitude}';" value='Maps'>`;
		this.marker.bindPopup("I'm the marker of VG <b>" + this.vg.name + "</b>.<br>"
			+ "Altitude: <b>" + this.vg.altitude + "m </b><br>" +
			"Latitude: <b>" + this.vg.latitude + "</b> Longitude: <b>" + this.vg.longitude + "</b><br>" +
			"Order: <b>" + this.vg.order + "</b><br>" +
			"Type: <b>" + this.vg.type + "</b>" +
			"<br/><input type = 'button' onclick= 'map.drawOrds(" + this.vg.order + ")' VALUE='SameOrd'>" +
			mapsLink)
			.bindTooltip(this.vg.name);
		let markerStatus = new MarkerStatus(this);
		markerStatus.visible = true;
		this.maps[map] = markerStatus;
	}

	removeMarker(map) {
		let status = this.maps[map];
		if (status != null)
			status.visible = false;
		map.lmap.removeLayer(this.marker);
		this.maps[map] = status;
	}
	createCircle() {
		const pos = new L.latLng([this.vg.latitude, this.vg.longitude]);
		let radius = this.vg.altitude * 7;
		if (isNaN(radius) || radius < 100)
			radius = 100;
		let circle = L.circle(pos,
			radius,
			{ color: 'red', fillColor: 'pink', fillOpacity: 0.4 }
		);;
		return circle;
	}
	drawHeightCircle(map) {
		let status = this.maps[map];
		if (status != null)
			status.heightCircleIsVisible = true;
		this.maps[map] = status;
		this.heightCircle.addTo(map.lmap);
		this.heightCircle.bindPopup(this.vg.name);
	}

	removeHeightCircle(map) {
		let status = this.maps[map];
		if (status != null && status.heightCircleIsVisible && this.heightCircle != null) {
			map.lmap.removeLayer(this.heightCircle);
			status.heightCircleIsVisible = false;
			this.maps[map] = status;
		}
	}

	updateHeightCircle(map) {
		let status = this.maps[map];
		if (status != null) {
			if (!status.heightCircleIsVisible) {
				this.drawHeightCircle(map);
				status.heightCircleIsVisible = true;
			} else {
				this.removeHeightCircle(map);
				status.heightCircleIsVisible = false;
			}
		}
		this.maps[map] = status;
	}
	getOrdColor() {
		if (this.vg.order == 1)
			return 'red';
		else if (this.vg.order == 2)
			return 'green';
		else if (this.vg.order == 3)
			return 'blue';
		else if (this.vg.order == 4)
			return 'white';
	}
	newOrdCircle() {
		let color = this.getOrdColor();
		const pos = [this.vg.latitude, this.vg.longitude];
		let radius = 100;
		let circle = L.circle(pos,
			radius,
			{ color: color, fillColor: color, fillOpacity: 0.4 }
		);;
		return circle;

	}

	drawOrdCircle(map) {
		let color = this.getOrdColor();
		const pos = [this.vg.latitude, this.vg.longitude];
		let radius = 100;
		if (this.ordCircle == null)
			this.ordCircle = map.newCircle(pos, radius, color, color, 0.4);
		let status = this.maps[map];
		if (status != null)
			status.ordCircleIsVisible = true;
		this.maps[map] = status;
		//this.ordCircle.addTo(map.lmap);
		this.ordCircle.bindPopup(this.vg.name);
	}

	removeOrdCircle(map) {
		if (this.ordCircle != null) {
			map.lmap.removeLayer(this.ordCircle);
			let status = this.maps[map];
			if (status != null)
				status.ordCircleIsVisible = false;
			this.maps[map] = status;
		}
	}
	distance(marker) {
		var thisLatlng = L.latLng(this.vg.latitude, this.vg.longitude);
		var vgLatlng = L.latLng(marker.vg.latitude, marker.vg.longitude);
		return thisLatlng.distanceTo(vgLatlng) / 1000;
	}
	clust(map) {
		let status = this.maps[map];
		if (status != null)
			status.isClustered = true;
	}

}
/* MAP */

class Map {
	constructor(center, zoom) {
		this.markers = {};
		this.clustered = [];
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
		this.heightCircles = null;
		this.circlesHeightClust = false;
		this.ordCircles = null;
		this.circlesOrdClust = false;
		for (let i = 1; i <= Object.keys(this.markers).length; i++) {
			const id = 'order' + i;
			let nVGS = document.getElementById(id);
			nVGS.checked = true;
		}
		this.cluster();

	}

	cluster() {
		let arr = [];
		for (let [key, value] of Object.entries(this.markers)) {
			let box = document.getElementById('order' + key);
			if (box.checked)
				arr = arr.concat(value);
			for (let i = 0; i < value.length; i++)
				if (box.checked)
					value[i].maps[this].visible = true;
				else value[i].maps[this].visible = false;

		}
		this.heightCircles = L.markerClusterGroup();
		let clust = L.markerClusterGroup();
		for (let i = 0; i < arr.length; i++) {
			for (let j = arr.length - 1; j >= i; j--) {
				clust.addLayer(arr[j].marker);
				arr[j].clust(this)
				this.clustered.push(arr[j])
				this.heightCircles.addLayer(arr[j].heightCircle);
			}

		}
		this.lmap.addLayer(clust);
	}

	updateCluster() {
		let lmap = this.lmap;
		this.lmap.eachLayer(function (layer) {
			if (layer instanceof L.MarkerClusterGroup) {
				lmap.removeLayer(layer)
			}
		})
		for (let i = 0; i < this.clustered.length; i++)
			this.clustered[i].maps[this].isClustered = false;
		this.clustered = [];
		this.circlesHeightClust = false;
		this.cluster();
	}
	removeAllOrdCircles() {
		for (let key of Object.keys(this.markers))
			this.removeOrds(key);

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

	populate(icons, vgs) {
		for (let i = 0; i < vgs.length; i++)
			this.addMarker(icons, vgs[i]);
	}

	addMarker(icons, vg) {
		let marker = new Marker(vg, icons['order' + vg.order]);
		marker.marker
			.bindPopup("I'm the marker of VG <b>" + vg.name + "</b>.")
			.bindTooltip(vg.name)
			;
		let markersOrdArray = this.markers[vg.order];
		if (markersOrdArray == null)
			markersOrdArray = [];
		marker.drawMarker(this);
		markersOrdArray.push(marker);
		this.markers[vg.order] = markersOrdArray;
	}

	addClickHandler(handler) {
		let m = this.lmap;
		let map = this;
		function handler2(e) {
			map.removeAllOrdCircles();
			return handler(e).openOn(m);
		}
		return this.lmap.on('click', handler2);
	}

	newCircle(pos, radius, color1, color2, opacity) {
		let circle =
			L.circle(pos,
				radius,
				{ color: color1, fillColor: color2, fillOpacity: opacity }
			);
		return circle;
	}
	addCircle(pos, radius, popup) {
		let circle = this.newCircle(pos, radius, 'red', 'pink', 0.4);
		circle.addTo(this.lmap);
		if (popup != "")
			circle.bindPopup(popup);
		return circle;
	}
	nunumberVisibleMarkersOrd(order) {
		let markers = this.markers[order];
		if (markers != null) {
			let count = 0;
			for (let i = 0; i < markers.length; i++) {
				const status = markers[i].mapMarkerStatus(this);
				if (status != null && status.visible)
					count++;
			}
			return count;
		}
		return 0;
	}
	updateVgsInfo() {
		let total = 0;
		for (var key of Object.keys(this.markers)) {
			const id = 'visible_caches_order' + key;
			const nVGS = document.getElementById(id);
			let n = this.nunumberVisibleMarkersOrd(key);
			nVGS.innerHTML = n;
			total += n;
		}
		document.getElementById('visible_caches').innerHTML = total;
	}

	drawOrds(order) {
		this.removeOrds();
		let m = L.markerClusterGroup();
		for (let [key, markers] of Object.entries(this.markers)) {
			for (let i = 0; i < markers.length; i++)
				if (order == key) {
					m.addLayer(markers[i].ordCircle);
				} else {
					let circle = this.newCircle(new L.latLng([markers[i].vg.latitude, markers[i].vg.longitude]), 0, 'white', 'white', 0);
					m.addLayer(circle);
				}
		}

		this.lmap.addLayer(m);
		this.ordCircles = m;
		this.circlesOrdClust = true;
	}

	removeOrds() {
		//let markers = this.markers[order];
		//for (let i = 0; i < markers.length; i++)
		//	markers[i].removeOrdCircle(this);
		if (this.ordCircles != null) {
			this.lmap.removeLayer(this.ordCircles);
			this.ordCircles = null;
			this.circlesOrdClust = false;
		}

	}

	drawHeights() {
		if (this.circlesHeightClust) {
			this.lmap.removeLayer(this.heightCircles);
			this.circlesHeightClust = false;
		} else {
			this.lmap.addLayer(this.heightCircles)
			this.circlesHeightClust = true;
		}
	}

}
/* FUNCTIONS for HTML */

function onLoad() {
    map = new Map(MAP_CENTRE, 12);
	map.updateVgsInfo();
    map.addCircle(MAP_CENTRE, 100, "FCT/UNL");
}

function checkboxUpdate(checkBox) {
	map.updateCluster();
	map.updateVgsInfo();
}


function drawHeights() {
	map.drawHeights();
}
