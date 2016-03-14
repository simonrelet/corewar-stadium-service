'use strict';

const router = require('express').Router();
const bodyParser = require('body-parser');
const fsp = require('fs-promise');
const exec = require('child_process').exec;

const SHIPS_PATH = 'bin/ships/';
const STADIUM_CMD = 'java -jar bin/stadium.jar';
const NUMBER_REGEX = /^[0-9]+$/;

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
  extended: true
}));

router.all('/', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With');
  next();
});

let ensureTmpDir = () => {
  return fsp.ensureDir(SHIPS_PATH);
};

let checkRequest = req => {
  return () => {
    if (req.body.src) {
      return Promise.resolve(req.body.src);
    } else {
      return Promise.reject(`The request doesn't contain a 'src' attribute`);
    }
  };
};

let randomString = length => {
  let value = Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length)));
  return value.toString(36).slice(1);
};

let getRndFiles = () => {
  let path = SHIPS_PATH + randomString(32);
  return {
    cor: `${path}.cor`,
    log: `${path}.log`
  };
};

let writeShipFile = files => {
  return content => {
    return fsp.writeFile(files.cor, content)
      .then(() => Promise.resolve(files));
  };
};

let deleteShipFile = result => {
  let corPromise = fsp.remove(result.files.cor);
  let logPromise = fsp.remove(result.files.log);
  return Promise.all([corPromise, logPromise])
    .then(() => Promise.resolve(result.result));
};

let getIntegerOption = (value, optionStr) => {
  if (value && NUMBER_REGEX.test(value)) {
    return `-${optionStr} ${Number.parseInt(value)}`;
  }
  return '';
};

let getOptions = req => {
  return ['v', 'f', 'l']
    .map(elt => getIntegerOption(req.query[elt], elt))
    .reduce((prev, elt) => `${prev} ${elt}`, '');
};

let runStadium = options => {
  return files => {
    return new Promise((resolve, reject) => {
        exec(`${STADIUM_CMD} ${options} ${files.cor} > ${files.log}`, (err, stdout, stderr) => {
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

let readLogFile = files => {
  return fsp.readJson(files.log)
    .then(resultObj => {
      return {
        files: files,
        result: resultObj
      };
    });
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
  ensureTmpDir()
    .then(checkRequest(req))
    .then(writeShipFile(getRndFiles()))
    .then(runStadium(getOptions(req)))
    .then(readLogFile)
    .then(deleteShipFile)
    .then(sendResult(res))
    .catch(handleError(res));
});

module.exports = router;
