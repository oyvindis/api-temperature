var express = require('express');
var schedule = require('node-schedule');
var firebase = require('firebase');
var admin = require("firebase-admin");
var CurrentLocationForecast = require('yr-lib').CurrentLocationForecast;
var GoogleLocations = require('google-locations');

var serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://api-temperature.firebaseio.com/"
});

// Use the shorthand notation to retrieve the default app's services
var defaultAuth = admin.auth();
var defaultDatabase = admin.database();

var baseUrl = 'https://api-temperature.firebaseio.com/';

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
  res.send('API svarer')
});

app.get('/yr', function (req, res) {
  _getTextNode("yr").then(function (response) {
    res.status(200).send(response)
  }, function (error) {
    res.status(404).send(error.message)
  });
});

app.get('/yr/:location', function (req, res) {
  if(req.params.location) {
    CurrentLocationForecast("59.896339", "10.847261", new Date(), function(data) {
      var currentData = data[0];
      //res.writeHead(200, {"Content-Type": "application/json"});
      var json = JSON.stringify({
        temperature: currentData.location.temperature.value,
        dewpointTemperature: currentData.location.dewpointTemperature.value,
        location: req.params.location,
        time: currentData.from
      });
      //res.status(200).send(currentData.location.temperature.value);
      res.status(200).send(json);
    });
  }
});

app.get('/places/autocomplete/:query', function (req, res) {

  console.log("test");

  locations.autocomplete({input: req.params.query, types: "(cities)", language: "nb", country: 'no', components: 'country:no'}, function(err, response) {
    console.log("autocomplete: ", response.predictions);
    //console.log("autocomplete2: ", response.predictions[0].description);
    //console.log("did you mean: ", response.result);

    /*
    var success = function(err, response) {
      console.log("did you mean: ", response.result.name);
    };
    */

    //var result = "[{'title': 'Oslo'}]";
    var result = '{"places":[';


    for(var index in response.predictions) {
      //locations.details({placeid: response.predictions[index].place_id}, success);
      //result += "{'title': 'Oslo'}"
      if (index != 0) {
        result += ",";
      }
      result += '{"title":"' + response.predictions[index].description + '",'
        + '"place_id":"' + response.predictions[index].place_id + '"}';

    }
    result +=']}';

    res.status(200).send(result);





    /*
    for(var index in response.predictions) {
      locations.details({placeid: response.predictions[index].place_id}, success);
    }
    */
  });



});

app.get('/place/:placeid', function (req, res) {
  locations.details({placeid: req.params.placeid}, function(err, response) {
    console.log("search details: ", response.result.geometry.location.lat + " " + response.result.geometry.location.lng);
    // search details: Google

    var result = '{"results":[';

    result += '{"lat":"' + response.result.geometry.location.lat + '",'
      + '"lng":"' + response.result.geometry.location.lng + '"}';

    result +=']}';

    res.status(200).send(result);

  });

});


// var j = schedule.scheduleJob('*/30 * * * *', function(){
//   console.log("scheduler");
//   CurrentLocationForecast("59.896339", "10.847261", new Date(), function(data) {
//     var currentData = data[0];
//     _writeTemperatureNode("yr", currentData.from, "Oppsal", currentData.location.temperature.value, currentData.location.dewpointTemperature.value);
//   });
// });


//asynkron funksjon som skriver en ny temperaturepostings node til Firebase og returnerer ID'en til denne
function _writeTemperatureNode(source, localTime, location, temperature, dewpointTemperature) {
  return new Promise(function (resolve, reject) {
    var newNodeRef = defaultDatabase.ref('/'+source).set({
      "location": location,
      "time": localTime,
      "temperature": temperature,
      "dewpointTemperature": dewpointTemperature
    }, function (firebaseResponse) {
      if (null !== firebaseResponse) {
        console.log("error");
        reject(new Error('Something wen\'t wrong, please try again!'));
      }
      resolve(newNodeRef);
    });
  });
}

//asynkron funksjon som leser fra strings noden i Firebase og returnerer noden som matcher id
function _getTextNode(source) {
  return new Promise(function (resolve, reject) {
    var nodeRef = defaultDatabase.ref('/'+source).once('value', function (snapshot) {
      var ret = snapshot.val();
      if (null !== ret) {
        resolve(ret);
      } else {
        reject(new Error('node not found by source: ' + source));
      }
    });
  });
}
