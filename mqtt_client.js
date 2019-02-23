var mqtt = require('mqtt')

try {
    config = require('./config');
} catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
        console.log('No custom config.js found, loading config.default.js');
    } else {
        console.error('Unable to load config.js!');
        console.error('Error is:');
        console.log(e);
        process.exit(1);
    }
    config = require('./config.default');
}

var client = mqtt.connect(config.mqtt.host+':'+config.mqtt.port, {
    username: config.mqtt.user,
    password: config.mqtt.passwd })

client.on('connect', function () {
    client.subscribe(config.mqtt.topic, function (err) {
        if (!err) {
            console.log('connected to broker')
        }
    })
})

client.on('message', function (topic, message) {
    // message is Buffer
    var position = JSON.parse(message)
    client.emit('position', { 'lat': position.lat, 'lon': position.lon})
})

module.exports = client;
