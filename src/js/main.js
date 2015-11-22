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

// Constructor for Schools
function School(data) {
    PointOfInterest.call(this, data);
    this.level = ko.observable(data.level);
    this.gender = ko.observable(data.gender);
    this.kind = ko.observable(data.kind);
    this.faith = ko.observable(data.faith);
}
School.prototype = Object.create(PointOfInterest.prototype);

// Constructor for Restaurantes
function Restaurant(data) {
    PointOfInterest.call(this, data);
    this.foodType = ko.observable(data.foodType);
}
Restaurant.prototype = Object.create(PointOfInterest.prototype);

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
            zoom: 13
        };
        var map = new google.maps.Map(elem, mapOptions);

        viewModel.categories().forEach(function(k) {
            viewModel.selectedPlaces()[k]().forEach(function(p) {
                console.log(p());
                var marker = new google.maps.Marker({
                    position: p().location(),
                    map: map,
                    title: p().name()
                });
            })
        });
    }
};

var ViewModel = function () {
    var self = this;
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
            self.places()[k].push(ko.observable(new constructor(p)));
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