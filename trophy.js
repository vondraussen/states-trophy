var inside = require('point-in-polygon');
var fs = require('fs');

var us_states_file = 'public/geojson/us-states.geojson';
var countries_file = 'public/geojson/countries.geojson';

var updateCountry = function (loc) {
  countries = JSON.parse(fs.readFileSync(countries_file, 'utf8'));

  // for each polygon of a country we have to check if our
  // position is in one of those polygons
  countries.features.forEach(country => {
    let poltype = country.geometry.type;
    let polygons = country.geometry.coordinates;
    let polyArr;

    for (let i = 0; i < polygons.length; i++) {
      if (poltype === 'MultiPolygon') {
        polyArr = polygons[i][0];
      } else {
        polyArr = polygons[0];
      }

      if (inside([loc.lon, loc.lat], polyArr)) {
        console.log('You`re in ' + country.properties.ADMIN);
        if (!country.properties.visited || !country.properties.active_stay) {
          country.properties.visited = 1;
          country.properties.active_stay = true;

          // reset current highlighted country
          countries.features.forEach(countr => {
            if (countr.properties.active_stay &&
                countr.properties.ADMIN !== country.properties.ADMIN) {
              countr.properties.active_stay = false;
            }
          });

          fs.writeFileSync(countries_file, JSON.stringify(countries));
        }
      }
    }
  });
}

var updateUsState = function (loc) {
  usStates = JSON.parse(fs.readFileSync(us_states_file, 'utf8'));

  // for each polygon of a state we have to check if our
  // position is in one of those polygons
  usStates.features.forEach(state => {
    let poltype = state.geometry.type;
    let polygons = state.geometry.coordinates;
    let polyArr;

    for (let i = 0; i < polygons.length; i++) {
      if (poltype === 'MultiPolygon') {
        polyArr = polygons[i][0];
      } else {
        polyArr = polygons[0];
      }

      if (inside([loc.lon, loc.lat], polyArr)) {
        console.log('You`re in ' + state.properties.name);
        if(!state.properties.visited || !state.properties.active_stay) {
          state.properties.visited = 1;
          state.properties.active_stay = true;

          // reset current highlighted state
          usStates.features.forEach(usState => {
            if (usState.properties.active_stay &&
                usState.properties.name != state.properties.name) {
              usState.properties.active_stay = false;
            }
          });

          fs.writeFileSync(us_states_file, JSON.stringify(usStates));
        }
      }
    }
  });
}

async function onPosition(loc) {
  updateUsState(loc);
  updateCountry(loc);
}

module.exports.onPosition = onPosition;