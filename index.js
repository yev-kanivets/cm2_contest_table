var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

var favicon = require('serve-favicon');
var path = require('path');

app.use(favicon(__dirname + '/public/favicons/favicon.ico'));

var admin = require("firebase-admin");

// Fetch the service account key JSON file contents
var serviceAccount = require("./codemarathon-2-firebase-adminsdk.json");

// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://codemarathon-2.firebaseio.com"
});

app.get('/', function(request, response) {
  var db = admin.database();
  var ref = db.ref("users");
  ref.once("value", function(snapshot) {
  	var div1Students = [];
  	var div2Students = [];
    var div3Students = [];
  	for(var key in snapshot.val()) {
      var value = snapshot.val()[key];
      var student = {};
      student.fullname = value.fullname;
      student.acmpId = value.acmpId;
      student.dateTime = value.dateTime;
      student.startRating = value.startRating;
      student.currentRating = value.currentRating;
      student.bonusRating = value.bonusRating;
      student.contestRating = value.contestRating;

      if (value.division == 'Div1') {
      	div1Students.push(student);
      } else if (value.division == 'Div2') {
      	div2Students.push(student);
      } else {
        div3Students.push(student);
      }
  	}
  	div1Students.sort(function(a, b) {
  		return b.contestRating - a.contestRating;
  	});
  	div2Students.sort(function(a, b) {
  		return b.contestRating - a.contestRating;
  	});
    div3Students.sort(function(a, b) {
      return b.contestRating - a.contestRating;
    });
    response.render('pages/index', {div1Students: div1Students, div2Students: div2Students, div3Students: div3Students});
  });
});

app.get('/sponsors', function(request, response) {
  response.render('pages/sponsors');
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
