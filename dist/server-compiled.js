'use strict';

var express = require('express');
var schedule = require('node-schedule');
var firebase = require('firebase');
var admin = require("firebase-admin");
var CurrentLocationForecast = require('yr-lib').CurrentLocationForecast;
var GoogleLocations = require('google-locations');

var serviceAccount = require("../serviceAccountKey.json");

var myFirebase = require('./firebase/firebase');

var app = express();
var isProduction = process.env.NODE_ENV === 'production';
var port = isProduction ? process.env.PORT : 3000;

var locations = new GoogleLocations('AIzaSyC8GogpxKovkVzqXV7rS__iH2DWf7lXWZw');

app.use(express.static(__dirname));

//start serveren med å lytte på port 5555, logg en beskjed til konsollet.
//merk at vi setter serveren til  å lytte på den porten den får tildelt av kjøremiljøet,
//eller 5555 om den eksempelvis kjører på localhost
var server = app.listen(process.env.PORT || 5555, function () {
  console.log('API lytter på port: ' + server.address().port);
});

//Enkel rute på rot som sender en bekreftende beskjed på responsen
app.get('/', function (req, res) {
  res.send('API svarer');
});

/*
 app.get('/yr', function (req, res) {
 myFirebase.getYrTemperature("yr").then(function (response) {
 res.status(200).send(response)
 }, function (error) {
 res.status(404).send(error.message)
 });
 });
 */

app.get('/yr/:lat/:lng', function (req, res) {
  if (req.params.lat) {
    //CurrentLocationForecast("59.896339", "10.847261", new Date(), function(data) {
    CurrentLocationForecast(req.params.lat, req.params.lng, new Date(), function (data) {
      var currentData = data[0];
      var json = JSON.stringify({
        temperature: currentData.location.temperature.value,
        dewpointTemperature: currentData.location.dewpointTemperature.value,
        location: req.params.location,
        time: currentData.from
      });
      res.status(200).send(json);
    });
  }
});

app.get('/places/autocomplete/:query', function (req, res) {
  locations.autocomplete({
    input: req.params.query,
    types: "(cities)",
    language: "nb",
    country: 'no',
    components: 'country:no'
  }, function (err, response) {
    console.log("autocomplete: ", response.predictions);

    var result = '{"places":[';

    for (var index in response.predictions) {
      if (index != 0) {
        result += ",";
      }
      result += '{"title":"' + response.predictions[index].description + '",' + '"place_id":"' + response.predictions[index].place_id + '"}';
    }
    result += ']}';
    res.status(200).send(result);
  });
});

app.get('/place/:placeid', function (req, res) {
  locations.details({ placeid: req.params.placeid }, function (err, response) {
    console.log(response.result);

    // search details: Google
    var result = '{"results":[';
    result += '{' + '"name":"' + response.result.name + '",' + '"lat":"' + response.result.geometry.location.lat + '",' + '"lng":"' + response.result.geometry.location.lng + '"}';
    result += ']}';
    res.status(200).send(result);
  });
});

app.get('/verify/:mytokenId', function (req, res) {
  // idToken comes from the client app (shown above)
  admin.auth().verifyIdToken(req.params.mytokenId).then(function (decodedToken) {
    var uid = decodedToken.uid;
    console.log("tokenId: " + req.params.mytokenId + ': ' + uid);
    res.status(200).send(uid);
  }).catch(function (error) {
    console.log("error");
    res.status(200).send("error");
  });
});

//# sourceMappingURL=server-compiled.js.map