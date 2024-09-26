# Deforestation Attribution Scripts and Datasets

## Overview

This repository contains scripts to analyze and attribute deforestation data for Uruguay. Below is a guide to the key scripts and their output, as well as links to the complete dataset hosted on Zenodo.

## Scripts and Outputs

### 1. `1. Deforestation attribution (GEE)-Spatial.ipynb`

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

The complete dataset is available on Zenodo: [https://doi.org/10.5281/zenodo.13624636](https://doi.org/10.5281/zenodo.13624636)  
See the subfolder: `2. Result (Generated post-spatial deforestation attribution)`

### 2. `4. Deforestation attribution (Python)-Statistical.py`

Running this script will produce the final deforestation estimates. These estimates are already archived on Zenodo and can be accessed here: [https://doi.org/10.5281/zenodo.13624636](https://doi.org/10.5281/zenodo.13624636)  
See the subfolder: `3. Final Attribution Results`
