# States Trophy Docker Container Setup
Provides a dynamic map of your discoveries (green and current state is red). Includes a list of all your discovered countries too. Just browse to http://example.com/countries

![Stamen.Toner](https://imgur.com/Rojcvnq.png)

You can use it together with [owntracks](https://owntracks.org) for iOS or Android.

## Docker Network Setup
``` bash
docker network create --driver bridge reverse_proxy
docker network create --driver bridge mqtt_net
```

## Start Proxy and Letsencrypt
``` bash
# start the revers proxy
docker run -d -p 80:80 -p 443:443 --restart always \
        --network=reverse_proxy --name nginx-proxy \
        -v $PWD/certs:/etc/nginx/certs:ro \
        -v /etc/nginx/vhost.d \
        -v /usr/share/nginx/html \
        -v /var/run/docker.sock:/tmp/docker.sock:ro \
        --label com.github.jrcs.letsencrypt_nginx_proxy_companion.nginx_proxy=true \
        jwilder/nginx-proxy

# start the companion
docker run -d --restart always --network=reverse_proxy \
        --name nginx-letsencrypt \
        --volumes-from nginx-proxy \
        -v $PWD/certs:/etc/nginx/certs:rw \
        -v /var/run/docker.sock:/var/run/docker.sock:ro \
        jrcs/letsencrypt-nginx-proxy-companion
```
The companion will create the Diffie-Hallman group which will take up to 15 minutes.
Check the container log for `Info: Diffie-Hellman group creation complete...` which indicates that it is done.

> You'll need a domain to get certs from letsencrypt. I think it is not working with just an IP address.

## Start the WebAPP
this will also create the certificates after some minutes.

**Replace the placeholders with your values.**
``` bash
# start webapp
docker run --restart always -e 
    -e ST_MQTT_BROKER_URL="mqtt://mqtt_broker" \
    -e ST_MQTT_BROKER_PORT='1883' \
    -e ST_MQTT_BROKER_USER='<user>' \
    -e ST_MQTT_BROKER_PASSWD='<password>' \
    -e ST_MQTT_POSITION_TOPIC='owntracks/<user>/<devid>' \
    -e "VIRTUAL_HOST=<domain>" \
    -e "LETSENCRYPT_EMAIL=<email>" \
    -e "LETSENCRYPT_HOST=<domain>" \
    --network=reverse_proxy \
    --name states_trophy \
    -v $PWD/states_trophy/geojson:/usr/src/app/public/geojson \
    -d mrhem/states-trophy

# connect to the mqtt bridge-network
docker network connect mqtt_net states_trophy
```
Initially you have to copy the plain geojson file in to the following folder (should be created automatically by docker). The file keeps the information about the US state borders and also if a state was visited or not.
``` bash
cd states_trophy/geojson
wget https://raw.githubusercontent.com/vondraussen/states-trophy/master/public/geojson/us-states_blank.geojson -O us-states.geojson
wget https://raw.githubusercontent.com/vondraussen/states-trophy/master/public/geojson/countries_blank.geojson -O countries.geojson
```
You can edit the file with a text editor in order to "activate" states manually. For example with **vim** or **vi**.
`vim states_trophy/geojson/us-states.geojson`
Use `/` to start a search. Type the name of a state e.q. `Montana` and hit enter. It will jump to the properties of the geojson feature (state). Change the `visited` property to `1` or `true`.

> The files are like the database of your discoveries. Consider a backup!

## Mosquitto MQTT
``` bash
# create the broker config
mkdir -p mosquitto/config
cat >mosquitto/config/mosquitto.conf <<EOF
allow_anonymous false
password_file /mosquitto/passwd
persistence true
persistence_location /mosquitto/data/
log_dest file /mosquitto/log/mosquitto.log

port 1883

listener 8883
cafile /mosquitto/certs/broker.ca
keyfile /mosquitto/certs/broker.key
certfile /mosquitto/certs/broker.crt

# websockets will be proxied by nginx
listener 8083
protocol websockets
EOF
```

Create user's and password's (e.q. user and webapp) for the broker. One will be used for owntracks on your phone and the other one will be used by the webapp.

*firs time call with -c will create a new password file*
``` bash
docker run -it -v $PWD/mosquitto:/mosquitto eclipse-mosquitto sh -c "mosquitto_passwd -c /mosquitto/passwd webapp"
```
*here without -c to append additional user*
``` bash
docker run -it -v $PWD/mosquitto:/mosquitto eclipse-mosquitto sh -c "mosquitto_passwd /mosquitto/passwd user"
```

change the permissions of the mosquitto folder
``` bash
sudo chown -R 1883 mosquitto
```

run the broker container

> Replace the \<placeholders\> with your values!
``` bash
docker run -d -p 8883:8883 --name mqtt_broker \
    --restart always --network=mqtt_net \
    -v $PWD/mosquitto/config/mosquitto.conf:/mosquitto/config/mosquitto.conf \
    -v $PWD/mosquitto/passwd:/mosquitto/passwd \
    -v $PWD/mosquitto/log/:/mosquitto/log \
    -v $PWD/mosquitto/data/:/mosquitto/data \
    -v $PWD/certs/<domain>.chain.pem:/mosquitto/certs/broker.ca \
    -v $PWD/certs/<domain>.crt:/mosquitto/certs/broker.crt \
    -v $PWD/certs/<domain>.key:/mosquitto/certs/broker.key \
    eclipse-mosquitto
```

## Tests
Test mqtt from command line (Fedora example)
``` bash
mosquitto_sub -d -L mqtts://<user>:<password>@<domain>:8883/<topic> --cafile /etc/pki/ca-trust/extracted/openssl/ca-bundle.trust.crt
```
