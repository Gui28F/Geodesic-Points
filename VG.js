import {
	getAllValuesByTagName
} from './Map.js';

// Distance in km between to pairs of coordinates over the earth's surface.
// https://en.wikipedia.org/wiki/Haversine_formula
function haversine(lat1, lon1, lat2, lon2) {
	function toRad(deg) { return deg * 3.1415926535898 / 180.0; }
	let dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
	let sa = Math.sin(dLat / 2.0), so = Math.sin(dLon / 2.0);
	let a = sa * sa + so * so * Math.cos(toRad(lat1)) * Math.cos(toRad(lat2));
	return 6372.8 * 2.0 * Math.asin(Math.sqrt(a))
}

function getFirstValueByTagName(xml, name) {
	return getAllValuesByTagName(xml, name)[0].childNodes[0].nodeValue;
}

export default class VG {
	constructor(xml) {
		this.name = getFirstValueByTagName(xml, "name");
		this.latitude = getFirstValueByTagName(xml, "latitude");
		this.longitude = getFirstValueByTagName(xml, "longitude");
		this.order = getFirstValueByTagName(xml, "order");
		this.altitude = getFirstValueByTagName(xml, "altitude");
		this.type = getFirstValueByTagName(xml, "type");
	}

	getOrdColor() {
		if (this.order == 1)
			return 'red';
		else if (this.order == 2)
			return 'green';
		else if (this.order == 3)
			return 'blue';
		else if (this.order == 4)
			return 'white';
	}

	pos() {
		return [this.latitude, this.longitude];
	}

	lat() {
		return this.latitude;
	}

	long() {
		return this.longitude;
	}

	distanceBetween(vg) {
		return haversine(this.latitude, this.longitude, vg.latitude, vg.longitude);
	}
}