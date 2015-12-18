'use strict';

// Google places service
var placesService = null;
var mapsGeocoder = null; 

// We may be doing too many requests in one go.
// Wrapper function to retry API call after delay on specific status.
function callApiWithRetry(apiFunction, request, callback, retryOn) {
    var attempt = 0;
    var timeout = 300;
    var f = function (result, status) {
        if (status == retryOn && attempt++ < 5) {
            setTimeout(function() { apiFunction(request, f); }, timeout);
            timeout *= 2;
        } else {
            if (status == retryOn) {
                console.log("Giving up on:");
                console.log(request);
            }
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
    self.address = ko.computed(function () { return 'formatted_address' in self.data() ? self.data().formatted_address : ''; });
    self.url = ko.computed(function () { return 'url' in self.data() ? self.data().url : ''; });
    self.location = ko.computed(function () { return 'geometry' in self.data() ? self.data().geometry.location : null; });
    var mapIconImage = ko.computed(function () { return 'icon' in self.data() ? self.data().icon : null;});
    // Use icon from Places service
    self.iconImage = {
        url: mapIconImage(), // url
        scaledSize: new google.maps.Size(20, 20), // scale size
        origin: new google.maps.Point(0,0), // origin
        anchor: new google.maps.Point(0,0),// anchor 
    };
    self.showInfoWindow = function() {};
}

// Set the label to identify the point of interest in the map
PointOfInterest.prototype.setMapLabel = function(label) {
    this.label = ko.observable(label);
}
// Set a generic category
PointOfInterest.prototype.category = "Place";

// Constructor for Schools
function School(data) {
    var self = this;
    PointOfInterest.call(self, data);
}
School.prototype = Object.create(PointOfInterest.prototype);
// Assign a School template
School.prototype.infoWindowTemplateId = 'school-info-window-template';
// Assign School category
School.prototype.category = "Schools";

// Constructor for Restaurants
function Restaurant(data) {
    var self = this;
    PointOfInterest.call(self, data);
    self.rating = ko.computed(function() { return 'rating' in self.data() ? self.data().rating : 'none'; });
}
Restaurant.prototype = Object.create(PointOfInterest.prototype);
Restaurant.prototype.infoWindowTemplateId = 'restaurant-info-window-template';
Restaurant.prototype.category = "Restaurants";

// Constructor for Transport
function Transport(data) {
    var self = this;
    PointOfInterest.call(self, data);
}
Transport.prototype = Object.create(PointOfInterest.prototype);
Transport.prototype.infoWindowTemplateId = 'transport-info-window-template';
Transport.prototype.category = "Transport";


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
                // Create the marker in the map
                if('lat' in p().location()) {
                    var marker = new MarkerWithLabel({
                        position: p().location(),
                        map: map,
                        title: p().name(),
                        icon: p().iconImage,
                        labelContent: p().label(),
                        labelAnchor: new google.maps.Point(3, -20),
                        labelClass: "labels",
                        labelStyle: {opacity: 0.75}
                    });
                    // infoWindows contain more information about a place.
                    var content = document.getElementById(p().infoWindowTemplateId).cloneNode(true);
                    ko.applyBindings(p, content);
                    var infoWindow = new google.maps.InfoWindow({
                        content: content
                    });
                    
                    // Opens an infowindow when a map marker is clicked
                    p().showInfoWindow = function() {
                        if (infoWindow.getMap()) {
                            infoWindow.close();
                        } else {
                            infoWindow.open(map, marker);
                        }

                        //Animate the marker
                        marker.setAnimation(google.maps.Animation.BOUNCE);
                        setTimeout(function() {marker.setAnimation(null)},800);
                    };

                    google.maps.event.addListener(marker, 'click', p().showInfoWindow);
                }
            })
        });
    }
};

var ViewModel = function () {
    var self = this;
    // Coordinates where to center the map
    self.location = ko.observable({
        lat: ko.observable(51.442645),
        lng: ko.observable(-0.152782)});
    // Labels to identify markers in the map
    var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    labels.bold();
    var labelIndex = 0;
    // Dictionary of place types to constructor
    var placeTypes = {
        cafe: Restaurant,
        restaurant: Restaurant,
        bar: Restaurant,
        school: School,
        train_station: Transport,
        subway_station: Transport
    }

    // All places to display, by category
    var places = {};
    Object.keys(placeTypes).forEach(function (k) { places[new placeTypes[k]({}).category] = ko.observableArray([]); });
    self.places = ko.observable(places);

    // Get a list of relevant places from Google Places
    callApiWithRetry(
        placesService.radarSearch.bind(placesService), {
            location: { lat: self.location().lat(), lng: self.location().lng() },
            radius: 1000,
            rankBy: 'distance',
            types: Object.keys(placeTypes)
        },
        function(results, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                // Got list of places. Get details for each
                var parallel_queries = 4;
                var getDetailsAtIndex = function (index) {
                    if (index >= results.length) { return; }
                    var item = results[index];
                    callApiWithRetry(
                        placesService.getDetails.bind(placesService), {
                            placeId: item.place_id
                        },
                        function(result, status) {
                            if (status == google.maps.places.PlacesServiceStatus.OK) {
                                // Get details for a place
                                // Instantiate and add to category
                                var type = null;
                                $.each(result.types, function (i, t) {
                                    if (type === null && t in placeTypes) {
                                        type = t;
                                    }
                                });
                                var constructor = placeTypes[type];
                                var category = constructor.prototype.category;
                                if (type !== null && self.places()[category]().length < 10) {
                                    var place = new placeTypes[type](result);
                                    place.setMapLabel(labels[labelIndex++ % labels.length]);
                                    self.places()[category].push(ko.observable(place));
                                }
                            }
                            setTimeout(getDetailsAtIndex.bind(this, index+parallel_queries), 0);
                        },
                        google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT);
                };
                for (var i = 0; i < parallel_queries; i++) {
                    setTimeout(getDetailsAtIndex.bind(this, i), i*200);
                }
            }
        },
        google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT);

    // Alphabetically sorted list of all categories found.
    self.categories = ko.observable(Object.keys(self.places()).sort());

    // Only places that contain the text in self.filter will be displayed.
    self.filter = ko.observable("");

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
    // Create slideout menu
    var slideout = new Slideout({
        'panel': document.getElementById('panel'),
        'menu': document.getElementById('menu'),
        'side': 'left',
        'padding': 256,
        'tolerance': 70
    });
    $('#toggle-button').click(function() {
        slideout.toggle();
    });
});
