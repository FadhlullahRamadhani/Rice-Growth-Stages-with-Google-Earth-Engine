// Demonstrates how to efficiently display a number of layers of a dataset along
// with a legend for each layer, and some visualization controls.
 
 
/*
 * Configure layers and locations
 */
var java_land = ee.FeatureCollection("users/danicool98/java_land");
var rice_area_points = ee.FeatureCollection("users/danicool98/rice_area_3class");

var rice_points = ee.FeatureCollection("users/danicool98/RGS_4class_50ha_v3");
var rice_points_geo = ee.FeatureCollection("users/danicool98/RGS_4class_50ha_v3_geo");

var box_select = ee.FeatureCollection('users/danicool98/classification_area');
var training_area_shp = ee.FeatureCollection("users/danicool98/box6_rice_area");

var training_area_S1 = training_area_shp.geometry();

var training_area_RGS = /* color: #d63000 */ee.Geometry.Polygon(
        [[[107.06614541205613, -6.064870588506072],
          [107.18426527946302, -6.182314931080984],
          [107.34906312396724, -6.411638131635611],
          [107.73359073478572, -6.6954169521892135],
          [108.13459619506659, -6.7008726221093795],
          [108.45320338048957, -6.8045196305052436],
          [108.57136531434321, -6.77448471443351],
          [108.67842525771412, -6.515343363648513],
          [107.90388065299273, -6.0129866189254475],
          [107.04144538815687, -5.909179318835096]]]);


var poly_java = /* color: #d63000 */ee.Geometry.Polygon(
        [[[105.71044358184325, -5.769045273311184],
          [105.11130700708082, -6.8108588002666455],
          [105.96529926282267, -7.070383574445343],
          [106.57875947902899, -7.60176778860408],
          [109.69643109098848, -8.107920043402713],
          [112.20406966417508, -8.515232365988775],
          [114.76123596328365, -8.949575196199374],
          [114.31114924952189, -6.806404304563556],
          [112.28538382902659, -6.652934470228424],
          [110.77765745458, -6.185840960235651],
          [110.0895580648103, -6.623877699915288],
          [109.2099659765777, -6.57241969194702],
          [108.7913071141131, -6.356372703124604],
          [107.8885920315653, -5.966181209973628]]]);
          
          

var START_DATE_TRAIN = ee.Date('2020-05-15');
var END_DATE_TRAIN = ee.Date('2020-05-31');

var START_DATE_AREA = ee.Date('2014-01-01');
var END_DATE_AREA = ee.Date('2021-09-30');

var MAX_CLOUD_PROBABILITY_TRAIN = 40;
var MAX_CLOUD_PROBABILITY_APPLIED = 40;

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}

// Make a cloud-free Landsat 8 TOA composite (from raw imagery).
function maskL8sr(image) {
  // Bits 3 and 5 are cloud shadow and cloud, respectively.
  var cloudShadowBitMask = (1 << 3);
  var cloudsBitMask = (1 << 5);
  // Get the pixel QA band.
  var qa = image.select('pixel_qa');
  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
                 .and(qa.bitwiseAnd(cloudsBitMask).eq(0));
  return image.updateMask(mask);
}

function maskMOD13Q1(image) {
  var cloudShadowBitMask = (1 << 0);
  var cloudsBitMask = (1 << 1);
  // Get the pixel QA band.
  var qa = image.select('DetailedQA');
  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
                 .or(qa.bitwiseAnd(cloudsBitMask).eq(0));
  return image.updateMask(mask);
}

function S2_maskClouds_TRAIN(img) {
  var clouds = ee.Image(img.get('cloud_mask')).select('probability');
  var isNotCloud = clouds.lt(MAX_CLOUD_PROBABILITY_TRAIN);
  return img.updateMask(isNotCloud);
}

function S2_maskClouds_APPLIED(img) {
  var clouds = ee.Image(img.get('cloud_mask')).select('probability');
  var isNotCloud = clouds.lt(MAX_CLOUD_PROBABILITY_APPLIED);
  return img.updateMask(isNotCloud);
}

