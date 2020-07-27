from django.http import JsonResponse
from .app import Dataviewer as App
import glob
import os
import json
import netCDF4


def walk_files(path, dictionary):
    file = glob.glob(os.path.join(path, '*'))
    filename = ()
    for files in file:
        filename = filename + ((os.path.basename(files)),)

    if file != []:
        dictionary.update({os.path.basename(path): filename})
        for files in file:
            walk_files(os.path.join(path, files), dictionary)

    return dictionary


def file_tree(request):
    dictionary = {}
    thredds_path = App.get_custom_setting('thredds_path')

    if thredds_path[-1] == '/':
        thredds_path = thredds_path[:-1]

    filetree = walk_files(thredds_path, dictionary)
    filetree_json = json.dumps(filetree)

    return JsonResponse({'filetree': filetree_json})


def get_array_from_file():
    path = os.path.join(os.path.dirname(__file__), 'public', 'js', 'layer_metadata.js')
    file = open(path, "r")
    string = file.read()
    if string == '':
        array = {}
        return array
    else:
        loc = string.find('{')
        json_array = string[loc:]
        file.close()
        array = json.loads(json_array)
        return array


def print_to_file(array):
    array = json.dumps(array)
    path = os.path.join(os.path.dirname(__file__), 'public', 'js', 'layer_metadata.js')
    file = open(path, "w")
    stuff_to_write = 'const data_viewer_files = ' + str(array)
    file.write(stuff_to_write)
    file.close()


def arrange_array(filepath):
    src = netCDF4.Dataset(filepath)
    variables = {}
    times = ''

    for name, variable in src.variables.items():
        name_val = {}

        for attrname in variable.ncattrs():
            name_val[attrname] = str(getattr(variable, attrname)).strip('"')
        variables[name] = name_val

    if 'time' in variables:
        timearray = src.variables["time"][:]
    if 'units' in variables["time"]:
        units = src.variables["time"].units
    else:
        units = 'hours since 1-1-1 00:00:0.0'
    if 'calendar' in variables["time"]:
        cal = src.variables["time"].calendar
    else:
        cal = 'gregorian'

    if 'time' in variables:
        for t in timearray:
            date = netCDF4.num2date(times=int(t), units=units, calendar=cal)
            times = times + str(date) + ','

    variables['time_step'] = times
    return variables


def file_metadata(path, array):
    file = glob.glob(os.path.join(path, '*'))
    for files in file:
        if files[-3:] == '.nc':
            x = 0
            for element in array:
                if element == os.path.basename(files):
                    x += 1

            if x == 0:
                metadata = arrange_array(files)
                array[os.path.basename(files)] = metadata

    if file != []:
        for files in file:
            file_metadata(os.path.join(path, files), array)

    return array


def create_metadata_array(request):
    path = App.get_custom_setting('thredds_path')
    array = {}
    complete_array = file_metadata(path, array)
    print_to_file(complete_array)
    message = True
    return JsonResponse({'message': message})
