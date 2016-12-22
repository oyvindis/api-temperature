var express = require('express');
var schedule = require('node-schedule');
var firebase = require('firebase');

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
  res.send('API svarer hipp hurra!')
});

var j = schedule.scheduleJob('*/1 * * * *', function(){
  _writeTemperatureNode("Oslo", "2").then(function (response) {
    var result = 'New temperatureposting created with key: ' + response.key();
    res.status(200).send(result)
  }, function (error) {
    res.status(404).send(error.message)
  });
});

//asynkron funksjon som skriver en ny temperaturepostings node til Firebase og returnerer ID'en til denne
//hvis .push() - metoden til Firebase returnerer noe annet enn null betyr det
//at operasjonen feilet, og vi sender feilen tilbake, ellers returnerer vi med den nye node ID'en
function _writeTemperatureNode(location, temperature) {
  return new Promise(function (resolve, reject) {
    var nodeRef = new Firebase(baseUrl + '/temperatureposting/');
    var newNodeRef = nodeRef.push({
      "location": location,
      "temperature": temperature
    }, function (firebaseResponse) {
      if (null !== firebaseResponse) {
        reject(new Error('Something wen\'t wrong, please try again!'));
      }
      resolve(newNodeRef);
    });
  });
}