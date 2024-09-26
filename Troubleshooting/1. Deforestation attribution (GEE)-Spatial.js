print('start-time', new Date())

var Admin_boundary = 'Bulgaria'

// Add end year
var end_year = 2022

//###########################
var geometry = ee.FeatureCollection('FAO/GAUL/2015/level0');
// Get the unique values for a specific property in the feature collection
var uniqueValues_ADM2CODE = geometry.filter(ee.Filter.eq('ADM0_NAME', Admin_boundary)).distinct('ADM0_NAME').aggregate_array('ADM0_NAME');

// Filter the geometry FeatureCollection based on the ADM2_CODE property values
geometry = geometry.filter(ee.Filter.inList('ADM0_NAME', uniqueValues_ADM2CODE));

// Show the state polygon with a blue outline
var outline = ee.Image().byte().paint({
  featureCollection: geometry,
  color: 1,
  width: 1
});
Map.addLayer(outline, {palette: ['FFFFFF']}, 'AOI', false)

//###########################



//###########################################################
// Load the feature collection needed to simulate aggregation
//###########################################################

var geometry = ee.FeatureCollection("projects/lu-chandrakant/assets/GADM_dissolved")
Map.addLayer(geometry, {}, 'Shape (All boundaries)', false)


// Get the unique values for a specific property in the feature collection
var uniqueValues_ADM2CODE = geometry.filter(ee.Filter.eq('COUNTRY', Admin_boundary)).distinct('COUNTRY').aggregate_array('COUNTRY');

// Filter the geometry FeatureCollection based on the ADM2_CODE property values
geometry = geometry.filter(ee.Filter.inList('COUNTRY', uniqueValues_ADM2CODE));

Map.addLayer(geometry, {color: 'white', strokeWidth: 1}, 'Shape (Simulated boundaries)', false)

//print(geometry.size())
//print(geometry)

/*
// Get the number of features in the filtered geometry FeatureCollection
var count = geometry.size();

// Create a list of FeatureCollections containing 5 features each
var subgroups = ee.List.sequence(0, count.subtract(1), 5).map(function(startIndex) {
  return geometry.toList(5, startIndex);
});

// Print the subgroups
//print(ee.FeatureCollection(subgroups.get(0)).geometry())
*/

//###########################################################p
// Initial runs
//###########################################################
// Assuming tree cover greater than and equal to (≥) 25% is considered forest in Hansen dataset
var Forest_threshold = 25

// Forestloss attribution to plantation
//Case-1: Plantation with startyear after (>) 2000 classified as new plantation's
var Plantation_threshold_case_1 = 2000
//Case-2: 
//var Plantation_threshold_case_2 = 2

//###########################################################
// Load the feature collection needed to simulate aggregation
//###########################################################

//function final(uniqueValues_ADM2CODE) {


//###########################################################
// Load tree cover and tree cover loss dataset (Hansen et al. 2013)
//###########################################################
// Check --> https://www.science.org/doi/10.1126/science.1244693p

//Load the latest version of the dataset and select the variables needed to be processed
var Hansen_data = ee.Image("UMD/hansen/global_forest_change_2022_v1_10")
    .select(['treecover2000', 'loss', 'lossyear']);
Hansen_data = Hansen_data.clip(geometry)

//###########################################################
// Load global plantation dataset (Du et al. 2022)
//###########################################################
// Check --> https://www.nature.com/articles/s41597-022-01260-2

//////// Extracting 'plantyear' ////////////////////
// Define list of image names
var imageNames = ["pYear_1", "pYear_2", "pYear_3", "pYear_4", "pYear_5", "pYear_6", "pYear_7", "pYear_8", "pYear_9", "pYear_10", "pYear_11", "pYear_12", "pYear_13", "pYear_14"];

// Map over image names to create a list of images
var images = ee.ImageCollection.fromImages(imageNames.map(function(name) {
    return ee.Image("projects/lu-chandrakant/assets/Plantation_new/" + name).select(['b1']).rename(name);
}));

// Combine all images into one and concatenate all plantation bands into a single band
var image = images.toBands().rename(imageNames);
var concatenatedImage = image.select(imageNames);

// Use reduce() to apply the reducer function to all bands
var combinedImage = concatenatedImage.reduce(ee.Reducer.max());

// Mask regions below zero (No-data)
var plantyear = combinedImage.updateMask(combinedImage.gt(0)).select(['max']).rename('plantyear');
//plantyear = plantyear //.clip(geometry)

////// Extracting 'startyear' ////////////////////
// Map over image names to create a list of images
var images = ee.ImageCollection.fromImages(imageNames.map(function(name) {
    return ee.Image("projects/lu-chandrakant/assets/Plantation_new/" + name).select(['b2']).rename(name);
}));

// Combine all images into one and concatenate all plantation bands into a single band
var image = images.toBands().rename(imageNames);
var concatenatedImage = image.select(imageNames);

// Use reduce() to apply the reducer function to all bands
var combinedImage = concatenatedImage.reduce(ee.Reducer.max());

// Mask regions below zero (No-data)
var startyear = combinedImage.updateMask(combinedImage.gt(0)).select(['max']).rename('startyear');

////// Extracting 'species' ////////////////////
// Map over image names to create a list of images
var images = ee.ImageCollection.fromImages(imageNames.map(function(name) {
    return ee.Image("projects/lu-chandrakant/assets/Plantation_new/" + name).select(['b3']).rename(name);
}));

// Combine all images into one and concatenate all plantation bands into a single band
var image = images.toBands().rename(imageNames);
var concatenatedImage = image.select(imageNames);

// Use reduce() to apply the reducer function to all bands
var combinedImage = concatenatedImage.reduce(ee.Reducer.max());

// Mask regions below zero (No-data)
var species = combinedImage.updateMask(combinedImage.gt(0)).select(['max']).rename('species');

//###########################################################
// Load MapBiomas dataset
//###########################################################
var combined_img_func = function(Year) {
    var in_class = [0,1,2,3,4,5,6,9,10,11,12,13,14,15,18,19,20,21,22,23,24,25,26,27,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,57,58,62]
    var reclass = [1,1000,1100,1300,2100,2100,2100,5000,2000,2100,2100,2100,3050,4000,3150,3200,3221,3100,2100,2100,600,2100,100,1,2100,700,100,2100,100,100,6121,
                   3800,100,100,3241,3261,3200,2100,2100,2100,2100,6021,6001,3800,2100,2100,3200,3200,3281]

    if (Admin_boundary == 'Indonesia') {

        var imageNames = [ //'projects/mapbiomas-workspace/public/collection7/mapbiomas_collection70_integration_v2',
            //'projects/mapbiomas-raisg/public/collection4/mapbiomas_raisg_panamazonia_collection4_integration_v1',
            //'projects/mapbiomas-chaco/public/collection3/mapbiomas_chaco_collection3_integration_v2',
            //'projects/MapBiomas_Pampa/public/collection2/mapbiomas_pampa_collection2_integration_v1',
            //'projects/mapbiomas_af_trinacional/public/collection2/mapbiomas_atlantic_forest_collection20_integration_v1',
            //'projects/mapbiomas-public/assets/peru/collection1/mapbiomas_peru_collection1_integration_v1',
            'projects/mapbiomas-indonesia/public/collection1/post_Integration_filter_rev_2_10_3'
        ];


        // Map over image names to create a list of images
        var images = ee.ImageCollection.fromImages(imageNames.map(function(name) {
            var image;
            if (Year == 2020 || Year == 2021 || Year == 2022) {
                image = ee.Image(name)
                    .select(['classification_2019'])
                    .rename('Class');

            } else {
                image = ee.Image(name).select(['classification_' + Year]).rename('Class');
            }
            var reclassed = image.remap(in_class, reclass, 1)
            return reclassed;
        }));
    } else {
        var imageNames = ['projects/mapbiomas-workspace/public/collection8/mapbiomas_collection80_integration_v1',                           // MapBiomas 'Brazil' latest version https://mapbiomas.org/en/tools
                          'projects/mapbiomas-raisg/public/collection4/mapbiomas_raisg_panamazonia_collection4_integration_v1',              // MapBiomas 'Amazonia' latest version https://amazonia.mapbiomas.org/en/herramientas
                          'projects/mapbiomas-chaco/public/collection4/mapbiomas_chaco_collection4_integration_v1',                          // MapBiomas 'Chaco' latest version https://chaco.mapbiomas.org/en/tools-2
                          'projects/mapbiomas_af_trinacional/public/collection2/mapbiomas_atlantic_forest_collection20_integration_v1',      // MapBiomas 'Atlantic forest' latest version https://bosqueatlantico.mapbiomas.org/en/google-earth-engine
                          'projects/MapBiomas_Pampa/public/collection2/mapbiomas_pampa_collection2_integration_v1',                          // MapBiomas 'Pampa' latest version https://pampa.mapbiomas.org/en/tools
                          'projects/mapbiomas-public/assets/peru/collection1/mapbiomas_peru_collection1_integration_v1',                     // MapBiomas 'Peru' latest version https://peru.mapbiomas.org/en/tools
                          'projects/mapbiomas-public/assets/bolivia/collection1/mapbiomas_bolivia_collection1_integration_v1',               // MapBiomas 'Bolivia' latest version https://bolivia.mapbiomas.org/es/mapbiomas-collections-1
            //'projects/mapbiomas-indonesia/public/collection1/post_Integration_filter_rev_2_10_3'
        ];

        // Map over image names to create a list of images
        var images = ee.ImageCollection.fromImages(imageNames.map(function(name) {
            var image;
            if (Year == 2022) {
                image = ee.Image(name)
                    .select(['classification_2021'])
                    .rename('Class');
                    
            } else {
                image = ee.Image(name).select(['classification_' + Year]).rename('Class');
            }
            var reclassed = image.remap(in_class, reclass, 1)
            return reclassed;
        }));
    }
    // Combine all images into one and concatenate all plantation bands into a single band
    var image = images.toBands().rename(imageNames);
    var concatenatedImage = image.select(imageNames);

    // Use reduce() to apply the reducer function to all bands
    var combinedImage = concatenatedImage.reduce(ee.Reducer.max());

    // Mask regions below zero (No-data)
    var MapBiomas = combinedImage /*.updateMask(combinedImage.gt(0))*/ .select(['max']).rename('classification');
    return MapBiomas
}

