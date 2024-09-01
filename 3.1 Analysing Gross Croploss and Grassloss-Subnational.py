#!/usr/bin/env python
# coding: utf-8

# In[1]:


import xarray as xr
import geopandas as gpd
import regionmask
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
from tqdm import tqdm
import rasterio
from rasterio.mask import mask


# In[2]:


import math

# Calculate area
def areaquad(lat_max, lat_min, lon_max, lon_min, csize, shape, datum = 'wgs84', unit='km'):
    global r2
    '''Creates a GCS raster with cell size csize where the cell value is the
    area of the cell in the unit specified
    Usage: >>> test = areaquad(lat_max, lat_min, lon_max, lon_min, 'wgs84', 0.25, 'km')'''

    # Common ellipsoid library major, minor axis.
    # Can add more ellipsoids to dictionary library as you go
    datum_lib = {'wgs84': [6378137.0, 6356752.3],
                 'nad83': [6378137.0, 6356752.3],
                 'nad27': [6378206.4, 6356583.8],
                 'sad69': [6378160.0, 6356774.72],
                 'sirgas2000': [6378137.0, 6356752.3]}
    a, b = datum_lib.get(datum) # Get ellipsoid parameters
    e2 = (a**2 - b**2)/(a**2)
    e = math.sqrt(e2) # Eccentricity
    r_2 = math.sqrt((a**2/2) + (b**2/2) * (math.atanh(e)/e)) # Authalic radius

    # Output array dimension
    nrow = shape[0]
    ncol = shape[1]

    # Create arrays of cells of equal size in dd, convert to radians
    lats1 = np.linspace(lat_max, lat_min + csize, num=nrow)
    lats2 = lats1 - csize
    latin1 = np.radians(lats1)
    latin2 = np.radians(lats2)

    # Convert latitudes to authalic latitudes. See Snyder (1987, p.16 eq. 3-18)
    # (want to find beta, not theta, that's why you subtract the series)
    # Factor expansion series
    fact1 = e**2 / 3 + 31 * e**4 / 180 + 517 * e**6 / 5040 # Expansion series 1
    fact2 = 23 * e**4 / 360 + 251 * e**6 / 3780 # Expansion series 2
    fact3 = 761 * e**6 / 45360 # Expansion series 3
    latout1 = latin1 - fact1 * np.sin(2 * latin1) + fact2 * np.sin(4 * latin1) + fact3 * np.sin(6 * latin1)
    latout2 = latin2 - fact1 * np.sin(2 * latin2) + fact2 * np.sin(4 * latin2) + fact3 * np.sin(6 * latin2)

    # report value in preferred unit
    if unit == 'm':  # either in meters or km (default)
        r2 = r_2  # radius in meters
    else:
        r2 = r_2 / 1000.0  # in km
    # calculate area of square on spherical surface
    cst = (np.pi / 180) * (r2 ** 2)  # just a constant; see Snyder 1987.
    area = cst * (np.absolute(np.sin(latout1) - np.sin(latout2))) * np.absolute(csize)
    # replicate column over Earth's extent
    grid = np.tile(area, (ncol, 1)).T  # replicate lat and transpose because
    # area is stored as a row array, not column
    return grid * 100  # Converted to ha


# In[3]:


# Load the shapefile
shapefile_path = '/home/chandra/backup/Chalmers/Other_datasets/GADM_Brazil/gadm41_BRA_2.shp'
gdf = gpd.read_file(shapefile_path)


# In[4]:


gdf

# Load the feature collection (i.e., boundary shapefile in csv format) needed to simulate aggregation
# Note: that this csv file will just contain countries names, but the actual boundary (be it first or second level admin boundary) that is being simulated should be uploaded in GEE
GADM_countries = pd.read_csv("/home/chandra/backup/Chalmers/GADM_Boundaries.csv")

# Groupby and count the attributes/shapes in the dataframe, just to get a sense of number of distinct sub-boundaries within a country
counts = GADM_countries.groupby('COUNTRY').size().reset_index(name='count')

# Resulting dataframe with distinct Countries and unique sub-boundaries within them
Countries = pd.DataFrame(counts[['COUNTRY', 'count']]).sort_values(by='count')

# Check total countries that will be simulated
Countries = Countries.COUNTRY.values
Countries.sort()
# In[6]:


