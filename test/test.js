//const {app} = require('jj.js');
const {app, Logger} = require('../jj.js');

//server
app.run(3000, '127.0.0.1', function(err){
    if(!err) Logger.info('http server is ready on 3000');
});