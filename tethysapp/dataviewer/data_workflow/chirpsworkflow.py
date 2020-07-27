from PIL import Image
import requests
import os
import datetime
import glob
import netCDF4
import numpy
import gzip
import shutil


def remove_characters(string):
    i = 0
    for char in string:
        i += 1
        if char == ',' or char == ' ' or char == '/' or char == '-':
            first_half = string[0:i - 1]
            second_half = string[i:]
            string = first_half + second_half
            i -= 1
    return string


def datetime_to(date, string_string, end_format):
    string = datetime.datetime.strftime(date, end_format)
    if string_string == 'int':
        string = remove_characters(string)
        string = int(string)
    return string


def tifs_to_netcdfs(tif_filepath, nc_filepath, date, filename, num_days):
    tifs = glob.glob(os.path.join(tif_filepath, '*.tif'))
    tifs.sort()
    # make a new netcdf
    #logging.info('Making the netcdf')
    new_nc = netCDF4.Dataset(nc_filepath, 'w')

    # create the variables and dimensions
    new_nc.createDimension('time', None)
    new_nc.createDimension('lat', 2000)
    new_nc.createDimension('lon', 7200)
    time = new_nc.createVariable('time', 'f8', ('time',))
    time.units = 'days since 2000-01-01 00:00:00'
    time.calendar = 'gregorian'
    lat = new_nc.createVariable(varname='lat', datatype='f4', dimensions='lat')
    lon = new_nc.createVariable(varname='lon', datatype='f4', dimensions='lon')
    precipitation = new_nc.createVariable(varname='precipitation', datatype='f4', dimensions=('time', 'lat', 'lon',))
    precipitation.long_name = 'Precipitation'

    # create the lat and lon values
    lat[:] = [-50 + (.05 * i) for i in range(2000)]
    lon[:] = [-180 + (.05 * i) for i in range(7200)]

    time_dim = 0

    for tif in tifs:
        try:
            # Create the time variable
            year = str(date[num_days - time_dim - 1][0])
            month = str(date[num_days - time_dim - 1][1])
            day = str(date[num_days - time_dim - 1][2])

            print(day)
            print(month)
            print(year)

            if month[0] == '0':
                month = month[1:]
            if day[0] == '0':
                day = day[1:]

            file_date = datetime.datetime(int(year), int(month), int(day))
            time[time_dim] = netCDF4.date2num(file_date, units=time.units, calendar=time.calendar)

            # Create tif variable
            raster = Image.open(tif)
            precipitation[time_dim, :, :] = numpy.flipud(numpy.array(raster))
            time_dim += 1

            os.remove(tif)
        except requests.HTTPError as e:
            errorcode = e.response.status_code
            print('\nHTTPError ' + str(errorcode) + ' downloading ' + filename + ' from\n' + url)

    new_nc.close()


