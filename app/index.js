'use strict';

const app = require('express')();
const constants = require('./constants');

app.use('/warm-up', require('./routers/warm_up_router.js'));
app.use('/race', require('./routers/championship_router.js'));
app.use('/captains', require('./routers/captains_router.js'));
app.use('/leaderboard', require('./routers/leaderboard_router.js'));

let server = app.listen(constants.config.port, () => {
  console.log(`Listening on port ${server.address().port}`);
});
