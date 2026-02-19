import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

// Helper function to generate dynamic keywords from content
const generateKeywords = (baseKeywords, dynamicData = {}) => {
  const keywordArray = [];
  
  // Base keywords
  if (baseKeywords) {
    if (typeof baseKeywords === 'string') {
      keywordArray.push(...baseKeywords.split(',').map(k => k.trim()));
    } else if (Array.isArray(baseKeywords)) {
      keywordArray.push(...baseKeywords);
    }
  }
  
  // Add dynamic keywords from data
  if (dynamicData.category) {
    keywordArray.push(`${dynamicData.category} AI tools`);
    keywordArray.push(`best ${dynamicData.category} tools`);
  }
  
  if (dynamicData.name) {
    keywordArray.push(dynamicData.name);
    keywordArray.push(`${dynamicData.name} AI`);
    keywordArray.push(`${dynamicData.name} review`);
  }
  
  if (dynamicData.pricingModel) {
    keywordArray.push(`${dynamicData.pricingModel} AI tools`);
    keywordArray.push(`${dynamicData.pricingModel === 'FREE' ? 'free' : dynamicData.pricingModel.toLowerCase()} AI software`);
  }
  
  if (dynamicData.tags && Array.isArray(dynamicData.tags)) {
    keywordArray.push(...dynamicData.tags);
  }
  
  // Add comprehensive AI-related keywords
  keywordArray.push(
    'AI tools',
    'artificial intelligence',
    'AI directory',
    'AI software',
    'machine learning tools',
    'AI applications',
    'generative AI',
    'large language models',
    'LLM',
    'GPT-4',
    'GPT-3',
    'ChatGPT',
    'Claude AI',
    'Gemini',
    'AI chatbot',
    'AI assistant',
    'virtual assistant',
    'AI automation',
    'AI productivity',
    'AI writing tools',
    'AI image generator',
    'AI video tools',
    'AI coding tools',
    'AI design tools',
    'AI marketing tools',
    'AI development tools',
    'AI business tools',
    'AI content creation',
    'AI copywriting',
    'AI translation',
    'AI transcription',
    'AI voice tools',
    'AI music generator',
    'AI video editing',
    'AI photo editing',
    'AI logo generator',
    'AI website builder',
    'AI SEO tools',
    'AI analytics',
    'AI data analysis',
    'AI research tools',
    'AI education tools',
    'AI healthcare tools',
    'AI finance tools',
    'AI legal tools',
    'AI customer service',
    'AI sales tools',
    'AI HR tools',
    'prompt engineering',
    'AI prompts',
    'image prompts',
    'ChatGPT prompts',
    'Midjourney prompts',
    'DALL-E prompts',
    'Stable Diffusion prompts',
    'Gemini Banana prompts',
    'AI prompt library',
    'best AI tools 2024',
    'best AI tools 2025',
    'free AI tools',
    'paid AI tools',
    'AI tool comparison',
    'AI tool review',
    'AI tool directory',
    'AI software directory',
    'AI tool finder',
    'discover AI tools',
    'compare AI tools',
    'AI tool recommendations',
    'AI trends',
    'AI news',
    'AI blog',
    'AI tutorials',
    'AI guides',
    'AI resources',
    'open source AI',
    'commercial AI',
    'enterprise AI',
    'startup AI tools',
    'AI for business',
    'AI for creators',
    'AI for developers',
    'AI for marketers',
    'AI for designers',
    'AI for writers',
    'AI for students',
    'AI for professionals',
    '2024',
    '2025'
  );
  
  // Remove duplicates and return as comma-separated string
  return [...new Set(keywordArray)].join(', ');
};

