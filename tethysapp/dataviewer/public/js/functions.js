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
//////////////////////////////////////////////////////////////////////////////////

function delete_file() {
    let file_to_delete = pathToDisplayedFile.split('\\').pop().split('/').pop();
    confirm('Are you sure you want to delete ' + file_to_delete + '?');
}

function delete_shp() {
    let shp_name = $('#shp-select').val();
    var r = confirm('Are you sure you want to delete ' + shp_name + '?');

    if (r == true) {
        $.ajax({
        url: 'ajax/delete_shp/',
        data: {'shp_name': shp_name},
        dataType: 'json',
        contentType: "application/json",
        method: 'GET',
        success: function (result) {
            let results = result['result'];
            if (results == true) {
                $('#shp-select').empty();
                shpLayer.clearLayers();
                addUserLayers('none');
            }
        },
        });
    }
}

function expand_tree(id, tree_class) {
    var id_string = String(id);
    if (id_string.substr(-3) == '.nc' || id_string.substr(-5) == '.ncml') {
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

function expand_tree_modal(id) {
    var checkBox = document.getElementById(id);
    if (checkBox.checked == true){
        $('.' + id).show();
    } else {
        hide_elements(id);
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

function rename_shp() {
    let shp_name = $('#shp-select').val();
    let new_name = prompt('New name of the layer (without file extension)', 'example_shp');
    $.ajax({
        url: 'ajax/rename_shp/',
        data: {
            'shp_name': shp_name,
            'new_name': new_name,
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
            }
        },
    });
}

function shp_select() {
    let id = $('#shp-select').val();
    let geo_layer = $('#' + id.split(" ").join("") + '').data('layer');
    let prop_id = $('#' + id.split(" ").join("") + '').data('options');
    $('#properties').empty();
    $('#properties').append(prop_id);
    mapObj.flyToBounds(geo_layer.getBounds());
}

function layer_prop_select() {
    let filename = pathToDisplayedFile.split('\\').pop().split('/').pop();
    let files = pathToDisplayedFile.split("/").slice(0, -1).join("/")+"/";
    let layer_name = $('#layer-prop-select').val();
    dataLayer = data_layer(filename, layer_name, files);
}