'use strict';

const router = require('./default_router')();
const dbUtilities = require('../db_utilities');
const prettyPrinter = require('../pretty_printer');

let getOptions = req => {
  return {
    pretty: !!req.query.pretty
  };
};

let toPublicScore = scores => {
  let ranking = {
    cycles: 0,
    rank: 0
  };
  return scores.map((score, index) => {
    if (score.cycles > ranking.cycles) {
      ranking.cycles = score.cycles;
      ranking.rank = index + 1;
    }
    return {
      rank: ranking.rank,
      cycles: prettyPrinter.cycles(score.cycles),
      name: score.shipName,
      captain: score.captain,
      comment: score.shipComment
    };
  });
};

let getScores = () => {
  return toPublicScore(dbUtilities.getScores());
};

let prettyPrintScores = scores => {
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
    if (options.pretty) {
      res.send(`${err.message}\n`);
    } else {
      res.json({
        error: {
          message: err.message
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
