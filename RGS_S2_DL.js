// Demonstrates how to efficiently display a number of layers of a dataset along
// with a legend for each layer, and some visualization controls.
 
 

function addDays(startdate,days) {
    var date = new Date(startdate.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}
 

function pad2(n) {
  return (n < 10 ? '0' : '') + n;
}

var monthNames =["Jan","Feb","Mar","Apr",
                      "May","Jun","Jul","Aug",
                      "Sep", "Oct","Nov","Dec"];

 
function date2string(datestart, dateend) {
  var monthstart = monthNames[datestart.getMonth()]//months (0-11)
  var daystart = pad2(datestart.getDate());//day (1-31)
  var yearstart = datestart.getFullYear();
  
  
  var monthend = monthNames[dateend.getMonth()];//months (0-11)
  var dayend = pad2(dateend.getDate());//day (1-31)
  var yearend = dateend.getFullYear();
  
  var formattedDate; 
  
  if (yearstart===yearend) {
    if (monthstart===monthend) {
     formattedDate = daystart + ' - ' + dayend  + ' ' + monthstart + ' ' + yearstart;
    } else {
      formattedDate = daystart + ' ' + monthstart + ' - ' + dayend  + ' ' + monthend + ' ' + yearstart;
    } 
  } else {
    formattedDate = daystart + ' ' + monthstart + ' ' + yearstart + ' - ' + dayend  + ' ' + monthend + ' ' + yearend;
  }

  return formattedDate
}

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
          
var indonesia = 
    /* color: #d63000 */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[93.67362422316903, 6.815970308576921],
          [93.67362422316903, -11.028838838453117],
          [143.85917109816904, -11.028838838453117],
          [143.85917109816904, 6.815970308576921]]], null, false);

