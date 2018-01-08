"use strict";
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
  const statisticsPromise = db.ref("statistics").once("value");

  Promise.all([usersPromise, lastUpdatePromise, statisticsPromise]).then(results => {
    const students = results[0].val();
    const lastUpdate = results[1].val();
    const statistics = results[2].val();

  	var div1Students = [];
  	var div2Students = [];
    var div3Students = [];
  	for(var key in students) {
      const value = students[key];
      const student = parseStudent(key, value);

      if (value.division == 'Div1') {
      	div1Students.push(student);
      } else if (value.division == 'Div2') {
      	div2Students.push(student);
      } else {
        div3Students.push(student);
      }

      const studentStatistics = statistics.studentStatistics[key];
      if (studentStatistics !== undefined) {
        student.diff1_20 = {};
        student.diff1_20.stat = getStat(studentStatistics.diff1_20 / 71.0);
        student.diff1_20.tooltip = studentStatistics.diff1_20 + "/" + 71;

        student.diff21_40 = {};
        student.diff21_40.stat = getStat(studentStatistics.diff21_40 / 284.0);
        student.diff21_40.tooltip = studentStatistics.diff21_40 + "/" + 284;

        student.diff41_60 = {};
        student.diff41_60.stat = getStat(studentStatistics.diff41_60 / 252.0);
        student.diff41_60.tooltip = studentStatistics.diff41_60 + "/" + 252;

        student.diff61_80 = {};
        student.diff61_80.stat = getStat(studentStatistics.diff61_80 / 85.0);
        student.diff61_80.tooltip = studentStatistics.diff61_80 + "/" + 85;

        student.diff81_100 = {};
        student.diff81_100.stat = getStat(studentStatistics.diff81_100 / 8.0);
        student.diff81_100.tooltip = studentStatistics.diff81_100 + "/" + 8;
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

app.get('/developers', function(request, response) {
  response.render('pages/developers');
});

app.get('/prizes', function(request, response) {
  response.render('pages/prizes');
});

app.get('/participants/:id', function(request, response){
  var studentId = request.params.id;

  const userPromise = db.ref("users").child(studentId).once("value");
  const tasksPromise = db.ref("tasks").once("value");

  Promise.all([userPromise, tasksPromise]).then(results => {
    const user = results[0].val();
    const tasks = results[1].val();

    const student = parseStudent(studentId, user);
    const solvedTasks = {};
    const notSolvedTasks = {};

    student.solvedTasks.forEach(function(item, i, arr) {
      var task = tasks[item.value];
      task.id = item.value;
      if (solvedTasks[task.topic] === undefined) {
        solvedTasks[task.topic] = [];
      }
      solvedTasks[task.topic].push(task);
    });

    student.notSolvedTasks.forEach(function(item, i, arr) {
      var task = tasks[item.value];
      task.id = item.value;
      if (notSolvedTasks[task.topic] === undefined) {
        notSolvedTasks[task.topic] = [];
      }
      notSolvedTasks[task.topic].push(task);
    });

    student.solvedTasks = solvedTasks;
    student.notSolvedTasks = notSolvedTasks;

    response.render('pages/student', {student: student});
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

function getStat(value) {
  if (value <= 0.2) return "stat-1";
  else if (value <= 0.4) return "stat-2";
  else if (value <= 0.6) return "stat-3";
  else if (value <= 0.8) return "stat-4";
  else return "stat-5";
}