function S2_maskEdges(s2_img) {
  return s2_img.updateMask(
      s2_img.select('B8A').mask().updateMask(s2_img.select('B9').mask()));
}
var filterSpeckles = function(img) {
  var s1vva = img.select('s1vva') //select the VV polarization band
  var s1vva_smoothed = s1vva.focal_median(50,'circle','meters').rename('s1vva_Filtered') //Apply a focal median filter
  var s1vha = img.select('s1vha') //select the vh polarization band
  var s1vha_smoothed = s1vha.focal_median(50,'circle','meters').rename('s1vha_Filtered') //Apply a focal median filter
  var s1vvd = img.select('s1vvd') //select the VV polarization band
  var s1vvd_smoothed = s1vvd.focal_median(50,'circle','meters').rename('s1vvd_Filtered') //Apply a focal median filter
  var s1vhd = img.select('s1vhd') //select the vh polarization band
  var s1vhd_smoothed = s1vhd.focal_median(50,'circle','meters').rename('s1vhd_Filtered') //Apply a focal median filter
 
  return img.addBands(s1vva_smoothed).addBands(s1vha_smoothed).addBands(s1vvd_smoothed).addBands(s1vhd_smoothed) // Add filtered VV band to original image
}
function maskRiceArea(S1_img,fusion_img) {
  var check = S1_img.select('classification');
  var isNotCloud = check.eq(1);
  return fusion_img.updateMask(isNotCloud);
}


var LS8SR_TRAIN = ee.ImageCollection("LANDSAT/LC08/C01/T1_SR");
var LS8_criteria_TRAIN = ee.Filter.and(
ee.Filter.bounds(training_area_RGS), 
ee.Filter.date(START_DATE_TRAIN, END_DATE_TRAIN));


LS8SR_TRAIN = LS8SR_TRAIN.filter(LS8_criteria_TRAIN).map(maskL8sr);
print('LS8SR_TRAIN',LS8SR_TRAIN)
var LS8SR_TRAIN_last= LS8SR_TRAIN.reduce(ee.Reducer.lastNonNull());
// Use these bands for prediction.
var bands_LS8 = ['B1_last', 'B2_last', 'B3_last','B4_last', 'B5_last', 'B6_last', 'B7_last'];
// This property stores the land cover labels as consecutive
// integers starting from zero.
var label = 'class';
// Overlay the points on the imagery to get training.
var training_LS8 = LS8SR_TRAIN_last.select(bands_LS8).sampleRegions({
  collection: rice_points,
  properties: [label],
  scale: 30
});
// Train a libsvm classifier with default parameters.
var trained_LS8_SVM = ee.Classifier.libsvm().train(training_LS8, label, bands_LS8);
var trained_LS8_RF = ee.Classifier.smileRandomForest(64).train(training_LS8, label, bands_LS8);
var trained_LS8_CART = ee.Classifier.smileCart().train(training_LS8, label, bands_LS8);

// Sentinel-2
var S2SR = ee.ImageCollection('COPERNICUS/S2_SR');
var s2Clouds = ee.ImageCollection('COPERNICUS/S2_CLOUD_PROBABILITY');
// Filter input collections by desired data range and region.
var S2_criteria_TRAIN = ee.Filter.and(ee.Filter.bounds(training_area_RGS), 
ee.Filter.date(START_DATE_TRAIN, END_DATE_TRAIN));

var S2SR_TRAIN = S2SR.filter(S2_criteria_TRAIN).map(S2_maskEdges);
//print(S2SR_TRAIN)
var s2Clouds_TRAIN = s2Clouds.filter(S2_criteria_TRAIN);

// Join S2 SR with cloud probability dataset to add cloud mask.
var S2SRWithCloudMask_TRAIN = ee.Join.saveFirst('cloud_mask').apply({
  primary: S2SR_TRAIN,
  secondary: s2Clouds_TRAIN,
  condition:
      ee.Filter.equals({leftField: 'system:index', rightField: 'system:index'})
});

