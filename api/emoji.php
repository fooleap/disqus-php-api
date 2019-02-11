<?php
/**
 * Emoji 表情的相关操作
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2018-05-31 15:40:45
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */

require_once('emojione/autoload.php');

use Emojione\Emojione;
use Emojione\Client;
use Emojione\Ruleset;

class Emoji {

    public function __construct() {
        $client = new Client(new Ruleset());
        $client->imageType = 'png';
        $client->imagePathPNG = EMOJI_PATH;
        $client->ignoredRegexp = '<code[^>]*>.*?<\/code>|<object[^>]*>.*?<\/object>|<span[^>]*>.*?<\/span>|<(?:object|embed|svg|img|div|span|p|a)[^>]*>';
        $client->unicodeRegexp = '(?:\x{1F3F3}\x{FE0F}?\x{200D}?\x{1F308}|\x{1F441}\x{FE0F}?\x{200D}?\x{1F5E8}\x{FE0F}?)|[\x{0023}-\x{0039}]\x{FE0F}?\x{20e3}|[\x{1F1E0}-\x{1F1FF}]{2}|(?:[\x{1F468}\x{1F469}])\x{FE0F}?[\x{1F3FA}-\x{1F3FF}]?\x{200D}?(?:[\x{2695}\x{2696}\x{2708}\x{1F4BB}\x{1F4BC}\x{1F527}\x{1F52C}\x{1F680}\x{1F692}\x{1F33E}-\x{1F3ED}])|(?:[\x{2764}\x{1F466}-\x{1F469}\x{1F48B}][\x{200D}\x{FE0F}]+){1,3}[\x{2764}\x{1F466}-\x{1F469}\x{1F48B}]|(?:[\x{2764}\x{1F466}-\x{1F469}\x{1F48B}]\x{FE0F}?){2,4}|(?:[\x{1f46e}\x{1F468}\x{1F469}\x{1f575}\x{1f471}-\x{1f487}\x{1F645}-\x{1F64E}\x{1F926}\x{1F937}]|[\x{1F460}-\x{1F482}\x{1F3C3}-\x{1F3CC}\x{26F9}\x{1F486}\x{1F487}\x{1F6A3}-\x{1F6B6}\x{1F938}-\x{1F93E}]|\x{1F46F})\x{FE0F}?[\x{1F3FA}-\x{1F3FF}]?\x{200D}?[\x{2640}\x{2642}]?\x{FE0F}?|(?:[\x{26F9}\x{261D}\x{270A}-\x{270D}\x{1F385}-\x{1F3CC}\x{1F442}-\x{1F4AA}\x{1F574}-\x{1F596}\x{1F645}-\x{1F64F}\x{1F6A3}-\x{1F6CC}\x{1F918}-\x{1F93E}]\x{FE0F}?[\x{1F3FA}-\x{1F3FF}])|(?:[\x{2194}-\x{2199}\x{21a9}-\x{21aa}]\x{FE0F}?|[\x{3030}\x{303d}]\x{FE0F}?|(?:[\x{1F170}-\x{1F171}]|[\x{1F17E}-\x{1F17F}]|\x{1F18E}|[\x{1F191}-\x{1F19A}]|[\x{1F1E6}-\x{1F1FF}])\x{FE0F}?|\x{24c2}\x{FE0F}?|[\x{3297}\x{3299}]\x{FE0F}?|(?:[\x{1F201}-\x{1F202}]|\x{1F21A}|\x{1F22F}|[\x{1F232}-\x{1F23A}]|[\x{1F250}-\x{1F251}])\x{FE0F}?|[\x{203c}\x{2049}]\x{FE0F}?|[\x{25aa}-\x{25ab}\x{25b6}\x{25c0}\x{25fb}-\x{25fe}]\x{FE0F}?|[\x{00a9}\x{00ae}]\x{FE0F}?|[\x{2122}\x{2139}]\x{FE0F}?|\x{1F004}\x{FE0F}?|[\x{2b05}-\x{2b07}\x{2b1b}-\x{2b1c}\x{2b50}\x{2b55}]\x{FE0F}?|[\x{231a}-\x{231b}\x{2328}\x{23cf}\x{23e9}-\x{23f3}\x{23f8}-\x{23fa}]\x{FE0F}?|\x{1F0CF}|[\x{2934}\x{2935}]\x{FE0F}?)|[\x{2700}-\x{27bf}]\x{FE0F}?|[\x{1F000}-\x{1F6FF}\x{1F900}-\x{1F9FF}]\x{FE0F}?|[\x{2600}-\x{26ff}]\x{FE0F}?|[\x{0030}-\x{0039}]\x{FE0F}';
        Emojione::setClient($client);
    }

    public static function toImage($str) {
        $str = Emojione::shortnametoImage(Emojione::toShort($str));
        return str_replace('<img class="emojione"','<img class="emojione" width="24" height="24"', $str);
    }

    public static function toUnicode($str) {
        return html_entity_decode(Emojione::shortnameToUnicode($str));
    }

    public static function eac() {
        $ruleset = new Ruleset;
        $eac = $ruleset -> getShortcodeReplace();
        $emojis = array();
        foreach ( $eac as $key => $emo ){
            $emojis[str_replace(':','',$key)] = $emo[2];
            //$emojis[$key] = $emo;
        }
        return $emojis;
    }
}
