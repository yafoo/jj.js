const {Controller, Logger, Ctx, Context} = require('../../../../jj.js');

class Console extends Controller
{
    async index() {
        console.log('Controller:', Controller);
        console.log('Ctx:', Ctx);
        console.log('Context:', Context);
        console.log('Logger:', Logger);
        console.log('=========================');
        console.log('this.$logger:', this.$logger);
        console.log('this.$cache:', this.$cache);
        console.log('this.$controller:', this.$controller);
        console.log('this.$view:', this.$view);
        console.log('this.$db:', this.$db);
        console.log('this.$model:', this.$model);
        console.log('this.$request:', this.$request);
        console.log('this.$response:', this.$response);
        console.log('this.$upload:', this.$upload);
        console.log('this.$utils:', this.$utils);
        console.log('=========================');
        console.log('this.$app:', this.$app);
        console.log('this.$test:', this.$test);
        console.log('this.$config:', this.$config, this.$config.app);
        console.log('this.$logger.info:', this.$logger.info);
        console.log('this.DEEP', this.DEEP);
        this._setDeep(module);
        console.log('this.DEEP', this.DEEP);
        console.log('=========================');
        console.log('this::console', this);
        this.$show('index');
    }
}

module.exports = Console;