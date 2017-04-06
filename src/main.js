import './main.scss';
var jsUrl = document.querySelector('[src$="disqus-api.js"]').src;
var site = {
    'apipath': jsUrl.substring(0, jsUrl.lastIndexOf('/')) + '/api',
    'origin': location.origin
}
var page = {
    'title': document.title,
    'url': location.pathname,
    'desc': document.querySelector('meta[name="description"]').content
}
var forum = document.getElementById('comment').dataset.forum;

function timeAgo(selector) {
    var templates = {
        prefix: '',
        suffix: '前',
        seconds: '几秒',
        minute: '1 分钟',
        minutes: '%d 分钟',
        hour: '1 小时',
        hours: '%d 小时',
        day: '1 天',
        days: '%d 天',
        month: '1 个月',
        months: '%d 个月',
        year: '1 年',
        years: '%d 年'
    };
    var template = function(t, n) {
        return templates[t] && templates[t].replace(/%d/i, Math.abs(Math.round(n)));
    };

    var timer = function(time) {
        if (!time) return;
        time = time.replace(/\.\d+/, '');
        time = time.replace(/-/, '/').replace(/-/, '/');
        time = time.replace(/T/, ' ').replace(/Z/, ' UTC');
        time = time.replace(/([\+\-]\d\d)\:?(\d\d)/, ' $1$2'); // -04:00 -> -0400
        time = new Date(time * 1000 || time);

        var now = new Date();
        var seconds = ((now.getTime() - time) * .001) >> 0;
        var minutes = seconds / 60;
        var hours = minutes / 60;
        var days = hours / 24;
        var years = days / 365;

        return templates.prefix + (
            seconds < 45 && template('seconds', seconds) || seconds < 90 && template('minute', 1) || minutes < 45 && template('minutes', minutes) || minutes < 90 && template('hour', 1) || hours < 24 && template('hours', hours) || hours < 42 && template('day', 1) || days < 30 && template('days', days) || days < 45 && template('month', 1) || days < 365 && template('months', days / 30) || years < 1.5 && template('year', 1) || template('years', years)) + templates.suffix;
    };

    var elements = document.querySelectorAll('.timeago');
    for (var i in elements) {
        var $this = elements[i];
        if (typeof $this === 'object') {
            $this.innerHTML = timer($this.getAttribute('title') || $this.getAttribute('datetime'));
        }
    }
    setTimeout(timeAgo, 60000);
}

// 访客信息
function Guest() {
    this.init();
}

Guest.prototype = {

    // 初始化访客信息
    init: function(){
        this.load();
        var boxArr = document.getElementsByClassName('comment-box');
        var guest = this;
        if( guest.logged_in == 'true' ) {
            [].forEach.call(boxArr,function(item,i){
                item.querySelector('.comment-form-wrapper').classList.add('logged-in');
                item.querySelector('.comment-avatar-image').setAttribute('src', guest.avatar);
                item.querySelector('.comment-form-name').value = guest.name;
                item.querySelector('.comment-form-email').value = guest.email;
                item.querySelector('.comment-form-url').value = guest.url;
            });
        } else {
            [].forEach.call(boxArr,function(item,i){
                item.querySelector('.comment-form-wrapper').classList.remove('logged-in');
            });
            localStorage.setItem('logged_in', 'false');
        }
    },

    // 读取访客信息
    load: function(){
        this.name = localStorage.getItem('name');
        this.email = localStorage.getItem('email');
        this.url = localStorage.getItem('url');
        this.avatar = localStorage.getItem('avatar');
        this.logged_in = localStorage.getItem('logged_in');
    },

    // 清除访客信息
    clear: function(){
        localStorage.removeItem('name');
        localStorage.removeItem('email');
        localStorage.removeItem('url');
        localStorage.removeItem('avatar');
        localStorage.setItem('logged_in', 'false');
        guest.init()
    },

    // 提交访客信息
    submit: function(e){
        if( guest.logged_in == 'false' ){
            var item = e.currentTarget.closest('.comment-item') || e.currentTarget.closest('.comment-box');
            var name = item.querySelector('.comment-form-name').value,
            email = item.querySelector('.comment-form-email').value,
            avatar = item.querySelector('.comment-avatar-image').getAttribute('src'),
            url = item.querySelector('.comment-form-url').value;
            if (/\S/i.test(name)  && /^([\w-_]+(?:\.[\w-_]+)*)@((?:[a-z0-9]+(?:-[a-zA-Z0-9]+)*)+\.[a-z]{2,6})$/i.test(email)){
                localStorage.setItem('name', name);
                localStorage.setItem('email', email);
                localStorage.setItem('url', url);
                localStorage.setItem('avatar', avatar);
                localStorage.setItem('logged_in', 'true');
            } else {
                alert('请正确填写必填项');
                return;
            }
            guest.init();
        }
    }
}