// Load the Sentinel-1 ImageCollection

var s2CloudMasked_TRAIN =
    ee.ImageCollection(S2SRWithCloudMask_TRAIN).map(S2_maskClouds_TRAIN).reduce(ee.Reducer.lastNonNull());
var bands_S2 = ['B2_last', 'B3_last', 'B4_last','B5_last', 'B6_last', 'B7_last', 'B8_last','B8A_last', 'B11_last', 'B12_last'];

// Overlay the points on the imagery to get training.
var S2_training = s2CloudMasked_TRAIN.select(bands_S2).sampleRegions({
  collection: rice_points,
  properties: [label],
  scale: 30
});


// Train a libsvm classifier with default parameters.
var trained_S2_SVM = ee.Classifier.libsvm().train(S2_training, label, bands_S2);
var trained_S2_RF = ee.Classifier.smileRandomForest(64).train(S2_training, label, bands_S2);
var trained_S2_CART = ee.Classifier.smileCart().train(S2_training, label, bands_S2);



var MOD13Q1_TRAIN = ee.ImageCollection("MODIS/006/MOD13Q1");
var MOD13Q1_criteria_TRAIN = ee.Filter.and(
ee.Filter.bounds(training_area_RGS), 
ee.Filter.date(START_DATE_TRAIN, END_DATE_TRAIN));
MOD13Q1_TRAIN = MOD13Q1_TRAIN.filter(MOD13Q1_criteria_TRAIN).map(maskMOD13Q1);
var MOD13Q1_TRAIN_last= MOD13Q1_TRAIN.reduce(ee.Reducer.lastNonNull());
// Use these bands for prediction.

var bands_MOD13Q1 = ['NDVI_last', 'EVI_last',
'sur_refl_b01_last','sur_refl_b02_last','sur_refl_b03_last'];
// This property stores the land cover labels as consecutive
// integers starting from zero.
var label = 'class';
// Overlay the points on the imagery to get training.
var training_MOD13Q1 = MOD13Q1_TRAIN_last.select(bands_MOD13Q1).sampleRegions({
  collection: rice_points,
  properties: [label],
  scale: 250
});
// Train a libsvm classifier with default parameters.
var trained_MOD13Q1_SVM = ee.Classifier.libsvm().train(training_MOD13Q1, label, bands_MOD13Q1);
var trained_MOD13Q1_RF = ee.Classifier.smileRandomForest(64).train(training_MOD13Q1, label, bands_MOD13Q1);
var trained_MOD13Q1_CART = ee.Classifier.smileCart().train(training_MOD13Q1, label, bands_MOD13Q1);


// Sentinel-1
var s1_raw = ee.ImageCollection('COPERNICUS/S1_GRD')

var S1_criteria_AREA_TRAIN = ee.Filter.and(
    ee.Filter.bounds(training_area_S1), ee.Filter.date(START_DATE_AREA, END_DATE_AREA));
var s1_AREA_TRAIN = s1_raw.filter(S1_criteria_AREA_TRAIN);

// Filter to get images from different look angles
var asc_AREA_TRAIN = s1_AREA_TRAIN.filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'));
var desc_AREA_TRAIN = s1_AREA_TRAIN.filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'));
var vvvhAsc_AREA_TRAIN = asc_AREA_TRAIN
// Filter to get images with VV and VH sgeoingle polarization
.filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
.filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
// Filter to get images collected in interferometric wide swath mode.
.filter(ee.Filter.eq('instrumentMode', 'IW'));
var vvvhDesc_AREA_TRAIN = desc_AREA_TRAIN
// Filter to get images with VV and VH dual polarization
.filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
.filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
// Filter to get images collected in interferometric wide swath mode.
.filter(ee.Filter.eq('instrumentMode', 'IW'));
// Create a composite from means at different polarizations and look angles.

