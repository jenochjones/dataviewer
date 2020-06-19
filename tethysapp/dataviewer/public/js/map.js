let mapObj = map();
let basemapObj = basemaps();

function map() {
    return L.map('map', {
        center: [0, 0],
        zoom: 3,
    });
}

function basemaps() {
    // create the basemap layers
    let esri_imagery = L.esri.basemapLayer('Imagery');
    let esri_terrain = L.esri.basemapLayer('Terrain');
    let esri_labels = L.esri.basemapLayer('ImageryLabels');
    return {
        "ESRI Imagery (No Label)": L.layerGroup([esri_imagery]).addTo(mapObj),
        "ESRI Imagery (Labeled)": L.layerGroup([esri_imagery, esri_labels]),
        "ESRI Terrain": L.layerGroup([esri_terrain, esri_labels]),
    }
}
/*
function data_layer(file, layer){
    const wmsurl = thredds_url + file; // $('#data-options').val() + '/' + $('#data-options-two').val();
    alert(wmsurl);
    const current_layer = layer;// $('#data-options-two').val().slice(22, -3);
    alert(current_layer);
    const wmsLayer = L.tileLayer.wms(wmsurl, {
        layers: current_layer,
        dimension: 'time',
        useCache: true,
        crossOrigin: false,
        format: 'image/png',
        transparent: true,
        colorscalerange: '0,50',
        BGCOLOR: '0x000000',
    });
    return wmsLayer.addTo(mapObj) /!*L.timeDimension.layer.wms(wmsLayer, {
        name: 'time',
        requestTimefromCapabilities: true,
        updateTimeDimension: true,
        updateTimeDimensionMode: 'replace',
        cache: 20,
    }).addTo(mapObj);*!/
}*/

function data_layer(file, layer){
    const wmsurl = thredds_url + file;
    const current_layer = layer;

    return netCDF_layer = L.tileLayer.wms(wmsurl, {
        layers: percipitation, //current_layer,
        useCache: true,
        crossOrigin: false,
        format: 'image/png',
        transparent: true,
        colorscalerange: '0,100',
    }).addTo(mapObj);
}