function Comment () {
    this.imagesize = [];
    this.init();
    this.box = document.querySelector('.comment-box').outerHTML;
}

/* Disqus 评论 */
Comment.prototype = {

    // 初始化
    init: function(){
        this.getlist();
    },

    // 评论表单事件绑定
    form: function(){

        // 加载表情
        var emojiList = '';
        comment.emoji.forEach(function(item,i){
            emojiList += '<li class="emojione-item" title="'+ item.title+'" data-code="'+item.code+'"><img class="emojione-item-image" src="'+item.url+'" /></li>';
        })
        var emojiListArr = document.getElementsByClassName('emojione-list');
        [].forEach.call(emojiListArr,function(item,i){
            item.innerHTML = emojiList;
        });

        // 表情点选
        var emojiArr = document.getElementsByClassName('emojione-item');
        [].forEach.call(emojiArr,function(item,i){
            item.addEventListener('click', comment.field, false);
        });

        // 激活列表回复按钮事件
        var replyArr = document.getElementsByClassName('comment-item-reply');
        [].forEach.call(replyArr,function(item,i){
            item.addEventListener('click', comment.show, false);
        });

        // 评论框焦点
        var textareaArr = document.getElementsByClassName('comment-form-textarea');
        [].forEach.call(textareaArr, function(item, i){
            item.addEventListener('focus', comment.focus, false);
            item.addEventListener('blur', comment.focus, false);
        })

        // 邮箱验证
        var emailArr = document.getElementsByClassName('comment-form-email');
        [].forEach.call(emailArr, function(item,i){
            item.addEventListener('blur', comment.verify, false);
        });

        // 重置访客信息
        var exitArr = document.getElementsByClassName('exit');
        [].forEach.call(exitArr,function(item,i){
            item.addEventListener('click', guest.clear, false);
        });

        // 提交按钮
        var submitArr = document.getElementsByClassName('comment-form-submit');
        [].forEach.call(submitArr,function(item,i){
            item.addEventListener('click', guest.submit, false);
            item.addEventListener('click', comment.post, false);
        });

        // 上传图片按钮
        var imgInputArr = document.getElementsByClassName('comment-image-input');
        [].forEach.call(imgInputArr, function(item,i){
            item.addEventListener('change', comment.upload, false);
        });

    },

    // 评论框焦点
    focus: function(e){
        var wrapper = e.currentTarget.closest('.comment-form-wrapper');
        wrapper.classList.add('editing');
        if (wrapper.classList.contains('focus')){
            wrapper.classList.remove('focus');
        } else{
            wrapper.classList.add('focus');
        }
    },

    //点选表情
    field: function(e){
        var item = e.currentTarget;
        var textarea = item.closest('.comment-form').querySelector('.comment-form-textarea');
        textarea.value += item.dataset.code;
        textarea.focus();
    },

    //emoji表情
    emoji: [
        {
            code:':grin:',
            title:'露齿笑',
            url:'//assets-cdn.github.com/images/icons/emoji/unicode/1f601.png'
        },
        {
            code:':joy:',
            title:'破涕为笑',
            url:'//assets-cdn.github.com/images/icons/emoji/unicode/1f602.png'
        },
        {
            code:':heart_eyes:',
            title:'色',
            url:'//assets-cdn.github.com/images/icons/emoji/unicode/1f60d.png'
        },{
            code:':sweat:',
            title:'汗',
            url:'//assets-cdn.github.com/images/icons/emoji/unicode/1f613.png'
        },{
            code:':unamused:',
            title:'无语',
            url:'//assets-cdn.github.com/images/icons/emoji/unicode/1f612.png'
        },{
            code:':smirk:',
            title:'得意',
            url:'//assets-cdn.github.com/images/icons/emoji/unicode/1f60f.png'
        },{
            code:':relieved:',
            title:'满意',
            url:'//assets-cdn.github.com/images/icons/emoji/unicode/1f60c.png'
        },{
            code:':wx_smirk:',
            title:'奸笑',
            url: site.apipath + '/emoticons/2_02.png'
        },{
            code:':wx_hey:',
            title:'嘿哈',
            url: site.apipath + '/emoticons/2_04.png'
        },{
            code:':wx_facepalm:',
            title:'捂脸',
            url: site.apipath + '/emoticons/2_05.png'
        },{
            code:':wx_smart:',
            title:'机智',
            url: site.apipath + '/emoticons/2_06.png'
        },{
            code:':wx_tea:',
            title:'茶',
            url: site.apipath + '/emoticons/2_07.png'
        },{
            code:':wx_yeah:',
            title:'耶',
            url: site.apipath + '/emoticons/2_11.png'
        },{
            code:':wx_moue:',
            title:'皱眉',
            url: site.apipath + '/emoticons/2_12.png'
        },{
            code:':doge:',
            title:'doge',
            url: site.apipath + '/emoticons/doge.png'
        },{
            code:':tanshou:',
            title:'摊手',
            url: site.apipath + '/emoticons/tanshou.png'
        }
    ],
    
    // 邮箱验证
    verify: function(e){
        var email = e.currentTarget;
        var box  = email.closest('.comment-box');
        var avatar = box.querySelector('.comment-avatar-image');
        var name = box.querySelector('.comment-form-name');
        if (name.value != '' && /^([\w-_]+(?:\.[\w-_]+)*)@((?:[a-z0-9]+(?:-[a-zA-Z0-9]+)*)+\.[a-z]{2,6})$/i.test(email.value)) {
            var xhrGravatar = new XMLHttpRequest();
            xhrGravatar.open('GET', site.apipath + '/getgravatar.php?email=' + email.value + '&name=' + name.value, true);
            xhrGravatar.send();
            xhrGravatar.onreadystatechange = function() {
                if (xhrGravatar.readyState == 4 && xhrGravatar.status == 200) {
                    if (xhrGravatar.responseText == 'false') {
                        alert('您所填写的邮箱地址有误！');
                    } else {
                        avatar.src = xhrGravatar.responseText;
                    }
                }
            }
        }
    },

    // 发表/回复评论
    post: function(e){
        var item = e.currentTarget.closest('.comment-item') || e.currentTarget.closest('.comment-box') ;
        var message = item.querySelector('.comment-form-textarea').value;
        var parentId = !!item.dataset.id ? item.dataset.id : '';
        var time = (new Date()).toJSON();
        var imgArr = item.getElementsByClassName('comment-image-item');
        var media = [];
        var mediaStr = '';
        [].forEach.call(imgArr, function(image,i){
            media[i] = image.dataset.imageUrl;
            mediaStr += ' ' + image.dataset.imageUrl;
        });
        if( !guest.name && !guest.email ){
            return;
        }
        if( media.length == 0 && message == '' ){
            alert('无法发送空消息');
            item.querySelector('.comment-form-textarea').focus();
            return;
        };
        var preMessage = message;
        comment.emoji.forEach(function(item,i){
            preMessage = preMessage.replace(item.code, '<img class="emojione" src="' + item.url + '" />');
        });
        guest.url = !!guest.url ? guest.url : '';
        var post = {
            'url': guest.url,
            'name': guest.name,
            'avatar': guest.avatar,
            'id': 'preview',
            'parent': parentId,
            'createdAt': time,
            'message': '<p>' + preMessage + '</p>',
            'media': media
        };
        comment.load(post, comment.count);
        timeAgo();

        message += mediaStr;
        
        comment.message = message;

        // 清空或移除评论框
        if( parentId ){
            item.querySelector('.comment-item-cancel').click();
        } else {
            item.querySelector('.comment-form-textarea').value = '';
            item.querySelector('.comment-image-list').innerHTML = '';
            item.querySelector('.comment-form-wrapper').classList.remove('expanded','editing');
        }

        // POST 操作
        var postQuery = 'thread=' + comment.thread + 
            '&parent=' + parentId + 
            '&message=' + message + 
            '&name=' + guest.name + 
            '&email=' + guest.email + 
            '&url=' + guest.url +
            '&link=' + page.url +
            '&title=' + page.title;
        var xhrPostComment = new XMLHttpRequest();
        xhrPostComment.open('POST', site.apipath + '/postcomment.php', true);
        xhrPostComment.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhrPostComment.send(postQuery);
        xhrPostComment.onreadystatechange = function() {
            if (xhrPostComment.readyState == 4 && xhrPostComment.status == 200) {
                var res = JSON.parse(xhrPostComment.responseText);
                if (res.code === 0) {
                    var preview = document.querySelector('.comment-item[data-id="preview"]');
                    preview.parentNode.removeChild(preview);
                    comment.count += 1;
                    document.getElementById('comment-count').innerHTML = comment.count + ' 条评论';
                    comment.load(res.response, comment.count);
                    timeAgo();
                    comment.form();
                } else if (res.code === 2) {
                    if (res.response.indexOf('email') > -1) {
                        alert('请输入正确的名字或邮箱！');
                        return;
                    } else if (res.response.indexOf('message') > -1) {
                        alert('评论不能为空！');
                        return;
                    }
                }
            }
        }
    },

    // 读取评论
    load: function(post, i){

        post.url = post.url ? post.url : 'javascript:;';

        var parent = !post.parent ? {
            'name': '',
            'dom': document.querySelector('.comment-list'),
            'insert': 'afterbegin'
        } : {
            'name': !!document.querySelector('.comment-item[data-id="'+post.parent+'"]') ? '<a class="at" href="#'+document.querySelector('.comment-item[data-id="'+post.parent+'"]').getAttribute('id')+'">@' + document.querySelector('.comment-item[data-id="'+post.parent+'"]').dataset.name + '</a>': '',
            'dom': document.querySelector('.comment-item[data-id="'+post.parent+'"] .comment-item-children'),
            'insert': 'beforeend'
        };

        post.message = post.message.replace(/(.{3})/, '$1'+parent.name);

        var imageArr = post.media;
        post.media = '';
        imageArr.forEach(function(item, e){
            post.media += '<a class="comment-item-imagelink" target="_blank" href="' + item + '" ><img class="comment-item-image" src="' + item + '"></a>';
        })
        post.media = '<div class="comment-item-images">' + post.media + '</div>';

        var html = '<li class="comment-item" data-index="'+(i+1)+'" data-id="'+post.id+'" data-name="'+ post.name+'" id="comment-' + post.id + '">';
        html += '<div class="comment-item-avatar"><img src="' + post.avatar + '"></div>';
        html += '<div class="comment-item-main">'
        html += '<div class="comment-item-header"><a class="comment-item-name" rel="nofollow" target="_blank" href="' + post.url + '">' + post.name + '</a><span class="comment-item-bullet"> • </span><span class="comment-item-time timeago" datetime="' + post.createdAt + '"></span><span class="comment-item-bullet"> • </span><a class="comment-item-reply" href="javascript:;">回复</a></div>';
        html += '<div class="comment-item-content">' + post.message + post.media + '</div>';
        html += '<ul class="comment-item-children"></ul>';
        html += '</div>'
        html += '</li>';
        if (!!parent.dom) {
            parent.dom.insertAdjacentHTML(parent.insert, html);
        }
    },

    // 获取评论列表
    getlist: function(){
        var xhrListPosts = new XMLHttpRequest();
        xhrListPosts.open('GET', site.apipath + '/getcomments.php?link=' + encodeURIComponent(page.url), true);
        xhrListPosts.send();
        xhrListPosts.onreadystatechange = function() {
            if (xhrListPosts.readyState == 4 && xhrListPosts.status == 200) {
                var res = JSON.parse(xhrListPosts.responseText);
                if (res.code === 0) {
                    comment.thread = res.thread;
                    comment.count = res.posts;
                    document.getElementById('comment-count').innerHTML = res.posts + ' 条评论';
                    document.querySelector('.comment-tips-link').setAttribute('href', res.link);
                    document.getElementById('comment').classList.remove('loading')
                    if (res.response == null) {
                        return;
                    }
                    res.response.forEach(function(post, i){
                        comment.load(post,i);
                    });
                    timeAgo();
                } else if ( res.code === 2){
                    var createHTML = '<div class="comment-header">';
                    createHTML += '    <span class="comment-header-item">创建 Thread<\/span>';
                    createHTML += '<\/div>';
                    createHTML += '<div class="comment-thread-form">';
                    createHTML += '<p>由于 Disqus 没有本文的相关 Thread，故需先创建 Thread<\/p>';
                    createHTML += '<div class="comment-form-item"><label class="comment-form-label">url:<\/label><input class="comment-form-input" id="thread-url" name="url" value="'+site.origin+page.url+'" \/><\/div>';
                    createHTML += '<div class="comment-form-item"><label class="comment-form-label">title:<\/label><input class="comment-form-input" id="thread-title" name="title" value="'+page.title+'" \/><\/div>';
                    createHTML += '<div class="comment-form-item"><label class="comment-form-label">slug:<\/label><input class="comment-form-input" id="thread-slug" name="slug" placeholder="（别名，选填）" \/><\/div>';
                    createHTML += '<div class="comment-form-item"><label class="comment-form-label">message:<\/label><textarea class="comment-form-textarea" id="thread-message" name="message">'+page.desc+'<\/textarea><\/div>';
                    createHTML += '<button id="thread-submit" class="comment-form-submit">提交<\/button><\/div>'
                    document.getElementById('comment').classList.remove('loading');
                    document.getElementById('comment').innerHTML = createHTML;
                    document.getElementById('thread-submit').addEventListener('click',function(){
                        var threadQuery = 'url=' + document.getElementById('thread-url').value + '&title=' + document.getElementById('thread-title').value + '&slug=' + document.getElementById('thread-slug').value + '&message=' + document.getElementById('thread-message').value;
                        var xhrcreateThread = new XMLHttpRequest();
                        xhrcreateThread.open('POST', site.apipath + '/createthread.php', true);
                        xhrcreateThread.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                        xhrcreateThread.send(threadQuery);
                        xhrcreateThread.onreadystatechange = function() {
                            if (xhrcreateThread.readyState == 4 && xhrcreateThread.status == 200) {
                                var resp = JSON.parse(xhrcreateThread.responseText);
                                if( resp.code === 0 ) {
                                    alert('创建 Thread 成功！');
                                    location.reload();
                                }
                            }
                        }
                    },true);
                }
                if (/^#disqus|^#comment/.test(location.hash)) {
                    window.scrollTo(0, document.querySelector(location.hash).offsetTop);
                }
            }
        }
        xhrListPosts.onload = function(){
            comment.form();
        }

    },

    // 回复框
    show: function(e){

        // 移除已显示回复框
        var box = document.querySelector('.comment-item .comment-box');
        if( box ){
            box.parentNode.removeChild(box);
            var cancel = document.querySelector('.comment-item-cancel')
            cancel.outerHTML = cancel.outerHTML.replace('cancel','reply');
        }

        // 显示回复框
        var $this = e.currentTarget;
        var item = $this.closest('.comment-item');
        var parentId = item.dataset.id;
        var parentName = item.dataset.name;
        var commentBox = comment.box.replace(/emoji-input/g,'emoji-input-'+parentId).replace(/upload-input/g,'upload-input-'+parentId).replace(/加入讨论……|写条留言……/,'@'+parentName).replace(/加入讨论……|写条留言……/,'').replace(/<label class="comment-actions-label exit"(.|\n)*<\/label>\n/,'').replace(/<input id="tips-input"(.|\n)*<\/label>/,'');
        item.querySelector('.comment-item-main .comment-item-children').insertAdjacentHTML('beforebegin', commentBox);
        $this.outerHTML = $this.outerHTML.replace('reply','cancel');
        guest.init();


        // 取消回复
        item.querySelector('.comment-item-cancel').addEventListener('click', function(){
            var box = item.querySelector('.comment-box');
            box.parentNode.removeChild(box);
            this.outerHTML = this.outerHTML.replace('cancel','reply');
            comment.form();
        }, false);

        // 事件绑定
        comment.form();
    },

    // 上传图片
    upload: function(e){
        var file = e.currentTarget;
        var item = file.closest('.comment-box');
        var progress = item.querySelector('.comment-image-progress');
        var loaded = item.querySelector('.comment-image-loaded');
        var wrapper = item.querySelector('.comment-form-wrapper');
        if(file.files.length === 0){
            return;
        }

        //以文件大小识别是否为同张图片
        var size = file.files[0].size;
        if( comment.imagesize.indexOf(size) == -1 ){
            comment.imagesize.push(size);
            progress.style.width = '80px';
        } else {
            console.info('请勿选择已存在的图片！');
            return;
        }

        // 展开图片上传界面
        wrapper.classList.add('expanded');

        // 图片上传请求
        var data = new FormData();
        data.append('file', file.files[0] );
        var filename = file.files[0].name;

        var xhrUpload = new XMLHttpRequest();
        xhrUpload.onreadystatechange = function(){
            if(xhrUpload.readyState == 4 && xhrUpload.status == 200){
                try {
                    var resp = JSON.parse(xhrUpload.responseText);
                    if( resp.code == 0 ){
                        var imageUrl = resp.response[filename].url;
                        var image = new Image();
                        image.src = imageUrl;
                        image.onload = function(){
                            item.querySelector('[data-image-size="'+size+'"] .comment-image-object').setAttribute('src', image.src);
                            item.querySelector('[data-image-size="'+size+'"]').dataset.imageUrl = image.src;
                            item.querySelector('[data-image-size="'+size+'"]').classList.remove('loading');
                            item.querySelector('[data-image-size="'+size+'"]').addEventListener('click', comment.remove, false);
                        }
                    }
                } catch (e){
                    var resp = {
                        status: 'error',
                        data: 'Unknown error occurred: [' + xhrUpload.responseText + ']'
                    };
                }
            }
        };

        // 上传进度条
        xhrUpload.upload.addEventListener('progress', function(e){
            loaded.style.width = Math.ceil((e.loaded/e.total) * 100)+ '%';
        }, false);

        // 上传完成
        xhrUpload.upload.addEventListener("load", function(e){
            loaded.style.width = 0;
            progress.style.width = 0;
            var imageItem = '<li class="comment-image-item loading" data-image-size="' + size + '"><img class="comment-image-object" src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+ICA8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiAgICAgd2lkdGg9IjI0cHgiIGhlaWdodD0iMzBweCIgdmlld0JveD0iMCAwIDI0IDMwIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MCA1MDsiIHhtbDpzcGFjZT0icHJlc2VydmUiPiAgICA8cmVjdCB4PSIwIiB5PSIxMCIgd2lkdGg9IjQiIGhlaWdodD0iMTAiIGZpbGw9InJnYmEoMTI3LDE0NSwxNTgsMSkiIG9wYWNpdHk9IjAuMiI+ICAgICAgPGFuaW1hdGUgYXR0cmlidXRlTmFtZT0ib3BhY2l0eSIgYXR0cmlidXRlVHlwZT0iWE1MIiB2YWx1ZXM9IjAuMjsgMTsgLjIiIGJlZ2luPSIwcyIgZHVyPSIwLjZzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIgLz4gICAgICA8YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJoZWlnaHQiIGF0dHJpYnV0ZVR5cGU9IlhNTCIgdmFsdWVzPSIxMDsgMjA7IDEwIiBiZWdpbj0iMHMiIGR1cj0iMC42cyIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiIC8+ICAgICAgPGFuaW1hdGUgYXR0cmlidXRlTmFtZT0ieSIgYXR0cmlidXRlVHlwZT0iWE1MIiB2YWx1ZXM9IjEwOyA1OyAxMCIgYmVnaW49IjBzIiBkdXI9IjAuNnMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIiAvPiAgICA8L3JlY3Q+ICAgIDxyZWN0IHg9IjgiIHk9IjEwIiB3aWR0aD0iNCIgaGVpZ2h0PSIxMCIgZmlsbD0icmdiYSgxMjcsMTQ1LDE1OCwxKSIgIG9wYWNpdHk9IjAuMiI+ICAgICAgPGFuaW1hdGUgYXR0cmlidXRlTmFtZT0ib3BhY2l0eSIgYXR0cmlidXRlVHlwZT0iWE1MIiB2YWx1ZXM9IjAuMjsgMTsgLjIiIGJlZ2luPSIwLjE1cyIgZHVyPSIwLjZzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIgLz4gICAgICA8YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJoZWlnaHQiIGF0dHJpYnV0ZVR5cGU9IlhNTCIgdmFsdWVzPSIxMDsgMjA7IDEwIiBiZWdpbj0iMC4xNXMiIGR1cj0iMC42cyIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiIC8+ICAgICAgPGFuaW1hdGUgYXR0cmlidXRlTmFtZT0ieSIgYXR0cmlidXRlVHlwZT0iWE1MIiB2YWx1ZXM9IjEwOyA1OyAxMCIgYmVnaW49IjAuMTVzIiBkdXI9IjAuNnMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIiAvPiAgICA8L3JlY3Q+ICAgIDxyZWN0IHg9IjE2IiB5PSIxMCIgd2lkdGg9IjQiIGhlaWdodD0iMTAiIGZpbGw9InJnYmEoMTI3LDE0NSwxNTgsMSkiICBvcGFjaXR5PSIwLjIiPiAgICAgIDxhbmltYXRlIGF0dHJpYnV0ZU5hbWU9Im9wYWNpdHkiIGF0dHJpYnV0ZVR5cGU9IlhNTCIgdmFsdWVzPSIwLjI7IDE7IC4yIiBiZWdpbj0iMC4zcyIgZHVyPSIwLjZzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIgLz4gICAgICA8YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJoZWlnaHQiIGF0dHJpYnV0ZVR5cGU9IlhNTCIgdmFsdWVzPSIxMDsgMjA7IDEwIiBiZWdpbj0iMC4zcyIgZHVyPSIwLjZzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIgLz4gICAgICA8YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJ5IiBhdHRyaWJ1dGVUeXBlPSJYTUwiIHZhbHVlcz0iMTA7IDU7IDEwIiBiZWdpbj0iMC4zcyIgZHVyPSIwLjZzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIgLz4gICAgPC9yZWN0PiAgPC9zdmc+" /></li>';
            item.querySelector('.comment-image-list').insertAdjacentHTML('beforeend', imageItem);
        }, false);

        xhrUpload.open('POST', site.apipath + '/upload.php', true);

        xhrUpload.send(data);
    },

    //移除图片
    remove: function(e){
        var item = e.currentTarget.closest('.comment-image-item');
        var wrapper = e.currentTarget.closest('.comment-form-wrapper');
        item.parentNode.removeChild(item);
        comment.imagesize = [];
        var imageArr = document.getElementsByClassName('comment-image-item');
        [].forEach.call(imageArr, function(item, i){
            comment.imagesize[i] = item.dataset.imageSize;
        });
        if(comment.imagesize.length == 0){
            wrapper.classList.remove('expanded');
        }
    }

}

