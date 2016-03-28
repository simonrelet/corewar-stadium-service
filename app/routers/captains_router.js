'use strict';

const router = require('./default_router')();
const constants = require('../constants');
const utilities = require('../utilities');
const dbUtilities = require('../db_utilities');
const rsaUtilities = require('../rsa_utilities');

let getOptions = req => {
  return {
    pretty: !!req.query.pretty
  };
};

let checkRequest = req => {
  if (!req.body.name) {
    return utilities.error(constants.errors.missingName);
  }
  if (!req.body.key) {
    return utilities.error(constants.errors.missingKey);
  }
  return Promise.resolve({
    name: req.body.name,
    key: req.body.key
  });
};

let checkCaptainName = captain => {
  if (!constants.nameRegex.test(captain.name)) {
    return utilities.error(constants.errors.invalidName);
  } else {
    return dbUtilities.getCaptain(captain.name)
      .then(res => {
        if (res) {
          return utilities.error(constants.errors.captainAlreadyExists);
        }
        return Promise.resolve(captain);
      });
  }
};

let checkCaptainKey = captain => {
  return rsaUtilities.isPublicKey(captain.key)
    .then(res => {
      if (res) {
        return Promise.resolve(captain);
      }
      return utilities.error(constants.errors.invalidKey);
    });
};

let registerCaptain = captain => {
  return dbUtilities.registerCaptain(captain.name, captain.key)
    .then(() => `Captain ${captain.name} has been registered!`);
};

let sendResult = (res, options) => {
  return result => {
    if (options.pretty) {
      res.send(`${result}\n`);
    } else {
      res.json({
        message: result
      });
    }
  };
};

let handleError = (res, options) => {
  return err => {
    if (options.pretty) {
      res.send(`${err.message}\n`);
    } else {
      res.json({
        error: err.message
      });
    }
  };
};

router.post('/', (req, res) => {
  let options = getOptions(req);
  checkRequest(req)
    .then(checkCaptainName)
    .then(checkCaptainKey)
    .then(registerCaptain)
    .then(sendResult(res, options))
    .catch(handleError(res, options));
});

module.exports = router;
