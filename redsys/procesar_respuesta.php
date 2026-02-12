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

    // Si es una redirección del usuario, mostrar página de resultado con JavaScript
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
    <link rel="stylesheet" href="../css/checkout-adicional.css">
</head>
<body>
    <!-- HEADER -->
    <header class="header">
        <div class="header-content">
            <div class="logo">
                <img src="../img/logo.png" alt="Origen Puro Coffee" class="header-logo-image">
            </div>
            <nav class="nav">
                <a href="../index.html">Inicio</a>
                <a href="../mis-compras.html">Mis Compras</a>
                <a href="../carrito.html">Carrito</a>
            </nav>
        </div>
    </header>

    <script>
        // Procesar resultado y mostrar modal como PayPal
        document.addEventListener('DOMContentLoaded', function() {
            const pagoExitoso = <?php echo json_encode($pagoExitoso); ?>;
            const orderNumber = <?php echo json_encode($orderNumber); ?>;
            const amount = <?php echo json_encode($amountEuros); ?>;
            const authorisationCode = <?php echo json_encode($authorisationCode ?? ''); ?>;
            
            if (pagoExitoso) {
                // Recuperar datos del pedido guardados antes del pago
                let pedidoData = {};
                try {
                    const pedidoTemp = sessionStorage.getItem('redsys_pedido_temp');
                    if (pedidoTemp) {
                        pedidoData = JSON.parse(pedidoTemp);
                        // Limpiar sessionStorage
                        sessionStorage.removeItem('redsys_pedido_temp');
                        console.log('📦 Datos del pedido recuperados:', pedidoData);
                    }
                } catch (e) {
                    console.warn('⚠️ No se pudieron recuperar datos del pedido:', e);
                }
                
                // Crear objeto de pedido completo para historial
                const pedidoFinal = {
                    id: Date.now(),
                    reference: pedidoData.reference || `REF_${Date.now()}`,
                    total_amount: parseFloat(amount),
                    status: 'paid',
                    payment_method: 'redsys',
                    customer_name: pedidoData.customer_name || 'Cliente Redsys',
                    customer_email: pedidoData.customer_email || '',
                    customer_phone: pedidoData.customer_phone || '',
                    shipping_address: pedidoData.shipping_address || '',
                    items: pedidoData.items || [],
                    productos: pedidoData.productos || [],
                    fecha: new Date().toISOString(),
                    referencia_pago: orderNumber,
                    redsys_order_number: orderNumber,
                    redsys_auth_code: authorisationCode
                };
                
                // Guardar en historial
                try {
                    let historial = JSON.parse(localStorage.getItem('historial_pedidos')) || [];
                    historial.unshift(pedidoFinal);
                    
                    if (historial.length > 20) {
                        historial = historial.slice(0, 20);
                    }
                    
                    localStorage.setItem('historial_pedidos', JSON.stringify(historial));
                    console.log('✅ Pedido Redsys guardado en historial:', pedidoFinal.reference);
                } catch (error) {
                    console.error('❌ Error guardando pedido Redsys:', error);
                }
                
                // Limpiar carrito
                localStorage.removeItem('carrito');
                
                // Mostrar modal de éxito (mismo que PayPal)
                mostrarModalRedsys(true, {
                    orderNumber: orderNumber,
                    amount: amount,
                    authorisationCode: authorisationCode,
                    reference: pedidoFinal.reference,
                    customerName: pedidoFinal.customer_name
                });
            } else {
                // Mostrar modal de error
                mostrarModalRedsys(false, {
                    orderNumber: orderNumber,
                    error: <?php echo json_encode($message); ?>
                });
            }
        });
        
        function mostrarModalRedsys(exitoso, datos) {
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            
            if (exitoso) {
                modal.innerHTML = `
                    <div class="modal-container">
                        <div class="modal-header">
                            <div class="modal-icon">🎉</div>
                            <h2>¡Pago realizado con éxito!</h2>
                            <p>Tu pedido ha sido procesado correctamente</p>
                        </div>
                        <div class="modal-body">
                            <div class="modal-details">
                                <div class="modal-detail-item">
                                    <span class="modal-detail-label">💳 Número de pedido:</span>
                                    <span class="modal-detail-value">${datos.orderNumber}</span>
                                </div>
                                <div class="modal-detail-item">
                                    <span class="modal-detail-label">📋 Referencia:</span>
                                    <span class="modal-detail-value">${datos.reference}</span>
                                </div>
                                <div class="modal-detail-item">
                                    <span class="modal-detail-label">👤 Cliente:</span>
                                    <span class="modal-detail-value">${datos.customerName || 'N/A'}</span>
                                </div>
                                <div class="modal-detail-item">
                                    <span class="modal-detail-label">💳 Método de pago:</span>
                                    <span class="modal-detail-value">Redsys (Tarjeta)</span>
                                </div>
                                <div class="modal-detail-item">
                                    <span class="modal-detail-label">🔐 Código autorización:</span>
                                    <span class="modal-detail-value">${datos.authorisationCode}</span>
                                </div>
                                <div class="modal-detail-item">
                                    <span class="modal-detail-label">✅ Estado:</span>
                                    <span class="modal-detail-value">Pagado</span>
                                </div>
                                <div class="modal-detail-item">
                                    <span class="modal-detail-label">📅 Fecha:</span>
                                    <span class="modal-detail-value">${new Date().toLocaleString('es-ES')}</span>
                                </div>
                            </div>
                            <div class="modal-total">
                                <span class="modal-total-label">💰 Total pagado</span>
                                <span class="modal-total-value">€${datos.amount}</span>
                            </div>
                            <div class="modal-footer">
                                <p class="modal-message">
                                    <strong>🎉 ¡Gracias por tu compra!</strong><br>
                                    Tu pago con tarjeta se procesó correctamente. Serás redirigido a "Mis Compras" automáticamente.
                                </p>
                                <button class="modal-button" onclick="window.parent.location.href='../mis-compras.html'">
                                    📦 Ver mis compras
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                modal.innerHTML = `
                    <div class="modal-container">
                        <div class="modal-header" style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);">
                            <div class="modal-icon">❌</div>
                            <h2>Error en el pago</h2>
                            <p>No se pudo procesar tu pago</p>
                        </div>
                        <div class="modal-body">
                            <div class="modal-details">
                                <div class="modal-detail-item">
                                    <span class="modal-detail-label">❌ Error:</span>
                                    <span class="modal-detail-value">${datos.error}</span>
                                </div>
                                <div class="modal-detail-item">
                                    <span class="modal-detail-label">📅 Fecha:</span>
                                    <span class="modal-detail-value">${new Date().toLocaleString('es-ES')}</span>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <p class="modal-message">
                                    <strong>⚠️ Pago no completado</strong><br>
                                    Puedes intentar de nuevo o contactar con soporte.
                                </p>
                                <button class="modal-button" onclick="window.parent.location.href='../carrito.html'" style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);">
                                    <i class="ph ph-shopping-cart"></i> Volver al carrito
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            document.body.appendChild(modal);
            
            // Auto-redirigir después de 7 segundos si fue exitoso
            if (exitoso) {
                setTimeout(() => {
                    window.parent.location.href = '../mis-compras.html';
                }, 7000);
            }
        }
    </script>
</body>
</html>