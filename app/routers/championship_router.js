'use strict';

const stadium = require('../stadium');
const router = require('./default_router')();
const dbUtilities = require('../db_utilities');
const rsaUtilities = require('../rsa_utilities');
const utilities = require('../utilities');
const constants = require('../constants');
const prettyPrinter = require('../pretty_printer');

let getOptions = req => {
  return {
    pretty: !!req.query.pretty
  };
};

let checkRequest = req => {
  if (!req.body.captain) {
    return utilities.error(constants.errors.missingName);
  }
  if (!req.body.ship) {
    return utilities.error(constants.errors.missingShip);
  }
  if (!req.body.signature) {
    return utilities.error(constants.errors.missingSignature);
  }
  return Promise.resolve({
    captain: req.body.captain,
    ship: req.body.ship,
    signature: req.body.signature
  });
};

let authenticateShip = params => {
  return dbUtilities.getCaptain(params.captain)
    .then(captain => {
      if (captain) {
        return rsaUtilities.checkCaptain(captain, params.ship, params.signature);
      }
      return utilities.error(constants.errors.noCaptainFound);
    })
    .then(captain => {
      if (captain) {
        return Promise.resolve({
          captain: captain,
          ship: params.ship
        });
      }
      return utilities.error(constants.errors.rsaKeysNotMatching);
    });
};

let postResult = params => {
  return stadiumResult => {
    if (stadiumResult.result === 'finished') {
      return dbUtilities.publishScore(params.captain, params.ship,
          stadiumResult.cycles)
        .then(res => {
          if (res === 'ok') {
            return Promise.resolve(Object.assign(params, {
              cycles: stadiumResult.cycles
            }));
          }
          return utilities.error(constants.errors.downgradingScore);
        });
    } else {
      return utilities.error(constants.errors.publishCrashed);
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
    }));
};

let runStadium = params => {
  return stadium.run(params.ship)
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