var monthDict = {
'01. 01 Jan - 16 Jan 2019': {startdate:'1',startmonth:'1',startyear:'2019', enddate:'16', endmonth:'1',endyear:'2019', codename:'01',longname:'01. 01 Jan - 16 Jan 2019'},
'02. 17 Jan - 01 Feb 2019': {startdate:'17',startmonth:'1',startyear:'2019', enddate:'1', endmonth:'2',endyear:'2019', codename:'02',longname:'02. 17 Jan - 01 Feb 2019'},
'03. 02 Feb - 17 Feb 2019': {startdate:'2',startmonth:'2',startyear:'2019', enddate:'17', endmonth:'2',endyear:'2019', codename:'03',longname:'03. 02 Feb - 17 Feb 2019'},
'04. 18 Feb - 05 Mar 2019': {startdate:'18',startmonth:'2',startyear:'2019', enddate:'5', endmonth:'3',endyear:'2019', codename:'04',longname:'04. 18 Feb - 05 Mar 2019'},
'05. 06 Mar - 21 Mar 2019': {startdate:'6',startmonth:'3',startyear:'2019', enddate:'21', endmonth:'3',endyear:'2019', codename:'05',longname:'05. 06 Mar - 21 Mar 2019'},
'06. 22 Mar - 06 Apr 2019': {startdate:'22',startmonth:'3',startyear:'2019', enddate:'6', endmonth:'4',endyear:'2019', codename:'06',longname:'06. 22 Mar - 06 Apr 2019'},
'07. 07 Apr - 22 Apr 2019': {startdate:'7',startmonth:'4',startyear:'2019', enddate:'22', endmonth:'4',endyear:'2019', codename:'07',longname:'07. 07 Apr - 22 Apr 2019'},
'08. 23 Apr - 08 May 2019': {startdate:'23',startmonth:'4',startyear:'2019', enddate:'8', endmonth:'5',endyear:'2019', codename:'08',longname:'08. 23 Apr - 08 May 2019'},
'09. 09 May - 24 May 2019': {startdate:'9',startmonth:'5',startyear:'2019', enddate:'24', endmonth:'5',endyear:'2019', codename:'09',longname:'09. 09 May - 24 May 2019'},
'10. 25 May - 09 Jun 2019': {startdate:'25',startmonth:'5',startyear:'2019', enddate:'9', endmonth:'6',endyear:'2019', codename:'10',longname:'10. 25 May - 09 Jun 2019'},
'11. 10 Jun - 25 Jun 2019': {startdate:'10',startmonth:'6',startyear:'2019', enddate:'25', endmonth:'6',endyear:'2019', codename:'11',longname:'11. 10 Jun - 25 Jun 2019'},
'12. 26 Jun - 11 Jul 2019': {startdate:'26',startmonth:'6',startyear:'2019', enddate:'11', endmonth:'7',endyear:'2019', codename:'12',longname:'12. 26 Jun - 11 Jul 2019'},
'13. 12 Jul - 27 Jul 2019': {startdate:'12',startmonth:'7',startyear:'2019', enddate:'27', endmonth:'7',endyear:'2019', codename:'13',longname:'13. 12 Jul - 27 Jul 2019'},
'14. 28 Jul - 12 Aug 2019': {startdate:'28',startmonth:'7',startyear:'2019', enddate:'12', endmonth:'8',endyear:'2019', codename:'14',longname:'14. 28 Jul - 12 Aug 2019'},
'15. 13 Aug - 28 Aug 2019': {startdate:'13',startmonth:'8',startyear:'2019', enddate:'28', endmonth:'8',endyear:'2019', codename:'15',longname:'15. 13 Aug - 28 Aug 2019'},
'16. 29 Aug - 13 Sep 2019': {startdate:'29',startmonth:'8',startyear:'2019', enddate:'13', endmonth:'9',endyear:'2019', codename:'16',longname:'16. 29 Aug - 13 Sep 2019'},
'17. 14 Sep - 29 Sep 2019': {startdate:'14',startmonth:'9',startyear:'2019', enddate:'29', endmonth:'9',endyear:'2019', codename:'17',longname:'17. 14 Sep - 29 Sep 2019'},
'18. 30 Sep - 15 Oct 2019': {startdate:'30',startmonth:'9',startyear:'2019', enddate:'15', endmonth:'10',endyear:'2019', codename:'18',longname:'18. 30 Sep - 15 Oct 2019'},
'19. 16 Oct - 31 Oct 2019': {startdate:'16',startmonth:'10',startyear:'2019', enddate:'31', endmonth:'10',endyear:'2019', codename:'19',longname:'19. 16 Oct - 31 Oct 2019'},
'20. 01 Nov - 16 Nov 2019': {startdate:'1',startmonth:'11',startyear:'2019', enddate:'16', endmonth:'11',endyear:'2019', codename:'20',longname:'20. 01 Nov - 16 Nov 2019'},
'21. 17 Nov - 02 Dec 2019': {startdate:'17',startmonth:'11',startyear:'2019', enddate:'2', endmonth:'12',endyear:'2019', codename:'21',longname:'21. 17 Nov - 02 Dec 2019'},
'22. 03 Dec - 18 Dec 2019': {startdate:'3',startmonth:'12',startyear:'2019', enddate:'18', endmonth:'12',endyear:'2019', codename:'22',longname:'22. 03 Dec - 18 Dec 2019'},
'23. 19 Dec - 31 Dec 2019': {startdate:'19',startmonth:'12',startyear:'2019', enddate:'31', endmonth:'12',endyear:'2019', codename:'23',longname:'23. 19 Dec - 31 Dec 2019'},
'24. 01 Jan - 16 Jan 2020': {startdate:'1',startmonth:'1',startyear:'2020', enddate:'16', endmonth:'1',endyear:'2020', codename:'24',longname:'24. 01 Jan - 16 Jan 2020'},
'25. 17 Jan - 01 Feb 2020': {startdate:'17',startmonth:'1',startyear:'2020', enddate:'1', endmonth:'2',endyear:'2020', codename:'25',longname:'25. 17 Jan - 01 Feb 2020'},
'26. 02 Feb - 17 Feb 2020': {startdate:'2',startmonth:'2',startyear:'2020', enddate:'17', endmonth:'2',endyear:'2020', codename:'26',longname:'26. 02 Feb - 17 Feb 2020'},
'27. 18 Feb - 04 Mar 2020': {startdate:'18',startmonth:'2',startyear:'2020', enddate:'4', endmonth:'3',endyear:'2020', codename:'27',longname:'27. 18 Feb - 04 Mar 2020'},
'28. 05 Mar - 20 Mar 2020': {startdate:'5',startmonth:'3',startyear:'2020', enddate:'20', endmonth:'3',endyear:'2020', codename:'28',longname:'28. 05 Mar - 20 Mar 2020'},
'29. 21 Mar - 05 Apr 2020': {startdate:'21',startmonth:'3',startyear:'2020', enddate:'5', endmonth:'4',endyear:'2020', codename:'29',longname:'29. 21 Mar - 05 Apr 2020'},
'30. 06 Apr - 21 Apr 2020': {startdate:'6',startmonth:'4',startyear:'2020', enddate:'21', endmonth:'4',endyear:'2020', codename:'30',longname:'30. 06 Apr - 21 Apr 2020'},
'31. 22 Apr - 07 May 2020': {startdate:'22',startmonth:'4',startyear:'2020', enddate:'7', endmonth:'5',endyear:'2020', codename:'31',longname:'31. 22 Apr - 07 May 2020'},
'32. 08 May - 23 May 2020': {startdate:'8',startmonth:'5',startyear:'2020', enddate:'23', endmonth:'5',endyear:'2020', codename:'32',longname:'32. 08 May - 23 May 2020'},
'33. 24 May - 08 Jun 2020': {startdate:'24',startmonth:'5',startyear:'2020', enddate:'8', endmonth:'6',endyear:'2020', codename:'33',longname:'33. 24 May - 08 Jun 2020'},
'34. 09 Jun - 24 Jun 2020': {startdate:'9',startmonth:'6',startyear:'2020', enddate:'24', endmonth:'6',endyear:'2020', codename:'34',longname:'34. 09 Jun - 24 Jun 2020'},
'35. 25 Jun - 10 Jul 2020': {startdate:'25',startmonth:'6',startyear:'2020', enddate:'10', endmonth:'7',endyear:'2020', codename:'35',longname:'35. 25 Jun - 10 Jul 2020'},
'36. 11 Jul - 26 Jul 2020': {startdate:'11',startmonth:'7',startyear:'2020', enddate:'26', endmonth:'7',endyear:'2020', codename:'36',longname:'36. 11 Jul - 26 Jul 2020'},
'37. 27 Jul - 11 Aug 2020': {startdate:'27',startmonth:'7',startyear:'2020', enddate:'11', endmonth:'8',endyear:'2020', codename:'37',longname:'37. 27 Jul - 11 Aug 2020'},
'38. 12 Aug - 27 Aug 2020': {startdate:'12',startmonth:'8',startyear:'2020', enddate:'27', endmonth:'8',endyear:'2020', codename:'38',longname:'38. 12 Aug - 27 Aug 2020'},
'39. 28 Aug - 12 Sep 2020': {startdate:'28',startmonth:'8',startyear:'2020', enddate:'12', endmonth:'9',endyear:'2020', codename:'39',longname:'39. 28 Aug - 12 Sep 2020'},
'40. 13 Sep - 28 Sep 2020': {startdate:'13',startmonth:'9',startyear:'2020', enddate:'28', endmonth:'9',endyear:'2020', codename:'40',longname:'40. 13 Sep - 28 Sep 2020'},
'41. 29 Sep - 14 Oct 2020': {startdate:'29',startmonth:'9',startyear:'2020', enddate:'14', endmonth:'10',endyear:'2020', codename:'41',longname:'41. 29 Sep - 14 Oct 2020'},
'42. 15 Oct - 30 Oct 2020': {startdate:'15',startmonth:'10',startyear:'2020', enddate:'30', endmonth:'10',endyear:'2020', codename:'42',longname:'42. 15 Oct - 30 Oct 2020'},
'43. 31 Oct - 15 Nov 2020': {startdate:'31',startmonth:'10',startyear:'2020', enddate:'15', endmonth:'11',endyear:'2020', codename:'43',longname:'43. 31 Oct - 15 Nov 2020'},
'44. 16 Nov - 01 Dec 2020': {startdate:'16',startmonth:'11',startyear:'2020', enddate:'1', endmonth:'12',endyear:'2020', codename:'44',longname:'44. 16 Nov - 01 Dec 2020'},
'45. 02 Dec - 17 Dec 2020': {startdate:'2',startmonth:'12',startyear:'2020', enddate:'17', endmonth:'12',endyear:'2020', codename:'45',longname:'45. 02 Dec - 17 Dec 2020'},
'46. 18 Dec - 31 Dec 2020': {startdate:'18',startmonth:'12',startyear:'2020', enddate:'31', endmonth:'12',endyear:'2020', codename:'46',longname:'46. 18 Dec - 31 Dec 2020'},
'47. 01 Jan - 16 Jan 2021': {startdate:'1',startmonth:'1',startyear:'2021', enddate:'16', endmonth:'1',endyear:'2021', codename:'47',longname:'47. 01 Jan - 16 Jan 2021'},
'48. 17 Jan - 01 Feb 2021': {startdate:'17',startmonth:'1',startyear:'2021', enddate:'1', endmonth:'2',endyear:'2021', codename:'48',longname:'48. 17 Jan - 01 Feb 2021'},
'49. 02 Feb - 17 Feb 2021': {startdate:'2',startmonth:'2',startyear:'2021', enddate:'17', endmonth:'2',endyear:'2021', codename:'49',longname:'49. 02 Feb - 17 Feb 2021'},
'50. 18 Feb - 05 Mar 2021': {startdate:'18',startmonth:'2',startyear:'2021', enddate:'5', endmonth:'3',endyear:'2021', codename:'50',longname:'50. 18 Feb - 05 Mar 2021'},
'51. 06 Mar - 21 Mar 2021': {startdate:'6',startmonth:'3',startyear:'2021', enddate:'21', endmonth:'3',endyear:'2021', codename:'51',longname:'51. 06 Mar - 21 Mar 2021'},
'52. 22 Mar - 06 Apr 2021': {startdate:'22',startmonth:'3',startyear:'2021', enddate:'6', endmonth:'4',endyear:'2021', codename:'52',longname:'52. 22 Mar - 06 Apr 2021'},
'53. 07 Apr - 22 Apr 2021': {startdate:'7',startmonth:'4',startyear:'2021', enddate:'22', endmonth:'4',endyear:'2021', codename:'53',longname:'53. 07 Apr - 22 Apr 2021'},
'54. 23 Apr - 08 May 2021': {startdate:'23',startmonth:'4',startyear:'2021', enddate:'8', endmonth:'5',endyear:'2021', codename:'54',longname:'54. 23 Apr - 08 May 2021'},
'55. 09 May - 24 May 2021': {startdate:'9',startmonth:'5',startyear:'2021', enddate:'24', endmonth:'5',endyear:'2021', codename:'55',longname:'55. 09 May - 24 May 2021'},
'56. 25 May - 09 Jun 2021': {startdate:'25',startmonth:'5',startyear:'2021', enddate:'9', endmonth:'6',endyear:'2021', codename:'56',longname:'56. 25 May - 09 Jun 2021'},
'57. 10 Jun - 25 Jun 2021': {startdate:'10',startmonth:'6',startyear:'2021', enddate:'25', endmonth:'6',endyear:'2021', codename:'57',longname:'57. 10 Jun - 25 Jun 2021'},
'58. 26 Jun - 11 Jul 2021': {startdate:'26',startmonth:'6',startyear:'2021', enddate:'11', endmonth:'7',endyear:'2021', codename:'58',longname:'58. 26 Jun - 11 Jul 2021'},
'59. 12 Jul - 27 Jul 2021': {startdate:'12',startmonth:'7',startyear:'2021', enddate:'27', endmonth:'7',endyear:'2021', codename:'59',longname:'59. 12 Jul - 27 Jul 2021'},
'60. 28 Jul - 12 Aug 2021': {startdate:'28',startmonth:'7',startyear:'2021', enddate:'12', endmonth:'8',endyear:'2021', codename:'60',longname:'60. 28 Jul - 12 Aug 2021'},
'61. 13 Aug - 28 Aug 2021': {startdate:'13',startmonth:'8',startyear:'2021', enddate:'28', endmonth:'8',endyear:'2021', codename:'61',longname:'61. 13 Aug - 28 Aug 2021'},
'62. 29 Aug - 13 Sep 2021': {startdate:'29',startmonth:'8',startyear:'2021', enddate:'13', endmonth:'9',endyear:'2021', codename:'62',longname:'62. 29 Aug - 13 Sep 2021'},
'63. 14 Sep - 29 Sep 2021': {startdate:'14',startmonth:'9',startyear:'2021', enddate:'29', endmonth:'9',endyear:'2021', codename:'63',longname:'63. 14 Sep - 29 Sep 2021'},
'64. 30 Sep - 15 Oct 2021': {startdate:'30',startmonth:'9',startyear:'2021', enddate:'15', endmonth:'10',endyear:'2021', codename:'64',longname:'64. 30 Sep - 15 Oct 2021'},
'65. 16 Oct - 31 Oct 2021': {startdate:'16',startmonth:'10',startyear:'2021', enddate:'31', endmonth:'10',endyear:'2021', codename:'65',longname:'65. 16 Oct - 31 Oct 2021'},
'66. 01 Nov - 16 Nov 2021': {startdate:'1',startmonth:'11',startyear:'2021', enddate:'16', endmonth:'11',endyear:'2021', codename:'66',longname:'66. 01 Nov - 16 Nov 2021'},
'67. 17 Nov - 02 Dec 2021': {startdate:'17',startmonth:'11',startyear:'2021', enddate:'2', endmonth:'12',endyear:'2021', codename:'67',longname:'67. 17 Nov - 02 Dec 2021'},
'68. 03 Dec - 18 Dec 2021': {startdate:'3',startmonth:'12',startyear:'2021', enddate:'18', endmonth:'12',endyear:'2021', codename:'68',longname:'68. 03 Dec - 18 Dec 2021'},
'69. 19 Dec - 31 Dec 2021': {startdate:'19',startmonth:'12',startyear:'2021', enddate:'31', endmonth:'12',endyear:'2021', codename:'69',longname:'69. 19 Dec - 31 Dec 2021'}
};


