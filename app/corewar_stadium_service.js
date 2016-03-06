'use strict';

var app = require('express')();

app.use('/', require('./stadium-router.js'));

var server = app.listen(4202, function() {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Corewar stadium service listening at http://%s:%s', host, port);
});
