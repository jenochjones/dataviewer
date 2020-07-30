// Global Variables
var firstlayeradded = false;
var shpfileAdded = false;
var pathToDisplayedFile;
var filepath;

// Functions to run on map load
$(function() {
  get_layer_metadata();
  get_data();
  add_user_layers('none');
});

function get_layer_metadata() {
  $.ajax({
    url: '/apps/dataviewer/options/create_metadata_array/',
    dataType: 'json',
    contentType: "application/json",
    method: 'GET',
    success: function (result) {}
})
}

// POPULATE DATA OPTIONS
function get_data() {
  $.ajax({
    url: '/apps/dataviewer/options/file_tree/',
    dataType: 'json',
    contentType: "application/json",
    method: 'GET',
    success: function (result) {
      const segments = thredds_url.split('/');
      filepath = segments.pop() || segments.pop();
      const filetree = JSON.parse(result['filetree']);

      $('#file-tree').append(`<br><input type="checkbox" id="${filepath}" class="filetree-checkbox" 
                            onclick="expand_tree(filepath, $(this).attr('class'))" style="margin-left: 15px">
                            <label for="${filepath}">${filepath}</label><br>`);
      $('#file-tree-modal').append(`<br><input type="checkbox" id="${filepath}" class="filetree-checkbox" 
                            onclick="expand_tree_modal(filepath, $(this).attr('class'))" style="margin-left: 15px">
                            <label for="${filepath}">${filepath}</label><br>`);
      buld_filetree(filetree, filepath, 'file-tree');
    }
  })
}

function buld_filetree(filetree, key, id) {
  var indent = 1;
  if (filetree[key] != undefined) {
    filetree[key].forEach(function (item) {
      write(filetree, indent, key, item, id);
    });
  }
}

function write(filetree, indent, key, item, id) {
  if (String(item).substr(-3) == '.nc' || String(item).substr(-5) == '.ncml') {
    var type = 'radio" name="file'
  } else {
    var type = 'checkbox'
  }
  $('#' + id + '').append(`<span style="white-space: nowrap; display: block"><input type="` + type + `" id="${item}" class="${key}" 
                       onclick="expand_tree(id, $(this).attr('class'))" style="margin-left: ${indent * 30}px; display: none">
                       <label for"${item}" class="${key}" style="display: none">${item}</label></span>`);
  if (String(item).substr(-3) != '.nc' || String(item).substr(-5) != '.ncml') {
    if (filetree[item] != undefined) {
      indent += 1;
      key = item;
      filetree[item].forEach(function (item) {
        write(filetree, indent, key, item, id);
      })
    }
  }
}

///////////////////////////////////////////////////////////////////////////////////////////////////
//LOAD EXISTING USER LAYERS TO MAP
function add_user_layers(select_option) {
  $.ajax({
    url: 'ajax/user_geojsons/',
    dataType: 'json',
    contentType: "application/json",
    method: 'GET',
    success: function (result) {
      let filenames = jQuery.parseJSON(result['filenames']);
      var geojson = jQuery.parseJSON(result['geojson']);
      console.log(filenames);
      if (filenames !== []) {
        $('#shp-select').append('<option value="" disabled selected hidden>Zoom To Layer</option>');
        $('#properties').append('<option value="" disabled selected hidden></option>');
        for (var i = 0, len = geojson.length; i < len; i++) {
          let current_layer = jQuery.parseJSON(geojson[i]);
          let geojson_layer = make_file_layer(current_layer);

          $('#shp-select').append('<option id="' + filenames[i].split(" ").join("") + '" value="' + filenames[i] + '">' + filenames[i] + '</option>');
          $('#' + filenames[i].split(" ").join("") + '').data('layer', geojson_layer);

          let option_insert = '';
          let option_keys = Object.keys(current_layer.features[0].properties);
          for(var s = 0, leng = (option_keys).length; s < leng; s++) {
            option_insert = option_insert + '<option value="' + option_keys[s] + '">' + option_keys[s] + '</option>';
          }

          $('#' + filenames[i].split(" ").join("") + '').data('options', option_insert);
          $('#' + filenames[i].split(" ").join("") + '').data('option_keys', option_keys);
          $('#' + filenames[i].split(" ").join("") + '').data('name', filenames[i].split(" ").join(""));
        }
/*      if (select_option !== 'none') {
        $('#' + select_option + '').attr("selected", "selected");
        let id = $('#shp-select').val();
        let geo_layer = $('#' + id.split(" ").join("") + '').data('layer');
        let prop_id = $('#' + id.split(" ").join("") + '').data('options');
        $('#properties').empty();
        $('#properties').append(prop_id);
        mapObj.flyToBounds(geo_layer.getBounds());
        //layerControl.addOverlay(geo_layer, "Uploaded Shapefiles");
      }*/
      }
    },
  });
}


//Create a geojson layer on the map using the shapefile the user uploaded
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
    shpfileAdded = true;
    return user_layer.addTo(shpLayer);
}

