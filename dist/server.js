var express = require('express');
var schedule = require('node-schedule');
var firebase = require('firebase');
var admin = require("firebase-admin");
var CurrentLocationForecast = require('yr-lib').CurrentLocationForecast;

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

var j = schedule.scheduleJob('*/30 * * * *', function(){
  console.log("scheduler");
  CurrentLocationForecast("59.896339", "10.847261", new Date(), function(data) {
    var currentData = data[0];
    _writeTemperatureNode("yr", currentData.from, "Oppsal", currentData.location.temperature.value, currentData.location.dewpointTemperature.value);
  });
});


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