//###########################################################
//Load Soybean data (Song et al. 2020)
//###########################################################
// Load the existing ImageCollection
var soyCollection = ee.ImageCollection('projects/glad/soy_annual_SA');

/*
// Load the soy data for 2021 as a single image
var soy2021 = ee.Image('projects/lu-chandrakant/assets/Soybean/SouthAmerica_Soybean_2021');
soy2021 = soy2021.updateMask(soy2021.gt(0))

// Define a start and end date for the 2021 image
var startDate = '2021-01-01';
var endDate = '2021-12-31';

// Set the properties for the 2021 Soy image
soy2021 = soy2021.set({
    'system:index': '2021',
    'system:time_start': ee.Date(startDate).millis(),
    'system:time_end': ee.Date(endDate).millis()
});

// Merge the 2021 Soy image with the existing collection
var soyCollection = soyCollection.merge(ee.ImageCollection.fromImages([soy2021]));
*/

var Soy_combined_img_func = function(Year) {
    // Print the updated ImageCollection
    var year = Year;
    var yearString = ee.String(year.toString()); // convert year to string

    // filter the soyCollection by the specified year
    var filteredCollection = soyCollection.filterDate(
        yearString.cat('-01-01'), // start of year
        yearString.cat('-12-31') // end of year
    );

    // Use reduce() to apply the reducer function to all bands
    var combinedImage = filteredCollection.reduce(ee.Reducer.max());
    combinedImage = combinedImage.updateMask(combinedImage.eq(1))
    // Mask regions below zero (No-data)
    var Soy = combinedImage /*.updateMask(combinedImage.gt(0))*/ .select(['b1_max']).rename('classification');

    return Soy.multiply(3242)
}



//###########################################################
//Load Maize-China (Peng et al. 2023)
//###########################################################
// Specify the asset folder path where Maize features are stored
var Maize_China_list = ee.data.getList({'id': "projects/lu-chandrakant/assets/Maize_China"});
var Maize_China_list = Maize_China_list.map(function(image) {
  return ((image.id).split("/").slice(4,5)[0]); // Extract the image name
});

// Map over image names to create an image collection for lu2-chandrakant
var Maize_China = ee.ImageCollection.fromImages(Maize_China_list.map(function(name) {
  return ee.Image("projects/lu-chandrakant/assets/Maize_China/" + name).select(['b1']).rename('Class');
}));


//Map.addLayer(Maize_China)
var Maize_China_func = function(Year) {
    // Print the updated ImageCollection
    if (Year > 2020) {
      var year = 2020
    }
    else {var year = Year};
    var yearString = ee.String(year.toString()); // convert year to string

    // filter the soyCollection by the specified year
    var filteredCollection = Maize_China.filterDate(
        yearString.cat('-01-01T01:01:01'), // start of year
        yearString.cat('-12-31T12:01:01') // end of year
    );

    // Use reduce() to apply the reducer function to all bands
    var combinedImage = filteredCollection.reduce(ee.Reducer.max());

    combinedImage = combinedImage.updateMask(combinedImage.eq(1))
    // Mask regions below zero (No-data)
    var Maize = combinedImage /*.updateMask(combinedImage.gt(0))*/ .select(['Class_max']).rename('classification');

    return Maize.multiply(3321)
}



//###########################################################
//Load Cocoa dataset (Kalischek et al. 2022)
//###########################################################
var Cocoa_map_CDG = ee.Image('projects/ee-nk-cocoa/assets/cocoa_map_threshold_065')
//$$
var Cocoa_map_CDG_projection =  ee.Image(Cocoa_map_CDG).projection();
//$$

//###########################################################
//Load Oilpalm Indonesia dataset (Gaveau et al. 2022)
//###########################################################
// Specify the asset folder path where Oil palm features are stored
var Oilpalm_assetFolder = 'projects/lu-chandrakant/assets/OilPalm_Indonesia';
// Get a list of assets within the specified folder
var assetList = ee.data.getList({ id: Oilpalm_assetFolder });

// Extract asset IDs from the asset list
var assetIds = assetList.map(function(asset) {
  return asset.id;
});

// Create a feature collection by iterating through asset IDs
var OilPalm_Indonesia_org = ee.FeatureCollection([]);
assetIds.forEach(function(assetId) {
  var assetCollection = ee.FeatureCollection(assetId);
  OilPalm_Indonesia_org = OilPalm_Indonesia_org.merge(assetCollection);
});



//###########################################################
//Load Oilpalm Indonesia and Malaysia dataset (Xu et al. 2020)
//###########################################################
// Specify the asset folder path where Oil palm features are stored
var OilPalm_Malaysia_list = ee.data.getList({'id': "projects/lu-chandrakant/assets/OilPalm_Indonesia_Malaysia"});
var OilPalm_Malaysia_list = OilPalm_Malaysia_list.map(function(image) {
  return ((image.id).split("/").slice(4,5)[0]); // Extract the image name
});

// Map over image names to create an image collection for lu2-chandrakant
var OilPalm_Malaysia = ee.ImageCollection.fromImages(OilPalm_Malaysia_list.map(function(name) {
  return ee.Image("projects/lu-chandrakant/assets/OilPalm_Indonesia_Malaysia/" + name).select(['b1']).rename('Class');
}));


//Map.addLayer(OilPalm_Malaysia)
var OilPalm_Malaysia_func = function(Year) {
    // Print the updated ImageCollection
    if (Year > 2018) {
      var year = 2018
    }
    else {var year = Year};
    var yearString = ee.String(year.toString()); // convert year to string

    // filter the soyCollection by the specified year
    var filteredCollection = OilPalm_Malaysia.filterDate(
        yearString.cat('-01-01'), // start of year
        yearString.cat('-12-31') // end of year
    );

    // Use reduce() to apply the reducer function to all bands
    var combinedImage = filteredCollection.reduce(ee.Reducer.max());
    combinedImage = combinedImage.updateMask(combinedImage.eq(1))
    // Mask regions below zero (No-data)
    var OilPalm = combinedImage /*.updateMask(combinedImage.gt(0))*/ .select(['Class_max']).rename('classification');

    return OilPalm.multiply(6124)
}



//###########################################################
//Load (Global) Oilpalm dataset (Descals et al. 2021)
//###########################################################
var OilPalm_Global = ee.ImageCollection("BIOPAMA/GlobalOilPalm/v1");
//$$
var OilPalm_Global_projection =  ee.Image(OilPalm_Global.first()).projection();
//$$
//Reducing ee.ImageCollection to an ee.Image
OilPalm_Global = OilPalm_Global.reduce(ee.Reducer.min());

// Removing other landuse (i.e., 3) from the dataset
OilPalm_Global = OilPalm_Global.updateMask(OilPalm_Global.neq(3))
OilPalm_Global = OilPalm_Global.select('classification_min').rename('Class')



//###########################################################
//Load Coconut dataset (Descals et al. 2023)
//###########################################################
// Get the list of images in the lu-chandrakant asset
var Coconut_list = ee.data.getList({'id': "projects/lu-chandrakant/assets/Coconut"});
var Coconut_list = Coconut_list.map(function(image) {
  return ((image.id).split("/").slice(4,5)[0]); // Extract the image name
});

// Map over image names to create an image collection for lu2-chandrakant
var Coconut = ee.ImageCollection.fromImages(Coconut_list.map(function(name) {
  return ee.Image("projects/lu-chandrakant/assets/Coconut/" + name).select(['b1']).rename('Class');
}));
//$$
var Coconut_projection =  ee.Image(Coconut.first()).projection();
//$$
Coconut = Coconut.reduce(ee.Reducer.min()).rename('Class');

// Only considering 1 (i.e., coconut) from the dataset
Coconut = Coconut.updateMask(Coconut.eq(1))


//###########################################################
//Load Rubber dataset (Wang et al. 2023)
//###########################################################
var Rubber = ee.Image('users/wangyxtina/MapRubberPaper/rForeRub202122_perc1585DifESAdist5pxPFfinal')
//$$
var Rubber_projection =  ee.Image(Rubber).projection();
//$$
Rubber = Rubber.updateMask(Rubber.eq(2)) // 1- Forest and 2-Rubber
Rubber = Rubber.where(Rubber, 1)



//###########################################################
//Load Cropland dataset (Potapov et al. 2022)
//###########################################################
// Define the cropland datasets
var Cropland_2000_03 = ee.ImageCollection('users/potapovpeter/Global_cropland_2003')
  .reduce(ee.Reducer.max())
  .rename('Class')

var Cropland_2004_07 = ee.ImageCollection('users/potapovpeter/Global_cropland_2007')
  .reduce(ee.Reducer.max())
  .rename('Class')

var Cropland_2008_11 = ee.ImageCollection('users/potapovpeter/Global_cropland_2011')
  .reduce(ee.Reducer.max())
  .rename('Class')

var Cropland_2012_15 = ee.ImageCollection('users/potapovpeter/Global_cropland_2015')
  .reduce(ee.Reducer.max())
  .rename('Class')

var Cropland_2016_19 = ee.ImageCollection('users/potapovpeter/Global_cropland_2019')
  .reduce(ee.Reducer.max())
  .rename('Class')



//###########################################################
//Load Sugarcane Brazil dataset (Zheng et al. 2022)
//###########################################################
var Sugarcane_list = ee.data.getList({'id': "projects/lu-chandrakant/assets/Sugarcane"});
var Sugarcane_list = Sugarcane_list.map(function(image) {
  return ((image.id).split("/").slice(4,5)[0]); // Extract the image name
});

