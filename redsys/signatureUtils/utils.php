<?php

class Utils {
	/******  Random String  ******/
	static function randomString($len = 12) {
		$chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		$str = '';
		for ($i = 0; $i < $len; $i++) {
			$str .= $chars[random_int(0, strlen($chars) - 1)];
		}
		return $str;
	}

	/******  Base64 Functions  ******/
	static function base64_url_encode($input) {
		return strtr(base64_encode($input), '+/', '-_');
	}

	static function base64_url_decode($input) {
		return base64_decode(strtr($input, '-_', '+/'));
	}

	static function base64_url_encode_safe($input) {
		return str_replace("=", "", strtr(base64_encode($input), '+/', '-_'));
	}

	static function base64_url_decode_safe($input) {
		$str = str_pad($input, strlen($input) + (4 - strlen($input) % 4) % 4, '=', STR_PAD_RIGHT);
		return base64_decode(strtr($str, '-_', '+/'));
	}

    /******  Current URL  ******/
	static function getCurrentUrl() {
        $url = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http");
        $url .= "://" . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
        return $url;
    }
}

?>