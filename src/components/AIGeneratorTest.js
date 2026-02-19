import React, { useState } from 'react';
import '../styles/AIGeneratorTest.css';

// OpenRouter API Configuration
const OPENROUTER_API_KEY = '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';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const SITE_URL = 'https://clarifyall.com';
const SITE_NAME = 'ClarifyAll';

function AIGeneratorTest() {
  // Tool Generator States
  const [toolName, setToolName] = useState('');
  const [toolGenerating, setToolGenerating] = useState(false);
  const [toolResult, setToolResult] = useState(null);
  const [toolError, setToolError] = useState('');

  // Blog Generator States
  const [blogSubject, setBlogSubject] = useState('');
  const [blogArticleType, setBlogArticleType] = useState('general');
  const [blogIndustry, setBlogIndustry] = useState('');
  const [blogTool1, setBlogTool1] = useState('');
  const [blogTool2, setBlogTool2] = useState('');
  const [blogGenerating, setBlogGenerating] = useState(false);
  const [blogResult, setBlogResult] = useState(null);
  const [blogError, setBlogError] = useState('');

  // Direct OpenRouter API call for Tool Generator
  const handleTestToolGenerator = async () => {
    if (!toolName.trim()) {
      setToolError('Please enter a tool name');
      return;
    }

    setToolGenerating(true);
    setToolError('');
    setToolResult(null);

    try {
      const prompt = `Generate comprehensive information for an AI tool called "${toolName.trim()}".

You must respond with ONLY a valid JSON object. No explanations, no markdown, no code blocks, no additional text.

Required JSON structure:
{
  "name": "${toolName.trim()}",
  "shortDescription": "Brief marketing description (1-2 sentences, max 150 characters)",
  "fullDescription": "Comprehensive detailed description (8-12 sentences) covering: core features and capabilities, how it works, key use cases, supported platforms/integrations, pricing/rate limits, any limitations, target audience, and main benefits over competitors",
  "websiteUrl": "Official website URL",
  "pricingModel": "FREE, FREEMIUM, FREE_TRIAL, PAID, or OPEN_SOURCE",
  "features": ["feature 1", "feature 2", "feature 3", "feature 4", "feature 5"],
  "categories": ["Most relevant category"],
  "useCases": ["Use case 1", "Use case 2", "Use case 3", "Use case 4", "Use case 5"],
  "pros": ["Advantage 1", "Advantage 2", "Advantage 3"],
  "cons": ["Limitation 1", "Limitation 2", "Limitation 3"],
  "metaDescription": "SEO-optimized meta description (150-160 characters) for search engines"
}

Guidelines:
- Be factual and accurate
- fullDescription must be detailed and comprehensive (8-12 sentences minimum)
- Include information about: features, usage, rate limits, limitations, integrations
- pros should highlight key advantages and strengths
- cons should mention honest limitations or drawbacks
- metaDescription should be compelling and include the tool name and key benefits
- Return ONLY the JSON object, nothing else`;

      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': SITE_URL,
          'X-Title': SITE_NAME,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemma-3-12b-it:free',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`API error: ${response.status} - ${errorData.error?.message || errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || '';

      if (!aiResponse) {
        throw new Error('Empty response from OpenRouter API');
      }

      // Parse JSON from AI response
      let parsedData;
      try {
        parsedData = JSON.parse(aiResponse);
      } catch (parseError) {
        // Try to extract JSON from response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse JSON from AI response');
        }
      }

      // Normalize pricing model
      const pricingModel = (parsedData.pricingModel || 'FREE').toUpperCase();
      const pricingMap = {
        'FREEMIUM': 'FREEMIUM',
        'FREMIUM': 'FREEMIUM',
        'FREE_TRIAL': 'FREE_TRIAL',
        'TRIAL': 'FREE_TRIAL',
        'OPEN_SOURCE': 'OPEN_SOURCE',
        'OPENSOURCE': 'OPEN_SOURCE',
        'PAID': 'PAID',
        'PRICE': 'PAID',
        'FREE': 'FREE'
      };
      parsedData.pricingModel = pricingMap[pricingModel] || 'FREE';

      setToolResult(parsedData);
      setToolError('');
    } catch (error) {
      setToolError(error.message || 'Failed to generate tool info');
      setToolResult(null);
      console.error('Tool generation error:', error);
    } finally {
      setToolGenerating(false);
    }
  };

  // Build blog prompt based on article type
  const buildBlogPrompt = (subject, articleType, tools, industry) => {
    const baseRequirements = `CRITICAL REQUIREMENTS:
1. Write in a conversational, engaging style with a unique voice
2. Use personal experiences, anecdotes, and real-world examples where appropriate
3. Avoid generic AI-sounding phrases or patterns
4. Write naturally - vary sentence structure and tone
5. Include specific details, examples, and insights that feel authentic
6. Make the content valuable, informative, and well-researched
7. Use transition words naturally between paragraphs
8. Avoid repetitive phrasing or robotic language
9. Write a LONG, comprehensive article (2000+ words minimum)`;

    switch (articleType) {
      case 'top10':
        const toolsList = tools.length > 0 ? tools.join(', ') : 'various AI tools';
        const industryContext = industry ? ` for ${industry}` : '';
        return `Write a comprehensive, engaging blog post titled "Top 10 AI Tools${industryContext}" as if it were written by an expert blogger with personal experience and insights. Make it sound natural, human-written, and authentic.

Topic: Top 10 AI Tools${industryContext}
Tools to include: ${toolsList}

${baseRequirements}

CRITICAL: You MUST respond with ONLY a valid JSON object. No explanations, no markdown formatting, no code blocks, no text before or after the JSON. Start directly with { and end with }.

Required JSON structure (copy this exact format):
{
  "title": "Compelling, SEO-friendly title like 'Top 10 AI Tools for [Industry] in 2024' (50-70 characters)",
  "excerpt": "Engaging short summary (1-2 sentences) that hooks the reader",
  "content": "VERY LONG and comprehensive blog post content (minimum 2000 words). Structure: Introduction, then detailed sections for each of the 10 tools with: tool name, key features, pricing, pros/cons, best use cases, and why it made the list. Use proper HTML formatting with <p>, <h2>, <h3>, <ul>, <li>, <strong>, and <em> tags. Include headings for each tool. End with a comparison table and conclusion.",
  "tags": ["AI Tools", "Top 10", "${industry}", "Technology", "Productivity"],
  "category": "AI Tools",
  "meta_title": "SEO-optimized meta title (50-60 characters) for search engines, include main keywords",
  "meta_description": "SEO-optimized meta description (150-160 characters) that summarizes the article and includes key terms"
}

Remember: Return ONLY the JSON object, nothing else.`;

      case 'howto':
        return `Write a comprehensive, step-by-step guide blog post about how to use an AI tool for a specific task. Make it sound natural, human-written, and authentic.

Topic: How to Use ${subject}

${baseRequirements}

CRITICAL: You MUST respond with ONLY a valid JSON object. No explanations, no markdown formatting, no code blocks, no text before or after the JSON. Start directly with { and end with }.

Required JSON structure (copy this exact format):
{
  "title": "Compelling, SEO-friendly title like 'How to Use [Tool] for [Task]: Complete Guide' (50-70 characters)",
  "excerpt": "Engaging short summary (1-2 sentences) that hooks the reader",
  "content": "VERY LONG and comprehensive guide (minimum 2000 words). Structure: Introduction, Prerequisites, Step-by-step instructions with screenshots descriptions, Tips and best practices, Common mistakes to avoid, Advanced techniques, Troubleshooting, Conclusion. Use proper HTML formatting with <p>, <h2>, <h3>, <ol>, <ul>, <li>, <strong>, <code>, and <em> tags. Number each step clearly.",
  "tags": ["Tutorial", "How-to", "AI Tools", "Guide"],
  "category": "Tutorials",
  "meta_title": "SEO-optimized meta title (50-60 characters) for search engines, include main keywords",
  "meta_description": "SEO-optimized meta description (150-160 characters) that summarizes the article and includes key terms"
}

Remember: Return ONLY the JSON object, nothing else.`;

      case 'comparison':
        const tool1 = tools[0] || 'Tool 1';
        const tool2 = tools[1] || 'Tool 2';
        return `Write a comprehensive comparison blog post between two AI tools. Make it sound natural, human-written, and authentic.

Topic: ${tool1} vs ${tool2}: Complete Comparison

${baseRequirements}

CRITICAL: You MUST respond with ONLY a valid JSON object. No explanations, no markdown formatting, no code blocks, no text before or after the JSON. Start directly with { and end with }.

Required JSON structure (copy this exact format):
{
  "title": "Compelling, SEO-friendly title like '[Tool1] vs [Tool2]: Which is Better in 2024?' (50-70 characters)",
  "excerpt": "Engaging short summary (1-2 sentences) that hooks the reader",
  "content": "VERY LONG and comprehensive comparison (minimum 2000 words). Structure: Introduction, Overview of both tools, Detailed comparison: Pricing, Features, Ease of Use, Performance, Integrations, Customer Support, Use Cases, Pros and Cons of each, Side-by-side comparison table, Verdict and recommendation, Conclusion. Use proper HTML formatting with <p>, <h2>, <h3>, <table>, <ul>, <li>, <strong>, and <em> tags.",
  "tags": ["Comparison", "AI Tools", "Review", "${tool1}", "${tool2}"],
  "category": "Reviews",
  "meta_title": "SEO-optimized meta title (50-60 characters) for search engines, include main keywords",
  "meta_description": "SEO-optimized meta description (150-160 characters) that summarizes the article and includes key terms"
}

Remember: Return ONLY the JSON object, nothing else.`;

      default:
        return `Write a comprehensive, engaging blog post about the following topic as if it were written by an expert blogger with personal experience and insights. Make it sound natural, human-written, and authentic.

Topic: ${subject}

${baseRequirements}

CRITICAL: You MUST respond with ONLY a valid JSON object. No explanations, no markdown formatting, no code blocks, no text before or after the JSON. Start directly with { and end with }.

Required JSON structure (copy this exact format):
{
  "title": "Compelling, SEO-friendly blog post title (50-60 characters)",
  "excerpt": "Engaging short summary (1-2 sentences) that hooks the reader",
  "content": "VERY LONG and comprehensive blog post content (minimum 2000 words). Write extensively with multiple sections. Use proper HTML formatting with <p>, <h2>, <h3>, <ul>, <li>, <strong>, and <em> tags. Include headings every 2-3 paragraphs. Make it detailed, valuable, and thorough with deep insights.",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "category": "Most relevant category",
  "meta_title": "SEO-optimized meta title (50-60 characters) for search engines, include main keywords",
  "meta_description": "SEO-optimized meta description (150-160 characters) that summarizes the article and includes key terms"
}

Remember: Return ONLY the JSON object, nothing else.`;
    }
  };

  // Direct OpenRouter API call for Blog Generator
  const handleTestBlogGenerator = async () => {
    if (!blogSubject.trim()) {
      setBlogError('Please enter a blog subject');
      return;
    }

    if (blogArticleType === 'comparison' && (!blogTool1.trim() || !blogTool2.trim())) {
      setBlogError('Please enter both tool names for comparison');
      return;
    }

    setBlogGenerating(true);
    setBlogError('');
    setBlogResult(null);

    try {
      const tools = blogArticleType === 'comparison' ? [blogTool1, blogTool2] : [];
      const prompt = buildBlogPrompt(blogSubject.trim(), blogArticleType, tools, blogIndustry.trim());

      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': SITE_URL,
          'X-Title': SITE_NAME,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemma-3-12b-it:free',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.85,
          max_tokens: 12000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`API error: ${response.status} - ${errorData.error?.message || errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || '';

      if (!aiResponse) {
        throw new Error('Empty response from OpenRouter API');
      }

      // Parse JSON from AI response
      let parsedData;
      try {
        parsedData = JSON.parse(aiResponse);
      } catch (parseError) {
        // Try to extract JSON from response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse JSON from AI response: ' + parseError.message);
        }
      }

      // Validate required fields
      if ((!parsedData.title || parsedData.title === '') && (!parsedData.content || parsedData.content === '')) {
        throw new Error('AI response missing required fields');
      }

      // Generate meta_title and meta_description if not provided
      let metaTitle = parsedData.meta_title || '';
      let metaDescription = parsedData.meta_description || '';

      // Fallback: generate from title and excerpt if not provided
      if (!metaTitle && parsedData.title) {
        metaTitle = parsedData.title;
        if (metaTitle.length > 60) {
          metaTitle = metaTitle.substring(0, 57) + '...';
        }
      }

      if (!metaDescription && parsedData.excerpt) {
        metaDescription = parsedData.excerpt;
        if (metaDescription.length > 160) {
          metaDescription = metaDescription.substring(0, 157) + '...';
        }
      }

      setBlogResult({
        title: parsedData.title || 'Untitled Article',
        excerpt: parsedData.excerpt || '',
        content: parsedData.content || '',
        tags: parsedData.tags || [],
        category: parsedData.category || 'General',
        meta_title: metaTitle,
        meta_description: metaDescription
      });
      setBlogError('');
    } catch (error) {
      setBlogError(error.message || 'Failed to generate blog post');
      setBlogResult(null);
      console.error('Blog generation error:', error);
    } finally {
      setBlogGenerating(false);
    }
  };

  return (
    <div className="ai-generator-test">
      <div className="test-header">
        <h1>🤖 AI Generator Test Page</h1>
        <p>Test both AI generators to verify functionality</p>
      </div>

      <div className="test-container">
        {/* Tool Generator Test */}
        <div className="test-section">
          <div className="test-section-header">
            <h2>🤖 AI Tool Information Generator</h2>
            <p>Generate comprehensive tool information from tool name</p>
          </div>

          <div className="test-form">
            <div className="form-group">
              <label>Tool Name *</label>
              <input
                type="text"
                value={toolName}
                onChange={(e) => setToolName(e.target.value)}
                placeholder="e.g., ChatGPT, Midjourney, Claude"
                className="test-input"
                onKeyPress={(e) => e.key === 'Enter' && !toolGenerating && handleTestToolGenerator()}
              />
            </div>

            <button
              onClick={handleTestToolGenerator}
              disabled={toolGenerating || !toolName.trim()}
              className="test-btn btn-primary"
            >
              {toolGenerating ? '✨ Generating...' : '✨ Generate Tool Info'}
            </button>

            {toolError && (
              <div className="test-error">
                <strong>Error:</strong> {toolError}
              </div>
            )}

            {toolGenerating && (
              <div className="test-loading">
                <div className="spinner"></div>
                <span>Generating tool information...</span>
              </div>
            )}

            {toolResult && (
              <div className="test-result">
                <h3>Generated Result:</h3>
                <div className="result-content">
                  <div className="result-field">
                    <strong>Name:</strong> {toolResult.name || 'N/A'}
                  </div>
                  <div className="result-field">
                    <strong>Short Description:</strong> {toolResult.shortDescription || 'N/A'}
                  </div>
                  <div className="result-field">
                    <strong>Full Description:</strong>
                    <div dangerouslySetInnerHTML={{ __html: toolResult.fullDescription || 'N/A' }} />
                  </div>
                  <div className="result-field">
                    <strong>Website URL:</strong> {toolResult.websiteUrl || 'N/A'}
                  </div>
                  <div className="result-field">
                    <strong>Pricing Model:</strong> {toolResult.pricingModel || 'N/A'}
                  </div>
                  <div className="result-field">
                    <strong>Features:</strong>
                    <ul>
                      {(toolResult.features || []).map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="result-field">
                    <strong>Categories:</strong> {(toolResult.categories || []).join(', ') || 'N/A'}
                  </div>
                  <div className="result-field">
                    <strong>Use Cases:</strong>
                    <ul>
                      {(toolResult.useCases || []).map((useCase, idx) => (
                        <li key={idx}>{useCase}</li>
                      ))}
                    </ul>
                  </div>
                  {toolResult.pros && (
                    <div className="result-field">
                      <strong>Pros:</strong>
                      <ul>
                        {toolResult.pros.map((pro, idx) => (
                          <li key={idx}>{pro}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {toolResult.cons && (
                    <div className="result-field">
                      <strong>Cons:</strong>
                      <ul>
                        {toolResult.cons.map((con, idx) => (
                          <li key={idx}>{con}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {toolResult.metaDescription && (
                    <div className="result-field">
                      <strong>Meta Description:</strong> {toolResult.metaDescription}
                    </div>
                  )}
                </div>
                <pre className="result-json">{JSON.stringify(toolResult, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Blog Generator Test */}
        <div className="test-section">
          <div className="test-section-header">
            <h2>🤖 AI Blog Post Generator</h2>
            <p>Generate comprehensive blog posts with different article types</p>
          </div>

          <div className="test-form">
            <div className="form-group">
              <label>Article Type</label>
              <select
                value={blogArticleType}
                onChange={(e) => setBlogArticleType(e.target.value)}
                className="test-input"
              >
                <option value="general">General Article</option>
                <option value="top10">Top 10 List</option>
                <option value="howto">How-To Guide</option>
                <option value="comparison">Tool Comparison</option>
              </select>
            </div>

            {blogArticleType === 'top10' && (
              <div className="form-group">
                <label>Industry (Optional)</label>
                <input
                  type="text"
                  value={blogIndustry}
                  onChange={(e) => setBlogIndustry(e.target.value)}
                  placeholder="e.g., Marketing, Design, Development"
                  className="test-input"
                />
              </div>
            )}

            {blogArticleType === 'comparison' && (
              <div className="form-group-row">
                <div className="form-group">
                  <label>Tool 1</label>
                  <input
                    type="text"
                    value={blogTool1}
                    onChange={(e) => setBlogTool1(e.target.value)}
                    placeholder="e.g., ChatGPT"
                    className="test-input"
                  />
                </div>
                <div className="form-group">
                  <label>Tool 2</label>
                  <input
                    type="text"
                    value={blogTool2}
                    onChange={(e) => setBlogTool2(e.target.value)}
                    placeholder="e.g., Claude"
                    className="test-input"
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Blog Subject/Topic *</label>
              <input
                type="text"
                value={blogSubject}
                onChange={(e) => setBlogSubject(e.target.value)}
                placeholder={
                  blogArticleType === 'top10' ? "e.g., 'Top 10 AI Tools for Marketing'" :
                    blogArticleType === 'howto' ? "e.g., 'How to Use ChatGPT for Content Writing'" :
                      blogArticleType === 'comparison' ? "e.g., 'ChatGPT vs Claude'" :
                        "e.g., 'Best AI Tools for Small Businesses in 2024'"
                }
                className="test-input"
                onKeyPress={(e) => e.key === 'Enter' && !blogGenerating && handleTestBlogGenerator()}
              />
            </div>

            <button
              onClick={handleTestBlogGenerator}
              disabled={blogGenerating || !blogSubject.trim()}
              className="test-btn btn-primary"
            >
              {blogGenerating ? '✨ Generating...' : '✨ Generate Blog Post'}
            </button>

            {blogError && (
              <div className="test-error">
                <strong>Error:</strong> {blogError}
              </div>
            )}

            {blogGenerating && (
              <div className="test-loading">
                <div className="spinner"></div>
                <span>Generating blog post... This may take a minute.</span>
              </div>
            )}

            {blogResult && (
              <div className="test-result">
                <h3>Generated Blog Post:</h3>
                <div className="result-content">
                  <div className="result-field">
                    <strong>Title:</strong> {blogResult.title || 'N/A'}
                  </div>
                  <div className="result-field">
                    <strong>Excerpt:</strong> {blogResult.excerpt || 'N/A'}
                  </div>
                  <div className="result-field">
                    <strong>Content:</strong>
                    <div
                      className="blog-content-preview"
                      dangerouslySetInnerHTML={{ __html: blogResult.content || 'N/A' }}
                    />
                  </div>
                  <div className="result-field">
                    <strong>Tags:</strong> {(blogResult.tags || []).join(', ') || 'N/A'}
                  </div>
                  <div className="result-field">
                    <strong>Category:</strong> {blogResult.category || 'N/A'}
                  </div>
                  {blogResult.meta_title && (
                    <div className="result-field">
                      <strong>SEO Meta Title:</strong> {blogResult.meta_title}
                      <small style={{ display: 'block', marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
                        {blogResult.meta_title.length}/60 characters
                      </small>
                    </div>
                  )}
                  {blogResult.meta_description && (
                    <div className="result-field">
                      <strong>SEO Meta Description:</strong> {blogResult.meta_description}
                      <small style={{ display: 'block', marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
                        {blogResult.meta_description.length}/160 characters
                      </small>
                    </div>
                  )}
                </div>
                <pre className="result-json">{JSON.stringify(blogResult, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIGeneratorTest;

