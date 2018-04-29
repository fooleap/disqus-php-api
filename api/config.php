<?php
/**
 * 配置文件
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2018-04-29 12:48:07
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
namespace Emojione;

/*
 * Disqus 设置
 *
 * DISQUS_PUBKEY    Disqus 公钥，无需修改
 * PUBLIC_KEY       Disqus APP 公钥，在 https://disqus.com/api/applications/ 申请注册后获得
 * SECRET_KEY       Disqus APP 私钥，在 https://disqus.com/api/applications/ 申请注册后获得
 * ACCESS_TOKEN     Disqus 管理员 access_token，在 https://disqus.com/api/applications/ 申请注册后获得
 * DISQUS_USERNAME  Disqus 用户名
 * DISQUS_EMAIL     Disqus 注册邮箱，重要
 * DISQUS_PASSWORD  Disqus 密码，重要
 * DISQUS_WEBSITE   网站域名，如：'http://blog.fooleap.org'
 * DISQUS_SHORTNAME 网站在 Disqus 对应的 shortname
 * DISQUS_APPROVED  评论是否免审核，true 即跳过评论预审核，false 则按后台设置
 *
 * 填写正确的账号信息之后，将以网站管理员的身份去获取评论数据。
 *
 */

define('DISQUS_PUBKEY', 'E8Uh5l5fHZ6gD8U3KycjAIAk46f68Zw7C6eW8WSjZvCLXebZ7p0r1yrYDrLilk2F');
define('PUBLIC_KEY', '');
define('SECRET_KEY', '');
define('ACCESS_TOKEN', '');
define('DISQUS_USERNAME', '');
define('DISQUS_EMAIL', '');
define('DISQUS_PASSWORD', '');
define('DISQUS_WEBSITE', '');
define('DISQUS_SHORTNAME', '');
define('DISQUS_APPROVED', true);

/*
 * 图片设置
 *
 * GRAVATAR_CDN     Gravatar 头像 CDN
 * EMOJI_PATH       Emoji 表情 PNG 资源路径
 *
 */
 
define('GRAVATAR_CDN', '//cn.gravatar.com/avatar/');
define('EMOJI_PATH', 'https://assets-cdn.github.com/images/icons/emoji/unicode/');

/*
 * PHP Mailer 设置
 *
 * SITE_NAME      网站名
 * SMTP_SECURE    安全协议
 * SMTP_HOST      邮箱服务器
 * SMTP_PORT      端口号
 * SMTP_USERNAME  SMTP 登录的账号，即邮箱号
 * SMTP_PASSWORD  SMTP 登录的账号，即邮箱密码
 *
 */

define('SITE_NAME', '');
define('SMTP_SECURE', 'ssl');
define('SMTP_HOST', '');
define('SMTP_PORT', 465);
define('SMTP_USERNAME', '');
define('SMTP_PASSWORD', '');
