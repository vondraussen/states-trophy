var express = require('express');
var router = express.Router();

// states view
router.get('/', function(req, res, next) {
  res.render('us_states', { title: 'States-Trophy' });
});

// country view
router.get('/countries', function(req, res, next) {
  res.render('countries', { title: 'Country-Trophy' });
});

module.exports = router;
