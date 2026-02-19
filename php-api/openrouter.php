<?php
/**
 * OpenRouter AI API Proxy
 * This file handles AI-generated tool information via OpenRouter API
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// No database connection needed for this endpoint

// OpenRouter API credentials
const OPENROUTER_API_KEY = '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';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Get the HTTP method
$method = $_SERVER['REQUEST_METHOD'];

// Route based on method and path
$path = $_SERVER['REQUEST_URI'] ?? '';
$path = str_replace('/php-api/openrouter.php', '', $path);
$path = trim($path, '/');

// Routing
if ($method === 'POST' && empty($path)) {
    generateToolInfo();
} else if ($method === 'POST' && $path === 'blog') {
    generateBlogPost();
} else if ($method === 'POST' && $path === 'pros-cons') {
    generateProsCons();
} else if ($method === 'POST' && $path === 'compare') {
    generateComparison();
} else if ($method === 'POST' && $path === 'meta-description') {
    generateMetaDescription();
} else if ($method === 'POST' && $path === 'use-cases') {
    generateUseCases();
} else if ($method === 'POST' && $path === 'prompt') {
    generateAIPrompt();
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Endpoint not found']);
}

/**
 * Generate tool information using AI
 */
function generateToolInfo() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || empty($input['toolName'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Tool name is required']);
        return;
    }
    
    $toolName = $input['toolName'];
    
    try {
        $websiteUrl = $input['websiteUrl'] ?? '';
        $websiteContext = $websiteUrl ? "Website: {$websiteUrl}" : "";
        
        $prompt = "Generate comprehensive information for an AI tool called \"{$toolName}\". {$websiteContext}

You must respond with ONLY a valid JSON object. No explanations, no markdown, no code blocks, no additional text.

Required JSON structure:
{
  \"name\": \"{$toolName}\",
  \"shortDescription\": \"Brief marketing description (1-2 sentences, max 150 characters)\",
  \"fullDescription\": \"Comprehensive detailed description (8-12 sentences) covering: core features and capabilities, how it works, key use cases, supported platforms/integrations, pricing/rate limits, any limitations, target audience, and main benefits over competitors\",
  \"websiteUrl\": \"Official website URL\",
  \"pricingModel\": \"FREE, FREEMIUM, FREE_TRIAL, PAID, or OPEN_SOURCE\",
  \"features\": [\"feature 1\", \"feature 2\", \"feature 3\", \"feature 4\", \"feature 5\"],
  \"categories\": [\"Most relevant category\"],
  \"useCases\": [\"Use case 1\", \"Use case 2\", \"Use case 3\", \"Use case 4\", \"Use case 5\"],
  \"pros\": [\"Advantage 1\", \"Advantage 2\", \"Advantage 3\"],
  \"cons\": [\"Limitation 1\", \"Limitation 2\", \"Limitation 3\"],
  \"metaDescription\": \"SEO-optimized meta description (150-160 characters) for search engines\"
}

Guidelines:
- Be factual and accurate
- fullDescription must be detailed and comprehensive (8-12 sentences minimum)
- Include information about: features, usage, rate limits, limitations, integrations
- pros should highlight key advantages and strengths
- cons should mention honest limitations or drawbacks
- metaDescription should be compelling and include the tool name and key benefits
- Return ONLY the JSON object, nothing else";
        
        $requestBody = [
            'model' => 'google/gemma-3-12b-it:free',
            'messages' => [
                [
                    'role' => 'user',
                    'content' => $prompt
                ]
            ],
            'temperature' => 0.7,
            'max_tokens' => 4000
        ];
        
        $response = makeOpenRouterRequest($requestBody);
        
        if (!$response) {
            throw new Exception('Failed to get response from OpenRouter API');
        }
        
        $aiResponse = $response['choices'][0]['message']['content'] ?? '';
        
        error_log("OpenRouter AI Response: " . $aiResponse);
        
        // Parse JSON from AI response
        $parsedData = parseAiResponse($aiResponse);
        
        // Normalize categories to array if it's a string
        if (isset($parsedData['categories']) && is_string($parsedData['categories'])) {
            $parsedData['categories'] = [$parsedData['categories']];
        }
        
        // Normalize pricing model to uppercase
        $pricingModel = strtoupper($parsedData['pricingModel'] ?? 'FREE');
        $pricingMap = [
            'FREEMIUM' => 'FREEMIUM',
            'FREMIUM' => 'FREEMIUM',
            'FREE_TRIAL' => 'FREE_TRIAL',
            'TRIAL' => 'FREE_TRIAL',
            'OPEN_SOURCE' => 'OPEN_SOURCE',
            'OPENSOURCE' => 'OPEN_SOURCE',
            'PAID' => 'PAID',
            'PRICE' => 'PAID',
            'FREE' => 'FREE'
        ];
        $pricingModel = $pricingMap[$pricingModel] ?? 'FREE';
        $parsedData['pricingModel'] = $pricingModel;
        
        // Format full description with HTML
        $fullDescription = $parsedData['fullDescription'] ?? '';
        $sentences = preg_split('/[.!?]\s+/', $fullDescription);
        $sentences = array_filter(array_map('trim', $sentences));
        
        $fullDescription = '';
        foreach ($sentences as $sentence) {
            // Add period if missing
            if (!preg_match('/[.!?]$/', $sentence)) {
                $sentence .= '.';
            }
            // Wrap key phrases in <strong> tags
            $formatted = $sentence;
            $keywords = ['features', 'capabilities', 'integration', 'pricing', 'rate limit', 'limitation', 'benefit', 'target audience'];
            foreach ($keywords as $keyword) {
                $formatted = preg_replace('/\b' . preg_quote($keyword, '/') . 's?\b/iu', '<strong>$0</strong>', $formatted);
            }
            $fullDescription .= '<p>' . $formatted . '</p>';
        }
        $parsedData['fullDescription'] = $fullDescription;
        
        // Ensure all new fields are included
        $result = [
            'name' => $parsedData['name'] ?? $toolName,
            'shortDescription' => $parsedData['shortDescription'] ?? '',
            'fullDescription' => $parsedData['fullDescription'] ?? $fullDescription,
            'websiteUrl' => $parsedData['websiteUrl'] ?? $websiteUrl,
            'pricingModel' => $parsedData['pricingModel'] ?? $pricingModel,
            'features' => $parsedData['features'] ?? [],
            'categories' => $parsedData['categories'] ?? [],
            'useCases' => $parsedData['useCases'] ?? [],
            'pros' => $parsedData['pros'] ?? [],
            'cons' => $parsedData['cons'] ?? [],
            'metaDescription' => $parsedData['metaDescription'] ?? ''
        ];
        
        echo json_encode($result);
        
    } catch (Exception $e) {
        error_log("Error in generateToolInfo: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to generate tool information: ' . $e->getMessage()]);
    }
}

/**
 * Generate pros and cons for a tool
 */
function generateProsCons() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || empty($input['toolName'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Tool name is required']);
        return;
    }
    
    $toolName = $input['toolName'];
    $existingDescription = $input['description'] ?? '';
    
    try {
        $prompt = "Generate honest pros and cons for an AI tool called \"{$toolName}\". " . 
                 ($existingDescription ? "Tool description: {$existingDescription}" : "") . "

You must respond with ONLY a valid JSON object. No explanations, no markdown, no code blocks.

Required JSON structure:
{
  \"pros\": [\"Advantage 1\", \"Advantage 2\", \"Advantage 3\", \"Advantage 4\", \"Advantage 5\"],
  \"cons\": [\"Limitation 1\", \"Limitation 2\", \"Limitation 3\", \"Limitation 4\"]
}

Guidelines:
- Be honest and balanced
- Pros should highlight key strengths and benefits
- Cons should mention real limitations, drawbacks, or areas for improvement
- Each item should be a clear, concise sentence
- Return ONLY the JSON object, nothing else";
        
        $requestBody = [
            'model' => 'google/gemma-3-12b-it:free',
            'messages' => [
                [
                    'role' => 'user',
                    'content' => $prompt
                ]
            ],
            'temperature' => 0.7,
            'max_tokens' => 1500
        ];
        
        $response = makeOpenRouterRequest($requestBody);
        
        if (!$response) {
            throw new Exception('Failed to get response from OpenRouter API');
        }
        
        $aiResponse = $response['choices'][0]['message']['content'] ?? '';
        $parsedData = parseAiResponse($aiResponse);
        
        echo json_encode([
            'pros' => $parsedData['pros'] ?? [],
            'cons' => $parsedData['cons'] ?? []
        ]);
        
    } catch (Exception $e) {
        error_log("Error in generateProsCons: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to generate pros/cons: ' . $e->getMessage()]);
    }
}

/**
 * Generate comparison between two tools
 */
function generateComparison() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || empty($input['tool1']) || empty($input['tool2'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Both tool names are required']);
        return;
    }
    
    $tool1 = $input['tool1'];
    $tool2 = $input['tool2'];
    $useCase = $input['useCase'] ?? '';
    
    try {
        $useCaseContext = $useCase ? "Focus the comparison on: {$useCase}" : "";
        
        $prompt = "Generate a detailed comparison between two AI tools: \"{$tool1}\" vs \"{$tool2}\". {$useCaseContext}

You must respond with ONLY a valid JSON object. No explanations, no markdown, no code blocks.

Required JSON structure:
{
  \"tool1\": \"{$tool1}\",
  \"tool2\": \"{$tool2}\",
  \"summary\": \"Brief comparison summary (2-3 sentences)\",
  \"comparison\": [
    {
      \"aspect\": \"Pricing\",
      \"tool1\": \"Pricing info for {$tool1}\",
      \"tool2\": \"Pricing info for {$tool2}\",
      \"winner\": \"tool1 or tool2 or tie\"
    },
    {
      \"aspect\": \"Features\",
      \"tool1\": \"Key features of {$tool1}\",
      \"tool2\": \"Key features of {$tool2}\",
      \"winner\": \"tool1 or tool2 or tie\"
    },
    {
      \"aspect\": \"Ease of Use\",
      \"tool1\": \"Usability of {$tool1}\",
      \"tool2\": \"Usability of {$tool2}\",
      \"winner\": \"tool1 or tool2 or tie\"
    },
    {
      \"aspect\": \"Performance\",
      \"tool1\": \"Performance of {$tool1}\",
      \"tool2\": \"Performance of {$tool2}\",
      \"winner\": \"tool1 or tool2 or tie\"
    },
    {
      \"aspect\": \"Best For\",
      \"tool1\": \"Best use cases for {$tool1}\",
      \"tool2\": \"Best use cases for {$tool2}\",
      \"winner\": \"tool1 or tool2 or tie\"
    }
  ],
  \"overallWinner\": \"tool1 or tool2 or tie\",
  \"recommendation\": \"Detailed recommendation explaining which tool to choose and why (3-4 sentences)\"
}

Guidelines:
- Be objective and fair
- Compare key aspects: pricing, features, ease of use, performance, best use cases
- Provide clear winners for each aspect
- Give an overall recommendation
- Return ONLY the JSON object, nothing else";
        
        $requestBody = [
            'model' => 'google/gemma-3-12b-it:free',
            'messages' => [
                [
                    'role' => 'user',
                    'content' => $prompt
                ]
            ],
            'temperature' => 0.7,
            'max_tokens' => 3000
        ];
        
        $response = makeOpenRouterRequest($requestBody);
        
        if (!$response) {
            throw new Exception('Failed to get response from OpenRouter API');
        }
        
        $aiResponse = $response['choices'][0]['message']['content'] ?? '';
        $parsedData = parseAiResponse($aiResponse);
        
        echo json_encode($parsedData);
        
    } catch (Exception $e) {
        error_log("Error in generateComparison: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to generate comparison: ' . $e->getMessage()]);
    }
}

/**
 * Generate SEO meta description
 */
function generateMetaDescription() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || empty($input['toolName'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Tool name is required']);
        return;
    }
    
    $toolName = $input['toolName'];
    $description = $input['description'] ?? '';
    
    try {
        $prompt = "Generate a compelling SEO-optimized meta description for an AI tool called \"{$toolName}\". " .
                 ($description ? "Tool description: {$description}" : "") . "

You must respond with ONLY a valid JSON object. No explanations, no markdown, no code blocks.

Required JSON structure:
{
  \"metaDescription\": \"SEO-optimized meta description (150-160 characters) that includes the tool name, key benefits, and a call to action. Must be compelling and include relevant keywords.\"
}

Guidelines:
- Exactly 150-160 characters (optimal for SEO)
- Include the tool name
- Highlight key benefits or features
- Include a subtle call to action
- Use relevant keywords naturally
- Make it compelling and click-worthy
- Return ONLY the JSON object, nothing else";
        
        $requestBody = [
            'model' => 'google/gemma-3-12b-it:free',
            'messages' => [
                [
                    'role' => 'user',
                    'content' => $prompt
                ]
            ],
            'temperature' => 0.7,
            'max_tokens' => 500
        ];
        
        $response = makeOpenRouterRequest($requestBody);
        
        if (!$response) {
            throw new Exception('Failed to get response from OpenRouter API');
        }
        
        $aiResponse = $response['choices'][0]['message']['content'] ?? '';
        $parsedData = parseAiResponse($aiResponse);
        
        echo json_encode([
            'metaDescription' => $parsedData['metaDescription'] ?? ''
        ]);
        
    } catch (Exception $e) {
        error_log("Error in generateMetaDescription: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to generate meta description: ' . $e->getMessage()]);
    }
}

/**
 * Generate use cases for a tool
 */
function generateUseCases() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || empty($input['toolName'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Tool name is required']);
        return;
    }
    
    $toolName = $input['toolName'];
    $description = $input['description'] ?? '';
    
    try {
        $prompt = "Generate 10-15 specific, practical use cases for an AI tool called \"{$toolName}\". " .
                 ($description ? "Tool description: {$description}" : "") . "

You must respond with ONLY a valid JSON object. No explanations, no markdown, no code blocks.

Required JSON structure:
{
  \"useCases\": [
    {
      \"title\": \"Use case title\",
      \"description\": \"Detailed description of how to use the tool for this specific use case (2-3 sentences)\"
    }
  ]
}

Guidelines:
- Generate 10-15 diverse, practical use cases
- Each use case should be specific and actionable
- Include both common and creative use cases
- Make descriptions detailed and helpful
- Return ONLY the JSON object, nothing else";
        
        $requestBody = [
            'model' => 'google/gemma-3-12b-it:free',
            'messages' => [
                [
                    'role' => 'user',
                    'content' => $prompt
                ]
            ],
            'temperature' => 0.8,
            'max_tokens' => 2500
        ];
        
        $response = makeOpenRouterRequest($requestBody);
        
        if (!$response) {
            throw new Exception('Failed to get response from OpenRouter API');
        }
        
        $aiResponse = $response['choices'][0]['message']['content'] ?? '';
        $parsedData = parseAiResponse($aiResponse);
        
        echo json_encode([
            'useCases' => $parsedData['useCases'] ?? []
        ]);
        
    } catch (Exception $e) {
        error_log("Error in generateUseCases: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to generate use cases: ' . $e->getMessage()]);
    }
}

/**
 * Generate AI prompt for image or video
 */
function generateAIPrompt() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || empty($input['description'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Description is required']);
        return;
    }
    
    $promptType = strtoupper($input['promptType'] ?? 'IMAGE');
    $description = $input['description'];
    $style = $input['style'] ?? '';
    $toolName = $input['toolName'] ?? '';
    
    // Validate prompt type
    if (!in_array($promptType, ['IMAGE', 'VIDEO', 'IMAGE_EDIT', 'VIDEO_EDIT'])) {
        $promptType = 'IMAGE';
    }
    
    try {
        // Build prompt based on type
        $typeLabel = $promptType === 'VIDEO' || $promptType === 'VIDEO_EDIT' ? 'video' : 'image';
        $toolContext = $toolName ? " optimized for {$toolName}" : '';
        $styleContext = $style ? " in {$style} style" : '';
        
        $systemPrompt = "You are an expert AI prompt engineer specializing in creating high-quality prompts for AI {$typeLabel} generation tools like Midjourney, DALL-E, Stable Diffusion, Runway, and Pika Labs.";
        
        $userPrompt = "Generate a complete AI {$typeLabel} generation prompt based on this description: \"{$description}\"{$styleContext}{$toolContext}.

You must respond with ONLY a valid JSON object. No explanations, no markdown, no code blocks.

Required JSON structure:
{
  \"title\": \"Catchy, descriptive title for the prompt (max 60 characters)\",
  \"description\": \"Brief description explaining what this prompt creates and when to use it (2-3 sentences, max 200 characters)\",
  \"prompt_text\": \"The complete, detailed prompt text ready to use in AI tools. Include all necessary parameters, style modifiers, and technical specifications. For {$typeLabel} prompts, include aspect ratios, quality settings, and any relevant parameters.\",
  \"tags\": [\"tag1\", \"tag2\", \"tag3\", \"tag4\", \"tag5\"],
  \"difficulty\": \"BEGINNER\" or \"INTERMEDIATE\" or \"ADVANCED\",
  \"parameters\": {
    \"--ar\": \"aspect ratio if applicable\",
    \"--style\": \"style parameter if applicable\",
    \"--quality\": \"quality setting if applicable\"
  }
}

Guidelines:
- Title should be catchy and descriptive (e.g., \"Cinematic Portrait in Golden Hour\", \"Futuristic Cityscape at Night\")
- Description should explain what the prompt creates and its best use cases
- Prompt text should be complete, detailed, and ready to copy-paste into AI tools
- Include relevant parameters like --ar (aspect ratio), --style, --quality, --v (version), etc. based on the tool
- Tags should be relevant keywords (5-7 tags)
- Difficulty should match the complexity of the prompt
- For {$typeLabel} prompts, ensure the prompt text includes all necessary technical parameters
- Make the prompt professional, detailed, and optimized for best results
- Return ONLY the JSON object, nothing else";
        
        $requestBody = [
            'model' => 'google/gemma-3-12b-it:free',
            'messages' => [
                [
                    'role' => 'system',
                    'content' => $systemPrompt
                ],
                [
                    'role' => 'user',
                    'content' => $userPrompt
                ]
            ],
            'temperature' => 0.8,
            'max_tokens' => 2000
        ];
        
        $response = makeOpenRouterRequest($requestBody);
        
        if (!$response) {
            throw new Exception('Failed to get response from OpenRouter API');
        }
        
        $aiResponse = $response['choices'][0]['message']['content'] ?? '';
        
        if (empty($aiResponse)) {
            error_log("Empty response from OpenRouter for prompt generation");
            throw new Exception('Received empty response from AI. Please try again.');
        }
        
        $parsedData = parseAiResponse($aiResponse);
        
        // Validate and normalize data
        $result = [
            'title' => $parsedData['title'] ?? 'AI Generated Prompt',
            'description' => $parsedData['description'] ?? '',
            'prompt_text' => $parsedData['prompt_text'] ?? '',
            'tags' => is_array($parsedData['tags']) ? $parsedData['tags'] : [],
            'difficulty' => strtoupper($parsedData['difficulty'] ?? 'BEGINNER'),
            'parameters' => is_array($parsedData['parameters']) ? $parsedData['parameters'] : []
        ];
        
        // Validate difficulty
        $validDifficulties = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
        if (!in_array($result['difficulty'], $validDifficulties)) {
            $result['difficulty'] = 'BEGINNER';
        }
        
        echo json_encode($result);
        
    } catch (Exception $e) {
        error_log("Error in generateAIPrompt: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to generate AI prompt: ' . $e->getMessage()]);
    }
}

/**
 * Make a request to OpenRouter API
 */
function makeOpenRouterRequest($body) {
    $ch = curl_init();
    
    curl_setopt_array($ch, [
        CURLOPT_URL => OPENROUTER_API_URL,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($body),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . OPENROUTER_API_KEY,
            'HTTP-Referer: https://clarifyall.com',
            'X-Title: ClarifyAll Tool Generator'
        ],
        CURLOPT_TIMEOUT => 120, // 2 minutes timeout for long blog posts
        CURLOPT_CONNECTTIMEOUT => 30
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    $curlErrno = curl_errno($ch);
    curl_close($ch);
    
    if ($error || $curlErrno) {
        error_log("cURL Error #{$curlErrno}: " . $error);
        error_log("Request body: " . json_encode($body));
        return null;
    }
    
    if ($httpCode !== 200) {
        $errorResponse = json_decode($response, true);
        $errorMessage = isset($errorResponse['error']) ? $errorResponse['error']['message'] ?? $errorResponse['error'] : $response;
        error_log("OpenRouter API HTTP Error {$httpCode}: " . $errorMessage);
        error_log("Full response: " . substr($response, 0, 1000));
        error_log("Request body: " . json_encode($body));
        return null;
    }
    
    $decoded = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("JSON decode error: " . json_last_error_msg());
        error_log("Response: " . substr($response, 0, 1000));
        return null;
    }
    
    return $decoded;
}

/**
 * Parse AI response to extract JSON
 */
function parseAiResponse($aiResponse) {
    // First try to parse the response as JSON directly
    $parsed = json_decode($aiResponse, true);
    if (json_last_error() === JSON_ERROR_NONE) {
        return $parsed;
    }
    
    // If direct parse fails, try to extract JSON from the response
    // Improved regex to handle multiline JSON with nested structures
    preg_match('/\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/s', $aiResponse, $matches);
    
    if (empty($matches)) {
        // Try to find JSON starting from the first {
        $startPos = strpos($aiResponse, '{');
        if ($startPos !== false) {
            $jsonMatch = substr($aiResponse, $startPos);
            // Find matching closing brace
            $braceCount = 0;
            $endPos = $startPos;
            for ($i = $startPos; $i < strlen($aiResponse); $i++) {
                if ($aiResponse[$i] === '{') $braceCount++;
                if ($aiResponse[$i] === '}') {
                    $braceCount--;
                    if ($braceCount === 0) {
                        $endPos = $i + 1;
                        break;
                    }
                }
            }
            if ($endPos > $startPos) {
                $jsonMatch = substr($aiResponse, $startPos, $endPos - $startPos);
                $parsed = json_decode($jsonMatch, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    return $parsed;
                }
            }
        }
        throw new Exception('No JSON found in AI response');
    }
    
    $jsonMatch = $matches[0];
    
    $parsed = json_decode($jsonMatch, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log('JSON Parse Error: ' . json_last_error_msg());
        error_log('Attempted to parse: ' . substr($jsonMatch, 0, 500));
        throw new Exception('Invalid JSON format in AI response');
    }
    
    return $parsed;
}

/**
 * Generate blog post using AI
 */
function generateBlogPost() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || empty($input['subject'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Blog subject is required']);
        return;
    }
    
    $subject = $input['subject'];
    $articleType = $input['articleType'] ?? 'general'; // general, top10, howto, comparison
    $tools = $input['tools'] ?? []; // For top10 and comparison types
    $industry = $input['industry'] ?? ''; // For top10 type
    
    try {
        // Build prompt based on article type
        $prompt = buildBlogPrompt($subject, $articleType, $tools, $industry);
        
        // Use the working model: google/gemma-3-12b-it:free
        $requestBody = [
            'model' => 'google/gemma-3-12b-it:free',
            'messages' => [
                [
                    'role' => 'user',
                    'content' => $prompt
                ]
            ],
            'temperature' => 0.85,
            'max_tokens' => 12000
            // Note: response_format not supported by all models, removed for compatibility
        ];
        
        $response = makeOpenRouterRequest($requestBody);
        
        if (!$response) {
            throw new Exception('Failed to get response from OpenRouter API. Please check error logs for details.');
        }
        
        $aiResponse = $response['choices'][0]['message']['content'] ?? '';
        
        if (empty($aiResponse)) {
            error_log("Empty response from OpenRouter. Full response: " . json_encode($response));
            throw new Exception('Received empty response from AI. Please try again.');
        }
        
        error_log("OpenRouter AI Blog Response length: " . strlen($aiResponse));
        error_log("First 500 chars: " . substr($aiResponse, 0, 500));
        
        // Parse JSON from AI response
        try {
            $parsedData = parseAiResponse($aiResponse);
        } catch (Exception $parseError) {
            error_log("Parse error: " . $parseError->getMessage());
            error_log("AI Response (first 2000 chars): " . substr($aiResponse, 0, 2000));
            throw new Exception('Failed to parse AI response. The AI may not have returned valid JSON. Please try again.');
        }
        
        // Validate required fields
        if (empty($parsedData['title']) && empty($parsedData['content'])) {
            error_log("Missing required fields in parsed data. Keys: " . implode(', ', array_keys($parsedData)));
            throw new Exception('AI response missing required fields. Please try again.');
        }
        
        // Extract meta_title and meta_description from parsed data
        // Check if they exist in the parsed data first
        $metaTitle = isset($parsedData['meta_title']) ? $parsedData['meta_title'] : '';
        $metaDescription = isset($parsedData['meta_description']) ? $parsedData['meta_description'] : '';
        
        // Log what we found
        error_log("Meta title from AI: " . ($metaTitle ?: 'EMPTY'));
        error_log("Meta description from AI: " . ($metaDescription ?: 'EMPTY'));
        error_log("Parsed data keys: " . implode(', ', array_keys($parsedData)));
        
        // If meta fields are empty or not provided, generate them from title and excerpt
        if (empty($metaTitle) && !empty($parsedData['title'])) {
            $metaTitle = $parsedData['title'];
            // Truncate to 60 characters if needed
            if (strlen($metaTitle) > 60) {
                $metaTitle = substr($metaTitle, 0, 57) . '...';
            }
            error_log("Generated meta_title from title: " . $metaTitle);
        }
        
        if (empty($metaDescription) && !empty($parsedData['excerpt'])) {
            $metaDescription = $parsedData['excerpt'];
            // Truncate to 160 characters if needed
            if (strlen($metaDescription) > 160) {
                $metaDescription = substr($metaDescription, 0, 157) . '...';
            }
            error_log("Generated meta_description from excerpt: " . $metaDescription);
        }
        
        // Normalize category to lowercase with dashes
        $category = $parsedData['category'] ?? 'general';
        $category = strtolower($category);
        $category = preg_replace('/[^a-z0-9]+/', '-', $category);
        $category = trim($category, '-');
        if (empty($category)) {
            $category = 'general';
        }
        
        // Ensure meta fields are always returned (even if empty)
        $responseData = [
            'title' => $parsedData['title'] ?? 'Untitled Article',
            'excerpt' => $parsedData['excerpt'] ?? '',
            'content' => $parsedData['content'] ?? '',
            'tags' => $parsedData['tags'] ?? [],
            'category' => $category,
            'meta_title' => $metaTitle,
            'meta_description' => $metaDescription
        ];
        
        // Log the final response being sent
        error_log("Final response meta_title: " . ($metaTitle ?: 'EMPTY'));
        error_log("Final response meta_description: " . ($metaDescription ?: 'EMPTY'));
        
        // Return the generated blog post data
        echo json_encode($responseData);
        
    } catch (Exception $e) {
        error_log("Error in generateBlogPost: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to generate blog post: ' . $e->getMessage()]);
    }
}

/**
 * Build blog prompt based on article type
 */
function buildBlogPrompt($subject, $articleType, $tools, $industry) {
    $baseRequirements = "CRITICAL REQUIREMENTS:
1. Write in a conversational, engaging style with a unique voice
2. Use personal experiences, anecdotes, and real-world examples where appropriate
3. Avoid generic AI-sounding phrases or patterns
4. Write naturally - vary sentence structure and tone
5. Include specific details, examples, and insights that feel authentic
6. Make the content valuable, informative, and well-researched
7. Use transition words naturally between paragraphs
8. Avoid repetitive phrasing or robotic language
9. Write a LONG, comprehensive article (2000+ words minimum)";

    switch ($articleType) {
        case 'top10':
            $toolsList = !empty($tools) ? implode(', ', $tools) : 'various AI tools';
            $industryContext = $industry ? " for {$industry}" : "";
            return "Write a comprehensive, engaging blog post titled \"Top 10 AI Tools{$industryContext}\" as if it were written by an expert blogger with personal experience and insights. Make it sound natural, human-written, and authentic.

Topic: Top 10 AI Tools{$industryContext}
Tools to include: {$toolsList}

{$baseRequirements}

CRITICAL: You MUST respond with ONLY a valid JSON object. No explanations, no markdown formatting, no code blocks, no text before or after the JSON. Start directly with { and end with }.

Required JSON structure (copy this exact format):
{
  \"title\": \"Compelling, SEO-friendly title like 'Top 10 AI Tools for [Industry] in 2024' (50-70 characters)\",
  \"excerpt\": \"Engaging short summary (1-2 sentences) that hooks the reader\",
  \"content\": \"VERY LONG and comprehensive blog post content (minimum 2000 words). Structure: Introduction, then detailed sections for each of the 10 tools with: tool name, key features, pricing, pros/cons, best use cases, and why it made the list. Use proper HTML formatting with <p>, <h2>, <h3>, <ul>, <li>, <strong>, and <em> tags. Include headings for each tool. End with a comparison table and conclusion.\",
  \"tags\": [\"AI Tools\", \"Top 10\", \"{$industry}\", \"Technology\", \"Productivity\"],
  \"category\": \"ai-tools\",
  \"meta_title\": \"SEO-optimized meta title (50-60 characters) for search engines, include main keywords\",
  \"meta_description\": \"SEO-optimized meta description (150-160 characters) that summarizes the article and includes key terms\"
}

Remember: Return ONLY the JSON object, nothing else.

Guidelines:
- Number each tool (1-10)
- For each tool: name, description, key features, pricing, pros, cons, best use cases
- Include a comparison section
- End with actionable recommendations
- Be EXTENSIVE and thorough";

        case 'howto':
            return "Write a comprehensive, step-by-step guide blog post about how to use an AI tool for a specific task. Make it sound natural, human-written, and authentic.

Topic: How to Use {$subject}

{$baseRequirements}

CRITICAL: You MUST respond with ONLY a valid JSON object. No explanations, no markdown formatting, no code blocks, no text before or after the JSON. Start directly with { and end with }.

Required JSON structure (copy this exact format):
{
  \"title\": \"Compelling, SEO-friendly title like 'How to Use [Tool] for [Task]: Complete Guide' (50-70 characters)\",
  \"excerpt\": \"Engaging short summary (1-2 sentences) that hooks the reader\",
  \"content\": \"VERY LONG and comprehensive guide (minimum 2000 words). Structure: Introduction, Prerequisites, Step-by-step instructions with screenshots descriptions, Tips and best practices, Common mistakes to avoid, Advanced techniques, Troubleshooting, Conclusion. Use proper HTML formatting with <p>, <h2>, <h3>, <ol>, <ul>, <li>, <strong>, <code>, and <em> tags. Number each step clearly.\",
  \"tags\": [\"Tutorial\", \"How-to\", \"AI Tools\", \"Guide\"],
  \"category\": \"tutorials\",
  \"meta_title\": \"SEO-optimized meta title (50-60 characters) for search engines, include main keywords\",
  \"meta_description\": \"SEO-optimized meta description (150-160 characters) that summarizes the article and includes key terms\"
}

Remember: Return ONLY the JSON object, nothing else.

Guidelines:
- Write clear, actionable steps
- Include tips and best practices
- Mention common mistakes
- Add troubleshooting section
- Be EXTENSIVE and thorough";

        case 'comparison':
            $tool1 = $tools[0] ?? 'Tool 1';
            $tool2 = $tools[1] ?? 'Tool 2';
            return "Write a comprehensive comparison blog post between two AI tools. Make it sound natural, human-written, and authentic.

Topic: {$tool1} vs {$tool2}: Complete Comparison

{$baseRequirements}

CRITICAL: You MUST respond with ONLY a valid JSON object. No explanations, no markdown formatting, no code blocks, no text before or after the JSON. Start directly with { and end with }.

Required JSON structure (copy this exact format):
{
  \"title\": \"Compelling, SEO-friendly title like '[Tool1] vs [Tool2]: Which is Better in 2024?' (50-70 characters)\",
  \"excerpt\": \"Engaging short summary (1-2 sentences) that hooks the reader\",
  \"content\": \"VERY LONG and comprehensive comparison (minimum 2000 words). Structure: Introduction, Overview of both tools, Detailed comparison: Pricing, Features, Ease of Use, Performance, Integrations, Customer Support, Use Cases, Pros and Cons of each, Side-by-side comparison table, Verdict and recommendation, Conclusion. Use proper HTML formatting with <p>, <h2>, <h3>, <table>, <ul>, <li>, <strong>, and <em> tags.\",
  \"tags\": [\"Comparison\", \"AI Tools\", \"Review\", \"{$tool1}\", \"{$tool2}\"],
  \"category\": \"reviews\",
  \"meta_title\": \"SEO-optimized meta title (50-60 characters) for search engines, include main keywords\",
  \"meta_description\": \"SEO-optimized meta description (150-160 characters) that summarizes the article and includes key terms\"
}

Remember: Return ONLY the JSON object, nothing else.

Guidelines:
- Be objective and fair
- Compare all key aspects
- Include a comparison table
- Give clear recommendations
- Be EXTENSIVE and thorough";

        default:
            return "Write a comprehensive, engaging blog post about the following topic as if it were written by an expert blogger with personal experience and insights. Make it sound natural, human-written, and authentic.

Topic: {$subject}

{$baseRequirements}

CRITICAL: You MUST respond with ONLY a valid JSON object. No explanations, no markdown formatting, no code blocks, no text before or after the JSON. Start directly with { and end with }.

Required JSON structure (copy this exact format):
{
  \"title\": \"Compelling, SEO-friendly blog post title (50-60 characters)\",
  \"excerpt\": \"Engaging short summary (1-2 sentences) that hooks the reader\",
  \"content\": \"VERY LONG and comprehensive blog post content (minimum 2000 words). Write extensively with multiple sections. Use proper HTML formatting with <p>, <h2>, <h3>, <ul>, <li>, <strong>, and <em> tags. Include headings every 2-3 paragraphs. Make it detailed, valuable, and thorough with deep insights.\",
  \"tags\": [\"tag1\", \"tag2\", \"tag3\", \"tag4\"],
  \"category\": \"general\",
  \"meta_title\": \"SEO-optimized meta title (50-60 characters) for search engines, include main keywords\",
  \"meta_description\": \"SEO-optimized meta description (150-160 characters) that summarizes the article and includes key terms\"
}

Remember: Return ONLY the JSON object, nothing else.

Guidelines for content:
- Start with a hook that grabs attention
- Use clear headings (h2, h3) to structure content  
- Include 5-7 well-developed main sections with substantial detail
- End with a compelling conclusion that summarizes key points
- Write as if sharing personal knowledge and experience
- Use conversational language but remain professional
- Include specific examples and actionable insights
- Format with proper HTML tags for readability
- Be EXTENSIVE and thorough - the longer and more detailed, the better";
    }
}

?>

