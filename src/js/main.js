'use strict';
// Constructor for PointOfInterest
function PointOfInterest(data) {
    var self = this;
    self.name = ko.observable(data.name);
    self.address = ko.observable(data.address);
    self.url = ko.observable(data.url);
    // Look up address in geocoder API
    self.location = ko.observable({});
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({'address': self.address()}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            self.location(results[0].geometry.location);
        }
    });
}

PointOfInterest.prototype.setMapLabel = function(label) {
    this.label = ko.observable(label);
}

PointOfInterest.prototype.infoWindowData = function() {
    return '<div class="name" data-bind="text: name"></div>' +
        '<div class="address" data-bind="text: address"></div>'+
        '<div class="url"><a data-bind="attr: { href: url }, text: url"></a></div>';
}

// Constructor for Schools
function School(data) {
    PointOfInterest.call(this, data);
    this.level = ko.observable(data.level);
    this.gender = ko.observable(data.gender);
    this.kind = ko.observable(data.kind);
    this.faith = ko.observable(data.faith);
}
School.prototype = Object.create(PointOfInterest.prototype);

School.prototype.infoWindowData = function() {
    return Object.getPrototypeOf(School.prototype).infoWindowData.call(this) +
    '<div class="level" data-bind="text: level"></div>'+
        '<div class="gender" data-bind="text: gender"></div>'+
        '<div class="kind" data-bind="text: kind"></div>' +
        '<div class="faith" data-bind="text: faith"></div>';
}

// Constructor for Restaurantes
function Restaurant(data) {
    var self = this;
    PointOfInterest.call(self, data);
    self.foodType = ko.observable(data.foodType);
    self.zagatId = ko.observable('');
    $.getJSON('https://maps.googleapis.com/maps/api/place/nearbysearch/json?location='+ self.location().lat + ',' +
                 self.location.lng + '&radius=1&key=AIzaSyAFoI4Tv2fTEgRhBSWn9UtWsJX2_J2-DLg', function(data) {
        self.zagatId(data.results[0].place_id);
        });

    self.zagatRating = ko.observable('none');
    $.getJSON('https://maps.googleapis.com/maps/api/place/details/json?callback=&placeid='+ self.zagatId() + '&key=AIzaSyAFoI4Tv2fTEgRhBSWn9UtWsJX2_J2-DLg', function(data) {
        var totalRating = 0;
        var countRating = 0;
        data.result.reviews.forEach(function (r) {
            totalRating += r.rating;
            countRating++;
        });
        if(countRating > 0) {
            self.zagatRating(totalRating/countRating);    
        }
    });
}
Restaurant.prototype = Object.create(PointOfInterest.prototype);

Restaurant.prototype.infoWindowData = function() {
    return Object.getPrototypeOf(Restaurant.prototype).infoWindowData.call(this) +
    '<div class="food-type" data-bind="text: foodType"></div>' +
    '<div class="zagat-rating" data-bind="text: zagatRating"></div>';
}

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
                    var content = $.parseHTML('<div class="maps-info-window">'+ p().infoWindowData() + '</div>')[0];
                    ko.applyBindings(p, content);
                    var infoWindow = new google.maps.InfoWindow({
                        content: content
                    });
                    // Opens an infowindow when a map marker is clicked
                    google.maps.event.addListener(marker, 'click', function() {
                        infoWindow.open(map, marker);
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
}