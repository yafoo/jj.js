//const {app} = require('jj.js');
const {app, Logger} = require('../jj.js');

//server
app.run(3000, '0.0.0.0', function(err){
    !err && Logger.info('http server is ready on 3000');
});