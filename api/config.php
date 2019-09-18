<?php
/**
 * 配置文件
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2019-09-18 16:57:31
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */

/*
 * Disqus 设置
 *
 * DISQUS_PUBKEY    Disqus 公钥，无需修改
 * PUBLIC_KEY       Disqus APP 公钥，在 https://disqus.com/api/applications/ 申请注册后获得
 * SECRET_KEY       Disqus APP 私钥，在 https://disqus.com/api/applications/ 申请注册后获得
 * DISQUS_USERNAME  Disqus 用户名
 * DISQUS_EMAIL     Disqus 注册邮箱，重要
 * DISQUS_PASSWORD  Disqus 密码，重要
 * DISQUS_WEBSITE   网站域名，如：'http://blog.fooleap.org'
 * DISQUS_SHORTNAME 网站在 Disqus 对应的 shortname
 * DISQUS_APPROVED  评论是否免审核，true 即跳过评论预审核，false 则按后台设置
 * DISQUS_BLACKLIST 评论发表应用官方的 IP 黑名单，true 即启用，false 则跳过
 * MOD_IDENT        识别管理员：1. username 等于 DISQUS_USERNAME，即和原生评论框一样
 *                              2. 匿名评论 name 等于 DISQUS_USERNAME 且 email 等于 DISQUS_EMAIL
 *                              3. 匿名评论 name 等于 DISQUS_USERNAME 或 email 等于 DISQUS_EMAIL
 * USE_TEMP         缓存目录，false 或无定义，则是当前目录下的 cache 目录，否则采用系统临时文件目录
 *
 * 填写正确的账号信息之后，将以网站管理员的身份去获取评论数据。
 *
 */

define('DISQUS_PUBKEY', 'E8Uh5l5fHZ6gD8U3KycjAIAk46f68Zw7C6eW8WSjZvCLXebZ7p0r1yrYDrLilk2F');
define('PUBLIC_KEY', '');
define('SECRET_KEY', '');
define('DISQUS_USERNAME', '');
define('DISQUS_EMAIL', '');
define('DISQUS_PASSWORD', '');
define('DISQUS_WEBSITE', '');
define('DISQUS_SHORTNAME', '');
define('DISQUS_APPROVED', true);
define('DISQUS_BLACKLIST', false);
define('MOD_IDENT', 1);
define('USE_TEMP', false);

/*
 * 网络设置
 *
 * PROXY_MODE     代理模式，可用于墙内服务器，有代理服务器的情况下。优先级高于 IP_MODE，设置为 true，IP_MODE 将忽略
 * PROXY          代理地址，CURLOPT_PROXY
 * PROXYTYPE      代理类型，CURLOPT_PROXYTYPE
 * PROXYUSERPWD   代理账号，CURLOPT_PROXYUSERPWD
 *
 * IP_MODE        IP 模式，在墙内可尝试设置为 true，将指定 IP，不保证能够访问 Disqus API
 * DISQUS_IP      disqus.com IP 地址，可选：151.101.0.134, 151.101.64.134, 151.101.128.134, 151.101.192.134
 * DISQUS_MEDIAIP uploads.services.disqus.com IP 地址，可选：151.101.24.64, 151.101.40.64, 151.101.52.64
 * DISQUS_LOGINIP import.disqus.com IP 地址，可选：151.101.40.134
 *
 */

define('PROXY_MODE', false);
define('PROXY', '127.0.0.1:1080');
define('PROXYTYPE', CURLPROXY_SOCKS5_HOSTNAME);
define('PROXYUSERPWD', '');

define('IP_MODE', false);
define('DISQUS_IP', '151.101.0.134'); 
define('DISQUS_MEDIAIP', '151.101.24.64');
define('DISQUS_LOGINIP', '151.101.40.134');

/*
 * 图片设置
 *
 * GRAVATAR_CDN     Gravatar 头像 CDN
 * GRAVATAR_DEFAULT Gravatar 默认头像，即 d 参数，可参考 https://www.gravatar.com/site/implement/images/ 
 * EMOJI_PATH       Emoji 表情 PNG 资源路径
 *
 */
 
define('GRAVATAR_CDN', '//cn.gravatar.com/avatar/');
define('GRAVATAR_DEFAULT', 'retro');
define('EMOJI_PATH', 'https://github.githubassets.com/images/icons/emoji/unicode/');

/*
 * PHP Mailer 设置
 *
 * SMTP_SECURE    安全协议
 * SMTP_HOST      邮箱服务器
 * SMTP_PORT      端口号
 * SMTP_USERNAME  SMTP 登录的账号，即邮箱号
 * SMTP_PASSWORD  SMTP 登录的账号，即邮箱密码
 * SMTP_FROM      发件人的邮箱地址，可以留空
 * SMTP_FROMNAME  发件人的名称，可以留空
 *
 */

define('SMTP_SECURE', 'ssl');
define('SMTP_HOST', '');
define('SMTP_PORT', 465);
define('SMTP_USERNAME', '');
define('SMTP_PASSWORD', '');
define('SMTP_FROM', '');
define('SMTP_FROMNAME', '');
