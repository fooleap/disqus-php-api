disqus-php-api
===========

> Disqus 被墙，故做几个简单的接口，用于墙内环境访问 Disqus。此为 DEMO，不完善，并不建议直接使用，可作参考。

### 依赖

* PHP
* 可访问 Disqus 网站的服务器

### 使用

配置项在 `api/init.php` 文件，有简单说明，具体使用可参考如下，不清楚可联系 [@fooleap](http://blog.fooleap.org)

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
       <script src="path/to/disqus-api.js"></script>
   </body>
</html>
```