var START_DATE_TRAIN = ee.Date('2020-05-15');
var END_DATE_TRAIN = ee.Date('2020-05-31');

var START_DATE_AREA = ee.Date('2014-10-01');
var END_DATE_AREA = ee.Date('2020-09-30');

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
function maskRiceArea(S1_img,MS_img) {
  var check = S1_img.select('classification');
  var isNotCloud = check.eq(1);
  return MS_img.updateMask(isNotCloud);
}


var RA_trained_ML;

var RGS_trained_LS8_ML;
var RGS_trained_S2_ML;
var RGS_trained_MOD13Q1_ML;
var bands_S1_Area = ['s1vva_Filtered','s1vha_Filtered','s1vvd_Filtered','s1vhd_Filtered'];
var label = 'class';
var S2SR = ee.ImageCollection('COPERNICUS/S2_SR');
var s2Clouds = ee.ImageCollection('COPERNICUS/S2_CLOUD_PROBABILITY');
var s1_raw = ee.ImageCollection('COPERNICUS/S1_GRD')
var bands_LS8 = ['B1_last', 'B2_last', 'B3_last','B4_last', 'B5_last', 'B6_last', 'B7_last'];
var bands_S2 = ['B2_last', 'B3_last', 'B4_last','B5_last', 'B6_last', 'B7_last', 'B8_last','B8A_last', 'B11_last', 'B12_last'];
var bands_MOD13Q1 = ['NDVI_last', 'EVI_last', 'sur_refl_b01_last','sur_refl_b02_last','sur_refl_b03_last'];

