from tethys_sdk.app_settings import CustomSetting
from tethys_sdk.base import TethysAppBase, url_map_maker


class Dataviewer(TethysAppBase):
    """
    Tethys app class for Data Viewer.
    """

    name = 'Data Viewer'
    index = 'dataviewer:home'
    icon = 'dataviewer/images/icon.gif'
    package = 'dataviewer'
    root_url = 'dataviewer'
    color = '#16a085'
    description = ''
    tags = ''
    enable_feedback = False
    feedback_emails = []

    def url_maps(self):
        """
        Add controllers
        """
        UrlMap = url_map_maker(self.root_url)

        url_maps = (
            UrlMap(
                name='home',
                url='dataviewer',
                controller='dataviewer.controllers.home'
            ),
            UrlMap(
                name='uploadShapefile',
                url='dataviewer/ajax/uploadShapefile',
                controller='dataviewer.ajax.uploadShapefile'
            ),
            UrlMap(
                name='plot_at_point',
                url='dataviewer/ajax/get_point_values',
                controller='dataviewer.ajax.get_point_values'
            ),
            UrlMap(
                name='plot_at_shp',
                url='dataviewer/ajax/get_shp_values',
                controller='dataviewer.ajax.get_shp_values'
            ),
            UrlMap(
                name='plot_at_box',
                url='dataviewer/ajax/get_box_values',
                controller='dataviewer.ajax.get_box_values'
            ),
            UrlMap(
                name='file_tree',
                url='dataviewer/options/file_tree',
                controller='dataviewer.options.file_tree'
            ),
            UrlMap(
                name='user_geojsons',
                url='dataviewer/ajax/user_geojsons',
                controller='dataviewer.ajax.user_geojsons'
            ),
        )

        return url_maps

    def custom_settings(self):
        return (
            CustomSetting(
                name='thredds_path',
                type=CustomSetting.TYPE_STRING,
                description='Path to the DATA shared by TDS',
                required=True,
                default="/Users/jonjones/threddsdata/data_viewer/"
            ),
            CustomSetting(
                name='thredds_url',
                type=CustomSetting.TYPE_STRING,
                description='Url to the chirpsapp directory on the TDS',
                required=True,
                default="http://127.0.0.1:7000/thredds/wms/testAll/data_viewer/",
            ),
        )