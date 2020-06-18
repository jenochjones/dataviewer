from django.shortcuts import render
from tethys_sdk.permissions import login_required
from tethys_sdk.gizmos import SelectInput
from .app import Dataviewer as App

@login_required()
def home(request):
    """
    Controller for the app home page.
    """
    from tethys_sdk.gizmos import SelectInput

    select_data_source = SelectInput(
        name='select_data_source',
        multiple=False,
        options=[('One', '1'), ('Two', '2'), ('Three', '3')],
        initial=['Three'],
    )

    context = {
        'select_data_source': select_data_source,
        'thredds_url': App.get_custom_setting('thredds_url'),
    }

    return render(request, 'dataviewer/home.html', context)
