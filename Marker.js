
export function newCircle(latitude, longitude, radius, color, fillcolor, fillOpacity) {
    const pos = new L.latLng([latitude, longitude]);
    let circle = L.circle(pos,
        radius,
        { color: color, fillColor: fillcolor, fillOpacity: fillOpacity }
    );;
    return circle;
}



export default class Marker {
    constructor(vg, icon, map) {
        this.vg = vg;
        this.icon = icon;
        this.marker = L.marker([this.vg.latitude, this.vg.longitude], { icon: this.icon });
        this.heightCircle = this.newHeightCircle();
        this.ordCircle = this.newOrdCircle();
        this.map = map;
        this.visible = true;
    }

    distanceBetweenmarkers(marker) {
        return this.vg.distanceBetween(marker.vg);
    }

    setVisible() {
        this.visible = true;
    }

    setUnvisible() {
        this.visible = false;
    }

    getPos() {
        return this.vg.pos();
    }

    getLatitude() {
        return this.vg.latitude;
    }

    getLongitude() {
        return this.vg.longitude;
    }

    getHeightCircle() {
        return this.heightCircle;
    }

    getMarker() {
        return this.marker;
    }

    getOrdCircle() {
        return this.ordCircle;
    }

    newHeightCircle() {
        let radius = this.vg.altitude * 7;
        if (isNaN(radius) || radius < 100)
            radius = 100;
        return newCircle(this.vg.latitude, this.vg.longitude, radius, 'red', 'pink', 0.4);
    }

    newOrdCircle() {
        const radius = 400;
        const color = this.vg.getOrdColor();
        return newCircle(this.vg.latitude, this.vg.longitude, radius, color, color, 0.4);
    }

    drawMarker() {
        let btnDiv = document.createElement('div')
        let btnOrd = document.createElement('button');
        btnOrd.innerHTML = "SameOrd";
        let btnMaps = document.createElement('button');
        btnMaps.innerHTML = "Maps";
        let vg = this.vg;
        btnMaps.onclick = function () {
            document.location.href = "https://www.google.com/maps?q&layer=c&cbll=" + vg.latitude + "," + vg.longitude;
        }
        btnDiv.insertAdjacentHTML("afterbegin", "I'm the marker of VG <b>" + this.vg.name + "</b>.<br>"
            + "Altitude: <b>" + this.vg.altitude + "m </b><br>" +
            "Latitude: <b>" + this.vg.latitude + "</b> Longitude: <b>" + this.vg.longitude + "</b><br>" +
            "Order: <b>" + this.vg.order + "</b><br>" +
            "Type: <b>" + this.vg.type + "</b><br/>")
        btnDiv.append(btnOrd);
        btnDiv.append(btnMaps);
        let map = this.map;
        let order = this.vg.order;
        btnOrd.onclick = function () {
            map.drawOrds(order)
        }
        this.marker.bindPopup(btnDiv)
            .bindTooltip(this.vg.name);
    }
}