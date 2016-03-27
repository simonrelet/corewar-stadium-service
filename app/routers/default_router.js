'use strict';

const express = require('express');
const bodyParser = require('body-parser');

module.exports = () => {
  let router = express.Router();
  router.use(bodyParser.json());
  router.use(bodyParser.urlencoded({
    extended: true
  }));
  router.all('/', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    next();
  });

  return router;
};