function training_ML(ml) {
  

  var LS8SR_TRAIN = ee.ImageCollection("LANDSAT/LC08/C01/T1_SR");
  var LS8_criteria_TRAIN = ee.Filter.and(
  ee.Filter.bounds(training_area_RGS), 
  ee.Filter.date(START_DATE_TRAIN, END_DATE_TRAIN));
  LS8SR_TRAIN = LS8SR_TRAIN.filter(LS8_criteria_TRAIN).map(maskL8sr);
  
  var LS8SR_TRAIN_last= LS8SR_TRAIN.reduce(ee.Reducer.lastNonNull());
  // Use these bands for prediction.
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
  
  if (ml =='SVM') {
    RGS_trained_LS8_ML = ee.Classifier.libsvm().train(training_LS8, label, bands_LS8);
  } 
  if (ml =='RF') {
    RGS_trained_LS8_ML = ee.Classifier.smileRandomForest(64).train(training_LS8, label, bands_LS8);
  } 
  if (ml =='CART') {
    RGS_trained_LS8_ML = ee.Classifier.smileCart().train(training_LS8, label, bands_LS8);
  } 
  // Sentinel-2

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
 
  // Overlay the points on the imagery to get training.
  var S2_training = s2CloudMasked_TRAIN.select(bands_S2).sampleRegions({
    collection: rice_points,
    properties: [label],
    scale: 30
  });
  
  
  // Train a libsvm classifier with default parameters.

  if (ml =='SVM') {
    RGS_trained_S2_ML = ee.Classifier.libsvm().train(S2_training, label, bands_S2);
  } 
  if (ml =='RF') {
   RGS_trained_S2_ML = ee.Classifier.smileRandomForest(64).train(S2_training, label, bands_S2);
  } 
  if (ml =='CART') {
    RGS_trained_S2_ML = ee.Classifier.smileCart().train(S2_training, label, bands_S2);
  } 
  
  
  var MOD13Q1_TRAIN = ee.ImageCollection("MODIS/006/MOD13Q1");
  var MOD13Q1_criteria_TRAIN = ee.Filter.and(
  ee.Filter.bounds(training_area_RGS), 
  ee.Filter.date(START_DATE_TRAIN, END_DATE_TRAIN));
  MOD13Q1_TRAIN = MOD13Q1_TRAIN.filter(MOD13Q1_criteria_TRAIN).map(maskMOD13Q1);
  var MOD13Q1_TRAIN_last= MOD13Q1_TRAIN.reduce(ee.Reducer.lastNonNull());
  // Use these bands for prediction.
  
   // This property stores the land cover labels as consecutive
  // integers starting from zero.

  // Overlay the points on the imagery to get training.
  var training_MOD13Q1 = MOD13Q1_TRAIN_last.select(bands_MOD13Q1).sampleRegions({
    collection: rice_points,
    properties: [label],
    scale: 250
  });
  // Train a libsvm classifier with default parameters.
  
  if (ml =='SVM') {
    RGS_trained_MOD13Q1_ML = ee.Classifier.libsvm().train(training_MOD13Q1, label, bands_MOD13Q1);
  } 
  if (ml =='RF') {
    RGS_trained_MOD13Q1_ML = ee.Classifier.smileRandomForest(64).train(training_MOD13Q1, label, bands_MOD13Q1);
  } 
  if (ml =='CART') {
    RGS_trained_MOD13Q1_ML = ee.Classifier.smileCart().train(training_MOD13Q1, label, bands_MOD13Q1);
  } 
  // Sentinel-1

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
    //print(asc_AREA_TRAIN)
     // print(desc_AREA_TRAIN)
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
  

  // Overlay the points on the imagery to get training.
  var training_S1_Area_TRAIN = s1comp_smooth_AREA_TRAIN.select(bands_S1_Area).sampleRegions({
    collection: rice_area_points,
    properties: [label],
    scale: 10
  });
  
  // Train a libsvm classifier with default parameters.

  if (ml =='SVM') {
    RA_trained_ML = ee.Classifier.libsvm().train(training_S1_Area_TRAIN, label, bands_S1_Area);
  } 
  if (ml =='RF') {
    RA_trained_ML = ee.Classifier.smileRandomForest(64).train(training_S1_Area_TRAIN, label, bands_S1_Area);
  } 
  if (ml =='CART') {
    RA_trained_ML = ee.Classifier.smileCart().train(training_S1_Area_TRAIN, label, bands_S1_Area);
  } 
}


