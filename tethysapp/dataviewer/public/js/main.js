// find if method is csrf safe
function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

// add csrf token to appropriate ajax requests
$(function() {
    $.ajaxSetup({
        beforeSend: function(xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", getCookie("csrftoken"));
            }
        }
    });
});

function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
/////////////////////////////////////////////////////////////////////////////////////

// POPULATE DATA OPTIONS
function select_data(option) {

    $.ajax({
        url: '/apps/dataviewer/options/file_tree/',
        data: {'option': JSON.stringify(option)},
        dataType: 'json',
        contentType: "application/json",
        method: 'GET',
        success: function (result) {
            filetree = JSON.parse(result['filetree']);
            up_value = ['data_viewer'];
            console.log(up_value);

            $('#data-options').empty();
            $('#data-options-two').empty();

            for (i = 0; i < filetree.data_viewer.length; i++) {
                $('#data-options').append(`<option value="${filetree.data_viewer[i]}">${filetree.data_viewer[i]}</option>`);
            }
            let selected_file = $('#data-options').val();

            $('#data-options-two').append('<option value="none" selected disabled hidden>Select an Option</option>');
            for (i = 0; i < filetree[selected_file].length; i++) {
                $('#data-options-two').append(`<option value=${filetree[selected_file][i]}>${filetree[selected_file][i]}</option>`);
            }
        }
    });
}

$('#data-options').change(function () {
    if ($('#data-options').val().slice(-3) == '.nc' ) {
        alert($('#data-options-two').val())
    } else {
        let new_file = $('#data-options').val();

        $('#data-options-two').empty();

        $('#data-options-two').append('<option value="none" selected disabled hidden>Select an Option</option>');
        for (i = 0; i < filetree[new_file].length; i++) {
            $('#data-options-two').append(`<option value="${filetree[new_file][i]}">${filetree[new_file][i]}</option>`);
        }
    }
});

$('#data-options-two').change(function () {

    if ($('#data-options-two').val().slice(-3) == '.nc' ) {
        alert($('#data-options-two').val())

    } else {
        let new_file = $('#data-options-two').val();
        let current_file = $('#data-options').val();

        if (filetree[new_file] == undefined) {
            $('#data-options').empty();
            $('#data-options-two').empty();

            for (i = 0; i < filetree[current_file].length; i++) {
                $('#data-options').append(`<option value="${filetree[current_file][i]}">${filetree[current_file][i]}</option>`);
            }
            $('#data-options-two').append('<option value="none" selected disabled hidden>No Data</option>');

        } else {
            up_value.push(($('#data-options').val()));
            $('#data-options').empty();
            $('#data-options-two').empty();

            for (i = 0; i < filetree[current_file].length; i++) {
                $('#data-options').append(`<option value="${filetree[current_file][i]}">${filetree[current_file][i]}</option>`);
            }

            $('#data-options-two').append('<option value="none" selected disabled hidden>Select an Option</option>');
            for (i = 0; i < filetree[new_file].length; i++) {
                $('#data-options-two').append(`<option value="${filetree[new_file][i]}">${filetree[new_file][i]}</option>`);
            }
        }
    }
});

$('#file-up').click(function () {
    let count = up_value.length;
    if (count == 1) {
        alert('You have reached the top!!!')
    } else {
        let current_file = up_value[count - 2];
        alert(count + ': ' + up_value + ': ' + current_file);
        up_value.pop();

        $('#data-options').empty();
        $('#data-options-two').empty();

        for (i = 0; i < filetree[current_file].length; i++) {
            $('#data-options').append(`<option value="${filetree[current_file][i]}">${filetree[current_file][i]}</option>`);
        }
        let selected_file = $('#data-options').val();

        $('#data-options-two').append('<option value="none" selected disabled hidden>Select an Option</option>');
        for (i = 0; i < filetree[selected_file].length; i++) {
            $('#data-options-two').append(`<option value=${filetree[selected_file][i]}>${filetree[selected_file][i]}</option>`);
        }
    }
});

/////////////////////////////////////////////////////////////////////////////////////

// Functions to run on map load
$(function() {
    select_data('none');
});

let layerWMS = data_layer();
let layerControls = layer_control();

///////////////////////////////////////////////////////////////////////////////////////
//ADD A USER SHAPEFILE TO THE MAP
$('#add-shp').click(function(){
    $('#uploadshp-modal').modal('show');
});

$('#uploadshp').click(function(){
    uploadShapefile();
});

