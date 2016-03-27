'use strict';

const rp = require('request-promise');
const ursa = require('ursa');
const stadium = require('../stadium');
const router = require('./default_router')();
const constants = require('../constants');

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

let getUser = res => {
  let options = {
    uri: `${constants.DBUrl}/captains/?name=${res.captain}`,
    json: true
  };
  return rp(options).then(captains => {
    if (captains.length === 1) {
      return Promise.resolve({
        user: captains[0],
        req: res
      });
    }
    return Promise.reject(`No captain found for: '${res.captain}'`);
  });
};

let checkUser = res => {
  let publicKey = res.user.publicKey.join('\n');
  let key = ursa.createPublicKey(publicKey);
  let verifier = ursa.createVerifier('sha256');
  verifier.update(res.req.ship, 'utf8');
  if (verifier.verify(key, res.req.signature, 'base64')) {
    return Promise.resolve(res);
  }
  return Promise.reject(`Captain identification failed`);
};

let authenticateShip = res => {
  return getUser(res)
    .then(checkUser);
};

let postResult = info => {
  return res => {
    if (res.res === 'finished') {
      let options = {
        method: 'POST',
        uri: `${constants.DBUrl}/scores/`,
        body: {
          captainId: info.user.id,
          ship: info.req.ship,
          cycles: res.cycles
        },
        json: true
      };
      return rp(options).then(() => res);
    } else {
      return Promise.reject(`You crashed like a noob...`);
    }
  };
};

let runStadium = res => {
  return stadium.run(res.req.ship)
    .then(postResult(res));
};

let sendResult = res => {
  return result => {
    console.log(result);
    res.json(result);
  };
};

let handleError = res => {
  return err => {
    console.error(err);
    res.json({
      error: {
        message: err
      }
    });
  };
};

router.post('/', (req, res) => {
  checkRequest(req)
    .then(authenticateShip)
    .then(runStadium)
    .then(sendResult(res))
    .catch(handleError(res));
});

module.exports = router;