var composite_AREA_TRAIN = ee.Image.cat([
vvvhAsc_AREA_TRAIN.select('VV').median(),
vvvhAsc_AREA_TRAIN.select('VH').median(),
vvvhDesc_AREA_TRAIN.select('VV').median(),
vvvhDesc_AREA_TRAIN.select('VH').median(),
]).clip(training_area_S1);
// Rename the bands so you can identify them when they are all joined together
var s1comp_AREA_TRAIN = composite_AREA_TRAIN.select(
['VV','VH','VV_1','VH_1'], // old names
['s1vva','s1vha','s1vvd','s1vhd'] // new names
);

var s1comp_smooth_AREA_TRAIN = filterSpeckles(s1comp_AREA_TRAIN)

var bands_S1_Area = ['s1vva_Filtered','s1vha_Filtered','s1vvd_Filtered','s1vhd_Filtered'];

// Overlay the points on the imagery to get training.
var training_S1_Area_TRAIN = s1comp_smooth_AREA_TRAIN.select(bands_S1_Area).sampleRegions({
  collection: rice_area_points,
  properties: [label],
  scale: 30
});

// Train a libsvm classifier with default parameters.
var trained_S1_Area_SVM = ee.Classifier.libsvm().train(training_S1_Area_TRAIN, label, bands_S1_Area);
var trained_S1_Area_RF = ee.Classifier.smileRandomForest(64).train(training_S1_Area_TRAIN, label, bands_S1_Area);
var trained_S1_Area_CART = ee.Classifier.smileCart().train(training_S1_Area_TRAIN, label, bands_S1_Area);

var imageVisParam_first1 = {"opacity":1,"bands":["first"],"min":1,"max":4,"palette":["804000","66cc00","336600","ffa500"]}
var imageVisParam_last1 = {"opacity":1,"bands":["last"],"min":1,"max":4,"palette":["804000","66cc00","336600","ffa500"]}
var imageVisParam_classify = {"opacity":1,
"bands":["first"],
"min":1,"max":4,
"palette":["804000","66cc00","336600","ffa500"]
};

var imageVisParam_classification = {"opacity":1,
"bands":["classification"],
"min":1,"max":4,
"palette":["804000","66cc00","336600","ffa500"]
};

var layerProperties = {
  'Rice': {
    name: 'rice',
    visParams: {min: 1, max: 4, palette: ["804000","66cc00","336600","ffa500"]},
    legend: [
      {'Bare land': '#804000'}, 
      {'Vegetative': '#66cc00'},
      {'Reproductive': '#336600'}, 
      {'Ripening': '#ffa500'}
    ],
    defaultVisibility: true
  }
};

// Some pre-set locations of interest that will be loaded into a pulldown menu.
var locationDict = {
  '1. Pandeglang, Banten, ID' : {code:1},
  '2. Tangerang, Banten, ID' : {code:2},
  '3. Karawang, West Java, ID' : {code:3},
  '4. Subang, West Java, ID' : {code:4},
  '5. Indramayu, West Java, ID' : {code:5},
  '6. Cirebon, West Java, ID' : {code:6},
  '7. Brebes, Central Java, ID' : {code:7},
  '8. Purworejo, Central Java, ID' : {code:8},
  '9. Demak, Central Java, ID' : {code:9},
  '10. Tuban, East Java, ID' : {code:10},
  '11. Jember, East Java, ID' : {code:11},
  '12. Situbondo, East Java, ID' : {code:12},
  '13. All Java Island, ID' : {code:13}
};

var yearDict = {
  '2020': '2020',
  '2019': '2019',
  '2018' : '2018'
};

var mlDict = {
  'SVM': 'SVM',
  'RF': 'RF',
  'CART' : 'CART'
};