// Map over image names to create an image collection for lu2-chandrakant
var Sugarcane_Brazil = ee.ImageCollection.fromImages(Sugarcane_list.map(function(name) {
  return ee.Image("projects/lu-chandrakant/assets/Sugarcane/" + name).select(['b1']).rename('Class');
}));
Sugarcane_Brazil = Sugarcane_Brazil.reduce(ee.Reducer.max()).rename('Class');

// Selecting band with value '1' (representing sugarcane landuse)
Sugarcane_Brazil = Sugarcane_Brazil.updateMask(Sugarcane_Brazil.eq(1))



//###########################################################
//Load Rapeseed dataset (Han et al. 2021)
//###########################################################
var Rapeseed_list = ee.data.getList({'id': "projects/lu-chandrakant/assets/Rapeseed"});
var Rapeseed_list = Rapeseed_list.map(function(image) {
  return ((image.id).split("/").slice(4,5)[0]); // Extract the image name
});

// Map over image names to create an image collection for lu2-chandrakant
var Rapeseed = ee.ImageCollection.fromImages(Rapeseed_list.map(function(name) {
  return ee.Image("projects/lu-chandrakant/assets/Rapeseed/" + name).select(['b1']).rename('Class');
}));
//$$
var Rapeseed_projection =  ee.Image(Rapeseed.first()).projection();
//$$
Rapeseed = Rapeseed.reduce(ee.Reducer.max()).rename('Class');
// Selecting band with value '1' (representing rapeseed landuse)
Rapeseed = Rapeseed.updateMask(Rapeseed.eq(1))



//###########################################################
//Load Paddy rice dataset (Han et al. 2021)
//###########################################################
var Paddy_rice_list = ee.data.getList({'id': "projects/lu-chandrakant/assets/Paddy_rice"});
var Paddy_rice_list = Paddy_rice_list.map(function(image) {
  return ((image.id).split("/").slice(4,5)[0]); // Extract the image name
});

// Map over image names to create an image collection for lu2-chandrakant
var Paddy_rice = ee.ImageCollection.fromImages(Paddy_rice_list.map(function(name) {
  return ee.Image("projects/lu-chandrakant/assets/Paddy_rice/" + name).select(['b1']).rename('Class');
}));
//$$
var Paddy_rice_projection =  ee.Image(Paddy_rice.first()).projection();
//$$
Paddy_rice = Paddy_rice.reduce(ee.Reducer.max()).rename('Class');
// Selecting band with value '1' (representing Paddy_rice landuse)
Paddy_rice = Paddy_rice.updateMask(Paddy_rice.eq(1))



//###########################################################
//Load Forest fire (Tyukavina et al. 2022)
//###########################################################

var in_class = [1, 2, 3, 4, 5]
var reclass = [1, 1, 250, 250, 250]
var Forest_fire = ee.ImageCollection('users/sashatyu/2001-2022_fire_forest_loss')
var Forest_fire_year = ee.ImageCollection('users/sashatyu/2001-2022_fire_forest_loss_annual')
Forest_fire = Forest_fire.reduce(ee.Reducer.min()).select(['b1_min']).rename('classification')

Forest_fire = Forest_fire.remap(in_class, reclass, 1)

//###########################################################
//Load Managed forest (Lesiv et al. 2021)
//###########################################################

var ForestManagement = ee.Image("projects/lu-chandrakant/assets/Forest_Management/FML_v3-2_with-colorbar");


//###########################################################
//Load Dominant tree cover loss driver (Curtis et al. 2018)
//###########################################################

var in_class = [1, 2, 3, 4, 5]
var reclass = [3000, 3000, 500, 200, 600]
var dominant_driver = ee.Image('projects/lu-chandrakant/assets/Dominant_driver/Dominant_driver_2001_2022')
dominant_driver = dominant_driver.remap(in_class, reclass, 1)

//###########################################################
//Load Above ground biomass dataset (Harris et al. 2018)
//###########################################################

// Get the list of images in the lu2-chandrakant asset
var lu2AssetList = ee.data.getList({'id': "projects/lu2-chandrakant/assets/Carbon"});
var lu2ImageNames = lu2AssetList.map(function(image) {
  return ((image.id).split("/").slice(4,5)[0]); // Extract the image name
});

// Map over image names to create an image collection for lu2-chandrakant
var lu2Images = ee.ImageCollection.fromImages(lu2ImageNames.map(function(name) {
  return ee.Image("projects/lu2-chandrakant/assets/Carbon/" + name).select(['b1']).rename(name);
}));

// Get the list of images in the lu3-chandrakant asset
var lu3AssetList = ee.data.getList({'id': "projects/lu3-chandrakant/assets/Carbon"});
var lu3ImageNames = lu3AssetList.map(function(image) {
  return ((image.id).split("/").slice(4,5)[0]); // Extract the image name
});

// Map over image names to create an image collection for lu3-chandrakant
var lu3Images = ee.ImageCollection.fromImages(lu3ImageNames.map(function(name) {
  return ee.Image("projects/lu3-chandrakant/assets/Carbon/" + name).select(['b1']).rename(name);
}));

// Merge the two image collections into one
var allImages = lu2Images.merge(lu3Images);

// Combine all images into one and concatenate all plantation bands into a single band
var image = allImages.toBands().rename(lu2ImageNames.concat(lu3ImageNames));
var concatenatedImage = image.select(lu2ImageNames.concat(lu3ImageNames));

// Use reduce() to apply the reducer function to all bands
var combinedImage = concatenatedImage.reduce(ee.Reducer.max());

// Mask regions below zero (No-data)
var AGB = combinedImage/*.updateMask(combinedImage.gte(0))*/.select(['max']).rename('MG_px-1');


//###########################################################
// Analyse forest cover and forest loss dataset
//###########################################################

// List sequence required for processing. Here '21' refers to 2021.
var years = ee.List.sequence(1, 22,1)

// Extract the scale of the Hansen variable. This will be needed for resampling other datasets.
var Hansen_scale = Hansen_data.projection().nominalScale()
//Calculate the tree cover area  
var Hansen_treeCover = Hansen_data.select(['treecover2000']);
var Hansen_loss = Hansen_data.select(['loss']);

Hansen_treeCover = Hansen_treeCover.updateMask(Hansen_treeCover.gte(Forest_threshold))
var TC_mask = Hansen_loss.gt(0).and(Hansen_treeCover.gt(0));

Hansen_data = Hansen_data.updateMask(TC_mask)
Hansen_loss = Hansen_loss.updateMask(TC_mask)
var Hansen_lossyear = Hansen_data.select(['lossyear'])
//$$
var Hansen_projection = ee.Image(Hansen_loss).projection();
//$$

var treeCoverVisParam = {
    bands: ['treecover2000'],
    min: 0,
    max: 1,
    palette: ['black', 'green']
};

// Hansen's data has the treecover2000 layer ranging from 0-100. 
Hansen_treeCover = Hansen_treeCover.divide(100);

// It needs to be multiplied by 10^(-4) to convert the areas from 'm2' to 'ha'. 
var area_treeCover = Hansen_treeCover.multiply(ee.Image.pixelArea())
    .divide(1e4).select([0], ["areacover"])

// Caclulate tree cover loss area

var treeLossVisParam = {
    bands: ['loss'],
    min: 0,
    max: 1,
    palette: ['yellow', 'red']
};

var area_HansenLoss = Hansen_loss.gt(0).multiply(ee.Image.pixelArea())
    //.multiply(Hansen_treeCover)
    .divide(1e4).select([0], ["arealoss"]);

//Map.addLayer(area_HansenLoss, {'palette': 'black'})

//###########################################################
// Analyse MapBiomas dataset
//###########################################################

var MapBiomas_classviz = {
    "opacity": 1,
    "min": -6000,
    "max": 6000,
    //"palette":['0a0000',"d95f02","e78ac3","ffd92f","66a61e","ffffff","b2182b"]

    "palette": ['#570d07', '#586351', '#18056b', '#636302', '#6b3b02', '#015e02', '#013c5e',
        '045a8d', "78c679", "e08214", "FFFF00", "a797f0", "66ff00", "ef3b2c"
    ]
}

// Add end years
var years = [ /*1998,1999,*/ 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010,
    2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022
];

// Create an empty ImageCollection
var MapBiomas_collection = ee.ImageCollection([]);

// Define a function to get MapBiomas data for a given year and apply a mask
function getMapBiomas(year) {
    // Load the MapBiomas data for the given year
    var MapBiomas = combined_img_func(year).updateMask(TC_mask)

    // Return the masked MapBiomas image with the year as a property
    return MapBiomas.set('year', year);
}

// Map the getMapBiomas function over the years array to create an ImageCollection
var MapBiomas_collection = ee.ImageCollection.fromImages(
    years.map(function(year) {
        return getMapBiomas(year);
    })
);

//MapBiomas_collection
var MapBiomasyear = ee.List.sequence(2001, end_year, 1)

// Map over image names to create a list of images
var images = ee.ImageCollection.fromImages(MapBiomasyear.map(function(name) {
    var year = ee.Number(name); // Convert name to a number
    var image = MapBiomas_collection.filterMetadata('year', 'equals', year).first();
    var maskedImage = ee.Image(image).select('classification').updateMask(Hansen_lossyear.eq(year.subtract(2000)));
    return maskedImage.rename('classification');
}));

// Use reduce() to apply the reducer function to all bands
var MapBiomas = images.reduce(ee.Reducer.max()).select(['classification_max']).rename('classification');
//Map.addLayer(MapBiomas, MapBiomas_classviz, 'MapBiomas original', false)


