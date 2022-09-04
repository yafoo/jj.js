const fs = require('./fs.js');

function parseError(err) {
    let msg = err.message;
    let stack = err.stack.replace(/(\r\n)/g, "\n").split("\n");

    if(err.name == 'TemplateError') {
        msg = 'TemplateError: ' + stack.pop();
        stack = [stack.shift().replace('TemplateError:', "at")];
    } else {
        stack = stack.filter(text => {return /^    at /.test(text);});
    }

    const file_info = stack[0].split(' ').slice(-1)[0].replace(/(\()|(\))/g, '').split(':');
    const column = parseInt(file_info.pop());
    const row = parseInt(file_info.pop());
    const file_path = file_info.join(':');
    let begin = row - 10;
    let end = row + 10;
    let nth = 0;
    let code = '';
    if(begin < 0) {
        end -= begin;
        begin = 0;
    }
    if(file_path == 'anonymous' || !file_path || !fs.isFileSync(file_path)) {
        code = stack;
    } else {
        code = require('fs').readFileSync(file_path);
        code = code.toString().replace(/(\r\n)/g, "\n").split("\n");
        if(begin < 0) {
            end -= begin;
            begin = 0;
        }
        if(end > code.length) {
            begin -= end - code.length;
            end = code.length;
        }
        if(begin < 0) {
            begin = 0;
        }
        code = code.slice(begin, end);
        nth = row - begin;
    }
    
    return data = {
        msg,
        code,
        stack,
        begin,
        row,
        end,
        column,
        nth
    };
}

module.exports = {parseError};