//nov 30 dec 31 jan 31, feb 29, mar 31, apr 30, may 31, june 30, july 31, 
var monthDict = {
  'January 1st Biweekly': {namebiweekly: 'January 1st Biweekly',number:'01',enddate:31, week:1, code:1},
  'January 2nd Biweekly': {namebiweekly: 'January 2nd Biweekly',number:'01',enddate:31, week:2, code:2}, 
  'February 1st Biweekly': {namebiweekly: 'February 1st Biweekly',number:'02',enddate:28, week:1, code:3},
  'February 2nd Biweekly': {namebiweekly: 'February 2nd Biweekly',number:'02',enddate:28, week:2, code:4},
  'March 1st Biweekly' : {namebiweekly: 'March 1st Biweekly',number:'03',enddate:31, week:1, code:5},
  'March 2nd Biweekly' : {namebiweekly: 'March 2nd Biweekly',number:'03',enddate:31, week:2, code:6},
  'April 1st Biweekly': {namebiweekly: 'April 1st Biweekly',number:'04',enddate:30, week:1, code:7},
  'April 2nd Biweekly': {namebiweekly: 'April 2nd Biweekly',number:'04',enddate:30, week:2, code:8},
  'May 1st Biweekly': {namebiweekly: 'May 1st Biweekly',number:'05',enddate:31, week:1, code:9},
  'May 2nd Biweekly': {namebiweekly: 'May 2nd Biweekly',number:'05',enddate:31, week:2, code:10},
  'June 1st Biweekly' : {namebiweekly: 'June 1st Biweekly',number:'06',enddate:30, week:1, code:11},
  'June 2nd Biweekly' : {namebiweekly: 'June 2nd Biweekly',number:'06',enddate:30, week:2, code:12},
  'July 1st Biweekly': {namebiweekly: 'July 1st Biweekly',number:'07',enddate:31, week:1, code:13},
  'July 2nd Biweekly': {namebiweekly: 'July 2nd Biweekly',number:'07',enddate:31, week:2, code:14},
  'August 1st Biweekly': {namebiweekly: 'August 1st Biweekly',number:'08',enddate:31, week:1, code:15},
  'August 2nd Biweekly': {namebiweekly: 'August 2nd Biweekly',number:'08',enddate:31, week:2, code:16},
  'September 1st Biweekly' : {namebiweekly: 'September 1st Biweekly',number:'09',enddate:30, week:1, code:17},
  'September 2nd Biweekly' : {namebiweekly: 'September 2nd Biweekly',number:'09',enddate:30, week:2, code:18},
  'October 1st Biweekly': {namebiweekly: 'October 1st Biweekly',number:'10',enddate:31, week:1, code:19},
  'October 2nd Biweekly': {namebiweekly: 'October 2nd Biweekly',number:'10',enddate:31, week:2, code:20},
  'November 1st Biweekly': {namebiweekly: 'November 1st Biweekly',number:'11',enddate:30, week:1, code:21},
  'November 2nd Biweekly': {namebiweekly: 'November 2nd Biweekly',number:'11',enddate:30, week:2, code:22},
  'December 1st Biweekly' : {namebiweekly: 'December 1st Biweekly',number:'12',enddate:31, week:1, code:23},
  'December 2nd Biweekly' : {namebiweekly: 'December 2nd Biweekly',number:'12',enddate:31, week:2, code:24}
};

