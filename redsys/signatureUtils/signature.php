<?php

include_once "utils.php";

/**
* NOTA SOBRE LA LICENCIA DE USO DEL SOFTWARE
* 
* El uso de este software está sujeto a las Condiciones de uso de software que
* se incluyen en el paquete en el documento "Aviso Legal.pdf". También puede
* obtener una copia en la siguiente url:
* http://www.redsys.es/wps/portal/redsys/publica/areadeserviciosweb/descargaDeDocumentacionYEjecutables
* 
* Redsys es titular de todos los derechos de propiedad intelectual e industrial
* del software.
* 
* Quedan expresamente prohibidas la reproducción, la distribución y la
* comunicación pública, incluida su modalidad de puesta a disposición con fines
* distintos a los descritos en las Condiciones de uso.
* 
* Redsys se reserva la posibilidad de ejercer las acciones legales que le
* correspondan para hacer valer sus derechos frente a cualquier infracción de
* los derechos de propiedad intelectual y/o industrial.
* 
* Redsys Servicios de Procesamiento, S.L., CIF B85955367
*
* VERSIÓN SIMPLIFICADA DE LA LIBRERÍA
*
*/

class Signature {
	/******  AES Function  ******/
	static function encrypt_AES($data, $key) {
		$fixedKey = str_pad(substr($key, 0, 16), 16, "0");
		$firma = base64_encode(openssl_encrypt($data, "aes-128-cbc", $fixedKey, OPENSSL_RAW_DATA, "\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0"));

		return $firma;
	}

	static function mac512($data, $key) {
		$sha = hash_hmac('sha512', $data, $key, true);
		return $sha;
	}

	static function createMerchantSignature($key, $data, $diversifyingFactor) {
		// Se diversifica la clave con el Número de Pedido
		$key = self::encrypt_AES($diversifyingFactor, $key);

		// MAC512 del parámetro Ds_Parameters que envía Redsys
		$res = self::mac512($data, $key);

		// Se codifican los datos Base64
		return Utils::base64_url_encode_safe($res);
	}

	static function checkSignatures($sig1, $sig2) {
		if (strcasecmp($sig1, $sig2) !== 0) {
			throw new Exception("Integrity failure. The received signature does not match the calculated one.");
		}
	}
}

?>