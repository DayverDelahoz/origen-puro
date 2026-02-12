<?php
// ========================================
// API ENDPOINT - PEDIDOS
// ========================================

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');

// Configuración de la API Node.js
$NODE_API_URL = 'http://localhost:8080/api';

// Solo aceptar POST para crear pedidos
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => true, 'message' => 'Método no permitido']);
    exit;
}

// Función para realizar peticiones a la API Node.js
function postToNodeAPI($endpoint, $data) {
    $url = $GLOBALS['NODE_API_URL'] . $endpoint;
    
    // Crear contexto para la petición POST
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => [
                'Content-Type: application/json',
                'Content-Length: ' . strlen($data)
            ],
            'content' => $data,
            'timeout' => 10
        ]
    ]);
    
    // Realizar petición
    $response = @file_get_contents($url, false, $context);
    
    if ($response === FALSE) {
        throw new Exception("Error conectando con la API Node.js: $url");
    }
    
    return json_decode($response, true);
}

try {
    // Leer datos del POST
    $input = file_get_contents('php://input');
    $pedidoData = json_decode($input, true);
    
    if (!$pedidoData) {
        throw new Exception('Datos de pedido inválidos');
    }
    
    // Validar campos requeridos
    $camposRequeridos = ['reference', 'user', 'total_amount', 'product_count', 'status'];
    foreach ($camposRequeridos as $campo) {
        if (!isset($pedidoData[$campo])) {
            throw new Exception("Campo requerido faltante: $campo");
        }
    }
    
    // Log para debug
    error_log("PHP PEDIDOS - Recibido: " . json_encode($pedidoData));
    
    // Enviar a la API Node.js
    $endpoint = "/orders";
    $jsonData = json_encode($pedidoData);
    
    $resultado = postToNodeAPI($endpoint, $jsonData);
    
    // Log para debug
    error_log("PHP PEDIDOS - Respuesta Node.js: " . json_encode($resultado));
    
    // Devolver respuesta exitosa
    echo json_encode($resultado);
    
} catch (Exception $e) {
    // Error handling
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
    // Log del error
    error_log("PHP PEDIDOS ERROR: " . $e->getMessage());
}
?>