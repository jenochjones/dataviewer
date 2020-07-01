from django.http import JsonResponse
from .app import Dataviewer as App
import glob
import os
import json


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

