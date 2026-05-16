/**
 * 수도권 지하철역 좌표 (GPS 근처 역 검색용).
 * CC0-1.0 — https://gist.github.com/nemorize/ac5f39ff62b6bf82dc496d10c69b2b46
 * 재생성: node scripts/build-seoul-metro-stations.mjs <gist-json5-path>
 */
export type SeoulMetroStationRecord = {
  id: string;
  name: string;
  lines: string;
  latitude: number;
  longitude: number;
};

export const SEOUL_METRO_STATIONS: SeoulMetroStationRecord[] = [
  {
    "id": "stn-4-19",
    "name": "4.19민주묘지역",
    "lines": "우이신설선",
    "latitude": 37.6492,
    "longitude": 127.0134
  },
  {
    "id": "stn--416",
    "name": "가능역",
    "lines": "1호선",
    "latitude": 37.7484,
    "longitude": 127.0443
  },
  {
    "id": "stn--91",
    "name": "가락시장역",
    "lines": "3호선·8호선",
    "latitude": 37.49251,
    "longitude": 127.1183
  },
  {
    "id": "stn--141",
    "name": "가산디지털단지역",
    "lines": "1호선·7호선",
    "latitude": 37.4816,
    "longitude": 126.8826
  },
  {
    "id": "stn-",
    "name": "가양역",
    "lines": "9호선",
    "latitude": 37.561365,
    "longitude": 126.854298
  },
  {
    "id": "stn--156",
    "name": "가오리역",
    "lines": "우이신설선",
    "latitude": 37.6416,
    "longitude": 127.0168
  },
  {
    "id": "stn--366",
    "name": "가재울역",
    "lines": "인천2호선",
    "latitude": 37.4841,
    "longitude": 126.6839
  },
  {
    "id": "stn--362",
    "name": "가정역",
    "lines": "인천2호선",
    "latitude": 37.5248,
    "longitude": 126.6744
  },
  {
    "id": "stn--363",
    "name": "가정중앙시장역",
    "lines": "인천2호선",
    "latitude": 37.5175,
    "longitude": 126.6768
  },
  {
    "id": "stn--395",
    "name": "가천대역",
    "lines": "수인분당선",
    "latitude": 37.4487,
    "longitude": 127.1267
  },
  {
    "id": "stn--509",
    "name": "가평역",
    "lines": "경춘선",
    "latitude": 37.8145,
    "longitude": 127.5107
  },
  {
    "id": "stn--310",
    "name": "간석역",
    "lines": "1호선",
    "latitude": 37.4647,
    "longitude": 126.6934
  },
  {
    "id": "stn--336",
    "name": "간석오거리역",
    "lines": "인천1호선",
    "latitude": 37.4669,
    "longitude": 126.7079
  },
  {
    "id": "stn--438",
    "name": "갈매역",
    "lines": "경춘선",
    "latitude": 37.6342,
    "longitude": 127.1149
  },
  {
    "id": "stn--332",
    "name": "갈산역",
    "lines": "인천1호선",
    "latitude": 37.5171,
    "longitude": 126.7216
  },
  {
    "id": "stn--1",
    "name": "강남구청역",
    "lines": "7호선·수인분당선",
    "latitude": 37.5171,
    "longitude": 127.0413
  },
  {
    "id": "stn--560",
    "name": "강남대역",
    "lines": "에버라인",
    "latitude": 37.2702,
    "longitude": 127.126
  },
  {
    "id": "stn--288",
    "name": "강남역",
    "lines": "2호선",
    "latitude": 37.497,
    "longitude": 127.0276
  },
  {
    "id": "stn--207",
    "name": "강동구청역",
    "lines": "8호선",
    "latitude": 37.5305,
    "longitude": 127.1205
  },
  {
    "id": "stn--206",
    "name": "강동역",
    "lines": "5호선",
    "latitude": 37.5351,
    "longitude": 127.1328
  },
  {
    "id": "stn--536",
    "name": "강매역",
    "lines": "경의중앙선",
    "latitude": 37.6127,
    "longitude": 126.8455
  },
  {
    "id": "stn--2",
    "name": "강변역",
    "lines": "2호선",
    "latitude": 37.535095,
    "longitude": 127.094681
  },
  {
    "id": "stn--211",
    "name": "강일역",
    "lines": "5호선",
    "latitude": 37.5574,
    "longitude": 127.1756
  },
  {
    "id": "stn--604",
    "name": "강촌역",
    "lines": "경춘선",
    "latitude": 37.8058,
    "longitude": 127.6341
  },
  {
    "id": "stn--103",
    "name": "개롱역",
    "lines": "5호선",
    "latitude": 37.498,
    "longitude": 127.1351
  },
  {
    "id": "stn--3",
    "name": "개포동역",
    "lines": "수인분당선",
    "latitude": 37.4892,
    "longitude": 127.0665
  },
  {
    "id": "stn--4",
    "name": "개화산역",
    "lines": "5호선",
    "latitude": 37.5725,
    "longitude": 126.8068
  },
  {
    "id": "stn--5",
    "name": "개화역",
    "lines": "9호선",
    "latitude": 37.5783,
    "longitude": 126.797
  },
  {
    "id": "stn--104",
    "name": "거여역",
    "lines": "5호선",
    "latitude": 37.4934,
    "longitude": 127.1436
  },
  {
    "id": "stn--6",
    "name": "건대입구역",
    "lines": "2호선·7호선",
    "latitude": 37.540693,
    "longitude": 127.07023
  },
  {
    "id": "stn--494",
    "name": "걸포북변역",
    "lines": "김포골드라인",
    "latitude": 37.6317,
    "longitude": 126.7058
  },
  {
    "id": "stn--355",
    "name": "검단사거리역",
    "lines": "인천2호선",
    "latitude": 37.6018,
    "longitude": 126.6566
  },
  {
    "id": "stn--353",
    "name": "검단오류역",
    "lines": "인천2호선",
    "latitude": 37.5949,
    "longitude": 126.628
  },
  {
    "id": "stn--359",
    "name": "검바위역",
    "lines": "인천2호선",
    "latitude": 37.5612,
    "longitude": 126.6775
  },
  {
    "id": "stn--324",
    "name": "검암역",
    "lines": "인천2호선·공항철도",
    "latitude": 37.5692,
    "longitude": 126.6737
  },
  {
    "id": "stn--405",
    "name": "경기광주역",
    "lines": "경강선",
    "latitude": 37.399,
    "longitude": 127.2534
  },
  {
    "id": "stn--426",
    "name": "경기도북부청사역",
    "lines": "의정부선",
    "latitude": 37.7507,
    "longitude": 127.0716
  },
  {
    "id": "stn--462",
    "name": "경마공원역",
    "lines": "4호선",
    "latitude": 37.444,
    "longitude": 127.0078
  },
  {
    "id": "stn--61",
    "name": "경복궁역",
    "lines": "3호선",
    "latitude": 37.57576,
    "longitude": 126.9743
  },
  {
    "id": "stn--330",
    "name": "경인교대입구역",
    "lines": "인천1호선",
    "latitude": 37.5382,
    "longitude": 126.7226
  },
  {
    "id": "stn--420",
    "name": "경전철의정부역",
    "lines": "의정부선",
    "latitude": 37.7373,
    "longitude": 127.0433
  },
  {
    "id": "stn--106",
    "name": "경찰병원역",
    "lines": "3호선",
    "latitude": 37.4957,
    "longitude": 127.1242
  },
  {
    "id": "stn--329",
    "name": "계산역",
    "lines": "인천1호선",
    "latitude": 37.5433,
    "longitude": 126.7282
  },
  {
    "id": "stn--325",
    "name": "계양역",
    "lines": "공항철도·인천1호선",
    "latitude": 37.57127,
    "longitude": 126.7359
  },
  {
    "id": "stn--7",
    "name": "고덕역",
    "lines": "5호선",
    "latitude": 37.555004,
    "longitude": 127.154151
  },
  {
    "id": "stn--174",
    "name": "고려대역",
    "lines": "6호선",
    "latitude": 37.5902,
    "longitude": 127.0365
  },
  {
    "id": "stn--8",
    "name": "고속터미널역",
    "lines": "3호선·7호선·9호선",
    "latitude": 37.50481,
    "longitude": 127.004943
  },
  {
    "id": "stn--588",
    "name": "고잔역",
    "lines": "4호선·수인분당선",
    "latitude": 37.3168,
    "longitude": 126.8231
  },
  {
    "id": "stn--570",
    "name": "고진역",
    "lines": "에버라인",
    "latitude": 37.2447,
    "longitude": 127.2142
  },
  {
    "id": "stn--497",
    "name": "고촌역",
    "lines": "김포골드라인",
    "latitude": 37.6013,
    "longitude": 126.7702
  },
  {
    "id": "stn--533",
    "name": "곡산역",
    "lines": "경의중앙선·서해선",
    "latitude": 37.6457,
    "longitude": 126.8018
  },
  {
    "id": "stn--428",
    "name": "곤제역",
    "lines": "의정부선",
    "latitude": 37.7505,
    "longitude": 127.0839
  },
  {
    "id": "stn--407",
    "name": "곤지암역",
    "lines": "경강선",
    "latitude": 37.3505,
    "longitude": 127.3461
  },
  {
    "id": "stn--294",
    "name": "공덕역",
    "lines": "5호선·6호선",
    "latitude": 37.544,
    "longitude": 126.9515
  },
  {
    "id": "stn--133",
    "name": "공릉역",
    "lines": "7호선",
    "latitude": 37.6258,
    "longitude": 127.0729
  },
  {
    "id": "stn--9",
    "name": "공항시장역",
    "lines": "9호선",
    "latitude": 37.563515,
    "longitude": 126.81095
  },
  {
    "id": "stn--320",
    "name": "공항화물청사역",
    "lines": "공항철도",
    "latitude": 37.4591,
    "longitude": 126.4775
  },
  {
    "id": "stn--460",
    "name": "과천역",
    "lines": "4호선",
    "latitude": 37.4328,
    "longitude": 126.9965
  },
  {
    "id": "stn--191",
    "name": "관악산역",
    "lines": "신림선",
    "latitude": 37.4689,
    "longitude": 126.9452
  },
  {
    "id": "stn--447",
    "name": "관악역",
    "lines": "1호선",
    "latitude": 37.4196,
    "longitude": 126.9085
  },
  {
    "id": "stn--10",
    "name": "광나루역",
    "lines": "5호선",
    "latitude": 37.545303,
    "longitude": 127.10357
  },
  {
    "id": "stn--477",
    "name": "광명사거리역",
    "lines": "7호선",
    "latitude": 37.4792,
    "longitude": 126.8549
  },
  {
    "id": "stn--479",
    "name": "광명역",
    "lines": "1호선",
    "latitude": 37.4165,
    "longitude": 126.8848
  },
  {
    "id": "stn--127",
    "name": "광운대역",
    "lines": "1호선·경춘선",
    "latitude": 37.6235,
    "longitude": 127.0616
  },
  {
    "id": "stn--63",
    "name": "광화문역",
    "lines": "5호선",
    "latitude": 37.57092,
    "longitude": 126.9769
  },
  {
    "id": "stn--11",
    "name": "광흥창역",
    "lines": "6호선",
    "latitude": 37.547184,
    "longitude": 126.931966
  },
  {
    "id": "stn--12",
    "name": "교대역",
    "lines": "2호선·3호선",
    "latitude": 37.4939,
    "longitude": 127.0144
  },
  {
    "id": "stn--490",
    "name": "구래역",
    "lines": "김포골드라인",
    "latitude": 37.6454,
    "longitude": 126.6287
  },
  {
    "id": "stn--146",
    "name": "구로디지털단지역",
    "lines": "2호선",
    "latitude": 37.4852,
    "longitude": 126.9012
  },
  {
    "id": "stn--149",
    "name": "구로역",
    "lines": "1호선",
    "latitude": 37.503,
    "longitude": 126.881
  },
  {
    "id": "stn--13",
    "name": "구룡역",
    "lines": "수인분당선",
    "latitude": 37.486839,
    "longitude": 127.058856
  },
  {
    "id": "stn--437",
    "name": "구리역",
    "lines": "경의중앙선",
    "latitude": 37.6033,
    "longitude": 127.1433
  },
  {
    "id": "stn--14",
    "name": "구반포역",
    "lines": "9호선",
    "latitude": 37.501364,
    "longitude": 126.987331
  },
  {
    "id": "stn--15",
    "name": "구산역",
    "lines": "6호선",
    "latitude": 37.611377,
    "longitude": 126.917601
  },
  {
    "id": "stn--554",
    "name": "구성역",
    "lines": "수인분당선·GTX-A",
    "latitude": 37.2989,
    "longitude": 127.1057
  },
  {
    "id": "stn--16",
    "name": "구의역",
    "lines": "2호선",
    "latitude": 37.537077,
    "longitude": 127.085916
  },
  {
    "id": "stn--150",
    "name": "구일역",
    "lines": "1호선",
    "latitude": 37.4967,
    "longitude": 126.8704
  },
  {
    "id": "stn--17",
    "name": "구파발역",
    "lines": "3호선",
    "latitude": 37.636763,
    "longitude": 126.918821
  },
  {
    "id": "stn--71",
    "name": "구회의사당역",
    "lines": "9호선",
    "latitude": 37.52827,
    "longitude": 126.9173
  },
  {
    "id": "stn--512",
    "name": "국수역",
    "lines": "경의중앙선",
    "latitude": 37.5162,
    "longitude": 127.3995
  },
  {
    "id": "stn--351",
    "name": "국제업무지구역",
    "lines": "인천1호선",
    "latitude": 37.4004,
    "longitude": 126.6301
  },
  {
    "id": "stn--18",
    "name": "군자역",
    "lines": "5호선·7호선",
    "latitude": 37.557121,
    "longitude": 127.079542
  },
  {
    "id": "stn--454",
    "name": "군포역",
    "lines": "1호선",
    "latitude": 37.354,
    "longitude": 126.9485
  },
  {
    "id": "stn--602",
    "name": "굴봉산역",
    "lines": "경춘선",
    "latitude": 37.8321,
    "longitude": 127.5577
  },
  {
    "id": "stn--316",
    "name": "굴포천역",
    "lines": "7호선",
    "latitude": 37.507,
    "longitude": 126.7314
  },
  {
    "id": "stn--209",
    "name": "굽은다리역",
    "lines": "5호선",
    "latitude": 37.5455,
    "longitude": 127.1426
  },
  {
    "id": "stn--326",
    "name": "귤현역",
    "lines": "인천1호선",
    "latitude": 37.5666,
    "longitude": 126.7425
  },
  {
    "id": "stn--442",
    "name": "금곡역",
    "lines": "경춘선",
    "latitude": 37.6373,
    "longitude": 127.2076
  },
  {
    "id": "stn--540",
    "name": "금름역",
    "lines": "경의중앙선",
    "latitude": 37.7513,
    "longitude": 126.7655
  },
  {
    "id": "stn--453",
    "name": "금정역",
    "lines": "1호선·4호선",
    "latitude": 37.372,
    "longitude": 126.9436
  },
  {
    "id": "stn--143",
    "name": "금천구청역",
    "lines": "1호선",
    "latitude": 37.4556,
    "longitude": 126.894
  },
  {
    "id": "stn--541",
    "name": "금촌역",
    "lines": "경의중앙선",
    "latitude": 37.7661,
    "longitude": 126.7745
  },
  {
    "id": "stn--253",
    "name": "금호역",
    "lines": "3호선",
    "latitude": 37.548,
    "longitude": 127.0158
  },
  {
    "id": "stn--558",
    "name": "기흥역",
    "lines": "수인분당선·에버라인",
    "latitude": 37.2757,
    "longitude": 127.116
  },
  {
    "id": "stn--19",
    "name": "길동역",
    "lines": "5호선",
    "latitude": 37.537801,
    "longitude": 127.140004
  },
  {
    "id": "stn--180",
    "name": "길음역",
    "lines": "4호선",
    "latitude": 37.6029,
    "longitude": 127.0253
  },
  {
    "id": "stn--568",
    "name": "김량장역",
    "lines": "에버라인",
    "latitude": 37.2372,
    "longitude": 127.1987
  },
  {
    "id": "stn--605",
    "name": "김유정역",
    "lines": "경춘선",
    "latitude": 37.8184,
    "longitude": 127.7142
  },
  {
    "id": "stn--20",
    "name": "김포공항역",
    "lines": "5호선·9호선·공항철도·김포골드라인·서해선",
    "latitude": 37.562434,
    "longitude": 126.801058
  },
  {
    "id": "stn--21",
    "name": "까치산역",
    "lines": "2호선·5호선",
    "latitude": 37.531768,
    "longitude": 126.846683
  },
  {
    "id": "stn--470",
    "name": "까치울역",
    "lines": "7호선",
    "latitude": 37.5062,
    "longitude": 126.8114
  },
  {
    "id": "stn--22",
    "name": "낙성대역",
    "lines": "2호선",
    "latitude": 37.4771,
    "longitude": 126.9635
  },
  {
    "id": "stn--144",
    "name": "남구로역",
    "lines": "7호선",
    "latitude": 37.4861,
    "longitude": 126.8873
  },
  {
    "id": "stn--373",
    "name": "남동구청역",
    "lines": "인천2호선",
    "latitude": 37.4482,
    "longitude": 126.7366
  },
  {
    "id": "stn--381",
    "name": "남동인더스파크역",
    "lines": "수인분당선",
    "latitude": 37.4078,
    "longitude": 126.6953
  },
  {
    "id": "stn--23",
    "name": "남부터미널역",
    "lines": "3호선",
    "latitude": 37.485013,
    "longitude": 127.016189
  },
  {
    "id": "stn--24",
    "name": "남성역",
    "lines": "7호선",
    "latitude": 37.484596,
    "longitude": 126.971251
  },
  {
    "id": "stn--225",
    "name": "남영역",
    "lines": "1호선",
    "latitude": 37.5417,
    "longitude": 126.9716
  },
  {
    "id": "stn--401",
    "name": "남위례역",
    "lines": "8호선",
    "latitude": 37.4629,
    "longitude": 127.1391
  },
  {
    "id": "stn--606",
    "name": "남춘천역",
    "lines": "경춘선",
    "latitude": 37.8641,
    "longitude": 127.7238
  },
  {
    "id": "stn--399",
    "name": "남한산성입구역",
    "lines": "8호선",
    "latitude": 37.4516,
    "longitude": 127.1597
  },
  {
    "id": "stn--25",
    "name": "내방역",
    "lines": "7호선",
    "latitude": 37.487462,
    "longitude": 126.993552
  },
  {
    "id": "stn--26",
    "name": "노들역",
    "lines": "9호선",
    "latitude": 37.512887,
    "longitude": 126.952739
  },
  {
    "id": "stn--303",
    "name": "노량진역",
    "lines": "1호선·9호선",
    "latitude": 37.5142,
    "longitude": 126.9425
  },
  {
    "id": "stn--136",
    "name": "노원역",
    "lines": "4호선·7호선",
    "latitude": 37.6543,
    "longitude": 127.0606
  },
  {
    "id": "stn--27",
    "name": "녹번역",
    "lines": "3호선",
    "latitude": 37.600927,
    "longitude": 126.935756
  },
  {
    "id": "stn--222",
    "name": "녹사평역",
    "lines": "6호선",
    "latitude": 37.534,
    "longitude": 126.9862
  },
  {
    "id": "stn--417",
    "name": "녹양역",
    "lines": "1호선",
    "latitude": 37.7594,
    "longitude": 127.0423
  },
  {
    "id": "stn--130",
    "name": "녹천역",
    "lines": "1호선",
    "latitude": 37.6446,
    "longitude": 127.0514
  },
  {
    "id": "stn--267",
    "name": "논현역",
    "lines": "7호선",
    "latitude": 37.511,
    "longitude": 127.0219
  },
  {
    "id": "stn--282",
    "name": "논현역",
    "lines": "7호선",
    "latitude": 37.5111,
    "longitude": 127.021
  },
  {
    "id": "stn--534",
    "name": "능곡역",
    "lines": "경의중앙선·서해선",
    "latitude": 37.6187,
    "longitude": 126.8208
  },
  {
    "id": "stn--398",
    "name": "단대오거리역",
    "lines": "8호선",
    "latitude": 37.4451,
    "longitude": 127.1569
  },
  {
    "id": "stn--585",
    "name": "달미역",
    "lines": "서해선",
    "latitude": 37.3489,
    "longitude": 126.8094
  },
  {
    "id": "stn--481",
    "name": "달월역",
    "lines": "수인분당선",
    "latitude": 37.38,
    "longitude": 126.7455
  },
  {
    "id": "stn--28",
    "name": "답심리역",
    "lines": "5호선",
    "latitude": 37.566747,
    "longitude": 127.052704
  },
  {
    "id": "stn--247",
    "name": "답십리역",
    "lines": "5호선",
    "latitude": 37.567,
    "longitude": 127.0524
  },
  {
    "id": "stn--140",
    "name": "당고개역",
    "lines": "4호선",
    "latitude": 37.6703,
    "longitude": 127.0791
  },
  {
    "id": "stn--187",
    "name": "당곡역",
    "lines": "신림선",
    "latitude": 37.4843,
    "longitude": 126.9297
  },
  {
    "id": "stn--70",
    "name": "당산역",
    "lines": "2호선·9호선",
    "latitude": 37.53452,
    "longitude": 126.9025
  },
  {
    "id": "stn--455",
    "name": "당정역",
    "lines": "1호선",
    "latitude": 37.3434,
    "longitude": 126.9484
  },
  {
    "id": "stn--524",
    "name": "대곡역",
    "lines": "3호선·서해선·경의중앙선",
    "latitude": 37.6317,
    "longitude": 126.8111
  },
  {
    "id": "stn--461",
    "name": "대공원역",
    "lines": "4호선",
    "latitude": 37.4357,
    "longitude": 127.0066
  },
  {
    "id": "stn--80",
    "name": "대림역",
    "lines": "7호선",
    "latitude": 37.49297,
    "longitude": 126.8958
  },
  {
    "id": "stn--145",
    "name": "대림역",
    "lines": "2호선",
    "latitude": 37.4926,
    "longitude": 126.8959
  },
  {
    "id": "stn--37",
    "name": "대모산입구역",
    "lines": "수인분당선",
    "latitude": 37.491814,
    "longitude": 127.072503
  },
  {
    "id": "stn--74",
    "name": "대방역",
    "lines": "1호선",
    "latitude": 37.51334,
    "longitude": 126.9264
  },
  {
    "id": "stn--506",
    "name": "대성리역",
    "lines": "경춘선",
    "latitude": 37.6838,
    "longitude": 127.3794
  },
  {
    "id": "stn--456",
    "name": "대야미역",
    "lines": "4호선",
    "latitude": 37.328,
    "longitude": 126.9169
  },
  {
    "id": "stn--38",
    "name": "대청역",
    "lines": "3호선",
    "latitude": 37.493514,
    "longitude": 127.079532
  },
  {
    "id": "stn--39",
    "name": "대치역",
    "lines": "3호선",
    "latitude": 37.494612,
    "longitude": 127.063642
  },
  {
    "id": "stn--519",
    "name": "대화역",
    "lines": "3호선",
    "latitude": 37.6761,
    "longitude": 126.7474
  },
  {
    "id": "stn--40",
    "name": "대흥역",
    "lines": "6호선",
    "latitude": 37.547456,
    "longitude": 126.94205
  },
  {
    "id": "stn--548",
    "name": "덕계역",
    "lines": "1호선",
    "latitude": 37.8187,
    "longitude": 127.0568
  },
  {
    "id": "stn--549",
    "name": "덕정역",
    "lines": "1호선",
    "latitude": 37.8432,
    "longitude": 127.0615
  },
  {
    "id": "stn--41",
    "name": "도곡역",
    "lines": "3호선·수인분당선",
    "latitude": 37.490858,
    "longitude": 127.055381
  },
  {
    "id": "stn--432",
    "name": "도농역",
    "lines": "경의중앙선",
    "latitude": 37.6088,
    "longitude": 127.1612
  },
  {
    "id": "stn--42",
    "name": "도당역",
    "lines": "우이신설선",
    "latitude": 37.662,
    "longitude": 127.034
  },
  {
    "id": "stn--148",
    "name": "도림천역",
    "lines": "2호선",
    "latitude": 37.514,
    "longitude": 126.8826
  },
  {
    "id": "stn--43",
    "name": "도봉산역",
    "lines": "1호선·7호선",
    "latitude": 37.689313,
    "longitude": 127.046222
  },
  {
    "id": "stn--296",
    "name": "도봉역",
    "lines": "1호선",
    "latitude": 37.6792,
    "longitude": 127.0456
  },
  {
    "id": "stn--434",
    "name": "도심역",
    "lines": "경의중앙선",
    "latitude": 37.5797,
    "longitude": 127.2228
  },
  {
    "id": "stn--306",
    "name": "도원역",
    "lines": "1호선",
    "latitude": 37.46826,
    "longitude": 126.642
  },
  {
    "id": "stn--308",
    "name": "도화역",
    "lines": "1호선",
    "latitude": 37.4661,
    "longitude": 126.6685
  },
  {
    "id": "stn--60",
    "name": "독립문역",
    "lines": "3호선",
    "latitude": 37.5744,
    "longitude": 126.9579
  },
  {
    "id": "stn--44",
    "name": "독바위역",
    "lines": "6호선",
    "latitude": 37.618456,
    "longitude": 126.933071
  },
  {
    "id": "stn--142",
    "name": "독산역",
    "lines": "1호선",
    "latitude": 37.4661,
    "longitude": 126.8894
  },
  {
    "id": "stn--358",
    "name": "독정역",
    "lines": "인천2호선",
    "latitude": 37.5849,
    "longitude": 126.6761
  },
  {
    "id": "stn--176",
    "name": "돌곶이역",
    "lines": "6호선",
    "latitude": 37.6108,
    "longitude": 127.0573
  },
  {
    "id": "stn--65",
    "name": "동대문역",
    "lines": "1호선·4호선",
    "latitude": 37.57142,
    "longitude": 127.0094
  },
  {
    "id": "stn--110",
    "name": "동대문역사문화공원역",
    "lines": "2호선·4호선·5호선",
    "latitude": 37.5657,
    "longitude": 127.009
  },
  {
    "id": "stn--116",
    "name": "동대입구역",
    "lines": "3호선",
    "latitude": 37.559,
    "longitude": 127.0052
  },
  {
    "id": "stn--501",
    "name": "동두천역",
    "lines": "1호선",
    "latitude": 37.9275,
    "longitude": 127.0548
  },
  {
    "id": "stn--499",
    "name": "동두천중앙역",
    "lines": "1호선",
    "latitude": 37.9018,
    "longitude": 127.0565
  },
  {
    "id": "stn--345",
    "name": "동막역",
    "lines": "인천1호선",
    "latitude": 37.3982,
    "longitude": 126.6736
  },
  {
    "id": "stn--66",
    "name": "동묘앞역",
    "lines": "1호선·6호선",
    "latitude": 37.57263,
    "longitude": 127.0153
  },
  {
    "id": "stn--563",
    "name": "동백역",
    "lines": "에버라인",
    "latitude": 37.2691,
    "longitude": 127.1529
  },
  {
    "id": "stn--334",
    "name": "동수역",
    "lines": "인천1호선",
    "latitude": 37.4854,
    "longitude": 126.7184
  },
  {
    "id": "stn--311",
    "name": "동암역",
    "lines": "1호선",
    "latitude": 37.4708,
    "longitude": 126.7029
  },
  {
    "id": "stn--424",
    "name": "동오역",
    "lines": "의정부선",
    "latitude": 37.7452,
    "longitude": 127.0571
  },
  {
    "id": "stn--305",
    "name": "동인천역",
    "lines": "1호선",
    "latitude": 37.47512,
    "longitude": 126.6328
  },
  {
    "id": "stn--45",
    "name": "동작역",
    "lines": "4호선·9호선",
    "latitude": 37.50247,
    "longitude": 126.9798
  },
  {
    "id": "stn--550",
    "name": "동천역",
    "lines": "신분당선",
    "latitude": 37.3378,
    "longitude": 127.1028
  },
  {
    "id": "stn--344",
    "name": "동춘역",
    "lines": "인천1호선",
    "latitude": 37.4048,
    "longitude": 126.6808
  },
  {
    "id": "stn--580",
    "name": "동탄역",
    "lines": "GTX-A",
    "latitude": 37.2001,
    "longitude": 127.0954
  },
  {
    "id": "stn--572",
    "name": "둔전역",
    "lines": "에버라인",
    "latitude": 37.2672,
    "longitude": 127.2137
  },
  {
    "id": "stn--208",
    "name": "둔촌동역",
    "lines": "5호선",
    "latitude": 37.5277,
    "longitude": 127.1362
  },
  {
    "id": "stn--100",
    "name": "둔촌오륜역",
    "lines": "9호선",
    "latitude": 37.5193,
    "longitude": 127.1386
  },
  {
    "id": "stn--46",
    "name": "등촌역",
    "lines": "9호선",
    "latitude": 37.5512,
    "longitude": 126.8645
  },
  {
    "id": "stn--241",
    "name": "등촌역",
    "lines": "9호선",
    "latitude": 37.5506,
    "longitude": 126.8643
  },
  {
    "id": "stn--274",
    "name": "디지털미디어시티역",
    "lines": "경의중앙선",
    "latitude": 37.5776,
    "longitude": 126.9002
  },
  {
    "id": "stn--293",
    "name": "디지털미디어시티역",
    "lines": "6호선",
    "latitude": 37.5766,
    "longitude": 126.9003
  },
  {
    "id": "stn--249",
    "name": "뚝섬역",
    "lines": "2호선",
    "latitude": 37.5472,
    "longitude": 127.0476
  },
  {
    "id": "stn--47",
    "name": "마곡나루역",
    "lines": "9호선·공항철도",
    "latitude": 37.5667,
    "longitude": 126.8273
  },
  {
    "id": "stn--48",
    "name": "마곡역",
    "lines": "5호선",
    "latitude": 37.56025,
    "longitude": 126.8261
  },
  {
    "id": "stn--120",
    "name": "마곡역",
    "lines": "5호선",
    "latitude": 37.5599,
    "longitude": 126.825
  },
  {
    "id": "stn--522",
    "name": "마두역",
    "lines": "3호선",
    "latitude": 37.6521,
    "longitude": 126.7777
  },
  {
    "id": "stn--137",
    "name": "마들역",
    "lines": "7호선",
    "latitude": 37.6653,
    "longitude": 127.0576
  },
  {
    "id": "stn--491",
    "name": "마산역",
    "lines": "김포골드라인",
    "latitude": 37.6408,
    "longitude": 126.6445
  },
  {
    "id": "stn--445",
    "name": "마석역",
    "lines": "경춘선",
    "latitude": 37.6523,
    "longitude": 127.3116
  },
  {
    "id": "stn--246",
    "name": "마장역",
    "lines": "5호선",
    "latitude": 37.566,
    "longitude": 127.0436
  },
  {
    "id": "stn--356",
    "name": "마전역",
    "lines": "인천2호선",
    "latitude": 37.5977,
    "longitude": 126.6671
  },
  {
    "id": "stn--105",
    "name": "마천역",
    "lines": "5호선",
    "latitude": 37.49453,
    "longitude": 127.1526
  },
  {
    "id": "stn--119",
    "name": "마포구청역",
    "lines": "6호선",
    "latitude": 37.5634,
    "longitude": 126.9035
  },
  {
    "id": "stn--372",
    "name": "만수역",
    "lines": "인천2호선",
    "latitude": 37.4549,
    "longitude": 126.7318
  },
  {
    "id": "stn--56",
    "name": "망우역",
    "lines": "경의중앙·경춘선",
    "latitude": 37.5997,
    "longitude": 127.0925
  },
  {
    "id": "stn--121",
    "name": "망원역",
    "lines": "6호선",
    "latitude": 37.5561,
    "longitude": 126.9101
  },
  {
    "id": "stn--413",
    "name": "망월사역",
    "lines": "1호선",
    "latitude": 37.7105,
    "longitude": 127.0474
  },
  {
    "id": "stn--122",
    "name": "매봉역",
    "lines": "3호선",
    "latitude": 37.4871,
    "longitude": 127.0469
  },
  {
    "id": "stn--54",
    "name": "먹골역",
    "lines": "7호선",
    "latitude": 37.61052,
    "longitude": 127.0778
  },
  {
    "id": "stn--51",
    "name": "면목역",
    "lines": "7호선",
    "latitude": 37.58848,
    "longitude": 127.0877
  },
  {
    "id": "stn--113",
    "name": "명동역",
    "lines": "4호선",
    "latitude": 37.56099,
    "longitude": 126.9863
  },
  {
    "id": "stn--123",
    "name": "명일역",
    "lines": "5호선",
    "latitude": 37.5513,
    "longitude": 127.144
  },
  {
    "id": "stn--567",
    "name": "명지대역",
    "lines": "에버라인",
    "latitude": 37.2381,
    "longitude": 127.1902
  },
  {
    "id": "stn--449",
    "name": "명학역",
    "lines": "1호선",
    "latitude": 37.3853,
    "longitude": 126.9354
  },
  {
    "id": "stn--393",
    "name": "모란역",
    "lines": "8호선·수인분당선",
    "latitude": 37.43267,
    "longitude": 127.1295
  },
  {
    "id": "stn--371",
    "name": "모래내시장역",
    "lines": "인천2호선",
    "latitude": 37.4558,
    "longitude": 126.7196
  },
  {
    "id": "stn--124",
    "name": "목동역",
    "lines": "5호선",
    "latitude": 37.5261,
    "longitude": 126.8645
  },
  {
    "id": "stn--88",
    "name": "몽촌토성역",
    "lines": "8호선",
    "latitude": 37.51709,
    "longitude": 127.113
  },
  {
    "id": "stn--125",
    "name": "무악재역",
    "lines": "3호선",
    "latitude": 37.5825,
    "longitude": 126.9503
  },
  {
    "id": "stn--79",
    "name": "문래역",
    "lines": "2호선",
    "latitude": 37.51793,
    "longitude": 126.8948
  },
  {
    "id": "stn--544",
    "name": "문산역",
    "lines": "경의중앙선",
    "latitude": 37.8546,
    "longitude": 126.7877
  },
  {
    "id": "stn--92",
    "name": "문정역",
    "lines": "8호선",
    "latitude": 37.4859,
    "longitude": 127.1225
  },
  {
    "id": "stn--340",
    "name": "문학경기장역",
    "lines": "인천1호선",
    "latitude": 37.4349,
    "longitude": 126.6978
  },
  {
    "id": "stn--387",
    "name": "미금역",
    "lines": "신분당선·수인분당선",
    "latitude": 37.3508,
    "longitude": 127.1089
  },
  {
    "id": "stn--408",
    "name": "미사역",
    "lines": "5호선",
    "latitude": 37.5631,
    "longitude": 127.1929
  },
  {
    "id": "stn--152",
    "name": "미아사거리역",
    "lines": "4호선",
    "latitude": 37.6127,
    "longitude": 127.0302
  },
  {
    "id": "stn--151",
    "name": "미아역",
    "lines": "4호선",
    "latitude": 37.6272,
    "longitude": 127.0265
  },
  {
    "id": "stn--327",
    "name": "박촌역",
    "lines": "인천1호선",
    "latitude": 37.5535,
    "longitude": 126.745
  },
  {
    "id": "stn--592",
    "name": "반월역",
    "lines": "4호선",
    "latitude": 37.3124,
    "longitude": 126.9038
  },
  {
    "id": "stn--126",
    "name": "반포역",
    "lines": "7호선",
    "latitude": 37.5082,
    "longitude": 127.0118
  },
  {
    "id": "stn--418",
    "name": "발곡역",
    "lines": "의정부선",
    "latitude": 37.727,
    "longitude": 127.0529
  },
  {
    "id": "stn--161",
    "name": "발산역",
    "lines": "5호선",
    "latitude": 37.5586,
    "longitude": 126.8383
  },
  {
    "id": "stn--162",
    "name": "방배역",
    "lines": "2호선",
    "latitude": 37.4815,
    "longitude": 126.9977
  },
  {
    "id": "stn--101",
    "name": "방이역",
    "lines": "5호선",
    "latitude": 37.50818,
    "longitude": 127.1268
  },
  {
    "id": "stn--297",
    "name": "방학역",
    "lines": "1호선",
    "latitude": 37.6678,
    "longitude": 127.044
  },
  {
    "id": "stn--163",
    "name": "방화역",
    "lines": "5호선",
    "latitude": 37.5776,
    "longitude": 126.8128
  },
  {
    "id": "stn--532",
    "name": "백마역",
    "lines": "경의중앙선·서해선",
    "latitude": 37.6584,
    "longitude": 126.7944
  },
  {
    "id": "stn--523",
    "name": "백석역",
    "lines": "3호선",
    "latitude": 37.643,
    "longitude": 126.7881
  },
  {
    "id": "stn--603",
    "name": "백양리역",
    "lines": "경춘선",
    "latitude": 37.8309,
    "longitude": 127.5891
  },
  {
    "id": "stn--117",
    "name": "버티고개역",
    "lines": "6호선",
    "latitude": 37.5481,
    "longitude": 127.0072
  },
  {
    "id": "stn--450",
    "name": "범계역",
    "lines": "4호선",
    "latitude": 37.3898,
    "longitude": 126.9508
  },
  {
    "id": "stn--419",
    "name": "범골역",
    "lines": "의정부선",
    "latitude": 37.7288,
    "longitude": 127.0436
  },
  {
    "id": "stn--312",
    "name": "벡운역",
    "lines": "1호선",
    "latitude": 37.4832,
    "longitude": 126.707
  },
  {
    "id": "stn--439",
    "name": "별내역",
    "lines": "경춘선",
    "latitude": 37.6423,
    "longitude": 127.1275
  },
  {
    "id": "stn--579",
    "name": "병점역",
    "lines": "1호선",
    "latitude": 37.2068,
    "longitude": 127.0332
  },
  {
    "id": "stn--82",
    "name": "보라매역",
    "lines": "7호선",
    "latitude": 37.4997,
    "longitude": 126.9208
  },
  {
    "id": "stn--164",
    "name": "보라매역",
    "lines": "7호선·신림선",
    "latitude": 37.4999,
    "longitude": 126.9204
  },
  {
    "id": "stn--172",
    "name": "보문역",
    "lines": "6호선·우이신설선",
    "latitude": 37.585,
    "longitude": 127.0192
  },
  {
    "id": "stn--500",
    "name": "보산역",
    "lines": "1호선",
    "latitude": 37.9143,
    "longitude": 127.0571
  },
  {
    "id": "stn--556",
    "name": "보정역",
    "lines": "수인분당선",
    "latitude": 37.3128,
    "longitude": 127.1082
  },
  {
    "id": "stn--571",
    "name": "보평역",
    "lines": "에버라인",
    "latitude": 37.2591,
    "longitude": 127.2185
  },
  {
    "id": "stn--94",
    "name": "복정역",
    "lines": "8호선·수인분당선",
    "latitude": 37.47105,
    "longitude": 127.1265
  },
  {
    "id": "stn--287",
    "name": "봉은사역",
    "lines": "9호선",
    "latitude": 37.5142,
    "longitude": 127.0603
  },
  {
    "id": "stn--165",
    "name": "봉천역",
    "lines": "2호선",
    "latitude": 37.4825,
    "longitude": 126.9416
  },
  {
    "id": "stn--192",
    "name": "봉천역",
    "lines": "2호선",
    "latitude": 37.4825,
    "longitude": 126.9415
  },
  {
    "id": "stn--58",
    "name": "봉화산역",
    "lines": "6호선",
    "latitude": 37.6174,
    "longitude": 127.0913
  },
  {
    "id": "stn--314",
    "name": "부개역",
    "lines": "1호선",
    "latitude": 37.4885,
    "longitude": 126.7407
  },
  {
    "id": "stn--576",
    "name": "부발역",
    "lines": "경강선",
    "latitude": 37.2604,
    "longitude": 127.4903
  },
  {
    "id": "stn--466",
    "name": "부천시청역",
    "lines": "7호선",
    "latitude": 37.5047,
    "longitude": 126.7636
  },
  {
    "id": "stn--469",
    "name": "부천종합운동장역",
    "lines": "7호선·서해선",
    "latitude": 37.5055,
    "longitude": 126.7975
  },
  {
    "id": "stn--317",
    "name": "부평구청역",
    "lines": "7호선·인천1호선",
    "latitude": 37.5074,
    "longitude": 126.7213
  },
  {
    "id": "stn--335",
    "name": "부평삼거리역",
    "lines": "인천1호선",
    "latitude": 37.4783,
    "longitude": 126.7105
  },
  {
    "id": "stn--333",
    "name": "부평시장역",
    "lines": "인천1호선",
    "latitude": 37.4986,
    "longitude": 126.7222
  },
  {
    "id": "stn--313",
    "name": "부평역",
    "lines": "1호선·인천1호선",
    "latitude": 37.49065,
    "longitude": 126.7244
  },
  {
    "id": "stn--181",
    "name": "북한산보국문역",
    "lines": "우이신설선",
    "latitude": 37.612,
    "longitude": 127.0088
  },
  {
    "id": "stn--155",
    "name": "북한산우이역",
    "lines": "우이신설선",
    "latitude": 37.6637,
    "longitude": 127.0126
  },
  {
    "id": "stn--166",
    "name": "불광역",
    "lines": "3호선·6호선",
    "latitude": 37.6105,
    "longitude": 126.929
  },
  {
    "id": "stn--441",
    "name": "사릉역",
    "lines": "경춘선",
    "latitude": 37.6511,
    "longitude": 127.1769
  },
  {
    "id": "stn--593",
    "name": "사리역",
    "lines": "수인분당선",
    "latitude": 37.2909,
    "longitude": 126.8571
  },
  {
    "id": "stn--495",
    "name": "사우역",
    "lines": "김포골드라인",
    "latitude": 37.6203,
    "longitude": 126.7197
  },
  {
    "id": "stn--167",
    "name": "사평역",
    "lines": "9호선",
    "latitude": 37.5044,
    "longitude": 127.0151
  },
  {
    "id": "stn--318",
    "name": "산곡역",
    "lines": "7호선",
    "latitude": 37.5086,
    "longitude": 126.703
  },
  {
    "id": "stn--458",
    "name": "산본역",
    "lines": "4호선",
    "latitude": 37.358,
    "longitude": 126.933
  },
  {
    "id": "stn--400",
    "name": "산성역",
    "lines": "8호선",
    "latitude": 37.4569,
    "longitude": 127.1501
  },
  {
    "id": "stn--565",
    "name": "삼가역",
    "lines": "에버라인",
    "latitude": 37.2421,
    "longitude": 127.1681
  },
  {
    "id": "stn--168",
    "name": "삼각지역",
    "lines": "4호선·6호선",
    "latitude": 37.5352,
    "longitude": 126.9737
  },
  {
    "id": "stn--404",
    "name": "삼동역",
    "lines": "경강선",
    "latitude": 37.4087,
    "longitude": 127.2035
  },
  {
    "id": "stn--315",
    "name": "삼산체육관역",
    "lines": "7호선",
    "latitude": 37.5065,
    "longitude": 126.742
  },
  {
    "id": "stn--290",
    "name": "삼성역",
    "lines": "2호선",
    "latitude": 37.5088,
    "longitude": 127.0632
  },
  {
    "id": "stn--286",
    "name": "삼성중앙역",
    "lines": "9호선",
    "latitude": 37.5129,
    "longitude": 127.0527
  },
  {
    "id": "stn--528",
    "name": "삼송역",
    "lines": "3호선",
    "latitude": 37.6532,
    "longitude": 126.8955
  },
  {
    "id": "stn--159",
    "name": "삼양사거리역",
    "lines": "우이신설선",
    "latitude": 37.6213,
    "longitude": 127.0205
  },
  {
    "id": "stn--158",
    "name": "삼양역",
    "lines": "우이신설선",
    "latitude": 37.6269,
    "longitude": 127.0182
  },
  {
    "id": "stn--95",
    "name": "삼전역",
    "lines": "9호선",
    "latitude": 37.5045,
    "longitude": 127.0874
  },
  {
    "id": "stn--559",
    "name": "상갈역",
    "lines": "수인분당선",
    "latitude": 37.2618,
    "longitude": 127.1087
  },
  {
    "id": "stn--139",
    "name": "상계역",
    "lines": "4호선",
    "latitude": 37.6607,
    "longitude": 127.0734
  },
  {
    "id": "stn--169",
    "name": "상도역",
    "lines": "7호선",
    "latitude": 37.5025,
    "longitude": 126.9483
  },
  {
    "id": "stn--465",
    "name": "상동역",
    "lines": "7호선",
    "latitude": 37.5058,
    "longitude": 126.7532
  },
  {
    "id": "stn--591",
    "name": "상록수역",
    "lines": "4호선",
    "latitude": 37.3029,
    "longitude": 126.8666
  },
  {
    "id": "stn--52",
    "name": "상봉역",
    "lines": "7호선·경의중앙·경춘선",
    "latitude": 37.59607,
    "longitude": 127.0862
  },
  {
    "id": "stn--170",
    "name": "상수역",
    "lines": "6호선",
    "latitude": 37.5477,
    "longitude": 126.9223
  },
  {
    "id": "stn--251",
    "name": "상왕십리역",
    "lines": "2호선",
    "latitude": 37.5644,
    "longitude": 127.0291
  },
  {
    "id": "stn--171",
    "name": "상월곡역",
    "lines": "6호선",
    "latitude": 37.6065,
    "longitude": 127.0489
  },
  {
    "id": "stn--210",
    "name": "상일동역",
    "lines": "5호선",
    "latitude": 37.556,
    "longitude": 127.1655
  },
  {
    "id": "stn--508",
    "name": "상천역",
    "lines": "경춘선",
    "latitude": 37.7704,
    "longitude": 127.4541
  },
  {
    "id": "stn--553",
    "name": "상현역",
    "lines": "신분당선",
    "latitude": 37.2979,
    "longitude": 127.0694
  },
  {
    "id": "stn--425",
    "name": "새말역",
    "lines": "의정부선",
    "latitude": 37.7489,
    "longitude": 127.0638
  },
  {
    "id": "stn--183",
    "name": "새절역",
    "lines": "6호선",
    "latitude": 37.5917,
    "longitude": 126.9135
  },
  {
    "id": "stn--275",
    "name": "새절역",
    "lines": "6호선",
    "latitude": 37.5918,
    "longitude": 126.9136
  },
  {
    "id": "stn--184",
    "name": "샘터공원역",
    "lines": "9호선",
    "latitude": 37.563,
    "longitude": 127.1628
  },
  {
    "id": "stn--73",
    "name": "샛강역",
    "lines": "9호선·신림역",
    "latitude": 37.51773,
    "longitude": 126.9291
  },
  {
    "id": "stn--361",
    "name": "서구청역",
    "lines": "인천2호선",
    "latitude": 37.5441,
    "longitude": 126.677
  },
  {
    "id": "stn--185",
    "name": "서대문역",
    "lines": "5호선",
    "latitude": 37.5658,
    "longitude": 126.9666
  },
  {
    "id": "stn--364",
    "name": "서부여성회관역",
    "lines": "인천2호선",
    "latitude": 37.5003,
    "longitude": 126.6759
  },
  {
    "id": "stn--218",
    "name": "서빙고역",
    "lines": "경의중앙선",
    "latitude": 37.5195,
    "longitude": 126.9884
  },
  {
    "id": "stn--190",
    "name": "서울대벤처타운역",
    "lines": "신림선",
    "latitude": 37.4721,
    "longitude": 126.9339
  },
  {
    "id": "stn--186",
    "name": "서울대입구역",
    "lines": "2호선",
    "latitude": 37.4811,
    "longitude": 126.9529
  },
  {
    "id": "stn--252",
    "name": "서울숲역",
    "lines": "수인분당선",
    "latitude": 37.5435,
    "longitude": 127.0447
  },
  {
    "id": "stn--107",
    "name": "서울역",
    "lines": "1호선",
    "latitude": 37.55465,
    "longitude": 126.9726
  },
  {
    "id": "stn--216",
    "name": "서울역",
    "lines": "4호선·공항철도",
    "latitude": 37.5546,
    "longitude": 126.9707
  },
  {
    "id": "stn--83",
    "name": "서울지방병무청역",
    "lines": "신림선",
    "latitude": 37.5058,
    "longitude": 126.9226
  },
  {
    "id": "stn--189",
    "name": "서원역",
    "lines": "신림선",
    "latitude": 37.4979,
    "longitude": 126.9435
  },
  {
    "id": "stn--599",
    "name": "서정리역",
    "lines": "1호선",
    "latitude": 37.0566,
    "longitude": 127.0531
  },
  {
    "id": "stn--194",
    "name": "서초역",
    "lines": "2호선",
    "latitude": 37.4919,
    "longitude": 127.0074
  },
  {
    "id": "stn--390",
    "name": "서현역",
    "lines": "수인분당선",
    "latitude": 37.38432,
    "longitude": 127.1238
  },
  {
    "id": "stn--128",
    "name": "석계역",
    "lines": "1호선",
    "latitude": 37.615,
    "longitude": 127.0657
  },
  {
    "id": "stn--177",
    "name": "석계역",
    "lines": "6호선",
    "latitude": 37.6147,
    "longitude": 127.0646
  },
  {
    "id": "stn--319",
    "name": "석남역",
    "lines": "7호선·인천2호선",
    "latitude": 37.5062,
    "longitude": 126.6761
  },
  {
    "id": "stn--369",
    "name": "석바위시장역",
    "lines": "인천2호선",
    "latitude": 37.4577,
    "longitude": 126.6922
  },
  {
    "id": "stn--370",
    "name": "석산사거리역",
    "lines": "인천2호선",
    "latitude": 37.4568,
    "longitude": 126.7108
  },
  {
    "id": "stn--446",
    "name": "석수역",
    "lines": "1호선",
    "latitude": 37.4352,
    "longitude": 126.9022
  },
  {
    "id": "stn--96",
    "name": "석촌고분역",
    "lines": "9호선",
    "latitude": 37.49252,
    "longitude": 127.1112
  },
  {
    "id": "stn--89",
    "name": "석촌역",
    "lines": "8호선·9호선",
    "latitude": 37.5054,
    "longitude": 127.1071
  },
  {
    "id": "stn--289",
    "name": "선릉역",
    "lines": "2호선",
    "latitude": 37.5045,
    "longitude": 127.0497
  },
  {
    "id": "stn--463",
    "name": "선바위역",
    "lines": "4호선",
    "latitude": 37.4518,
    "longitude": 127.0021
  },
  {
    "id": "stn--584",
    "name": "선부역",
    "lines": "서해선",
    "latitude": 37.3344,
    "longitude": 126.8101
  },
  {
    "id": "stn--69",
    "name": "선유도역",
    "lines": "9호선",
    "latitude": 37.538,
    "longitude": 126.8937
  },
  {
    "id": "stn--285",
    "name": "선정릉역",
    "lines": "9호선",
    "latitude": 37.5102,
    "longitude": 127.0436
  },
  {
    "id": "stn--341",
    "name": "선학역",
    "lines": "인천1호선",
    "latitude": 37.427,
    "longitude": 126.6989
  },
  {
    "id": "stn--402",
    "name": "성남역",
    "lines": "경강선·GTX-A",
    "latitude": 37.3942,
    "longitude": 127.1206
  },
  {
    "id": "stn--552",
    "name": "성복역",
    "lines": "신분당선",
    "latitude": 37.3135,
    "longitude": 127.0804
  },
  {
    "id": "stn--248",
    "name": "성수역",
    "lines": "2호선",
    "latitude": 37.5441,
    "longitude": 127.0558
  },
  {
    "id": "stn--179",
    "name": "성신여대입구역",
    "lines": "4호선·우이신설선",
    "latitude": 37.5927,
    "longitude": 127.0166
  },
  {
    "id": "stn--594",
    "name": "세마역",
    "lines": "1호선",
    "latitude": 37.1876,
    "longitude": 127.0431
  },
  {
    "id": "stn--577",
    "name": "세종대왕릉역",
    "lines": "경강선",
    "latitude": 37.2936,
    "longitude": 127.5708
  },
  {
    "id": "stn--350",
    "name": "센트럴파크역",
    "lines": "인천1호선",
    "latitude": 37.3935,
    "longitude": 126.6349
  },
  {
    "id": "stn--384",
    "name": "소래포구역",
    "lines": "수인분당선",
    "latitude": 37.401,
    "longitude": 126.7336
  },
  {
    "id": "stn--473",
    "name": "소사역",
    "lines": "1호선·서해선",
    "latitude": 37.4827,
    "longitude": 126.7957
  },
  {
    "id": "stn--475",
    "name": "소새울역",
    "lines": "서해선",
    "latitude": 37.4684,
    "longitude": 126.7973
  },
  {
    "id": "stn--502",
    "name": "소요산역",
    "lines": "1호선",
    "latitude": 37.9488,
    "longitude": 127.0611
  },
  {
    "id": "stn--154",
    "name": "솔밭공원역",
    "lines": "우이신설선",
    "latitude": 37.6563,
    "longitude": 127.013
  },
  {
    "id": "stn--160",
    "name": "솔샘역",
    "lines": "우이신설선",
    "latitude": 37.6202,
    "longitude": 127.0135
  },
  {
    "id": "stn--471",
    "name": "송내역",
    "lines": "1호선",
    "latitude": 37.4876,
    "longitude": 126.7528
  },
  {
    "id": "stn--352",
    "name": "송도달빛축제공원역",
    "lines": "인천1호선",
    "latitude": 37.4071,
    "longitude": 126.6259
  },
  {
    "id": "stn--379",
    "name": "송도역",
    "lines": "수인분당선",
    "latitude": 37.4299,
    "longitude": 126.6547
  },
  {
    "id": "stn--430",
    "name": "송산역",
    "lines": "의정부선",
    "latitude": 37.7373,
    "longitude": 127.0872
  },
  {
    "id": "stn--195",
    "name": "송정역",
    "lines": "5호선",
    "latitude": 37.5614,
    "longitude": 126.8113
  },
  {
    "id": "stn--598",
    "name": "송탄역",
    "lines": "1호선",
    "latitude": 37.0756,
    "longitude": 127.0544
  },
  {
    "id": "stn--97",
    "name": "송파나루역",
    "lines": "9호선",
    "latitude": 37.5103,
    "longitude": 127.1122
  },
  {
    "id": "stn--90",
    "name": "송파역",
    "lines": "8호선",
    "latitude": 37.4997,
    "longitude": 127.1122
  },
  {
    "id": "stn--389",
    "name": "수내역",
    "lines": "수인분당선",
    "latitude": 37.3784,
    "longitude": 127.115
  },
  {
    "id": "stn--138",
    "name": "수락산역",
    "lines": "7호선",
    "latitude": 37.6778,
    "longitude": 127.0554
  },
  {
    "id": "stn--457",
    "name": "수리산역",
    "lines": "4호선",
    "latitude": 37.3506,
    "longitude": 126.9257
  },
  {
    "id": "stn--273",
    "name": "수색역",
    "lines": "경의중앙선",
    "latitude": 37.581,
    "longitude": 126.8956
  },
  {
    "id": "stn--291",
    "name": "수서역",
    "lines": "3호선·수인분당선",
    "latitude": 37.4875,
    "longitude": 127.101
  },
  {
    "id": "stn--153",
    "name": "수유역",
    "lines": "4호선",
    "latitude": 37.6371,
    "longitude": 127.0256
  },
  {
    "id": "stn--551",
    "name": "수지구청역",
    "lines": "신분당선",
    "latitude": 37.3226,
    "longitude": 127.0948
  },
  {
    "id": "stn--396",
    "name": "수진역",
    "lines": "8호선",
    "latitude": 37.4376,
    "longitude": 127.141
  },
  {
    "id": "stn--196",
    "name": "숙대입구역",
    "lines": "4호선",
    "latitude": 37.5446,
    "longitude": 126.9722
  },
  {
    "id": "stn--197",
    "name": "숭실대입구역",
    "lines": "7호선",
    "latitude": 37.496,
    "longitude": 126.9532
  },
  {
    "id": "stn--377",
    "name": "숭의역",
    "lines": "수인분당선",
    "latitude": 37.4608,
    "longitude": 126.6381
  },
  {
    "id": "stn--50",
    "name": "시가정역",
    "lines": "7호선",
    "latitude": 37.581,
    "longitude": 127.0885
  },
  {
    "id": "stn--368",
    "name": "시민공원역",
    "lines": "인천2호선",
    "latitude": 37.4584,
    "longitude": 126.6801
  },
  {
    "id": "stn--582",
    "name": "시우역",
    "lines": "서해선",
    "latitude": 37.3131,
    "longitude": 126.7957
  },
  {
    "id": "stn--566",
    "name": "시청,용인대역",
    "lines": "에버라인",
    "latitude": 37.2394,
    "longitude": 127.1788
  },
  {
    "id": "stn--108",
    "name": "시청역",
    "lines": "1호선·2호선",
    "latitude": 37.56472,
    "longitude": 126.9771
  },
  {
    "id": "stn--484",
    "name": "시흥능곡역",
    "lines": "서해선",
    "latitude": 37.3701,
    "longitude": 126.8086
  },
  {
    "id": "stn--488",
    "name": "시흥대야역",
    "lines": "서해선",
    "latitude": 37.4502,
    "longitude": 126.793
  },
  {
    "id": "stn--485",
    "name": "시흥시청역",
    "lines": "서해선",
    "latitude": 37.3815,
    "longitude": 126.8059
  },
  {
    "id": "stn--557",
    "name": "신갈역",
    "lines": "수인분당선",
    "latitude": 37.2861,
    "longitude": 127.1113
  },
  {
    "id": "stn--198",
    "name": "신강일역",
    "lines": "9호선",
    "latitude": 37.5659,
    "longitude": 127.1774
  },
  {
    "id": "stn--243",
    "name": "신금호역",
    "lines": "5호선",
    "latitude": 37.5544,
    "longitude": 127.0206
  },
  {
    "id": "stn--75",
    "name": "신길역",
    "lines": "1호선·5호선",
    "latitude": 37.51712,
    "longitude": 126.9172
  },
  {
    "id": "stn--586",
    "name": "신길온천역",
    "lines": "4호선·수인분당선",
    "latitude": 37.3375,
    "longitude": 126.7673
  },
  {
    "id": "stn--57",
    "name": "신내역",
    "lines": "6호선·경의중앙·경춘선",
    "latitude": 37.61266,
    "longitude": 127.1033
  },
  {
    "id": "stn--284",
    "name": "신논현역",
    "lines": "9호선",
    "latitude": 37.5045,
    "longitude": 127.0254
  },
  {
    "id": "stn--199",
    "name": "신답역",
    "lines": "2호선",
    "latitude": 37.5705,
    "longitude": 127.0464
  },
  {
    "id": "stn--111",
    "name": "신당역",
    "lines": "2호선·6호선",
    "latitude": 37.56587,
    "longitude": 127.0176
  },
  {
    "id": "stn--200",
    "name": "신대방삼거리역",
    "lines": "7호선",
    "latitude": 37.4995,
    "longitude": 126.9271
  },
  {
    "id": "stn--193",
    "name": "신대방역",
    "lines": "2호선",
    "latitude": 37.4876,
    "longitude": 126.9133
  },
  {
    "id": "stn--201",
    "name": "신대방역",
    "lines": "2호선",
    "latitude": 37.48788,
    "longitude": 126.9137
  },
  {
    "id": "stn--147",
    "name": "신도림역",
    "lines": "1호선·2호선",
    "latitude": 37.5083,
    "longitude": 126.8911
  },
  {
    "id": "stn--574",
    "name": "신둔도예촌역",
    "lines": "경강선",
    "latitude": 37.3156,
    "longitude": 127.4052
  },
  {
    "id": "stn--188",
    "name": "신림역",
    "lines": "2호선·신림선",
    "latitude": 37.4842,
    "longitude": 126.9297
  },
  {
    "id": "stn--202",
    "name": "신림역",
    "lines": "2호선·신림선",
    "latitude": 37.48405,
    "longitude": 126.9297
  },
  {
    "id": "stn--203",
    "name": "신명일역",
    "lines": "9호선",
    "latitude": 37.5492,
    "longitude": 127.1562
  },
  {
    "id": "stn--212",
    "name": "신목동역",
    "lines": "9호선",
    "latitude": 37.5443,
    "longitude": 126.8831
  },
  {
    "id": "stn--213",
    "name": "신반포역",
    "lines": "9호선",
    "latitude": 37.5045,
    "longitude": 126.9972
  },
  {
    "id": "stn--214",
    "name": "신방화역",
    "lines": "9호선",
    "latitude": 37.5675,
    "longitude": 126.8174
  },
  {
    "id": "stn--281",
    "name": "신사역",
    "lines": "3호선",
    "latitude": 37.5164,
    "longitude": 127.0207
  },
  {
    "id": "stn--29",
    "name": "신설동역",
    "lines": "1호선·2호선·우이신설선",
    "latitude": 37.575297,
    "longitude": 127.025087
  },
  {
    "id": "stn--342",
    "name": "신연수역",
    "lines": "인천1호선",
    "latitude": 37.418,
    "longitude": 126.6941
  },
  {
    "id": "stn--215",
    "name": "신용산역",
    "lines": "4호선",
    "latitude": 37.5292,
    "longitude": 126.9679
  },
  {
    "id": "stn--511",
    "name": "신원역",
    "lines": "경의중앙선",
    "latitude": 37.5255,
    "longitude": 127.373
  },
  {
    "id": "stn--34",
    "name": "신이문역",
    "lines": "1호선",
    "latitude": 37.601627,
    "longitude": 127.067441
  },
  {
    "id": "stn--226",
    "name": "신정네거리역",
    "lines": "2호선",
    "latitude": 37.5202,
    "longitude": 126.8529
  },
  {
    "id": "stn--227",
    "name": "신정역",
    "lines": "5호선",
    "latitude": 37.525,
    "longitude": 126.8562
  },
  {
    "id": "stn--467",
    "name": "신중동역",
    "lines": "7호선",
    "latitude": 37.5031,
    "longitude": 126.776
  },
  {
    "id": "stn--487",
    "name": "신천역",
    "lines": "서해선",
    "latitude": 37.439,
    "longitude": 126.7868
  },
  {
    "id": "stn--228",
    "name": "신촌역",
    "lines": "2호선·경의중앙선",
    "latitude": 37.5551,
    "longitude": 126.9368
  },
  {
    "id": "stn--376",
    "name": "신포역",
    "lines": "수인분당선",
    "latitude": 37.4684,
    "longitude": 126.6245
  },
  {
    "id": "stn--81",
    "name": "신풍역",
    "lines": "7호선",
    "latitude": 37.5001,
    "longitude": 126.9096
  },
  {
    "id": "stn--486",
    "name": "신현역",
    "lines": "서해선",
    "latitude": 37.4097,
    "longitude": 126.7878
  },
  {
    "id": "stn--397",
    "name": "신흥역",
    "lines": "8호선",
    "latitude": 37.4409,
    "longitude": 127.1475
  },
  {
    "id": "stn--299",
    "name": "쌍문역",
    "lines": "4호선",
    "latitude": 37.648,
    "longitude": 127.0343
  },
  {
    "id": "stn--360",
    "name": "아시아드경기장역",
    "lines": "인천2호선",
    "latitude": 37.5513,
    "longitude": 126.6772
  },
  {
    "id": "stn--513",
    "name": "아신역",
    "lines": "경의중앙선",
    "latitude": 37.5139,
    "longitude": 127.4432
  },
  {
    "id": "stn--229",
    "name": "아차산역",
    "lines": "5호선",
    "latitude": 37.552,
    "longitude": 127.0897
  },
  {
    "id": "stn--230",
    "name": "아현역",
    "lines": "2호선",
    "latitude": 37.5574,
    "longitude": 126.9562
  },
  {
    "id": "stn--62",
    "name": "안국역",
    "lines": "3호선",
    "latitude": 37.5765,
    "longitude": 126.9855
  },
  {
    "id": "stn--587",
    "name": "안산역",
    "lines": "4호선·수인분당선",
    "latitude": 37.3268,
    "longitude": 126.7892
  },
  {
    "id": "stn--173",
    "name": "안암역",
    "lines": "6호선",
    "latitude": 37.5863,
    "longitude": 127.0292
  },
  {
    "id": "stn--448",
    "name": "안양역",
    "lines": "1호선",
    "latitude": 37.4019,
    "longitude": 126.9227
  },
  {
    "id": "stn--205",
    "name": "암사역",
    "lines": "8호선",
    "latitude": 37.5502,
    "longitude": 127.1276
  },
  {
    "id": "stn--280",
    "name": "압구정역",
    "lines": "3호선",
    "latitude": 37.5273,
    "longitude": 127.0286
  },
  {
    "id": "stn--231",
    "name": "애오개역",
    "lines": "5호선",
    "latitude": 37.5535,
    "longitude": 126.9567
  },
  {
    "id": "stn--538",
    "name": "야당역",
    "lines": "경의중앙선",
    "latitude": 37.7127,
    "longitude": 126.7615
  },
  {
    "id": "stn--392",
    "name": "야탑역",
    "lines": "수인분당선",
    "latitude": 37.4114,
    "longitude": 127.1287
  },
  {
    "id": "stn--115",
    "name": "약수역",
    "lines": "3호선·6호선",
    "latitude": 37.5543,
    "longitude": 127.011
  },
  {
    "id": "stn--510",
    "name": "양수역",
    "lines": "경의중앙선",
    "latitude": 37.5459,
    "longitude": 127.3291
  },
  {
    "id": "stn--59",
    "name": "양원역",
    "lines": "경의중앙",
    "latitude": 37.6066,
    "longitude": 127.108
  },
  {
    "id": "stn--265",
    "name": "양재시민의숲역",
    "lines": "신분당선",
    "latitude": 37.47,
    "longitude": 127.0387
  },
  {
    "id": "stn--264",
    "name": "양재역",
    "lines": "신분당선",
    "latitude": 37.4841,
    "longitude": 127.0347
  },
  {
    "id": "stn--433",
    "name": "양정역",
    "lines": "경의중앙선",
    "latitude": 37.604,
    "longitude": 127.1948
  },
  {
    "id": "stn--547",
    "name": "양주역",
    "lines": "1호선",
    "latitude": 37.7743,
    "longitude": 127.0448
  },
  {
    "id": "stn--232",
    "name": "양천구청역",
    "lines": "2호선",
    "latitude": 37.512,
    "longitude": 126.8659
  },
  {
    "id": "stn--233",
    "name": "양천향교역",
    "lines": "9호선",
    "latitude": 37.5681,
    "longitude": 126.8418
  },
  {
    "id": "stn--489",
    "name": "양촌역",
    "lines": "김포골드라인",
    "latitude": 37.6417,
    "longitude": 126.6148
  },
  {
    "id": "stn--78",
    "name": "양평역",
    "lines": "5호선",
    "latitude": 37.52591,
    "longitude": 126.8866
  },
  {
    "id": "stn--515",
    "name": "양평역",
    "lines": "경의중앙선",
    "latitude": 37.4927,
    "longitude": 127.4917
  },
  {
    "id": "stn--429",
    "name": "어룡역",
    "lines": "의정부선",
    "latitude": 37.7427,
    "longitude": 127.0852
  },
  {
    "id": "stn--234",
    "name": "어린이대공원역",
    "lines": "7호선",
    "latitude": 37.548,
    "longitude": 127.0746
  },
  {
    "id": "stn--562",
    "name": "어정역",
    "lines": "에버라인",
    "latitude": 37.275,
    "longitude": 127.1438
  },
  {
    "id": "stn--235",
    "name": "언주역",
    "lines": "9호선",
    "latitude": 37.5071,
    "longitude": 127.0336
  },
  {
    "id": "stn--72",
    "name": "여의도역",
    "lines": "5호선·9호선",
    "latitude": 37.5216,
    "longitude": 126.9241
  },
  {
    "id": "stn--578",
    "name": "여주역",
    "lines": "경강선",
    "latitude": 37.2829,
    "longitude": 127.6286
  },
  {
    "id": "stn--474",
    "name": "역곡역",
    "lines": "1호선",
    "latitude": 37.4851,
    "longitude": 126.8116
  },
  {
    "id": "stn--236",
    "name": "역삼역",
    "lines": "2호선",
    "latitude": 37.5006,
    "longitude": 127.0364
  },
  {
    "id": "stn--237",
    "name": "역촌역",
    "lines": "6호선",
    "latitude": 37.6064,
    "longitude": 126.9226
  },
  {
    "id": "stn--380",
    "name": "연수역",
    "lines": "수인분당선",
    "latitude": 37.4179,
    "longitude": 126.6789
  },
  {
    "id": "stn--238",
    "name": "연신내역",
    "lines": "3호선·6호선",
    "latitude": 37.619,
    "longitude": 126.9213
  },
  {
    "id": "stn--505",
    "name": "연천역",
    "lines": "1호선",
    "latitude": 38.1016,
    "longitude": 127.0739
  },
  {
    "id": "stn--239",
    "name": "염창역",
    "lines": "9호선",
    "latitude": 37.5468,
    "longitude": 126.874
  },
  {
    "id": "stn--77",
    "name": "영등포 구청역",
    "lines": "5호선·2호선",
    "latitude": 37.52497,
    "longitude": 126.896
  },
  {
    "id": "stn--76",
    "name": "영등포시장역",
    "lines": "5호선",
    "latitude": 37.52267,
    "longitude": 126.9051
  },
  {
    "id": "stn--322",
    "name": "영종역",
    "lines": "공항철도",
    "latitude": 37.5121,
    "longitude": 126.525
  },
  {
    "id": "stn--338",
    "name": "예술회관역",
    "lines": "인천1호선",
    "latitude": 37.4492,
    "longitude": 126.701
  },
  {
    "id": "stn--102",
    "name": "오금역",
    "lines": "3호선·5호선",
    "latitude": 37.5027,
    "longitude": 127.1288
  },
  {
    "id": "stn--388",
    "name": "오리역",
    "lines": "수인분당선",
    "latitude": 37.3398,
    "longitude": 127.109
  },
  {
    "id": "stn--240",
    "name": "오목교역",
    "lines": "5호선",
    "latitude": 37.5243,
    "longitude": 126.8744
  },
  {
    "id": "stn--514",
    "name": "오빈역",
    "lines": "경의중앙선",
    "latitude": 37.5061,
    "longitude": 127.4738
  },
  {
    "id": "stn--595",
    "name": "오산대역",
    "lines": "1호선",
    "latitude": 37.1693,
    "longitude": 127.0631
  },
  {
    "id": "stn--596",
    "name": "오산역",
    "lines": "1호선",
    "latitude": 37.1454,
    "longitude": 127.0668
  },
  {
    "id": "stn--482",
    "name": "오이도역",
    "lines": "4호선·수인분당선",
    "latitude": 37.3618,
    "longitude": 126.7384
  },
  {
    "id": "stn--254",
    "name": "옥수역",
    "lines": "3호선·경의중앙선",
    "latitude": 37.5415,
    "longitude": 127.0174
  },
  {
    "id": "stn--99",
    "name": "올림픽공원역",
    "lines": "9호선",
    "latitude": 37.5159,
    "longitude": 127.1309
  },
  {
    "id": "stn--357",
    "name": "완정역",
    "lines": "인천2호선",
    "latitude": 37.5929,
    "longitude": 126.673
  },
  {
    "id": "stn--354",
    "name": "왕길역",
    "lines": "인천2호선",
    "latitude": 37.5951,
    "longitude": 126.6425
  },
  {
    "id": "stn--245",
    "name": "왕십리역",
    "lines": "2호선·5호선·수인분당선",
    "latitude": 37.5613,
    "longitude": 127.0377
  },
  {
    "id": "stn--33",
    "name": "외대앞역",
    "lines": "1호선",
    "latitude": 37.596073,
    "longitude": 127.063549
  },
  {
    "id": "stn--242",
    "name": "용답역",
    "lines": "2호선",
    "latitude": 37.5614,
    "longitude": 127.0507
  },
  {
    "id": "stn--35",
    "name": "용두역",
    "lines": "2호선",
    "latitude": 37.574028,
    "longitude": 127.038091
  },
  {
    "id": "stn--49",
    "name": "용마산역",
    "lines": "7호선",
    "latitude": 37.5738,
    "longitude": 127.0868
  },
  {
    "id": "stn--517",
    "name": "용문역",
    "lines": "경의중앙선",
    "latitude": 37.4824,
    "longitude": 127.5945
  },
  {
    "id": "stn--224",
    "name": "용산역",
    "lines": "1호선·경의중앙선",
    "latitude": 37.5298,
    "longitude": 126.9658
  },
  {
    "id": "stn--569",
    "name": "용인중앙시장역",
    "lines": "에버라인",
    "latitude": 37.2379,
    "longitude": 127.2091
  },
  {
    "id": "stn--256",
    "name": "우장산역",
    "lines": "5호선",
    "latitude": 37.548,
    "longitude": 126.8364
  },
  {
    "id": "stn--436",
    "name": "운길산역",
    "lines": "경의중앙선",
    "latitude": 37.5548,
    "longitude": 127.3099
  },
  {
    "id": "stn--321",
    "name": "운서역",
    "lines": "공항철도",
    "latitude": 37.4929,
    "longitude": 126.4937
  },
  {
    "id": "stn--493",
    "name": "운양역",
    "lines": "김포골드라인",
    "latitude": 37.6539,
    "longitude": 126.6839
  },
  {
    "id": "stn--375",
    "name": "운연역",
    "lines": "인천2호선",
    "latitude": 37.4396,
    "longitude": 126.7596
  },
  {
    "id": "stn--539",
    "name": "운정역",
    "lines": "경의중앙선",
    "latitude": 37.7254,
    "longitude": 126.7671
  },
  {
    "id": "stn--545",
    "name": "운천역",
    "lines": "경의중앙선",
    "latitude": 37.8799,
    "longitude": 126.7698
  },
  {
    "id": "stn--526",
    "name": "원당역",
    "lines": "3호선",
    "latitude": 37.6532,
    "longitude": 126.843
  },
  {
    "id": "stn--516",
    "name": "원덕역",
    "lines": "경의중앙선",
    "latitude": 37.4686,
    "longitude": 127.5472
  },
  {
    "id": "stn--542",
    "name": "원릉역",
    "lines": "경의중앙선",
    "latitude": 37.6627,
    "longitude": 126.8398
  },
  {
    "id": "stn--581",
    "name": "원시역",
    "lines": "서해선",
    "latitude": 37.3025,
    "longitude": 126.7868
  },
  {
    "id": "stn--343",
    "name": "원인재역",
    "lines": "인천1호선",
    "latitude": 37.4131,
    "longitude": 126.6866
  },
  {
    "id": "stn--476",
    "name": "원종역",
    "lines": "서해선",
    "latitude": 37.5241,
    "longitude": 126.8049
  },
  {
    "id": "stn--527",
    "name": "원흥역",
    "lines": "3호선",
    "latitude": 37.6507,
    "longitude": 126.8731
  },
  {
    "id": "stn--129",
    "name": "월계역",
    "lines": "1호선",
    "latitude": 37.6331,
    "longitude": 127.0589
  },
  {
    "id": "stn--175",
    "name": "월곡역",
    "lines": "6호선",
    "latitude": 37.601,
    "longitude": 127.0412
  },
  {
    "id": "stn--480",
    "name": "월곶역",
    "lines": "수인분당선",
    "latitude": 37.3919,
    "longitude": 126.7427
  },
  {
    "id": "stn--257",
    "name": "월드컵경기장역",
    "lines": "6호선",
    "latitude": 37.5696,
    "longitude": 126.8992
  },
  {
    "id": "stn-3-1",
    "name": "을지로3가역",
    "lines": "2호선·3호선",
    "latitude": 37.5663,
    "longitude": 126.9911
  },
  {
    "id": "stn-4",
    "name": "을지로4가역",
    "lines": "2호선·5호선",
    "latitude": 37.5666,
    "longitude": 126.9977
  },
  {
    "id": "stn--109",
    "name": "을지로입구역",
    "lines": "2호선",
    "latitude": 37.56601,
    "longitude": 126.9829
  },
  {
    "id": "stn--255",
    "name": "응봉역",
    "lines": "경의중앙선",
    "latitude": 37.5498,
    "longitude": 127.0347
  },
  {
    "id": "stn--258",
    "name": "응암역",
    "lines": "6호선",
    "latitude": 37.5986,
    "longitude": 126.9156
  },
  {
    "id": "stn--464",
    "name": "의왕역",
    "lines": "1호선",
    "latitude": 37.3204,
    "longitude": 126.9481
  },
  {
    "id": "stn--421",
    "name": "의정부시청역",
    "lines": "의정부선",
    "latitude": 37.7392,
    "longitude": 127.0348
  },
  {
    "id": "stn--415",
    "name": "의정부역",
    "lines": "1호선",
    "latitude": 37.7388,
    "longitude": 127.0459
  },
  {
    "id": "stn--423",
    "name": "의정부중앙역",
    "lines": "의정부선",
    "latitude": 37.7437,
    "longitude": 127.0497
  },
  {
    "id": "stn--259",
    "name": "이대역",
    "lines": "2호선",
    "latitude": 37.5569,
    "longitude": 126.9461
  },
  {
    "id": "stn--391",
    "name": "이매역",
    "lines": "수인분당선·경강선",
    "latitude": 37.3958,
    "longitude": 127.1283
  },
  {
    "id": "stn--403",
    "name": "이매역",
    "lines": "경강선",
    "latitude": 37.3959,
    "longitude": 127.1283
  },
  {
    "id": "stn--260",
    "name": "이수역",
    "lines": "4호선·7호선",
    "latitude": 37.486,
    "longitude": 126.9816
  },
  {
    "id": "stn--575",
    "name": "이천역",
    "lines": "경강선",
    "latitude": 37.2642,
    "longitude": 127.4422
  },
  {
    "id": "stn--217",
    "name": "이촌역",
    "lines": "4호선·경의중앙선",
    "latitude": 37.5221,
    "longitude": 126.9743
  },
  {
    "id": "stn--221",
    "name": "이태원역",
    "lines": "6호선",
    "latitude": 37.5345,
    "longitude": 126.9941
  },
  {
    "id": "stn--452",
    "name": "인덕원역",
    "lines": "4호선",
    "latitude": 37.4015,
    "longitude": 126.9767
  },
  {
    "id": "stn--365",
    "name": "인천가좌역",
    "lines": "인천2호선",
    "latitude": 37.49,
    "longitude": 126.6753
  },
  {
    "id": "stn-1",
    "name": "인천공항1터미널역",
    "lines": "공항철도",
    "latitude": 37.4475,
    "longitude": 126.4524
  },
  {
    "id": "stn-2",
    "name": "인천공항2터미널역",
    "lines": "공항철도",
    "latitude": 37.4684,
    "longitude": 126.4325
  },
  {
    "id": "stn--383",
    "name": "인천논현역",
    "lines": "수인분당선",
    "latitude": 37.4006,
    "longitude": 126.7225
  },
  {
    "id": "stn--374",
    "name": "인천대공원역",
    "lines": "인천2호선",
    "latitude": 37.4485,
    "longitude": 126.7529
  },
  {
    "id": "stn--349",
    "name": "인천대입구역",
    "lines": "인천1호선",
    "latitude": 37.3862,
    "longitude": 126.6394
  },
  {
    "id": "stn--337",
    "name": "인천시청역",
    "lines": "인천1호선·인천2호선",
    "latitude": 37.4579,
    "longitude": 126.7021
  },
  {
    "id": "stn--304",
    "name": "인천역",
    "lines": "1호선·수인분당선",
    "latitude": 37.47626,
    "longitude": 126.6169
  },
  {
    "id": "stn--339",
    "name": "인천터미널역",
    "lines": "인천1호선",
    "latitude": 37.4419,
    "longitude": 126.6997
  },
  {
    "id": "stn--378",
    "name": "인하대역",
    "lines": "수인분당선",
    "latitude": 37.4482,
    "longitude": 126.65
  },
  {
    "id": "stn--261",
    "name": "일원역",
    "lines": "3호선",
    "latitude": 37.483,
    "longitude": 127.084
  },
  {
    "id": "stn--546",
    "name": "임진강역",
    "lines": "경의중앙선",
    "latitude": 37.8884,
    "longitude": 126.747
  },
  {
    "id": "stn--328",
    "name": "임학역",
    "lines": "인천1호선",
    "latitude": 37.545,
    "longitude": 126.7387
  },
  {
    "id": "stn--262",
    "name": "자양역",
    "lines": "7호선",
    "latitude": 37.5316,
    "longitude": 127.0667
  },
  {
    "id": "stn--331",
    "name": "작전역",
    "lines": "인천1호선",
    "latitude": 37.5303,
    "longitude": 126.7225
  },
  {
    "id": "stn--84",
    "name": "잠실나루역",
    "lines": "2호선",
    "latitude": 37.52073,
    "longitude": 127.1038
  },
  {
    "id": "stn--87",
    "name": "잠실시내역",
    "lines": "2호선",
    "latitude": 37.51169,
    "longitude": 127.0862
  },
  {
    "id": "stn--85",
    "name": "잠실역",
    "lines": "2호선·8호선",
    "latitude": 37.5133,
    "longitude": 127.1002
  },
  {
    "id": "stn--263",
    "name": "잠원역",
    "lines": "3호선",
    "latitude": 37.5124,
    "longitude": 127.0112
  },
  {
    "id": "stn--492",
    "name": "장기역",
    "lines": "김포골드라인",
    "latitude": 37.6441,
    "longitude": 126.6691
  },
  {
    "id": "stn--268",
    "name": "장승배기역",
    "lines": "7호선",
    "latitude": 37.5049,
    "longitude": 126.939
  },
  {
    "id": "stn--412",
    "name": "장암역",
    "lines": "7호선",
    "latitude": 37.7001,
    "longitude": 127.0532
  },
  {
    "id": "stn--93",
    "name": "장지역",
    "lines": "8호선",
    "latitude": 37.4787,
    "longitude": 127.1262
  },
  {
    "id": "stn--36",
    "name": "장한평역",
    "lines": "5호선",
    "latitude": 37.56144,
    "longitude": 127.064623
  },
  {
    "id": "stn--269",
    "name": "장한평역",
    "lines": "7호선",
    "latitude": 37.5613,
    "longitude": 127.0643
  },
  {
    "id": "stn--504",
    "name": "전곡역",
    "lines": "1호선",
    "latitude": 38.0245,
    "longitude": 127.0713
  },
  {
    "id": "stn--573",
    "name": "전대.에버랜드역",
    "lines": "에버라인",
    "latitude": 37.2854,
    "longitude": 127.2195
  },
  {
    "id": "stn--182",
    "name": "정릉역",
    "lines": "우이신설선",
    "latitude": 37.6027,
    "longitude": 127.0136
  },
  {
    "id": "stn--521",
    "name": "정발산역",
    "lines": "3호선",
    "latitude": 37.6596,
    "longitude": 126.7733
  },
  {
    "id": "stn--459",
    "name": "정부과천청사역",
    "lines": "4호선",
    "latitude": 37.4265,
    "longitude": 126.9897
  },
  {
    "id": "stn--483",
    "name": "정왕역",
    "lines": "4호선·수인분당선",
    "latitude": 37.3518,
    "longitude": 126.7429
  },
  {
    "id": "stn--386",
    "name": "정자역",
    "lines": "신분당선·수인분당선",
    "latitude": 37.3661,
    "longitude": 127.1081
  },
  {
    "id": "stn--30",
    "name": "제기동역",
    "lines": "1호선",
    "latitude": 37.578103,
    "longitude": 127.034893
  },
  {
    "id": "stn--307",
    "name": "제물포역",
    "lines": "1호선",
    "latitude": 37.4668,
    "longitude": 126.6569
  },
  {
    "id": "stn--64",
    "name": "종각역",
    "lines": "1호선",
    "latitude": 37.56933,
    "longitude": 126.9817
  },
  {
    "id": "stn-3",
    "name": "종로3가역",
    "lines": "1호선·3호선·5호선",
    "latitude": 37.57161,
    "longitude": 126.9898
  },
  {
    "id": "stn-5",
    "name": "종로5가역",
    "lines": "1호선",
    "latitude": 37.5717,
    "longitude": 126.9915
  },
  {
    "id": "stn--86",
    "name": "종합운동장역",
    "lines": "2호선·9호선",
    "latitude": 37.511,
    "longitude": 127.0736
  },
  {
    "id": "stn--367",
    "name": "주안국가산단역",
    "lines": "인천2호선",
    "latitude": 37.4739,
    "longitude": 126.6813
  },
  {
    "id": "stn--309",
    "name": "주안역",
    "lines": "1호선",
    "latitude": 37.4621,
    "longitude": 126.6797
  },
  {
    "id": "stn--520",
    "name": "주엽역",
    "lines": "3호선",
    "latitude": 37.6701,
    "longitude": 126.7612
  },
  {
    "id": "stn--555",
    "name": "죽전역",
    "lines": "수인분당선",
    "latitude": 37.3246,
    "longitude": 127.1074
  },
  {
    "id": "stn--135",
    "name": "중계역",
    "lines": "7호선",
    "latitude": 37.6451,
    "longitude": 127.0641
  },
  {
    "id": "stn--270",
    "name": "중곡역",
    "lines": "7호선",
    "latitude": 37.5656,
    "longitude": 127.0842
  },
  {
    "id": "stn--472",
    "name": "중동역",
    "lines": "1호선",
    "latitude": 37.4867,
    "longitude": 126.7645
  },
  {
    "id": "stn--55",
    "name": "중랑역",
    "lines": "경의중앙·경춘선",
    "latitude": 37.5949,
    "longitude": 127.0758
  },
  {
    "id": "stn--589",
    "name": "중앙역",
    "lines": "4호선·수인분당선",
    "latitude": 37.316,
    "longitude": 126.8385
  },
  {
    "id": "stn--53",
    "name": "중화역",
    "lines": "7호선",
    "latitude": 37.6026,
    "longitude": 127.0793
  },
  {
    "id": "stn--271",
    "name": "증미역",
    "lines": "9호선",
    "latitude": 37.5581,
    "longitude": 126.8607
  },
  {
    "id": "stn--272",
    "name": "증산역",
    "lines": "6호선",
    "latitude": 37.5832,
    "longitude": 126.9095
  },
  {
    "id": "stn--561",
    "name": "지석역",
    "lines": "에버라인",
    "latitude": 37.2697,
    "longitude": 127.1366
  },
  {
    "id": "stn--348",
    "name": "지식정보단지역",
    "lines": "인천1호선",
    "latitude": 37.3781,
    "longitude": 126.6454
  },
  {
    "id": "stn--529",
    "name": "지축역",
    "lines": "3호선",
    "latitude": 37.6481,
    "longitude": 126.9138
  },
  {
    "id": "stn--518",
    "name": "지평역",
    "lines": "경의중앙선",
    "latitude": 37.4764,
    "longitude": 127.6296
  },
  {
    "id": "stn--498",
    "name": "지행역",
    "lines": "1호선",
    "latitude": 37.8924,
    "longitude": 127.0558
  },
  {
    "id": "stn--597",
    "name": "진위역",
    "lines": "1호선",
    "latitude": 37.1098,
    "longitude": 127.0624
  },
  {
    "id": "stn--298",
    "name": "창동역",
    "lines": "1호선·4호선",
    "latitude": 37.6532,
    "longitude": 127.0473
  },
  {
    "id": "stn--67",
    "name": "창신역",
    "lines": "6호선",
    "latitude": 37.5794,
    "longitude": 127.0152
  },
  {
    "id": "stn--444",
    "name": "천마산역",
    "lines": "경춘선",
    "latitude": 37.659,
    "longitude": 127.2858
  },
  {
    "id": "stn--204",
    "name": "천호역",
    "lines": "5호선·8호선",
    "latitude": 37.5384,
    "longitude": 127.1237
  },
  {
    "id": "stn--478",
    "name": "철산역",
    "lines": "7호선",
    "latitude": 37.476,
    "longitude": 126.8677
  },
  {
    "id": "stn--266",
    "name": "청계산입구역",
    "lines": "신분당선",
    "latitude": 37.4483,
    "longitude": 127.0552
  },
  {
    "id": "stn--118",
    "name": "청구역",
    "lines": "5호선·6호선",
    "latitude": 37.5602,
    "longitude": 127.0138
  },
  {
    "id": "stn--283",
    "name": "청담역",
    "lines": "7호선",
    "latitude": 37.5193,
    "longitude": 127.0533
  },
  {
    "id": "stn--323",
    "name": "청라국제도시역",
    "lines": "공항철도",
    "latitude": 37.5563,
    "longitude": 126.6247
  },
  {
    "id": "stn--31",
    "name": "청량리역",
    "lines": "1호선·경의중앙·수인분당선·경춘선",
    "latitude": 37.580178,
    "longitude": 127.046835
  },
  {
    "id": "stn--503",
    "name": "청산역",
    "lines": "1호선",
    "latitude": 37.9978,
    "longitude": 127.0734
  },
  {
    "id": "stn--507",
    "name": "청평역",
    "lines": "경춘선",
    "latitude": 37.7355,
    "longitude": 127.4266
  },
  {
    "id": "stn--564",
    "name": "초당역",
    "lines": "에버라인",
    "latitude": 37.2608,
    "longitude": 127.1595
  },
  {
    "id": "stn--406",
    "name": "초월역",
    "lines": "경강선",
    "latitude": 37.3734,
    "longitude": 127.3
  },
  {
    "id": "stn--583",
    "name": "초지역",
    "lines": "4호선·서해선·수인분당선",
    "latitude": 37.3206,
    "longitude": 126.8061
  },
  {
    "id": "stn--468",
    "name": "춘의역",
    "lines": "7호선",
    "latitude": 37.5037,
    "longitude": 126.7871
  },
  {
    "id": "stn--607",
    "name": "춘천역",
    "lines": "경춘선",
    "latitude": 37.8847,
    "longitude": 127.7168
  },
  {
    "id": "stn--112",
    "name": "충무로역",
    "lines": "3호선·4호선",
    "latitude": 37.561,
    "longitude": 126.9947
  },
  {
    "id": "stn--276",
    "name": "충정로역",
    "lines": "2호선·5호선",
    "latitude": 37.5599,
    "longitude": 126.9637
  },
  {
    "id": "stn--346",
    "name": "캠퍼스타운역",
    "lines": "인천1호선",
    "latitude": 37.3882,
    "longitude": 126.6621
  },
  {
    "id": "stn--530",
    "name": "탄현역",
    "lines": "경의중앙선",
    "latitude": 37.6941,
    "longitude": 126.7611
  },
  {
    "id": "stn--431",
    "name": "탑석역",
    "lines": "의정부선",
    "latitude": 37.7335,
    "longitude": 127.0889
  },
  {
    "id": "stn--131",
    "name": "태릉입구역",
    "lines": "6호선·7호선",
    "latitude": 37.6173,
    "longitude": 127.0749
  },
  {
    "id": "stn--394",
    "name": "태평역",
    "lines": "수인분당선",
    "latitude": 37.4399,
    "longitude": 127.1278
  },
  {
    "id": "stn--347",
    "name": "테크노파크역",
    "lines": "인천1호선",
    "latitude": 37.382,
    "longitude": 126.6563
  },
  {
    "id": "stn--440",
    "name": "퇴계원역",
    "lines": "경춘선",
    "latitude": 37.6483,
    "longitude": 127.1441
  },
  {
    "id": "stn--543",
    "name": "파주역",
    "lines": "경의중앙선",
    "latitude": 37.8154,
    "longitude": 126.7925
  },
  {
    "id": "stn--385",
    "name": "판교역",
    "lines": "경강선·신분당선",
    "latitude": 37.3948,
    "longitude": 127.1112
  },
  {
    "id": "stn--435",
    "name": "팔당역",
    "lines": "경의중앙선",
    "latitude": 37.5473,
    "longitude": 127.2439
  },
  {
    "id": "stn--451",
    "name": "평촌역",
    "lines": "4호선",
    "latitude": 37.3943,
    "longitude": 126.964
  },
  {
    "id": "stn--601",
    "name": "평택역",
    "lines": "1호선",
    "latitude": 36.9912,
    "longitude": 127.085
  },
  {
    "id": "stn--600",
    "name": "평택지제역",
    "lines": "1호선",
    "latitude": 37.0189,
    "longitude": 127.0705
  },
  {
    "id": "stn--443",
    "name": "평호네역",
    "lines": "경춘선",
    "latitude": 37.6533,
    "longitude": 127.2445
  },
  {
    "id": "stn--496",
    "name": "풍무역",
    "lines": "김포골드라인",
    "latitude": 37.6123,
    "longitude": 126.7327
  },
  {
    "id": "stn--531",
    "name": "풍산역",
    "lines": "경의중앙선·서해선",
    "latitude": 37.6722,
    "longitude": 126.7864
  },
  {
    "id": "stn--134",
    "name": "하계역",
    "lines": "7호선",
    "latitude": 37.6359,
    "longitude": 127.0682
  },
  {
    "id": "stn--411",
    "name": "하남검단산역",
    "lines": "5호선",
    "latitude": 37.5398,
    "longitude": 127.2231
  },
  {
    "id": "stn--410",
    "name": "하남시청역",
    "lines": "5호선",
    "latitude": 37.542,
    "longitude": 127.2063
  },
  {
    "id": "stn--409",
    "name": "하남풍산역",
    "lines": "5호선",
    "latitude": 37.5521,
    "longitude": 127.2039
  },
  {
    "id": "stn--277",
    "name": "학동역",
    "lines": "7호선",
    "latitude": 37.5142,
    "longitude": 127.0317
  },
  {
    "id": "stn--278",
    "name": "학여울역",
    "lines": "3호선",
    "latitude": 37.4963,
    "longitude": 127.07
  },
  {
    "id": "stn--220",
    "name": "한강진역",
    "lines": "6호선",
    "latitude": 37.5393,
    "longitude": 127.0017
  },
  {
    "id": "stn--537",
    "name": "한국항공대역",
    "lines": "경의중앙선",
    "latitude": 37.6029,
    "longitude": 126.8684
  },
  {
    "id": "stn--219",
    "name": "한남역",
    "lines": "경의중앙선",
    "latitude": 37.5294,
    "longitude": 127.0091
  },
  {
    "id": "stn--590",
    "name": "한대앞역",
    "lines": "4호선·수인분당선",
    "latitude": 37.3095,
    "longitude": 126.8539
  },
  {
    "id": "stn--178",
    "name": "한성대입구역",
    "lines": "4호선",
    "latitude": 37.5882,
    "longitude": 127.0065
  },
  {
    "id": "stn--98",
    "name": "한성백제역",
    "lines": "9호선",
    "latitude": 37.5164,
    "longitude": 127.1163
  },
  {
    "id": "stn--250",
    "name": "한양대역",
    "lines": "2호선",
    "latitude": 37.5552,
    "longitude": 127.0435
  },
  {
    "id": "stn--279",
    "name": "한티역",
    "lines": "수인분당선",
    "latitude": 37.4967,
    "longitude": 127.0524
  },
  {
    "id": "stn--292",
    "name": "합정역",
    "lines": "2호선·6호선",
    "latitude": 37.5495,
    "longitude": 126.9139
  },
  {
    "id": "stn--244",
    "name": "행당역",
    "lines": "5호선",
    "latitude": 37.557,
    "longitude": 127.0292
  },
  {
    "id": "stn--535",
    "name": "행신역",
    "lines": "경의중앙선",
    "latitude": 37.6121,
    "longitude": 126.8344
  },
  {
    "id": "stn--68",
    "name": "혜화역",
    "lines": "4호선",
    "latitude": 37.5822,
    "longitude": 127.0019
  },
  {
    "id": "stn--382",
    "name": "호구포역",
    "lines": "수인분당선",
    "latitude": 37.4016,
    "longitude": 126.7087
  },
  {
    "id": "stn--295",
    "name": "홍대입구역",
    "lines": "2호선·경의중앙선·공항철도",
    "latitude": 37.5572,
    "longitude": 126.9254
  },
  {
    "id": "stn--300",
    "name": "홍제역",
    "lines": "3호선",
    "latitude": 37.589,
    "longitude": 126.9434
  },
  {
    "id": "stn--157",
    "name": "화계역",
    "lines": "우이신설선",
    "latitude": 37.6341,
    "longitude": 127.01743
  },
  {
    "id": "stn--301",
    "name": "화곡역",
    "lines": "5호선",
    "latitude": 37.541,
    "longitude": 126.84
  },
  {
    "id": "stn--132",
    "name": "화랑대역",
    "lines": "6호선",
    "latitude": 37.6202,
    "longitude": 127.0838
  },
  {
    "id": "stn--525",
    "name": "화정역",
    "lines": "3호선",
    "latitude": 37.6346,
    "longitude": 126.8327
  },
  {
    "id": "stn--32",
    "name": "회기역",
    "lines": "1호선·경춘선",
    "latitude": 37.58946,
    "longitude": 127.057583
  },
  {
    "id": "stn--414",
    "name": "회룡역",
    "lines": "1호선·의정부선",
    "latitude": 37.7241,
    "longitude": 127.0474
  },
  {
    "id": "stn--114",
    "name": "회현역",
    "lines": "4호선",
    "latitude": 37.5588,
    "longitude": 126.9785
  },
  {
    "id": "stn--427",
    "name": "효자역",
    "lines": "의정부선",
    "latitude": 37.7539,
    "longitude": 127.0773
  },
  {
    "id": "stn--223",
    "name": "효창공원앞역",
    "lines": "6호선·경의중앙선",
    "latitude": 37.5387,
    "longitude": 126.9615
  },
  {
    "id": "stn--302",
    "name": "흑석역",
    "lines": "9호선",
    "latitude": 37.5088,
    "longitude": 126.9635
  },
  {
    "id": "stn--422",
    "name": "흥선역",
    "lines": "의정부선",
    "latitude": 37.7433,
    "longitude": 127.0371
  }
];
