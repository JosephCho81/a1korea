/* 글로벌 소싱 네트워크 지도 (Leaflet) */
(function(){
var map = L.map('leaflet-map', {
    center: [30, 60], zoom: 2, scrollWheelZoom: false,
    maxBoundsViscosity: 1.0,
    worldCopyJump: false,
    maxBounds: [[-90,-180],[90,180]]
  });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd', maxZoom: 6
  }).addTo(map);

  var hqIcon = L.divIcon({
    className:'',
    html:'<div style="width:20px;height:20px;background:#2B8C3C;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(43,140,60,0.25);"></div>',
    iconSize:[20,20], iconAnchor:[10,10]
  });
  var supplyIcon = L.divIcon({
    className:'',
    html:'<div style="width:13px;height:13px;background:#607D8B;border:2px solid #fff;border-radius:50%;"></div>',
    iconSize:[13,13], iconAnchor:[6,6]
  });

  L.marker([37.5,127.0],{icon:hqIcon}).addTo(map)
    .bindTooltip('한국 (본사)',{permanent:true,direction:'top',offset:[0,-14],className:'map-lbl-hq'});

  var suppliers=[
    {name:'중국',   lat:35.0, lng:105.0},
    {name:'러시아', lat:60.0, lng: 90.0},
    {name:'중동',   lat:25.0, lng: 45.0},
    {name:'미국',   lat:47.0, lng:-100.0},
    {name:'유럽',   lat:52.0, lng: 15.0},
    {name:'일본',   lat:36.5, lng:145.0}
  ];

  suppliers.forEach(function(s){
    L.marker([s.lat,s.lng],{icon:supplyIcon}).addTo(map)
      .bindTooltip(s.name,{permanent:true,direction: s.name==='일본' ? 'right' : 'top',offset: s.name==='일본' ? [10,0] : [0,-10],className:'map-lbl'});
    L.polyline([[s.lat,s.lng],[37.5,127.0]],{
      color:'#2B8C3C',
      weight: s.name==='중국'||s.name==='러시아' ? 2.2 : 1.5,
      dashArray:'6,5',
      opacity: s.name==='중국' ? 0.9 : 0.6
    }).addTo(map);
  });
})();
