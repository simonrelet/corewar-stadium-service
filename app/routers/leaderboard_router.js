'use strict';

const router = require('./default_router')();
const dbUtilities = require('../db_utilities');

let getOptions = req => {
  return {
    pretty: !!req.query.pretty
  };
};

let getScores = () => {
  return dbUtilities.getScores();
};

let prettyPrintScores = scores => {
  return scores.map((score, index) =>
      `  #${index + 1}   ${score.shipName} in ${score.cycles} cycles by ${score.captain}, '${score.shipComment}'.`
    )
    .reduce((prev, score) => `${prev}${score}\n`, '\n');
};

let sendResult = (res, options) => {
  return scores => {
    if (options.pretty) {
      res.send(`${prettyPrintScores(scores)}\n`);
    } else {
      res.json(scores);
    }
  };
};

let handleError = (res, options) => {
  return err => {
    if (options.pretty) {
      res.send(err);
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
