disqus-php-api
===========

> Disqus 被墙，故做几个简单的接口，用于墙内环境访问 Disqus。此为 DEMO，不完善，并不建议直接使用，可作参考。

### 依赖

* PHP
* 可访问 Disqus 网站的服务器

### 使用


配置项在 `api/init.php` 文件，有简单说明。

`disqus-api.js` 文件需与 `api` 目录放同一目录下，具体在网页中使用可参考如下，不清楚可联系 [@fooleap](http://blog.fooleap.org)

`shortname` 是 Disqus 对应的 `forum`，此参数选填，填入后视网络环境优先加载 Disqus 评论框。

```html
<!DOCTYPE html>
<html>
   <head>
       ...
       <link rel="stylesheet" href="path/to/disqus-api.css" />
   </head>
   <body>
       ...
       <div id="comment"></div>
       <script src="path/to/disqus-api.js?shortname=fooleap"></script>
   </body>
</html>
```

### TODO

- [x] 检测是否能连接 Disqus，加载相应的评论框
- [x] Emoji 表情以 unicode 发送给 Disqus
- [x] 非访客不发送回复通知邮件
- [ ] 移除微信表情