var monthBiweeklynameDict = {
    1: {number:'01',enddate:15, week:1, startDate:1, codename:'January 1st Biweekly'},
  2: {number:'01',enddate:31, week:2, startDate:16, codename:'January 2nd Biweekly'}, 
  3: {number:'02',enddate:15, week:1, startDate:1, codename:'February 1st Biweekly'},
  4: {number:'02',enddate:28, week:2, startDate:16, codename:'February 2nd Biweekly'},
  5 : {number:'03',enddate:15, week:1, startDate:1, codename:'March 1st Biweekly'},
  6 : {number:'03',enddate:31, week:2, startDate:16, codename:'March 2nd Biweekly'},
  7: {number:'04',enddate:15, week:1, startDate:1, codename:'April 1st Biweekly'},
  8: {number:'04',enddate:30, week:2, startDate:16, codename:'April 2nd Biweekly'},
  9: {number:'05',enddate:15, week:1, startDate:1, codename:'May 1st Biweekly'},
  10: {number:'05',enddate:31, week:2, startDate:16, codename:'May 2nd Biweekly'},
  11 : {number:'06',enddate:15, week:1, startDate:1, codename:'June 1st Biweekly'},
  12 : {number:'06',enddate:30, week:2, startDate:16, codename:'June 2nd Biweekly'},
  13: {number:'07',enddate:15, week:1, startDate:1, codename:'July 1st Biweekly'},
  14: {number:'07',enddate:31, week:2, startDate:16, codename:'July 2nd Biweekly'},
  15: {number:'08',enddate:15, week:1, startDate:1, codename:'August 1st Biweekly'},
  16: {number:'08',enddate:31, week:2, startDate:16, codename:'August 2nd Biweekly'},
  17: {number:'09',enddate:15, week:1, startDate:1, codename:'September 1st Biweekly'},
  18: {number:'09',enddate:30, week:2, startDate:16, codename:'September 2nd Biweekly'},
  19: {number:'10',enddate:15, week:1, startDate:1, codename:'October 1st Biweekly'},
  20: {number:'10',enddate:31, week:2, startDate:16, codename:'October 2nd Biweekly'},
  21: {number:'11',enddate:15, week:1, startDate:1, codename:'November 1st Biweekly'},
  22: {number:'11',enddate:30, week:2, startDate:16, codename:'November 2nd Biweekly'},
  23: {number:'12',enddate:15, week:1, startDate:1, codename:'December 1st Biweekly'},
  24: {number:'12',enddate:31, week:2, startDate:16, codename:'December 2nd Biweekly'}
};

var monthnameDict = {
  '01': {number:'January',enddate:31},
  '02': {number:'February',enddate:28},
  '03' : {number:'March',enddate:31},
  '04': {number:'April',enddate:30},
  '05': {number:'May',enddate:31},
  '06' : {number:'June',enddate:30},
  '07': {number:'July',enddate:31},
  '08': {number:'August',enddate:31},
  '09' : {number:'September',enddate:30},
  '10': {number:'October',enddate:31},
  '11': {number:'November',enddate:30},
  '12' : {number:'December',enddate:31}
};


/*
 * Map panel configuration
 */

// Now let's do some overall layout.
// Create a map panel.

var months_long = ["January", "February", "March","April", 
"May", "June", "July", "August", "September", "October", "November", "December"];


// Add these to the interface.