// Map over image names to create a list of images
var images = ee.ImageCollection.fromImages(MapBiomasyear.map(function(name) {
    var year = ee.Number(name); // Convert name to a number
    var years = ee.List.sequence(year, year.add(3), 1);
    var filter = ee.Filter.inList('year', years);
    var image = MapBiomas_collection.filter(filter);
    image = image.reduce(ee.Reducer.max()).select(['classification_max']).rename('classification');
    var maskedImage = ee.Image(image).select('classification').updateMask(Hansen_lossyear.eq(year.subtract(2000)));
    return maskedImage.rename('classification');
}));


// Use reduce() to apply the reducer function to all bands
var MapBiomas = images.reduce(ee.Reducer.max()).select(['classification_max']).rename('classification');
//Map.addLayer(MapBiomas, MapBiomas_classviz, 'MapBiomas four-year', false)

var MapBiomas_2000 = combined_img_func(2000).updateMask(TC_mask)

MapBiomas = MapBiomas.where(MapBiomas.eq(MapBiomas_2000), MapBiomas.multiply(-1))

// Add this line to remove negative 1 values
MapBiomas = MapBiomas.where(MapBiomas.eq(-1), 1)

//##########################################################
// Analyse Soybean dataset
//##########################################################

var years = [2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010,
    2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022
];

// Create an empty ImageCollection
var Soy_collection = ee.ImageCollection([]);

// Define a function to get MapBiomas data for a given year and apply a mask
function getSoy(year) {
    // Load the MapBiomas data for the given year
    var Soy = Soy_combined_img_func(year).updateMask(TC_mask)

    // Return the masked MapBiomas image with the year as a property
    return Soy.set('year', year);
}

// Map the getMapBiomas function over the years array to create an ImageCollection
var Soy_collection = ee.ImageCollection.fromImages(
    years.map(function(year) {
        return getSoy(year);
    })
);

var Soyyear = ee.List.sequence(2001, end_year, 1);


// The year of forest loss was same as heansen forest loss
var images = ee.ImageCollection.fromImages(Soyyear.map(function(name) {
    var year = ee.Number(name); // Convert name to a number
    var image = Soy_collection.filterMetadata('year', 'equals', year).first()
    var maskedImage = ee.Image(image).select('classification').updateMask(Hansen_lossyear.eq(year.subtract(2000)));
    return maskedImage.rename('classification');
}));
// Use reduce() to apply the reducer function to all bands
var Soy = images.reduce(ee.Reducer.max()).select(['classification_max']).rename('classification');


// Map the getMapBiomas function over the years array to create an ImageCollection
var images = ee.ImageCollection.fromImages(Soyyear.map(function(name) {
    var year = ee.Number(name); // Convert name to a number
    var years = ee.List.sequence(year, year.add(3), 1);
    var filter = ee.Filter.inList('year', years);
    var image = Soy_collection.filter(filter) //.first()
    image = image.reduce(ee.Reducer.max()).select(['classification_max']).rename('classification');
    var maskedImage = ee.Image(image).select('classification').updateMask(Hansen_lossyear.eq(year.subtract(2000)));
    return maskedImage.rename('classification');
}));
// Use reduce() to apply the reducer function to all bands
var Soy_four = images.reduce(ee.Reducer.max()).select(['classification_max']).rename('classification');




//###########################################################
//Analyse Maize-China
//###########################################################
var years = [2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010,
    2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022
];


// Define a function to get MapBiomas data for a given year and apply a mask
function getMaize(year) {
    // Load the MapBiomas data for the given year
    var Maize = Maize_China_func(year).updateMask(TC_mask)

    // Return the masked MapBiomas image with the year as a property
    return Maize.set('year', year);
}

// Map the getMapBiomas function over the years array to create an ImageCollection
var Maize_China_collection = ee.ImageCollection.fromImages(
    years.map(function(year) {
        return getMaize(year);
    })
);

var Maizeyear = ee.List.sequence(2001, end_year, 1);

// Map the getMapBiomas function over the years array to create an ImageCollection
var images = ee.ImageCollection.fromImages(Maizeyear.map(function(name) {
    var year = ee.Number(name); // Convert name to a number
    var years = ee.List.sequence(year, year.add(3), 1);
    var filter = ee.Filter.inList('year', years);
    var image = Maize_China_collection.filter(filter) //.first()
    image = image.reduce(ee.Reducer.max()).select(['classification_max']).rename('classification');
    var maskedImage = ee.Image(image).select('classification').updateMask(Hansen_lossyear.eq(year.subtract(2000)));
    return maskedImage.rename('classification');
}));
// Use reduce() to apply the reducer function to all bands
var Maize_China_four = images.reduce(ee.Reducer.max()).select(['classification_max']).rename('classification');






//###########################################################
//Analyse Oilpalm Indonesia dataset
//###########################################################
// Remove features with 'gridcode' equal to 300 (i.e., non-forest); and those that are already IOPP and Smallholder plantation in year 2000
//Map.addLayer(OilPalm_Indonesia_org, {},'OilPalm Indonesia (Unfiltered)')
//OilPalm_Indonesia = OilPalm_Indonesia.filter(ee.Filter.lt('gridcode', 300));
var OilPalm_Indonesia = OilPalm_Indonesia_org.filter(
  ee.Filter.and(
    ee.Filter.neq('F2000', 'IOPP'),
    ee.Filter.neq('F2000', 'Smallholder')
  ));

var OilPalm_Indonesia_pre2000 = OilPalm_Indonesia_org.filter(
  ee.Filter.or(
    ee.Filter.eq('F2000', 'IOPP'),
    ee.Filter.eq('F2000', 'Smallholder')
  ));

// Define the property you want to add

// Add the new property to each feature in the feature collection
OilPalm_Indonesia = OilPalm_Indonesia.map(function(feature) {
  return feature.set('Reclass Code', 6123)
});
OilPalm_Indonesia_pre2000 = OilPalm_Indonesia_pre2000.map(function(feature) {
  return feature.set('Reclass Code', 6123)
});

var OilPalm_Indonesia_Image = OilPalm_Indonesia.reduceToImage({
  properties: ['Reclass Code'], // replace 'your_property_name' with the name of the property in your shapefile that contains the value you want to use
  reducer: ee.Reducer.sum(),
  //scale: Hansen_scale // replace with the appropriate scale
});
var OilPalm_Indonesia_pre2000_Image = OilPalm_Indonesia_pre2000.reduceToImage({
  properties: ['Reclass Code'], // replace 'your_property_name' with the name of the property in your shapefile that contains the value you want to use
  reducer: ee.Reducer.sum(),
  //scale: Hansen_scale // replace with the appropriate scale
});

OilPalm_Indonesia_Image = OilPalm_Indonesia_Image.clip(geometry).updateMask(TC_mask)
OilPalm_Indonesia_pre2000_Image = OilPalm_Indonesia_pre2000_Image.clip(geometry).updateMask(TC_mask)



//###########################################################
//Analyse Cropland dataset
//###########################################################
// Create an ImageCollection with the cropland expansion datasets
Cropland_2000_03 = Cropland_2000_03.updateMask(Cropland_2000_03.eq(1).and(Hansen_lossyear.gte(1)).and(Hansen_lossyear.lte(3)));
Cropland_2004_07 = Cropland_2004_07.updateMask(Cropland_2004_07.eq(1).and(Hansen_lossyear.gte(1)).and(Hansen_lossyear.lte(7)));
Cropland_2008_11 =  Cropland_2008_11.updateMask(Cropland_2008_11.eq(1).and(Hansen_lossyear.gte(5)).and(Hansen_lossyear.lte(11)));
Cropland_2012_15 =  Cropland_2012_15.updateMask(Cropland_2012_15.eq(1).and(Hansen_lossyear.gte(8)).and(Hansen_lossyear.lte(15)));
Cropland_2016_19 =  Cropland_2016_19.updateMask(Cropland_2016_19.eq(1).and(Hansen_lossyear.gte(12)).and(Hansen_lossyear.lte(19)));

var combinedCropland = ee.ImageCollection([
  Cropland_2000_03.updateMask(TC_mask),
  Cropland_2004_07.updateMask(TC_mask),
  Cropland_2008_11.updateMask(TC_mask),
  Cropland_2012_15.updateMask(TC_mask),
  Cropland_2016_19.updateMask(TC_mask)
]);

// Mosaic the ImageCollection to create a single image
var combinedCropland = combinedCropland.mosaic();
// Reduce and rename the combined image
var combinedCropland = combinedCropland.reduce(ee.Reducer.max()).rename('Class');
combinedCropland = combinedCropland.multiply(3201)


//###########################################################
//Analyse Sugarcane Brazil dataset
//###########################################################
Sugarcane_Brazil = Sugarcane_Brazil.updateMask(TC_mask)
Sugarcane_Brazil = Sugarcane_Brazil.where(Sugarcane_Brazil.gt(0), 3222);



//###########################################################
//Analyse Rapeseed dataset
//###########################################################
Rapeseed = Rapeseed.updateMask(TC_mask)
//$$
Rapeseed = Rapeseed.setDefaultProjection(Rapeseed_projection)
Rapeseed = Rapeseed.reproject(Hansen_projection).reduceResolution({
      reducer: ee.Reducer.count(),
      bestEffort: true,
      maxPixels: 10
    })
//$$
Rapeseed = Rapeseed.updateMask(Rapeseed.gt(4))
Rapeseed = Rapeseed.where(Rapeseed.gt(0), 3301);



//###########################################################
//Analyse Paddy rice dataset
//###########################################################
Paddy_rice = Paddy_rice.updateMask(TC_mask)
//$$
Paddy_rice = Paddy_rice.setDefaultProjection(Paddy_rice_projection)
Paddy_rice = Paddy_rice.reproject(Hansen_projection).reduceResolution({
      reducer: ee.Reducer.count(),
      bestEffort: true,
      maxPixels: 10
    })
