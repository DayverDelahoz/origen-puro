<?php
// ========================================
// API ENDPOINT - PRODUCTOS
// ========================================

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Configuración de la API Node.js
$NODE_API_URL = 'http://localhost:8080/api';

// Función para realizar peticiones a la API Node.js
function fetchFromNodeAPI($endpoint) {
    $url = $GLOBALS['NODE_API_URL'] . $endpoint;
    
    // Crear contexto para la petición
    $context = stream_context_create([
        'http' => [
            'timeout' => 10, // 10 segundos timeout
            'method' => 'GET',
            'header' => 'Content-Type: application/json'
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
    // Determinar qué endpoint llamar según parámetros
    $tipo = $_GET['tipo'] ?? 'all';
    $id = $_GET['id'] ?? null;
    
    if ($id) {
        // Producto específico
        $endpoint = "/products/$id";
        $datos = fetchFromNodeAPI($endpoint);
        
        // Log para debug
        error_log("PHP API - Producto ID $id obtenido: " . json_encode($datos));
        
    } elseif ($tipo === 'top') {
        // Productos destacados
        $endpoint = "/products/top";
        $datos = fetchFromNodeAPI($endpoint);
        
        error_log("PHP API - Productos TOP obtenidos: " . count($datos) . " productos");
        
    } else {
        // Todos los productos
        $endpoint = "/products";
        $datos = fetchFromNodeAPI($endpoint);
        
        error_log("PHP API - Todos los productos obtenidos: " . count($datos) . " productos");
    }
    
    // Devolver respuesta exitosa
    echo json_encode($datos);
    
} catch (Exception $e) {
    // Error handling
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
    // Log del error
    error_log("PHP API ERROR: " . $e->getMessage());
}
?>