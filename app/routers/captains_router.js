'use strict';

const ursa = require('ursa');
const rp = require('request-promise');
const router = require('./default_router')();
const constants = require('../constants');

const NAME_REGEX = /^[a-z][a-z0-9_]*$/;

let checkRequest = req => {
  if (!req.body.name) {
    return Promise.reject(`You'r no captain without a name!`);
  }
  if (!req.body.key) {
    return Promise.reject(`Did you forgot your key?`);
  }
  return Promise.resolve({
    name: req.body.name,
    key: req.body.key
  });
};

let checkCaptainName = captain => {
  if (!NAME_REGEX.test(captain.name)) {
    return Promise.reject(`A captain's name should respect: ${NAME_REGEX}`);
  } else {
    let options = {
      uri: `${constants.DBUrl}/captains/?name=${captain.name}`,
      json: true
    };
    return rp(options).then(captains => {
      if (captains.length === 0) {
        return Promise.resolve(captain);
      }
      return Promise.reject(`A captain already exists by this name`);
    });
  }
};

let checkCaptainKey = captain => {
  try {
    ursa.createPublicKey(captain.key);
  } catch (err) {
    return Promise.reject('Invalid key, it should be a public key in PEM format.');
  }
  return Promise.resolve(captain);
};

let registerCaptain = captain => {
  let options = {
    method: 'POST',
    uri: `${constants.DBUrl}/captains/`,
    body: {
      name: captain.name,
      publicKey: captain.key.split('\n')
    },
    json: true
  };
  return rp(options).then(() => captain);
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
    .then(checkCaptainName)
    .then(checkCaptainKey)
    .then(registerCaptain)
    .then(sendResult(res))
    .catch(handleError(res));
});

module.exports = router;