//$$
Paddy_rice = Paddy_rice.updateMask(Paddy_rice.gt(4))
Paddy_rice = Paddy_rice.where(Paddy_rice.gt(0), 3262);



//###########################################################
// Analyse plantation dataset
//###########################################################
// A value of '1981' means that the planting year was before 1982

var plantation_viz = {
    min: 1998,
    max: 2000,
    //palette: ['#c0c0c0', '#252525'],
    palette: ['#fc6703', '#03ff46', '#03befc']
};

//print(plantation)

// Print the scale
//print('PT Nominal scale:', plantation.projection().nominalScale());

// Get the scale (resolution) of the Hansen dataset

plantyear = plantyear.updateMask(TC_mask)

startyear = startyear.updateMask(TC_mask)
startyear = startyear.updateMask(plantyear.gte(1))
startyear = startyear.updateMask(plantyear.gt(startyear))

species = species.updateMask(TC_mask).updateMask(startyear)

var diff = plantyear.subtract(Hansen_lossyear.add(2000))
//Map.addLayer(diff, {'palette': ['#ef8a62','#f7f7f7','#67a9cf'], 'min': -2, 'max': 2}, 'PL>FL', false);
//Map.addLayer(diff.updateMask(plantyear.gt(2000)), {'palette': ['#8c510a','#d8b365','#f6e8c3','#c7eae5','#5ab4ac','#01665e'], 'min': -3, 'max': -2}, 'PL<FL', false);


var FL_att_to_new_plantations = startyear.updateMask(startyear.gt(Plantation_threshold_case_1));
var FL_att_to_old_plantations = startyear.updateMask(startyear.lte(Plantation_threshold_case_1));

var FL_att_to_new_plantations_species = species.updateMask(FL_att_to_new_plantations.gt(0));
var FL_att_to_old_plantations_species = species.updateMask(FL_att_to_old_plantations.gt(0));

FL_att_to_old_plantations_species = FL_att_to_old_plantations_species.add(5000)
FL_att_to_new_plantations_species = FL_att_to_new_plantations_species.add(5000)

//###########################################################
// Analyse Managed forests
//###########################################################

ForestManagement = ForestManagement.updateMask(TC_mask)
//Map.addLayer(ForestManagement)
var ManagedForests_org = ForestManagement.updateMask(ForestManagement.eq(20)
                      .or(ForestManagement.eq(31))
                      .or(ForestManagement.eq(32))
                      .or(ForestManagement.eq(40)).or(ForestManagement.eq(53)))

if (Admin_boundary == 'Argentina', 'Australia', 'Brazil', 'Cambodia', 'Cameroon', 'Chile', 'China', 'Colombia', 'Costa Rica', 'Democratic Republic of the Congo', 
    'Ecuador', 'Gabon', 'Ghana', 'Guatemala', 'Honduras', 'India', 'Indonesia', 'Côte d\'Ivoire', 'Japan', 'Kenya', 'Liberia', 'Malawi', 'Malaysia', 'México', 
    'Myanmar', 'Nepal', 'New Zealand', 'Nicaragua', 'Nigeria', 'Pakistan', 'Panama', 'Papua New Guinea', 'Peru', 'Philippines', 'Rwanda', 'Solomon Islands', 
    'South Africa', 'South Korea', 'Sri Lanka', 'Thailand', 'Uruguay', 'United States', 'Venezuela', 'Vietnam',
    'Åland', 'Albania', 'Andorra', 'Austria', 'Belarus', 'Belgium', 'Bosnia and Herzegovina', 'Bulgaria', 'Croatia', 'Czechia', 'Denmark', 'Estonia', 
    'Faroe Islands', 'Finland', 'France', 'Germany', 'Greece', 'Guernsey', 'Hungary', 'Iceland', 'Ireland', 'Isle of Man', 'Italy', 'Jersey', 'Kosovo', 
    'Latvia', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Malta', 'Moldova', 'Monaco', 'Montenegro', 'Netherlands', 'North Macedonia', 'Norway', 
    'Poland', 'Portugal', 'Romania', 'San Marino', 'Serbia', 'Slovakia', 'Slovenia', 'Spain', 'Svalbard and Jan Mayen', 'Sweden', 'Switzerland', 
    'Ukraine', 'United Kingdom', 'Vatican City') {

  var ManagedForests = FL_att_to_old_plantations_species
} else {
  ManagedForests = ManagedForests_org
}


//###########################################################
//Analyse Cocoa dataset
//###########################################################
Cocoa_map_CDG = Cocoa_map_CDG.updateMask(TC_mask)
//$$
Cocoa_map_CDG = Cocoa_map_CDG.setDefaultProjection(Cocoa_map_CDG_projection)
Cocoa_map_CDG = Cocoa_map_CDG.reproject(Hansen_projection).reduceResolution({
      reducer: ee.Reducer.count(),
      bestEffort: true,
      maxPixels: 10
    })
//$$
Cocoa_map_CDG = Cocoa_map_CDG.updateMask(Cocoa_map_CDG.gt(4))
Cocoa_map_CDG = Cocoa_map_CDG.where(Cocoa_map_CDG.gt(0), 6031)
Cocoa_map_CDG = Cocoa_map_CDG.where(ManagedForests.gt(0).and(Cocoa_map_CDG.gt(1)), Cocoa_map_CDG.multiply(-1))



//###########################################################
//Analyse (Global) Oilpalm dataset
//###########################################################
OilPalm_Global = OilPalm_Global.updateMask(TC_mask)
//$$
OilPalm_Global = OilPalm_Global.setDefaultProjection(OilPalm_Global_projection)
OilPalm_Global = OilPalm_Global.reproject(Hansen_projection).reduceResolution({
      reducer: ee.Reducer.count(),
      bestEffort: true,
      maxPixels: 10
    })
//$$
OilPalm_Global = OilPalm_Global.updateMask(OilPalm_Global.gt(4))
OilPalm_Global = OilPalm_Global.where(OilPalm_Global.gt(0), 6122);
OilPalm_Global = OilPalm_Global.where(ManagedForests.gt(0).and(OilPalm_Global.gt(0)), OilPalm_Global.multiply(-1))



//###########################################################
//Analyse Coconut dataset
//###########################################################
Coconut = Coconut.updateMask(TC_mask)
//$$
Coconut = Coconut.setDefaultProjection(Coconut_projection)
Coconut = Coconut.reproject(Hansen_projection).reduceResolution({
      reducer: ee.Reducer.count(),
      bestEffort: true,
      maxPixels: 10
    })
//$$

//$$ gte(1)
Coconut = Coconut.updateMask(Coconut.gte(1))
Coconut = Coconut.where(Coconut.gt(0), 6041);
Coconut = Coconut.where(ManagedForests.gt(0).and(Coconut.gt(0)), Coconut.multiply(-1))

//###########################################################
//Load Rubber dataset (Wang et al. 2023)
//###########################################################
Rubber = Rubber.updateMask(TC_mask)
//$$
Rubber = Rubber.setDefaultProjection(Rubber_projection)
Rubber = Rubber.reproject(Hansen_projection).reduceResolution({
      reducer: ee.Reducer.count(),
      bestEffort: true,
      maxPixels: 10
    })
//$$
Rubber = Rubber.updateMask(Rubber.gt(4))
Rubber = Rubber.where(Rubber.gt(0), 6151)
Rubber = Rubber.where(ManagedForests.gt(0).and(Rubber.gt(0)), Rubber.multiply(-1))


//###########################################################
//Analyse Oilpalm Indonesia and Malaysia dataset
//###########################################################

var years = [2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010,
    2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022
];


// Define a function to get MapBiomas data for a given year and apply a mask
function getOilPalm(year) {
    // Load the MapBiomas data for the given year
    var OilPalm = OilPalm_Malaysia_func(year).updateMask(TC_mask)

    // Return the masked MapBiomas image with the year as a property
    return OilPalm.set('year', year);
}

// Map the getMapBiomas function over the years array to create an ImageCollection
var OilPalm_Malaysia_collection = ee.ImageCollection.fromImages(
    years.map(function(year) {
        return getOilPalm(year);
    })
);

var OilPalmyear = ee.List.sequence(2001, end_year, 1);

// Map the getMapBiomas function over the years array to create an ImageCollection
var images = ee.ImageCollection.fromImages(OilPalmyear.map(function(name) {
    var year = ee.Number(name); // Convert name to a number
    var years = ee.List.sequence(year, year.add(3), 1);
    var filter = ee.Filter.inList('year', years);
    var image = OilPalm_Malaysia_collection.filter(filter) //.first()
    image = image.reduce(ee.Reducer.max()).select(['classification_max']).rename('classification');
    var maskedImage = ee.Image(image).select('classification').updateMask(Hansen_lossyear.eq(year.subtract(2000)));
    return maskedImage.rename('classification');
}));
// Use reduce() to apply the reducer function to all bands
var OilPalm_Malaysia_four = images.reduce(ee.Reducer.max()).select(['classification_max']).rename('classification');
OilPalm_Malaysia_four = OilPalm_Malaysia_four.where(ManagedForests.gt(0).and(OilPalm_Malaysia_four.gt(0)), OilPalm_Malaysia_four.multiply(-1))


//###########################################################
// Analyse forest fire
//###########################################################

Forest_fire = Forest_fire.updateMask(TC_mask)
Forest_fire = Forest_fire.updateMask(Forest_fire.gt(1))
Forest_fire = Forest_fire.where(ManagedForests.gt(0).and(Forest_fire.gt(1)), Forest_fire.multiply(-1))

//###########################################################
// Analyse dominant forest loss driver
//###########################################################

var curtis_DD = {
    min: 1000,
    max: 6000,
    //palette: ['#FF0000', '#FFFF00', '#4CE600', '#894444', '#DF73FF']
    palette: ['#894444', 'white', '#FFFF00', 'white', '#4CE600', '#DF73FF']
};