def Gross_change(Country, year):
    
    global clipped, pixel_area, result_crop, result_grass
    
    # Filter the shapefile to extract the geometry
    shape = gdf[gdf['GID_2'] == Country]
    
    # Get the bounding box of the Sweden GeoDataFrame
    bounds = shape.total_bounds
    # Extract lat_max, lat_min, lon_max, lon_min
    lon_min, lat_min, lon_max, lat_max = bounds
    """
    # Print the extracted values
    print('lat_max:', lat_max)
    print('lat_min:', lat_min)
    print('lon_max:', lon_max)
    print('lon_min:', lon_min)
    """
    
    # Load the TIFF file
    tiff_path = '/home/chandra/backup/Chalmers/Other_datasets/C3S-LC-L4-LCCS-Map-300m-P1Y-'+str(year-1)+'-v2.1.1.tif'
    with rasterio.open(tiff_path) as src:
        # Clip the TIFF using the shapefile's geometry
        clipped, transform = mask(src, shapes=shape.geometry, crop=True)
        
        # Update the metadata
        meta = src.meta.copy()
        meta.update({
            'height': clipped.shape[1],
            'width': clipped.shape[2],
            'transform': transform
        })
    csize = transform[0]
    shape_array = clipped[0].shape
    #print('Cell size:', csize)
    #print('shape:', shape_array)
    
    # Load the TIFF file
    tiff_path = '/home/chandra/backup/Chalmers/Other_datasets/C3S-LC-L4-LCCS-Map-300m-P1Y-'+str(year)+'-v2.1.1.tif'
    with rasterio.open(tiff_path) as src:
        # Clip the TIFF using the shapefile's geometry
        clipped1, transform = mask(src, shapes=shape.geometry, crop=True)

        # Update the metadata
        meta = src.meta.copy()
        meta.update({
            'height': clipped1.shape[1],
            'width': clipped1.shape[2],
            'transform': transform
        })
    
    pixel_area = areaquad(lat_max, lat_min, lon_max, lon_min, csize, shape_array) # Pixel area in 'ha'
    # Load the confidence matrix as a DataFrame
    Conversion_matrix = pd.read_excel('/home/chandra/backup/Chalmers/Other_datasets/Conversion factor Li et al 2017.xlsx', 'Aggregated CF', index_col=0).fillna(0)

    # Get the pixel values as arrays
    PFT_y_values = clipped1[0] 
    PFT_y_1_values = clipped[0] 

    # Initialize an empty array for the results
    result_crop = np.zeros_like(PFT_y_values, dtype=float)
    result_grass = np.zeros_like(PFT_y_values, dtype=float)

    # Iterate over each pixel
    for i in range(len(PFT_y_values)):
        # Get the pixel values for A and B
        a_pixel = PFT_y_values[i]
        b_pixel = PFT_y_1_values[i]
        area = pixel_area[i]
        
        if Country == 'Sudan':
            a_pixel = np.where(a_pixel == 151, 150, a_pixel) # Something weird happing with two pixel getting a value of 151 (not in their classification)
            b_pixel = np.where(b_pixel == 151, 150, b_pixel)
        # Get the conversion factor from the confidence matrix
        crop_conversion_factor_a_pixel = Conversion_matrix.loc[a_pixel, 'Crop']
        crop_conversion_factor_b_pixel = Conversion_matrix.loc[b_pixel, 'Crop']

        grass_conversion_factor_a_pixel = Conversion_matrix.loc[a_pixel, 'Grass']
        grass_conversion_factor_b_pixel = Conversion_matrix.loc[b_pixel, 'Grass']

        # Calculate the result for the current pixel
        result_crop[i] = (crop_conversion_factor_a_pixel.values - crop_conversion_factor_b_pixel.values)*area/100 # Converting pecentage to ratio; Area in 'ha'
        result_grass[i] = (grass_conversion_factor_a_pixel.values - grass_conversion_factor_b_pixel.values)*area/100
    
    result_crop_loss = np.sum(result_crop[result_crop < 0])
    result_grass_loss = np.sum(result_grass[result_grass < 0])
    return result_crop_loss, result_grass_loss


def process_subregions(year):
    Li_et_al = pd.DataFrame()
    Li_et_al['Country'] = gdf['GID_2'].values
    print(year)
    
    Croploss_final = []
    Grassloss_final = []
    
    for Country in tqdm(gdf['GID_2'].values): 
        Croploss, Grassloss = Gross_change(Country, year)
        Croploss_final.append(Croploss)
        Grassloss_final.append(Grassloss)
    
    Li_et_al['Croploss_'+str(year)] = Croploss_final
    Li_et_al['Grassloss_'+str(year)] = Grassloss_final
    
    Li_et_al.loc[:, Li_et_al. columns != 'Country'] = Li_et_al.loc[:, Li_et_al. columns != 'Country']/(10**8) # Converting to 'Million km2'
    Li_et_al.to_csv(f'/home/chandra/backup/Chalmers/Other_datasets/Li_et_al_2017_Brazil_Gross_cropland_grassland_changes_{year}.csv', index=False)
    

import datetime
from multiprocessing import Pool

if __name__ == '__main__':
    pool = Pool()
    start_indices = np.arange(2001, 2023, 1) # Running it in groups of 100, 10 times
    pool.map(process_subregions, start_indices)
    pool.close()
    pool.join()

# In[ ]:




