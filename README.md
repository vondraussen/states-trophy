# States Trophy Docker Container Setup
Provides a dynamic map of your discoveries (green and current state is red). 
![asd](https://imgur.com/f3zWbwr.png)

You can use it together with [owntracks](https://owntracks.org) for iOS or Android.

## Register for GEOIP Service
I'm using https://opencagedata.com/
sign up to get your API Key. The key will be necessary in a later step.

## Docker Network Setup
```
docker network create --driver bridge reverse_proxy
docker network create --driver bridge mqtt_net
```

## Start Proxy and Letsencrypt
```
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


## Start the WebAPP
this will also create the certificates after some minutes.

**Replace the placeholders with your values.**
```
# start webapp
docker run --restart always -e ST_CONFIG_OPENCAGEDATA_KEY='<your-own-opencage-api-key>' \
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
    -d mrhem/states-trophy

# connect to the mqtt bridge-network
docker network connect mqtt_net states_trophy
```

## Mosquitto MQTT
create a config folder
```
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

create user and password (e.q. user and webapp)
one will be used for owntracks on your phone and the otherone will be used by the webapp.

*firs time call with -c will create a new password file*
```
docker run -it -v $PWD/mosquitto:/mosquitto eclipse-mosquitto sh -c "mosquitto_passwd -c /mosquitto/passwd webapp"
```
*here without -c*
```
docker run -it -v $PWD/mosquitto:/mosquitto eclipse-mosquitto sh -c "mosquitto_passwd /mosquitto/passwd user"
```

change the permissions of the mosquitto folder
```
sudo chown -R 1883 mosquitto
```

run the broker container

**Replace the placeholders with your values.**
```
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
```
mosquitto_sub -d -L mqtts://<user>:<password>@<domain>:8883/<topic> --cafile /etc/pki/ca-trust/extracted/openssl/ca-bundle.trust.crt
```
