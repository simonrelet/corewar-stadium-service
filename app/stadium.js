'use strict';

const fsp = require('fs-promise');
const exec = require('child_process').exec;
const constants = require('./constants');

const SHIPS_PATH = 'bin/ships/';
const COMMAND = 'java -jar bin/stadium.jar';

let ensureTmpDir = () => {
  return fsp.ensureDir(SHIPS_PATH);
};

let randomString = length => {
  let value = Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(
    36, length)));
  return value.toString(36).slice(1);
};

let getRndFiles = () => {
  let path = SHIPS_PATH + randomString(32);
  return {
    cor: `${path}.cor`,
    log: `${path}.log`
  };
};

let writeShipFile = (ship, files) => {
  return () => {
    return fsp.writeFile(files.cor, ship)
      .then(() => Promise.resolve(files));
  };
};

let deleteShipFile = result => {
  let corPromise = fsp.remove(result.files.cor);
  let logPromise = fsp.remove(result.files.log);
  return Promise.all([corPromise, logPromise])
    .then(() => Promise.resolve(result.result));
};

let getOptions = opts => {
  let res = '';
  if (opts.verbosity) {
    res = `-v ${opts.verbosity}`;
  }
  if (opts.firstCycle) {
    res += ` -f ${opts.firstCycle}`;
  }
  if (opts.lastCycle) {
    res += ` -l ${opts.lastCycle}`;
  }
  if (!opts.pretty) {
    res += ` -j`;
  }
  return res;
};

let runStadium = options => {
  return files => {
    return new Promise((resolve, reject) => {
        exec(`${COMMAND} ${options} ${files.cor} > ${files.log}`, (err, stdout, stderr) => {
          if (err) {
            reject(`Error while runing the stadium: ${err}`);
          } else if (stderr) {
            reject(`Error while runing the stadium: ${stderr}`);
          } else {
            resolve(files);
          }
        });
      })
      .catch(err => {
        deleteShipFile({
          files: files
        }).catch(console.error);

        return Promise.reject(err);
      });
  };
};

let readLogFile = options => {
  return files => {
    let p;
    if (options.pretty) {
      p = fsp.readFile(files.log, {
        encoding: 'utf8'
      });
    } else {
      p = fsp.readJson(files.log);
    }
    return p.then(result => {
      return {
        files: files,
        result: result
      };
    });
  };
};

let run = (ship, options) => {
  options = options || {
    pretty: false
  };
  return ensureTmpDir()
    .then(writeShipFile(ship, getRndFiles()))
    .then(runStadium(getOptions(options)))
    .then(readLogFile(options))
    .then(deleteShipFile);
};

let getShipInfo = ship => {
  return Promise.resolve({
    name: ship.substr(0, constants.shipNameLength).trim(),
    comment: ship.substr(constants.shipNameLength, constants.shipCommentLength).trim()
  });
};

module.exports = {
  run: run,
  getShipInfo: getShipInfo
};
