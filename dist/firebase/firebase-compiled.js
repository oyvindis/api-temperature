"use strict";

var firebase = require('firebase');
var admin = require("firebase-admin");

var serviceAccount = require("../../serviceAccountKey.json");

var baseUrl = 'https://api-temperature.firebaseio.com/';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://api-temperature.firebaseio.com/"
});

// Use the shorthand notation to retrieve the default app's services
var defaultAuth = admin.auth();
var defaultDatabase = admin.database();

var asyncAdd = function asyncAdd(a, b) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      if (typeof a == 'number' && typeof b === 'number') {
        resolve(a + b);
      } else {
        reject('Arguments must be numbers');
      }
    }, 1500);
  });
};

//asynkron funksjon som leser fra strings noden i Firebase og returnerer noden som matcher id

var getYrTemperature = function getYrTemperature(source) {
  return new Promise(function (resolve, reject) {

    var nodeRef = defaultDatabase.ref('/' + source).once('value', function (snapshot) {
      var ret = snapshot.val();
      if (null !== ret) {
        resolve(ret);
      } else {
        reject(new Error('node not found by source: ' + source));
      }
    });
  });
};

/*
var writeTemperatureNode  = (source, localTime, location, temperature, dewpointTemperature) => {
  //asynkron funksjon som skriver en ny temperaturepostings node til Firebase og returnerer ID'en til denne
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
*/

//module.exports.getYrTemperature = getYrTemperature;
//module.exports.writeTemperatureNode = writeTemperatureNode;

//# sourceMappingURL=firebase-compiled.js.map