/*!
 * v 0.1.23
 * https://github.com/fooleap/disqus-php-api
 *
 * Copyright 2017 fooleap
 * Released under the MIT license
 */
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
        xhr.open ('GET', encodeURI(url));
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && xhr.status == 200) {
                success(xhr.responseText);
            }
        }
        xhr.onerror = error;
        xhr.send();
        return xhr;
    }
    
    function postAjax(url, data, success, error) {
        var params = typeof data == 'string' ? data : Object.keys(data).map(
            function(k){ return encodeURIComponent(k) + '=' + encodeURIComponent(data[k]) }
        ).join('&');

        var xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && xhr.status == 200) {
                success(xhr.responseText); 
            }
        };
        xhr.onerror = error; 
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.send(params);
        return xhr;
    }
    
    function addListener(els, evt, func){
        [].forEach.call(els, function(item){
            item.addEventListener(evt, func, false);
        });
    }

    function removeListener(els, evt, func){
        [].forEach.call(els, function(item){
            item.removeEventListener(evt, func, false);
        });
    }


    // matches & closest polyfill https://github.com/jonathantneal/closest
    (function (ElementProto) {
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
    })(window.Element.prototype);

    // 访客信息
    var Guest = function () {
        this.dom = arguments[0];
        this.init();
    }

    Guest.prototype = {
        // 初始化访客信息
        init: function(){
            var _ = this;
            // 读取访客信息
            _.name = l.getItem('name');
            _.email = l.getItem('email');
            _.url = l.getItem('url');
            _.avatar = l.getItem('avatar');
            _.logged_in = l.getItem('logged_in');

            var boxarr = _.dom.getElementsByClassName('comment-box');
            if( _.logged_in == 'true' ) {
                [].forEach.call(boxarr,function(item){
                    item.querySelector('.comment-form-wrapper').classList.add('logged-in');
                    item.querySelector('.comment-form-name').value = _.name;
                    item.querySelector('.comment-form-email').value = _.email;
                    item.querySelector('.comment-form-url').value = _.url;
                    item.querySelector('.comment-avatar-image').src = _.avatar;
                });
            } else {
                [].forEach.call(boxarr,function(item){
                    item.querySelector('.comment-form-wrapper').classList.remove('logged-in');
                    item.querySelector('.comment-form-name').value = _.name;
                    item.querySelector('.comment-form-email').value = _.email;
                    item.querySelector('.comment-form-url').value = _.url;
                    item.querySelector('.comment-avatar-image').src = !!_.avatar ? _.avatar : item.querySelector('.comment-avatar-image').src;
                });
                l.setItem('logged_in', 'false');
            }
        },

        // 重置访客信息
        reset: function(){
            l.setItem('logged_in', 'false');
            this.init();
        },

        // 提交访客信息
        submit: function(g){
            if( this.logged_in == 'false' ){
                l.setItem('name', g.name);
                l.setItem('email', g.email);
                l.setItem('url', g.url);
                l.setItem('avatar', g.avatar);
                l.setItem('logged_in', 'true');
                this.init();
            }
        }
    }

    var iDisqus = function () {
        var _ = this;

        // 配置
        _.opts = typeof(arguments[1]) == 'object' ? arguments[1] : arguments[0];
        _.dom =  d.getElementById(typeof(arguments[0]) == 'string' ? arguments[0] : 'comment');
        _.opts.api = _.opts.api.slice(-1) == '/' ? _.opts.api.slice(0,-1) : _.opts.api;
        _.opts.site = !!_.opts.site ? _.opts.site : location.origin;
        if(!!_.opts.url){
            var optsUrl = _.opts.url.replace(_.opts.site, '');
            _.opts.url = optsUrl.slice(0, 1) != '/' ? '/' + optsUrl : optsUrl;
        } else if(isEdge || isIE) {
            _.opts.url = encodeURI(location.pathname) + encodeURI(location.search);
        } else {
            _.opts.url = location.pathname + location.search;
        }
        _.opts.identifier = !!_.opts.identifier ? _.opts.identifier : _.opts.url;
        _.opts.link = _.opts.site + _.opts.url; 
        _.opts.title = !!_.opts.title ? _.opts.title : d.title;
        _.opts.slug = !!_.opts.slug ? _.opts.slug.replace(/[^A-Za-z0-9_-]+/g,'') : '';
        _.opts.desc =  !!_.opts.desc ? _.opts.desc : (!!d.querySelector('[name="description"]') ? d.querySelector('[name="description"]').content : '');
        _.opts.mode = !!_.opts.mode ? _.opts.mode : 1;
        _.opts.timeout = !!_.opts.timeout ? _.opts.timeout : 3000;
        _.opts.toggle = !!_.opts.toggle ? d.getElementById(_.opts.toggle) : null;
        _.opts.badge = !!_.opts.badge ? _.opts.badge : '管理员';

        // emoji 表情
        _.opts.emoji_path = !!_.opts.emoji_path ? _.opts.emoji_path : 'https://assets-cdn.github.com/images/icons/emoji/unicode/';
        _.emoji_list =!!_.opts.emoji_list ? _.opts.emoji_list : [{
            code:'smile',
            title:'笑脸',
            unicode:'1f604'
        },{
            code:'mask',
            title:'生病',
            unicode:'1f637'
        },{
            code:'joy',
            title:'破涕为笑',
            unicode:'1f602'
        },{
            code:'stuck_out_tongue_closed_eyes',
            title:'吐舌',
            unicode:'1f61d'
        },{
            code:'flushed',
            title:'脸红',
            unicode:'1f633'
        },{
            code:'scream',
            title:'恐惧',
            unicode:'1f631'
        },{
            code:'pensive',
            title:'失望',
            unicode:'1f614'
        },{
            code:'unamused',
            title:'无语',
            unicode:'1f612'
        },{
            code:'grin',
            title:'露齿笑',
            unicode:'1f601'
        },{
            code:'heart_eyes',
            title:'色',
            unicode:'1f60d'
        },{
            code:'sweat',
            title:'汗',
            unicode:'1f613'
        },{
            code:'smirk',
            title:'得意',
            unicode:'1f60f'
        },{
            code:'relieved',
            title:'满意',
            unicode:'1f60c'
        },{
            code:'rolling_eyes',
            title:'翻白眼',
            unicode:'1f644'
        },{
            code:'ok_hand',
            title:'OK',
            unicode:'1f44c'
        },{
            code:'v',
            title:'胜利',
            unicode:'270c'
        }];
        
        if(!!_.opts.emoji_preview){
            getAjax(filepath +'/eac.min.json', function(resp){
                _.eac = JSON.parse(resp);
            }, function(){
            })
        }

        // 默认状态
        _.stat = {
            current: 'idisqus', // 当前显示评论框
            loaded: false,      // 评论框已加载
            loading: false,     // 评论加载中
            editing: false,     // 评论编辑中
            offsetTop: 0,       // 高度位置
            thread: null,       // 本页 thread id
            next: null,         // 下条评论
            message: null,      // 新评论
            mediaHtml: null,    // 新上传图片
            root: [],           // 根评论
            count: 0,           // 评论数
            users: [],          // Disqus 会员
            imageSize: [],      // 已上传图片大小
            disqusLoaded: false // Disqus 已加载
        };

        // Disqus 评论框设置
        window.disqus_config = function () {
            this.page.identifier = _.opts.identifier;
            this.page.title = _.opts.title;
            this.page.url = _.opts.link;
            this.callbacks.onReady.push(function() {
                _.stat.current = 'disqus';
                _.stat.disqusLoaded = true;
                _.dom.querySelector('#idisqus').style.display = 'none';
                _.dom.querySelector('#disqus_thread').style.display = 'block';
                if( _.opts.mode == 3 && !!_.opts.toggle) {
                    _.opts.toggle.disabled = '';
                    _.opts.toggle.checked = true;
                    _.opts.toggle.addEventListener('change', _.handle.toggle, false);
                }
            });
        }

        // 自动初始化
        if( !!_.opts.init ){
            _.init();
            //console.log(_);
        }
    }

    // TimeAgo https://coderwall.com/p/uub3pw/javascript-timeago-func-e-g-8-hours-ago
    iDisqus.prototype.timeAgo = function() {

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
            var years = days / 365;

            return templates.prefix + ( seconds < 45 && template('seconds', seconds) || seconds < 90 && template('minute', 1) || minutes < 45 && template('minutes', minutes) || minutes < 90 && template('hour', 1) || hours < 24 && template('hours', hours) || hours < 42 && template('day', 1) || days < 30 && template('days', days) || days < 45 && template('month', 1) || days < 365 && template('months', days / 30) || years < 1.5 && template('year', 1) || template('years', years)) + templates.suffix;
        };

        var elements = _.dom.querySelectorAll('.comment-item-time');
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
    iDisqus.prototype.init = function(){
        var _ = this;
        if(!_.dom){
            //console.log('该页面没有评论框！');
            return
        }
        // 表情
        var emojiList = '';
        _.emoji_list.forEach(function(item){
            emojiList += '<li class="emojione-item" title="'+ item.title+'" data-code=":'+item.code+':"><img class="emojione-item-image" src="'+_.opts.emoji_path + item.unicode+'.png" /></li>';
        })
        _.dom.innerHTML = '<div class="comment loading" id="idisqus">\n'+
            '    <div class="loading-container" data-tip="正在加载评论……"><svg class="loading-bg" width="72" height="72" viewBox="0 0 720 720" version="1.1" xmlns="http://www.w3.org/2000/svg"><path class="ring" fill="none" stroke="#9d9ea1" d="M 0 -260 A 260 260 0 1 1 -80 -260" transform="translate(400,400)" stroke-width="50" /><polygon transform="translate(305,20)" points="50,0 0,100 18,145 50,82 92,145 100,100" style="fill:#9d9ea1"/></svg></div>\n'+
            '    <div class="comment-header"><span class="comment-header-item" id="comment-count">评论</span><a target="_blank" class="comment-header-item" id="comment-link">Disqus 讨论区</a></div>\n'+
            '    <div class="comment-box">\n'+
            '        <div class="comment-avatar avatar"><img class="comment-avatar-image" src="https://a.disquscdn.com/images/noavatar92.png"></div>\n'+
            '        <div class="comment-form">\n'+
            '            <div class="comment-form-wrapper">\n'+
            '                <textarea class="comment-form-textarea" placeholder="加入讨论……"></textarea>\n'+
            '                <div class="comment-form-alert"></div>\n'+
            '                <div class="comment-image">\n'+
            '                    <ul class="comment-image-list"></ul>\n'+
            '                    <div class="comment-image-progress">\n'+
            '                        <div class="comment-image-loaded"></div>\n'+
            '                    </div>\n'+
            '                </div>\n'+
            '                <div class="comment-actions">\n'+
            '                    <div class="comment-actions-group">\n'+
            '                        <input id="emoji-input" class="comment-actions-input" type="checkbox"> \n'+
            '                        <label class="comment-actions-label emojione" for="emoji-input" title="选择表情">\n'+
            '                            <svg class="icon" fill="#c2c6cc" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200">\n'+
            '                                <path d="M512 1024c-282.713043 0-512-229.286957-512-512s229.286957-512 512-512c282.713043 0 512 229.286957 512 512S792.486957 1024 512 1024zM512 44.521739c-258.226087 0-467.478261 209.252174-467.478261 467.478261 0 258.226087 209.252174 467.478261 467.478261 467.478261s467.478261-209.252174 467.478261-467.478261C979.478261 253.773913 768 44.521739 512 44.521739z"></path>\n'+
            '                                <path d="M801.391304 554.295652c0 160.278261-129.113043 289.391304-289.391304 289.391304s-289.391304-129.113043-289.391304-289.391304L801.391304 554.295652z"></path>\n'+
            '                                <path d="M674.504348 349.495652m-57.878261 0a2.6 2.6 0 1 0 115.756522 0 2.6 2.6 0 1 0-115.756522 0Z"></path>\n'+
            '                                <path d="M347.269565 349.495652m-57.878261 0a2.6 2.6 0 1 0 115.756522 0 2.6 2.6 0 1 0-115.756522 0Z"></path>\n'+
            '                            </svg>\n'+
            '                            <ul class="emojione-list">'+emojiList+'</ul>\n'+
            '                        </label>\n'+
            '                        <input id="upload-input" class="comment-actions-input comment-image-input" type="file" accept="image/*" name="file"> \n'+
            '                        <label class="comment-actions-label" for="upload-input" title="上传图片">\n'+
            '                            <svg class="icon" fill="#c2c6cc" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200">\n'+
            '                                <path d="M15.515152 15.515152 15.515152 15.515152 15.515152 15.515152Z"></path>\n'+
            '                                <path d="M15.515152 139.636364l0 806.787879 992.969697 0 0-806.787879-992.969697 0zM946.424242 884.363636l-868.848485 0 0-682.666667 868.848485 0 0 682.666667zM698.181818 356.848485c0-51.417212 41.673697-93.090909 93.090909-93.090909s93.090909 41.673697 93.090909 93.090909c0 51.417212-41.673697 93.090909-93.090909 93.090909s-93.090909-41.673697-93.090909-93.090909zM884.363636 822.30303l-744.727273 0 186.181818-496.484848 248.242424 310.30303 124.121212-93.090909z"></path>\n'+
            '                            </svg>\n'+
            '                        </label>\n'+
            '                    </div>\n'+
            '                    <div class="comment-actions-form">\n'+
            '                        <label class="comment-actions-label exit" title="重置访客信息">\n'+
            '                            <svg class="icon" fill="#c2c6cc" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="48" height="48">\n'+
            '                                <path d="M348.870666 210.685443l378.570081 0c32.8205 0 58.683541 26.561959 58.683541 58.683541 0 162.043606 0 324.804551 0 486.848157 0 32.81129-26.561959 58.674331-58.683541 58.674331L348.870666 814.891472c-10.477632 0-18.850323-8.363482-18.850323-18.841114l0-37.728276c0-10.477632 8.372691-18.841114 18.850323-18.841114l343.645664 0c10.477632 0 18.850323-8.372691 18.850323-18.850323L711.366653 304.983109c0-10.477632-8.372691-18.841114-18.850323-18.841114L348.870666 286.141996c-10.477632 0-18.850323-8.363482-18.850323-18.841114l0-37.728276C329.98248 219.095997 338.393034 210.685443 348.870666 210.685443z"></path>\n'+
            '                                <path d="M128.152728 526.436804l112.450095 112.450095c6.985088 6.985088 19.567661 6.985088 26.552749 0l26.561959-26.561959c6.985088-6.985088 6.985088-19.567661 0-26.552749l-34.925441-34.925441L494.168889 550.84675c10.477632 0 18.850323-8.372691 18.850323-18.850323l0-37.719066c0-10.477632-8.372691-18.850323-18.850323-18.850323L258.754229 475.427036l34.925441-34.925441c6.985088-6.985088 6.985088-19.567661 0-26.552749l-26.561959-26.524097c-6.985088-6.985088-19.567661-6.985088-26.552749 0L128.152728 499.875868C120.431883 506.859933 120.431883 519.451716 128.152728 526.436804z"></path>\n'+
            '                            </svg>\n'+
            '                        </label>\n'+
            '                        <button class="comment-form-submit">\n'+
            '                            <svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200">\n'+
            '                                <path d="M565.747623 792.837176l260.819261 112.921839 126.910435-845.424882L66.087673 581.973678l232.843092 109.933785 562.612725-511.653099-451.697589 563.616588-5.996574 239.832274L565.747623 792.837176z" fill="#ffffff"></path>\n'+
            '                            </svg>\n'+
            '                        </button>\n'+
            '                    </div>\n'+
            '                </div>\n'+
            '            </div>\n'+
            '            <div class="comment-login"><input class="comment-form-input comment-form-name" type="text" placeholder="名字（必填）" autocomplete="name"><input class="comment-form-input comment-form-email" type="email" placeholder="邮箱（必填）" autocomplete="email"><input class="comment-form-input comment-form-url" type="url" placeholder="网址（可选）" autocomplete="url"></div>\n'+
            '        </div>\n'+
            '    </div>\n'+
            '    <ul id="comments" class="comment-list"></ul>\n'+
            '    <a href="javascript:;" class="comment-loadmore">加载更多</a>\n'+
            '</div>\n'+
            '<div class="comment" id="disqus_thread"></div>';

        _.guest = new Guest(_.dom);
        _.box = _.dom.querySelector('.comment-box').outerHTML.replace(/<label class="comment-actions-label exit"(.|\n)*<\/label>\n/,'').replace('comment-form-wrapper','comment-form-wrapper editing').replace(/加入讨论……/,'');
        _.handle = {
            guestReset: _.guest.reset.bind(_.guest),
            loadMore: _.loadMore.bind(_),
            post: _.post.bind(_),
            postThread: _.postThread.bind(_),
            remove: _.remove.bind(_),
            show: _.show.bind(_),
            toggle: _.toggle.bind(_),
            upload: _.upload.bind(_),
            verify: _.verify.bind(_),
            jump: _.jump.bind(_),
            mention: _.mention.bind(_),
            keySelect: _.keySelect.bind(_),
            field: _.field,
            focus: _.focus,
            input: _.input
        };

        switch(_.opts.mode){
            case 1:
                _.disqus();
                break;
            case 2: 
                _.getlist();
                break;
            case 3: 
                _.getlist();
                _.disqus();
                break;
            default:
                _.disqus();
                break;
        }
    }

    // 切换评论框
    iDisqus.prototype.toggle = function(){
        var _ = this;
        if( _.stat.current == 'disqus' ){
            _.stat.current = 'idisqus';
            _.dom.querySelector('#idisqus').style.display = 'block';
            _.dom.querySelector('#disqus_thread').style.display = 'none';
        } else {
            _.disqus();
        }
    }

    // 加载 Disqus 评论
    iDisqus.prototype.disqus = function(){
        var _ = this;
        var _tip = _.dom.querySelector('.loading-container').dataset.tip;
        if(_.opts.site != location.origin){
            //console.log('本地环境不加载 Disqus 评论框！');
            if( _.opts.mode == 1 ){
                _.getlist();
            }
            return;
        }
        if(!_.stat.disqusLoaded ){
            _tip = '尝试连接 Disqus……';

            var s = d.createElement('script');
            s.src = '//'+_.opts.forum+'.disqus.com/embed.js';
            s.dataset.timestamp = Date.now();
            s.onload = function(){
                _.stat.disqusLoaded = true;
                _tip = '连接成功，加载 Disqus 评论框……'
            } 
            s.onerror = function(){
                if( _.opts.mode == 1){
                    _tip = '连接失败，加载简易评论框……';
                    _.getlist();
                }
            }

            var xhr = new XMLHttpRequest();
            xhr.open('GET', '//disqus.com/next/config.json?' + Date.now(), true);
            xhr.timeout = _.opts.timeout;
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    (d.head || d.body).appendChild(s);
                }
            }
            xhr.ontimeout = function () {
                xhr.abort();
                if( _.opts.mode == 1){
                    _tip = '连接超时，加载简易评论框……';
                    _.getlist();
                }
            }
            xhr.onerror = function() {
                if( _.opts.mode == 1){
                    _tip = '连接失败，加载简易评论框……';
                    _.getlist();
                }
            }
            xhr.send();
        } else {
            _.stat.current = 'disqus';
            _.dom.querySelector('#idisqus').style.display = 'none';
            _.dom.querySelector('#disqus_thread').style.display = 'block';
        }
    }

    // 评论计数
    iDisqus.prototype.count = function (){
        var _ = this;
        var counts = d.querySelectorAll('[data-disqus-url]');
        var qty = counts.length;
        if(qty > 0){
            var commentArr = [];
            for( var i = 0; i < qty; i++){
                commentArr[i] = counts[i].dataset.disqusUrl.replace(_.opts.site, '');
            }
            getAjax(
                _.opts.api + '/count.php?links=' + commentArr.join(','), 
                function(resp) {
                    var data  = JSON.parse(resp);
                    var posts = data.response;
                    posts.forEach(function(item){
                        var link = item.link.replace(_.opts.site, '');
                        var itemLink = link.slice(0, 1) != '/' ? '/' + link : link;
                        var el = d.querySelector('[data-disqus-url$="'+itemLink+'"]')
                        if(!!el ){
                            el.innerHTML = item.posts;
                            el.dataset.disqusCount = item.posts;
                        }
                    });
                }, function(){
                    console.log('获取数据失败！')
                }
            );
        }
    };

    // 热门评论
    iDisqus.prototype.popular = function(){
        var _ = this;
        if(!!_.opts.popular){
            getAjax(
                _.opts.api + '/popular.php', 
                function(resp) {
                    var data = JSON.parse(resp);
                    if(data.code == 0){
                        var posts = data.response;
                        var postsHtml = '';
                        posts.forEach(function(item){
                            postsHtml += '<li><a href="' + item.link.replace(_.opts.site, '') + '" title="' + item.title + '">' + item.title + '</a></li>';
                        });
                        _.opts.popular.innerHTML = postsHtml;
                    }
                },function(){
                    console.log('获取数据失败！')
                }
            );
        }
    }

    // 获取评论列表
    iDisqus.prototype.getlist = function(){
        var _ = this;
        _.stat.loading = true;
        _.dom.querySelector('#idisqus').style.display = 'block';
        _.dom.querySelector('#disqus_thread').style.display = 'none';
        getAjax(
            _.opts.api + '/getcomments.php?link=' + _.opts.url + (!!_.stat.next ? '&cursor=' + _.stat.next : ''),
            function(resp){
                var data = JSON.parse(resp);
                if (!data.auth){
                    alert('认证出错，请查看后端配置中，Disqus 帐号密码是否填写有误。');
                }
                if (data.code === 0) {
                    _.stat.offsetTop = d.documentElement.scrollTop || d.body.scrollTop;
                    _.stat.thread = data.thread;
                    _.stat.count = data.posts;
                    _.dom.querySelector('#idisqus').classList.remove('loading');
                    _.dom.querySelector('#comment-link').href = data.link;
                    _.dom.querySelector('#comment-count').innerHTML = _.stat.count + ' 条评论';
                    var loadmore = _.dom.querySelector('.comment-loadmore');
                    var posts = !!data.response ? data.response : [];
                    _.stat.root = [];
                    posts.forEach(function(item){
                        _.load(item);
                        if(!item.parent){
                            _.stat.root.unshift(item.id);
                        }
                    });

                    if ( data.cursor.hasPrev ){
                        _.stat.root.forEach(function(item){
                            _.dom.querySelector('.comment-list').appendChild(_.dom.querySelector('#comment-' + item));
                        })
                    } else {
                        loadmore.addEventListener('click', _.handle.loadMore, false);
                        _.dom.querySelector('.exit').addEventListener('click', _.handle.guestReset, false);
                        _.dom.querySelector('.comment-form-textarea').addEventListener('blur', _.handle.focus, false);
                        _.dom.querySelector('.comment-form-textarea').addEventListener('focus',_.handle.focus, false);
                        _.dom.querySelector('.comment-form-textarea').addEventListener('input', _.handle.input, false);
                        _.dom.querySelector('.comment-form-textarea').addEventListener('keyup', _.handle.mention, false);
                        _.dom.querySelector('.comment-form-email').addEventListener('blur', _.handle.verify, false);
                        _.dom.querySelector('.comment-form-submit').addEventListener('click', _.handle.post, false);
                        _.dom.querySelector('.comment-image-input').addEventListener('change', _.handle.upload, false);
                        addListener(_.dom.getElementsByClassName('emojione-item'), 'click', _.handle.field);
                    }
                    if ( data.cursor.hasNext ){
                        _.stat.next = data.cursor.next;
                        loadmore.classList.remove('loading');
                    } else {
                        _.stat.next = null;
                        loadmore.classList.add('hide');
                    }
                    if (posts.length == 0) {
                        return;
                    }

                    window.scrollTo(0, _.stat.offsetTop);

                    _.timeAgo();

                    if (/^#disqus|^#comment/.test(location.hash) && !data.cursor.hasPrev && !_.stat.disqusLoaded ) {
                        var el = _.dom.querySelector('#idisqus ' + location.hash)
                        window.scrollBy(0, el.getBoundingClientRect().top);
                    }

                    _.stat.loading = false;
                    _.stat.loaded = true;
                } else if ( data.code === 2 ){
                    _.create();
                }
            },function(){
                alert('获取数据失败，请检查服务器设置。')
            }
        );
    }

    // 读取评论
    iDisqus.prototype.load = function(post){

        var _ = this;

        var parentPostDom = _.dom.querySelector('.comment-item[data-id="'+post.parent+'"]');

        var user = {
            username: post.username,
            name: post.name,
            avatar: post.avatar
        }
        if(!!post.username && _.stat.users.map(function(user) { return user.username; }).indexOf(post.username) == -1){
            _.stat.users.push(user);
        }
        
        var parentPost = !!post.parent ? {
            name: '<a class="comment-item-pname" href="#'+parentPostDom.id+'"><svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200"><path d="M1.664 902.144s97.92-557.888 596.352-557.888V129.728L1024 515.84l-425.984 360.448V628.8c-270.464 0-455.232 23.872-596.352 273.28"></path></svg>' + parentPostDom.dataset.name + '</a>',
            dom: parentPostDom.querySelector('.comment-item-children'),
            insert: 'afterbegin'
        } : {
            name: '',
            dom: _.dom.querySelector('.comment-list'),
            insert: post.id == 'preview' || !!post.isPost ? 'afterbegin' : 'beforeend'
        };

        var mediaHTML = '';
        if( post.media.length > 0 ){
            post.media.forEach(function(item){
                mediaHTML += '<a class="comment-item-imagelink" target="_blank" href="' + item + '" ><img class="comment-item-image" src="' + item + '"></a>';
            })
            mediaHTML = '<div class="comment-item-images">' + mediaHTML + '</div>';
        }

        var html = '<li class="comment-item" data-id="' + post.id + '" data-name="'+ post.name + '" id="comment-' + post.id + '">' +
            '<div class="comment-item-body">'+
            '<a class="comment-item-avatar" href="#comment-'+post.id+'"><img src="' + post.avatar + '"></a>'+
            '<div class="comment-item-main">'+
            '<div class="comment-item-header"><a class="comment-item-name" title="' + post.name + '" rel="nofollow" target="_blank" href="' + ( post.url ? post.url : 'javascript:;' ) + '">' + post.name + '</a>'+ (post.isMod ?'<span class="comment-item-badge">'+_.opts.badge+'</span>' :'')+parentPost.name+'<span class="comment-item-bullet"> • </span><time class="comment-item-time" datetime="' + post.createdAt + '"></time></div>'+
            '<div class="comment-item-content">' + post.message + mediaHTML + '</div>'+
            '<div class="comment-item-footer">' + (!!post.isPost ? '<span class="comment-item-manage"><a class="comment-item-edit" href="javascript:;">编辑</a><span class="comment-item-bullet"> • </span><a class="comment-item-delete" href="javascript:;">删除</a><span class="comment-item-bullet"> • </span></span>' : '') + '<a class="comment-item-reply" href="javascript:;">回复</a> </div>'+
            '</div></div>'+
            '<ul class="comment-item-children"></ul>'+
            '</li>';

        // 已删除评论
        if(!!post.isDeleted){
            html = '<li class="comment-item" data-id="' + post.id + '" id="comment-' + post.id + '" data-name="已删除">' +
                '<div class="comment-item-body">'+
                '<a class="comment-item-avatar" href="#comment-'+post.id+'"><img src="' + post.avatar + '"></a>'+
                '<div class="comment-item-main" data-message="此评论已被删除。"></div></div>'+
                '<ul class="comment-item-children"></ul>'+
                '</li>';
        }


        // 更新 or 创建
        if(!!_.dom.querySelector('.comment-item[data-id="' + post.id + '"]')){
            _.dom.querySelector('.comment-item[data-id="' + post.id + '"]').outerHTML = html;
        } else {
            parentPost.dom.insertAdjacentHTML(parentPost.insert, html);
        }

        if(!post.isDeleted){
            _.dom.querySelector('.comment-item[data-id="' + post.id + '"] .comment-item-reply').addEventListener('click', _.handle.show, false);
            _.dom.querySelector('.comment-item[data-id="' + post.id + '"] .comment-item-avatar').addEventListener('click', _.handle.jump, false);
            if( !!post.parent ) {
                _.dom.querySelector('.comment-item[data-id="' + post.id + '"] .comment-item-pname').addEventListener('click', _.handle.jump, false);
            }
        }

        // 发布留言，可编辑删除
        if(!!post.isPost && !_.stat.editing){
            var $this = _.dom.querySelector('.comment-item[data-id="' + post.id + '"]');
            $this.querySelector('.comment-item-footer').insertAdjacentHTML('beforeend','<span class="comment-item-tips">页面刷新前，十分钟内可编辑或删除</span>');
            setTimeout(function(){
                // 五秒后
                if(!!$this.querySelector('.comment-item-tips')){
                    $this.querySelector('.comment-item-tips').outerHTML = '';
                }
            }, 5000);

            var postEdit = setTimeout(function(){
                // 十分钟后
                if(!!$this.querySelector('.comment-item-manage')){
                    $this.querySelector('.comment-item-manage').outerHTML = '';
                }
            }, 600000);

            // 删除
            $this.querySelector('.comment-item-delete').addEventListener('click',function(e){
                var postData = {
                    id: post.id
                }
                var delDom = e.currentTarget;
                delDom.innerHTML = '删除中';
                postAjax( _.opts.api + '/removecomment.php', postData, function(resp){
                    var data = JSON.parse(resp);
                    if (data.code === 0) {
                        if(data.response.isDeleted == true){
                            $this.outerHTML = '';
                        } else {
                            alert(data.response.message);
                            $this.querySelector('.comment-item-manage').outerHTML = '';
                        }
                    } else if (data.code === 2) {
                        alert(data.response);
                        $this.querySelector('.comment-item-manage').outerHTML = '';
                    }
                }, function(){
                    alert('删除出错，请稍后重试');
                })
                clearTimeout(postEdit);
            }, false)

            // 编辑
            $this.querySelector('.comment-item-edit').addEventListener('click',function(){
                _.stat.editing = post;
                _.edit(post);
            }, false)
        }
    }

    // 读取更多
    iDisqus.prototype.loadMore = function(e){
        var _ = this;
        if( !_.stat.loading ){
            e.currentTarget.classList.add('loading');
            _.getlist();
        }
    }

    // 评论框焦点
    iDisqus.prototype.focus = function(e){
        var wrapper = e.currentTarget.closest('.comment-form-wrapper');
        wrapper.classList.add('editing');
        if (wrapper.classList.contains('focus')){
            wrapper.classList.remove('focus');
        } else{
            wrapper.classList.add('focus');
        }
    }

    // 输入事件
    iDisqus.prototype.input = function(e){
        var form = e.currentTarget.closest('.comment-form');
        var alertmsg = form.querySelector('.comment-form-alert');
        alertmsg.innerHTML = '';
    }

    // 提醒用户 @ mention 
    iDisqus.prototype.mention = function(e){
        var _ = this;
        var textarea = e.currentTarget;
        var selStart = textarea.selectionStart;
        var mentionIndex = textarea.value.slice(0, selStart).lastIndexOf('@');
        var mentionText = textarea.value.slice(mentionIndex, selStart);
        var mentionDom = _.dom.querySelector('.mention-user');
        if(mentionText.search(/^@\w+$|^@$/) == 0){
            if( e.keyCode == 38 || e.keyCode == 40){
                return;
            }
            var showUsers = _.stat.users.filter(function(user){
                var re = new RegExp(mentionText.slice(1), 'i');
                return user.username.search(re) > -1;
            });
            var coord = _.getCaretCoord(textarea);
            var list='', html = '';

            if( showUsers.length > 0){
                showUsers.forEach(function(item, i){
                    list += '<li class="mention-user-item'+(i == 0 ? ' active' : '')+'" data-username="'+item.username+'"><img class="mention-user-avatar" src="'+item.avatar+'"><div class="mention-user-username">'+item.username+'</div><div class="mention-user-name">'+item.name+'</div></li>';
                })
                if(!!mentionDom){
                    mentionDom.innerHTML = '<ul class="mention-user-list">'+list+'</ul>';
                    mentionDom.style.left = coord.left + 'px';
                    mentionDom.style.top = coord.top + 'px';
                } else {
                    html = '<div class="mention-user" style="left:'+coord.left+'px;top:'+coord.top+'px"><ul class="mention-user-list">'+list+'</ul></div>';
                    _.dom.querySelector('#idisqus').insertAdjacentHTML('beforeend', html);
                }

                // 鼠标悬浮
                addListener(_.dom.getElementsByClassName('mention-user-item'), 'mouseover', function(){
                    _.dom.querySelector('.mention-user-item.active').classList.remove('active');
                    this.classList.add('active');
                })

                // 鼠标点击
                addListener(_.dom.getElementsByClassName('mention-user-item'), 'click', function(){
                    var username = '@' + this.dataset.username + ' ';
                    textarea.value = textarea.value.slice(0, mentionIndex) + username + textarea.value.slice(selStart);
                    _.dom.querySelector('.mention-user').outerHTML = '';
                    textarea.focus();
                    textarea.setSelectionRange(mentionIndex + username.length, mentionIndex + username.length)
                    textarea.removeEventListener('keydown', _.handle.keySelect, false);
                })

                // 键盘事件
                textarea.addEventListener('keydown', _.handle.keySelect, false);
            } else{
                if(!!mentionDom){
                    mentionDom.outerHTML = '';
                    textarea.removeEventListener('keydown', _.handle.keySelect, false);
                }
            }
        } else {
            if(!!mentionDom){
                mentionDom.outerHTML = '';
                textarea.removeEventListener('keydown', _.handle.keySelect, false);
            }
        }
    }

    // 获取光标坐标 https://medium.com/@_jh3y/how-to-where-s-the-caret-getting-the-xy-position-of-the-caret-a24ba372990a
    iDisqus.prototype.getCaretCoord = function(textarea){
        var _ = this;
        var carPos = textarea.selectionEnd,
            div = d.createElement('div'),
            span = d.createElement('span'),
            copyStyle = getComputedStyle(textarea);
        [].forEach.call(copyStyle, function(prop){
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
    iDisqus.prototype.keySelect = function(e){
        var _ = this;
        var textarea = e.currentTarget;
        var selStart = textarea.selectionStart;
        var mentionIndex = textarea.value.slice(0, selStart).lastIndexOf('@');
        var mentionText = textarea.value.slice(mentionIndex, selStart);
        var mentionDom = _.dom.querySelector('.mention-user');
        var current = _.dom.querySelector('.mention-user-item.active')
        switch(e.keyCode){
            case 13:
                //回车
                var username = '@' + current.dataset.username + ' ';
                textarea.value = textarea.value.slice(0, mentionIndex) + username + textarea.value.slice(selStart);
                textarea.setSelectionRange(mentionIndex + username.length, mentionIndex + username.length)
                _.dom.querySelector('.mention-user').outerHTML = '';
                textarea.removeEventListener('keydown', _.handle.keySelect, false);
                e.preventDefault();
                break;
            case 38:
                //上
                if(!!current.previousSibling){
                    current.previousSibling.classList.add('active');
                    current.classList.remove('active');
                }
                e.preventDefault();
                break;
            case 40:
                //下
                if(!!current.nextSibling){
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
    iDisqus.prototype.jump = function(e){
        var _ = this;
        var $this = e.currentTarget;
        var hash = getLocation($this.href).hash;
        var el = _.dom.querySelector('#idisqus ' + hash);
        history.replaceState(undefined, undefined, hash);
        window.scrollBy(0, el.getBoundingClientRect().top);
        e.preventDefault();
    }

    // 点选表情
    iDisqus.prototype.field = function(e){
        var item = e.currentTarget;
        var form = item.closest('.comment-form');
        var textarea = form.querySelector('.comment-form-textarea');
        var selStart = textarea.selectionStart;
        var shortCode = selStart == 0 ? item.dataset.code + ' ' : ' ' + item.dataset.code + ' '
        textarea.value = textarea.value.slice(0, selStart) + shortCode + textarea.value.slice(selStart) 
        textarea.focus();
        textarea.setSelectionRange(selStart + shortCode.length, selStart + shortCode.length);
    }

    // 显示回复框 or 取消回复框
    iDisqus.prototype.show = function(e){
        var _ = this;

        var $this = e.currentTarget;
        var item = $this.closest('.comment-item');

        // 无论取消还是回复，移除已显示回复框
        var box = _.dom.querySelector('.comment-item .comment-box:not([data-current-id])');
        if( box ){
            var $show = box.closest('.comment-item');
            var cancel = $show.querySelector('.comment-item-cancel')
            cancel.outerHTML = cancel.outerHTML.replace('cancel','reply');
            box.outerHTML = '';
        }

        // 回复时，显示评论框
        if( $this.className == 'comment-item-reply' ){
            $this.outerHTML = $this.outerHTML.replace('reply','cancel');
            var commentBox = _.box.replace(/emoji-input/g,'emoji-input-'+item.dataset.id).replace(/upload-input/g,'upload-input-'+item.dataset.id);
            item.querySelector('.comment-item-children').insertAdjacentHTML('beforebegin', commentBox);
            _.guest.init();

            item.querySelector('.comment-form-textarea').addEventListener('blur', _.handle.focus, false);
            item.querySelector('.comment-form-textarea').addEventListener('focus', _.handle.focus, false);
            item.querySelector('.comment-form-textarea').addEventListener('keyup', _.handle.mention, false);
            item.querySelector('.comment-form-textarea').addEventListener('input', _.handle.input, false);
            item.querySelector('.comment-form-email').addEventListener('blur', _.handle.verify, false);
            item.querySelector('.comment-form-submit').addEventListener('click', _.handle.post, false);
            item.querySelector('.comment-image-input').addEventListener('change', _.handle.upload, false);
            addListener(item.getElementsByClassName('emojione-item'), 'click', _.handle.field);
            item.querySelector('.comment-form-textarea').focus();
        }

        // 监听事件
        addListener(_.dom.getElementsByClassName('comment-item-reply'), 'click', _.handle.show);
        addListener(_.dom.getElementsByClassName('comment-item-cancel'), 'click', _.handle.show);

    }

    // 验证表单
    iDisqus.prototype.verify = function(e){
        var _ = this;
        var box  = e.currentTarget.closest('.comment-box');
        var avatar = box.querySelector('.comment-avatar-image');
        var email = box.querySelector('.comment-form-email');
        var alertmsg = box.querySelector('.comment-form-alert');
        if(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email.value)){
            getAjax(
                _.opts.api + '/getgravatar.php?email=' + email.value,
                function(resp) {
                    if (resp == 'false') {
                        _.errorTips('您所填写的邮箱地址有误。', email);
                    } else {
                        avatar.src = resp;
                    }
                }, function(){
                }
            );
        }
    }

    // 上传图片
    iDisqus.prototype.upload = function(e){
        var _ = this;
        var file = e.currentTarget;
        var form = file.closest('.comment-form');
        var progress = form.querySelector('.comment-image-progress');
        var loaded = form.querySelector('.comment-image-loaded');
        var wrapper = form.querySelector('.comment-form-wrapper');
        var alertmsg = form.querySelector('.comment-form-alert');
        alertmsg.innerHTML = '';
        if(file.files.length === 0){
            return;
        }

        // 以文件大小识别是否为同张图片
        var size = file.files[0].size;

        if( size > 5000000 ){
            alertmsg.innerHTML = '请选择 5M 以下图片。';
            setTimeout(function(){
                alertmsg.innerHTML = '';
            }, 3000);
            return;
        }

        if( _.stat.imageSize.indexOf(size) == -1 ){
            progress.style.width = '80px';
        } else {
            alertmsg.innerHTML = '请勿选择已存在的图片。';
            setTimeout(function(){
                alertmsg.innerHTML = '';
            }, 3000);
            return;
        }

        // 展开图片上传界面
        wrapper.classList.add('expanded');

        // 图片上传请求
        var data = new FormData();
        data.append('file', file.files[0] );
        var filename = file.files[0].name;

        var $item;

        var xhrUpload = new XMLHttpRequest();
        xhrUpload.onreadystatechange = function(){
            if(xhrUpload.readyState == 4 && xhrUpload.status == 200){
                var data = JSON.parse(xhrUpload.responseText);
                if( data.code == 0 ){
                    _.stat.imageSize.push(size);
                    var imageUrl = data.response[filename].url;
                    var image = new Image();
                    image.src = imageUrl;
                    image.onload = function(){
                        $item.innerHTML = '<img class="comment-image-object" src="'+imageUrl+'">';
                        $item.dataset.imageUrl = imageUrl;
                        $item.classList.remove('loading');
                        $item.addEventListener('click', _.handle.remove, false);
                    }
                } else {
                    alertmsg.innerHTML = '图片上传出错。';
                    $item.innerHTML = '';
                    if( !!form.getElementsByClassName('comment-image-item').length){
                        wrapper.classList.remove('expanded');
                    }
                    setTimeout(function(){
                        alertmsg.innerHTML = '';
                    }, 3000);
                }
            }
        };
        xhrUpload.upload.addEventListener('progress', function(e){
            loaded.style.width = Math.ceil((e.loaded/e.total) * 100)+ '%';
        }, false);
        xhrUpload.upload.addEventListener('load', function(e){
            loaded.style.width = 0;
            progress.style.width = 0;
            var imageItem = '<li class="comment-image-item loading" data-image-size="' + size + '">\n'+
                '    <svg version="1.1" class="comment-image-object" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"\n'+
                '        width="24px" height="30px" viewBox="0 0 24 30" style="enable-background: new 0 0 50 50;" xml:space="preserve">\n'+
                '        <rect x="0" y="10" width="4" height="10" fill="rgba(127,145,158,1)" opacity="0.2">\n'+
                '            <animate attributeName="opacity" attributeType="XML" values="0.2; 1; .2" begin="0s" dur="0.6s" repeatCount="indefinite" />\n'+
                '            <animate attributeName="height" attributeType="XML" values="10; 20; 10" begin="0s" dur="0.6s" repeatCount="indefinite" />\n'+
                '            <animate attributeName="y" attributeType="XML" values="10; 5; 10" begin="0s" dur="0.6s" repeatCount="indefinite" />\n'+
                '        </rect>\n'+
                '        <rect x="8" y="10" width="4" height="10" fill="rgba(127,145,158,1)" opacity="0.2">\n'+
                '            <animate attributeName="opacity" attributeType="XML" values="0.2; 1; .2" begin="0.15s" dur="0.6s" repeatCount="indefinite" />\n'+
                '            <animate attributeName="height" attributeType="XML" values="10; 20; 10" begin="0.15s" dur="0.6s" repeatCount="indefinite" />\n'+
                '            <animate attributeName="y" attributeType="XML" values="10; 5; 10" begin="0.15s" dur="0.6s" repeatCount="indefinite" />\n'+
                '        </rect>\n'+
                '        <rect x="16" y="10" width="4" height="10" fill="rgba(127,145,158,1)" opacity="0.2">\n'+
                '            <animate attributeName="opacity" attributeType="XML" values="0.2; 1; .2" begin="0.3s" dur="0.6s" repeatCount="indefinite" />\n'+
                '            <animate attributeName="height" attributeType="XML" values="10; 20; 10" begin="0.3s" dur="0.6s" repeatCount="indefinite" />\n'+
                '            <animate attributeName="y" attributeType="XML" values="10; 5; 10" begin="0.3s" dur="0.6s" repeatCount="indefinite" />\n'+
                '        </rect>\n'+
                '    </svg>\n'+
                '</li>\n';
            form.querySelector('.comment-image-list').insertAdjacentHTML('beforeend', imageItem);
            $item = form.querySelector('[data-image-size="'+size+'"]');
        }, false);
        xhrUpload.open('POST', _.opts.api + '/upload.php', true);
        xhrUpload.send(data);
    }

    // 移除图片
    iDisqus.prototype.remove = function(e){
        var _ = this;
        var $item = e.currentTarget.closest('.comment-image-item');
        var wrapper = e.currentTarget.closest('.comment-form-wrapper');
        $item.outerHTML = '';
        _.stat.imageSize = [];
        var imageArr = wrapper.getElementsByClassName('comment-image-item');
        [].forEach.call(imageArr, function(item, i){
            _.stat.imageSize[i] = item.dataset.imageSize;
        });
        if(_.stat.imageSize.length == 0){
            wrapper.classList.remove('expanded');
        }
        wrapper.querySelector('.comment-image-input').value = '';
    }

    // 错误提示
    iDisqus.prototype.errorTips = function(Text, Dom){
        var _ = this;
        if( _.guest.logged_in == 'true' ){
            _.handle.guestReset();
        }
        var idisqus = _.dom.querySelector('#idisqus');
        var errorDom = _.dom.querySelector('.comment-form-error');
        if(!!errorDom){
            errorDom.outerHTML = '';
        }
        var Top = Dom.offsetTop;
        var Left = Dom.offsetLeft;
        var errorHtml = '<div class="comment-form-error" style="top:'+Top+'px;left:'+Left+'px;">'+Text+'</div>';
        idisqus.insertAdjacentHTML('beforeend', errorHtml);
        setTimeout(function(){
            var errorDom = _.dom.querySelector('.comment-form-error');
            if(!!errorDom){
                errorDom.outerHTML = '';
            }
        }, 3000);
    }

    // 发表/回复评论
    iDisqus.prototype.post = function(e){
        var _ = this;
        var item =  e.currentTarget.closest('.comment-box[data-current-id]') || e.currentTarget.closest('.comment-item') || e.currentTarget.closest('.comment-box');
        var message = item.querySelector('.comment-form-textarea').value;
        var parentId = !!item.dataset.id ? item.dataset.id : '';
        var imgArr = item.getElementsByClassName('comment-image-item');
        var media = [];
        var mediaStr = '';
        [].forEach.call(imgArr, function(image,i){
            media[i] = image.dataset.imageUrl;
            mediaStr += ' ' + image.dataset.imageUrl;
        });

        // 不是编辑框需预览
        if( !item.dataset.currentId ){
            var elName = item.querySelector('.comment-form-name');
            var elEmail = item.querySelector('.comment-form-email');
            var elUrl = item.querySelector('.comment-form-url');
            var guest = {
                name: elName.value,
                email: elEmail.value,
                url: elUrl.value.replace(/\s/g,''),
                avatar: item.querySelector('.comment-avatar-image').src
            }
            var alertmsg = item.querySelector('.comment-form-alert');
            function alertClear(){
                setTimeout(function(){
                    alertmsg.innerHTML = '';
                }, 3000);
            }

            if(/^\s*$/i.test(guest.name)){
                _.errorTips('名字不能为空。', elName);
                return;
            }
            if(/^\s*$/i.test(guest.email)){
                _.errorTips('邮箱不能为空。', elEmail);
                return;
            }
            if(!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(guest.email)){
                _.errorTips('请正确填写邮箱。', elEmail);
                return;
            }
            if(!/^([hH][tT]{2}[pP]:\/\/|[hH][tT]{2}[pP][sS]:\/\/)(([A-Za-z0-9-~]+)\.)+([A-Za-z0-9-~\/])+$|^\s*$/i.test(guest.url)){
                _.errorTips('请正确填写网址。', elUrl);
                return;
            }
            _.guest.submit(guest);

            if(!_.stat.message && !_.stat.mediaHtml){
                _.box = _.dom.querySelector('.comment-box').outerHTML.replace(/<label class="comment-actions-label exit"(.|\n)*<\/label>\n/,'').replace('comment-form-wrapper','comment-form-wrapper editing').replace(/加入讨论……/,'');
            }

            if( !_.guest.name && !_.guest.email ){
                return;
            }

            if( media.length == 0 && /^\s*$/i.test(message)){
                alertmsg.innerHTML = '评论不能为空或空格。';
                item.querySelector('.comment-form-textarea').focus();
                return;
            };

            var preMessage = message;

            if( !!_.opts.emoji_preview ){
                preMessage = preMessage.replace(/:([-+\w]+):/g, function (match){
                    var emojiShort = match.replace(/:/g,'');
                    var emojiImage = !!_.eac[emojiShort] ? '<img class="emojione" width="24" height="24" alt="'+emojiShort+'" title=":'+emojiShort+':" src="'+_.opts.emoji_path+_.eac[emojiShort]+'.png">' : match;
                    return emojiImage;
                });
            } else {
                _.emoji_list.forEach(function(item){
                    preMessage = preMessage.replace(':'+item.code+':', '<img class="emojione" width="24" height="24" src="' + _.opts.emoji_path + item.unicode + '.png" />');
                });
            }

            var post = {
                'url': !!_.guest.url ? _.guest.url : '',
                'isMod': false,
                'username': null,
                'name': _.guest.name,
                'avatar': _.guest.avatar,
                'id': 'preview',
                'parent': parentId,
                'createdAt': (new Date()).toJSON(),
                'message': '<p>' + preMessage + '</p>',
                'media': media
            };

            _.load(post);

            _.timeAgo();

            // 清空或移除评论框
            _.stat.message = message;
            _.stat.mediaHtml = item.querySelector('.comment-image-list').innerHTML;

            if( parentId ){
                item.querySelector('.comment-item-cancel').click();
            } else {
                item.querySelector('.comment-form-textarea').value = '';
                item.querySelector('.comment-image-list').innerHTML = '';
                item.querySelector('.comment-form-wrapper').classList.remove('expanded','editing');
            }
        }

        // @
        var mentions = message.match(/@\w+/g);
        if( !!mentions ){
            mentions = mentions.filter(function(mention) {
                return _.stat.users.map(function(user) { return user.username; }).indexOf(mention.slice(1)) > -1;
            });
            if( mentions.length > 0 ){
                var re = new RegExp('('+mentions.join('|')+')','g');
                message = message.replace(re,'$1:disqus');
            }
        }

        // 文本 + 图片
        message += mediaStr;

        // POST 操作
        // 编辑框则更新评论
        if( !!item.dataset.currentId ){
            var postData = {
                id: item.dataset.currentId,
                message: message,
            }
            postAjax( _.opts.api + '/updatecomment.php', postData, function(resp){
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
            }, function(){
                // 取消编辑
                _.load(_.stat.editing)
                _.timeAgo();
                _.stat.editing = false;
            })
        } else {
            var postData = {
                thread:  _.stat.thread,
                parent: parentId,
                message: message,
                name: _.guest.name,
                email: _.guest.email,
                url:  _.guest.url,
                link: _.opts.url,
                title: _.opts.title
            }
            postAjax( _.opts.api + '/postcomment.php', postData, function(resp){
                var data = JSON.parse(resp);
                if (data.code === 0) {
                    _.dom.querySelector('.comment-item[data-id="preview"]').outerHTML = '';
                    _.stat.count += 1;
                    _.dom.querySelector('#comment-count').innerHTML = _.stat.count + ' 条评论';
                    var post = data.response;
                    post.isPost = true;
                    _.load(post);
                    _.timeAgo();
                } else if (data.code === 2) {
                    alertmsg.innerHTML = data.response;
                    _.dom.querySelector('.comment-item[data-id="preview"]').outerHTML = '';
                    _.reEdit(item);

                    if( data.response.indexOf('author') > -1){
                        _.handle.guestReset();
                    }
                }
            }, function(){
                alertmsg.innerHTML = '提交出错，请稍后重试。';
                alertClear();

                _.dom.querySelector('.comment-item[data-id="preview"]').outerHTML = '';
                _.reEdit(item);
            })
        }
    }

    // 重新编辑
    iDisqus.prototype.reEdit = function(item){
        var _ = this;

        if( !!item.dataset.id ){
            item.querySelector('.comment-item-reply').click();
        } else {
            item.querySelector('.comment-form-wrapper').classList.add('editing');
        }

        // 重新填充文本图片
        if(!!_.stat.message){
            item.querySelector('.comment-form-textarea').value = _.stat.message;
        }
        if(!!_.stat.mediaHtml){
            item.querySelector('.comment-form-wrapper').classList.add('expanded');
            item.querySelector('.comment-image-list').innerHTML = _.stat.mediaHtml;
            addListener(item.getElementsByClassName('comment-image-item'), 'click', _.handle.remove);
        }
    }

    // 编辑
    iDisqus.prototype.edit = function(post){
        var _ = this;
        var commentBox = _.box.replace('comment-box','comment-box comment-box-'+post.id).replace(/emoji-input/g,'emoji-input-'+post.id).replace(/upload-input/g,'upload-input-'+ post.id);
        var $this = _.dom.querySelector('.comment-item[data-id="' + post.id + '"] .comment-item-body');
        $this.outerHTML = commentBox;
        _.guest.init();
        var item = _.dom.querySelector('.comment-box-' + post.id);
        item.dataset.currentId = post.id;
        item.querySelector('.comment-form-textarea').addEventListener('blur', _.handle.focus, false);
        item.querySelector('.comment-form-textarea').addEventListener('focus', _.handle.focus, false);
        item.querySelector('.comment-form-textarea').addEventListener('input', _.handle.input, false);
        item.querySelector('.comment-form-textarea').addEventListener('keyup', _.handle.mention, false);
        item.querySelector('.comment-form-email').addEventListener('blur', _.handle.verify, false);
        item.querySelector('.comment-form-submit').addEventListener('click', _.handle.post, false);
        item.querySelector('.comment-image-input').addEventListener('change', _.handle.upload, false);
        addListener(item.getElementsByClassName('emojione-item'), 'click', _.handle.field);
        item.querySelector('.comment-form-textarea').focus();

        // 取消编辑
        item.querySelector('.comment-actions-form').insertAdjacentHTML('afterbegin', '<a class="comment-form-cancel" href="javascript:;">取消</a>')
        item.querySelector('.comment-form-cancel').addEventListener('click', function(){
            _.stat.editing = false;
            _.load(post);
            _.timeAgo();
        }, false);

        // 重新填充文本图片，连续回复、连续编辑会有 bug
        if(!!_.stat.message){
            item.querySelector('.comment-form-textarea').value = _.stat.message;
        }
        if(!!_.stat.mediaHtml){
            item.querySelector('.comment-form-wrapper').classList.add('expanded');
            item.querySelector('.comment-image-list').innerHTML = _.stat.mediaHtml;
            addListener(item.getElementsByClassName('comment-image-item'), 'click', _.handle.remove);
        }

    }

    // 创建 Thread 表单
    iDisqus.prototype.create = function(){
        var _ = this;
        if(!!_.opts.auto){
            _.dom.querySelector('.loading-container').dataset.tip = '正在创建 Thread……';
            var postData = {
                url: _.opts.link,
                identifier: _.opts.identifier,
                title: _.opts.title,
                slug: _.opts.slug,
                message: _.opts.desc
            }
            _.postThread(postData);
            return;
        }
        _.dom.querySelector('#idisqus').classList.remove('loading');
        _.dom.querySelector('#idisqus').innerHTML  = '<div class="comment-header"><span class="comment-header-item">创建 Thread<\/span><\/div>'+
            '<div class="comment-thread-form">'+
            '<p>由于 Disqus 没有本页面的相关 Thread，故需先创建 Thread<\/p>'+
            '<div class="comment-form-item"><label class="comment-form-label">url:<\/label><input class="comment-form-input" id="thread-url" name="url" value="' + _.opts.link + '" disabled \/><\/div>'+
            '<div class="comment-form-item"><label class="comment-form-label">identifier:<\/label><input class="comment-form-input" id="thread-identifier" name="identifier" value="'+_.opts.identifier+'" disabled \/><\/div>'+
            '<div class="comment-form-item"><label class="comment-form-label">title:<\/label><input class="comment-form-input" id="thread-title" name="title" value="'+_.opts.title+'" disabled \/><\/div>'+
            '<div class="comment-form-item"><label class="comment-form-label">slug:<\/label><input class="comment-form-input" id="thread-slug" name="slug" value="' + _.opts.slug + '" \/><\/div>'+
            '<div class="comment-form-item"><label class="comment-form-label">message:<\/label><textarea class="comment-form-textarea" id="thread-message" name="message">'+_.opts.desc+'<\/textarea><\/div>'+
            '<button id="thread-submit" class="comment-form-submit">提交<\/button><\/div>';
        _.dom.querySelector('#thread-submit').addEventListener('click', _.handle.postThread, false);
    }

    // 创建 Thread 事件
    iDisqus.prototype.postThread = function(){
        var _ = this;
        if( !!arguments[0].target ){
            var postData = {
                url: _.dom.querySelector('#thread-url').value,
                identifier: _.dom.querySelector('#thread-identifier').value,
                title: _.dom.querySelector('#thread-title').value,
                slug: _.dom.querySelector('#thread-slug').value.replace(/[^A-Za-z0-9_-]+/g,''),
                message: _.dom.querySelector('#thread-message').value
            }
        } else {
            var postData = arguments[0];
        }
        postAjax( _.opts.api + '/createthread.php', postData, function(resp){
            var data = JSON.parse(resp);
            if( data.code === 0 ) {
                alert('创建 Thread 成功，刷新后便可愉快地评论了！');
                setTimeout(function(){location.reload();},2000);
            } else if( data.code === 2 ) {
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
        }, function(){
            alert('创建 Thread 出错，请稍后重试！');
        })
    }

    // 销毁评论框
    iDisqus.prototype.destroy = function(){
        var _ = this;
        _.dom.querySelector('.exit').removeEventListener('click', _.handle.guestReset, false);
        removeListener(_.dom.getElementsByClassName('comment-form-textarea'), 'blur', _.handle.focus);
        removeListener(_.dom.getElementsByClassName('comment-form-textarea'), 'focus', _.handle.focus);
        removeListener(_.dom.getElementsByClassName('comment-form-textarea'), 'keyup', _.handle.mention);
        removeListener(_.dom.getElementsByClassName('comment-form-email'), 'blur', _.handle.verify);
        removeListener(_.dom.getElementsByClassName('comment-form-submit'), 'click', _.handle.post);
        removeListener(_.dom.getElementsByClassName('comment-image-input'), 'change', _.handle.upload);
        removeListener(_.dom.getElementsByClassName('comment-item-reply'), 'click', _.handle.show);
        removeListener(_.dom.getElementsByClassName('comment-loadmore'), 'click', _.handle.loadMore);
        removeListener(_.dom.getElementsByClassName('emojione-item'), 'click', _.handle.field);
        _.dom.innerHTML = '';
        delete _.box;
        delete _.dom;
        delete _.emoji_list;
        delete _.guest;
        delete _.handle;
        delete _.opts;
        delete _.stat;
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
