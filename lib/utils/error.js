function parseError(err) {
    let stack = err.stack;
    stack = stack.replace(/(\r\n)|(\n)/g, '#split#');
    stack = stack.split('#split#');
    let msg = err.name;
    if(err.name == 'TemplateError') {
        msg = stack.pop();
    } else {
        msg = stack.shift();
    }
    let file_info = stack[0].split(' ').slice(-1)[0].replace(/(\()|(\))/g, '').split(':');
    const column = parseInt(file_info.pop());
    const row = parseInt(file_info.pop());
    const file_path = file_info.join(':');
    let begin = row - 10;
    let end = row + 10;
    let code = '';
    if(begin < 0) {
        end -= begin;
        begin = 0;
    }
    if(file_path == 'anonymous') {
        code = stack;
    } else {
        code = require('fs').readFileSync(file_path);
        code = code.toString().split("\n");
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
        if(err.name == 'TemplateError') {
            stack = [stack[0]];
        }
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