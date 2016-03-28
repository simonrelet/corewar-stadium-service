'use strict';

const rp = require('request-promise');
const ursa = require('ursa');
const constants = require('./constants');
const stadium = require('./stadium');

let getCaptain = captainName => {
  let options = {
    uri: `${constants.DBUrl}/captains/?name=${captainName}`,
    json: true
  };
  return rp(options).then(captains => {
    if (captains.length === 1) {
      return Promise.resolve(captains[0]);
    }
    return Promise.reject(`The captain ${captainName} doesn't exist.`);
  });
};

let checkCaptain = (captain, value, signature) => {
  return new Promise((resolve, reject) => {
    let publicKey = captain.publicKey.join('\n');
    let key = ursa.createPublicKey(publicKey);
    let verifier = ursa.createVerifier('sha256');
    verifier.update(value, 'utf8');
    if (verifier.verify(key, signature, 'base64')) {
      resolve(captain);
    } else {
      reject(`Captain identification failed`);
    }
  });
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
    uri: `${constants.DBUrl}/scores/?${req}&_expand=captain`,
    json: true
  };
  return rp(options).then(scores => {
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
        return Promise.resolve('You cannot downgrade a ship score!');
      }

      let options = {
        method: !!score ? 'PATCH' : 'POST',
        uri: `${constants.DBUrl}/scores/${!!score ? score.id : ''}`,
        body: {
          captainId: captain.id,
          shipName: shipInfo.name,
          shipComment: shipInfo.comment,
          ship: ship,
          cycles: cycles
        },
        json: true
      };
      return rp(options).then(() => Promise.resolve('ok'));
    });
};

let publishScore = (captain, ship, cycles) => {
  return stadium.getShipInfo(ship)
    .then(shipInfo => addUpdateScore(captain, shipInfo, ship, cycles));
};

let getRankForCycles = cycles => {
  let options = {
    uri: `${constants.DBUrl}/scores/?cycles_lte=${cycles - 1}`,
    json: true
  };
  return rp(options).then(scores => Promise.resolve(scores.length + 1));
};

let getScores = () => {
  let options = {
    uri: `${constants.DBUrl}/scores/?_expand=captain&_sort=cycles&_order=ASC`,
    json: true
  };
  return rp(options).then(scores => {
    return Promise.resolve(scores.map(toPublicScore));
  });
};

module.exports = {
  getCaptain: getCaptain,
  checkCaptain: checkCaptain,
  publishScore: publishScore,
  getRankForCycles: getRankForCycles,
  getScores: getScores
};
