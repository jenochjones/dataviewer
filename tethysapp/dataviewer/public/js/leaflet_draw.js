let drawnItems = new L.FeatureGroup().addTo(mapObj);

let drawControl = new L.Control.Draw({
    edit: {
        featureGroup: drawnItems,
        edit: true,
    },
    draw: {
        polyline: false,
        circlemarker: false,
        circle: false,
        polygon: false,
        rectangle: true,
        trash: false,
    },
});

let shpLayer = new L.FeatureGroup().addTo(mapObj);

mapObj.addControl(drawControl);

/*function other_layers() {
    return {
        "Drawn Items": drawnItems,
    }
}*/

//let layerControl = new L.control.layers(basemaps(), other_layers());
//mapObj.addControl(layerControl);

//////////////////////////////////////////////////////////////////////////////
