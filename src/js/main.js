'use strict';
function initMap() {
  // Create a map object and specify the DOM element for display.
  var map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 51.442645, lng: -0.152782},
    scrollwheel: false,
    zoom: 13
  });
}