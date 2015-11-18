'use strict';
function initMap() {
  // Create a map object and specify the DOM element for display.
  var map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 51.442645, lng: -0.152782},
    scrollwheel: false,
    zoom: 13
  });
}

function PointOfInterest(data) {
    this.name = ko.observable(data.name);
    this.address = ko.observable(data.address);
    this.url = ko.observable(data.url);
}

function School(data) {
    PointOfInterest.call(this, data);
    this.level = ko.observable(data.level);
    this.gender = ko.observable(data.gender);
    this.kind = ko.observable(data.kind);
    this.faith = ko.observable(data.faith);
}
School.prototype = Object.create(PointOfInterest.prototype);

function Restaurant(data) {
    PointOfInterest.call(this, data);
    this.foodType = ko.observable(data.foodType);
}
Restaurant.prototype = Object.create(PointOfInterest.prototype);

var schoolData = [
    {
        'name': 'Chestnut Grove Academy',
        'address': '45 Chestnut Grove, London SW12 8JZ',
        'url': 'http://www.chestnutgrove.wandsworth.sch.uk/',
        'level' : ['Secondary'],
        'gender' : 'Mixed',
        'kind' :  'Academy',
        'faith' : 'inter/non-denominational'
    },
    {
        'name': 'London Steiner School',
        'address': '9 Weir Road, London SW12 0LT',
        'url': 'http://waldorflondon.co.uk/',
        'level' : ['Primary', 'Secondary'],
        'gender' : 'Mixed',
        'kind' :  'Independent',
        'faith' : 'inter/non-denominational',
    },
    {
        'name': 'Oak Lodge School',
        'address': '101 Nightingale Lane, London SW12 8NA',
        'url': 'http://www.oaklodge.wandsworth.sch.uk',
        'level' : ['Secondary'],
        'gender' : 'Mixed',
        'kind' :  'Independent',
        'faith' : 'inter/non-denominational'
    },
    {
        'name': 'Ernest Bevin',
        'address': 'Beechcroft Road, Tooting, London, SW17 7DF',
        'url': 'http://www.ernestbevin.org.uk/',
        'level' : ['Secondary'],
        'gender' : 'boys',
        'kind' :  'Academy',
        'faith' : 'inter/non-denominational',
    },
    {
        'name': 'St Francis Xavier (SFX) 6th Form College',
        'address': '10 Malwood Road, London SW12 8EN',
        'url': 'http://www.sfx.ac.uk/',
        'level' : 'College',
        'gender' : 'Mixed',
        'kind' :  'College',
        'faith' : 'Roman Catholic',
    }];

var restaurantData = [{
    'name': 'Lamberts',
    'address':'2 Station Parade, Balham High Rd, London SW12 9AZ',
    'url': 'http://www.lambertsrestaurant.com/',
    'foodType': 'British'
    },
    {
    'name': 'Gurkhas Diner',
    'address':'1 The Boulevard, London SW17 7BW',
    'url': 'http://www.gurkhasdiner.co.uk/',
    'foodType': 'Nepalese'
    },
    {
    'name': 'The Honest Italian',
    'address':'3 Balham Station Rd, London SW12 9AZ',
    'url': 'http://thehonestitalian.com/',
    'foodType': 'Italian'
    },
    {
    'name': 'Chez Bruce',
    'address':'2 Bellevue Rd, Wandsworth Common, London SW17 7EG',
    'url': 'http://www.chezbruce.co.uk/',
    'foodType': 'French'

    },
    {
    'name': 'The Georgian',
    'address':'27 Balham Hill, London SW12 9DX',
    'url': 'http://www.georgianrestaurant.co.uk/',
    'foodType': 'Georgian'
}];

var ViewModel = function () {
    var self = this;
    self.schools = ko.observableArray([]);
    schoolData.forEach(function(s) {
        self.schools.push(ko.observable(new School(s)));
    });
    self.restaurants = ko.observableArray([]);
    restaurantData.forEach(function(r) {
        self.restaurants.push(ko.observable(new Restaurant(r)));
    });

};





