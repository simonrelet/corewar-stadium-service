'use strict';

const app = require('express')();

app.use('/warm-up', require('./routers/warm_up_router.js'));
app.use('/race', require('./routers/championship_router.js'));
app.use('/captains', require('./routers/captains_router.js'));

let server = app.listen(4202, () => {
  console.log(`Listening on port ${server.address().port}`);
});