function ricegrowthstages(code, ml, first_period) {
  training_ML(ml);

  var box_filteredArea;
    if (code==13) {
      box_filteredArea = poly_java;
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

  var s1comp_smooth_AREA_APPLIED = filterSpeckles(s1comp_AREA_APPLIED);

  // Classify the image with the same bands used for applied.
  var classified_S1_Area_APPLIED = s1comp_smooth_AREA_APPLIED.select(bands_S1_Area).classify(RA_trained_ML);

  var USGS_dataset = ee.Image('USGS/SRTMGL1_003');
  var elevation = USGS_dataset.select('elevation');
  var slope = ee.Terrain.slope(elevation);
  

  function maskSlope(srtm,MS_img) {
  
    var elevation1 = srtm.select('elevation');
    var slope1 = ee.Terrain.slope(elevation1);
    var isNotSlope = slope1.lt(10);
    var isNotElevation = elevation1.lt(100);
      return MS_img.updateMask(isNotElevation).updateMask(isNotSlope);
  }
  
  
  //--------------------
print(first_period)


  var date_APPLIED1_code = monthDict[first_period].codename;
  var date_APPLIED1 = monthDict[first_period];
   
  var START_DATE_APPLIED1 = new Date(date_APPLIED1.startyear + '-'+ date_APPLIED1.startmonth + '-' + date_APPLIED1.startdate);
  var END_DATE_APPLIED1 = new Date(date_APPLIED1.endyear + '-'+ date_APPLIED1.endmonth +'-' + date_APPLIED1.enddate);
  var date_APPLIED1_data = date2string(START_DATE_APPLIED1,END_DATE_APPLIED1)
  print(START_DATE_APPLIED1,END_DATE_APPLIED1,date_APPLIED1_data);
  
  var date_APPLIED2_code = parseInt(date_APPLIED1_code) + 1
  print(date_APPLIED2_code)
  var second_period;
  for (var i = 0; i < monthDicts.length; i++) {
        var item = monthDicts[i];
        var code_cari = monthDict[item].codename;
        var longname = monthDict[item].longname;
        if (parseInt(date_APPLIED2_code) == parseInt(code_cari)){
          second_period = longname;
          break;
        }
    }
  

  //APPLIED1
 

  var S2SR_1 = ee.ImageCollection('COPERNICUS/S2_SR');
  var s2Clouds_1 = ee.ImageCollection('COPERNICUS/S2_CLOUD_PROBABILITY');
  // Filter input collections by desired data range and region.

  var S2_criteria_APPLIED1 = ee.Filter.and(ee.Filter.bounds(box_filteredArea), 
  ee.Filter.date(START_DATE_APPLIED1, END_DATE_APPLIED1));

  
  var S2SR_APPLIED1 = S2SR_1.filter(S2_criteria_APPLIED1).map(S2_maskEdges);
  var s2Clouds_APPLIED1 = s2Clouds_1.filter(S2_criteria_APPLIED1);
  
  // Join S2 SR with cloud probability dataset to add cloud mask.
  var S2SRWithCloudMask_APPLIED1 = ee.Join.saveFirst('cloud_mask').apply({
    primary: S2SR_APPLIED1,
    secondary: s2Clouds_APPLIED1,
    condition:
        ee.Filter.equals({leftField: 'system:index', rightField: 'system:index'})
  });
  
  // Load the Sentinel-1 ImageCollection

  var s2CloudMasked_APPLIED1 =
      ee.ImageCollection(S2SRWithCloudMask_APPLIED1).map(S2_maskClouds_APPLIED).reduce(ee.Reducer.lastNonNull());

  // Overlay the points on the imagery to get APPLIED1.
  var S2_APPLIED1 = s2CloudMasked_APPLIED1.select(bands_S2).sampleRegions({
    collection: rice_points,
    properties: [label],
    scale: 10
  });
  
  
  // Classify the image with the same bands used for APPLIED1.
  var classified_S2_APPLIED1  = s2CloudMasked_APPLIED1.select(bands_S2).classify(RGS_trained_S2_ML);

 var first_period_str = first_period.replace(/\s/g, '');
  first_period_str = first_period_str.replace('.', '_');
  first_period_str = first_period_str.replace('-', '_');
  var name_file_fusion = 'RGS_S2_V3_'+ ml +'_ALL-' + first_period_str ;
  Export.image.toDrive({
    image: classified_S2_APPLIED1,
    folder : 'RGS_S2_V3_'+ml,
    crs:'EPSG:32748' ,
    description: name_file_fusion,
    scale: 30,
    maxPixels : 5e9,
    region: box_filteredArea
  });
  
}
var monthDicts = Object.keys(monthDict);

ricegrowthstages('13','SVM','20. 01 Nov - 16 Nov 2019');
ricegrowthstages('13','SVM','21. 17 Nov - 02 Dec 2019');
ricegrowthstages('13','SVM','22. 03 Dec - 18 Dec 2019');
ricegrowthstages('13','SVM','23. 19 Dec - 31 Dec 2019');
ricegrowthstages('13','SVM','24. 01 Jan - 16 Jan 2020');
ricegrowthstages('13','SVM','25. 17 Jan - 01 Feb 2020');
ricegrowthstages('13','SVM','26. 02 Feb - 17 Feb 2020');
ricegrowthstages('13','SVM','27. 18 Feb - 04 Mar 2020');
ricegrowthstages('13','SVM','28. 05 Mar - 20 Mar 2020');
ricegrowthstages('13','SVM','29. 21 Mar - 05 Apr 2020');
ricegrowthstages('13','SVM','30. 06 Apr - 21 Apr 2020');
ricegrowthstages('13','SVM','31. 22 Apr - 07 May 2020');
ricegrowthstages('13','SVM','32. 08 May - 23 May 2020');
ricegrowthstages('13','SVM','33. 24 May - 08 Jun 2020');
ricegrowthstages('13','SVM','34. 09 Jun - 24 Jun 2020');
ricegrowthstages('13','SVM','35. 25 Jun - 10 Jul 2020');
ricegrowthstages('13','SVM','36. 11 Jul - 26 Jul 2020');
ricegrowthstages('13','SVM','37. 27 Jul - 11 Aug 2020');
ricegrowthstages('13','SVM','38. 12 Aug - 27 Aug 2020');
ricegrowthstages('13','SVM','39. 28 Aug - 12 Sep 2020');
ricegrowthstages('13','SVM','40. 13 Sep - 28 Sep 2020');
ricegrowthstages('13','SVM','41. 29 Sep - 14 Oct 2020');
ricegrowthstages('13','SVM','42. 15 Oct - 30 Oct 2020');



