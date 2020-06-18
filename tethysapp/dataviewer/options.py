from django.http import JsonResponse
from .app import Dataviewer as App
import glob
import datetime
import os
import json


def walk_files(path, dictionary):
    print(path)
    print(os.path.basename(path))
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
    print(filetree)

    return JsonResponse({'filetree': filetree_json})

'''
def file_level_one(request):
    option = request.GET['option']
    option = option.strip('"')
    thredds_path = App.get_custom_setting('thredds_path')
    files = glob(os.path.join(thredds_path, '*'))
    files.sort()
    file_one_names = ()

    for n, file in enumerate(files):
        file_one_name = os.path.basename(file)
        file_one_names = file_one_names + (file_one_name,)

    file_one_names_json = json.dumps(file_one_names)

    if str(option) == 'none':
        options = file_one_names[0]
    else:
        options = option

    names_json2, val_json2 = file_level_two(options)

    return JsonResponse({'file_one_names': file_one_names_json, 'names_json2': names_json2, 'val_json2': val_json2})


def file_level_two(options):
    thredds_path = App.get_custom_setting('thredds_path')
    files = glob(os.path.join(thredds_path, options, '*.nc'))
    files.sort()
    names2 = ()
    val2 = ()

    for file in files:
        data_type = os.path.basename(file)[22:-3]
        date = os.path.basename(file)[:10]
        date2 = os.path.basename(file)[11:21]
        date_formatted = datetime.datetime.strptime(date, '%Y-%m-%d')
        date_formatted2 = datetime.datetime.strptime(date2, '%Y-%m-%d')
        date_string = datetime.datetime.strftime(date_formatted, '%b %d %Y')
        date_string2 = datetime.datetime.strftime(date_formatted2, '%b %d %Y')
        name = data_type + ' ' + date_string + ' - ' + date_string2
        names2 = names2 + (name,)

        value = os.path.basename(file)
        val2 = val2 + (value,)

    names_json2 = json.dumps(names2)
    val_json2 = json.dumps(val2)

    return names_json2, val_json2
'''
