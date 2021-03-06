'use strict';

const rp = require('request-promise');
const constants = require('./constants');
const utilities = require('./utilities');
const stadium = require('./stadium');

let getCaptain = captainName => {
  let options = {
    uri: `${constants.config.dbUrl}/captains/?name=${captainName}`,
    json: true
  };
  return rp(options)
    .catch(() => utilities.error(constants.errors.dbError))
    .then(captains => {
      if (captains.length === 1) {
        return Promise.resolve(captains[0]);
      }
      return Promise.resolve(null);
    });
};

let registerCaptain = (name, key) => {
  let options = {
    method: 'POST',
    uri: `${constants.config.dbUrl}/captains/`,
    body: {
      name: name,
      publicKey: key.split('\n')
    },
    json: true
  };
  return rp(options)
    .catch(() => utilities.error(constants.errors.dbError))
    .then(() => Promise.resolve('ok'));
};

let toPublicScore = score => {
  return {
    id: score.id,
    captain: score.captain.name,
    cycles: score.cycles,
    shipName: score.shipName,
    shipComment: score.shipComment
  };
};

let getScore = (captain, shipInfo) => {
  let req = `captainId=${captain.id}&shipName=${shipInfo.name}`;
  let options = {
    uri: `${constants.config.dbUrl}/scores/?${req}&_expand=captain`,
    json: true
  };
  return rp(options)
    .catch(() => utilities.error(constants.errors.dbError))
    .then(scores => {
      if (scores.length === 1) {
        return Promise.resolve(toPublicScore(scores[0]));
      }
      return Promise.resolve(null);
    });
};

let addUpdateScore = (captain, shipInfo, ship, cycles) => {
  return getScore(captain, shipInfo)
    .then(score => {
      if (!!score && score.cycles < cycles) {
        return Promise.resolve('ko');
      }

      let options = {
        method: !!score ? 'PATCH' : 'POST',
        uri: `${constants.config.dbUrl}/scores/${!!score ? score.id : ''}`,
        body: {
          captainId: captain.id,
          shipName: shipInfo.name,
          shipComment: shipInfo.comment,
          ship: ship,
          cycles: cycles
        },
        json: true
      };
      return rp(options)
        .catch(() => utilities.error(constants.errors.dbError))
        .then(() => Promise.resolve('ok'));
    });
};

let publishScore = (captain, ship, cycles) => {
  return stadium.getShipInfo(ship)
    .then(shipInfo => addUpdateScore(captain, shipInfo, ship, cycles));
};

let getRankForCycles = cycles => {
  let options = {
    uri: `${constants.config.dbUrl}/scores/?cycles_lte=${cycles - 1}`,
    json: true
  };
  return rp(options)
    .catch(() => utilities.error(constants.errors.dbError))
    .then(scores => Promise.resolve(scores.length + 1));
};

let getScores = () => {
  let options = {
    uri: `${constants.config.dbUrl}/scores/?_expand=captain&_sort=cycles&_order=ASC`,
    json: true
  };
  return rp(options)
    .catch(() => utilities.error(constants.errors.dbError))
    .then(scores => {
      return Promise.resolve(scores.map(toPublicScore));
    });
};

module.exports = {
  getCaptain: getCaptain,
  registerCaptain: registerCaptain,
  publishScore: publishScore,
  getRankForCycles: getRankForCycles,
  getScores: getScores
};
