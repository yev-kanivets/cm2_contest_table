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
var serviceAccount = require("./codemarathon-2-dev-firebase-adminsdk.json");

// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://codemarathon-2-dev.firebaseio.com"
});

const db = admin.database();

app.get('/', function(request, response) {
  const usersPromise = db.ref("users").once("value");
  const lastUpdatePromise = db.ref("lastUpdate").once("value");

  Promise.all([usersPromise, lastUpdatePromise]).then(results => {
    const students = results[0].val();
    const lastUpdate = results[1].val();

  	var div1Students = [];
  	var div2Students = [];
    var div3Students = [];
  	for(var key in students) {
      let value = students[key];
      let student = parseStudent(key, value);

      if (value.division == 'Div1') {
      	div1Students.push(student);
      } else if (value.division == 'Div2') {
      	div2Students.push(student);
      } else {
        div3Students.push(student);
      }
    }

    var compare = function(a, b) {
      return (b.contestRating === undefined ? 0 : b.contestRating) - (a.contestRating === undefined ? 0 : a.contestRating);
    }
    div1Students.sort(compare);
    div2Students.sort(compare);
    div3Students.sort(compare);
    response.render('pages/index', {div1Students: div1Students, div2Students: div2Students, div3Students: div3Students, 
      lastUpdate: lastUpdate});
  });
});

app.get('/sponsors', function(request, response) {
  response.render('pages/sponsors');
});

app.get('/prizes', function(request, response) {
  response.render('pages/prizes');
});

app.get('/participants/:id', function(request, response){
  var studentId = request.params.id;

  db.ref("users").child(studentId).once("value", function(dataSnapshot) {
    response.render('pages/student', {student: parseStudent(studentId, dataSnapshot.val())});
  });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

function parseStudent(key, value) {
  var solvedTasks = [];
  for (var k in value.solvedTasks) {
    var task = {};
    task.value = value.solvedTasks[k];
    solvedTasks.push(task);
  }

  var notSolvedTasks = [];
  for (var k in value.notSolvedTasks) {
    var task = {};
    task.value = value.notSolvedTasks[k];
    notSolvedTasks.push(task);
  }
       
  var bonuses = []; 
  for (var k in value.bonuses) {
    var l = value.bonuses[k];
    var bonus = {};
     
    bonus.value = l.value;
    bonus.description = l.description;
    bonuses.push(bonus);
  }

  var student = {};
  student.id = key;
  student.fullname = value.fullname;
  student.acmpId = value.acmpId;
  student.dateTime = value.dateTime;
  student.startRating = value.startRating;
  student.currentRating = value.currentRating;
  student.bonusRating = value.bonusRating;
  student.division = value.division;
  student.contestRating = value.contestRating;
  student.solvedTasks = solvedTasks;
  student.notSolvedTasks = notSolvedTasks;
  student.bonuses = bonuses;

  return student;
}