function uploadShapefile() {
    let files = $('#shapefile-upload')[0].files;

    if (files.length !== 4) {
        alert('The files you selected were rejected. Upload exactly 4 files ending in shp, shx, prj and dbf.');
        return
    }

    let data = new FormData();
    Object.keys(files).forEach(function (file) {
        data.append('files', files[file]);
    });

    $.ajax({
        url: '/apps/dataviewer/ajax/uploadShapefile/',
        type: 'POST',
        data: data,
        dataType: 'json',
        processData: false,
        contentType: false,
        success: function (result) {
            var geojson = jQuery.parseJSON(result['geojson']);
            var geojson_layer = make_file_layer(geojson);
            $('#uploadshp-modal').modal('hide');
            var southWest = L.latLng(47.74, -124.23),
                northEast = L.latLng(47.87, -122.73),
                bounds = L.latLngBounds(southWest, northEast);
            mapObj.flyToBounds(geojson_layer.getBounds());
        },
    });
}

function make_file_layer(geojson) {
    let polygons = geojson;
    let style = {
        "color": "#ffffff",
        "weight": 1,
        "opacity": 0.40,
    };
    coords = [];
    return L.geoJSON(polygons, {
        style: style,
        onEachFeature: create_popup,
    }).addTo(mapObj);
}

function create_popup(feature, layer) {
    property = $('#property').val();
    coords.push(feature.geometry.coordinates);
    layer.bindPopup('<h1 style="text-align: center">'+ feature.properties[property] +
                    '</h1><br><button id="get-time" style="width: 200px">Get Timeseries</button>');
}

$('#get-time').click(function(){
    alert(coords);
    alert('is this working');
});
//////////////////////////////////////////////////////////////////////////////////

// GET VALUES FROM NETCDFS
function draw_graph(data, time, value) {
    var series = $.parseJSON(data);
    var length = Object.keys(series[time]).length;
    let x = [];
    let y = [];
    var i;
    for (i = 0; i < length; i++) {
        x.push(series[time][i]);
        y.push(series[value][i]);
    }

    var timeseries = {
        x: x,
        y: y,
    };

    var layout = {
        title: 'Timeseries',
        xaxis: {
            type: 'date',
        },
        yaxis: {
            autorange: true,
            type: 'linear',
        },
    };

    Plotly.newPlot('point_plot', [timeseries], layout);
    $('#timeseries-model').modal('show');
}


function get_timeseries(type, layer) {

    if (type === 'marker') {
        var coord = layer.getLatLng();
        var lat = coord.lat;
        var lng = coord.lng;

        $.ajax({
            url: 'ajax/get_point_values/',
            data: {
                'lat': JSON.stringify(lng),
                'lon': JSON.stringify(lat),
                'filename': JSON.stringify($('#data-options').val()),
            },
            dataType: 'json',
            contentType: "application/json",
            method: 'GET',
            success: function (result) {
                draw_graph(result['data'], result['time'], result['value']);
            },
        });
    }

    if (type === 'rectangle') {
        var corner_coord = layer.getLatLngs();
        var corner_1 = corner_coord[0][0];
        var corner_3 = corner_coord[0][2];
        var max_lat = corner_3.lat;
        var max_lon = corner_3.lng;
        var min_lat = corner_1.lat;
        var min_lon = corner_1.lng;

        $.ajax({
            url: 'ajax/get_box_values/',
            data: {
                'max_lat': JSON.stringify(max_lat),
                'max_lon': JSON.stringify(max_lon),
                'min_lat': JSON.stringify(min_lat),
                'min_lon': JSON.stringify(min_lon),
                'filename': JSON.stringify($('#data-options').val()),
            },
            dataType: 'json',
            contentType: "application/json",
            method: 'GET',
            success: function (result) {
                draw_graph(result['data'], result['time'], result['value']);
            },
        });
    }
}

/////////////////////////////////////////////////////////////////////////////////////

// MAP EVENT FUNCTIONS
mapObj.on(L.Draw.Event.CREATED, function (e) {
    var type = e.layerType,
        layer = e.layer;

    get_timeseries(type, layer);

    var drawingLayer = drawing_layer();

    drawingLayer.addLayer(layer);
});

mapObj.on('click', function (e) {
    var type = e.layerType,
        layer = e.layer;

    get_timeseries(type, layer);
});

$('#clear-map').click(function(){
    var drawingLayer = drawing_layer();
    drawingLayer.clearLayers();
});



