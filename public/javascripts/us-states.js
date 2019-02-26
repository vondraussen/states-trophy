var maplayer = L.tileLayer.provider('Stamen.Toner');

var map = L.map('map',
    {
        center: [37.8, -96],
        zoom: 4,
        layers: [maplayer]
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
        color: 'grey',
        dashArray: '3',
        fillOpacity: getFillOpacity(feature.properties),
        fillColor: getFillColor(feature.properties)
    };
}

$.getJSON("geojson/us-states.geojson", function () {}).done(function (data) {
    L.geoJson(data, {style: style}).addTo(map);
});