def download_files(url, file, filepath):
    print('Downloading: ' + file)
    try:
        with requests.get(url, stream=True) as r:
            r.raise_for_status()
            with open(filepath, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    if chunk:  # filter out keep-alive new chunks
                        f.write(chunk)
    except requests.HTTPError as e:
        errorcode = e.response.status_code
        print('\nHTTPError ' + str(errorcode) + ' downloading ' + file + ' from\n' + url)
        return -1


def dowlaod_historical_chirps(thredds_path):
    base_url = 'https://data.chc.ucsb.edu/products/CHIRPS-2.0/global_daily/tifs/p05/2020/chirps-v2.0.'
    # today = datetime.datetime.today()
    today = datetime.datetime(2020, 2, 25)
    num_days = 1
    date_one = datetime_to(today, 'string', '%Y-%m-%d')
    date_two = datetime_to(today - datetime.timedelta(num_days), 'string', '%Y-%m-%d')
    date = ()

    for num in range(num_days):
        date_to_download = today - datetime.timedelta(num)
        date_string = str(datetime_to(date_to_download, 'int', '%Y-%m-%d'))
        year = date_string[0:4]
        month = date_string[4:6]
        day = date_string[6:8]
        date_formatted = year + '.' + month + '.' + day

        file = date_formatted + '.tif.gz'

        url = base_url + file
        filename = os.path.basename(file)
        filepath = os.path.join(thredds_path, 'CHIRPS', 'Historical', date_string + '.tif.gz')
        date = date + ((year, month, day),)
        print(url)
        print(file)
        print(filepath)
        download_files(url, file, filepath)

    print('Finished Downloads')

    for file in glob.glob(os.path.join(thredds_path, 'CHIRPS', 'Historical', '*.gz')):
        filename = (os.path.basename(file))[:-3]
        with gzip.open(file, 'rb') as tif_file_in:
            with open(os.path.join(thredds_path, 'CHIRPS', 'Historical', filename), 'wb') as tif_file_out:
                shutil.copyfileobj(tif_file_in, tif_file_out)

        os.remove(file)

    nc_filepath = os.path.join(thredds_path, 'CHIRPS', 'Historical', date_two + '_' + date_one + 'historical.nc')
    tif_filepath = os.path.join(thredds_path, 'CHIRPS', 'Historical')

    tifs_to_netcdfs(tif_filepath, nc_filepath, date, filename, num_days)


def download_chirps_forcast(thredds_path):
    base_url = 'https://data.chc.ucsb.edu/products/EWX/data/forecasts/CHIRPS-GEFS_precip/'
    #base_url = 'ftp://ftp.chg.ucsb.edu/pub/org/chg/products/EWX/data/forecasts/CHIRPS-GEFS_precip/'
    first_date = datetime.datetime.today()

    status = download_chiprs_forcast_part_two(first_date, base_url, thredds_path)

    if status == -1:
        print('File not found -- Downloading yesterdays forcast')
        first_date = datetime.datetime.today() - datetime.timedelta(1)
        download_chiprs_forcast_part_two(first_date, base_url, thredds_path)


def download_chiprs_forcast_part_two(first_date, base_url, thredds_path):
    first_date_int = datetime_to(first_date, 'int', '%Y-%m-%d')
    second_date_5day = first_date + datetime.timedelta(4)
    second_date_10day = first_date + datetime.timedelta(9)
    second_date_15day = first_date + datetime.timedelta(14)

    data_type = ('05day', '10day', '15day')
    second_date = (second_date_5day, second_date_10day, second_date_15day)

    for i in range(len(data_type)):
        second_date_int = datetime_to(second_date[i], 'int', '%Y-%m-%d')
        file = data_type[i] + '/precip_mean/data-mean_' + str(first_date_int) + '_' + str(second_date_int) + '.tif'
        url = base_url + file

        filename = os.path.basename(file)
        filepath = os.path.join(thredds_path, 'CHIRPS', 'Forcasts',
                                str(first_date_int) + '-' + str(second_date_int) + '_' + data_type[i] + '.tif')

        status = download_files(url, file, filepath)
        if status == -1:
            return status

        download_filepath = os.path.join(thredds_path, 'CHIRPS', 'Forcasts')
        nc_filepath = os.path.join(download_filepath, datetime_to(first_date, 'string', '%Y-%m-%d') + '_'
                                   + datetime_to(second_date[i], 'string', '%Y-%m-%d') + '_' + data_type[i] + '.nc')
        date = ((str(first_date_int)[0:4], str(first_date_int)[4:6], str(first_date_int)[6:8]),)

        tifs_to_netcdfs(download_filepath, nc_filepath, date, filename, 1)

'''
def update_netcdfs(file, date, thredds_path):
    new_filename = os.path.basename(file)[:17]
    nc = file
    print(nc)
    tifs = glob.glob(os.path.join(thredds_path, '*.tif'))
    tifs.sort()
    print(tifs)

    nc_file = netCDF4.Dataset(nc, 'a')
    precipitation = nc_file.variables['precipitation']
    time = nc_file.variables['time']
    time_step = precipitation.shape[0]

    for tif in tifs:
        # Create the time variable
        year = os.path.basename(os.path.join(thredds_path, tif))[6:10]
        month = os.path.basename(os.path.join(thredds_path, tif))[10:12]
        day = os.path.basename(os.path.join(thredds_path, tif))[12:14]

        if month[0] == '0':
            month = month[1:]
        if day[0] == '0':
            day = day[1:]

        print(month)
        print(day)
        print(year)

        date = datetime.datetime(int(year), int(month), int(day))
        print(date)
        time[time_step] = netCDF4.date2num(date, units=time.units, calendar=time.calendar)

        # Create tif variable
        raster = Image.open(tif)
        precipitation[time_step, :, :] = numpy.array(raster)
        time_step += 1
        os.remove(tif)


    nc_file.close()

    date = datetime_to(date, 'string', '%Y-%m-%d')
    print(date)
    print(new_filename)
    os.rename(nc, os.path.join(thredds_path, new_filename + date + '_r.nc'))


def run_workflow(request):
    date_one = request.GET['date_one']
    date_two = request.GET['date_two']
    data_type = request.GET['data_type']
    thredds_path = App.get_custom_setting('thredds_path')

    date_one = date_one.strip('"')
    date_two = date_two.strip('"')
    data_type = data_type.strip('"')

    downlaod_chirps_data(thredds_path, date_one, date_two, data_type)
    chirpsgefs_tifs_to_netcdfs(thredds_path, date_one, date_two, data_type)

    message = 'Your data is uploaded'

    return JsonResponse({'message': message})


#if __name__ == '__main__':
 #   download_tiffs(thredds_path=sys.argv[1])
'''
#download_chirps_forcast('/Users/jonjones/threddsdata/data_viewer/')
dowlaod_historical_chirps('/Users/jonjones/threddsdata/data_viewer/')