// Helper to generate Schema.org structured data
const generateSchemaData = (type, data) => {
  const baseUrl = 'https://clarifyall.com';
  
  switch (type) {
    case 'website':
      return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Clarifyall',
        url: baseUrl,
        description: 'Your comprehensive directory for discovering, comparing, and mastering the best AI tools for every task.',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${baseUrl}/?search={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      };
      
    case 'tool':
      return {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: data.name,
        description: data.description || data.shortDescription,
        applicationCategory: data.category?.name || 'AI Application',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: data.pricingModel === 'FREE' ? '0' : '0',
          priceCurrency: 'USD'
        },
        aggregateRating: data.rating ? {
          '@type': 'AggregateRating',
          ratingValue: data.rating,
          reviewCount: data.reviewCount || 0
        } : undefined,
        url: data.website_url || data.websiteUrl,
        image: data.logo_url || data.logoUrl
      };
      
    case 'article':
      return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: data.title,
        description: data.excerpt || data.summary,
        image: data.featured_image || data.featuredImageUrl,
        datePublished: data.published_at || data.created_at,
        dateModified: data.updated_at || data.published_at || data.created_at,
        author: {
          '@type': 'Organization',
          name: 'Clarifyall'
        },
        publisher: {
          '@type': 'Organization',
          name: 'Clarifyall',
          logo: {
            '@type': 'ImageObject',
            url: `${baseUrl}/logo.png`
          }
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${baseUrl}/blog/${data.slug}`
        }
      };
      
    default:
      return null;
  }
};

function SEO({ 
  title, 
  description, 
  keywords, 
  dynamicKeywords, // New: data object for dynamic keyword generation
  ogTitle, 
  ogDescription, 
  ogImage,
  canonicalUrl,
  schemaType, // Type of schema: 'website', 'tool', 'article'
  schemaData, // Custom schema data (optional, will be generated if not provided)
  noindex = false
}) {
  const location = useLocation();
  const siteUrl = 'https://clarifyall.com';
  const defaultImage = `${siteUrl}/og-image.jpg`;
  
  // Generate dynamic keywords if dynamicKeywords prop is provided
  const finalKeywords = dynamicKeywords 
    ? generateKeywords(keywords, dynamicKeywords)
    : keywords;
  
  // Generate schema data if schemaType is provided
  const finalSchemaData = schemaData || (schemaType ? generateSchemaData(schemaType, dynamicKeywords || {}) : null);
  
  // Full canonical URL
  const fullCanonicalUrl = canonicalUrl ? `${siteUrl}${canonicalUrl}` : `${siteUrl}${location.pathname}`;
  const fullOgImage = ogImage || defaultImage;

  // Ensure description is between 150-220 characters for SEO
  const optimizedDescription = description && description.length < 150 
    ? `${description} Browse our comprehensive AI tools directory, filter by pricing and category, and discover the perfect AI software for your needs.`
    : description;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={optimizedDescription || description} />
      {finalKeywords && <meta name="keywords" content={finalKeywords} />}
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullCanonicalUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={schemaType === 'article' ? 'article' : 'website'} />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:title" content={ogTitle || title} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Clarifyall" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullCanonicalUrl} />
      <meta name="twitter:title" content={ogTitle || title} />
      <meta name="twitter:description" content={ogDescription || description} />
      <meta name="twitter:image" content={fullOgImage} />
      <meta name="twitter:creator" content="@clarifyall" />
      <meta name="twitter:site" content="@clarifyall" />
      
      {/* Additional SEO Tags */}
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"} />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="author" content="Clarifyall" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="geo.region" content="US" />
      <meta name="geo.placename" content="United States" />
      <meta name="rating" content="general" />
      <meta name="distribution" content="global" />
      <meta name="coverage" content="worldwide" />
      <meta name="target" content="all" />
      <meta name="audience" content="all" />
      <meta name="subject" content="AI Tools, Artificial Intelligence, Machine Learning" />
      <meta name="topic" content="AI Tools Directory" />
      <meta name="classification" content="Technology, AI, Software Directory" />
      <meta name="category" content="Technology" />
      <meta name="copyright" content="Clarifyall" />
      <meta name="reply-to" content="info@clarifyall.com" />
      <meta name="owner" content="Clarifyall" />
      <meta name="url" content={fullCanonicalUrl} />
      <meta name="identifier-URL" content={fullCanonicalUrl} />
      <meta name="directory" content="submission" />
      <meta name="pagename" content={title} />
      
      {/* Dublin Core Metadata */}
      <meta name="DC.title" content={title} />
      <meta name="DC.creator" content="Clarifyall" />
      <meta name="DC.subject" content="AI Tools, Artificial Intelligence, Machine Learning" />
      <meta name="DC.description" content={optimizedDescription || description} />
      <meta name="DC.publisher" content="Clarifyall" />
      <meta name="DC.contributor" content="Clarifyall" />
      <meta name="DC.date" content={new Date().toISOString()} />
      <meta name="DC.type" content="InteractiveResource" />
      <meta name="DC.format" content="text/html" />
      <meta name="DC.identifier" content={fullCanonicalUrl} />
      <meta name="DC.source" content={siteUrl} />
      <meta name="DC.language" content="en-US" />
      <meta name="DC.relation" content={siteUrl} />
      <meta name="DC.coverage" content="Worldwide" />
      <meta name="DC.rights" content="Copyright Clarifyall" />
      
      {/* Mobile Optimization */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="Clarifyall" />
      <meta name="theme-color" content="#667eea" />
      <meta name="msapplication-TileColor" content="#667eea" />
      <meta name="msapplication-navbutton-color" content="#667eea" />
      <meta name="application-name" content="Clarifyall" />
      
      {/* Additional Open Graph Tags */}
      <meta property="og:image:alt" content={title} />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:updated_time" content={new Date().toISOString()} />
      
      {/* Additional Twitter Tags */}
      <meta name="twitter:image:alt" content={title} />
      
      {/* Article-specific tags (if article) */}
      {schemaType === 'article' && (
        <>
          <meta property="article:author" content="Clarifyall" />
          <meta property="article:publisher" content="https://www.facebook.com/clarifyall" />
          <meta property="article:section" content="AI Tools" />
          <meta property="article:tag" content="AI Tools" />
          <meta property="article:tag" content="Artificial Intelligence" />
          <meta property="article:tag" content="Technology" />
        </>
      )}
      
      {/* Verification Tags (add your actual verification codes) */}
      {/* <meta name="google-site-verification" content="YOUR_GOOGLE_VERIFICATION_CODE" /> */}
      {/* <meta name="msvalidate.01" content="YOUR_BING_VERIFICATION_CODE" /> */}
      {/* <meta name="yandex-verification" content="YOUR_YANDEX_VERIFICATION_CODE" /> */}
      
      {/* Schema.org Structured Data */}
      {finalSchemaData && (
        <script type="application/ld+json">
          {JSON.stringify(finalSchemaData)}
        </script>
      )}
    </Helmet>
  );
}

export default SEO;
