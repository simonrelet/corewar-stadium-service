'use strict';

const router = require('./default_router')();
const dbUtilities = require('../db_utilities');
const constants = require('../constants');
const prettyPrinter = require('../pretty_printer');

let getOptions = req => {
  return {
    pretty: !!req.query.pretty
  };
};

let getScores = () => {
  return dbUtilities.getScores()
    .catch(err => Promise.reject({
      status: constants.status.serverError,
      message: err
    }));
};

let prettyPrintScores = scores => {
  let ranking = {
    cycles: 0,
    rank: 0
  };
  scores = scores.map((score, index) => {
    if (score.cycles > ranking.cycles) {
      ranking.cycles = score.cycles;
      ranking.rank = index + 1;
    }
    return {
      rank: ranking.rank,
      cycles: score.cycles,
      name: score.shipName,
      captain: score.captain,
      comment: score.shipComment
    };
  });
  return prettyPrinter.scores(scores);
};

let sendResult = (res, options) => {
  return scores => {
    if (options.pretty) {
      res.send(prettyPrintScores(scores));
    } else {
      res.json(scores);
    }
  };
};

let handleError = (res, options) => {
  return err => {
    res.status(err.status);
    if (options.pretty) {
      res.send(`${err}\n`);
    } else {
      res.json({
        error: {
          message: err
        }
      });
    }
  };
};

router.get('/', (req, res) => {
  let options = getOptions(req);
  getScores()
    .then(sendResult(res, options))
    .catch(handleError(res, options));
});

module.exports = router;
