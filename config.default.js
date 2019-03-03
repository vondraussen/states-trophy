'use strict';

module.exports = {
    mqtt: {
        host: process.env.ST_MQTT_BROKER_URL || 'mqtts://test.mosquitto.org',
        port: process.env.ST_MQTT_BROKER_PORT || '8883',
        user: process.env.ST_MQTT_BROKER_USER || 'user',
        passwd: process.env.ST_MQTT_BROKER_PASSWD || 'password',
        topic: process.env.ST_MQTT_POSITION_TOPIC || 'owntracks',
    }
};