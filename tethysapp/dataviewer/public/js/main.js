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
// CREATE GRAPHS
// GET VALUES FROM NETCDFS
function draw_graph(data, time, value) {
    var series = $.parseJSON(data);
    var length = Object.keys(series[time]).length;

    if (value == 'values') {
        let x = [];
        let y1 = [];
        for (var i = 0; i < length; i++) {
            x.push(series[time][i]);
            y1.push(series[value][i]);
        }

        var mean = {
            x: x,
            y: y1,
            name: 'Percipitation',
            type: 'scatter'
        }

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

        Plotly.newPlot('point_plot', [mean], layout);
        $('#timeseries-model').modal('show');
    } else {
        let x = [];
        let y1 = [];
        let y2 = [];
        let y3 = [];
        let y4 = [];
        let y5 = [];
        let y6 = [];
        for (var i = 0; i < length; i++) {
            x.push(series[time][i]);
            y1.push(series[value[0]][i]);
            y2.push(series[value[1][i]]);
            y3.push(series[value[2]][i]);
            y4.push(series[value[3][i]]);
            y5.push(series[value[4]][i]);
            y6.push(series[value[5][i]]);
        }

        var mean = {
            x: x,
            y: y1,
            name: 'Mean',
            type: 'scatter'
        };

        var max = {
            x: x,
            y: y2,
            name: 'Max',
            type: 'scatter'
        };
        var median = {
            x: x,
            y: y3,
            name: 'Median',
            type: 'scatter'
        };

        var min = {
            x: x,
            y: y4,
            name: 'Min',
            type: 'scatter'
        };

        var sum = {
            x: x,
            y: y5,
            name: 'Sum',
            type: 'scatter'
        };

        var std = {
            x: x,
            y: y6,
            name: 'St Div',
            type: 'scatter'
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

        Plotly.newPlot('point_plot', [mean, max, median, min, sum, std], layout);
        $('#timeseries-model').modal('show');
    }
}

/////////////////////////////////////////////////////////////////////////////////////////
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

            $('#file-tree').append(`<br><input type="checkbox" id="${filepath}" class="filetree-checkbox" onclick="expand_tree(filepath, $(this).attr('class'))" style="margin-left: 15px">
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
    pathToDisplayedFile = files + filename;
    data_layer(filename, layer, files, date_range);
}

///////////////////////////////////////////////////////////////////////////////////////

// Functions to run on map load
$(function() {
    select_data('none');
    addUserLayers('none');
    pathToDisplayedFile = '';
    firstlayeradded = false;
});

// let layerWMS = data_layer();
// let layerControls = layer_control();

///////////////////////////////////////////////////////////////////////////////////////
//LOAD EXISTING USER LAYERS TO MAP
function addUserLayers(select_option) {
    $.ajax({
        url: 'ajax/user_geojsons/',
        dataType: 'json',
        contentType: "application/json",
        method: 'GET',
        success: function (result) {
            let filenames = jQuery.parseJSON(result['filenames']);
            var geojson = jQuery.parseJSON(result['geojson']);
            $('#shp-select').append('<option value="" disabled selected hidden>Zoom To Layer</option>');
            $('#properties').append('<option value="" disabled selected hidden></option>');
            for (var i = 0, len = geojson.length; i < len; i++) {
                let current_layer = jQuery.parseJSON(geojson[i]);
                let geojson_layer = make_file_layer(current_layer);

                $('#shp-select').append('<option id="' + filenames[i].split(" ").join("") + '" value="' + filenames[i] + '">' + filenames[i] + '</option>');
                $('#' + filenames[i].split(" ").join("") + '').data('layer', geojson_layer);

                let option_insert = '<option value="" disabled selected hidden>Display Property</option>';
                let option_keys = Object.keys(current_layer.features[0].properties);
                for(var s = 0, leng = (option_keys).length; s < leng; s++) {
                    option_insert = option_insert + '<option value="' + option_keys[s] + '">' + option_keys[s] + '</option>';
                }

                $('#' + filenames[i].split(" ").join("") + '').data('options', option_insert);
            }
            if (select_option !== 'none') {
                $('#' + select_option + '').attr("selected", "selected");
                let id = $('#shp-select').val();
                let geo_layer = $('#' + id.split(" ").join("") + '').data('layer');
                let prop_id = $('#' + id.split(" ").join("") + '').data('options');
                $('#properties').empty();
                $('#properties').append(prop_id);
                mapObj.flyToBounds(geo_layer.getBounds());
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
            let id = jQuery.parseJSON(result['filenames']);
            $('#shp-select').empty();
            mapObj.removeLayer(user_layer);
            addUserLayers(id);
            $('#uploadshp-modal').modal('hide');
/*            var geojson = jQuery.parseJSON(result['geojson']);
            var filename = jQuery.parseJSON(result['filenames']);
            $('#shp-select').append('<option id="' + filename.split(" ").join("") + '" value="' + filename + '">' + filename + '</option>');
            var geojson_layer = make_file_layer(geojson);
            $('#shp-select').data('layer', geojson_layer);
            $('#' + filename.split(" ").join("") + '').data('layer', geojson_layer);
            $('#uploadshp-modal').modal('hide');
            mapObj.flyToBounds(geojson_layer.getBounds());*/
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
    user_layer =  L.geoJSON(polygons, {
        style: style,
        onEachFeature: EachFeature,
    });
    return user_layer.addTo(mapObj);
}

function EachFeature(feature, layer) {
    layer.on('click', function(){
        layer.bindPopup('<div id="name-insert" style="text-align: center">'
                        + '<h1>' + feature.properties[$('#properties').val()] + '</h1></div>'
                        + '<br><button id="get-timeseries" style="width: 100%; height: 50px; '
                        + 'background-color: aqua" onclick="timeseriesFromShp(' + JSON.stringify(feature.geometry.coordinates) + ')">'
                        + 'Get Timeseries</button></div>');
    });
}
//////////////////////////////////////////////////////////////////////////////////
function get_timeseries(type, layer) {
    if (pathToDisplayedFile == '') {
        alert('Please select a data layer.');
    } else {
        if (type === 'marker') {
            var coord = layer.getLatLng();
            var lat = coord.lat;
            var lng = coord.lng;

            $.ajax({
                url: 'ajax/get_point_values/',
                data: {
                    'lat': JSON.stringify(lng),
                    'lon': JSON.stringify(lat),
                    'filename': JSON.stringify(pathToDisplayedFile),
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
                    'filename': JSON.stringify(pathToDisplayedFile),
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
}

function timeseriesFromShp(geo_coordinate) {
    if (pathToDisplayedFile == '') {
        alert('Please select a data layer.');
    } else {
        let coord = String(geo_coordinate);
        console.log(coord);
        $.ajax({
            url: 'ajax/get_shp_values/',
            data: {
                'coordinates': JSON.stringify(coord),
                'filename': JSON.stringify(pathToDisplayedFile),
            },
            dataType: 'json',
            contentType: "application/json",
            method: 'GET',
            success: function (result) {
                alert(result['data']);
                //draw_graph(result['data'], result['time'], result['value']);
                },
        });
    }
}

/////////////////////////////////////////////////////////////////////////////////////

// MAP EVENT FUNCTIONS
mapObj.on(L.Draw.Event.CREATED, function (e) {
    var type = e.layerType,
        layer = e.layer;
    drawnItems.addLayer(layer);
    get_timeseries(type, layer);
});

$('#clear-map').click(function(){
    //let drawingLayer = drawnItems;
    //mapObj.removeLayer(drawnItems);
    drawnItems.clearLayers();
});

$('#shp-select').change(function () {
    let id = $('#shp-select').val();
    let geo_layer = $('#' + id.split(" ").join("") + '').data('layer');
    let prop_id = $('#' + id.split(" ").join("") + '').data('options');
    $('#properties').empty();
    $('#properties').append(prop_id);
    mapObj.flyToBounds(geo_layer.getBounds());
});

$('#delete-shp').click(function () {
    let shp_name = $('#shp-select').val();
    $.ajax({
        url: 'ajax/delete_shp/',
        data: {
            'shp_name': JSON.stringify(shp_name),
        },
        dataType: 'json',
        contentType: "application/json",
        method: 'GET',
        success: function (result) {
            let results = result['result'];
            if (results == true) {
                $('#shp-select').empty();
                mapObj.removeLayer(user_layer);
                addUserLayers('none');
            } else {
                alert('False');
            }
        },
    });
});

$('#rename-shp').click(function () {
    let shp_name = $('#shp-select').val();
    let new_name = prompt('New name of the layer (without file extention)', 'example_shp');
    $.ajax({
        url: 'ajax/rename_shp/',
        data: {
            'shp_name': JSON.stringify(shp_name),
            'new_name': JSON.stringify(new_name),
        },
        dataType: 'json',
        contentType: "application/json",
        method: 'GET',
        success: function (result) {
            let results = result['result'];
            let name = result['new_name'];
            if (results == true) {
                $('#shp-select').empty();
                mapObj.removeLayer(user_layer);
                addUserLayers(name);
            } else {
                alert('False');
            }
        },
    });
})

