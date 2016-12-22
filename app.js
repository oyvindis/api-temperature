'use strict';
//importer nødvendige bibliotek
var Express = require('express');
var Firebase = require('firebase');

//opprett en instans av Express
var app = Express();

//start serveren med å lytte på port 5555, logg en beskjed til konsollet.
//merk at vi setter serveren til  å lytte på den porten den får tildelt av kjøremiljøet,
//eller 5555 om den eksempelvis kjører på localhost
var server = app.listen(process.env.PORT || 5555, function () {
  console.log('API lytter på port: ' + server.address().port);
});

//Enkel rute på rot som sender en bekreftende beskjed på responsen
app.get('/', function (req, res) {
  res.send('API svarer!')
});