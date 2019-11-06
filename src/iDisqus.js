/*!
 * 
 * @author fooleap
 * @email fooleap@gmail.com
 * @create 2017-06-17 20:48:25
 * @update 2019-11-06 13:53:02
 * @version 0.2.30
 * Copyright 2017-2019 fooleap
 * Released under the MIT license
 */
require('./iDisqus.scss');
(function (global) {
    'use strict';

    var d = document,
        l = localStorage,
        scripts = d.scripts,
        lasturl = scripts[scripts.length - 1].src,
        filepath = lasturl.substring(0, lasturl.lastIndexOf('/')),
        isEdge = navigator.userAgent.indexOf("Edge") > -1,
        isIE = !!window.ActiveXObject || "ActiveXObject" in window;

    function getLocation(href) {
        var link = d.createElement('a');
        link.href = href;
        return link;
    }

    function getAjax(url, success, error) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', encodeURI(url));
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                success(xhr.responseText);
            }
        }
        xhr.onerror = error;
        xhr.withCredentials = true;
        xhr.send();
        return xhr;
    }

    function postAjax(url, data, success, error) {
        var params = typeof data == 'string' ? data : Object.keys(data).filter(function (k) {
            return data[k] != null;
        }).map(function (k) {
            return encodeURIComponent(k) + '=' + encodeURIComponent(data[k])
        }).join('&');

        var xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                success(xhr.responseText);
            }
        };
        xhr.onerror = error;
        xhr.withCredentials = true;
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.send(params);
        return xhr;
    }

    function generateGUID() {
        var time = Number(new Date().getTime().toString().substring(3));
        var guid = Math.abs(time + Math.floor(Math.random() * 1e5) - 48 * 1e6 + Math.floor(Math.random() * 1e6)).toString(32);
        guid += Math.floor(Math.random() * 1e9).toString(32);
        return guid;
    }

    (function (ElementProto) {
        // matches & closest polyfill https://github.com/jonathantneal/closest
        if (typeof ElementProto.matches !== 'function') {
            ElementProto.matches = ElementProto.msMatchesSelector || ElementProto.mozMatchesSelector || ElementProto.webkitMatchesSelector || function matches(selector) {
                var element = this;
                var elements = (element.document || element.ownerDocument).querySelectorAll(selector);
                var index = 0;

                while (elements[index] && elements[index] !== element) {
                    ++index;
                }

                return Boolean(elements[index]);
            };
        }

        if (typeof ElementProto.closest !== 'function') {
            ElementProto.closest = function closest(selector) {
                var element = this;

                while (element && element.nodeType === 1) {
                    if (element.matches(selector)) {
                        return element;
                    }

                    element = element.parentNode;
                }

                return null;
            };
        }

        // 事件委托
        ElementProto.on = function on(eventName, selector, handler) {
            this.addEventListener(eventName, function (e) {
                for (var target = e.target; target && target != this; target = target.parentNode) {
                    if (target.matches(selector)) {
                        handler.call(null, e, target);
                        break;
                    }
                }
            }, true);
        };

    })(window.Element.prototype);

    // 访客信息
    var User = function () {
        this.dom = arguments[0];
        this.opts = arguments[1];
        this.init();
        this.autologin();
    }

    User.prototype = {
        // 初始化访客信息
        init: function () {
            var _ = this;
            // 读取访客信息
            _.name = l.getItem('name');
            _.email = l.getItem('email');
            _.url = l.getItem('url');
            _.avatar = l.getItem('avatar');
            _.type = l.getItem('type');
            _.logged_in = l.getItem('logged_in');
            _.unique = l.getItem('disqus_unique')
            if (!l.getItem('vote')) {
                l.setItem('vote', JSON.stringify({}));
            }
            if (!l.getItem('reaction_vote')) {
                l.setItem('reaction_vote', JSON.stringify({}));
            }
            _.vote = JSON.parse(l.getItem('vote'));
            _.reactionVote = JSON.parse(l.getItem('reaction_vote'));

            var boxarr = _.dom.getElementsByClassName('comment-box');
            if (_.logged_in == 'true') {
                [].forEach.call(boxarr, function (item) {
                    if (_.type == '1') {
                        item.querySelector('.comment-form-wrapper').classList.add('logged-in');
                    }
                    item.querySelector('.comment-form-name').value = _.name;
                    item.querySelector('.comment-form-email').value = _.email;
                    item.querySelector('.comment-form-url').value = _.url;
                    item.querySelector('.comment-avatar-image').src = _.avatar;
                });
            } else {
                [].forEach.call(boxarr, function (item) {
                    item.querySelector('.comment-form-wrapper').classList.remove('logged-in');
                    item.querySelector('.comment-form-name').value = '';
                    item.querySelector('.comment-form-email').value = '';
                    item.querySelector('.comment-form-url').value = '';
                    item.querySelector('.comment-avatar-image').src = _.dom.querySelector('.comment-avatar-image').dataset.avatar;
                });
                l.setItem('logged_in', 'false');
            }

            if (_.type == '1' && _.logged_in == 'true') {
                var $login = _.dom.querySelector('.comment-login');
                if (!!$login) {
                    $login.innerHTML = _.name + '<label class="comment-logout"  title="退出" for="comment-user">退出登录</label>';
                    $login.title = _.name;
                    $login.classList.add('comment-user');
                    $login.classList.remove('comment-login');
                    _.dom.querySelector('#comment-user').checked = false;
                }
            } else {
                var $user = _.dom.querySelector('.comment-user');
                if (!!$user) {
                    $user.innerHTML = '登录';
                    $user.title = '使用 Disqus 帐号授权登录';
                    $user.classList.add('comment-login');
                    $user.classList.remove('comment-user');
                }
            }

        },

        // 自动登录
        autologin: function () {
            var _ = this;
            getAjax(_.opts.api + '/user.php', function (resp) {
                var data = JSON.parse(resp);
                if (data.code == 0) {
                    var user = data.response;
                    _.avatar = user.avatar;
                    _.name = user.name;
                    _.username = user.username;
                    _.url = user.url;
                    _.type = user.type
                    _.submit();
                } else {
                    if (_.type == '1') {
                        l.setItem('logged_in', 'false');
                        _.init();
                    } else {
                        l.setItem('type', '0');
                        if (!_.unique) {
                            l.setItem('disqus_unique', generateGUID());
                        }
                        _.init();
                    }
                }
            }, function () {
            })
        },

        // 登录
        login: function () {

            var _ = this;
            var popup = window.open(_.opts.api + '/login.php', 'Disqus Oauth', 'width=470,height=508');
            var timer;
            function isLogged() {
                if (!popup || !popup.closed) return;
                clearInterval(timer);
                _.user.autologin();
            }
            timer = setInterval(isLogged, 100);

        },

        // 退出登录
        logout: function () {
            var _ = this;
            postAjax(_.opts.api + '/logout.php', {}, function (resp) {
                l.setItem('logged_in', 'false');
                l.removeItem('type');
                l.removeItem('email');
                l.removeItem('avatar');
                l.removeItem('name');
                l.removeItem('url');
                l.removeItem('disqus_unique');
                l.removeItem('vote');
                l.removeItem('reaction_vote');
                _.user.init();
            })
        },

        // 提交访客信息
        submit: function () {
            var _ = this;
            l.setItem('email', _.email);
            l.setItem('type', _.type);
            l.setItem('name', _.name);
            l.setItem('url', _.url);
            l.setItem('avatar', _.avatar);
            l.setItem('disqus_unique', _.unique);
            l.setItem('logged_in', 'true');
            this.init();
        }
    }

    var iDisqus = function () {
        var _ = this;

        // 配置
        _.opts = typeof (arguments[1]) == 'object' ? arguments[1] : arguments[0];
        _.dom = d.getElementById(typeof (arguments[0]) == 'string' ? arguments[0] : 'comment');
        _.opts.api = _.opts.api.slice(-1) == '/' ? _.opts.api.slice(0, -1) : _.opts.api;
        _.opts.site = _.opts.site || location.origin;
        if (!!_.opts.url) {
            var optsUrl = _.opts.url.replace(_.opts.site, '');
            _.opts.url = optsUrl.slice(0, 1) != '/' ? '/' + optsUrl : optsUrl;
        } else if (isEdge || isIE) {
            _.opts.url = encodeURI(location.pathname) + encodeURI(location.search);
        } else {
            _.opts.url = location.pathname + location.search;
        }
        _.opts.identifier = _.opts.identifier || _.opts.url;
        _.opts.link = _.opts.site + _.opts.url;
        _.opts.title = _.opts.title || d.title;
        _.opts.slug = !!_.opts.slug ? _.opts.slug.replace(/[^A-Za-z0-9_-]+/g, '') : '';
        _.opts.desc = _.opts.desc || (!!d.querySelector('[name="description"]') ? d.querySelector('[name="description"]').content : '');
        _.opts.mode = _.opts.mode || 1;
        _.opts.timeout = _.opts.timeout || 3000;
        _.opts.toggle = !!_.opts.toggle ? d.getElementById(_.opts.toggle) : null;
        _.opts.autoCreate = !!_.opts.autoCreate || !!_.opts.auto;
        _.opts.relatedType = _.opts.relatedType || 'related'

        // emoji 表情
        _.opts.emojiPath = _.opts.emojiPath || _.opts.emoji_path || 'https://github.githubassets.com/images/icons/emoji/unicode/';
        _.emojiList = _.opts.emojiList || _.opts.emoji_list || [{
            code: 'smile',
            title: '笑脸',
            unicode: '1f604'
        }, {
            code: 'mask',
            title: '生病',
            unicode: '1f637'
        }, {
            code: 'joy',
            title: '破涕为笑',
            unicode: '1f602'
        }, {
            code: 'stuck_out_tongue_closed_eyes',
            title: '吐舌',
            unicode: '1f61d'
        }, {
            code: 'flushed',
            title: '脸红',
            unicode: '1f633'
        }, {
            code: 'scream',
            title: '恐惧',
            unicode: '1f631'
        }, {
            code: 'pensive',
            title: '失望',
            unicode: '1f614'
        }, {
            code: 'unamused',
            title: '无语',
            unicode: '1f612'
        }, {
            code: 'grin',
            title: '露齿笑',
            unicode: '1f601'
        }, {
            code: 'heart_eyes',
            title: '色',
            unicode: '1f60d'
        }, {
            code: 'sweat',
            title: '汗',
            unicode: '1f613'
        }, {
            code: 'smirk',
            title: '得意',
            unicode: '1f60f'
        }, {
            code: 'relieved',
            title: '满意',
            unicode: '1f60c'
        }, {
            code: 'rolling_eyes',
            title: '翻白眼',
            unicode: '1f644'
        }, {
            code: 'ok_hand',
            title: 'OK',
            unicode: '1f44c'
        }, {
            code: 'v',
            title: '胜利',
            unicode: '270c'
        }];

        if (!!_.opts.emoji_preview || !!_.opts.emojiPreview) {
            getAjax(_.opts.api + '/eac.php', function (resp) {
                _.eac = JSON.parse(resp);
            }, function () {
            })
        }

        // 默认状态
        _.stat = {
            current: 'idisqus', // 当前显示评论框
            loaded: false,      // 评论框已加载
            loading: false,     // 评论加载中
            editing: false,     // 评论编辑中
            offsetTop: 0,       // 高度位置
            next: null,         // 下条评论
            message: null,      // 新评论
            mediaHtml: null,    // 新上传图片
            forum: {},          // 站点信息
            thread: {},         // 文章信息
            post: {},           // 评论数据
            media: {},          // 媒体信息
            root: [],           // 根评论
            order: 'desc',      // 排序
            users: [],          // Disqus 会员
            imageSize: [],      // 已上传图片大小
            disqusLoaded: false // Disqus 已加载
        };

        // Disqus 评论框设置
        window.disqus_config = function () {
            this.page.identifier = _.opts.identifier;
            this.page.title = _.opts.title;
            this.page.url = _.opts.link;
            this.callbacks.onReady.push(function () {
                _.stat.current = 'disqus';
                _.stat.disqusLoaded = true;
                _.dom.querySelector('#idisqus').style.display = 'none';
                _.dom.querySelector('#disqus_thread').style.display = 'block';
                if (_.opts.mode == 3 && !!_.opts.toggle) {
                    _.opts.toggle.disabled = '';
                    _.opts.toggle.checked = true;
                    _.opts.toggle.addEventListener('change', _.handle.toggle, false);
                }
            });
            // 原生评论框发邮件
            this.callbacks.onNewComment = [function (comment, a) {
                var postData = {
                    id: comment.id
                }
                // 异步发送邮件
                setTimeout(function () {
                    postAjax(_.opts.api + '/sendemail.php', postData, function (resp) {
                        console.info('邮件发送成功！');
                    })
                }, 2000);
            }];
        }

        // 自动初始化
        if (!!_.opts.init) {
            _.init();
            //console.log(_);
        }
    }

    // TimeAgo https://coderwall.com/p/uub3pw/javascript-timeago-func-e-g-8-hours-ago
    iDisqus.prototype.timeAgo = function () {

        var _ = this;
        var templates = {
            prefix: "",
            suffix: "前",
            seconds: "几秒",
            minute: "1分钟",
            minutes: "%d分钟",
            hour: "1小时",
            hours: "%d小时",
            day: "1天",
            days: "%d天",
            week: "1周",
            weeks: "%d周",
            month: "1个月",
            months: "%d个月",
            year: "1年",
            years: "%d年"
        };
        var template = function (t, n) {
            return templates[t] && templates[t].replace(/%d/i, Math.abs(Math.round(n)));
        };

        var timer = function (time) {
            if (!time) return;
            time = time.replace(/\.\d+/, ""); // remove milliseconds
            time = time.replace(/-/, "/").replace(/-/, "/");
            time = time.replace(/T/, " ").replace(/Z/, " UTC");
            time = time.replace(/([\+\-]\d\d)\:?(\d\d)/, " $1$2"); // -04:00 -> -0400
            time = new Date(time * 1000 || time);

            var now = new Date();
            var seconds = ((now.getTime() - time) * .001) >> 0;
            var minutes = seconds / 60;
            var hours = minutes / 60;
            var days = hours / 24;
            var weeks = days / 7;
            var months = days / 30;
            var years = days / 365;

            return templates.prefix + (seconds < 45 && template('seconds', seconds) || seconds < 90 && template('minute', 1) || minutes < 45 && template('minutes', minutes) || minutes < 90 && template('hour', 1) || hours < 24 && template('hours', hours) || hours < 42 && template('day', 1) || days < 30 && template('days', days) || days < 45 && template('month', 1) || days < 365 && template('months', months) || years < 1.5 && template('year', 1) || template('years', years)) + templates.suffix;
        };

        var elements = _.dom.querySelectorAll('time[datetime]');
        for (var i in elements) {
            var $this = elements[i];
            if (typeof $this === 'object') {
                $this.title = new Date($this.getAttribute('datetime'));
                $this.innerHTML = timer($this.getAttribute('datetime'));
            }
        }

        // update time every minute
        setTimeout(_.timeAgo.bind(_), 60000);

    }

    // 初始化评论框
    iDisqus.prototype.init = function () {
        var _ = this;
        if (!_.dom) {
            //console.log('该页面没有评论框！');
            return
        }
        // 表情
        var emojiList = '';
        _.emojiList.forEach(function (item) {
            emojiList += '<li class="emojione-item" title="' + item.title + '" data-code=":' + item.code + ':"><img class="emojione-item-image" src="' + _.opts.emojiPath + item.unicode + '.png" /></li>';
        })
        _.dom.innerHTML = `<div class="comment init" id="idisqus">
            <div class="comment-reaction">
                <div class="comment-reaction-header">
                    <div class="comment-reaction-prompt"></div>
                    <div class="comment-reaction-total"></div>
                </div>
                <div class="comment-reaction-list"></div>
            </div>
            <div class="init-container" data-tips="正在初始化……"><svg class="init-bg" width="72" height="72" viewBox="0 0 720 720" version="1.1" xmlns="http://www.w3.org/2000/svg"><path class="ring" fill="none" stroke="#9d9ea1" d="M 0 -260 A 260 260 0 1 1 -80 -260" transform="translate(400,400)" stroke-width="50" /><polygon transform="translate(305,20)" points="50,0 0,100 18,145 50,82 92,145 100,100" style="fill:#9d9ea1"/></svg></div>
            <div class="comment-header">
                <div class="comment-header-primary">
                    <span class="comment-header-item" id="comment-count">评论</span>
                    <a class="comment-header-item" id="comment-link" target="_blank">在线讨论</a>
                </div>
                <div class="comment-header-menu">
                    <input class="comment-header-checkbox" type="checkbox" id="comment-user">
                    <label class="comment-header-item comment-login" title="使用 Disqus 帐号授权登录" for="comment-user">登录</label>
                </div>
            </div>
            <div class="comment-navbar">
                <div class="comment-navbar-item">
                    <a class="comment-recommend" href="javascript:;"><svg t="1537508059126" class="icon" style="" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3234" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24"><path d="M489.993 887.107 177.906 586.021c-4.002-3.501-114.033-104.031-114.033-224.063 0-146.54 89.526-234.065 239.069-234.065 87.523 0 169.546 69.019 209.058 108.03 39.512-39.011 121.535-108.03 209.059-108.03 149.542 0 239.068 87.525 239.068 234.065 0 120.033-110.031 220.563-114.533 225.065L534.007 887.107c-6 6-14.003 9-22.007 9C503.997 896.107 495.993 893.107 489.993 887.107z" p-id="3235"></path></svg><span class="comment-recommend-text">推荐</span><span class="comment-recommend-count"></span></a>
                </div>
                <div class="comment-navbar-item comment-order">
                  <input class="comment-order-radio" id="order-popular" type="radio" name="comment-order" value="popular" />
                  <label class="comment-order-label" for="order-popular" title="按评分高低排序">最佳</label>
                  <input class="comment-order-radio" id="order-desc" type="radio" name="comment-order" value="desc" />
                  <label class="comment-order-label" for="order-desc" title="按从新到旧排序">最新</label>
                  <input class="comment-order-radio" id="order-asc" type="radio" name="comment-order" value="asc" />
                  <label class="comment-order-label" for="order-asc" title="按从旧到新排序">最早</label>
                </div>
            </div>
            <div class="comment-box">
                <div class="comment-avatar avatar"><img class="comment-avatar-image" src="//a.disquscdn.com/images/noavatar92.png" data-avatar="//a.disquscdn.com/images/noavatar92.png"></div>
                <div class="comment-form">
                    <div class="comment-form-wrapper">
                        <textarea class="comment-form-textarea" placeholder="加入讨论……"></textarea>
                        <div class="comment-form-alert"></div>
                        <div class="comment-image">
                            <ul class="comment-image-list"></ul>
                            <div class="comment-image-progress"><div class="comment-image-loaded"></div></div>
                        </div>
        
                        <div class="comment-actions">
        
                            <div class="comment-actions-group">
                                <input id="emoji-input" class="comment-actions-input" type="checkbox">
                                <label class="comment-actions-label emojione" for="emoji-input">
                                    <svg class="icon" fill="#c2c6cc" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200">
                                        <g>
                                            <title>选择表情</title>
                                            <path d="M512 1024c-282.713043 0-512-229.286957-512-512s229.286957-512 512-512c282.713043 0 512 229.286957 512 512S792.486957 1024 512 1024zM512 44.521739c-258.226087 0-467.478261 209.252174-467.478261 467.478261 0 258.226087 209.252174 467.478261 467.478261 467.478261s467.478261-209.252174 467.478261-467.478261C979.478261 253.773913 768 44.521739 512 44.521739z"></path>
                                            <path d="M801.391304 554.295652c0 160.278261-129.113043 289.391304-289.391304 289.391304s-289.391304-129.113043-289.391304-289.391304L801.391304 554.295652z"></path>
                                            <path d="M674.504348 349.495652m-57.878261 0a2.6 2.6 0 1 0 115.756522 0 2.6 2.6 0 1 0-115.756522 0Z"></path>
                                            <path d="M347.269565 349.495652m-57.878261 0a2.6 2.6 0 1 0 115.756522 0 2.6 2.6 0 1 0-115.756522 0Z"></path>
                                        </g>
                                    </svg>
                                    <ul class="emojione-list">${ emojiList}</ul>
                                </label>
                                <input id="upload-input" class="comment-actions-input comment-image-input" type="file" accept="image/*" name="file">
                                <label class="comment-actions-label" for="upload-input">
                                    <svg class="icon" fill="#c2c6cc" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200">
                                        <g>
                                            <title>上传图片</title>
                                            <path d="M15.515152 15.515152 15.515152 15.515152 15.515152 15.515152Z"></path>
                                            <path d="M15.515152 139.636364l0 806.787879 992.969697 0 0-806.787879-992.969697 0zM946.424242 884.363636l-868.848485 0 0-682.666667 868.848485 0 0 682.666667zM698.181818 356.848485c0-51.417212 41.673697-93.090909 93.090909-93.090909s93.090909 41.673697 93.090909 93.090909c0 51.417212-41.673697 93.090909-93.090909 93.090909s-93.090909-41.673697-93.090909-93.090909zM884.363636 822.30303l-744.727273 0 186.181818-496.484848 248.242424 310.30303 124.121212-93.090909z"></path>
                                        </g>
                                    </svg>
                                </label>
                            </div>
        
                            <div class="comment-actions-form">
                                <button class="comment-form-submit">
                                    <svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200">
                                        <path d="M565.747623 792.837176l260.819261 112.921839 126.910435-845.424882L66.087673 581.973678l232.843092 109.933785 562.612725-511.653099-451.697589 563.616588-5.996574 239.832274L565.747623 792.837176z" fill="#ffffff"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>

                    </div>
                    <div class="comment-form-user">
                        <form class="comment-form-guest"><input class="comment-form-input comment-form-name" type="text" name="name" placeholder="名字（必填）" autocomplete="name" /><input class="comment-form-input comment-form-email" type="email" name="email" placeholder="邮箱（必填）" autocomplete="email" /><input class="comment-form-input comment-form-url" type="url" name="url" placeholder="网址（可选）" autocomplete="url" /></form>
                    </div>
                </div>
            </div>
            <ul id="comments" class="comment-list" data-tips="评论加载中……"></ul>
            <a href="javascript:;" class="comment-loadmore hide">加载更多</a>
            <div class="comment-related"></div>
        </div>
        <div class="comment" id="disqus_thread"></div>`;

        _.user = new User(_.dom, _.opts);
        _.handle = {
            logout: _.user.logout.bind(_),
            login: _.user.login.bind(_),
            loadMore: _.loadMore.bind(_),
            loadMoreReply: _.loadMoreReply.bind(_),
            post: _.post.bind(_),
            threadCreate: _.threadCreate.bind(_),
            threadVote: _.threadVote.bind(_),
            reactionVote: _.reactionVote.bind(_),
            remove: _.remove.bind(_),
            show: _.show.bind(_),
            toggle: _.toggle.bind(_),
            upload: _.upload.bind(_),
            verify: _.verify.bind(_),
            jump: _.jump.bind(_),
            mention: _.mention.bind(_),
            keySelect: _.keySelect.bind(_),
            field: _.field.bind(_),
            focus: _.focus,
            input: _.input.bind(_),
            parentShow: _.parentShow.bind(_),
            selectOrder: _.selectOrder.bind(_)
        };

        var $iDisqus = _.dom.querySelector('#idisqus');
        $iDisqus.on('blur', '.comment-form-textarea', _.handle.focus);
        $iDisqus.on('focus', '.comment-form-textarea', _.handle.focus);
        $iDisqus.on('input', '.comment-form-textarea', _.handle.input);
        $iDisqus.on('propertychange', '.comment-form-textarea', _.handle.input);
        $iDisqus.on('keyup', '.comment-form-textarea', _.handle.mention);
        $iDisqus.on('keydown', '.comment-form-textarea', _.handle.keySelect);
        $iDisqus.on('blur', '.comment-form-name', _.handle.verify);
        $iDisqus.on('blur', '.comment-form-email', _.handle.verify);
        $iDisqus.on('click', '.comment-form-submit', _.handle.post);
        $iDisqus.on('click', '.comment-login', _.handle.login);
        $iDisqus.on('change', '.comment-image-input', _.handle.upload);
        $iDisqus.on('click', '.emojione-item', _.handle.field);
        $iDisqus.on('click', '.comment-logout', _.handle.logout);
        $iDisqus.on('click', '.comment-item-reply', _.handle.show);
        $iDisqus.on('click', '.comment-item-cancel', _.handle.show);
        $iDisqus.on('click', '.comment-item-avatar', _.handle.jump);
        $iDisqus.on('click', '.comment-item-pname', _.handle.jump);
        $iDisqus.on('mouseover', '.comment-item-pname', _.handle.parentShow);
        $iDisqus.on('click', '.comment-loadmore', _.handle.loadMore);
        $iDisqus.on('click', '.comment-item-loadmore', _.handle.loadMoreReply);
        $iDisqus.on('click', '#thread-submit', _.handle.threadCreate);
        $iDisqus.on('click', '.comment-recommend', _.handle.threadVote);
        $iDisqus.on('click', '.comment-reaction-btn:not(.selected)', _.handle.reactionVote);
        $iDisqus.on('change', '.comment-order-radio', _.handle.selectOrder);

        switch (_.opts.mode) {
            case 1:
                _.disqus();
                break;
            case 2:
                _.threadInit();
                break;
            case 3:
                _.threadInit();
                _.disqus();
                break;
            default:
                _.disqus();
                break;
        }
    }

    // 切换评论框
    iDisqus.prototype.toggle = function () {
        var _ = this;
        if (_.stat.current == 'disqus') {
            _.stat.current = 'idisqus';
            _.dom.querySelector('#idisqus').style.display = 'block';
            _.dom.querySelector('#disqus_thread').style.display = 'none';
        } else {
            _.disqus();
        }
    }

    // 加载 Disqus 评论
    iDisqus.prototype.disqus = function () {
        var _ = this;
        var _tips = _.dom.querySelector('.init-container').dataset.tips;
        if (_.opts.site != location.origin) {
            console.log('本地环境不加载 Disqus 评论框！');
            if (_.opts.mode == 1) {
                _.threadInit();
            }
            return;
        }
        if (!_.stat.disqusLoaded) {
            _tips = '尝试连接 Disqus……';

            var s = d.createElement('script');
            s.src = '//' + _.opts.forum + '.disqus.com/embed.js';
            s.dataset.timestamp = Date.now();
            s.onload = function () {
                _.stat.disqusLoaded = true;
                _tips = '连接成功，加载 Disqus 评论框……'
            }
            s.onerror = function () {
                if (_.opts.mode == 1) {
                    _tips = '连接失败，加载简易评论框……';
                    _.threadInit();
                }
            }


            var img = new Image();
            img.onerror = function () {
              if (_.opts.mode == 1) {
                _tips = '连接超时，加载简易评论框……';
                _.threadInit();
              }
            }
            img.onload = function () {
              (d.head || d.body).appendChild(s);
              clearTimeout(timer)
            };
            img.src = 'https://disqus.com/favicon.ico?' + Date.now();
            var timer = setTimeout(function () {
              if ( !img.complete || !img.naturalWidth ) {
                if (_.opts.mode == 1) {
                  _tips = '连接失败，加载简易评论框……';
                  _.threadInit();
                }
              }
            }, _.opts.timeout);
        } else {
            _.stat.current = 'disqus';
            _.dom.querySelector('#idisqus').style.display = 'none';
            _.dom.querySelector('#disqus_thread').style.display = 'block';
        }
    }

    // 添加事件监听
    iDisqus.prototype.addListener = function (els, evt, func) {
        var _ = this;
        var el = _.dom.getElementsByClassName(els);
        [].forEach.call(el, function (item) {
            item.addEventListener(evt, func, false);
        });
    }

    // 评论计数
    iDisqus.prototype.count = function () {
        var _ = this;
        var counts = d.querySelectorAll('[data-disqus-url]');
        var qty = counts.length;
        if (qty > 0) {
            var commentArr = [];
            for (var i = 0; i < qty; i++) {
                commentArr[i] = counts[i].dataset.disqusUrl.replace(_.opts.site, '');
            }
            getAjax(
                _.opts.api + '/threadsList.php?links=' + commentArr.join(','),
                function (resp) {
                    var data = JSON.parse(resp);
                    var posts = data.response;
                    posts.forEach(function (item) {
                        var link = document.createElement('a');
                        link.href = item.link;
                        var itemLink = link.href.replace(link.origin, '');
                        var el = d.querySelector('[data-disqus-url$="' + itemLink + '"]')
                        if (!!el) {
                            el.innerHTML = item.posts;
                            el.dataset.disqusCount = item.posts;
                        }
                    });
                }, function () {
                    console.log('获取数据失败！')
                }
            );
        }
    };

    // 加载最近评论
    iDisqus.prototype.postsList = function (listLimit, containerId) {
        var _ = this;
        listLimit = listLimit || 5;
        var listContainer = d.getElementById(typeof (containerId) == 'string' ? containerId : 'disqusPostsList');
        if (listContainer) {
            getAjax(
                _.opts.api + '/postsList.php?limit=' + listLimit,
                function (resp) {
                    var data = JSON.parse(resp);
                    var posts = data.response;
                    var popHtml = '';
                    posts.forEach(function (item) {
                        popHtml += `<li style="list-style-type: none;">${item.name}: ${item.raw_message}</br>评: <a href="${item.thread.link}">${item.thread.title}</a></li>`;
                    });
                    popHtml = `<ul>${popHtml}</ul`;
                    listContainer.innerHTML = popHtml;
                }, function () {
                    console.log('获取数据失败！')
                }
            );
        }
    };

    // 加载相关话题
    iDisqus.prototype.loadRelated = function () {
        var _ = this;
        if (_.stat.forum.settings.organicDiscoveryEnabled == false || _.stat.relatedLoaded) {
            return;
        }
        getAjax(
            _.opts.api + '/threadsList.php?type=' + _.opts.relatedType.toLowerCase() + '&thread=' + _.stat.thread.id,
            function (resp) {
                var data = JSON.parse(resp);
                if (data.code == 0) {
                    _.stat.relatedLoaded = true;
                    var threads = data.response;
                    var popHtml = '';
                    threads.forEach(function (item) {
                        var message = item.topPost.message.replace(/<[^>]*>/g, '');
                        popHtml += `<li class="related-item">
                        <a class="related-item-link" href="${item.link}" title="${item.title}">
                        <div class="related-item-title">${item.title}</div>
                        <div class="related-item-desc">${item.posts}条评论<span class="related-item-bullet"> • </span><time class="related-item-time" datetime="${item.createdAt}"></time></div></a>
                        <a class="related-item-link" href="${item.link}?#comment-${item.topPost.id}" title="${message}">
                        <div class="related-item-post">
                        <div class="related-item-avatar"><img src="${item.topPost.avatar}" /></div>
                        <div class="related-item-main">
                        <div class="related-item-name">${ item.topPost.name}</div>
                        <div class="related-item-message">${ message}</div>
                        </div>
                        </div></a>
                        </li>`;
                    });
                    popHtml = `<div class="comment-related-title">在<span class="comment-related-forumname">${_.stat.forum.name}</span>上还有</div><div class="comment-related-content"><ul class="related-list">${popHtml}</ul></div>`;
                    _.dom.querySelector('.comment-related').innerHTML = popHtml;
                    _.timeAgo();
                }
            }, function () {
                console.log('获取数据失败！')
            }
        );
    };

    // 加载反应
    iDisqus.prototype.loadReactions = function () {
        var _ = this;
        if (_.stat.forum.settings.threadReactionsEnabled == false) {
            return;
        }
        getAjax(_.opts.api + '/threadReactionsLoadReations.php' + '?thread=' + _.stat.thread.id, function (resp) {
            var data = JSON.parse(resp);
            if (data.response.eligible) {
                _.dom.querySelector('.comment-reaction-prompt').innerHTML = data.response.prompt;
                var reactions = data.response.reactions;
                var total = 0;
                var reaListHtml = '';
                var selectedId = _.user.reactionVote[_.stat.thread.id];
                selectedId = selectedId || (!!data.selected ? data.selected.id : 0);
                reactions.forEach(function (item) {
                    total += item.votes;
                    reaListHtml += `<li class="comment-reaction-item"><a class="comment-reaction-btn${(selectedId == item.id ? ' selected' : '')}" data-id="${item.id}" href="javascript:;"><img class="comment-reaction-image" src="${item.imageUrl}"> ${item.text}</a><div class="comment-reaction-count">${item.votes}</div></li>`;
                })
                _.dom.querySelector('.comment-reaction-list').innerHTML = reaListHtml;
                _.dom.querySelector('.comment-reaction-total').innerHTML = total + ' 人次参与';
            }
        }, function () { })

    };

    // 反应打分事件
    iDisqus.prototype.reactionVote = function (e, target) {
        var _ = this;
        var $reaction = target.closest('.comment-reaction-item');
        var $count = $reaction.querySelector('.comment-reaction-count');
        var reactionId = target.dataset.id;
        var postData = {
            thread: _.stat.thread.id,
            unique: _.user.unique,
            reaction: reactionId
        }
        postAjax(_.opts.api + '/threadReactionsVote.php', postData, function (resp) {
            _.user.reactionVote[_.stat.thread.id] = reactionId;
            l.setItem('reaction_vote', JSON.stringify(_.user.reactionVote));
            target.classList.add('selected');
            $count.innerHTML++
        })
    }

    // 排序
    iDisqus.prototype.selectOrder = function (e, target) {
        var _ = this;
        var order = target.value;
        sessionStorage.setItem('order', order);
        _.stat.order = order;
        _.dom.querySelector('.comment-list').innerHTML = '';
        _.dom.querySelector('.comment-loadmore').classList.add('hide');
        _.stat.next = null;
        _.getlist();
    }

    // 获取评论列表
    iDisqus.prototype.getlist = function () {
        var _ = this;
        _.stat.loading = true;
        _.dom.querySelector('#idisqus').classList.add('loading');
        _.dom.querySelector('.comment-list').dataset.tips = '评论加载中……';
        getAjax(
            _.opts.api + '/getcomments.php?thread=' + _.stat.thread.id + (!!_.stat.next ? '&cursor=' + _.stat.next : '') + '&order=' + _.stat.order,
            function (resp) {
                var data = JSON.parse(resp);
                if (data.code === 0) {
                    _.stat.offsetTop = d.documentElement.scrollTop || d.body.scrollTop;

                    _.dom.querySelector('#idisqus').classList.remove('loading')
                    var loadmore = _.dom.querySelector('.comment-loadmore');
                    var posts = !!data.response ? data.response : [];
                    _.stat.root = [];
                    posts.forEach(function (item) {
                        _.load(item);
                        if (!item.parent) {
                            _.stat.root.unshift(item.id);
                        }
                    });

                    if (data.cursor.hasPrev) {
                        _.stat.root.forEach(function (item) {
                            _.dom.querySelector('.comment-list').appendChild(_.dom.querySelector('#comment-' + item));
                        })
                    }
                    if (data.cursor.hasNext) {
                        _.stat.next = data.cursor.next;
                        loadmore.classList.remove('loading');
                        loadmore.classList.remove('hide');
                    } else {
                        _.stat.next = null;
                        loadmore.classList.add('hide');
                    }

                    if (_.stat.thread.posts == 0) {
                        _.dom.querySelector('.comment-list').dataset.tips = '来做第一个留言的人吧！';
                        return;
                    }

                    if (posts.length == 0) {
                        return;
                    }
                    _.timeAgo();

                    var iframe = _.dom.querySelectorAll('.comment-item-body iframe');
                    [].forEach.call(iframe, function (item) {
                        item.style.width = item.clientWidth + 'px';
                        item.style.height = item.clientWidth * 9 / 16 + 'px';
                        setTimeout(function () {
                            item.src = item.src;
                        }, 1000)
                    })
                    var tweet = _.dom.querySelectorAll('.comment-item-body .twitter-tweet');
                    if (tweet.length > 0) {
                        var head = document.getElementsByTagName('head')[0];
                        var script = document.createElement('script');
                        script.type = 'text/javascript';
                        script.src = '//platform.twitter.com/widgets.js';
                        head.appendChild(script);
                    }

                    window.scrollTo(0, _.stat.offsetTop);

                    if (/^#disqus|^#comment-/.test(location.hash) && !data.cursor.hasPrev && !_.stat.disqusLoaded && !_.stat.loaded) {
                        var el = _.dom.querySelector('#idisqus ' + location.hash)
                        if (!!el) {
                            window.scrollBy(0, el.getBoundingClientRect().top);
                        }
                    }
                    _.stat.loading = false;
                    _.stat.loaded = true;
                }
            }, function () {
                alert('获取数据失败，请检查服务器设置。')
            }
        );
    }

    // 读取评论
    iDisqus.prototype.load = function (post) {

        var _ = this;

        _.stat.post[post.id] = post;

        var parentPostDom = _.dom.querySelector('.comment-item[data-id="' + post.parent + '"]');

        var user = {
            username: post.username,
            name: post.name,
            avatar: post.avatar
        }
        if (!!post.username && _.stat.users.map(function (user) { return user.username; }).indexOf(post.username) == -1) {
            _.stat.users.push(user);
        }

        var parentPost = !!post.parent ? {
            name: `<a class="comment-item-pname" data-parent="${post.parent}" href="#${parentPostDom.id}"><svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200"><path d="M1.664 902.144s97.92-557.888 596.352-557.888V129.728L1024 515.84l-425.984 360.448V628.8c-270.464 0-455.232 23.872-596.352 273.28"></path></svg>${parentPostDom.dataset.name}</a>`,
            dom: parentPostDom.querySelector('.comment-item-children'),
            insert: 'afterbegin'
        } : {
                name: '',
                dom: _.dom.querySelector('.comment-list'),
                insert: post.id == 'preview' || !!post.isPost ? 'afterbegin' : 'beforeend'
            };


        var html = `<li class="comment-item" data-id="${post.id}" data-name="${post.name}" id="comment-${post.id}">
        <div class="comment-item-body">
        <a class="comment-item-avatar" href="#comment-${ post.id}"><img src="${post.avatar}"></a>
        <div class="comment-item-main">
        <div class="comment-item-header"><a class="comment-item-name" title="${ post.name}" rel="nofollow" target="_blank" href="${(post.url || 'javascript:;')}">${post.name}</a>${(post.isMod ? `<span class="comment-item-badge">${_.opts.badge}</span>` : ``)}${parentPost.name}<span class="comment-item-bullet"> • </span><time class="comment-item-time" datetime="${post.createdAt}"></time></div>
        <div class="comment-item-content">${ post.message}</div>
        <div class="comment-item-footer">${!!post.isPost ? `<span class="comment-item-manage"><a class="comment-item-edit" href="javascript:;">编辑</a><span class="comment-item-bullet"> • </span><a class="comment-item-delete" href="javascript:;">删除</a><span class="comment-item-bullet"> • </span></span>` : ``}<a class="comment-item-reply" href="javascript:;">回复</a></div>
        </div></div>
        <ul class="comment-item-children">
            ${ post.hasMore ? `<li><a class="comment-item-loadmore" href="javascript:;">显示更多回复</a></li>` : `` }
        </ul>
        </li>`;

        // 已删除评论
        if (!!post.isDeleted) {
            html = `<li class="comment-item" data-id="${post.id}" id="comment-${post.id}" data-name="${post.name}">
            <div class="comment-item-body">
            <a class="comment-item-avatar" href="#comment-${ post.id}"><img src="${post.avatar}"></a>
            <div class="comment-item-main" data-message="此评论已被删除。"></div></div>
            <ul class="comment-item-children">
                ${ post.hasMore ? `<li><a class="comment-item-loadmore" href="javascript:;">显示更多回复</a></li>` : `` }
            </ul>
            </li>`;
        }


        // 更新 or 创建
        if (!!_.dom.querySelector('.comment-item[data-id="' + post.id + '"]')) {
            _.dom.querySelector('.comment-item[data-id="' + post.id + '"]').outerHTML = html;
        } else {
            parentPost.dom.insertAdjacentHTML(parentPost.insert, html);
        }

        // 发布留言，可编辑删除
        if (!!post.isPost && !_.stat.editing) {
            var $this = _.dom.querySelector('.comment-item[data-id="' + post.id + '"]');

            var postEdit = setTimeout(function () {
                // 十分钟后
                if (!!$this.querySelector('.comment-item-manage')) {
                    $this.querySelector('.comment-item-manage').outerHTML = '';
                }
            }, 6 * 1e5);

            // 删除
            $this.querySelector('.comment-item-delete').addEventListener('click', function (e) {
                var postData = {
                    id: post.id
                }
                var delDom = e.currentTarget;
                delDom.innerHTML = '删除中';
                postAjax(_.opts.api + '/removecomment.php', postData, function (resp) {
                    var data = JSON.parse(resp);
                    if (data.code === 0) {
                        if (data.response.isDeleted == true) {
                            $this.outerHTML = '';
                            _.stat.thread.posts = parseInt(_.dom.querySelector('#comment-count').innerHTML) - 1;
                            _.dom.querySelector('#comment-count').innerHTML = _.stat.thread.posts + ' 条评论';
                        } else {
                            alert(data.response.message);
                            $this.querySelector('.comment-item-manage').outerHTML = '';
                        }
                    } else if (data.code === 2) {
                        alert(data.response);
                        $this.querySelector('.comment-item-manage').outerHTML = '';
                    }
                }, function () {
                    alert('删除出错，请稍后重试');
                })
                clearTimeout(postEdit);
            }, false)

            // 编辑
            $this.querySelector('.comment-item-edit').addEventListener('click', function () {
                _.stat.editing = post;
                _.edit(post);
            }, false)
        }
    }

    // 读取更多
    iDisqus.prototype.loadMore = function (e, target) {
        var _ = this;
        _.stat.offsetTop = d.documentElement.scrollTop || d.body.scrollTop;
        if (!_.stat.loading) {
            target.classList.add('loading');
            _.getlist();
        }
    }

    // 读取更多回复
    iDisqus.prototype.loadMoreReply = function (e, target) {
        var _ = this;
        target.innerHTML = '加载中……';
        var $children = target.closest('.comment-item-children');
        var $post = target.closest('.comment-item');
        getAjax(
            _.opts.api + '/descendants.php?post=' + $post.dataset.id,
            function (resp) {
                var data = JSON.parse(resp);
                if( data.code == 0 ){
                    $children.removeChild(target.parentNode);
                    var posts = data.response;
                    posts.forEach(function (item) {
                        _.load(item);
                    });
                    _.timeAgo();
                } else {
                    target.innerHTML = '读取失败';
                }
            }, function () {
                target.innerHTML = '读取出错';
            }
        );
    }

    // 评论框焦点
    iDisqus.prototype.focus = function (e, target) {
        var wrapper = target.closest('.comment-form-wrapper');
        wrapper.classList.add('editing');
        if (wrapper.classList.contains('focus')) {
            wrapper.classList.remove('focus');
        } else {
            wrapper.classList.add('focus');
        }
    }

    // 输入事件
    iDisqus.prototype.input = function (e, target) {
        var _ = this;
        var form = target.closest('.comment-form');
        var alertmsg = form.querySelector('.comment-form-alert');
        alertmsg.innerHTML = '';
        var wrapper = form.querySelector('.comment-form-wrapper');
        var filterText = target.value.replace(/<code>.*?<\/code>/g, '');
        var urls = filterText.match(/(^|\s|\r|\n)*(http:\/\/|https:\/\/)(\w|-|\.)*(disqus|sinaimg|giphy|imgur|instagram|twimg|twitter|youtube|youtu\.be)((\w|=|\?|\.|\/|&|\%|-)*)(jpg|png|gif|gallery\/\w+|p\/[a-zA-Z0-9]{11}.*|status\/\d{19}|v=[a-zA-Z0-9]{11}|\/[a-zA-Z0-9]{11})(\s|$|\n)/g);
        form.querySelector('.comment-image-list').innerHTML = '';
        if (!!urls) {
            urls.forEach(function (item, i) {
                item = item.replace('/\n|\r\n|^\s|\s$/g', '');
                var image = _.stat.media[item];
                if (!!image) {
                    var imageHtml = `<li class="comment-image-item" data-image-url="${image.thumbnailUrl}"><img class="comment-image-object" src="https:${image.thumbnailUrl}"></li>`;
                    form.querySelector('.comment-image-list').insertAdjacentHTML('beforeend', imageHtml);
                    wrapper.classList.add('expanded');
                    return;
                }
                postAjax(_.opts.api + '/media.php', { url: item }, function (resp) {
                    var data = JSON.parse(resp);
                    if (data.code == 0) {
                        image = data.response;
                        var imageHtml = `<li class="comment-image-item" data-image-url="${image.thumbnailUrl}"><img class="comment-image-object" src="https:${image.thumbnailUrl}"></li>`;
                        form.querySelector('.comment-image-list').insertAdjacentHTML('beforeend', imageHtml);
                        _.stat.media[item] = image;
                        wrapper.classList.add('expanded');
                    }
                }, function () {
                })
            })
        } else {
            wrapper.classList.remove('expanded');
        }

    }

    // 提醒用户 @ mention 
    iDisqus.prototype.mention = function (e, target) {
        var _ = this;
        var textarea = target;
        var selStart = textarea.selectionStart;
        var mentionIndex = textarea.value.slice(0, selStart).lastIndexOf('@');
        var mentionText = textarea.value.slice(mentionIndex, selStart);
        var mentionDom = _.dom.querySelector('.mention-user');
        var showUsers = _.stat.users.filter(function (user) {
            var re = new RegExp(mentionText.slice(1), 'i');
            return user.username.search(re) > -1;
        });
        if (mentionText.search(/^@\w+$|^@$/) == 0 && showUsers.length > 0) {
            if (e.keyCode == 38 || e.keyCode == 40) {
                return;
            }
            var coord = _.getCaretCoord(textarea);
            var list = '', html = '';

            showUsers.forEach(function (item, i) {
                list += `<li class="mention-user-item${(i == 0 ? ' active' : '')}" data-username="${item.username}"><img class="mention-user-avatar" src="${item.avatar}"><div class="mention-user-username">${item.username}</div><div class="mention-user-name">${item.name}</div></li>`;
            })
            if (!!mentionDom) {
                mentionDom.innerHTML = '<ul class="mention-user-list">' + list + '</ul>';
                mentionDom.style.left = coord.left + 'px';
                mentionDom.style.top = coord.top + 'px';
            } else {
                html = `<div class="mention-user" style="left:${coord.left}px;top:${coord.top}px"><ul class="mention-user-list">${list}</ul></div>`;
                _.dom.querySelector('#idisqus').insertAdjacentHTML('beforeend', html);
            }

            // 鼠标悬浮
            _.addListener('mention-user-item', 'mouseover', function () {
                _.dom.querySelector('.mention-user-item.active').classList.remove('active');
                this.classList.add('active');
            })

            // 鼠标点击
            _.addListener('mention-user-item', 'click', function () {
                var username = '@' + this.dataset.username + ' ';
                textarea.value = textarea.value.slice(0, mentionIndex) + username + textarea.value.slice(selStart);
                mentionDom.outerHTML = '';
                textarea.focus();
                textarea.setSelectionRange(mentionIndex + username.length, mentionIndex + username.length)
            })
        } else if (!!mentionDom) {
            mentionDom.outerHTML = '';
        }
    }

    // 获取光标坐标 https://medium.com/@_jh3y/how-to-where-s-the-caret-getting-the-xy-position-of-the-caret-a24ba372990a
    iDisqus.prototype.getCaretCoord = function (textarea) {
        var _ = this;
        var carPos = textarea.selectionEnd,
            div = d.createElement('div'),
            span = d.createElement('span'),
            copyStyle = getComputedStyle(textarea);
        [].forEach.call(copyStyle, function (prop) {
            div.style[prop] = copyStyle[prop];
        });
        div.style.position = 'absolute';
        _.dom.appendChild(div);
        div.textContent = textarea.value.substr(0, carPos);
        span.textContent = textarea.value.substr(carPos) || '.';
        div.appendChild(span);
        var coords = {
            'top': textarea.offsetTop - textarea.scrollTop + span.offsetTop + parseFloat(copyStyle.lineHeight),
            'left': textarea.offsetLeft - textarea.scrollLeft + span.offsetLeft
        };
        _.dom.removeChild(div);
        return coords;
    }

    // 键盘选择用户
    iDisqus.prototype.keySelect = function (e, target) {
        var _ = this;
        var textarea = target;
        var selStart = textarea.selectionStart;
        var mentionIndex = textarea.value.slice(0, selStart).lastIndexOf('@');
        var mentionText = textarea.value.slice(mentionIndex, selStart);
        var mentionDom = _.dom.querySelector('.mention-user');
        if (!mentionDom) {
            return;
        }
        var current = _.dom.querySelector('.mention-user-item.active')
        switch (e.keyCode) {
            case 13:
                //回车
                var username = '@' + current.dataset.username + ' ';
                textarea.value = textarea.value.slice(0, mentionIndex) + username + textarea.value.slice(selStart);
                textarea.setSelectionRange(mentionIndex + username.length, mentionIndex + username.length)
                _.dom.querySelector('.mention-user').outerHTML = '';
                e.preventDefault();
                break;
            case 38:
                //上
                if (!!current.previousSibling) {
                    current.previousSibling.classList.add('active');
                    current.classList.remove('active');
                }
                e.preventDefault();
                break;
            case 40:
                //下
                if (!!current.nextSibling) {
                    current.nextSibling.classList.add('active');
                    current.classList.remove('active');
                }
                e.preventDefault();
                break;
            default:
                break;
        }
    }

    // 跳到评论
    iDisqus.prototype.jump = function (e, target) {
        var _ = this;
        var hash = getLocation(target.href).hash;
        var el = _.dom.querySelector('#idisqus ' + hash);
        history.replaceState(undefined, undefined, hash);
        window.scrollBy(0, el.getBoundingClientRect().top);
        e.preventDefault();
    }

    // 显示父评论
    iDisqus.prototype.parentShow = function (e, target) {
        var _ = this;
        if (!!target.querySelector('.comment-item-parent')) {
            return;
        }
        var comment = _.stat.post[target.dataset.parent];
        if (comment.isDeleted) {
            return;
        }
        var message = comment.message.replace(/<[^>]*>/g, '');
        var parentHtml = `<div class="comment-item-parent"><a class="comment-item-avatar" href="javascript:;"><img src="${comment.avatar}"></a><div class="comment-item-pmain"><div class="comment-item-pheader">${comment.name}</div><div class="comment-item-pcontent" title="${message}">${message}</div></div></div>`;
        target.insertAdjacentHTML('beforeend', parentHtml);
    }

    // 点选表情
    iDisqus.prototype.field = function (e, target) {
        var _ = this;
        var item = target;
        var form = item.closest('.comment-form');
        var textarea = form.querySelector('.comment-form-textarea');
        _.appendText(textarea, item.dataset.code);
    }

    // 显示回复框 or 取消回复框
    iDisqus.prototype.show = function (e, target) {
        var _ = this;

        var $this = target;
        var item = $this.closest('.comment-item');

        // 无论取消还是回复，移除已显示回复框
        var box = _.dom.querySelector('.comment-item .comment-box:not([data-current-id])');
        if (box) {
            var $show = box.closest('.comment-item');
            var cancel = $show.querySelector('.comment-item-cancel')
            cancel.outerHTML = cancel.outerHTML.replace('cancel', 'reply');
            box.outerHTML = '';
        }

        // 回复时，显示评论框
        if ($this.className == 'comment-item-reply') {
            $this.outerHTML = $this.outerHTML.replace('reply', 'cancel');
            var commentBox = _.box.replace(/emoji-input/g, 'emoji-input-' + item.dataset.id).replace(/upload-input/g, 'upload-input-' + item.dataset.id);
            item.querySelector('.comment-item-children').insertAdjacentHTML('beforebegin', commentBox);
            _.user.init();

            item.querySelector('.comment-form-textarea').focus();
        }

    }

    // 验证表单
    iDisqus.prototype.verify = function (e, target) {
        var _ = this;
        var $this = target;
        var box = $this.closest('.comment-box');
        var $avatar = box.querySelector('.comment-avatar-image');
        var $name = box.querySelector('.comment-form-name');
        var $email = box.querySelector('.comment-form-email');
        var alertmsg = box.querySelector('.comment-form-alert');
        if ($email.value == '') {
            return;
        }
        getAjax(
            _.opts.api + '/getgravatar.php?email=' + $email.value + '&name=' + $name.value,
            function (resp) {
                var data = JSON.parse(resp);
                if (!data.isEmail && $this == $email) {
                    _.errorTips('您所填写的邮箱地址有误。', $email);
                }
                if ($name.value != '') {
                    $avatar.src = data.gravatar;
                }
            }, function () {
            }
        );
    }

    // 添加文本
    iDisqus.prototype.appendText = function (textarea, text) {
        var _ = this;
        var selStart = textarea.selectionStart;
        var text = selStart == 0 ? text + ' ' : ' ' + text + ' ';
        textarea.value = textarea.value.slice(0, selStart) + text + textarea.value.slice(selStart);
        textarea.focus();
        textarea.setSelectionRange(selStart + text.length, selStart + text.length);
    }

    // 上传图片
    iDisqus.prototype.upload = function (e, target) {
        var _ = this;
        var file = target;
        var form = file.closest('.comment-form');
        var progress = form.querySelector('.comment-image-progress');
        var loaded = form.querySelector('.comment-image-loaded');
        var wrapper = form.querySelector('.comment-form-wrapper');
        var alertmsg = form.querySelector('.comment-form-alert');
        alertmsg.innerHTML = '';
        if (file.files.length === 0) {
            return;
        }

        // 以文件大小识别是否为同张图片
        var size = file.files[0].size;

        if (size > 5 * 1e6) {
            alertmsg.innerHTML = '请选择 5M 以下图片。';
            setTimeout(function () {
                alertmsg.innerHTML = '';
            }, 3000);
            return;
        }

        if (_.stat.imageSize.indexOf(size) == -1) {
            progress.style.width = '80px';
        } else {
            alertmsg.innerHTML = '请勿选择已存在的图片。';
            setTimeout(function () {
                alertmsg.innerHTML = '';
            }, 3000);
            return;
        }

        // 展开图片上传界面
        wrapper.classList.add('expanded');

        // 图片上传请求
        var data = new FormData();
        data.append('file', file.files[0]);
        var filename = file.files[0].name;

        var $item;

        var xhrUpload = new XMLHttpRequest();
        xhrUpload.withCredentials = true;
        xhrUpload.onreadystatechange = function () {
            if (xhrUpload.readyState == 4 && xhrUpload.status == 200) {
                var data = JSON.parse(xhrUpload.responseText);
                if (data.code == 0) {
                    _.stat.imageSize.push(size);
                    var imageUrl = data.response.thumbnailUrl;
                    var textarea = form.querySelector('.comment-form-textarea');
                    _.appendText(textarea, 'https:'+imageUrl);

                    var image = new Image();
                    image.src = imageUrl;
                    image.onload = function () {
                        $item.innerHTML = '<img class="comment-image-object" src="https:' + imageUrl + '">';
                        $item.dataset.imageUrl = imageUrl;
                        $item.classList.remove('loading');
                    }
                } else {
                    alertmsg.innerHTML = '图片上传出错。';
                    $item.innerHTML = '';
                    if (!!form.getElementsByClassName('comment-image-item').length) {
                        wrapper.classList.remove('expanded');
                    }
                    setTimeout(function () {
                        alertmsg.innerHTML = '';
                    }, 3000);
                }
            }
        };
        xhrUpload.upload.addEventListener('progress', function (e) {
            loaded.style.width = Math.ceil((e.loaded / e.total) * 100) + '%';
        }, false);
        xhrUpload.upload.addEventListener('load', function (e) {
            loaded.style.width = 0;
            progress.style.width = 0;
            var imageItem = `<li class="comment-image-item loading" data-image-size="${size}">
            <svg version="1.1" class="comment-image-object" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="24px" height="30px" viewBox="0 0 24 30" style="enable-background: new 0 0 50 50;" xml:space="preserve">
            <rect x="0" y="10" width="4" height="10" fill="rgba(127,145,158,1)" opacity="0.2">
            <animate attributeName="opacity" attributeType="XML" values="0.2; 1; .2" begin="0s" dur="0.6s" repeatCount="indefinite" />
            <animate attributeName="height" attributeType="XML" values="10; 20; 10" begin="0s" dur="0.6s" repeatCount="indefinite" />
            <animate attributeName="y" attributeType="XML" values="10; 5; 10" begin="0s" dur="0.6s" repeatCount="indefinite" />
            </rect>
            <rect x="8" y="10" width="4" height="10" fill="rgba(127,145,158,1)" opacity="0.2">
            <animate attributeName="opacity" attributeType="XML" values="0.2; 1; .2" begin="0.15s" dur="0.6s" repeatCount="indefinite" />
            <animate attributeName="height" attributeType="XML" values="10; 20; 10" begin="0.15s" dur="0.6s" repeatCount="indefinite" />
            <animate attributeName="y" attributeType="XML" values="10; 5; 10" begin="0.15s" dur="0.6s" repeatCount="indefinite" />
            </rect>
            <rect x="16" y="10" width="4" height="10" fill="rgba(127,145,158,1)" opacity="0.2">
            <animate attributeName="opacity" attributeType="XML" values="0.2; 1; .2" begin="0.3s" dur="0.6s" repeatCount="indefinite" />
            <animate attributeName="height" attributeType="XML" values="10; 20; 10" begin="0.3s" dur="0.6s" repeatCount="indefinite" />
            <animate attributeName="y" attributeType="XML" values="10; 5; 10" begin="0.3s" dur="0.6s" repeatCount="indefinite" />
            </rect>
            </svg>
            </li>`;
            form.querySelector('.comment-image-list').insertAdjacentHTML('beforeend', imageItem);
            $item = form.querySelector('[data-image-size="' + size + '"]');
        }, false);
        xhrUpload.open('POST', _.opts.api + '/media.php', true);
        xhrUpload.send(data);
    }

    // 移除图片
    iDisqus.prototype.remove = function (e) {
        var _ = this;
        var $item = e.currentTarget.closest('.comment-image-item');
        var wrapper = e.currentTarget.closest('.comment-form-wrapper');
        $item.outerHTML = '';
        _.stat.imageSize = [];
        var imageArr = wrapper.getElementsByClassName('comment-image-item');
        [].forEach.call(imageArr, function (item, i) {
            _.stat.imageSize[i] = item.dataset.imageSize;
        });
        if (_.stat.imageSize.length == 0) {
            wrapper.classList.remove('expanded');
        }
        wrapper.querySelector('.comment-image-input').value = '';
    }

    // 错误提示
    iDisqus.prototype.errorTips = function (Text, Dom) {
        var _ = this;
        if (_.user.logged_in == 'true') {
            _.handle.logout();
        }
        var idisqus = _.dom.querySelector('#idisqus');
        var errorDom = _.dom.querySelector('.comment-form-error');
        if (!!errorDom) {
            errorDom.outerHTML = '';
        }
        var Top = Dom.offsetTop;
        var Left = Dom.offsetLeft;
        var errorHtml = '<div class="comment-form-error" style="top:' + Top + 'px;left:' + Left + 'px;">' + Text + '</div>';
        idisqus.insertAdjacentHTML('beforeend', errorHtml);
        setTimeout(function () {
            var errorDom = _.dom.querySelector('.comment-form-error');
            if (!!errorDom) {
                errorDom.outerHTML = '';
            }
        }, 3000);
    }

    // 发表/回复评论
    iDisqus.prototype.post = function (e, target) {
        var _ = this;
        var item = target.closest('.comment-box[data-current-id]') || target.closest('.comment-item') || target.closest('.comment-box');
        var message = item.querySelector('.comment-form-textarea').value;
        var parentId = !!item.dataset.id ? item.dataset.id : '';
        var imgArr = item.getElementsByClassName('comment-image-item');

        // 不是编辑框需预览
        if (!item.dataset.currentId) {
            var elName = item.querySelector('.comment-form-name');
            var elEmail = item.querySelector('.comment-form-email');
            var elUrl = item.querySelector('.comment-form-url');
            var alertmsg = item.querySelector('.comment-form-alert');
            var alertClear = function () {
                setTimeout(function () {
                    alertmsg.innerHTML = '';
                }, 3000);
            }

            if (_.user.type != '1') {
                var anonName = elName.value;
                var anonEmail = elEmail.value;
                var anonUrl = elUrl.value.replace(/\s/g, '');
                if (/^\s*$/i.test(anonName)) {
                    _.errorTips('名字不能为空或空格。', elName);
                    return;
                }
                if (/^\s*$/i.test(anonEmail)) {
                    _.errorTips('邮箱不能为空或空格。', elEmail);
                    return;
                }
                if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(anonEmail)) {
                    _.errorTips('请正确填写邮箱。', elEmail);
                    return;
                }
                if (!/^([hH][tT]{2}[pP]:\/\/|[hH][tT]{2}[pP][sS]:\/\/)(([A-Za-z0-9-~]+)\.)+([A-Za-z0-9-~\/])+$|^\s*$/i.test(anonUrl)) {
                    _.errorTips('请正确填写网址。', elUrl);
                    return;
                }
                _.user.unique = _.user.email == anonEmail ? _.user.unique : generateGUID();
                _.user.name = anonName;
                _.user.email = anonEmail;
                _.user.url = anonUrl;
                _.user.avatar = item.querySelector('.comment-avatar-image').src;
                _.user.submit();

                if (!_.user.name && !_.user.email) {
                    return;
                }
            }

            if (!_.stat.message && !_.stat.mediaHtml) {
                _.box = _.dom.querySelector('.comment-box').outerHTML.replace('comment-form-wrapper', 'comment-form-wrapper editing').replace(/加入讨论……/, '');
            }

            if (/^\s*$/i.test(message)) {
                alertmsg.innerHTML = '评论不能为空或空格。';
                item.querySelector('.comment-form-textarea').focus();
                return;
            };

            var preMessage = message;

            if (!!_.opts.emoji_preview) {
                preMessage = preMessage.replace(/:([-+\w]+):/g, function (match) {
                    var emojiShort = match.replace(/:/g, '');
                    var emojiImage = !!_.eac[emojiShort] ? `<img class="emojione" width="24" height="24" alt="'+emojiShort+'" title=":${emojiShort}:" src="${_.opts.emojiPath + _.eac[emojiShort]}.png">` : match;
                    return emojiImage;
                });
            } else {
                _.emojiList.forEach(function (item) {
                    preMessage = preMessage.replace(`:${item.code}:`, `<img class="emojione" width="24" height="24" src="${_.opts.emojiPath + item.unicode}.png" />`);
                });
            }

            var post = {
                'url': !!_.user.url ? _.user.url : '',
                'isMod': false,
                'username': null,
                'name': _.user.name,
                'avatar': _.user.avatar,
                'id': 'preview',
                'parent': parentId,
                'createdAt': (new Date()).toJSON(),
                'message': '<p>' + preMessage + '</p>',
            };

            _.load(post);

            _.timeAgo();

            // 清空或移除评论框
            _.stat.message = message;
            _.stat.mediaHtml = item.querySelector('.comment-image-list').innerHTML;

            if (parentId) {
                item.querySelector('.comment-item-cancel').click();
            } else {
                item.querySelector('.comment-form-textarea').value = '';
                item.querySelector('.comment-image-list').innerHTML = '';
                item.querySelector('.comment-form-wrapper').classList.remove('expanded', 'editing');
            }
        }

        // @
        var mentions = message.match(/@\w+/g);
        if (!!mentions) {
            mentions = mentions.filter(function (mention) {
                return _.stat.users.map(function (user) { return user.username; }).indexOf(mention.slice(1)) > -1;
            });
            if (mentions.length > 0) {
                var re = new RegExp('(' + mentions.join('|') + ')', 'g');
                message = message.replace(re, '$1:disqus');
            }
        }

        // POST 操作
        // 编辑框则更新评论
        if (!!item.dataset.currentId) {
            var postData = {
                id: item.dataset.currentId,
                message: message,
                unique: _.user.unique
            }
            postAjax(_.opts.api + '/updatecomment.php', postData, function (resp) {
                var data = JSON.parse(resp);
                if (data.code === 0) {
                    _.stat.message = null;
                    _.stat.mediaHtml = null;
                    var post = data.response;
                    _.load(post);
                    _.timeAgo();
                    _.stat.editing = false;
                } else {
                    // 取消编辑
                    _.load(_.stat.editing)
                    _.timeAgo();
                    _.stat.editing = false;
                }
            }, function () {
                // 取消编辑
                _.load(_.stat.editing)
                _.timeAgo();
                _.stat.editing = false;
            })
        } else {
            var postData = {
                thread: _.stat.thread.id,
                parent: parentId,
                message: message,
                name: _.user.name,
                email: _.user.email,
                url: _.user.url,
                unique: _.user.unique
            }
            postAjax(_.opts.api + '/postcomment.php', postData, function (resp) {
                var data = JSON.parse(resp);
                if (data.code === 0) {
                    _.dom.querySelector('.comment-item[data-id="preview"]').outerHTML = '';
                    _.stat.thread = data.thread;
                    _.stat.thread.posts = parseInt(_.dom.querySelector('#comment-count').innerHTML) + 1;
                    _.dom.querySelector('#comment-count').innerHTML = _.stat.thread.posts + ' 条评论';
                    var post = data.response;
                    post.isPost = true;
                    _.load(post);
                    _.timeAgo();
                    var postData = {
                        post: JSON.stringify(post),
                        thread: JSON.stringify(_.stat.thread),
                        parent: JSON.stringify(_.stat.post[parentId]),
                        code: data.verifyCode
                    }
                    if (!!data.verifyCode) {
                        // 异步发送邮件
                        postAjax(_.opts.api + '/sendemail.php', postData, function (resp) {
                            console.info('邮件发送成功！');
                        })
                    }
                } else if (data.code === 2) {
                    alertmsg.innerHTML = data.response;
                    _.dom.querySelector('.comment-item[data-id="preview"]').outerHTML = '';
                    _.reEdit(item);

                    if (data.response.indexOf('author') > -1) {
                        _.handle.logout();
                    }
                } else {
                    alertmsg.innerHTML = '提交失败，请稍后重试，错误代码：' + data.code;
                    alertClear();

                    _.dom.querySelector('.comment-item[data-id="preview"]').outerHTML = '';
                    _.reEdit(item);
                }

            }, function () {
                alertmsg.innerHTML = '提交出错，请稍后重试。';
                alertClear();

                _.dom.querySelector('.comment-item[data-id="preview"]').outerHTML = '';
                _.reEdit(item);
            })
        }
    }

    // 重新编辑
    iDisqus.prototype.reEdit = function (item) {
        var _ = this;

        if (!!item.dataset.id) {
            item.querySelector('.comment-item-reply').click();
        } else {
            item.querySelector('.comment-form-wrapper').classList.add('editing');
        }

        // 重新填充文本图片
        if (!!_.stat.message) {
            item.querySelector('.comment-form-textarea').value = _.stat.message;
        }
        if (!!_.stat.mediaHtml) {
            item.querySelector('.comment-form-wrapper').classList.add('expanded');
            item.querySelector('.comment-image-list').innerHTML = _.stat.mediaHtml;
        }
    }

    // 编辑
    iDisqus.prototype.edit = function (post) {
        var _ = this;
        var commentBox = _.box.replace('comment-box', 'comment-box comment-box-' + post.id).replace(/emoji-input/g, 'emoji-input-' + post.id).replace(/upload-input/g, 'upload-input-' + post.id);
        var $this = _.dom.querySelector('.comment-item[data-id="' + post.id + '"] .comment-item-body');
        $this.outerHTML = commentBox;
        _.user.init();
        var item = _.dom.querySelector('.comment-box-' + post.id);
        item.dataset.currentId = post.id;
        item.querySelector('.comment-form-textarea').focus();

        // 取消编辑
        item.querySelector('.comment-actions-form').insertAdjacentHTML('afterbegin', '<a class="comment-form-cancel" href="javascript:;">取消</a>')
        item.querySelector('.comment-form-cancel').addEventListener('click', function () {
            _.stat.editing = false;
            _.load(post);
            _.timeAgo();
        }, false);

        // 重新填充文本图片，连续回复、连续编辑会有 bug
        if (!!_.stat.message) {
            item.querySelector('.comment-form-textarea').value = _.stat.message;
        }
        if (!!_.stat.mediaHtml) {
            item.querySelector('.comment-form-wrapper').classList.add('expanded');
            item.querySelector('.comment-image-list').innerHTML = _.stat.mediaHtml;
        }

    }

    // Thread 初始化
    iDisqus.prototype.threadInit = function (e, target) {
        var _ = this;
        _.dom.querySelector('#idisqus').style.display = 'block';
        _.dom.querySelector('#disqus_thread').style.display = 'none';
        getAjax(_.opts.api + '/threadsDetails.php?ident=' + _.opts.identifier + '&link=' + _.opts.url, function (resp) {
            var data = JSON.parse(resp);
            if (data.code == 0) {
                _.stat.thread = data.response;
                _.stat.forum = data.forum;
                _.dom.querySelector('#comment-link').href = `https://disqus.com/home/discussion/${_.stat.forum.id}/${_.stat.thread.slug}/?l=zh`;
                _.dom.querySelector('.comment-avatar-image').dataset.avatar = _.stat.forum.avatar;
                _.dom.querySelector('.comment-recommend-count').innerHTML = _.stat.thread.likes || '';
                if (_.stat.forum.settings.mediaembedEnabled == false) {
                    _.dom.querySelector('comment-image-input').outerHTML = ''
                    _.dom.querySelector('[for="upload-input"]').outerHTML = ''
                }
                if (_.user.logged_in == 'false') {
                    _.dom.querySelector('.comment-avatar-image').src = _.stat.forum.avatar;
                }
                _.box = _.dom.querySelector('.comment-box').outerHTML.replace(/<label class="comment-actions-label exit"(.|\n)*<\/label>\n/, '').replace('comment-form-wrapper', 'comment-form-wrapper editing').replace(/加入讨论……/, '');
                _.opts.badge = _.stat.forum.moderatorBadgeText;
                if (!_.stat.order) {
                    switch (_.stat.forum.order) {
                        case 1:
                            _.stat.order = 'asc';
                            break;
                        case 2:
                            _.stat.order = 'desc';
                            break;
                        case 4:
                            _.stat.order = 'popular';
                            break;
                    }
                }
                _.dom.querySelector('.comment-order-radio[value="' + _.stat.order + '"]').checked = true;

                var users = data.votedusers;
                var vote = 0;
                if (_.user.type == 1) {
                    // 已登录
                    vote = users.filter(function (user) {
                        return user.username == _.user.username;
                    }).length > 0 ? 1 : 0;
                } else {
                    // 未登录
                    vote = !!_.user.vote[_.stat.thread.id] ? 1 : 0;;
                }
                _.user.vote[_.stat.thread.id] = vote;
                l.setItem('vote', JSON.stringify(_.user.vote));
                if (!!vote) {
                    _.dom.querySelector('.comment-recommend').classList.add('voted');
                    _.dom.querySelector('.comment-recommend-text').innerHTML = '已推荐';
                }
                _.dom.querySelector('#idisqus').classList.remove('init')
                _.loadRelated();
                _.loadReactions();
                _.dom.querySelector('#comment-count').innerHTML = _.stat.thread.posts + ' 条评论';
                _.getlist();
            } else if (data.code === 2) {
                // 自动创建
                if (_.opts.autoCreate) {
                    _.dom.querySelector('.init-container').dataset.tips = '正在创建 Thread……';
                    var postData = {
                        url: _.opts.link,
                        identifier: _.opts.identifier,
                        title: _.opts.title,
                        slug: _.opts.slug,
                        message: _.opts.desc
                    }
                    _.threadCreate(postData);
                    return;
                }
                _.dom.querySelector('#idisqus').classList.remove('init');
                var threadForm = `<div class="comment-header"><span class="comment-header-item">创建 Thread</span></div>
                            <div class="comment-thread-form">
                            <p>由于 Disqus 没有本页面的相关 Thread，故需先创建 Thread</p>
                            <div class="comment-form-item"><label class="comment-form-label">url:</label><input class="comment-form-input" id="thread-url" name="url" value="${ _.opts.link}" disabled /></div>
                            <div class="comment-form-item"><label class="comment-form-label">identifier:</label><input class="comment-form-input" id="thread-identifier" name="identifier" value="${ _.opts.identifier}" disabled /></div>
                            <div class="comment-form-item"><label class="comment-form-label">title:</label><input class="comment-form-input" id="thread-title" name="title" value="${ _.opts.title}" disabled /></div>
                            <div class="comment-form-item"><label class="comment-form-label">slug:</label><input class="comment-form-input" id="thread-slug" name="slug" value="${ _.opts.slug}" /></div>
                            <div class="comment-form-item"><label class="comment-form-label">message:</label><textarea class="comment-form-textarea" id="thread-message" name="message">${ _.opts.desc}</textarea></div>
                            <button id="thread-submit" class="comment-form-submit">提交</button></div>`;
                _.dom.querySelector('#idisqus').innerHTML = threadForm;
            }
        }, function () { })
    }

    // Thread 打分事件
    iDisqus.prototype.threadVote = function (e, target) {
        var _ = this;
        var vote = !!_.user.vote[_.stat.thread.id] ? 0 : 1;
        var postData = {
            thread: _.stat.thread.id,
            unique: _.user.unique,
            vote: vote
        }
        postAjax(_.opts.api + '/threadsVote.php', postData, function (resp) {
            _.user.vote[_.stat.thread.id] = vote;
            l.setItem('vote', JSON.stringify(_.user.vote));
            if (!!vote) {
                _.dom.querySelector('.comment-recommend').classList.add('voted');
                _.stat.thread.likes++;
            } else {
                _.dom.querySelector('.comment-recommend').classList.remove('voted');
                _.stat.thread.likes = _.stat.thread.likes == 0 ? 0 : _.stat.thread.likes - 1;
            }
            _.dom.querySelector('.comment-recommend-count').innerHTML = _.stat.thread.likes || '';
        })
    }

    // Thread Create 事件
    iDisqus.prototype.threadCreate = function (e, target) {
        var _ = this;
        if (!!target) {
            var postData = {
                url: _.dom.querySelector('#thread-url').value,
                identifier: _.dom.querySelector('#thread-identifier').value,
                title: _.dom.querySelector('#thread-title').value,
                slug: _.dom.querySelector('#thread-slug').value.replace(/[^A-Za-z0-9_-]+/g, ''),
                message: _.dom.querySelector('#thread-message').value
            }
        } else {
            var postData = arguments[0];
        }
        postAjax(_.opts.api + '/createthread.php', postData, function (resp) {
            var data = JSON.parse(resp);
            if (data.code === 0) {
                alert('创建 Thread 成功，刷新后便可愉快地评论了！');
                setTimeout(function () { location.reload(); }, 2000);
            } else if (data.code === 2) {
                if (data.response.indexOf('A thread already exists with link') > -1) {
                    alert(data.response.replace('A thread already exists with link,', '已存在此链接的相关 Thread，'));
                    return;
                }
                if (data.response.indexOf('Invalid URL') > -1) {
                    alert('参数错误，无效的\'URL\'');
                    return;
                }
                if (data.response.indexOf('Invalid slug') > -1) {
                    alert('参数错误，无效的\'slug\'');
                    return;
                }
                alert(data.response);
                return;
            } else {
                alert(data.response);
                return;
            }
        }, function () {
            alert('创建 Thread 出错，请稍后重试！');
        })
    }

    // 销毁评论框
    iDisqus.prototype.destroy = function () {
        var _ = this;
        _.dom.innerHTML = '';
        delete _.dom;
        delete _.box;
        delete _.emojiList;
        delete _.user;
        delete _.handle;
        delete _.stat;
        delete _.opts;
    }

    /* CommonJS */
    if (typeof require === 'function' && typeof module === 'object' && module && typeof exports === 'object' && exports)
        module.exports = iDisqus;
    /* AMD */
    else if (typeof define === 'function' && define['amd'])
        define(function () {
            return iDisqus;
        });
    /* Global */
    else
        global['iDisqus'] = global['iDisqus'] || iDisqus;

})(window || this);
