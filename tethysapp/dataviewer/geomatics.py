import geomatics

# Data

def noaa_gfs(save_path, steps):
    geomatics.data.download_noaa_gfs(save_path, steps,) #save_path: str, steps: int, timestamp: datetime.datetime = False,
                                                        #variables: list = False, convertlatlon: bool = False


def nasa_gldas():
    geomatics.data.download_nasa_gldas() #save_path: str, start: datetime.date, end: datetime.date, chunk_size: int = 10240


def livingatlas():
    geomatics.data.get_livingatlas_geojson() #location: str = None


def gen_affine():
    geomatics.data.gen_affine() #path: str, x_var: str = 'lon', y_var: str = 'lat', engine: str = None,
                                #xr_kwargs: dict = None, h5_group: str = None


def gen_ncml():
    geomatics.data.gen_ncml() #files: list, save_dir: str, time_interval: int


# Convert

def geojson_to_shapefile():
    geomatics.convert.geojson_to_shapefile() #geojson: dict, savepath: str


def to_gtiffs():
    geomatics.convert.to_gtiffs() #files: list, var: str, engine: str = None,
                                  #aff: <sphinx.ext.autodoc.importer._MockObject object at 0x7ff241b71358> = None,
                                  #crs: str = 'EPSG:4326', x_var: str = 'lon', y_var: str = 'lat', xr_kwargs: dict = None,
                                  #h5_group: str = None, fill_value: int = -9999, save_dir: str = False, delete_sources: bool = False


def to_mb_gtiff():
    geomatics.convert.to_mb_gtiff() #files: list, var: str, engine: str = None,
                                    #aff: <sphinx.ext.autodoc.importer._MockObject object at 0x7ff241b719e8> = None,
                                    #crs: str = 'EPSG:4326', x_var: str = 'lon', y_var: str = 'lat', xr_kwargs: dict = None,
                                    #h5_group: str = None, fill_value: int = -9999, save_dir: str = False, save_name: str = False,
                                    #delete_sources: bool = False


def upsample_gtiff():
    geomatics.convert.upsample_gtiff() #files: list, scale: float


    # Inspect

def netcdf():
    geomatics.inspect.netcdf() #path


def grib():
    geomatics.inspect.grib() #path: str, xr_kwargs: dict = None


def hdf5():
    geomatics.inspect.hdf5() #path: str


def geotiff():
    geomatics.inspect.geotiff() #path: str


def georeferencing():
    geomatics.inspect.georeferencing() #file: str, engine: str = None, x_var: str = 'lon', y_var: str = 'lat',
                                      #xr_kwargs: dict = None, h5_group: str = None

# Timeseries

def timeseries_at_point():
    geomatics.timeseries.point() #files: list, var: str, coords: tuple, dims: tuple = None, t_dim: str = 'time',
                                 #strp: str = False, fill_value: int = -9999, engine: str = None, h5_group: str = None,
                                 #xr_kwargs: dict = None

def timeseries_at_bounding_box():
    geomatics.timeseries.bounding_box() #files: list, var: str, min_coords: tuple, max_coords: tuple, dims: tuple = None,
                                        #t_dim: str = 'time', strp: str = False, stats: str = 'mean',
                                        #fill_value: int = -9999, engine: str = None, h5_group: str = None, xr_kwargs: dict = None


def timeseries_at_polygons():
    geomatics.timeseries.polygons() #files: list, var: str, min_coords: tuple, max_coords: tuple, dims: tuple = None,
                                    #t_dim: str = 'time', strp: str = False, stats: str = 'mean', fill_value: int = -9999,
                                    #engine: str = None, h5_group: str = None, xr_kwargs: dict = None


def timeseries_at_full_array_stats():
    geomatics.timeseries.full_array_stats() #files: list, var: str, t_dim: str = 'time', strp: str = False,
                                            #stats: str = 'mean', fill_value: int = -9999, engine: str = None,
                                            #h5_group: str = None, xr_kwargs: dict = None


noaa_gfs('/Users/jonjones/Desktop/Test', 4)
