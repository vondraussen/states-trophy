var mapUrl = 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png';
var mapAttribution = 'Wikimedia maps beta | Map data &copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap contributors</a>';

var wikimap = L.tileLayer(mapUrl,
    {
        attribution: mapAttribution
    });

var baseMaps = { "wikimap": wikimap };

var map = L.map('map',
    {
        center: [37.8, -96],
        zoom: 4,
        layers: [wikimap]
    });

function getStrokeColor(v) {
    return v > 0 ? 'red' :
        'white';
}

function getFillColor(v) {
    if (v.active_stay)
        return "red";

    if (v.visited) {
        return '#2ca25f';
    } else {
        return '#e5f5f9';
    }
}

function getFillOpacity(v) {
    if (v.active_stay)
        return 0.7;

    if (v.visited) {
        return 0.7;
    } else {
        return 0.1;
    }
}

function style(feature) {
    return {
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: getFillOpacity(feature.properties),
        fillColor: getFillColor(feature.properties)
    };
}

var statesData;
$.getJSON("geojson/us-states.geojson", function (json) {
    statesData = json;
}).done(function (data) {
    var geojson = L.geoJson(data, {
        style: style,
    }).addTo(map);
});