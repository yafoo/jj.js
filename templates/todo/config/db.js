const path = require('path');

/**
 * @module config
 * @type {import('jj.js').DbConfig}
 */
module.exports = {
    default: {
        type: 'sqlite',
        database: path.join(__dirname, '../data/todo.db'),
        prefix: 'todo_'
    }
};
