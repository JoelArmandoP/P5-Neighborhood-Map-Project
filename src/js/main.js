'use strict';

// Google places service
var placesService = null;
var mapsGeocoder = null; 

// We may be doing too many requests in one go.
// Wrapper function to retry API call after delay on specific status.
function callApiWithRetry(apiFunction, request, callback, retryOn) {
    var attempt = 0;
    var f = function (result, status) {
        if (status == retryOn && attempt++ < 3) {
            setTimeout(function() { apiFunction(request, f); }, 2000);
        } else {
            callback(result, status);
        }
    };
    apiFunction(request, f);
}

// Constructor for PointOfInterest
function PointOfInterest(data) {
    var self = this;
    self.data = ko.observable(data);
    self.name = ko.computed(function () { return 'name' in self.data() ? self.data().name : ''; });
    self.address = ko.computed(function () { return 'address' in self.data() ? self.data().address : ''; });
    self.url = ko.computed(function () { return 'url' in self.data() ? self.data().url : ''; });
    // Look up address in geocoder API
    self.location = ko.observable({});
    callApiWithRetry(
        mapsGeocoder.geocode.bind(mapsGeocoder),
        { 'address': self.address() },
        function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                self.location(results[0].geometry.location);
            }
        },
        google.maps.GeocoderStatus.OVER_QUERY_LIMIT);
    self.placesInfo = ko.observable({});
    ko.computed(function(){
        if ('lat' in self.location()) {
            var request = {
                location: self.location(),
                radius: '1',
                name: self.name()
            };
            callApiWithRetry(
                placesService.nearbySearch.bind(placesService), request,
                function(results, status) {
                    if (status == google.maps.places.PlacesServiceStatus.OK) {
                        self.placesInfo(results[0]);
                    }
                },
                google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT);
        };
    });
    self.placesDetails = ko.observable({});
    ko.computed(function(){
        if ('place_id' in self.placesInfo()) {
            var request = {
                placeId: self.placesInfo().place_id
            };
            callApiWithRetry(
                placesService.getDetails.bind(placesService), request,
                function(place, status) {
                    if (status == google.maps.places.PlacesServiceStatus.OK) {
                        self.placesDetails(place);
                    }
                },
                google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT);
        };
    });

}

PointOfInterest.prototype.setMapLabel = function(label) {
    this.label = ko.observable(label);
}

// Constructor for Schools
function School(data) {
    var self = this;
    PointOfInterest.call(self, data);
    self.level = ko.computed(function () { return 'level' in self.data() ? self.data().level : ''; });
    self.gender = ko.computed(function () { return 'gender' in self.data() ? self.data().gender : ''; });
    self.kind = ko.computed(function () { return 'kind' in self.data() ? self.data().kind : ''; });
    self.faith = ko.computed(function () { return 'faith' in self.data() ? self.data().faith : ''; });
}
School.prototype = Object.create(PointOfInterest.prototype);
School.prototype.infoWindowTemplateId = 'school-info-window-template';

// Constructor for Restaurants
function Restaurant(data) {
    var self = this;
    PointOfInterest.call(self, data);
    self.foodType = ko.computed(function () { return 'foodType' in self.data() ? self.data().foodType : ''; });
    self.rating = ko.computed(function() { return 'rating' in self.placesInfo() ? self.placesInfo().rating : 'none'; });
}
Restaurant.prototype = Object.create(PointOfInterest.prototype);
Restaurant.prototype.infoWindowTemplateId = 'restaurant-info-window-template';

// Constructor for Wikipedia articles
function WikiArticle(item) {
    var self = this;
    self.data = ko.observable(item);
    this.title = ko.computed(function () { return 'title' in self.data() ? self.data().title : 'Untitled'; });
    this.snippet = ko.computed(function () { return 'snippet' in self.data() ? self.data().snippet.replace(/<\/?[^>]+(>|$)/g, "") : ''; });
    this.url = ko.computed(function () { return 'title' in self.data() ? 'https://en.wikipedia.org/wiki/' + self.data().title : ''; });
}

