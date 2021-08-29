module.exports = `<!doctype html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
    <title>jj.js</title>
    <style type="text/css">
        * { padding: 0; margin: 0; }
        body { background: #fff; font-family: "Microsoft Yahei","Helvetica Neue",Helvetica,Arial,sans-serif; color: #333; font-size: 16px; }
        .message { padding: 24px 48px; }
        .message h1 { font-size: 36px; font-weight: normal; line-height: 50px; margin-bottom: 12px; }
        .message h3 { line-height: 1.8em; font-size: 28px; font-weight: normal; }
        .message .code {
            line-height: 1.5em;
            font-size: 12px;
            white-space: pre-wrap;
            background: #303030;
            color: #f1f1f1;
            padding: 10px .2em 10px 3.2em;
            border-radius: 2px;
            -moz-box-shadow: inset 0 0 10px #000;
            box-shadow: inset 0 0 10px #000;
            counter-reset: line {$begin};
        }
        .message .code .line {
            display: block;
            padding-left: 1em;
            padding-right: 1em;
            min-height: 1.5em;
            position: relative;
        }
        .message .code .line:before {
            counter-increment: line;
            content: counter(line);
            display: inline-block;
            box-sizing: border-box;
            border-right: 1px solid #ddd;
            width: 3.2em;
            padding-right: .5em;
            color: #888;
            text-align: right;
            position: absolute;
            left: -3em;
        }
        .message .code .line:nth-child({$nth}) {
            background-color: #efed0b;
            color: #303030;
        }
        .message .code .line:nth-child({$nth}):before {
            background-color: #efed0b;
            color: #333;
        }
        .message .stack{ line-height: 1.8em; font-size: 14px; }
    </style>
</head>
<body>
    <div class="message">
        <h1 class="h0">jj.js</h1>
        <h3>{$msg}</h3>
        <pre class="code">{$code}</pre>
        <h3>Call Stack</h3>
        <p class="stack">{$stack}</p>
    </div>
</body>
</html>`;