function toHump(name) {
    return name.replace(/\_(\w)/g, function(all, letter){
        return letter.toUpperCase();
    });
}

function toLine(name) {
    return name.replace(/(?!^)([A-Z])/g, "_$1").toLowerCase();
}

module.exports = {toHump, toLine};