<?php
/**
 * Sitemap Generator
 * Generates XML sitemaps for all pages, tools, blog posts, prompts, and categories
 * Follows Google's XML Sitemap Protocol
 */

require_once __DIR__ . '/api-init.php';

// Base URL
$baseUrl = 'https://clarifyall.com';
$maxUrlsPerSitemap = 50000; // Google's limit

// Get action
$action = $_POST['action'] ?? $_GET['action'] ?? 'generate';

if ($action === 'generate') {
    try {
        $pdo = getDBConnection();
        
        $allUrls = [];
        $sitemapFiles = [];
        $totalUrls = 0;
        $breakdown = [
            'static_pages' => 0,
            'tools' => 0,
            'blog_posts' => 0,
            'prompts' => 0,
            'prompt_categories' => 0,
            'categories' => 0,
            'collections' => 0
        ];
        
        // 1. Static Pages
        $staticPages = [
            ['url' => '/', 'priority' => '1.0', 'changefreq' => 'daily'],
            ['url' => '/categories', 'priority' => '0.9', 'changefreq' => 'weekly'],
            ['url' => '/prompts', 'priority' => '0.9', 'changefreq' => 'daily'],
            ['url' => '/blog', 'priority' => '0.8', 'changefreq' => 'weekly'],
            ['url' => '/submit-tool', 'priority' => '0.7', 'changefreq' => 'monthly'],
            ['url' => '/about', 'priority' => '0.6', 'changefreq' => 'monthly'],
            ['url' => '/contact', 'priority' => '0.6', 'changefreq' => 'monthly'],
        ];
        
        foreach ($staticPages as $page) {
            $allUrls[] = [
                'loc' => $baseUrl . $page['url'],
                'lastmod' => date('Y-m-d'),
                'changefreq' => $page['changefreq'],
                'priority' => $page['priority']
            ];
        }
        $breakdown['static_pages'] = count($staticPages);
        
        // 2. Utility Tools (Static)
        $utilityTools = [
            '/tools/pdf-to-word',
            '/tools/word-to-pdf',
            '/tools/json-to-excel',
            '/tools/image-to-webp',
            '/tools/png-to-jpg',
            '/tools/jpg-to-png',
            '/tools/image-resizer',
            '/tools/csv-to-excel',
            '/tools/excel-to-csv',
            '/tools/heic-to-jpg',
            '/tools/pdf-compressor',
            '/tools/pdf-merger',
            '/tools/pdf-splitter',
            '/tools/base64',
            '/tools/hash-generator',
            '/tools/image-rotation',
            '/tools/text-to-pdf',
            '/tools/image-compressor',
            '/tools/qr-code-generator',
            '/tools/json-formatter',
            '/tools/password-generator',
            '/tools/word-counter',
            '/tools/case-converter',
            '/tools/text-diff',
            '/tools/favicon-generator',
            '/tools/sitemap-generator'
        ];

        foreach ($utilityTools as $toolUrl) {
            $allUrls[] = [
                'loc' => $baseUrl . $toolUrl,
                'lastmod' => date('Y-m-d'),
                'changefreq' => 'weekly',
                'priority' => '0.9'
            ];
        }
        $breakdown['static_pages'] += count($utilityTools);
        
        // 3. All Approved Tools (Dynamic)
        try {
            // Try to get updated_at, fallback to created_at
            $stmt = $pdo->query("
                SELECT id, slug, 
                       COALESCE(updated_at, created_at) as lastmod_date,
                       created_at
                FROM tools 
                WHERE status = 'APPROVED' 
                ORDER BY COALESCE(updated_at, created_at) DESC
            ");
            $tools = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($tools as $tool) {
                $lastmod = isset($tool['lastmod_date']) && $tool['lastmod_date'] 
                    ? date('Y-m-d', strtotime($tool['lastmod_date'])) 
                    : (isset($tool['created_at']) && $tool['created_at'] 
                        ? date('Y-m-d', strtotime($tool['created_at'])) 
                        : date('Y-m-d'));
                
                $slug = isset($tool['slug']) && !empty($tool['slug']) ? $tool['slug'] : $tool['id'];
                $allUrls[] = [
                    'loc' => $baseUrl . '/tool/' . $slug,
                    'lastmod' => $lastmod,
                    'changefreq' => 'weekly',
                    'priority' => '0.8'
                ];
            }
            $breakdown['tools'] = count($tools);
        } catch (Exception $e) {
            logError("Error fetching tools for sitemap: " . $e->getMessage());
        }
        
        // 3. Blog Posts
        try {
            $stmt = $pdo->query("
                SELECT id, slug, 
                       COALESCE(updated_at, published_at, created_at) as lastmod_date,
                       published_at, created_at
                FROM blog_articles 
                WHERE status = 'PUBLISHED' 
                ORDER BY COALESCE(published_at, created_at) DESC
            ");
            $blogPosts = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($blogPosts as $post) {
                $lastmod = isset($post['lastmod_date']) && $post['lastmod_date'] 
                    ? date('Y-m-d', strtotime($post['lastmod_date'])) 
                    : (isset($post['published_at']) && $post['published_at'] 
                        ? date('Y-m-d', strtotime($post['published_at'])) 
                        : (isset($post['created_at']) && $post['created_at']
                            ? date('Y-m-d', strtotime($post['created_at']))
                            : date('Y-m-d')));
                
                $slug = isset($post['slug']) && !empty($post['slug']) ? $post['slug'] : $post['id'];
                $allUrls[] = [
                    'loc' => $baseUrl . '/blog/' . $slug,
                    'lastmod' => $lastmod,
                    'changefreq' => 'monthly',
                    'priority' => '0.7'
                ];
            }
            $breakdown['blog_posts'] = count($blogPosts);
        } catch (Exception $e) {
            logError("Error fetching blog posts for sitemap: " . $e->getMessage());
        }
        
        // 4. AI Prompts
        try {
            $stmt = $pdo->query("
                SELECT id, slug, 
                       COALESCE(updated_at, created_at) as lastmod_date,
                       created_at
                FROM prompts 
                WHERE status = 'APPROVED' 
                ORDER BY COALESCE(updated_at, created_at) DESC
            ");
            $prompts = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($prompts as $prompt) {
                $lastmod = isset($prompt['lastmod_date']) && $prompt['lastmod_date'] 
                    ? date('Y-m-d', strtotime($prompt['lastmod_date'])) 
                    : (isset($prompt['created_at']) && $prompt['created_at'] 
                        ? date('Y-m-d', strtotime($prompt['created_at'])) 
                        : date('Y-m-d'));
                
                $slug = isset($prompt['slug']) && !empty($prompt['slug']) ? $prompt['slug'] : $prompt['id'];
                $allUrls[] = [
                    'loc' => $baseUrl . '/prompt/' . $slug,
                    'lastmod' => $lastmod,
                    'changefreq' => 'weekly',
                    'priority' => '0.7'
                ];
            }
            $breakdown['prompts'] = count($prompts);
        } catch (Exception $e) {
            logError("Error fetching prompts for sitemap: " . $e->getMessage());
        }
        
        // 5. Prompt Categories
        try {
            $stmt = $pdo->query("
                SELECT id, slug, 
                       COALESCE(updated_at, created_at) as lastmod_date,
                       created_at
                FROM prompt_categories 
                WHERE status = 'ACTIVE' 
                ORDER BY COALESCE(updated_at, created_at) DESC
            ");
            $promptCategories = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($promptCategories as $category) {
                $lastmod = isset($category['lastmod_date']) && $category['lastmod_date'] 
                    ? date('Y-m-d', strtotime($category['lastmod_date'])) 
                    : (isset($category['created_at']) && $category['created_at'] 
                        ? date('Y-m-d', strtotime($category['created_at'])) 
                        : date('Y-m-d'));
                
                $slug = isset($category['slug']) && !empty($category['slug']) ? $category['slug'] : $category['id'];
                $allUrls[] = [
                    'loc' => $baseUrl . '/prompts/category/' . $slug,
                    'lastmod' => $lastmod,
                    'changefreq' => 'weekly',
                    'priority' => '0.6'
                ];
            }
            $breakdown['prompt_categories'] = count($promptCategories);
        } catch (Exception $e) {
            logError("Error fetching prompt categories for sitemap: " . $e->getMessage());
        }
        
        // 6. Tool Categories
        try {
            $stmt = $pdo->query("
                SELECT id, slug, 
                       COALESCE(updated_at, created_at) as lastmod_date,
                       created_at
                FROM categories 
                WHERE status = 'ACTIVE' 
                ORDER BY COALESCE(updated_at, created_at) DESC
            ");
            $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($categories as $category) {
                $lastmod = isset($category['lastmod_date']) && $category['lastmod_date'] 
                    ? date('Y-m-d', strtotime($category['lastmod_date'])) 
                    : (isset($category['created_at']) && $category['created_at'] 
                        ? date('Y-m-d', strtotime($category['created_at'])) 
                        : date('Y-m-d'));
                
                $slug = isset($category['slug']) && !empty($category['slug']) ? $category['slug'] : $category['id'];
                $allUrls[] = [
                    'loc' => $baseUrl . '/category/' . $slug,
                    'lastmod' => $lastmod,
                    'changefreq' => 'weekly',
                    'priority' => '0.7'
                ];
            }
            $breakdown['categories'] = count($categories);
        } catch (Exception $e) {
            logError("Error fetching categories for sitemap: " . $e->getMessage());
        }
        
        // 7. Prompt Collections (if exists)
        try {
            $stmt = $pdo->query("
                SELECT id, slug, 
                       COALESCE(updated_at, created_at) as lastmod_date,
                       created_at
                FROM prompt_collections 
                WHERE status = 'ACTIVE' 
                ORDER BY COALESCE(updated_at, created_at) DESC
            ");
            $collections = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($collections as $collection) {
                $lastmod = isset($collection['lastmod_date']) && $collection['lastmod_date'] 
                    ? date('Y-m-d', strtotime($collection['lastmod_date'])) 
                    : (isset($collection['created_at']) && $collection['created_at'] 
                        ? date('Y-m-d', strtotime($collection['created_at'])) 
                        : date('Y-m-d'));
                
                $slug = isset($collection['slug']) && !empty($collection['slug']) ? $collection['slug'] : $collection['id'];
                $allUrls[] = [
                    'loc' => $baseUrl . '/prompts/collection/' . $slug,
                    'lastmod' => $lastmod,
                    'changefreq' => 'weekly',
                    'priority' => '0.6'
                ];
            }
            $breakdown['collections'] = count($collections);
        } catch (Exception $e) {
            // Table might not exist, skip silently
            logError("Prompt collections table not found or error: " . $e->getMessage());
        }
        
        $totalUrls = count($allUrls);
        
        // Split into multiple sitemaps if needed (max 50,000 URLs per sitemap)
        $sitemapIndex = 0;
        $urlChunks = array_chunk($allUrls, $maxUrlsPerSitemap);
        
        // Determine public directory path
        $publicDir = __DIR__ . '/../public';
        if (!is_dir($publicDir)) {
            // Try alternative paths
            $publicDir = __DIR__ . '/../../public';
            if (!is_dir($publicDir)) {
                $publicDir = dirname(__DIR__) . '/public';
            }
        }
        
        // Create public directory if it doesn't exist
        if (!is_dir($publicDir)) {
            @mkdir($publicDir, 0755, true);
        }
        
        foreach ($urlChunks as $chunkIndex => $urlChunk) {
            $sitemapIndex++;
            $filename = $sitemapIndex === 1 ? 'sitemap.xml' : "sitemap-{$sitemapIndex}.xml";
            $filepath = $publicDir . '/' . $filename;
            
            // Generate XML sitemap
            $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
            $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
            
            foreach ($urlChunk as $url) {
                $xml .= "  <url>\n";
                $xml .= "    <loc>" . htmlspecialchars($url['loc'], ENT_XML1, 'UTF-8') . "</loc>\n";
                $xml .= "    <lastmod>" . htmlspecialchars($url['lastmod'], ENT_XML1, 'UTF-8') . "</lastmod>\n";
                $xml .= "    <changefreq>" . htmlspecialchars($url['changefreq'], ENT_XML1, 'UTF-8') . "</changefreq>\n";
                $xml .= "    <priority>" . htmlspecialchars($url['priority'], ENT_XML1, 'UTF-8') . "</priority>\n";
                $xml .= "  </url>\n";
            }
            
            $xml .= '</urlset>';
            
            // Write to file
            file_put_contents($filepath, $xml);
            
            $sitemapFiles[] = [
                'filename' => $filename,
                'url' => $baseUrl . '/' . $filename,
                'url_count' => count($urlChunk),
                'filepath' => $filepath
            ];
        }
        
        // Generate sitemap index if multiple sitemaps
        if (count($sitemapFiles) > 1) {
            $indexFilepath = $publicDir . '/sitemap.xml';
            $indexXml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
            $indexXml .= '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
            
            foreach ($sitemapFiles as $sitemap) {
                $indexXml .= "  <sitemap>\n";
                $indexXml .= "    <loc>" . htmlspecialchars($sitemap['url'], ENT_XML1, 'UTF-8') . "</loc>\n";
                $indexXml .= "    <lastmod>" . date('Y-m-d') . "</lastmod>\n";
                $indexXml .= "  </sitemap>\n";
            }
            
            $indexXml .= '</sitemapindex>';
            file_put_contents($indexFilepath, $indexXml);
        }
        
        // Close connection
        closeDBConnection();
        
        // Return response
        sendResponse([
            'success' => true,
            'message' => 'Sitemaps generated successfully',
            'total_urls' => $totalUrls,
            'sitemap_count' => count($sitemapFiles),
            'sitemap_index_url' => $baseUrl . '/sitemap.xml',
            'sitemaps' => array_map(function($s) {
                return [
                    'url' => $s['url'],
                    'url_count' => $s['url_count']
                ];
            }, $sitemapFiles),
            'generated_at' => date('Y-m-d H:i:s'),
            'breakdown' => $breakdown
        ]);
        
    } catch (Exception $e) {
        logError("Sitemap generation error: " . $e->getMessage());
        sendError('Failed to generate sitemaps: ' . $e->getMessage(), 500, 'SITEMAP_ERROR');
    }
} else {
    sendError('Invalid action', 400, 'INVALID_ACTION');
}