if (!!document.getElementById('comment')){
    var initHTML = '    <div class="comment-header">';
    initHTML += '        <span class="comment-header-item" id="comment-count">评论<\/span>';
    initHTML += '    <\/div>';
    initHTML += '    <div class="comment-box">';
    initHTML += '        <div class="comment-avatar avatar">';
    initHTML += '            <img class="comment-avatar-image" src="https:\/\/a.disquscdn.com\/images\/noavatar92.png" \/>';
    initHTML += '        <\/div>';
    initHTML += '        <div class="comment-form">';
    initHTML += '            <div class="comment-form-wrapper">';
    initHTML += '                <textarea class="comment-form-textarea" placeholder="加入讨论……"><\/textarea>';
    initHTML += '                <div class="comment-image">';
    initHTML += '                    <ul class="comment-image-list">';
    initHTML += '                    <\/ul>';
    initHTML += '                    <div class="comment-image-progress">';
    initHTML += '                        <div class="comment-image-loaded">';
    initHTML += '                        <\/div>';
    initHTML += '                    <\/div>';
    initHTML += '                <\/div>';
    initHTML += '                <div class="comment-actions">';
    initHTML += '                    <div class="comment-actions-group">';
    initHTML += '                        <input id="emoji-input" class="comment-actions-input" type="checkbox"\/>';
    initHTML += '                        <label class="comment-actions-label emojione" for="emoji-input" title="选择表情"><svg class="icon" fill="#c2c6cc" viewBox="0 0 1024 1024" version="1.1" xmlns="http:\/\/www.w3.org\/2000\/svg" xmlns:xlink="http:\/\/www.w3.org\/1999\/xlink" width="200" height="200"><defs><style type="text\/css"><\/style><\/defs><path d="M512 1024c-282.713043 0-512-229.286957-512-512s229.286957-512 512-512c282.713043 0 512 229.286957 512 512S792.486957 1024 512 1024zM512 44.521739c-258.226087 0-467.478261 209.252174-467.478261 467.478261 0 258.226087 209.252174 467.478261 467.478261 467.478261s467.478261-209.252174 467.478261-467.478261C979.478261 253.773913 768 44.521739 512 44.521739z"><\/path><path d="M801.391304 554.295652c0 160.278261-129.113043 289.391304-289.391304 289.391304s-289.391304-129.113043-289.391304-289.391304L801.391304 554.295652z"><\/path><path d="M674.504348 349.495652m-57.878261 0a2.6 2.6 0 1 0 115.756522 0 2.6 2.6 0 1 0-115.756522 0Z"><\/path><path d="M347.269565 349.495652m-57.878261 0a2.6 2.6 0 1 0 115.756522 0 2.6 2.6 0 1 0-115.756522 0Z"><\/path><\/svg>';
    initHTML += '<ul class="emojione-list"><\/ul><\/label>';
    initHTML += '                        <input id="upload-input" class="comment-actions-input comment-image-input" type="file" accept="image\/*" name="file"\/>';
    initHTML += '                        <label class="comment-actions-label" for="upload-input" title="上传图片"><svg class="icon" fill="#c2c6cc" viewBox="0 0 1024 1024" version="1.1" xmlns="http:\/\/www.w3.org\/2000\/svg" xmlns:xlink="http:\/\/www.w3.org\/1999\/xlink" width="200" height="200"><defs><style type="text\/css"><\/style><\/defs><path d="M15.515152 15.515152 15.515152 15.515152 15.515152 15.515152Z"><\/path><path d="M15.515152 139.636364l0 806.787879 992.969697 0 0-806.787879-992.969697 0zM946.424242 884.363636l-868.848485 0 0-682.666667 868.848485 0 0 682.666667zM698.181818 356.848485c0-51.417212 41.673697-93.090909 93.090909-93.090909s93.090909 41.673697 93.090909 93.090909c0 51.417212-41.673697 93.090909-93.090909 93.090909s-93.090909-41.673697-93.090909-93.090909zM884.363636 822.30303l-744.727273 0 186.181818-496.484848 248.242424 310.30303 124.121212-93.090909z"><\/path><\/svg>';
    initHTML += '<\/label>';
    initHTML += '                    <\/div>';
    initHTML += '                    <div class="comment-actions-form">';
    initHTML += '                        <input id="tips-input" class="comment-actions-input" type="checkbox"\/>';
    initHTML += '                        <label class="comment-actions-label tips" title="提示" for="tips-input"><svg class="icon" style="" viewBox="0 0 1024 1024" version="1.1" xmlns="http:\/\/www.w3.org\/2000\/svg" xmlns:xlink="http:\/\/www.w3.org\/1999\/xlink" width="200" height="200"><defs><style type="text\/css"><\/style><\/defs><path d="M511.999488 300.468283c-26.749224 0-48.479131 21.73093-48.479131 48.479131 0 26.796296 21.729907 48.479131 48.479131 48.479131 26.797319 0 48.479131-21.682835 48.479131-48.479131C560.478619 322.199213 538.796808 300.468283 511.999488 300.468283zM511.999488 106.551758c-214.177987 0-387.833049 173.654039-387.833049 387.833049 0 214.228129 173.655062 387.833049 387.833049 387.833049 214.181057 0 387.833049-173.60492 387.833049-387.833049C899.832538 280.205796 726.180546 106.551758 511.999488 106.551758zM511.999488 833.738725c-187.429787 0-339.353918-151.923108-339.353918-339.353918S324.569702 155.030889 511.999488 155.030889c187.43081 0 339.353918 151.923108 339.353918 339.353918S699.430298 833.738725 511.999488 833.738725zM536.239566 445.905676l-48.479131 0c-13.397125 0-24.240077 10.841929-24.240077 24.240077l0 193.916525c0 13.398148 10.842952 24.240077 24.240077 24.240077l48.479131 0c13.399171 0 24.240077-10.841929 24.240077-24.240077l0-193.916525C560.478619 456.747605 549.638737 445.905676 536.239566 445.905676z"><\/path><\/svg>';
    initHTML += '';
    initHTML += '                            <div class="comment-tips">';
    initHTML += '                                本评论框利用 Disqus API 实现访客评论，登录请自带梯子 <a target="_blank" title="科学使用 Disqus" class="comment-tips-link">前往 Disqus<\/a>';
    initHTML += '                            <\/div>';
    initHTML += '                        <\/label>';
    initHTML += '                        <label class="comment-actions-label exit" title="重置访客信息"><svg class="icon" fill="#c2c6cc" viewBox="0 0 1024 1024" version="1.1" xmlns="http:\/\/www.w3.org\/2000\/svg" xmlns:xlink="http:\/\/www.w3.org\/1999\/xlink" width="48" height="48"><defs><style type="text\/css"><\/style><\/defs><path d="M348.870666 210.685443l378.570081 0c32.8205 0 58.683541 26.561959 58.683541 58.683541 0 162.043606 0 324.804551 0 486.848157 0 32.81129-26.561959 58.674331-58.683541 58.674331L348.870666 814.891472c-10.477632 0-18.850323-8.363482-18.850323-18.841114l0-37.728276c0-10.477632 8.372691-18.841114 18.850323-18.841114l343.645664 0c10.477632 0 18.850323-8.372691 18.850323-18.850323L711.366653 304.983109c0-10.477632-8.372691-18.841114-18.850323-18.841114L348.870666 286.141996c-10.477632 0-18.850323-8.363482-18.850323-18.841114l0-37.728276C329.98248 219.095997 338.393034 210.685443 348.870666 210.685443z"><\/path><path d="M128.152728 526.436804l112.450095 112.450095c6.985088 6.985088 19.567661 6.985088 26.552749 0l26.561959-26.561959c6.985088-6.985088 6.985088-19.567661 0-26.552749l-34.925441-34.925441L494.168889 550.84675c10.477632 0 18.850323-8.372691 18.850323-18.850323l0-37.719066c0-10.477632-8.372691-18.850323-18.850323-18.850323L258.754229 475.427036l34.925441-34.925441c6.985088-6.985088 6.985088-19.567661 0-26.552749l-26.561959-26.524097c-6.985088-6.985088-19.567661-6.985088-26.552749 0L128.152728 499.875868C120.431883 506.859933 120.431883 519.451716 128.152728 526.436804z"><\/path><\/svg>';
    initHTML += '<\/label>';
    initHTML += '                        <button class="comment-form-submit"><svg class="icon" style="" viewBox="0 0 1024 1024" version="1.1" xmlns="http:\/\/www.w3.org\/2000\/svg" xmlns:xlink="http:\/\/www.w3.org\/1999\/xlink" width="200" height="200"><defs><style type="text\/css"><\/style><\/defs><path d="M565.747623 792.837176l260.819261 112.921839 126.910435-845.424882L66.087673 581.973678l232.843092 109.933785 562.612725-511.653099-451.697589 563.616588-5.996574 239.832274L565.747623 792.837176z" fill="#ffffff"><\/path><\/svg>';
    initHTML += '<\/button>';
    initHTML += '                    <\/div>';
    initHTML += '                <\/div>';
    initHTML += '            <\/div>';
    initHTML += '            <div class="comment-login">';
    initHTML += '                <input class="comment-form-input comment-form-name" type="text" placeholder="名字（必填）" autocomplete="name" required>';
    initHTML += '                <input class="comment-form-input comment-form-email" type="email" placeholder="邮箱（必填）" autocomplete="email" required>';
    initHTML += '                <input class="comment-form-input comment-form-url" type="url" placeholder="网址（可选）" autocomplete="url">';
    initHTML += '            <\/div>';
    initHTML += '        <\/div>';
    initHTML += '    <\/div>';
    initHTML += '    <ul id="comments" class="comment-list">';
    initHTML += '    <\/ul>';
    document.getElementById('comment').classList.add('comment');
    document.getElementById('comment').classList.add('loading');
    document.getElementById('comment').innerHTML = initHTML;
    var guest = new Guest();
    var comment =  new Comment();
}