//Set the popup for each feature
function EachFeature(feature, layer) {
    layer.on('click', function(){
        $('#shp-select > option').each(function() {
            let id = $(this).val();
            if (id != '') {
                let prop = Object.keys(feature.properties);
                let prop2 = $('#' + id + '').data('option_keys');
                let name = $('#' + id + '').data('name');
                if (String(prop) == String(prop2) | String(id) != String(name)) {
                    $('#shp-select').val(name).change();
                }
            }
        });
        layer.bindPopup('<div id="name-insert" style="text-align: center">'
                        + '<h1>' + feature.properties[$('#properties').val()] + '</h1></div>'
                        + '<br><button id="get-timeseries" style="width: 100%; height: 50px;'
                        + 'background-color: aqua" onclick="timeseriesFromShp(`' + String(feature.properties[$('#properties').val()]) + '`)">'
                        + 'Get Timeseries</button><div id="loading" class="loader"></div>');
    });
}

//ADD A USER SHAPEFILE TO THE MAP
//Ajax call to send the shapefile to the client side
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
            if (shpfileAdded == true) {
                mapObj.removeLayer(user_layer);
            }
            add_user_layers(id);
            $('#uploadshp-modal').modal('hide');
        },
    });
}
///////////////////////////////////////////////////////////////////////////////////

// ASSIGN VARIABLE LAYERS
function assign_variable_layers(file_name, folder) {
    // let date_range = file_name.substr(0, 10) + '/' + file_name.substr(11, 10);
    //let filename = file_name;
    var files = '';
    var current_file = folder;
    while (current_file != filepath) {
        files = current_file + '/' + files;
        current_file = $('#' + current_file).attr('class');
    };
    pathToDisplayedFile = files + file_name;
    $('#layer-prop-select').data('variables', data_viewer_files[file_name]);
    $('#layer-diplay').css('display', 'block');
    layer_name = set_var_select();
    dataLayer = data_layer(file_name, layer_name, files);
    dataLayer.setOpacity($('#layer-opacity').val());
}

function set_var_select() {
    let variables = $('#layer-prop-select').data('variables');
    let time_lat_lon = ['time', 'lat', 'lon', 't', 'T', 'latitude', 'longitude'];
    $('#layer-prop-select').empty();
    for (const [key, value] of Object.entries(variables)) {
        if (value['long_name'] !== undefined) {
            $('#layer-prop-select').append('<option id="' + key + '" value="' + key + '">' + value['long_name'] + '</option>');
        } else if (time_lat_lon.indexOf(key) == -1) {
            $('#layer-prop-select').append('<option id="' + key + '" value="' + key + '">' + key + '</option>');
        }
    }
    var layer_name = $('#layer-prop-select').val();
    return layer_name;
}

////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
function get_timeseries(type, layer) {
    if (pathToDisplayedFile == '') {
        alert('Please select a data layer.');
    } else {
        if (type === 'marker') {
            var coord = layer.getLatLng();
            var lat = coord.lat;
            var lng = coord.lng;
            alert(coord);


            $.ajax({
                url: 'ajax/get_point_values/',
                data: {
                    'lat': lng,
                    'lon': lat,
                    'filename': pathToDisplayedFile,
                    'layer': layer_name,
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
                    'max_lat': max_lat,
                    'max_lon': max_lon,
                    'min_lat': min_lat,
                    'min_lon': min_lon,
                    'filename': pathToDisplayedFile,
                    'layer': layer_name,
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

function timeseriesFromShp(prop_val) {
    $('#get-timeseries').css('display', 'none');
    $('#loading').css('display', 'inline-block');
    if (pathToDisplayedFile == '') {
        alert('Please select a data layer.');
    } else {
        let prop_name = $('#properties').val();
        let geo_file = $('#shp-select').val();
        $.ajax({
            url: 'ajax/get_shp_values/',
            data: {
                'nc_file': pathToDisplayedFile,
                'geo_file': geo_file,
                'prop_name': prop_name,
                'prop_val': prop_val,
                'layer': layer_name,
            },
            dataType: 'json',
            contentType: "application/json",
            method: 'GET',
            success: function (result) {
                draw_graph(result['data'], result['time'], result['value']);
                $('#loading').css('display', 'none');
                $('#get-timeseries').css('display', 'inline-block');
            },
        });
    }
}

/////////////////////////////////////////////////////////////////////////////////////
// MAP EVENT FUNCTIONS, BUTTONS AND SUCH
mapObj.on(L.Draw.Event.CREATED, function (e) {
    var type = e.layerType,
        layer = e.layer;
    drawnItems.addLayer(layer);
    get_timeseries(type, layer);
});

drawnItems.on('click', function (e) {
    var layer = e.layer;
    if (layer instanceof L.Rectangle) {
        var type = 'rectangle';
    } else {
        var type = 'marker';
    }
    get_timeseries(type, layer);
});

$('#add-shp').click(function() {$('#uploadshp-modal').modal('show')});
$('#uploadshp').click(uploadShapefile);
$('#clear-map').click(function () {drawnItems.clearLayers();});
$('#metadata').click(function () {console.log(Object.keys(data_viewer_files))});
$('#layer-opacity').change(function () {dataLayer.setOpacity($('#layer-opacity').val())});
$('#shp-select').change(shp_select);
$('#layer-prop-select').change(layer_prop_select);
$('#delete-shp').click(delete_shp);
$('#rename-shp').click(rename_shp);

//TODO Fix these functions
$('#delete-from-tree').click(delete_file);
$('#add-nc').click(function () {});
$('#download-csv').click(function () {alert('downloaded')});
$('#add-file').click(function () {alert('add file')});
$('#file-metadata').click(function () {alert('metadata');});
