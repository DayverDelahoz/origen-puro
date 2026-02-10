<?php
/**
 * Iniciar Pago Redsys - Origen Puro Coffee
 * Genera el formulario de pago para Redsys TPV
 */

// Headers para CORS si es necesario
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Incluir la librería de Redsys
require_once 'signatureUtils/signature.php';

// Configuración de Redsys (entorno de pruebas)
$config = [
    'version' => 'HMAC_SHA512_V2',
    'kc' => 'sq7HjrUOBfKmC576ILgskD5srU870gJ7', // Clave de pruebas
    'fuc' => '999008881', // Código de comercio de pruebas
    'terminal' => '1',
    'moneda' => '978', // EUR
    'transactionType' => '0', // Autorización
    'urlSis' => 'https://sis-t.redsys.es:25443/sis/realizarPago' // URL de pruebas
];

try {
    // Verificar que sea POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Método no permitido');
    }

    // Obtener datos del POST
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('No se recibieron datos');
    }

    // Validar datos requeridos
    $required = ['amount', 'customerName', 'customerEmail', 'productos'];
    foreach ($required as $field) {
        if (!isset($input[$field])) {
            throw new Exception("Campo requerido: $field");
        }
    }

    // Convertir amount a céntimos (Redsys requiere céntimos)
    $amountCentimos = intval(round(floatval($input['amount']) * 100));
    
    // Generar número de pedido único
    $orderNumber = date('ymdHis') . rand(100, 999);
    
    // URL base del proyecto
    $baseUrl = 'http://' . $_SERVER['HTTP_HOST'] . dirname(dirname($_SERVER['REQUEST_URI']));
    
    // URLs de retorno
    $urlOK = $baseUrl . '/redsys/procesar_respuesta.php';
    $urlKO = $baseUrl . '/redsys/procesar_respuesta.php';
    $urlNotification = $baseUrl . '/redsys/procesar_respuesta.php';

    // Preparar datos del merchant
    $merchantData = [
        "DS_MERCHANT_AMOUNT" => strval($amountCentimos),
        "DS_MERCHANT_ORDER" => $orderNumber,
        "DS_MERCHANT_MERCHANTCODE" => $config['fuc'],
        "DS_MERCHANT_CURRENCY" => $config['moneda'],
        "DS_MERCHANT_TRANSACTIONTYPE" => $config['transactionType'],
        "DS_MERCHANT_TERMINAL" => $config['terminal'],
        "DS_MERCHANT_MERCHANTURL" => $urlNotification,
        "DS_MERCHANT_URLOK" => $urlOK,
        "DS_MERCHANT_URLKO" => $urlKO
    ];

    // Codificar parámetros
    $merchantParameters = Utils::base64_url_encode_safe(json_encode($merchantData));
    
    // Generar firma
    $signature = Signature::createMerchantSignature($config['kc'], $merchantParameters, $orderNumber);

    // Preparar respuesta
    $response = [
        'success' => true,
        'orderNumber' => $orderNumber,
        'formData' => [
            'Ds_SignatureVersion' => $config['version'],
            'Ds_MerchantParameters' => $merchantParameters,
            'Ds_Signature' => $signature
        ],
        'actionUrl' => $config['urlSis'],
        'debug' => [
            'amount_euros' => $input['amount'],
            'amount_centimos' => $amountCentimos,
            'merchant_data' => $merchantData
        ]
    ];

    // Guardar datos del pedido para posterior verificación
    $pedidoData = [
        'orderNumber' => $orderNumber,
        'amount' => $input['amount'],
        'customerName' => $input['customerName'],
        'customerEmail' => $input['customerEmail'],
        'productos' => $input['productos'],
        'timestamp' => time(),
        'status' => 'pending'
    ];
    
    // Guardar en archivo temporal (en producción usarías una base de datos)
    $pedidosDir = __DIR__ . '/tmp';
    if (!is_dir($pedidosDir)) {
        mkdir($pedidosDir, 0777, true);
    }
    file_put_contents($pedidosDir . "/pedido_$orderNumber.json", json_encode($pedidoData));

    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>