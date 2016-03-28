'use strict';

const columnify = require('columnify');

const CYCLES_REGEX = /(\d+)(\d{3})/;

let prettyCycles = cycles => {
  let res = cycles;
  while (CYCLES_REGEX.test(res)) {
    res = res.replace(CYCLES_REGEX, '$1 $2');
  }
  return res;
};

let prettyRank = rank => {
  return `#${rank}`;
};

let printScores = scores => {
  if (scores.length === 0) {
    return '';
  }

  let columns = columnify(scores, {
    maxLineWidth: 120,
    truncate: true,
    columnSplitter: '   ',
    headingTransform: header => header.charAt(0).toUpperCase() + header.slice(1),
    config: {
      rank: {
        align: 'center',
        dataTransform: prettyRank
      },
      cycles: {
        dataTransform: prettyCycles
      },
      name: {
        maxWidth: 20
      },
      comment: {
        maxWidth: 50
      }
    }
  });
  return `${columns}\n`;
};

module.exports = {
  scores: printScores
};
