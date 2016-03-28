'use strict';

const stadium = require('../stadium');
const router = require('./default_router')();
const dbUtilities = require('../db_utilities');

let checkRequest = req => {
  if (!req.body.captain) {
    return Promise.reject(`A ship needs it's captain!`);
  }
  if (!req.body.ship) {
    return Promise.reject(`Where's the ship dude?`);
  }
  if (!req.body.signature) {
    return Promise.reject(`Are you a pirate? Go sign your ship.`);
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
    }));
};

let postResult = params => {
  return stadiumResult => {
    if (stadiumResult.result === 'finished') {
      return dbUtilities.publishScore(params.captain, params.ship,
          stadiumResult.cycles)
        .then(() => Promise.resolve(Object.assign(params, {
          cycles: stadiumResult.cycles
        })));
    } else {
      return Promise.reject(`You crashed like a noob...`);
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
      ship: results[1].name
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
      res.send(`#${params.rank} ${params.ship} in ${params.cycles} cycles.\n`);
    } else {
      res.json(params);
    }
  };
};

let handleError = (res, options) => {
  return err => {
    if (options.pretty) {
      res.send(err);
    } else {
      res.json({
        error: {
          message: err
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