dominant_driver = dominant_driver.clip(geometry).updateMask(TC_mask)
dominant_driver = dominant_driver.updateMask(dominant_driver.gt(0))
// Convert dominant_driver to negative where it does not overlap with ForestManagement
dominant_driver = dominant_driver.where(ManagedForests.gt(0).and(dominant_driver.gt(1)), dominant_driver.multiply(-1))






//###########################################################
// Analyse attribution (priority attribution)
//###########################################################

var Hansen_loss_attribution = Hansen_loss.rename('classification')
print(Hansen_loss_attribution.projection().nominalScale())

// Attributing forest loss to OilPalm in Indonesia
if (Admin_boundary == 'Indonesia') {
  // Since we are not considering Oil Palm values in Du et al plantation for Indonesia
  FL_att_to_old_plantations_species = FL_att_to_old_plantations_species.updateMask(FL_att_to_old_plantations_species.neq(5121));
  FL_att_to_new_plantations_species = FL_att_to_new_plantations_species.where(FL_att_to_new_plantations_species.eq(5121), 1)

  // Oil Palm Indonesia data is preferred over MapBiomas (directly converted in the reclassed function) or Forest plantation, thus all Oil Palm-MapBiomas pixels are converted to 1 (to include them in attribution pool)
  Hansen_loss_attribution = Hansen_loss_attribution.where(Hansen_loss_attribution.eq(1).and(OilPalm_Indonesia_Image.gt(0)), Hansen_loss_attribution.multiply(6123))
  Hansen_loss_attribution = Hansen_loss_attribution.where(Hansen_loss_attribution.eq(1).and(OilPalm_Indonesia_pre2000_Image.gt(0)), Hansen_loss_attribution.multiply(-6123))
} 

// Attributing forest loss to Soybean
Hansen_loss_attribution = Hansen_loss_attribution.where(Hansen_loss_attribution.eq(1).and(Soy_four), Soy_four)

// Attributing forest loss to Maize-China
Hansen_loss_attribution = Hansen_loss_attribution.where(Hansen_loss_attribution.eq(1).and(Hansen_lossyear.lte(20)).and(Maize_China_four), Maize_China_four)

// Attributing forest loss to Cocoa
Hansen_loss_attribution = Hansen_loss_attribution.where(Hansen_loss_attribution.eq(1).and(Hansen_lossyear.lte(21)).and(Cocoa_map_CDG), Cocoa_map_CDG)

// Attributing forest loss to Rubber
Hansen_loss_attribution = Hansen_loss_attribution.where(Hansen_loss_attribution.eq(1).and(Rubber), Rubber)

//Attributing forest loss to Sugarcane in Brazil 
Hansen_loss_attribution = Hansen_loss_attribution.where(Hansen_loss_attribution.eq(1).and(Hansen_lossyear.lte(19)).and(Sugarcane_Brazil), Sugarcane_Brazil)

//Attributing forest loss to Rapeseed 
Hansen_loss_attribution = Hansen_loss_attribution.where(Hansen_loss_attribution.eq(1).and(Hansen_lossyear.lte(19)).and(Rapeseed), Rapeseed)

//Attributing forest loss to Rice 
Hansen_loss_attribution = Hansen_loss_attribution.where(Hansen_loss_attribution.eq(1).and(Hansen_lossyear.lte(19)).and(Paddy_rice), Paddy_rice)

//Attributing MapBiomas 'commodities' specifically
if (Admin_boundary == 'Indonesia') {
  var MapBiomas_endyear = 19 //For 2019
} else {
  var MapBiomas_endyear = 21 //For 2019
}
Hansen_loss_attribution = Hansen_loss_attribution.where(
  Hansen_loss_attribution.eq(1).and(Hansen_lossyear.lte(MapBiomas_endyear)).and(
    MapBiomas.gte(3221).and(MapBiomas.lte(3799))
    .or(MapBiomas.eq(4000))
    .or(MapBiomas.gte(6001).and(MapBiomas.lte(6999)))
  ), MapBiomas
);

// Attributing forest loss to OilPalm-Malaysia
if (Admin_boundary == 'Malaysia') {
  Hansen_loss_attribution = Hansen_loss_attribution.where(Hansen_loss_attribution.eq(1).and(OilPalm_Malaysia_four), OilPalm_Malaysia_four)
}

// Attributing forest loss to Coconut
Hansen_loss_attribution = Hansen_loss_attribution.where(Hansen_loss_attribution.eq(1).and(Hansen_lossyear.lte(20)).and(Coconut), Coconut)

// Attributing forest loss to OilPalm (Global; except Indonesia)
Hansen_loss_attribution = Hansen_loss_attribution.where(Hansen_loss_attribution.eq(1).and(Hansen_lossyear.lte(19)).and(OilPalm_Global), OilPalm_Global)

// Attributing forest loss to Plantation species (old and new)
Hansen_loss_attribution = Hansen_loss_attribution.where(Hansen_loss_attribution.eq(1).and(FL_att_to_old_plantations_species.gt(0)), FL_att_to_old_plantations_species.multiply(-1))
Hansen_loss_attribution = Hansen_loss_attribution.where(Hansen_loss_attribution.eq(1).and(FL_att_to_new_plantations_species.gt(0)), FL_att_to_new_plantations_species)

// Attributing forest loss to MapBiomas landuse
Hansen_loss_attribution = Hansen_loss_attribution.where(Hansen_loss_attribution.eq(1).and(Hansen_lossyear.lte(MapBiomas_endyear)).and(MapBiomas), MapBiomas)

//Attributing forest loss to arable/tempory cropland
Hansen_loss_attribution = Hansen_loss_attribution.where(Hansen_loss_attribution.eq(1).and(Hansen_lossyear.lte(19)).and(combinedCropland), combinedCropland)

// Attributing forest loss to Forest fire
Hansen_loss_attribution = Hansen_loss_attribution.where(Hansen_loss_attribution.eq(1).and(Forest_fire), Forest_fire)

// Attributing forest loss to Dominant drivers
Hansen_loss_attribution = Hansen_loss_attribution.where(Hansen_loss_attribution.eq(1).and(dominant_driver), dominant_driver)



print(Hansen_loss_attribution.projection().nominalScale())


var species_dict = Hansen_loss_attribution.reduceRegion({
    reducer: ee.Reducer.frequencyHistogram(),
    geometry: geometry,
    scale: Hansen_scale,
    maxPixels: 1e13
});

//print(species_dict)


//###########################################################
//Load Global Peatland dataset (https://data.globalforestwatch.org/datasets/gfw::global-peatlands/about)
//###########################################################
// Specify the asset folder path where Oil palm features are stored
var Peatland_list = ee.data.getList({'id': "projects/lu-chandrakant/assets/Global_Peatlands"});
var Peatland_list = Peatland_list.map(function(image) {
  return ((image.id).split("/").slice(4,5)[0]); // Extract the image name
});

// Map over image names to create an image collection for lu2-chandrakant
var Peatland = ee.ImageCollection.fromImages(Peatland_list.map(function(name) {
  return ee.Image("projects/lu-chandrakant/assets/Global_Peatlands/" + name).select(['b1']).rename('Class');
}));

Peatland = Peatland.reduce(ee.Reducer.max()).rename('Class');
// Selecting band with value '1' (representing sugarcane landuse)
Peatland = Peatland.updateMask(Peatland.eq(1))
// Clip the image to a specified geometry and apply a mask (TC_mask)
Peatland = Peatland.clip(geometry).updateMask(TC_mask)
Peatland = Peatland.where(Peatland.eq(1).and(Hansen_loss_attribution), Hansen_loss_attribution)

Map.addLayer(Peatland, {'palette': '#B90E0A'}, 'Peatland', false)

//###########################################################
//Analyse above ground biomass dataset (Harris et al. 2018)
//###########################################################
AGB = AGB.clip(geometry).updateMask(TC_mask)
AGB = AGB.multiply(44/12).multiply(0.47) //Convert tC/ha to tCO2-eq/ha

var ecoRegions = ee.FeatureCollection("RESOLVE/ECOREGIONS/2017")//.filterBounds(geometry);
var ecoregionImage = ecoRegions.reduceToImage({
  properties: ['BIOME_NUM'], // replace 'your_property_name' with the name of the property in your shapefile that contains the value you want to use
  reducer: ee.Reducer.sum(),
  //scale: Hansen_scale // replace with the appropriate scale
});

ecoregionImage = ecoregionImage.clip(geometry).updateMask(TC_mask)

// Define the BGB/AGB multiplication factors based on ecoregion value and AGB
var condition1 = ecoregionImage.eq(1);
var scale1 = ee.Image.constant(0.456);
var condition2a = ecoregionImage.eq(2).and(AGB.lte(1.8));
var scale2a = ee.Image.constant(0.563);
var condition2b = ecoregionImage.eq(2).and(AGB.gt(1.8));
var scale2b = ee.Image.constant(0.275);
var condition3 = ecoregionImage.eq(3);
var scale3 = ee.Image.constant(0.322);
var condition4a = ecoregionImage.eq(4).and(AGB.lte(6.75));
var scale4a = ee.Image.constant(0.456);
var condition4b = ecoregionImage.eq(4).and(AGB.gt(6.75)).and(AGB.lte(13.5));
var scale4b = ee.Image.constant(0.226);
var condition4c = ecoregionImage.eq(4).and(AGB.gt(13.5));
var scale4c = ee.Image.constant(0.241);
var condition5a = ecoregionImage.eq(5).and(AGB.lte(4.5));
var scale5a = ee.Image.constant(0.403);
var condition5b = ecoregionImage.eq(5).and(AGB.gt(4.5)).and(AGB.lte(13.5));
var scale5b = ee.Image.constant(0.292);
var condition5c = ecoregionImage.eq(5).and(AGB.gt(13.5));
var scale5c = ee.Image.constant(0.201);
var condition6a = ecoregionImage.eq(6).and(AGB.lte(6.75));
var scale6a = ee.Image.constant(0.392);
var condition6b = ecoregionImage.eq(6).and(AGB.gt(6.75));
var scale6b = ee.Image.constant(0.239);
var condition7 = ecoregionImage.eq(7);
var scale7 = ee.Image.constant(1.887);
var condition8 = ecoregionImage.eq(8);
var scale8 = ee.Image.constant(4.224);
var condition9 = ecoregionImage.eq(9);
var scale9 = ee.Image.constant(1.098);
var condition10 = ecoregionImage.eq(10);
var scale10 = ee.Image.constant(1.887);
var condition11 = ecoregionImage.eq(11);
var scale11 = ee.Image.constant(4.804);
var condition12 = ecoregionImage.eq(12);
var scale12 = ee.Image.constant(0.322);
var condition13 = ecoregionImage.eq(13);
var scale13 = ee.Image.constant(1.063);
var condition14 = ecoregionImage.eq(14);
var scale14 = ee.Image.constant(1.098);

