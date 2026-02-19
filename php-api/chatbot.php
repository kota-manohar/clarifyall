<?php
/**
 * AI Chatbot Assistant API
 * Provides context-aware responses about AI tools
 */

// No database connection needed - chatbot uses AI general knowledge only

// OpenRouter API credentials (use same as openrouter.php)
if (!defined('OPENROUTER_API_KEY')) {
    define('OPENROUTER_API_KEY', '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');
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['message']) || empty(trim($input['message']))) {
        http_response_code(400);
        echo json_encode(['error' => 'Message is required']);
        exit;
    }

    $userMessage = trim($input['message']);
    $conversationHistory = $input['conversationHistory'] ?? [];
    
    // Build prompt without database context
    $prompt = buildChatbotPrompt($userMessage, $conversationHistory);
    
    // Call OpenRouter API
    $response = makeChatbotRequest($prompt);
    
    echo json_encode([
        'response' => $response
    ]);
    
} catch (Exception $e) {
    error_log("Chatbot error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to process chat message',
        'message' => $e->getMessage(),
        'response' => 'I apologize, but I encountered a technical error. Please try again in a moment.'
    ]);
}

/**
 * Build chatbot prompt without database context
 */
function buildChatbotPrompt($userMessage, $conversationHistory) {
    $systemPrompt = "You are ClarifyAll AI Assistant, a helpful chatbot that answers questions about AI tools. You help users find the best AI tools, compare options, understand how to use tools, and make informed decisions.

Your responses should be:
- Conversational and friendly
- Accurate and helpful
- Concise but informative
- Focused on AI tools and productivity

Answer questions about AI tools based on your general knowledge. Provide helpful, accurate information about various AI tools, their features, pricing models, use cases, and comparisons.";
    
    $historyText = "";
    if (!empty($conversationHistory)) {
        $historyText = "\n\nRecent conversation:\n";
        foreach (array_slice($conversationHistory, -3) as $msg) {
            $role = $msg['role'] === 'user' ? 'User' : 'Assistant';
            $historyText .= "{$role}: {$msg['content']}\n";
        }
    }
    
    $fullPrompt = $systemPrompt . $historyText . "\n\nUser question: {$userMessage}\n\nAssistant response:";
    
    return $fullPrompt;
}

/**
 * Make request to OpenRouter API
 */
function makeChatbotRequest($prompt) {
    $apiKey = OPENROUTER_API_KEY;
    
    if (empty($apiKey)) {
        throw new Exception('OpenRouter API key not configured');
    }
    
    $url = 'https://openrouter.ai/api/v1/chat/completions';
    
    $data = [
        'model' => 'mistralai/mistral-small-3.2-24b-instruct:free',
        'messages' => [
            [
                'role' => 'system',
                'content' => 'You are a helpful AI assistant that answers questions about AI tools. Be conversational, accurate, and helpful.'
            ],
            [
                'role' => 'user',
                'content' => $prompt
            ]
        ],
        'temperature' => 0.7,
        'max_tokens' => 500
    ];
    
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
            'HTTP-Referer: https://clarifyall.com',
            'X-Title: ClarifyAll AI Assistant'
        ],
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CONNECTTIMEOUT => 10
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($curlError) {
        error_log("cURL error in chatbot: " . $curlError);
        throw new Exception('Failed to connect to AI service');
    }
    
    if ($httpCode !== 200) {
        error_log("OpenRouter API error: HTTP {$httpCode}, Response: " . substr($response, 0, 500));
        throw new Exception('AI service returned an error');
    }
    
    $responseData = json_decode($response, true);
    
    if (!isset($responseData['choices'][0]['message']['content'])) {
        error_log("Invalid response from OpenRouter: " . substr($response, 0, 500));
        throw new Exception('Invalid response from AI service');
    }
    
    return trim($responseData['choices'][0]['message']['content']);
}

