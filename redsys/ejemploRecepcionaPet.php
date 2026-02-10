<?php

include 'signatureUtils/signature.php';

$jsonParams = json_decode(file_get_contents('php://input'), true);
$receivedParams = array_merge($_GET, $_POST, is_array($jsonParams) ? $jsonParams : []);

if(empty($receivedParams)) {
	die("No se recibió respuesta");
}
		
$kc = 'sq7HjrUOBfKmC576ILgskD5srU870gJ7'; //Clave recuperada de CANALES

$version = $receivedParams["Ds_SignatureVersion"];
$datos = $receivedParams["Ds_MerchantParameters"];
$signatureRecibida = $receivedParams["Ds_Signature"];
$decodec = Utils::base64_url_decode_safe($datos);	
$data = json_decode($decodec, true);

$order = empty($data['Ds_Order']) ? $data['DS_ORDER'] : $data['Ds_Order'];
$firma = Signature::createMerchantSignature($kc, $datos, $order);	

echo PHP_VERSION."<br/>";
echo $firma."<br/>";
echo $signatureRecibida."<br/>";
try {
	Signature::checkSignatures($signatureRecibida, $firma);
	echo("FIRMA OK");
} catch (Exception $e) {
	echo("FIRMA KO");
}

?>