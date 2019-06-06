<?php
/**
 * 缓存类
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2019-06-06 10:06:24
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */

class Cache {

    protected static $dir;
    protected static $filename;
    protected static $file;
    protected static $data;

    // 初始化
    public function __construct(){

        self::$dir = defined('USE_TEMP') && USE_TEMP == 1 ? sys_get_temp_dir() . '/disqus-php-api/' : dirname(__FILE__) . '/cache/';
        self::$filename = 'disqus_' . DISQUS_SHORTNAME . '.php';
        self::$file = self::$dir . self::$filename;
        if(!file_exists(self::$file)){
            self::create();
        }
        require_once(self::$file);
        self::$data = json_decode($forum_data);

    }

    // 创建文件夹&文件
    protected static function create(){

        if (!is_dir(self::$dir)) {
            if (!mkdir(self::$dir, 0755, true)) {
                throw new Exception('没有权限');
            }
        }
        self::$data = (object) array("cookie"=>null, "forum"=>null, "authors"=>null);
        self::save();

    }

    // 保存文件
    protected static function save()
    {

        $content = '<?php'.PHP_EOL.'$forum_data = '.var_export(json_encode(self::$data), true).';';
        file_put_contents(self::$file, $content);

    }

    // 获取数据
    public static function get($key=null){

        if($key == null){
            return self::$data;
        } else {
            return self::$data -> $key;
        }

    }

    // 更新数据
    public static function update($data, $key=null){

        if($key == null){
            self::$data = $data;
        } else {
            self::$data -> $key = $data;
        }
        self::save();

    }

}
