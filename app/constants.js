'use strict';

const config = require('./config.json');

const nameRegex = /^[a-z][a-z0-9_]*$/;
const defaultConfig = {
  port: 4202,
  dbUrl: 'http://localhost:4203',
  bin: 'stadium.jar'
};

let constants = {
  config: Object.assign(defaultConfig, config),
  nameRegex: nameRegex,
  shipNameLength: 32,
  shipCommentLength: 128,
  status: {
    badRequest: 400,
    serverError: 500,
    ok: 200
  },
  errors: {
    missingName: {
      code: 101,
      message: `You'r no captain without a name!`
    },
    missingKey: {
      code: 102,
      message: `Did you forgot your key?`
    },
    missingShip: {
      code: 103,
      message: `Where's the ship?`
    },
    missingSignature: {
      code: 104,
      message: `Are you a pirate? Go sign your ship.`
    },

    invalidName: {
      code: 201,
      message: `A captain's name should respect: '${nameRegex}'.`
    },
    captainAlreadyExists: {
      code: 201,
      message: `A captain already exists by this name.`
    },
    invalidKey: {
      code: 203,
      message: 'Invalid key, it should be a public key in PEM format.'
    },
    downgradingScore: {
      code: 204,
      message: 'You cannot downgrade a ship score!'
    },
    noCaptainFound: {
      code: 205,
      message: `The captain doesn't exist.`
    },
    publishCrashed: {
      code: 206,
      message: `You crashed like a noob...`
    },

    dbError: {
      code: 300,
      message: 'Cannot connect to data base.'
    },

    rsaFailure: {
      code: 400,
      message: 'Cannot verify RSA keys.'
    },
    rsaKeysNotMatching: {
      code: 401,
      message: `Captain's keys are not matching.`
    },

    stadium: {
      writeDir: {
        code: 500,
        message: 'Stadium internal error: cannot create temporary directory.'
      },
      writeFiles: {
        code: 501,
        message: 'Stadium internal error: cannot create temporary files.'
      },
      runtime: {
        code: 502,
        message: 'Stadium internal error: runtime error.'
      },
      readFiles: {
        code: 503,
        message: 'Stadium internal error: cannot read temporary files.'
      },
      deleteFiles: {
        code: 504,
        message: 'Stadium internal error: cannot delete temporary files.'
      }
    }
  }
};

module.exports = constants;
