
var inside = require('point-in-polygon');

var fs = require('fs');
var request = require('request');

var us_states_file = 'public/geojson/us-states.geojson';
var countries_file = 'public/geojson/countries.geojson';
var geojson;

var getState = function (location) {
  var msg = {
    lon: location.lon,
    lat: location.lat,
    apiurl: "https://api.opencagedata.com/geocode/v1/json",
    apikey: config.opencage.apikey };

  msg.url = msg.apiurl + '?key=' + msg.apikey +
    '&q=' + msg.lat + '%2C' + msg.lon;

  // geojson = JSON.parse(fs.readFileSync(countries_file, 'utf8'));
  // // reset current highlighted state
  // geojson.features.forEach(element => {
  //   if (element.properties.active_stay) {
  //     element.properties.active_stay = false;
  //   }
  // });
  // for (const country in object) {
  //   if (object.hasOwnProperty(key)) {
  //     const element = object[key];
      
  //   }
  // }

  return new Promise(resolve => {
    request(msg.url, {
      json: true
    }, (err, res, body) => {
      if (err) {
        return console.log(err);
      }
      if (body.results[0]) {
        console.log(body.results[0].components);
        resolve(body.results[0].components.state);
      } else {
        console.log(body);
        resolve('UNKNOWN');
      }
    });
  });
}

async function onPosition(location) {
  var state;
  var newEncounter;

  try {
    state = await getState(location);
  } catch (e) {
    state = null;
    console.log('geoip api error');
  }
  geojson = JSON.parse(fs.readFileSync(us_states_file, 'utf8'));

  // reset current highlighted state
  geojson.features.forEach(element => {
    if (element.properties.active_stay) {
      element.properties.active_stay = false;
    }
  });

  // set state
  geojson.features.forEach(element => {
    if (state == element.properties.name) {
      console.log("You're in " + state)
      element.properties.active_stay = true;
      if (element.properties.visited != true) {
        console.log("That's a new one!")
        newEncounter = true;
        element.properties.visited = true;
      }
    }
  });
  if (newEncounter) {
    fs.writeFileSync(geojson_file, JSON.stringify(geojson));
  }
}

module.exports.onPosition = onPosition;