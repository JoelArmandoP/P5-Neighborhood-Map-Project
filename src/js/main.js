'use strict';

// Google places service
var placesService = null;
var mapsGeocoder = null;

// We may be doing too many requests in one go.
// Wrapper function to retry API call with exponential back-off on specific status.
function callApiWithRetry(apiFunction, request, callback, retryOn) {
    var attempt = 0;
    var maxAttempts = 5;
    var timeout = 300;
    var f = function (result, status) {
        if (status == retryOn && attempt++ < maxAttempts) {
            setTimeout(function () { apiFunction(request, f); }, timeout);
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
    self.detailsValid = false;
    self.data = ko.observable(data);
    self.name = ko.computed(function () { return 'name' in self.data() ? self.data().name : ''; });
    self.address = ko.computed(function () { return 'formatted_address' in self.data() ? self.data().formatted_address : ''; });
    self.url = ko.computed(function () { return 'website' in self.data() ? self.data().website : ''; });
    self.location = ko.observable(data.geometry.location);
    self.label = ko.observable('');
    self.mapIconImageUrl = ko.computed(function () { return 'icon' in self.data() ? self.data().icon : null;});
    // Use icon from Places service
    self.mapIconImage = ko.computed(function () {
        return {
            url: self.mapIconImageUrl(),
            scaledSize: new google.maps.Size(20, 20),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(0, 0)
        };
    });
    // Reference to the function to show InfoWindow in marker
    self.showInfoWindow = function () {};
}
// If details haven been fetched yet, call Places API to replace Place Search Results object in self.data() with Place Details Result object.
PointOfInterest.prototype.fetchDetails = function () {
    var self = this;
    if (!self.detailsValid) {
        callApiWithRetry(
            placesService.getDetails.bind(placesService), {
                placeId: self.data().place_id
            },
            function (result, status) {
                if (status == google.maps.places.PlacesServiceStatus.OK) {
                    self.data(result);
                }
            },
            google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT);
        self.detailsValid = true;
    }
};

// Constructor for Schools
function School(data) {
    var self = this;
    PointOfInterest.call(self, data);
}
School.prototype = Object.create(PointOfInterest.prototype);
// Assign a School template
School.prototype.infoWindowTemplateId = 'school-info-window-template';

// Constructor for Restaurants
function Restaurant(data) {
    var self = this;
    PointOfInterest.call(self, data);
    self.rating = ko.computed(function () { return 'rating' in self.data() ? self.data().rating : 'none'; });
}
Restaurant.prototype = Object.create(PointOfInterest.prototype);
Restaurant.prototype.infoWindowTemplateId = 'restaurant-info-window-template';

// Constructor for Transport
function Transport(data) {
    var self = this;
    PointOfInterest.call(self, data);
}
Transport.prototype = Object.create(PointOfInterest.prototype);
Transport.prototype.infoWindowTemplateId = 'transport-info-window-template';

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
function setUpMapDataBinding() {
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
        map.neighborhoodMapInfoWindow = null;

        // create markers for each place in the selectedPlaces observable.
        viewModel.categories().forEach(function (k) {
            viewModel.selectedPlaces()[k]().forEach(function (p) {
                // Create the marker in the map
                if('lat' in p().location()) {
                    var marker = new MarkerWithLabel({
                        position: p().location(),
                        map: map,
                        title: p().name(),
                        icon: p().mapIconImage(),
                        labelContent: p().label(),
                        labelAnchor: new google.maps.Point(3, -20),
                        labelClass: "labels",
                        labelStyle: {opacity: 0.75}
                    });
                    // Create infoWinddow to display detailed info about the place
                    var content = document.getElementById(p().infoWindowTemplateId).cloneNode(true);
                    ko.applyBindings(p, content);
                    var infoWindow = new google.maps.InfoWindow({
                        content: content
                    });

                    // Create function to open infoWindow on demand
                    p().showInfoWindow = function () {
                        if (map.neighborhoodMapInfoWindow && map.neighborhoodMapInfoWindow.getMap()) {
                            map.neighborhoodMapInfoWindow.close();
                        }
                        p().fetchDetails();
                        infoWindow.open(map, marker);
                        map.neighborhoodMapInfoWindow = infoWindow;

                        //Animate the marker
                        marker.setAnimation(google.maps.Animation.BOUNCE);
                        setTimeout(function () { marker.setAnimation(null); }, 800);
                    };

                    // Configure marker to open infoWindow on click
                    google.maps.event.addListener(marker, 'click', p().showInfoWindow);
                }
            });
        });
    }
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
    // Dictionary of categories to place types
    var placeTypes = {
        'Restaurant': {
            types: ['cafe', 'restaurant', 'bar'],
            constructor: Restaurant
        },
        'School': {
            types: ['school'],
            constructor: School
        },
        'Transport': {
            types: ['train_station', 'subway_station', 'bus_station'],
            constructor: Transport
        }
    };

    // Create places as a map from category to ko.observableArray of PointOfInterest
    var places = {};
    if (placesService) {
        var placesPerCategory = 10;
        Object.keys(placeTypes).forEach(function (category) {
            places[category] = ko.observableArray([]);
            var constructor = placeTypes[category].constructor;
            callApiWithRetry(
                placesService.nearbySearch.bind(placesService), {
                    location: { lat: self.location().lat(), lng: self.location().lng() },
                    radius: 1500,
                    types: placeTypes[category].types
                },
                function (results, status) {
                    if (status == google.maps.places.PlacesServiceStatus.OK) {
                        var count = 0;
                        results.forEach(function (placeData) {
                            if (count < placesPerCategory) {
                                var place = new constructor(placeData);
                                place.label(labels[count++ % labels.length]);
                                places[category].push(new ko.observable(place));
                            }
                        });
                    }
                },
                google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT);
        });
    }
    self.places = ko.observable(places);

    // Alphabetically sorted list of all categories found.
    self.categories = ko.observable(Object.keys(self.places()).sort());

    // Only places that contain the text in self.filter will be displayed.
    self.filter = ko.observable("");

    // Places by category filtered by self.filter
    self.selectedPlaces = ko.observable({});
    self.categories().forEach(function (k) {
        self.selectedPlaces()[k] = ko.computed(function () {
            var filter = self.filter().toLowerCase();
            return ko.utils.arrayFilter(self.places()[k](), function (p) {
                return p().name().toLowerCase().indexOf(filter) >= 0;
            });
        });
    });

    // Array of Wikipedia articles
    self.wikiArticles = ko.observableArray([]);
    var maxArticles = 3;
    // End point for Wikipedia
    var wikiUrl = 'https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=Balham,London&prop=revisions&rvprop=content&srlimit=5&format=json';
    // Error message from Wikipedia access attempt
    self.wikiError = ko.observable('');
    // A setTimeout() that the successful call cancels
    var wikiRequestTimeout = setTimeout(function() {
        self.wikiError('Failed to get Wikipedia resources');
    }, 8000);
    // Do the query to Wikipedia
    $.ajax(wikiUrl, {
        dataType: 'jsonp',
        headers: { 'Api-User-Agent': 'Joels Udacity Test Page/1.0' },
        success: function (data, textStatus, jqXHR) {
            $.each(data.query.search, function (index, item) {
                if (self.wikiArticles().length < maxArticles) {
                    self.wikiArticles.push(ko.observable(new WikiArticle(item)));
                }
            });
            clearTimeout(wikiRequestTimeout);
        }
    });
    // Array of The Guardian articles
    self.theGuardianArticles = ko.observableArray([]);
    // Array of The Guardian articles
    var theGuardianUrl = 'http://content.guardianapis.com/search?q=Balham%2C%20London&api-key=5fsppuexyp2szbq8cyvx8vtq';
    // Error message from The Guardian access attempt
    self.guardianError = ko.observable('');
    // A setTimeout() that the successful call cancels
    var theGuardianRequestTimeout = setTimeout(function() {
        self.guardianError('Failed to get news from The Guardian');
    }, 8000);
    //Do the query to The Guardian
    $.ajax(theGuardianUrl, {
        dataType: 'jsonp',
        success: function (data, textStatus, jqXHR) {
            $.each(data.response.results, function (index, item) {
                if (self.theGuardianArticles().length < maxArticles) {
                    self.theGuardianArticles.push(ko.observable(new theGuardianArticle(item)));
                }
            });
            clearTimeout(theGuardianRequestTimeout);
        }
    });

};

// Get the page running!
window.addEventListener('load', function () {
    // Create Google Maps service if script was loaded
    if (typeof google !== 'undefined') {
        placesService = new google.maps.places.PlacesService(document.getElementById('places-attribution'));
        mapsGeocoder = new google.maps.Geocoder();
        setUpMapDataBinding();
    }
    if (typeof ko !== 'undefined') {
        ko.applyBindings(new ViewModel(), document.getElementById('container'));
    }
    // Create slideout menu if script was loaded
    if (typeof Slideout !== 'undefined') {
        var slideout = new Slideout({
            'panel': document.getElementById('panel'),
            'menu': document.getElementById('menu'),
            'side': 'left',
            'padding': 256,
            'tolerance': 70
        });
        $('#toggle-button').click(function () {
            slideout.toggle();
        });
    }
});
