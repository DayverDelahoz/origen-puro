<?php
/**
 * Procesar Respuesta Redsys - Origen Puro Coffee
 * Maneja la respuesta de Redsys después del pago
 */

// Incluir la librería de Redsys
require_once 'signatureUtils/signature.php';

// Configuración
$config = [
    'kc' => 'sq7HjrUOBfKmC576ILgskD5srU870gJ7', // Clave de pruebas
];

// Log para debug
function logMessage($message) {
    $logDir = __DIR__ . '/tmp';
    if (!is_dir($logDir)) {
        mkdir($logDir, 0777, true);
    }
    file_put_contents($logDir . '/redsys.log', date('Y-m-d H:i:s') . " - $message\n", FILE_APPEND);
}

try {
    logMessage("=== INICIO PROCESAMIENTO RESPUESTA REDSYS ===");
    
    // Obtener parámetros (pueden venir por GET, POST o JSON)
    $jsonParams = json_decode(file_get_contents('php://input'), true);
    $receivedParams = array_merge($_GET, $_POST, is_array($jsonParams) ? $jsonParams : []);
    
    logMessage("Parámetros recibidos: " . json_encode($receivedParams));

    if (empty($receivedParams)) {
        throw new Exception("No se recibieron parámetros");
    }

    // Verificar que tenemos los parámetros necesarios
    $requiredParams = ['Ds_SignatureVersion', 'Ds_MerchantParameters', 'Ds_Signature'];
    foreach ($requiredParams as $param) {
        if (!isset($receivedParams[$param])) {
            throw new Exception("Parámetro requerido faltante: $param");
        }
    }

    $version = $receivedParams["Ds_SignatureVersion"];
    $datos = $receivedParams["Ds_MerchantParameters"];
    $signatureRecibida = $receivedParams["Ds_Signature"];

    logMessage("Version: $version");
    logMessage("Signature recibida: $signatureRecibida");

    // Decodificar parámetros
    $decodedData = Utils::base64_url_decode_safe($datos);
    $data = json_decode($decodedData, true);
    
    if (!$data) {
        throw new Exception("Error decodificando datos del merchant");
    }

    logMessage("Datos decodificados: " . json_encode($data));

    // Obtener número de pedido
    $orderNumber = $data['Ds_Order'] ?? $data['DS_ORDER'] ?? null;
    if (!$orderNumber) {
        throw new Exception("No se encontró el número de pedido");
    }

    // Generar firma para verificación
    $firmaCalculada = Signature::createMerchantSignature($config['kc'], $datos, $orderNumber);
    
    logMessage("Firma calculada: $firmaCalculada");

    // Verificar firma
    try {
        Signature::checkSignatures($signatureRecibida, $firmaCalculada);
        $firmaValida = true;
        logMessage("✅ FIRMA VÁLIDA");
    } catch (Exception $e) {
        $firmaValida = false;
        logMessage("❌ FIRMA INVÁLIDA: " . $e->getMessage());
        throw new Exception("Firma inválida");
    }

    // Obtener estado del pago
    $responseCode = $data['Ds_Response'] ?? '';
    $authorisationCode = $data['Ds_AuthorisationCode'] ?? '';
    $amount = $data['Ds_Amount'] ?? '';
    
    // Código de respuesta entre 0000-0099 = éxito, resto = error
    $pagoExitoso = ($responseCode >= '0000' && $responseCode <= '0099');
    
    logMessage("Código respuesta: $responseCode");
    logMessage("Código autorización: $authorisationCode");
    logMessage("Pago exitoso: " . ($pagoExitoso ? 'SÍ' : 'NO'));

    // Cargar datos del pedido original
    $pedidoFile = __DIR__ . "/tmp/pedido_$orderNumber.json";
    $pedidoData = null;
    
    if (file_exists($pedidoFile)) {
        $pedidoData = json_decode(file_get_contents($pedidoFile), true);
        logMessage("Datos del pedido cargados");
    } else {
        logMessage("⚠️ No se encontraron datos del pedido original");
    }

    // Actualizar estado del pedido
    if ($pedidoData) {
        $pedidoData['status'] = $pagoExitoso ? 'paid' : 'failed';
        $pedidoData['redsys_response'] = $data;
        $pedidoData['processed_at'] = time();
        
        file_put_contents($pedidoFile, json_encode($pedidoData));
    }

    // Si es una notificación (llamada server-to-server), responder OK
    if (strpos($_SERVER['HTTP_USER_AGENT'] ?? '', 'Redsys') !== false) {
        logMessage("Respondiendo a notificación server-to-server");
        echo "*OK*";
        exit;
    }

    // Si es una redirección del usuario, mostrar página de resultado
    $pageTitle = $pagoExitoso ? "Pago Completado" : "Error en el Pago";
    $pageClass = $pagoExitoso ? "success" : "error";
    $message = $pagoExitoso 
        ? "¡Tu pago se ha procesado correctamente!"
        : "Ha ocurrido un error procesando tu pago.";

    $amountEuros = $amount ? number_format($amount / 100, 2, '.', '') : '0.00';

} catch (Exception $e) {
    logMessage("❌ ERROR: " . $e->getMessage());
    $pageTitle = "Error en el Pago";
    $pageClass = "error";
    $message = "Error procesando la respuesta del pago: " . $e->getMessage();
    $pagoExitoso = false;
    $orderNumber = '';
    $amountEuros = '0.00';
}

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $pageTitle; ?> - Origen Puro Coffee</title>
    <link rel="stylesheet" href="../css/styles-elegant.css">
    <style>
        .payment-result {
            max-width: 600px;
            margin: 100px auto;
            padding: 40px;
            text-align: center;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
        
        .result-icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        
        .success .result-icon {
            color: #28a745;
        }
        
        .error .result-icon {
            color: #dc3545;
        }
        
        .result-details {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: left;
        }
        
        .btn-primary {
            display: inline-block;
            padding: 12px 24px;
            background: #8B4513;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 20px;
            transition: background-color 0.3s;
        }
        
        .btn-primary:hover {
            background: #654321;
        }
    </style>
</head>
<body>
    <!-- HEADER -->
    <header class="header">
        <div class="header-content">
            <div class="logo">
                <div class="logo-content">
                    <h1>OPC</h1>
                    <div class="tagline">ORIGEN PURO CAFÉ</div>
                </div>
            </div>
            <nav class="nav">
                <a href="../index.html">Inicio</a>
                <a href="../mis-compras.html">Mis Compras</a>
                <a href="../carrito.html">Carrito</a>
            </nav>
        </div>
    </header>

    <!-- RESULTADO -->
    <div class="payment-result <?php echo $pageClass; ?>">
        <div class="result-icon">
            <?php echo $pagoExitoso ? '✅' : '❌'; ?>
        </div>
        
        <h1><?php echo $pageTitle; ?></h1>
        <p><?php echo $message; ?></p>
        
        <?php if ($pagoExitoso): ?>
            <div class="result-details">
                <h3>Detalles de la transacción</h3>
                <p><strong>Número de pedido:</strong> <?php echo $orderNumber; ?></p>
                <p><strong>Importe:</strong> €<?php echo $amountEuros; ?></p>
                <p><strong>Código de autorización:</strong> <?php echo $authorisationCode; ?></p>
                <p><strong>Fecha:</strong> <?php echo date('d/m/Y H:i:s'); ?></p>
            </div>
            
            <p><strong>¡Gracias por tu compra!</strong></p>
            <p>Recibirás un email de confirmación en breve.</p>
            
            <script>
                // Limpiar carrito después de pago exitoso
                localStorage.removeItem('carrito');
            </script>
        <?php endif; ?>
        
        <div>
            <a href="../index.html" class="btn-primary">Volver a la tienda</a>
            <?php if ($pagoExitoso): ?>
                <a href="../mis-compras.html" class="btn-primary">Ver mis compras</a>
            <?php else: ?>
                <a href="../carrito.html" class="btn-primary">Volver al carrito</a>
            <?php endif; ?>
        </div>
    </div>
    
    <script>
        // Si el pago fue exitoso, actualizar el contador del carrito
        <?php if ($pagoExitoso): ?>
        if (typeof updateCartCount === 'function') {
            updateCartCount();
        }
        <?php endif; ?>
    </script>
</body>
</html>