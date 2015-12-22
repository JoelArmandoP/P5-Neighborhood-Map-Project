"use strict";function callApiWithRetry(a,b,c,d){var e=0,f=5,g=300,h=function(i,j){j==d&&e++<f?(setTimeout(function(){a(b,h)},g),g*=2):(j==d&&(console.log("Giving up on:"),console.log(b)),c(i,j))};a(b,h)}function PointOfInterest(a){var b=this;b.detailsValid=!1,b.data=ko.observable(a),b.name=ko.computed(function(){return"name"in b.data()?b.data().name:""}),b.address=ko.computed(function(){return"formatted_address"in b.data()?b.data().formatted_address:""}),b.url=ko.computed(function(){return"website"in b.data()?b.data().website:""}),b.location=ko.observable(a.geometry.location),b.label=ko.observable(""),b.mapIconImageUrl=ko.computed(function(){return"icon"in b.data()?b.data().icon:null}),b.mapIconImage=ko.computed(function(){return{url:b.mapIconImageUrl(),scaledSize:new google.maps.Size(20,20),origin:new google.maps.Point(0,0),anchor:new google.maps.Point(0,0)}}),b.showInfoWindow=function(){}}function School(a){var b=this;PointOfInterest.call(b,a)}function Restaurant(a){var b=this;PointOfInterest.call(b,a),b.rating=ko.computed(function(){return"rating"in b.data()?b.data().rating:"none"})}function Transport(a){var b=this;PointOfInterest.call(b,a)}function WikiArticle(a){var b=this;b.data=ko.observable(a),this.title=ko.computed(function(){return"title"in b.data()?b.data().title:"Untitled"}),this.snippet=ko.computed(function(){return"snippet"in b.data()?b.data().snippet.replace(/<\/?[^>]+(>|$)/g,""):""}),this.url=ko.computed(function(){return"title"in b.data()?"https://en.wikipedia.org/wiki/"+b.data().title:""})}function theGuardianArticle(a){var b=this;b.data=ko.observable(a),this.title=ko.computed(function(){return"webTitle"in b.data()?b.data().webTitle:"Untitled"}),this.url=ko.computed(function(){return"webUrl"in b.data()?b.data().webUrl:""})}var placesService=null,mapsGeocoder=null;PointOfInterest.prototype.fetchDetails=function(){var a=this;a.detailsValid||(callApiWithRetry(placesService.getDetails.bind(placesService),{placeId:a.data().place_id},function(b,c){c==google.maps.places.PlacesServiceStatus.OK&&a.data(b)},google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT),a.detailsValid=!0)},School.prototype=Object.create(PointOfInterest.prototype),School.prototype.infoWindowTemplateId="school-info-window-template",Restaurant.prototype=Object.create(PointOfInterest.prototype),Restaurant.prototype.infoWindowTemplateId="restaurant-info-window-template",Transport.prototype=Object.create(PointOfInterest.prototype),Transport.prototype.infoWindowTemplateId="transport-info-window-template",ko.bindingHandlers.map={update:function(a,b,c,d){var e=ko.utils.unwrapObservable(b()),f=new google.maps.LatLng(ko.utils.unwrapObservable(e.lat),ko.utils.unwrapObservable(e.lng)),g={center:f,scrollwheel:!1,zoom:15},h=new google.maps.Map(a,g);h.neighborhoodMapInfoWindow=null,d.categories().forEach(function(a){d.selectedPlaces()[a]().forEach(function(a){if("lat"in a().location()){var b=new MarkerWithLabel({position:a().location(),map:h,title:a().name(),icon:a().mapIconImage(),labelContent:a().label(),labelAnchor:new google.maps.Point(3,-20),labelClass:"labels",labelStyle:{opacity:.75}}),c=document.getElementById(a().infoWindowTemplateId).cloneNode(!0);ko.applyBindings(a,c);var d=new google.maps.InfoWindow({content:c});a().showInfoWindow=function(){h.neighborhoodMapInfoWindow&&h.neighborhoodMapInfoWindow.getMap()&&h.neighborhoodMapInfoWindow.close(),a().fetchDetails(),d.open(h,b),h.neighborhoodMapInfoWindow=d,b.setAnimation(google.maps.Animation.BOUNCE),setTimeout(function(){b.setAnimation(null)},800)},google.maps.event.addListener(b,"click",a().showInfoWindow)}})})}};var ViewModel=function(){var a=this;a.location=ko.observable({lat:ko.observable(51.442645),lng:ko.observable(-.152782)});var b="ABCDEFGHIJKLMNOPQRSTUVWXYZ";b.bold();var c={Restaurant:{types:["cafe","restaurant","bar"],constructor:Restaurant},School:{types:["school"],constructor:School},Transport:{types:["train_station","subway_station","bus_station"],constructor:Transport}},d={},e=10;Object.keys(c).forEach(function(f){d[f]=ko.observableArray([]);var g=c[f].constructor;callApiWithRetry(placesService.nearbySearch.bind(placesService),{location:{lat:a.location().lat(),lng:a.location().lng()},radius:1500,types:c[f].types},function(a,c){if(c==google.maps.places.PlacesServiceStatus.OK){var h=0;a.forEach(function(a){if(e>h){var c=new g(a);c.label(b[h++%b.length]),d[f].push(new ko.observable(c))}})}},google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT)}),a.places=ko.observable(d),a.categories=ko.observable(Object.keys(a.places()).sort()),a.filter=ko.observable(""),a.selectedPlaces=ko.observable({}),a.categories().forEach(function(b){a.selectedPlaces()[b]=ko.computed(function(){var c=a.filter().toLowerCase();return ko.utils.arrayFilter(a.places()[b](),function(a){return a().name().toLowerCase().indexOf(c)>=0})})}),a.wikiArticles=ko.observableArray([]);var f=3,g="https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=Balham,London&prop=revisions&rvprop=content&srlimit=5&format=json";$.ajax(g,{dataType:"jsonp",headers:{"Api-User-Agent":"Joels Udacity Test Page/1.0"},success:function(b,c,d){$.each(b.query.search,function(b,c){a.wikiArticles().length<f&&a.wikiArticles.push(ko.observable(new WikiArticle(c)))})}}),a.theGuardianArticles=ko.observableArray([]);var h="http://content.guardianapis.com/search?q=Balham%2C%20London&api-key=5fsppuexyp2szbq8cyvx8vtq";$.ajax(h,{dataType:"jsonp",success:function(b,c,d){$.each(b.response.results,function(b,c){a.theGuardianArticles().length<f&&a.theGuardianArticles.push(ko.observable(new theGuardianArticle(c)))})}})};window.addEventListener("load",function(){placesService=new google.maps.places.PlacesService(document.getElementById("places-attribution")),mapsGeocoder=new google.maps.Geocoder,ko.applyBindings(new ViewModel,document.getElementById("container"));var a=new Slideout({panel:document.getElementById("panel"),menu:document.getElementById("menu"),side:"left",padding:256,tolerance:70});$("#toggle-button").click(function(){a.toggle()})});