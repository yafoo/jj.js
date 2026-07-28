const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../data');
if(!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

/**
 * @module config
 * @type {import('jj.js').DbConfig}
 */
module.exports = {
    default: {
        type: 'sqlite',
        database: path.join(dataDir, 'todo.db'),
        prefix: 'todo_'
    }
};