function ricegrowthstages(code, ml, year, code_biweekly) {
  var box_filteredArea;
    if (code==13) {
      box_filteredArea = box_select;
    } else {
      var filter = ee.Filter.inList('code', [parseInt(code)]);
      box_filteredArea = box_select.filter(filter);
    }
  
  var S1_criteria_AREA_APPLIED = ee.Filter.and(
      ee.Filter.bounds(box_filteredArea), ee.Filter.date(START_DATE_AREA, END_DATE_AREA));
  var s1_AREA_APPLIED = s1_raw.filter(S1_criteria_AREA_APPLIED);
  
  // Filter to get images from different look angles
  var asc_AREA_APPLIED = s1_AREA_APPLIED.filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'));
  var desc_AREA_APPLIED = s1_AREA_APPLIED.filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'));
  var vvvhAsc_AREA_APPLIED = asc_AREA_APPLIED
  // Filter to get images with VV and VH sgeoingle polarization
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
  // Filter to get images collected in interferometric wide swath mode.
  .filter(ee.Filter.eq('instrumentMode', 'IW'));
  var vvvhDesc_AREA_APPLIED = desc_AREA_APPLIED
  // Filter to get images with VV and VH dual polarization
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
  // Filter to get images collected in interferometric wide swath mode.
  .filter(ee.Filter.eq('instrumentMode', 'IW'));
  // Create a composite from means at different polarizations and look angles.
  
  print('asc_AREA_APPLIED',asc_AREA_APPLIED)
  print('desc_AREA_APPLIED',desc_AREA_APPLIED)
  
  var composite_AREA_APPLIED = ee.Image.cat([
  vvvhAsc_AREA_APPLIED.select('VV').median(),
  vvvhAsc_AREA_APPLIED.select('VH').median(),
  vvvhDesc_AREA_APPLIED.select('VV').median(),
  vvvhDesc_AREA_APPLIED.select('VH').median(),
  ]).clip(box_filteredArea);
  // Rename the bands so you can identify them when they are all joined together
  var s1comp_AREA_APPLIED = composite_AREA_APPLIED.select(
  ['VV','VH','VV_1','VH_1'], // old names
  ['s1vva','s1vha','s1vvd','s1vhd'] // new names
  );

  var s1comp_smooth_AREA_APPLIED = filterSpeckles(s1comp_AREA_APPLIED)
  
  // Classify the image with the same bands used for applied.
  var classified_S1_Area_APPLIED;
  if (ml =='SVM') {
    classified_S1_Area_APPLIED = s1comp_smooth_AREA_APPLIED.select(bands_S1_Area).classify(trained_S1_Area_SVM);
  } 
  if (ml =='RF') {
    classified_S1_Area_APPLIED = s1comp_smooth_AREA_APPLIED.select(bands_S1_Area).classify(trained_S1_Area_RF);
  } 
  if (ml =='CART') {
    classified_S1_Area_APPLIED = s1comp_smooth_AREA_APPLIED.select(bands_S1_Area).classify(trained_S1_Area_CART);
  } 
  
  var USGS_dataset = ee.Image('USGS/SRTMGL1_003');
  var elevation = USGS_dataset.select('elevation');
  var slope = ee.Terrain.slope(elevation);
  
  
  function maskSlope(srtm,fusion_img) {
  
    var elevation1 = srtm.select('elevation');
    var slope1 = ee.Terrain.slope(elevation1);
    var isNotSlope = slope1.lt(10);
    var isNotElevation = elevation1.lt(100);
      return fusion_img.updateMask(isNotElevation).updateMask(isNotSlope);
  }
  
  
  //--------------------
  print(code_biweekly)
  var date_APPLIED1_code = code_biweekly;
 
  var date_APPLIED1_data = monthBiweeklynameDict[date_APPLIED1_code];
   
  var START_DATE_APPLIED1 = ee.Date(year + '-'+ date_APPLIED1_data.number + '-' + date_APPLIED1_data.startDate);
  var END_DATE_APPLIED1 = ee.Date(year + '-'+ date_APPLIED1_data.number +'-' + date_APPLIED1_data.enddate);
  
  var date_APPLIED2_code = date_APPLIED1_code - 1
  var year_APPLIED2 = year
  if (date_APPLIED2_code<1) {
    date_APPLIED2_code = date_APPLIED2_code + 24
    year_APPLIED2 = year-1
  }

  var date_APPLIED2_data = monthBiweeklynameDict[date_APPLIED2_code];
  var START_DATE_APPLIED2 = ee.Date(year_APPLIED2 + '-'+ date_APPLIED2_data.number + '-' + date_APPLIED2_data.startDate);
  var END_DATE_APPLIED2 = ee.Date(year_APPLIED2 + '-'+ date_APPLIED2_data.number +'-' + date_APPLIED2_data.enddate);
    var date_APPLIED3_code = date_APPLIED1_code - 2
  var year_APPLIED3 = year
  if (date_APPLIED3_code<1) {
    date_APPLIED3_code = date_APPLIED3_code + 24
    year_APPLIED3 = year-1
  }
  var date_APPLIED3_data = monthBiweeklynameDict[date_APPLIED3_code];
  var START_DATE_APPLIED3 = ee.Date(year_APPLIED3 + '-'+ date_APPLIED3_data.number + '-' + date_APPLIED3_data.startDate);
  var END_DATE_APPLIED3 = ee.Date(year_APPLIED3 + '-'+ date_APPLIED3_data.number +'-' + date_APPLIED3_data.enddate);
    var date_APPLIED4_code = date_APPLIED1_code - 3
  var year_APPLIED4 = year
  if (date_APPLIED4_code<1) {
    date_APPLIED4_code = date_APPLIED4_code + 24
    year_APPLIED4 = year-1
  }
  var date_APPLIED4_data = monthBiweeklynameDict[date_APPLIED4_code];
  var START_DATE_APPLIED4 = ee.Date(year_APPLIED4 + '-'+ date_APPLIED4_data.number + '-' + date_APPLIED4_data.startDate);
  var END_DATE_APPLIED4 = ee.Date(year_APPLIED4 + '-'+ date_APPLIED4_data.number +'-' + date_APPLIED4_data.enddate);
  

  print(START_DATE_APPLIED1,END_DATE_APPLIED1);

  
  //APPLIED1
  
 var MOD13Q1_APPLIED1 = ee.ImageCollection("MODIS/006/MOD13Q1");
  var MOD13Q1_criteria_APPLIED1 = ee.Filter.and(
  ee.Filter.bounds(box_filteredArea), 
  ee.Filter.date(START_DATE_APPLIED1, END_DATE_APPLIED1));
  MOD13Q1_APPLIED1 = MOD13Q1_APPLIED1.filter(MOD13Q1_criteria_APPLIED1).map(maskMOD13Q1);
  
  var count_MOD13Q1 = MOD13Q1_APPLIED1.filter(MOD13Q1_criteria_APPLIED1).size();
  var MOD13Q1_APPLIED1_last= MOD13Q1_APPLIED1.reduce(ee.Reducer.lastNonNull());

  // Classify the image with the same bands used for APPLIED1.
  var classified_MOD13Q1_APPLIED1;
  if (ml =='SVM') {
    classified_MOD13Q1_APPLIED1 = MOD13Q1_APPLIED1_last.select(bands_MOD13Q1).classify(trained_MOD13Q1_SVM);
  } 
  if (ml =='RF') {
    classified_MOD13Q1_APPLIED1 = MOD13Q1_APPLIED1_last.select(bands_MOD13Q1).classify(trained_MOD13Q1_RF);
  } 
  if (ml =='CART') {
    classified_MOD13Q1_APPLIED1 = MOD13Q1_APPLIED1_last.select(bands_MOD13Q1).classify(trained_MOD13Q1_CART);
  } 
  


  var name_file_fusion = 'FusionGEEBiWeekly_MOD13Q1_V2_'+ ml +'_ALL-' + year +'_' + date_APPLIED1_code + '_W' + date_APPLIED1_data.week + '-' + date_APPLIED1_data.number ;
  Export.image.toDrive({
    image: classified_MOD13Q1_APPLIED1,
    folder : 'FusionGEEBiWeekly_MOD13Q1_V2_'+ml,
    crs:'EPSG:32748' ,
    description: name_file_fusion,
    scale: 30,
    maxPixels : 5e9,
    region: box_filteredArea
  });

}


ricegrowthstages('13','RF','2019','21');
ricegrowthstages('13','RF','2019','22');
ricegrowthstages('13','RF','2019','23');
ricegrowthstages('13','RF','2019','24');
ricegrowthstages('13','RF','2020','1');
ricegrowthstages('13','RF','2020','2');
ricegrowthstages('13','RF','2020','3');
ricegrowthstages('13','RF','2020','4');
ricegrowthstages('13','RF','2020','5');
ricegrowthstages('13','RF','2020','6');
ricegrowthstages('13','RF','2020','7');
ricegrowthstages('13','RF','2020','8');
ricegrowthstages('13','RF','2020','9');
ricegrowthstages('13','RF','2020','10');
ricegrowthstages('13','RF','2020','11');
ricegrowthstages('13','RF','2020','12');
ricegrowthstages('13','RF','2020','13');
ricegrowthstages('13','RF','2020','14');
ricegrowthstages('13','RF','2020','15');
ricegrowthstages('13','RF','2020','16');
ricegrowthstages('13','RF','2020','17');
ricegrowthstages('13','RF','2020','18');


//ricegrowthstages('13', 'SVM', '2020', '09', '31',2,'September 2nd Biweekly') 
 
