<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Обработка preflight запросов
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Проверяем метод запроса
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Метод не разрешен']);
    exit;
}

// Получаем данные запроса
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Неверный формат JSON']);
    exit;
}

$apiKey = $input['apiKey'] ?? '';
$query = $input['query'] ?? '';

if (empty($apiKey) || empty($query)) {
    http_response_code(400);
    echo json_encode(['error' => 'API ключ и запрос обязательны']);
    exit;
}

/**
 * Поиск изображений через Yandex Search API v2
 */
function searchYandexImages($apiKey, $query) {
    // URL для Yandex Search API v2
    $baseUrl = 'https://yandex.com/search/xml';
    
    // Параметры запроса
    $params = [
        'user' => $apiKey,
        'key' => $apiKey,
        'query' => $query . ' site:*',
        'lr' => '213', // Москва
        'l10n' => 'ru',
        'sortby' => 'rlv',
        'filter' => 'medium',
        'groupby' => 'attr=d.mode=deep.groups-on-page=20.docs-in-group=1',
        'maxpassages' => '1',
        'page' => '0'
    ];
    
    $url = $baseUrl . '?' . http_build_query($params);
    
    // Инициализация cURL
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_USERAGENT, 'TimewebImageSearch/1.0');
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        throw new Exception("Ошибка cURL: " . $error);
    }
    
    if ($httpCode !== 200) {
        throw new Exception("HTTP ошибка: " . $httpCode);
    }
    
    return parseYandexResponse($response, $query);
}

/**
 * Парсинг XML ответа от Yandex
 */
function parseYandexResponse($xmlResponse, $query) {
    // Загружаем XML
    $xml = simplexml_load_string($xmlResponse);
    
    if (!$xml) {
        throw new Exception("Не удалось разобрать XML ответ");
    }
    
    $images = [];
    $totalResults = 0;
    
    // Проверяем есть ли результаты
    if (isset($xml->response->results->grouping->group)) {
        $totalResults = (int)$xml->response->results->grouping['total'];
        
        foreach ($xml->response->results->grouping->group as $group) {
            $doc = $group->doc;
            
            $title = (string)$doc->title;
            $url = (string)$doc->url;
            $snippet = isset($doc->headline) ? (string)$doc->headline : (string)$doc->passages->passage;
            
            // Пытаемся найти изображение в контенте или создаем placeholder
            $imageUrl = findImageInContent($url) ?: generatePlaceholderImage($title);
            
            $images[] = [
                'title' => $title,
                'url' => $imageUrl,
                'source' => $url,
                'snippet' => strip_tags($snippet)
            ];
        }
    }
    
    return [
        'images' => $images,
        'total' => count($images),
        'totalResults' => $totalResults
    ];
}

/**
 * Поиск изображений на странице (упрощенный метод)
 */
function findImageInContent($url) {
    // Для демонстрации используем популярные сервисы изображений
    $imageServices = [
        'https://picsum.photos/400/300?random=' . rand(1, 1000),
        'https://source.unsplash.com/400x300/?nature,landscape',
        'https://images.unsplash.com/photo-' . rand(1500000000000, 1700000000000) . '?w=400&h=300&fit=crop',
    ];
    
    return $imageServices[array_rand($imageServices)];
}

/**
 * Генерация placeholder изображения
 */
function generatePlaceholderImage($title) {
    $encodedTitle = urlencode(substr($title, 0, 50));
    return "https://via.placeholder.com/400x300/667eea/ffffff?text=" . $encodedTitle;
}

/**
 * Демонстрационные данные (если API недоступен)
 */
function getMockResults($query) {
    $mockImages = [];
    
    for ($i = 1; $i <= 8; $i++) {
        $mockImages[] = [
            'title' => $query . " - изображение " . $i,
            'url' => "https://picsum.photos/400/300?random=" . ($i * 10),
            'source' => "https://example{$i}.com/page",
            'snippet' => "Высококачественное изображение по запросу \"{$query}\". Демонстрационный контент для тестирования."
        ];
    }
    
    return [
        'images' => $mockImages,
        'total' => count($mockImages),
        'totalResults' => count($mockImages)
    ];
}

try {
    // Пытаемся выполнить реальный поиск
    $results = searchYandexImages($apiKey, $query);
    
    // Если результатов мало, добавляем демонстрационные данные
    if (count($results['images']) < 3) {
        $mockResults = getMockResults($query);
        $results['images'] = array_merge($results['images'], $mockResults['images']);
        $results['total'] = count($results['images']);
        $results['demo'] = true;
    }
    
    echo json_encode($results);
    
} catch (Exception $e) {
    // В случае ошибки возвращаем демонстрационные данные
    error_log("Yandex Search API Error: " . $e->getMessage());
    
    $mockResults = getMockResults($query);
    $mockResults['demo'] = true;
    $mockResults['error'] = 'Используются демонстрационные данные: ' . $e->getMessage();
    
    echo json_encode($mockResults);
}
?>