// Constructor for The Guardian articles

function theGuardianArticle(item) {
    var self = this;
    self.data = ko.observable(item);
    this.title = ko.computed(function () { return 'webTitle' in self.data() ? self.data().webTitle : 'Untitled'; });
    this.url = ko.computed(function () { return 'webUrl' in self.data() ? self.data().webUrl : ''; });
}

// JSON  places
var places = {
    'schools' : {
        'constructor': School,
        'label': 'Schools',
        'list': [{
                'name': 'Chestnut Grove Academy',
                'address': '45 Chestnut Grove, London SW12 8JZ',
                'url': 'http://www.chestnutgrove.wandsworth.sch.uk/',
                'level' : ['Secondary'],
                'gender' : 'Mixed',
                'kind' :  'Academy',
                'faith' : 'inter/non-denominational'
            }, {
                'name': 'London Steiner School',
                'address': '9 Weir Road, London SW12 0LT',
                'url': 'http://waldorflondon.co.uk/',
                'level' : ['Primary', 'Secondary'],
                'gender' : 'Mixed',
                'kind' :  'Independent',
                'faith' : 'inter/non-denominational',
            }, {
                'name': 'Oak Lodge School',
                'address': '101 Nightingale Lane, London SW12 8NA',
                'url': 'http://www.oaklodge.wandsworth.sch.uk',
                'level' : ['Secondary'],
                'gender' : 'Mixed',
                'kind' :  'Independent',
                'faith' : 'inter/non-denominational'
            }, {
                'name': 'Ernest Bevin',
                'address': 'Beechcroft Road, Tooting, London, SW17 7DF',
                'url': 'http://www.ernestbevin.org.uk/',
                'level' : ['Secondary'],
                'gender' : 'boys',
                'kind' :  'Academy',
                'faith' : 'inter/non-denominational',
            }, {
                'name': 'St Francis Xavier (SFX) 6th Form College',
                'address': '10 Malwood Road, London SW12 8EN',
                'url': 'http://www.sfx.ac.uk/',
                'level' : 'College',
                'gender' : 'Mixed',
                'kind' :  'College',
                'faith' : 'Roman Catholic',
            }]
    },
    'restaurants': {
        'constructor': Restaurant,
        'label': 'Restaurants',
        'list': [{
                'name': 'Lamberts',
                'address':'2 Station Parade, Balham High Rd, London SW12 9AZ',
                'url': 'http://www.lambertsrestaurant.com/',
                'foodType': 'British'
            }, {
                'name': 'Gurkhas Diner',
                'address':'1 The Boulevard, London SW17 7BW',
                'url': 'http://www.gurkhasdiner.co.uk/',
                'foodType': 'Nepalese'
            }, {
                'name': 'The Honest Italian',
                'address':'3 Balham Station Rd, London SW12 9AZ',
                'url': 'http://thehonestitalian.com/',
                'foodType': 'Italian'
            }, {
                'name': 'Chez Bruce',
                'address':'2 Bellevue Rd, Wandsworth Common, London SW17 7EG',
                'url': 'http://www.chezbruce.co.uk/',
                'foodType': 'French'
            }, {
                'name': 'The Georgian',
                'address':'27 Balham Hill, London SW12 9DX',
                'url': 'http://www.georgianrestaurant.co.uk/',
                'foodType': 'Georgian'
            }]
    }
};

