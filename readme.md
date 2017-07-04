disqus-php-api
===========
利用 PHP cURL 转发 Disqus API 请求

> Disqus 被墙，故做几个简单的接口，用于墙内环境访问 Disqus。

## Disqus 设置

* 使用 API 实现匿名评论功能，需在 Disqus 后台[网站设置](https://disqus.com/admin/settings/community/)，开启访客评论功能（Guest Commenting 项中勾选 Allow guests to comment）。

## 后端

* 依赖于 PHP，采用 PHP cURL 请求 Disqus API，以获取评论数据，发送访客评论等操作。
* 配置文件为 `config.php`，有简单说明。 

## 前端

DEMO: http://blog.fooleap.org/disqus-php-api.html

项目将 Disqus 原生评论框打包在内，若使用本评论框，需将网页上所有与 Disqus 相关的元素清除，例如 id 为 `disqus_thread` 的容器、`disqus_config` 函数等。

Disqus 评论框的相关配置`disqus_config`：

* `this.page.identifier`: [identifier](#user-content-identifier)，若无设置则为 [url](#user-content-url)
* `this.page.title`: [title](#user-content-title)
* `this.page.url`: [site](#user-content-site) + [url](#user-content-url)

关于 Disqus 原生评论框配置的说明，可以看此页面：https://help.disqus.com/customer/portal/articles/472098-javascript-configuration-variables

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
    mode: 1,
    timeout: 3000,
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

* 页面链接，一般不需要填写
* {String}
* 默认：`location.pathname + location.search`

##### identifier

* 页面标识，按需填写
* {String}
* 默认：[url](#user-content-url)

##### title

* 页面标题
* {String}
* 默认：`document.title`

##### mode

* `1` 检测能否访问 Disqus，若能则加载 Disqus 原生评论框，超时则加载简易评论框
* `2` 仅加载简易评论框
* `3` 同时加载两种评论框，先显示简易评论框，Disqus 加载完成则切换至 Disqus 评论框
* {Number}
* 默认：`1`

##### timeout

* 当 mode 为 1 时的超时时间
* {Number}
* 默认：`3000`

##### toggle

* 当 mode 为 3 时可用，作用是切换评论框
* 具体用法是在网页中放置一个 Checkbox，如 `<input type="checkbox" id="comment-toggle" disabled />`，此项则设置为 `"comment-toggle"`，当 Disqus 加载完时，选择框可用。
* {String}
* 无默认值

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

#### destroy

* 销毁评论框 

#### count

* 加载评论数

#### popular

* 最近热门列表
