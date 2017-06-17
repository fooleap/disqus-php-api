disqus-php-api
===========
利用 PHP cURL 转发 Disqus API 请求

> Disqus 被墙，故做几个简单的接口，用于墙内环境访问 Disqus。

### 依赖

* PHP

## 后端

### 后端配置说明

配置文件为 `config.php`

#### $public_key

* 无需修改

#### $origin 

* 网站域名

#### $forum

* Disqus forum 的 shortname

#### $username

* Disqus 用户名

#### $email

* Disqus 登录邮箱

#### $password

* Disqus 登录密码

#### $gfw_inside

* 部署的服务器是否在墙内

## 前端

DEMO: http://blog.fooleap.org/disqus-php-api.html

### 引入 CSS

    <link rel="stylesheet" href="path/to/iDisqus.min.css" />

### 创建容器

    <div id="comment"></div>

### 引入 JS

    <script src="path/to/iDisqus.min.js"></script>

### 创建实例

```javascript
var disq = new iDisqus('comment', {
    forum: 'fooleap',
    api: 'http://api.fooleap.org/disqus',
    site: 'http://blog.fooleap.org',
    url: '/disqus-php-api.html',
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
* 默认："comment"

#### OPTIONS

* new iDisqus(ID, `OPTIONS`);
* {Object}

##### api

* API 地址，PHP 代码部署的网址如：'http://api.fooleap.org/disqus'
* {String}
* **必填**，无默认值

##### forum

* Disqus forum 的 shortname
* {String}
* **必填**，无默认值

##### site

* 网站域名，如：`http://blog.fooleap.org`
* {String}
* 默认：`location.origin`

##### url

* 页面链接，可调用网站模板设置，如：{{ page.url }} （Jekyll）
* {String}
* 默认：`location.pathname`

##### mode

* `1` 加载 Disqus 原生评论框，超时则加载简易评论框
* `2` 仅加载简易评论框
* `3` 同时加载两种评论框，先显示简易评论框，Disqus 加载完成则切换至 Disqus 评论框
* {Number}
* 默认：1 

##### timeout

* 超时时间
* {Number}
* 默认：3000 

##### init

* 是否自动初始化
* {Boolean}
* 默认：false

##### emoji_path

* emoji 表情 PNG 图片路径
* {String}
* 默认："https://assets-cdn.github.com/images/icons/emoji/unicode"

### 实例方法

#### init

* 初始化评论框

#### count

* 加载评论数

#### popular

* 最近热门列表
