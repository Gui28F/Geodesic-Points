import Map from "./Map.js";

/* GLOBAL CONSTANTS */

const MAP_CENTRE =
    [38.661, -9.2044];  // FCT coordinates



/* GLOBAL VARIABLES */

let map = null;


/* USEFUL FUNCTIONS */




document.body.onload = function () {
    map = new Map(MAP_CENTRE, 12);
    document.getElementById("altitudes").onclick = function () {
        map.updateHeightCircles();
    }
    document.getElementById("distance_faults_button").onclick = function () {
        map.distanceFaults();
    }

    let keys = map.getOrders();
    for (let key of keys) {
        const box = document.getElementById('order' + key);
        if (box != null)
            box.onchange = function () {
                map.checkboxUpdate(box);
            }
    }
}