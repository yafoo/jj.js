const { App, Logger } = require('jj.js');

const port = 3000;
const app = new App();

app.listen(port, () => {
    Logger.system(`Hello World 应用已启动: http://localhost:${port}`);
});
