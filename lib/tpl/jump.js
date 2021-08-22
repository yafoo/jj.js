module.exports = `<!doctype html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
    <title>跳转提示</title>
    <style type="text/css">
        *{ padding: 0; margin: 0; }
        body{ background: #fff; font-family: "Microsoft Yahei","Helvetica Neue",Helvetica,Arial,sans-serif; color: #333; font-size: 16px; }
        .message{ padding: 24px 48px; }
        .message h1{ font-size: 42px; font-weight: normal; line-height: 120px; margin-bottom: 12px; display: none; }
        .message .h{$state}{ display: initial; }
        .message .text{ line-height: 1.8em; font-size: 36px; }
        .message .jump{ padding-top: 10px; }
        .message .jump a{ color: #333; }
    </style>
</head>
<body>
    <div class="message">
        <h1 class="h1">◠‿◠</h1>
        <h1 class="h0">&gt;﹏&lt;</h1>
        <p class="text">{$msg}</p>
        <p class="jump">
            页面自动 <a id="href" href="{$url}">跳转</a> 等待时间：<b id="wait">{$wait}</b>
        </p>
    </div>
    <script>
        (function(){
            var wait = document.getElementById('wait'),
                href = document.getElementById('href').href;
            var interval = setInterval(function(){
                var time = --wait.innerHTML;
                if(time <= 0) {
                    location.href = href;
                    clearInterval(interval);
                };
            }, 1000);
        })();
    </script>
</body>
</html>`;