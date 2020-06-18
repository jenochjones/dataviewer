from django.http import JsonResponse
from .app import Dataviewer as App
import geomatics as geo
import pandas as pd
import geopandas
import os
import glob


def shp_to_geojson(file_path):
    file_list = glob.glob(os.path.join(file_path, '*.shp'))
    filepath = file_list[0]
    file = os.path.basename(filepath)
    filename = os.path.splitext(file)[0]
    new_directory = os.path.join(os.path.dirname(__file__), 'workspaces', 'app_workspace')

    shpfile = geopandas.read_file(os.path.join(filepath))
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

    for file in glob.glob(os.path.join(shp_path, '*')):
        if os.path.splitext(os.path.basename(file))[0] == filename:
            os.remove(file)

    return JsonResponse({'geojson': geojson})

############################################################################################

# GET TIMESERIES VALUES
def get_point_values(request):
    lat = request.GET['lat']
    lon = request.GET['lon']
    filename = request.GET['filename'].strip('"')
    thredds_path = App.get_custom_setting('thredds_path')
    var = 'precipitation'
    file = os.path.join(thredds_path, filename)
    series = geo.timeseries.point([file], var, (float(lat), float(lon)), ('lon', 'lat'), 'time')
    data = pd.DataFrame.to_json(series)
    time = 'datetime'
    value = 'values'

    return JsonResponse({'data': data, 'time': time, 'value': value})


def get_shp_values(request):
    lat = request.GET['lat']
    lon = request.GET['lon']

    thredds_path = App.get_custom_setting('thredds_path')
    filename = 'chirpsgefs_20200520.nc'
    var = 'precipitation'
    file = os.path.join(thredds_path, filename)
    series = geo.timeseries.polygons([file], var, (lat, lon))
    data = pd.DataFrame.to_json(series)

    return JsonResponse({'data': data})


def get_box_values(request):
    max_lat = request.GET['max_lat']
    max_lon = request.GET['max_lon']
    min_lat = request.GET['min_lat']
    min_lon = request.GET['min_lon']
    filename = request.GET['filename'].strip('"')

    thredds_path = App.get_custom_setting('thredds_path')
    var = 'precipitation'
    file = os.path.join(thredds_path, filename)
    series = geo.timeseries.bounding_box([file], var, (float(min_lon), float(min_lat)),
                                         (float(max_lon), float(max_lat)), ('lon', 'lat'), 'time')
    data = pd.DataFrame.to_json(series)
    time = 'datetime'
    value = 'mean'

    return JsonResponse({'data': data, 'time': time, 'value': value})



