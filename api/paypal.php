<?php
// ========================================
// ENDPOINT PAYPAL - PROCESAR PAGO
// ========================================

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Solo aceptar POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => true, 'message' => 'Método no permitido']);
    exit;
}

// Función para llamar al endpoint de pedidos PHP
function crearPedidoViaPHP($pedidoData) {
    $url = 'http://localhost/api/pedidos.php'; // Ajustar según tu configuración
    
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => [
                'Content-Type: application/json',
                'Content-Length: ' . strlen(json_encode($pedidoData))
            ],
            'content' => json_encode($pedidoData),
            'timeout' => 10
        ]
    ]);
    
    $response = @file_get_contents($url, false, $context);
    
    if ($response === FALSE) {
        throw new Exception("Error llamando al endpoint de pedidos PHP");
    }
    
    return json_decode($response, true);
}

try {
    // Leer datos del POST
    $input = file_get_contents('php://input');
    $pagoData = json_decode($input, true);
    
    if (!$pagoData) {
        throw new Exception('Datos de pago inválidos');
    }
    
    // Validar campos requeridos del pago PayPal
    $camposRequeridos = ['paypal_order_id', 'payer_info', 'pedido_data'];
    foreach ($camposRequeridos as $campo) {
        if (!isset($pagoData[$campo])) {
            throw new Exception("Campo requerido faltante: $campo");
        }
    }
    
    // Log para debug
    error_log("PHP PAYPAL - Procesando pago: " . $pagoData['paypal_order_id']);
    error_log("PHP PAYPAL - Datos recibidos: " . json_encode($pagoData));
    
    // Extraer datos del pedido
    $pedidoData = $pagoData['pedido_data'];
    
    // Validar que el pedido tenga los campos necesarios
    $pedidoData['status'] = 'paid'; // Marcar como pagado
    $pedidoData['paypal_transaction_id'] = $pagoData['paypal_order_id'];
    
    // Crear pedido usando el endpoint de pedidos PHP
    $resultadoPedido = crearPedidoViaPHP($pedidoData);
    
    if (isset($resultadoPedido['error']) && $resultadoPedido['error']) {
        throw new Exception('Error creando pedido: ' . $resultadoPedido['message']);
    }
    
    // Log para debug
    error_log("PHP PAYPAL - Pedido creado: " . json_encode($resultadoPedido));
    
    // Respuesta exitosa
    echo json_encode([
        'success' => true,
        'message' => 'Pago procesado correctamente',
        'pedido' => $resultadoPedido,
        'paypal_transaction_id' => $pagoData['paypal_order_id'],
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    // Error handling
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
    // Log del error
    error_log("PHP PAYPAL ERROR: " . $e->getMessage());
}
?>