let mapObj = map();
let basemapObj = basemaps();

function map() {
    return L.map('map', {
        center: [0, 0],
        zoom: 3,
        timeDimension: true,
        timeDimensionOptions: {//TODO set the timeInterval to update automatically
            timeInterval: '2020-04-04/2020-05-09',
            period: "P1D",
        },
        timeDimensionControl: true,
        timeDimensionControlOptions: {
            loopButton: true,
        }
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
        "ESRI Terrain": L.layerGroup([esri_terrain, esri_labels])
    }
}

function world_region() {
    const world_regions_url = 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Countries_(Generalized)/FeatureServer/0';
    return L.esri.featureLayer({
        url: world_regions_url,
        style: {
            color: '#D8E0AF',
            fill: false,
            weight: 1,
        }
    }).addTo(mapObj);
}

function data_layer(){
    if ($('#data-options-two').val() != null) {
        const wmsurl = thredds_url + $('#data-options').val() + '/' + $('#data-options-two').val();
        const current_layer = $('#data-options-two').val().slice(22, -3);
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
        return L.timeDimension.layer.wms(wmsLayer, {
            name: 'time',
            requestTimefromCapabilities: true,
            updateTimeDimension: true,
            updateTimeDimensionMode: 'replace',
            cache: 20,
        }).addTo(mapObj);
    } else {
        setTimeout(function(){
            data_layer();
            return
            }, 2000);
    }
}

function drawing_layer(){
    return L.layerGroup().addTo(mapObj);
}

function draw_controller() {
    return L.Control.Draw({
        draw: {
            polygon: false,
            circle: false,
            polyline: false,
            marker: true,
            rectangle: true,
        }
    }).addTo(mapObj);
}

function layer_control() {
    return L.control.layers(basemapObj, {
        'Country Boundaries': world_region(),
        'Data Layer': layerWMS,
        'Uploaded GeoJSON': drawing_layer(),
    }).addTo(mapObj);
}
