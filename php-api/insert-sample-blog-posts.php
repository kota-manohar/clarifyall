<?php
// Direct script to insert sample blog posts
// Access via: https://clarifyall.com/php-api/insert-sample-blog-posts.php
// Or run via command line: php insert-sample-blog-posts.php

// Database configuration
$host = 'srv1148.hstgr.io';
$port = 3306;
$dbname = 'u530425252_kyc';
$username = 'u530425252_kyc';
$password = '&631^1HXVzqE';

try {
    // Use non-persistent connection to avoid hitting MySQL connection limit
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_PERSISTENT => false, // Non-persistent to avoid connection limit issues
        PDO::ATTR_TIMEOUT => 5
    ]);
    
    // Get first user as author (prefer admin, fallback to any user)
    $stmt = $pdo->query("SELECT id, name, email FROM users WHERE role = 'ADMIN' LIMIT 1");
    $author = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$author) {
        $stmt = $pdo->query("SELECT id, name, email FROM users LIMIT 1");
        $author = $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    if (!$author) {
        die(json_encode(['success' => false, 'error' => 'No users found in database. Please create a user first.']));
    }
    
    $authorId = $author['id'];
    
    // Check if posts already exist with these slugs
    $existingSlugs = [
        'best-ai-writing-tools-2024-complete-comparison',
        'chatgpt-vs-claude-vs-gemini-which-ai-chatbot-wins',
        'top-10-free-ai-image-generators-dalle-midjourney-alternatives',
        'ai-video-editing-tools-from-beginner-to-pro',
        'best-ai-coding-assistants-github-copilot-alternatives'
    ];
    
    $stmt = $pdo->prepare("SELECT slug FROM blog_articles WHERE slug = ?");
    $existingCount = 0;
    foreach ($existingSlugs as $slug) {
        $stmt->execute([$slug]);
        if ($stmt->fetch()) {
            $existingCount++;
        }
    }
    
    if ($existingCount > 0) {
        // Delete existing posts with these slugs first
        $deleteStmt = $pdo->prepare("DELETE FROM blog_articles WHERE slug = ?");
        foreach ($existingSlugs as $slug) {
            $deleteStmt->execute([$slug]);
        }
    }
    
    // Insert blog posts
    $posts = [
        [
            'title' => 'Best AI Writing Tools in 2024: Complete Comparison',
            'slug' => 'best-ai-writing-tools-2024-complete-comparison',
            'excerpt' => 'Discover the top AI writing tools of 2024. Compare features, pricing, and capabilities of leading AI writing assistants to find the perfect tool for your content creation needs.',
            'content' => '<h2>Introduction to AI Writing Tools</h2>
<p>AI writing tools have revolutionized content creation, making it faster and more efficient than ever before. In 2024, the market is flooded with excellent options, each offering unique features and capabilities. This comprehensive comparison will help you choose the best AI writing tool for your specific needs.</p>

<h2>Top AI Writing Tools in 2024</h2>

<h3>1. ChatGPT by OpenAI</h3>
<p>ChatGPT has become the gold standard for AI writing assistance. With its GPT-4 model, it offers exceptional language understanding and generation capabilities. Key features include:</p>
<ul>
<li>Advanced natural language processing</li>
<li>Multiple conversation modes</li>
<li>Integration with various platforms</li>
<li>Custom GPT creation for specific use cases</li>
</ul>

<h3>2. Claude by Anthropic</h3>
<p>Claude stands out for its safety-focused approach and extended context window. Ideal for longer documents and detailed analysis.</p>

<h3>3. Jasper AI</h3>
<p>Designed specifically for marketers and content creators, Jasper offers templates and workflows that streamline content production.</p>

<h3>4. Copy.ai</h3>
<p>Perfect for marketing copy and social media content, Copy.ai provides a user-friendly interface with pre-built templates.</p>

<h3>5. Writesonic</h3>
<p>Writesonic combines AI writing with SEO optimization, making it ideal for content that needs to rank well in search engines.</p>

<h2>Comparison Table</h2>
<table>
<tr><th>Tool</th><th>Best For</th><th>Pricing</th><th>Key Feature</th></tr>
<tr><td>ChatGPT</td><td>General writing</td><td>Free/Paid</td><td>Most versatile</td></tr>
<tr><td>Claude</td><td>Long-form content</td><td>Paid</td><td>Extended context</td></tr>
<tr><td>Jasper</td><td>Marketing content</td><td>Paid</td><td>Templates</td></tr>
<tr><td>Copy.ai</td><td>Social media</td><td>Free/Paid</td><td>Ease of use</td></tr>
<tr><td>Writesonic</td><td>SEO content</td><td>Paid</td><td>SEO optimization</td></tr>
</table>

<h2>Key Features to Consider</h2>
<ul>
<li><strong>Language Quality:</strong> How natural does the writing sound?</li>
<li><strong>Customization:</strong> Can you tailor the tool to your brand voice?</li>
<li><strong>Integration:</strong> Does it work with your existing workflow?</li>
<li><strong>Pricing:</strong> Is the cost justified by the value provided?</li>
<li><strong>Support:</strong> How reliable is customer service?</li>
</ul>

<h2>Choosing the Right Tool</h2>
<p>When selecting an AI writing tool, consider your primary use case. Are you creating blog posts, marketing copy, or technical documentation? Each tool has strengths in different areas. Also, consider your budget and whether you need collaboration features or single-user access.</p>

<h2>Conclusion</h2>
<p>The best AI writing tool depends on your specific needs. For general-purpose writing, ChatGPT remains unbeatable. For marketing-focused content, Jasper or Copy.ai might be better. For long-form content with extended context needs, Claude excels. Evaluate each tool based on your priorities and take advantage of free trials when available.</p>',
            'category' => 'review',
            'tags' => ['AI writing tools', 'ChatGPT', 'content creation', 'writing assistance', '2024 comparison'],
            'meta_title' => 'Best AI Writing Tools in 2024: Complete Comparison | Clarifyall',
            'meta_description' => 'Discover the top AI writing tools of 2024. Compare ChatGPT, Claude, Jasper, Copy.ai, and Writesonic to find the perfect AI writing assistant for your needs.',
            'meta_keywords' => 'AI writing tools, ChatGPT, Claude, Jasper AI, Copy.ai, Writesonic, AI writing comparison, best AI writing software 2024',
            'read_time' => 12,
            'is_featured' => 1
        ],
        [
            'title' => 'ChatGPT vs. Claude vs. Gemini: Which AI Chatbot Wins?',
            'slug' => 'chatgpt-vs-claude-vs-gemini-which-ai-chatbot-wins',
            'excerpt' => 'Comprehensive comparison of the three leading AI chatbots: ChatGPT, Claude, and Google Gemini. Discover which AI assistant reigns supreme in 2024.',
            'content' => '<h2>The Battle of the AI Titans</h2>
<p>In 2024, three AI chatbots dominate the market: ChatGPT by OpenAI, Claude by Anthropic, and Gemini by Google. Each brings unique strengths to the table. This detailed comparison will help you determine which AI assistant is the best fit for your needs.</p>

<h2>ChatGPT by OpenAI</h2>
<p>OpenAI\'s ChatGPT, powered by GPT-4, is the most widely recognized AI chatbot. It boasts exceptional conversational abilities, massive user base, plugin ecosystem, and strong code generation capabilities.</p>

<h2>Claude by Anthropic</h2>
<p>Anthropic\'s Claude focuses on safety, helpfulness, and extended context processing with a 200K token context window. Ideal for long-form content and detailed analysis.</p>

<h2>Google Gemini</h2>
<p>Google\'s Gemini represents the tech giant\'s entry into the AI chatbot space with deep integration with Google services, multimodal capabilities, and strong factual accuracy.</p>

<h2>Head-to-Head Comparison</h2>
<p>Each chatbot excels in different areas: ChatGPT for versatility, Claude for long-form content, and Gemini for Google integration. The best choice depends on your specific needs.</p>',
            'category' => 'comparison',
            'tags' => ['ChatGPT', 'Claude', 'Gemini', 'AI chatbot comparison', 'OpenAI', 'Anthropic', 'Google AI'],
            'meta_title' => 'ChatGPT vs Claude vs Gemini: Which AI Chatbot Wins? | Clarifyall',
            'meta_description' => 'Comprehensive comparison of ChatGPT, Claude, and Gemini. Discover which AI chatbot is best for your needs in 2024.',
            'meta_keywords' => 'ChatGPT vs Claude vs Gemini, AI chatbot comparison, best AI assistant, ChatGPT vs Gemini, Claude vs ChatGPT',
            'read_time' => 15,
            'is_featured' => 1
        ],
        [
            'title' => 'Top 10 Free AI Image Generators: DALL-E, Midjourney Alternatives',
            'slug' => 'top-10-free-ai-image-generators-dalle-midjourney-alternatives',
            'excerpt' => 'Discover the best free AI image generators available today. Find alternatives to DALL-E and Midjourney that won\'t cost you a dime.',
            'content' => '<h2>Free AI Image Generation: Your Guide to the Best Tools</h2>
<p>AI image generation has exploded in popularity, but many leading tools like DALL-E and Midjourney require paid subscriptions. Fortunately, there are excellent free alternatives that can produce stunning images without breaking the bank.</p>

<h2>Top 10 Free AI Image Generators</h2>
<p>From Stable Diffusion to Bing Image Creator, discover the best free alternatives to expensive AI image generation tools. Each offers unique features and capabilities suitable for different needs.</p>',
            'category' => 'review',
            'tags' => ['AI image generator', 'free AI tools', 'DALL-E', 'Midjourney', 'Stable Diffusion', 'image generation'],
            'meta_title' => 'Top 10 Free AI Image Generators: DALL-E & Midjourney Alternatives | Clarifyall',
            'meta_description' => 'Discover the best free AI image generators including Stable Diffusion, Bing Image Creator, Leonardo.ai, and more. Find alternatives to expensive paid tools.',
            'meta_keywords' => 'free AI image generator, DALL-E alternatives, Midjourney free, Stable Diffusion, AI art generator free',
            'read_time' => 14,
            'is_featured' => 1
        ],
        [
            'title' => 'AI Video Editing Tools: From Beginner to Pro',
            'slug' => 'ai-video-editing-tools-from-beginner-to-pro',
            'excerpt' => 'Explore the best AI video editing tools for all skill levels. From beginner-friendly apps to professional-grade software, discover how AI is transforming video editing.',
            'content' => '<h2>AI Revolutionizes Video Editing</h2>
<p>Video editing has traditionally required extensive technical knowledge and time-consuming manual work. AI-powered tools are changing that, making professional-quality video editing accessible to everyone, from beginners to pros.</p>

<h2>Beginner-Friendly AI Video Editors</h2>
<p>Discover tools like Runway ML, Descript, and Pictory that make video editing easy for beginners with AI-powered features.</p>

<h2>Professional AI Video Editing Tools</h2>
<p>For professionals, Adobe Premiere Pro, DaVinci Resolve, and Final Cut Pro X offer advanced AI capabilities for professional workflows.</p>',
            'category' => 'how-to',
            'tags' => ['AI video editing', 'video editing software', 'Runway ML', 'Descript', 'DaVinci Resolve', 'Adobe Premiere'],
            'meta_title' => 'AI Video Editing Tools: From Beginner to Pro | Clarifyall',
            'meta_description' => 'Discover the best AI video editing tools for all skill levels. From beginner apps to professional software, learn how AI is transforming video creation.',
            'meta_keywords' => 'AI video editing, video editing software, Runway ML, Descript, DaVinci Resolve, AI video tools',
            'read_time' => 16,
            'is_featured' => 0
        ],
        [
            'title' => 'Best AI Coding Assistants: GitHub Copilot Alternatives',
            'slug' => 'best-ai-coding-assistants-github-copilot-alternatives',
            'excerpt' => 'Explore the best AI coding assistants beyond GitHub Copilot. Compare features, pricing, and capabilities of leading AI tools for developers.',
            'content' => '<h2>AI Coding Assistants Revolutionize Development</h2>
<p>AI coding assistants have transformed software development, making coding faster, more efficient, and accessible. While GitHub Copilot leads the market, numerous alternatives offer unique features and advantages worth exploring.</p>

<h2>Top AI Coding Assistants</h2>
<p>Compare GitHub Copilot, Cursor, Codeium, Tabnine, Amazon CodeWhisperer, JetBrains AI Assistant, and Cody. Each offers unique features for different development needs.</p>',
            'category' => 'review',
            'tags' => ['AI coding assistant', 'GitHub Copilot', 'Codeium', 'Tabnine', 'programming tools', 'AI for developers'],
            'meta_title' => 'Best AI Coding Assistants: GitHub Copilot Alternatives | Clarifyall',
            'meta_description' => 'Discover the best AI coding assistants including Codeium, Tabnine, Cursor, and more. Compare alternatives to GitHub Copilot for your development needs.',
            'meta_keywords' => 'AI coding assistant, GitHub Copilot alternatives, Codeium, Tabnine, Cursor, AI programming tools',
            'read_time' => 13,
            'is_featured' => 1
        ]
    ];
    
    $insertStmt = $pdo->prepare("
        INSERT INTO blog_articles (
            title, slug, excerpt, content, category, tags, meta_title, meta_description,
            meta_keywords, status, published_at, read_time, is_featured, author_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', NOW(), ?, ?, ?)
    ");
    
    $inserted = 0;
    foreach ($posts as $post) {
        try {
            $insertStmt->execute([
                $post['title'],
                $post['slug'],
                $post['excerpt'],
                $post['content'],
                $post['category'],
                json_encode($post['tags']),
                $post['meta_title'],
                $post['meta_description'],
                $post['meta_keywords'],
                $post['read_time'],
                $post['is_featured'],
                $authorId
            ]);
            $inserted++;
        } catch(PDOException $e) {
            // Ignore duplicate key errors
            if (strpos($e->getMessage(), 'Duplicate entry') === false) {
                echo "Error inserting post: " . $post['title'] . " - " . $e->getMessage() . "\n";
            }
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => "Successfully inserted $inserted blog posts!",
        'author' => $author,
        'inserted' => $inserted
    ], JSON_PRETTY_PRINT);
    
    // Close connection explicitly to free up MySQL connections
    $pdo = null;
    
} catch(PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ], JSON_PRETTY_PRINT);
} finally {
    // Ensure connection is closed even on error
    if (isset($pdo)) {
        $pdo = null;
    }
}
?>

