module.exports = class {
    constructor(arg1, arg2, arg3) {
        this.arg1 = arg1;
        this.arg2 = arg2;
        this.arg3 = arg3;
    }

    index() {
        return 'index';
    }

    get getVar() {
        return this._getVar;
    }

    set getVar(value) {
        this._getVar = value;
    }
}