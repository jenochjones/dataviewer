from django.http import JsonResponse
from .app import Dataviewer as App
import geomatics as geo
import pandas as pd
import geopandas
import os
import glob
import json
import geojson as gj


###################################################################################

# MAP CONTROLLERS

def rename_shp(request):
    try:
        shp_name = request.GET['shp_name'].strip('"')
        new_name = request.GET['new_name'].strip('"')
        directory = os.path.join(os.path.dirname(__file__), 'workspaces', 'app_workspace')
        os.rename(os.path.join(directory, shp_name + '.geojson'), os.path.join(directory, new_name + '.geojson'))
        result = True
    except:
        result = False

    return JsonResponse({'new_name': new_name, 'result': result})


def delete_shp(request):
    try:
        shp_name = request.GET['shp_name'].strip('"')
        directory = os.path.join(os.path.dirname(__file__), 'workspaces', 'app_workspace')
        os.remove(os.path.join(directory, shp_name + '.geojson'))
        result = True
    except:
        result = False

    return JsonResponse({'result': result})


####################################################################################

def shp_to_geojson(file_path):
    file_list = glob.glob(os.path.join(file_path, '*.shp'))
    filepath = file_list[0]
    file = os.path.basename(filepath)
    filename = os.path.splitext(file)[0]
    new_directory = os.path.join(os.path.dirname(__file__), 'workspaces', 'app_workspace')

    shpfile = geopandas.read_file(filepath)
    shpfile.to_file(os.path.join(new_directory, filename + '.geojson'), driver='GeoJSON')

    book = open(os.path.join(new_directory, filename + '.geojson'), "r")
    geojson_file = book.read()

    return geojson_file, filename


def uploadShapefile(request):
    files = request.FILES.getlist('files')
    shp_path = os.path.join(os.path.dirname(__file__), 'workspaces', 'user_workspaces')

    # write the new files to the directory
    for n, file in enumerate(files):
        with open(os.path.join(shp_path, file.name), 'wb') as dst:
            for chunk in files[n].chunks():
                dst.write(chunk)


    geojson, filename = shp_to_geojson(shp_path)
    filenames = json.dumps(filename)

    for file in glob.glob(os.path.join(shp_path, '*')):
        if os.path.splitext(os.path.basename(file))[0] == filename:
            os.remove(file)

    return JsonResponse({'filenames': filenames})

def user_geojsons(request):
    geojson_path = os.path.join(os.path.dirname(__file__), 'workspaces', 'app_workspace')
    files = glob.glob(os.path.join(geojson_path, '*.geojson'))
    geojson = []
    filenames = []

    for file in files:
        geojson.append(geopandas.read_file(file))
        filenames.append(os.path.basename(file)[:-8])

    geojson = json.dumps(geojson)
    filenames = json.dumps(filenames)
    return JsonResponse({'geojson': geojson, 'filenames': filenames})

############################################################################################

# GEOMATICS FUNCTIONS

def write_new_geojson(filename, prop_name, prop_val, new_geojson):
    geojson = (os.path.join('/Users/jonjones/tethysdev/apps/tethysapp-dataviewer/tethysapp/dataviewer/',
                            'workspaces', 'app_workspace', filename + '.geojson'))

    with open(geojson) as jsonfile:
        data = json.load(jsonfile)

    for feature in data['features']:
        if feature['properties'][prop_name] == prop_val:
            new_file = open(new_geojson, 'w')
            gj.dump(feature, new_file)
            new_file.close()


# GET TIMESERIES VALUES
def get_point_values(request):
    lat = request.GET['lat']
    lon = request.GET['lon']
    filename = request.GET['filename'].strip('"')
    var = request.GET['layer'].strip('"')

    thredds_path = App.get_custom_setting('thredds_path')
    file = os.path.join(thredds_path, filename)
    series = geo.timeseries.point([file], var, (float(lat), float(lon)), ('lon', 'lat'), 'time')
    data = pd.DataFrame.to_json(series)
    time = 'datetime'
    value = 'values'

    return JsonResponse({'data': data, 'time': time, 'value': value})


def get_shp_values(request):
    nc_file = request.GET['nc_file'].strip('"')
    geo_file = request.GET['geo_file'].strip('"')
    prop_name = request.GET['prop_name'].strip('"')
    prop_val = request.GET['prop_val'].strip('"')
    var = request.GET['layer'].strip('"')

    new_geojson = os.path.join('/Users/jonjones/tethysdev/apps/tethysapp-dataviewer/tethysapp/dataviewer/',
                               'workspaces', 'user_workspaces', 'temp.geojson')

    write_new_geojson(geo_file, prop_name, prop_val, new_geojson)

    thredds_path = App.get_custom_setting('thredds_path')
    file = os.path.join(thredds_path, nc_file)
    series = geo.timeseries.polygons(files=[file], var=var, poly=new_geojson,
                                     dims=('lon', 'lat'), t_dim='time', stats='mean,max,median,min,sum,std')
    data = pd.DataFrame.to_json(series)
    time = 'datetime'
    value = ('mean', 'max', 'median', 'min', 'sum', 'std')

    return JsonResponse({'data': data, 'time': time, 'value': value})


def get_box_values(request):
    max_lat = request.GET['max_lat']
    max_lon = request.GET['max_lon']
    min_lat = request.GET['min_lat']
    min_lon = request.GET['min_lon']
    filename = request.GET['filename'].strip('"')
    var = request.GET['layer'].strip('"')

    thredds_path = App.get_custom_setting('thredds_path')
    file = os.path.join(thredds_path, filename)
    series = geo.timeseries.bounding_box([file], var, (float(min_lon), float(min_lat)),
                                         (float(max_lon), float(max_lat)), ('lon', 'lat'), 'time', stats='mean,max,median,min,sum,std')
    data = pd.DataFrame.to_json(series)
    time = 'datetime'
    value = ('mean', 'max', 'median', 'min', 'sum', 'std')

    return JsonResponse({'data': data, 'time': time, 'value': value})