// Custom binding for maps.
ko.bindingHandlers.map = {
    update: function (elem, valueAccesor, allBindingsAccesor, viewModel) {
        var location = ko.utils.unwrapObservable(valueAccesor());
        var latLng = new google.maps.LatLng(
            ko.utils.unwrapObservable(location.lat),
            ko.utils.unwrapObservable(location.lng));
        var mapOptions = {
            center: latLng,
            scrollwheel: false,
            zoom: 15
        };
        var map = new google.maps.Map(elem, mapOptions);

        viewModel.categories().forEach(function(k) {
            viewModel.selectedPlaces()[k]().forEach(function(p) {
                if('lat' in p().location()) {
                    var marker = new google.maps.Marker({
                        position: p().location(),
                        map: map,
                        title: p().name(),
                        label: p().label()
                    });
                    /* infoWindows are the little helper windows that open when you click
                    or hover over a pin on a map. They usually contain more information
                    about a location. */
                    var content = document.getElementById(p().infoWindowTemplateId).cloneNode(true);
                    ko.applyBindings(p, content);
                    var infoWindow = new google.maps.InfoWindow({
                        content: content
                    });
                    // Opens an infowindow when a map marker is clicked
                    google.maps.event.addListener(marker, 'click', function() {
                        infoWindow.open(map, marker);
                        //Animate the marker
                        marker.setAnimation(google.maps.Animation.BOUNCE);
                        setTimeout(function() {marker.setAnimation(null)},800);
                    });
                }
            })
        });
    }
};

var ViewModel = function () {
    var self = this;
    // Labels to identify markers in the map
    var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var labelIndex = 0;
    // Only places that contain the text in self.filter will be displayed.
    self.filter= ko.observable("");
    // Alphabetically sorted list of all categories in the JSON.
    self.categories = ko.observable(Object.keys(places).sort());
    // All places in the JSON by category
    self.places = ko.observable({});
    self.categories().forEach(function(k) {
        self.places()[k] = ko.observableArray([]);
        var constructor = places[k].constructor;
        places[k].list.forEach(function(p) {
            var place = new constructor(p);
            place.setMapLabel(labels[labelIndex++ % labels.length]);
            self.places()[k].push(ko.observable(place));
        });
    });
    // Places by category filtered by self.filter
    self.selectedPlaces = ko.observable({});
    self.categories().forEach(function(k) {
        self.selectedPlaces()[k] = ko.computed(function() {
            var filter = self.filter().toLowerCase();
            return ko.utils.arrayFilter(self.places()[k](), function(p) {
                return p().name().toLowerCase().indexOf(filter) >= 0;
            });
        })
    });
    // Coordinates where to center the map
    self.location = ko.observable({
        lat: ko.observable(51.442645),
        lng: ko.observable(-0.152782)});
    // Array of Wikipedia articles
    self.wikiArticles = ko.observableArray([]);
    var maxArticles = 3;
    // End point for Wikipedia
    var wikiUrl = 'https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=Balham,London&prop=revisions&rvprop=content&srlimit=5&format=json';
    // Do the query to Wikipedia
    $.ajax(wikiUrl, {
        dataType: 'jsonp',
        headers: { 'Api-User-Agent': 'Joels Udacity Test Page/1.0' },
        success: function(data, textStatus, jqXHR) {
            $.each(data.query.search, function(index, item) {
                if (self.wikiArticles().length < maxArticles) {
                    self.wikiArticles.push(ko.observable(new WikiArticle(item)));
                }
            });
        }
    });
    // Array of The Guardian articles
    self.theGuardianArticles = ko.observableArray([]);

    // Array of The Guardian articles
    var theGuardianUrl = 'http://content.guardianapis.com/search?q=Balham%2C%20London&api-key=5fsppuexyp2szbq8cyvx8vtq';

    //Do the query to The Guardian
    $.ajax(theGuardianUrl, {
        dataType: 'jsonp',
        success: function(data, textStatus, jqXHR) {
            $.each(data.response.results, function(index, item) {
                if (self.theGuardianArticles().length < maxArticles) {
                    self.theGuardianArticles.push(ko.observable(new theGuardianArticle(item)));    
                }
            })
        }

    })

}




// Get the page running!
window.addEventListener('load', function () {
    placesService = new google.maps.places.PlacesService(document.getElementById('places-attribution'));
    mapsGeocoder = new google.maps.Geocoder();
    ko.applyBindings(new ViewModel(), document.getElementById('container'));
});
