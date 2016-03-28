'use strict';

const stadium = require('../stadium');
const router = require('./default_router')();
const dbUtilities = require('../db_utilities');
const constants = require('../constants');
const prettyPrinter = require('../pretty_printer');

let getBadRequestError = message => {
  return {
    status: constants.status.badRequest,
    message: message
  };
};

let checkRequest = req => {
  if (!req.body.captain) {
    return Promise.reject(getBadRequestError(`A ship needs it's captain!`));
  }
  if (!req.body.ship) {
    return Promise.reject(getBadRequestError(`Where's the ship dude?`));
  }
  if (!req.body.signature) {
    return Promise.reject(getBadRequestError(`Are you a pirate? Go sign your ship.`));
  }
  return Promise.resolve({
    captain: req.body.captain,
    ship: req.body.ship,
    signature: req.body.signature
  });
};

let getOptions = req => {
  return {
    pretty: !!req.query.pretty
  };
};

let authenticateShip = params => {
  return dbUtilities.getCaptain(params.captain)
    .then(captain => dbUtilities.checkCaptain(captain, params.ship, params.signature))
    .then(captain => Promise.resolve({
      captain: captain,
      ship: params.ship
    }))
    .catch(err => Promise.reject(getBadRequestError(err)));
};

let postResult = params => {
  return stadiumResult => {
    if (stadiumResult.result === 'finished') {
      return dbUtilities.publishScore(params.captain, params.ship,
          stadiumResult.cycles)
        .catch(err => Promise.reject({
          status: constants.status.serverError,
          message: err
        }))
        .then(res => {
          if (res === 'ok') {
            return Promise.resolve(Object.assign(params, {
              cycles: stadiumResult.cycles
            }));
          }
          return Promise.reject({
            status: constants.status.ok,
            message: res
          });
        });
    } else {
      return Promise.reject({
        status: constants.status.ok,
        message: `You crashed like a noob...`
      });
    }
  };
};

let getRank = params => {
  let rankPromise = dbUtilities.getRankForCycles(params.cycles);
  let shipNamePromise = stadium.getShipInfo(params.ship);
  return Promise.all([rankPromise, shipNamePromise])
    .then(results => Promise.resolve({
      cycles: params.cycles,
      rank: results[0],
      shipName: results[1].name,
      shipComment: results[1].comment,
      captain: params.captain
    }))
    .catch(err => Promise.reject({
      status: constants.status.serverError,
      message: err
    }));
};

let runStadium = params => {
  return stadium.run(params.ship)
    .catch(err => Promise.reject({
      status: constants.status.serverError,
      message: err
    }))
    .then(postResult(params))
    .then(getRank);
};

let sendResult = (res, options) => {
  return params => {
    if (options.pretty) {
      res.send(prettyPrinter.scores([{
        rank: params.rank,
        cycles: params.cycles,
        name: params.shipName,
        captain: params.captain.name,
        comment: params.shipComment
      }]));
    } else {
      res.json(params);
    }
  };
};

let handleError = (res, options) => {
  return err => {
    res.status(err.status);
    if (options.pretty) {
      res.send(`${err.message}\n`);
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
    .then(authenticateShip)
    .then(runStadium)
    .then(sendResult(res, options))
    .catch(handleError(res, options));
});

module.exports = router;
