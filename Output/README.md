# Deforestation attribution demo output
## Overview
This repository contains output from the spatial DeDuCE model for Uruguay. Below is a guide to the key scripts and their respective outputs, as well as links to the complete dataset hosted on Zenodo.

## Outputs using script
### `1. Deforestation attribution (GEE)-Spatial.ipynb`
This script generates files in the following format and order:
- **`Forest_loss_to_CLASSIFICATION_Uruguay.csv`**  
  Classification of deforestation associated with different commodity and land-use classes.
- **`Forest_loss_to_AGB_EMISSION_Uruguay.csv`**  
  Deforestation emissions associated with above-ground biomass for different commodity and land-use classes.
- **`Forest_loss_to_BGB_EMISSION_Uruguay.csv`**  
  Deforestation emissions associated with below-ground biomass for different commodity and land-use classes.
- **`Forest_loss_to_PEATLAND_Uruguay.csv`**  
  Deforestation on peatlands associated with different commodity and land-use classes.
- **`Forest_loss_to_SOC_0_30_Uruguay.csv`**  
  Deforestation emissions associated with soil organic carbon (SOC) for the top 30 cm, differentiated by commodity and land-use classes.
- **`Forest_loss_to_SOC_30_100_Uruguay.csv`**  
  Deforestation emissions associated with SOC for the 30-100 cm layer, differentiated by commodity and land-use classes.

The complete dataset (global) is available on Zenodo: [https://doi.org/10.5281/zenodo.13624636](https://doi.org/10.5281/zenodo.13624636).
See the subfolder: `2. Result (Generated post-spatial deforestation attribution)`.

### `2. Data visualisation (Spatial attribution).ipynb`
This script checks how much of the total tree cover loss (dotted line) is attributable to forest loss (i.e., loss of natural forests; everything below the solid line) (see figure below). This figure is based on `Forest_loss_to_CLASSIFICATION_Uruguay.csv`. The legend values correspond to different land-use types and commodities, and can be found in `5. DeDuCE-Lookup.xlsx` on Zenodo.
![alt text](https://github.com/chandrakant6492/DeDuCE/blob/main/Output/Uruguay%20post-spatial%20attribution.png)

### `3. Analysing Gross Croploss and Grassloss.ipynb`
Estimating crop and grass loss is based on the methodology by [Li et al. 2018](https://doi.org/10.5194/essd-10-219-2018). A sample estimate of crop and grass loss is shown in `Gross_cropland_grassland_changes_2001-2022 (Uruguay).xlsx` file. The global crop and grassloss is available on Zenodo: [https://doi.org/10.5281/zenodo.13624636](https://doi.org/10.5281/zenodo.13624636).
See the subfolder: `1. Model Input/Crop and grass loss`.


### `4. Deforestation attribution (Python)-Statistical.py`
Running this script will produce the final deforestation estimates. 
We provide an example of final deforestation attribution for just Uruguay in the **`DeDuCE_Deforestation_attribution_v1.0.1 (2001-2022)-Uruguay.xlsx`** file. These, including deforestation estimates for other countries,  are already archived on Zenodo and can be accessed here: [https://doi.org/10.5281/zenodo.13624636](https://doi.org/10.5281/zenodo.13624636). See the subfolder: `3. Final Attribution Results`.