// Apply conditional statements using ee.Image.where()
var BGB = AGB.where(condition1, AGB.multiply(scale1))
             .where(condition2a, AGB.multiply(scale2a))
             .where(condition2b, AGB.multiply(scale2b))
             .where(condition3, AGB.multiply(scale3))
             .where(condition4a, AGB.multiply(scale4a))
             .where(condition4b, AGB.multiply(scale4b))
             .where(condition4c, AGB.multiply(scale4c))
             .where(condition5a, AGB.multiply(scale5a))
             .where(condition5b, AGB.multiply(scale5b))
             .where(condition5c, AGB.multiply(scale5c))
             .where(condition6a, AGB.multiply(scale6a))
             .where(condition6b, AGB.multiply(scale6b))
             .where(condition7, AGB.multiply(scale7))
             .where(condition8, AGB.multiply(scale8))
             .where(condition9, AGB.multiply(scale9))
             .where(condition10, AGB.multiply(scale10))
             .where(condition11, AGB.multiply(scale11))
             .where(condition12, AGB.multiply(scale12))
             .where(condition13, AGB.multiply(scale13))
             .where(condition14, AGB.multiply(scale14));

//Map.addLayer(ecoregionImage)

//Analysing Deadwood and Litter 
var elevation = ee.Image('CGIAR/SRTM90_V4').select('elevation').updateMask(TC_mask);
var precipitation = ee.ImageCollection('UCSB-CHG/CHIRPS/PENTAD')
                  .filter(ee.Filter.date('2000-01-01', '2000-12-31'))
                  .select('precipitation')
                  .reduce(ee.Reducer.sum()).updateMask(TC_mask);

// Define conditions
var tropical = ecoregionImage.eq(1).or(ecoregionImage.eq(2)).or(ecoregionImage.eq(3)).or(ecoregionImage.eq(7));
var lowElevation = elevation.lt(2000);
var highPrecipitation = precipitation.gt(1600);
var mediumPrecipitation = precipitation.gt(1000).and(precipitation.lte(1600));
var highElevation = elevation.gt(2000);
var temperateBoreal = tropical.not();

// Apply conditions
var condition1 = tropical.and(lowElevation).and(precipitation.lt(1000));
var DeadWood_scale1 = ee.Image.constant(0.02);
var Litter_scale1 = ee.Image.constant(0.04);

var condition2 = tropical.and(lowElevation).and(mediumPrecipitation);
var DeadWood_scale2 = ee.Image.constant(0.01);
var Litter_scale2 = ee.Image.constant(0.01);

var condition3 = tropical.and(lowElevation).and(highPrecipitation);
var DeadWood_scale3 = ee.Image.constant(0.06);
var Litter_scale3 = ee.Image.constant(0.01);

var condition4 = tropical.and(highElevation);
var DeadWood_scale4 = ee.Image.constant(0.07);
var Litter_scale4 = ee.Image.constant(0.01);

var condition5 = temperateBoreal;
var DeadWood_scale5 = ee.Image.constant(0.08);
var Litter_scale5 = ee.Image.constant(0.04);

var Deadwood = AGB.where(condition1, AGB.multiply(DeadWood_scale1))
                  .where(condition2, AGB.multiply(DeadWood_scale2))
                  .where(condition3, AGB.multiply(DeadWood_scale3))
                  .where(condition4, AGB.multiply(DeadWood_scale4))
                  .where(condition5, AGB.multiply(DeadWood_scale5));

var Litter = AGB.where(condition1, AGB.multiply(Litter_scale1))
                .where(condition2, AGB.multiply(Litter_scale2))
                .where(condition3, AGB.multiply(Litter_scale3))
                .where(condition4, AGB.multiply(Litter_scale4))
                .where(condition5, AGB.multiply(Litter_scale5));


var AGB_total = AGB.add(Deadwood).add(Litter)

Map.addLayer(elevation, {}, 'Elevation', false);
Map.addLayer(precipitation, {}, 'Precipitation', false);

// Function to calculate SOC for a given depth range
function calculateSOC(depthRange1, depthRange2) {
  var soc = ee.Image("projects/soilgrids-isric/soc_mean").select("soc_" + depthRange1 +'-'+ depthRange2 + "cm_mean");
  var bd = ee.Image("projects/soilgrids-isric/bdod_mean").select("bdod_"+ depthRange1 +'-'+ depthRange2 + "cm_mean");
  var cf = ee.Image("projects/soilgrids-isric/cfvo_mean").select("cfvo_"+ depthRange1 +'-'+ depthRange2 + "cm_mean");
  cf = cf.multiply(1e-3).subtract(1).multiply(-1)
  var soc_t_per_ha = (soc.multiply(bd).multiply(1e-5).multiply(depthRange2-depthRange1)).multiply(cf).rename('SOC t ha-1');
  soc_t_per_ha = soc_t_per_ha.clip(geometry)
  return soc_t_per_ha;
}
// Calculate SOC for different depth ranges
var SOC_30_60_t_per_ha = calculateSOC(30,60);
var SOC_60_100_t_per_ha = calculateSOC(60,100);

// Combine SOC layers for different depth ranges
var SOC_0_30 = ee.Image("projects/soilgrids-isric/ocs_mean").select("ocs_0-30cm_mean");
SOC_0_30 = SOC_0_30.clip(geometry)
var SOC_30_100 = SOC_30_60_t_per_ha.add(SOC_60_100_t_per_ha);
SOC_0_30 = SOC_0_30.updateMask(TC_mask)
SOC_30_100 = (SOC_30_60_t_per_ha.add(SOC_60_100_t_per_ha)).updateMask(TC_mask)

Map.addLayer(SOC_0_30, {'palette': ['#ffffbe',  '#fbd37c', '#32893f', '#16817c', '#1a3372', '#4c0172'], 'min': 0, 'max': 200}, 'SOC 0-30 cm', false)
Map.addLayer(SOC_30_100, {'palette': ['#ffffbe',  '#fbd37c', '#32893f', '#16817c', '#1a3372', '#4c0172'], 'min': 0, 'max': 200}, 'SOC 30-100 cm', false)

// Converting tC/ha to tC/px
//$$
var pixelarea = ee.Image.pixelArea().reproject(Hansen_projection).divide(10000)
//$$
SOC_0_30 = SOC_0_30.where(SOC_0_30, SOC_0_30.multiply(pixelarea))
SOC_30_100 = SOC_30_100.where(SOC_30_100, SOC_30_100.multiply(pixelarea))

SOC_0_30 = SOC_0_30.multiply(44/12) //Convert tC/ha to tCO2-eq/ha
SOC_30_100 = SOC_30_100.multiply(44/12)

SOC_0_30 = SOC_0_30.where(Peatland, SOC_0_30.multiply(0))
SOC_30_100 = SOC_30_100.where(Peatland, SOC_30_100.multiply(0))



var Hansen_att_color = {
    "opacity": 1,
    "min": 0,
    "max": 5000,
    "palette": ['grey', 'red', 'white', '#fdc086', '#ffff99', '#beaed4', '#07f007']
}

////////////////// All Mappings //////////////////
Map.addLayer(Hansen_treeCover, treeCoverVisParam, 'Tree cover >25% (Shades of Green)', false)
Map.addLayer(Hansen_loss, {'palette': 'red'}, 'Tree cover loss (only for >25% TC; Red)', false)
Map.addLayer(Hansen_lossyear, {'palette': ['#ffff00', '#ff0000'],
    'min': 0,
    'max': 22
    }, 'Tree cover loss year (only for >25% TC; Red)', false)
Map.addLayer(MapBiomas_collection, MapBiomas_classviz, 'MapBiomas ImageCollection (all)', false);
Map.addLayer(MapBiomas_2000, MapBiomas_classviz, 'MapBiomas 2000 (Selected loss year)', false)
Map.addLayer(MapBiomas, MapBiomas_classviz, 'MapBiomas ImageCollection (Selected loss year)', false)
Map.addLayer(Soy_collection, {
    'palette': '#fc8d59'
    }, 'Soy (all)', false)
Map.addLayer(Soy, {'palette': '#fc8d59'}, 'Soy (One year-only forest loss regions)', false)
Map.addLayer(Soy_four, {'palette': '#fc8d59'}, 'Soy  (Four year-only forest loss regions)', false)
Map.addLayer(OilPalm_Indonesia, {color: 'blue'}, 'OilPalm Indonesia', false)
Map.addLayer(OilPalm_Indonesia_pre2000, {color: 'yellow'},'OilPalm Indonesia (Pre-2000)', false)
Map.addLayer(OilPalm_Global, {palette: ['grey', 'blue'], min: -6122, max: 6122}, 'OilPalm (Global)', false)
Map.addLayer(Coconut, {palette: ['grey', 'red'], min: -6041, max: 6041}, 'Coconut', false)
Map.addLayer(Cocoa_map_CDG, {palette: ['yellow','green'], min: -6031, max: 6031}, 'Cocoa', false)

