var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  var div1Students = [{fullname: 'Коваленко Юрий', acmpId: '12345', dateTime: '02.11.2017 13:07:32', startRating: 1000, currentRating: 2000, bonuses: 0, contestRating: 1000},
  {fullname: 'Коваленко Юрий', acmpId: '12345', dateTime: '02.11.2017 13:07:32', startRating: 1000, currentRating: 2000, bonuses: 0, contestRating: 1000}]
  var div2Students = [{fullname: 'Коваленко Алексей', acmpId: '12345', dateTime: '02.11.2017 13:07:32', startRating: 1000, currentRating: 2000, bonuses: 0, contestRating: 1000}]
  response.render('pages/index', {div1Students: div1Students, div2Students: div2Students});
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
