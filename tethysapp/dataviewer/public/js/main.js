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
            const segments = thredds_url.split('/');
            const last = segments.pop() || segments.pop();
            filetree = JSON.parse(result['filetree']);
            filepath = last;

            $('#file-tree').append(`<input type="checkbox" id="${filepath}" class="filetree-checkbox" onclick="expand_tree(filepath, $(this).attr('class'))" style="margin-left: 15px">
                                        <label for="${filepath}">${filepath}</label><br>`);
            buld_filetree(filepath);
        }
    })
}

function write(indent, key, item) {
    var item_string = String(item);
    if (item_string.substr(-3) == '.nc') {
        var type = 'radio" name="file'
    } else {
        var type = 'checkbox'
    }
    $('#file-tree').append(`<div><input type="` + type + `" id="${item}" class="${key}" onclick="expand_tree(id, $(this).attr('class'))" style="margin-left: ${indent * 30}px; display: none">
            <label for="${item}" class="${key}" style="display: none">${item}</label></div>`);
    if (item.substr(-3) != '.nc' && filetree[item] != undefined) {
        indent += 1;
        key = item;
        filetree[item].forEach(function (item) {
            write(indent, key, item);
        })
    }
}

function buld_filetree(key) {
    var indent = 1;
    if (filetree[key] != undefined) {
        filetree[key].forEach(function (item) {
            write(indent, key, item);
        });
    }
}

function expand_tree(id, tree_class) {
    var id_string = String(id);
    if (id_string.substr(-3) == '.nc') {
        displayed_file = id;
        var folder = tree_class;
        assign_variable_layers(id_string, folder);
    } else {
        var checkBox = document.getElementById(id);
        if (checkBox.checked == true){
            $('.' + id).show();
        } else {
            hide_elements(id);
        }
    }
}

function hide_elements(classname) {
    if ($('.' + classname).is(":visible")) {
        $('.' + classname).each(function(){
            $(this).prop("checked", false);
            $(this).hide();
            var id_lower = $(this).attr('id');
            hide_elements(id_lower);
        })
    }
}

///////////////////////////////////////////////////////////////////////////////////////

// ASSIGN VARIABLE LAYERS
function assign_variable_layers(file_name, folder) {
    let date_range = file_name.substr(0, 10) + '/' + file_name.substr(11, 10);
    let layer = file_name.substr(22, file_name.length - 25);
    let filename = file_name;
    var files = '';
    var current_file = folder;
    while (current_file != filepath) {
        files = current_file + '/' + files;
        current_file = $('#' + current_file).attr('class');
    };
    data_layer(filename, layer, files, date_range);
}

///////////////////////////////////////////////////////////////////////////////////////

// Functions to run on map load
$(function() {
    select_data('none');
    addUserLayers();
});

// let layerWMS = data_layer();
// let layerControls = layer_control();

///////////////////////////////////////////////////////////////////////////////////////
//LOAD EXISTING USER LAYERS TO MAP
function addUserLayers() {
    $.ajax({
        url: 'ajax/user_geojsons/',
        dataType: 'json',
        contentType: "application/json",
        method: 'GET',
        success: function (result) {
            var geojson = jQuery.parseJSON(result['geojson']);
            for (i = 0, len = geojson.length; i < len; i++) {
                let current_layer = jQuery.parseJSON(geojson[i]);
                make_file_layer(current_layer);
            }
        },
    });
}
//ADD A USER SHAPEFILE TO THE MAP
$('#add-shp').click(function() {
    $('#uploadshp-modal').modal('show');
});

$('#uploadshp').click(function() {
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
            mapObj.flyToBounds(geojson_layer.getBounds());
        },
    });
}

function make_file_layer(geojson) {
    let polygons = geojson;
    alert(typeof polygons);
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
    coordinates = coords.push(feature.geometry.coordinates);
    layer.bindPopup('<h1 style="text-align: center">'+ feature.properties[property] +
                    '</h1><br><button id="get-time" style="width: 200px">Get Timeseries</button>');
}

$('#clear-map').click(function(){
    alert(coordinates);
    alert('is this working');
});
//////////////////////////////////////////////////////////////////////////////////
/*
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

*/

