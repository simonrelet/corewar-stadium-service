'use strict';

const stadium = require('../stadium');
const router = require('./default_router')();
const constants = require('../constants');

const NUMBER_REGEX = /^[0-9]+$/;

let checkRequest = req => {
  if (req.body.ship) {
    return Promise.resolve(req.body.ship);
  } else {
    return Promise.reject({
      status: constants.status.badRequest,
      message: `Where's the ship dude?`
    });
  }
};

let getIntegerOption = value => {
  if (value && NUMBER_REGEX.test(value)) {
    return Number.parseInt(value);
  }
  return -1;
};

let setOption = (res, req, attribute, name) => {
  let value = getIntegerOption(req.query[name]);
  if (value !== -1) {
    res[attribute] = value;
  }
};

let getOptions = req => {
  let res = {
    pretty: !!req.query.pretty
  };
  setOption(res, req, 'verbosity', 'v');
  setOption(res, req, 'firstCycle', 'f');
  setOption(res, req, 'lastCycle', 'l');
  return res;
};

let runStadium = options => {
  return ship => stadium.run(ship, options)
    .catch(err => Promise.reject({
      status: constants.status.serverError,
      message: err
    }));
};

let sendResult = (res, options) => {
  return result => {
    if (options.pretty) {
      res.send(result);
    } else {
      res.json(result);
    }
  };
};

let handleError = (res, options) => {
  return err => {
    res.status(err.status);
    if (options.pretty) {
      res.send(`${err}\n`);
    } else {
      res.json({
        error: {
          message: err.message
        }
      });
    }
  };
};

router.post('/', (req, res) => {
  let options = getOptions(req);
  checkRequest(req)
    .then(runStadium(options))
    .then(sendResult(res, options))
    .catch(handleError(res, options));
});

module.exports = router;
