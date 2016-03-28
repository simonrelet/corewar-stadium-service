'use strict';

const ursa = require('ursa');
const constants = require('./constants');
const utilities = require('./utilities');

let checkCaptain = (captain, value, signature) => {
  return new Promise((resolve, reject) => {
      try {
        let publicKey = captain.publicKey.join('\n');
        let key = ursa.createPublicKey(publicKey);
        let verifier = ursa.createVerifier('sha256');
        verifier.update(value, 'utf8');
        if (verifier.verify(key, signature, 'base64')) {
          resolve(captain);
        } else {
          resolve(null);
        }
      } catch (err) {
        reject();
      }
    })
    .catch(() => utilities.error(constants.errors.rsaFailed));
};

let isPublicKey = key => {
  return new Promise(resolve => {
    try {
      ursa.createPublicKey(key);
      resolve(true);
    } catch (err) {
      resolve(false);
    }
  });
};

module.exports = {
  checkCaptain: checkCaptain,
  isPublicKey: isPublicKey
};
