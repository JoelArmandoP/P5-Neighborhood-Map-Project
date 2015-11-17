'use strict';
function initMap() {
  // Create a map object and specify the DOM element for display.
  var map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 51.442645, lng: -0.152782},
    scrollwheel: false,
    zoom: 13
  });
}

var places = {
    'schools': [{
        'name': 'Chestnut Grove Academy',
        'level' : ['Secondary'],
        'gender' : 'Mixed',
        'type' :  'Academy',
        'faith' : 'inter/non-denominational',
        'address': '45 Chestnut Grove, London SW12 8JZ',
        'url': 'http://www.chestnutgrove.wandsworth.sch.uk/'
    },
    {
        'name': 'London Steiner School',
        'level' : ['Primary', 'Secondary'],
        'gender' : 'Mixed',
        'type' :  'Independent',
        'faith' : 'inter/non-denominational',
        'address': '9 Weir Road, London SW12 0LT',
        'url': 'http://waldorflondon.co.uk/'
    },
    {
        'name': 'Oak Lodge School',
        'level' : ['Secondary'],
        'gender' : 'Mixed',
        'type' :  'Independent',
        'faith' : 'inter/non-denominational',
        'address': '101 Nightingale Lane, London SW12 8NA',
        'url': 'http://www.oaklodge.wandsworth.sch.uk'
    },
    {
        'name': 'Ernest Bevin',
        'level' : ['Secondary']
        'gender' : 'boys',
        'type' :  'Academy',
        'faith' : 'inter/non-denominational',
        'address': 'Beechcroft Road, Tooting, London, SW17 7DF',
        'url': 'http://www.ernestbevin.org.uk/'
    },
    {
        'name': 'St Francis Xavier (SFX) 6th Form College',
        'level' : 'College',
        'gender' : 'Mixed',
        'type' :  'College',
        'faith' : 'Roman Catholic',
        'address': '10 Malwood Road, London SW12 8EN',
        'url': 'http://www.sfx.ac.uk/'
    }],
    'restaurantes': [
    {
        'name': 'Lamberts',
        'foodType': 'British',
        'address':'2 Station Parade, Balham High Rd, London SW12 9AZ',
        'url': 'http://www.lambertsrestaurant.com/'
    },
    {
        'name': 'Gurkhas Diner',
        'foodType': 'Nepalese',
        'address':'1 The Boulevard, London SW17 7BW',
        'url': 'http://www.gurkhasdiner.co.uk/'
    },
    {
        'name': 'The Honest Italian',
        'foodType': 'Italian',
        'address':'3 Balham Station Rd, London SW12 9AZ',
        'url': 'http://thehonestitalian.com/'
    },
    {
        'name': 'Chez Bruce',
        'foodType': 'French',
        'address':'2 Bellevue Rd, Wandsworth Common, London SW17 7EG',
        'url': 'http://www.chezbruce.co.uk/'
    },
    {
        'name': 'The Georgian',
        'foodType': 'Georgian',
        'address':'27 Balham Hill, London SW12 9DX',
        'url': 'http://www.georgianrestaurant.co.uk/'
    }]
}