Map.addLayer(OilPalm_Malaysia, {palette: ['yellow','green'], 'min':0}, 'OilPalm (Malaysia)', false)
Map.addLayer(OilPalm_Malaysia_four, {palette: ['yellow','green'], 'min':0}, 'OilPalm (Malaysia)-Selected', false)

Map.addLayer(combinedCropland, {palette: 'red'}, 'Combined Cropland', false);
Map.addLayer(combinedCropland, {palette: 'black'}, 'Combined cropland and frequency', false);

Map.addLayer(Sugarcane_Brazil, {palette: 'green'}, 'Sugarcane (Brazil)', false);
Map.addLayer(Rapeseed, {palette: 'green'}, 'Rapeseed', false);
Map.addLayer(Paddy_rice, {palette: 'green'}, 'Paddy rice', false);

Map.addLayer(Rubber, {palette: ['grey', 'green'], min: -6151, max: 6151}, 'Rubber', false);
Map.addLayer(Maize_China_four, {palette: 'green'}, 'Maize-China', false);

//Map.addLayer(plantyear, plantation_viz, 'Plantyear (all)-Original (Shades of grey)', false)
//Map.addLayer(startyear, plantation_viz, 'Startyear (all)-Original (Shades of grey)', false)
//Map.addLayer(species, {'palette':['red', 'blue']}, 'Species (all)-Original (Shades of grey)', false)
//Map.addLayer(FL_att_to_new_plantations, {'palette':'#fcfcfc'}, 'FL_att_to_new_plantation', false)
//Map.addLayer(FL_att_to_old_plantations, {'palette':'#000000'}, 'FL_att_to_old_plantation', false)
Map.addLayer(FL_att_to_new_plantations_species, {}, 'New plantation species', false)
Map.addLayer(FL_att_to_old_plantations_species, {}, 'Old plantation species', false)
Map.addLayer(ManagedForests_org, {'palette': ['red']}, 'Manged forest', false)
Map.addLayer(ManagedForests, {'palette': 'red'}, 'Disturbed Natural Forests', false)
Map.addLayer(Forest_fire, {palette: ['orange', 'blue', 'yellow'], min: 0, max: 2}, 'Forest fire', false)
Map.addLayer(Forest_fire_year, {palette: ['yellow', 'red'], min: 0,   max: 22}, 'Forest fire loss year', false)
Map.addLayer(dominant_driver /*.updateMask(dominant_driver.eq(4))*/ , curtis_DD, 'Dominant driver', false)

Map.addLayer(Hansen_loss_attribution, Hansen_att_color, 'Final Loss Attribution', true)
Map.addLayer(Hansen_loss_attribution.updateMask(Hansen_loss_attribution.eq(6031)), {palette: '#FFFFFF'}, 'Final Loss Attribution (Selected)', false)


Map.addLayer(AGB, {'palette': ['red', 'blue', 'green'], 'min': 0, 'max': 75}, 'AGB', false)
Map.addLayer(BGB, {'palette': ['red', 'blue', 'green'], 'min': 0, 'max': 75}, 'BGB', false)
Map.addLayer(Deadwood, {}, 'DeadWood', false)
Map.addLayer(Litter, {}, 'Litter', false)
Map.addLayer(AGB_total, {'palette': ['red', 'blue', 'green'], 'min': 0, 'max': 75}, 'AGB Total', false)
Map.addLayer(SOC_0_30, {'palette': ['#ffffbe',  '#fbd37c', '#32893f', '#16817c', '#1a3372', '#4c0172'], 'min': 0, 'max': 200}, 'SOC 0-30cm', false)
Map.addLayer(SOC_30_100, {'palette': ['#ffffbe',  '#fbd37c', '#32893f', '#16817c', '#1a3372', '#4c0172'], 'min': 0, 'max': 200}, 'SOC 30-100cm', false)
//////////////////////#####################################////////////////////////////////////////////

//var input = Hansen_loss_attribution  

function Forest_loss_attribution(region, input, output, savefilename) {
    function to_region_features(region) {
        function to_class_feature(class_group) {
            class_group = ee.Feature(class_group);
            var year_groups = ee.List(class_group.get('groups'));
            var areas = ee.Array(
                year_groups.map(
                    function(properties) {
                        return ee.Dictionary(properties).toArray().toList();
                    }
                )
            );
            var labels = (
                areas.slice(1, 0, 1)
                .project([0])
                .toList()
                .map(function(year) {
                    year = ee.Number(year).toInt();
                    var actual_year = ee.Number(2000).add(year);
                    return ee.String('loss_').cat(actual_year);
                })
            );
            var values = areas.slice(1, 1).project([0]).toList();
            return (
                ee.Feature(
                    null,
                    region.toDictionary(['CONTINENT', 'COUNTRY', 'GID_0', 'GID_1', 'GID_2'])
                )
                .set('Class', class_group.get('Class'))
                .set(ee.Dictionary.fromLists(labels, values))
            );
        }

        var groups = ee.FeatureCollection(
            ee.List(
                output 
                //AGB
                //ee.Image.pixelArea().divide(1e4)
                .addBands(Hansen_lossyear)
                .addBands(input)
                .reduceRegion({
                    reducer: ee.Reducer.sum().group(1, 'lossYear').group(2, 'Class'),
                    geometry: region.geometry(),
                    scale: Hansen_lossyear.projection().nominalScale(),
                    maxPixels: 1e13,
                    tileScale: 1,
                })
                .get('groups')
            ).map(
                // Include a size, to filter out cases where no data exist
                function(group) {
                    return ee.Feature(null, ee.Dictionary(group)).set(
                        'size',
                        ee.List(ee.Dictionary(group).get('groups')).size()
                    );
                }
            )
        ).filter(ee.Filter.gt('size', 0));
        return ee.FeatureCollection(groups.map(to_class_feature));
    }


    var areas = region.map(to_region_features).flatten(); 
    //print(savefilename, areas)

    var propertiesToExport = ['CONTINENT', 'COUNTRY', 'GID_0', 'GID_1', 'GID_2', 'Area_Boundary', 'Class'];
    for (var i = 2001; i <= end_year; i++) {
        propertiesToExport.push('loss_' + i);
    }

    Export.table.toDrive({
        collection: areas,
        description: 'Forest_loss_to_' + savefilename + '_' + Admin_boundary + '_' + '_' + 'GEE_' + new Date().toISOString().slice(0, 10),
        folder: 'Chalmers_Postdocv12_GEE', 
        fileFormat: 'CSV',
        selectors: propertiesToExport
    });
}

//Forest_loss_attribution(geometry, Hansen_loss_attribution, AGB, 'AGB') 
//Forest_loss_attribution(geometry, Hansen_loss_attribution, BGB, 'BGB') 
//Forest_loss_attribution(geometry, Hansen_loss_attribution, ee.Image.pixelArea().divide(1e4), 'CLASSIFICATION') 

//###########################################################
// BASEMAP
//###########################################################
var snazzyBlack = [
    {
        "featureType": "all",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "saturation": 36
            },
            {
                "color": "#000000"
            },
            {
                "lightness": 40
            }
        ]
    },
    {
        "featureType": "all",
        "elementType": "labels.text.stroke",
        "stylers": [
            {
                "visibility": "on"
            },
            {
                "color": "#000000"
            },
            {
                "lightness": 16
            }
        ]
    },
    {
        "featureType": "all",
        "elementType": "labels.icon",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "administrative",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#000000"
            },
            {
                "lightness": 20
            }
        ]
    },
    {
        "featureType": "administrative",
        "elementType": "geometry.stroke",
        "stylers": [
            {
                "color": "#000000"
            },
            {
                "lightness": 17
            },
            {
                "weight": 1.2
            }
        ]
    },
    {
        "featureType": "administrative.country",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "on"
            }
        ]
    },
    {
        "featureType": "administrative.country",
        "elementType": "geometry",
        "stylers": [
            {
                "visibility": "on"
            }
        ]
    },
    {
        "featureType": "administrative.country",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "visibility": "on"
            }
        ]
    },
    {
        "featureType": "administrative.country",
        "elementType": "geometry.stroke",
        "stylers": [
            {
                "visibility": "on"
            }
        ]
    },
    {
        "featureType": "administrative.country",
        "elementType": "labels",
        "stylers": [
            {
                "visibility": "on"
            }
        ]
    },
    {
        "featureType": "administrative.province",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "administrative.province",
        "elementType": "geometry",
        "stylers": [
            {
                "visibility": "on"
            }
        ]
    },
    {
        "featureType": "administrative.province",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "visibility": "on"
            }
        ]
    },
    {
        "featureType": "administrative.province",
        "elementType": "geometry.stroke",
        "stylers": [
            {
                "visibility": "on"
            }
        ]
    },
    {
        "featureType": "administrative.locality",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "administrative.neighborhood",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "administrative.land_parcel",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "landscape",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#000000"
            },
            {
                "lightness": 20
            }
        ]
    },
    {
        "featureType": "poi",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#000000"
            },
            {
                "lightness": 21
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "road.highway",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#000000"
            },
            {
                "lightness": 17
            }
        ]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry.stroke",
        "stylers": [
            {
                "color": "#000000"
            },
            {
                "lightness": 29
            },
            {
                "weight": 0.2
            }
        ]
    },
    {
        "featureType": "road.arterial",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#000000"
            },
            {
                "lightness": 18
            }
        ]
    },
    {
        "featureType": "road.local",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#000000"
            },
            {
                "lightness": 16
            }
        ]
    },
    {
        "featureType": "transit",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "transit",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#000000"
            },
            {
                "lightness": 19
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#000000"
            },
            {
                "lightness": 17
            }
        ]
    }
];

Map.setOptions(
    'snazzyBlack', {
        snazzyBlack: snazzyBlack
    });
print('end-time', new Date())

