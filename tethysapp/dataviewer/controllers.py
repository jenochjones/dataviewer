from django.shortcuts import render
from tethys_sdk.permissions import login_required
from .app import Dataviewer as App

@login_required()
def home(request):
    """
    Controller for the app home page.
    """

    context = {
        'thredds_url': App.get_custom_setting('thredds_url'),
    }

    return render(request, 'dataviewer/home.html', context)
