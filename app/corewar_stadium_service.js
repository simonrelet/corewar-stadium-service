'use strict';

const app = require('express')();

app.use('/', require('./stadium-router.js'));

let server = app.listen(4202, () => {
  console.log(`Listening on port ${server.address().port}`);
});
