<?php
/**
 * Test Script para verificar la integración de Redsys
 */

echo "<h1>Test de Redsys TPV - Origen Puro Coffee</h1>";

// Verificar que las librerías existen
$archivosRequeridos = [
    'signatureUtils/signature.php',
    'signatureUtils/utils.php',
    'iniciar_pago.php',
    'procesar_respuesta.php'
];

echo "<h2>Verificación de archivos:</h2>";
echo "<ul>";

foreach ($archivosRequeridos as $archivo) {
    $existe = file_exists($archivo);
    $estado = $existe ? '✅ OK' : '❌ FALTA';
    echo "<li><strong>$archivo:</strong> $estado</li>";
}

echo "</ul>";

// Test de la librería de firma
echo "<h2>Test de librería de firma:</h2>";

try {
    require_once 'signatureUtils/signature.php';
    
    $testKey = 'sq7HjrUOBfKmC576ILgskD5srU870gJ7';
    $testData = 'eyJEU19NRVJDSEFOVF9BTU9VTlQiOiIxMDAifQ==';
    $testOrder = '123456789';
    
    $signature = Signature::createMerchantSignature($testKey, $testData, $testOrder);
    
    echo "<p>✅ Librería de firma funciona correctamente</p>";
    echo "<p><strong>Firma de prueba generada:</strong> $signature</p>";
    
} catch (Exception $e) {
    echo "<p>❌ Error en librería de firma: " . $e->getMessage() . "</p>";
}

// Verificar directorio tmp
echo "<h2>Verificación de directorios:</h2>";
$dirTmp = __DIR__ . '/tmp';
if (!is_dir($dirTmp)) {
    mkdir($dirTmp, 0777, true);
}

if (is_dir($dirTmp) && is_writable($dirTmp)) {
    echo "<p>✅ Directorio tmp existe y es escribible</p>";
} else {
    echo "<p>❌ Problema con directorio tmp</p>";
}

// Test de configuración de PHP
echo "<h2>Configuración de PHP:</h2>";
echo "<ul>";
echo "<li><strong>Versión de PHP:</strong> " . PHP_VERSION . "</li>";
echo "<li><strong>OpenSSL:</strong> " . (extension_loaded('openssl') ? '✅ Disponible' : '❌ No disponible') . "</li>";
echo "<li><strong>JSON:</strong> " . (extension_loaded('json') ? '✅ Disponible' : '❌ No disponible') . "</li>";
echo "<li><strong>Hash:</strong> " . (extension_loaded('hash') ? '✅ Disponible' : '❌ No disponible') . "</li>";
echo "</ul>";

echo "<h2>URLs de configuración:</h2>";
$baseUrl = 'http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']);
echo "<ul>";
echo "<li><strong>URL base:</strong> $baseUrl</li>";
echo "<li><strong>URL iniciar pago:</strong> $baseUrl/iniciar_pago.php</li>";
echo "<li><strong>URL procesar respuesta:</strong> $baseUrl/procesar_respuesta.php</li>";
echo "</ul>";

echo "<h2>Datos de prueba Redsys:</h2>";
echo "<ul>";
echo "<li><strong>Merchant Code:</strong> 999008881</li>";
echo "<li><strong>Terminal:</strong> 1</li>";
echo "<li><strong>Moneda:</strong> 978 (EUR)</li>";
echo "<li><strong>URL SIS (pruebas):</strong> https://sis-t.redsys.es:25443/sis/realizarPago</li>";
echo "</ul>";

echo "<hr>";
echo "<p><strong>Si todos los elementos muestran ✅, la integración está lista para usar.</strong></p>";
echo "<p><a href='../checkout.html'>🔙 Volver al Checkout</a></p>";

?>

<style>
body { 
    font-family: Arial, sans-serif; 
    max-width: 800px; 
    margin: 20px auto; 
    padding: 20px; 
    background: #f5f5f5; 
}
ul { background: white; padding: 20px; border-radius: 8px; margin: 10px 0; }
h1, h2 { color: #8B5A3C; }
a { color: #8B5A3C; text-decoration: none; font-weight: bold; }
a:hover { text-decoration: underline; }
</style>