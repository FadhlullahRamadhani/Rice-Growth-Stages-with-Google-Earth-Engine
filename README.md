# Rice Growth Stages with Google Earth Engine
 Rice Growth Stages with Google Earth Engine


This is a source code to produce a map for rice growth stages based on rice area in Google Earth Engine

The rice growth stages (RGS)is from the fusion between Sentinel-2, Landsat-8 OLI, and MOD13Q1 and the rice area are from median value from multitemporal Sentinel-1.

They are four class of RGS:
1. Bare land
2. Vegetative stage
3. Reproductive stage
4. Ripening stage

The rice is consist of three classes
1. Rice area
2. Urban/ Built up
3. Water bodies.


The method is using supervised classification with three options of classifier: Random Forest, SVM, and CART

The javascript (js) is a file to run inside the code editor.

1. Interactive_Map_RGS.js is for creating an interactive application with linking maps
2. RGS_Fusion_DL.js is to download the RGS from using a fusion 
3. RGS_Fusion_JAVA_DL.js is to download the RGS from using a fusion for Java Island
4. RGS_LS8_DL is to download RGS map with Landsat-8
5. RGS_MOD13Q1_DL is to download RGS map with MOD13Q1
6. RGS_S2_DL is to download RGS map with Sentinel-2