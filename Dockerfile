FROM node:lts-jessie-slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm install && npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 3000

# override some config defaults with values that will work better for docker
ENV ST_MQTT_BROKER_URL="mqtts://test.mosquitto.org" \
    ST_MQTT_BROKER_PORT="8883" \
    ST_MQTT_BROKER_USER="" \
    ST_MQTT_BROKER_PASSWD="" \
    ST_MQTT_POSITION_TOPIC="owntracks/"

RUN cp config.default.js config.js && \
    cp public/geojson/us-states_blank.geojson public/geojson/us-states.geojson && \
    cp public/geojson/countries_blank.geojson public/geojson/countries.geojson

CMD [ "npm", "start" ]
