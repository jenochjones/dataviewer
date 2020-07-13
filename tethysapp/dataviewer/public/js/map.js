let mapObj = map();
basemapObj=basemaps();

function map() {
    return L.map('map', {
        center: [0, 0],
        zoom: 3,
        timeDimension: true,
        timeDimensionControl: true,
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

function data_layer(filename, layer_name, files){
    if (firstlayeradded == true) {
        mapObj.removeLayer(wmsLayerTime);
    }
    const wmsurl = thredds_url + files + filename;

    const wmsLayer = L.tileLayer.wms(wmsurl, {
        layers: layer_name,
        dimension: 'time',
        useCache: true,
        crossOrigin: false,
        format: 'image/png',
        transparent: true,
        colorscalerange: '0,100',
    });

    wmsLayerTime = L.timeDimension.layer.wms(wmsLayer, {
        name: 'time',
        requestTimefromCapabilities: true,
        updateTimeDimension: true,
        updateTimeDimensionMode: 'replace',
    });

    firstlayeradded = true;

    return wmsLayerTime.addTo(mapObj);
}
