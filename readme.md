disqus-php-api
===========
利用 PHP cURL 转发 Disqus API 请求

> Disqus 被墙，故做几个简单的接口，用于墙内环境访问 Disqus。

## 后端

* 依赖于 PHP，采用 PHP cURL 请求 Disqus API，以获取评论数据，发送访客评论等操作。
* 需在 Disqus 网站设置开启访客评论功能（Allow guests to comment），方可正常使用。
* 配置文件为 `config.php`，有简单说明。

## 前端

DEMO: http://blog.fooleap.org/disqus-php-api.html

### 引入 CSS

```html
<link rel="stylesheet" href="path/to/iDisqus.min.css" />
```

### 创建容器

```html
<div id="comment"></div>
```

### 引入 JS

```html
<script src="path/to/iDisqus.min.js"></script>
```

### 创建实例

```javascript
var disq = new iDisqus('comment', {
    forum: 'fooleap',
    api: 'http://api.fooleap.org/disqus',
    site: 'http://blog.fooleap.org',
    mode: 2,
    timeout: 3000,
    popular: document.getElementById('popular-posts'),
    slug: location.pathname.slice(1).split('.')[0],
    init: true
});
```

### 配置参数

#### ID

* new iDisqus(`ID`, OPTIONS);
* DOM 节点的 id 属性
* {String}
* 默认：`"comment"`

#### OPTIONS

* new iDisqus(ID, `OPTIONS`);
* {Object}

##### api

* API 地址，PHP 代码部署的网址如：`http://api.fooleap.org/disqus`
* {String}
* **必填**，无默认值

##### forum

* Disqus forum 的 shortname
* {String}
* **必填**，无默认值

##### site

* 网站域名，建议填写，如：`http://blog.fooleap.org`
* {String}
* 默认：`location.origin`

##### url

* 页面链接，一般无需填写，可调用网站模板设置，如：`{{ page.url }}` （Jekyll）
* {String}
* 默认：`location.pathname`

##### mode

* `1` 加载 Disqus 原生评论框，超时则加载简易评论框
* `2` 仅加载简易评论框
* `3` 同时加载两种评论框，先显示简易评论框，Disqus 加载完成则切换至 Disqus 评论框
* {Number}
* 默认：`1`

##### timeout

* 超时时间
* {Number}
* 默认：`3000`

##### init

* 是否自动初始化
* {Boolean}
* 默认：`false`

##### emoji_path

* emoji 表情 PNG 图片路径
* {String}
* 默认：`"https://assets-cdn.github.com/images/icons/emoji/unicode/"`

### 实例方法

#### init

* 初始化评论框

#### count

* 加载评论数

#### popular

* 最近热门列表
