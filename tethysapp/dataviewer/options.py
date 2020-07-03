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

def get_nc_attr(request):
    last_half_filepath = request.GET['filename'].strip('"')
    thredds_path = App.get_custom_setting('thredds_path')
    full_path = os.path.join(thredds_path, last_half_filepath)
    src = netCDF4.Dataset(full_path)
    variables = {}

    for name, variable in src.variables.items():
        name_val = {}
        for attrname in variable.ncattrs():
            name_val[attrname] = getattr(variable, attrname)
        variables[name] = name_val

    variable_dict = json.dumps(variables)
    return JsonResponse({'variables': variable_dict})
