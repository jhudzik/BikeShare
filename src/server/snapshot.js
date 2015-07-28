
'use strict';

var Promise = require('bluebird'),
    couch = require('node-couchdb'),
    request = require('request');

var bShare = {
    api: 'https://api.phila.gov/bike-share-stations/v1',
    /**
     *  Hits Philly data bikeshare api.
     *  @return {Promise<Object>} Object containing an array of
     *      kiosk related information.
     */
    getApiData: function() {
        var self = this;
        return new Promise(function(resolve, reject) {
            request(self.api, function(err, res, body) {
                if(err) {
                    reject(err);
                }
                else {
                    resolve(JSON.parse(body));
                }
            })
        })
    },
    /**
     *  Builds a snapshot for each station in bShareData.
     *  @param {Array} bShareData - Features array from getApiData res.
     *  @return {Array} Array of snapshots.
     */
    buildStationSnaphots: function(bShareData) {
        var snapshots = [];
        bShareData.forEach(function(bShareDatum) {
            var props = bShareDatum.properties,
                stationSnapshot = {
                    addressStreet: props.addressStreet,
                    bikesAvailable: props.bikesAvailable,
                    docksAvailable: props.docksAvailable,
                    kioskId: props.kioskId,
                    name: props.name,
                    totalDocks: props.totalDocks,
                    createdAt: new Date()
                };
            snapshots.push(stationSnapshot);
        });
        return snapshots;
    },
    /**
     *  Writes a document to CouchDB bike_share db.
     *  @param {Object} stationSnapShot - A station snapshot.
     *  @return {Promise<String>} - CouchDB write res.
     */
    saveStationSnapshot: function(stationSnapShot) {
        return new Promise(function(resolve, reject) {
            couch.insert('bike_share', stationSnapShotbikeshare, function(err, res) {
                if(err) {
                    reject(err);
                }
                else {
                    resolve(res);
                }
            });
        });
    }
};

// fetch philly api data and write snapshots on 30 min interval
setInterval(function() {
    bShare
        .getApiData()
        .then(
            function(res) {
                var stationsSnapshots = bShare.buildStationSnaphots(res.features);
                stationsSnapshots.forEach(function(snapshot) {
                    bShare.saveStationSnapshot(snapshot);
                });
            },
            function(err) {
                console.log(err); // pm2 logs snapshot
            }
        );
}, 1800000);
