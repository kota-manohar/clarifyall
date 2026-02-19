/**
 * OpenRouter AI Service
 * Uses PHP backend API to generate tool information from tool names
 */

const API_BASE_URL = 'https://clarifyall.com/php-api';

/**
 * Generate tool information using AI
 * @param {string} toolName - The name of the tool
 * @returns {Promise<Object>} Generated tool data
 */
export async function generateToolInfo(toolName) {
  try {
    const response = await fetch(`${API_BASE_URL}/openrouter.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        toolName: toolName
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();

    // Data is already normalized by the backend
    return {
      name: data.name || toolName,
      shortDescription: data.shortDescription || '',
      fullDescription: data.fullDescription || '',
      websiteUrl: data.websiteUrl || '',
      pricingModel: data.pricingModel || 'FREE',
      features: data.features || [],
      categories: data.categories || [],
      useCases: data.useCases || []
    };
  } catch (error) {
    console.error('Error generating tool info:', error);
    throw new Error(`Failed to generate tool information: ${error.message}`);
  }
}

/**
 * Generate blog post content using AI
 * @param {string} subject - The blog topic/subject
 * @returns {Promise<Object>} Generated blog post data
 */
export async function generateBlogPost(subject) {
  try {
    const response = await fetch(`${API_BASE_URL}/openrouter.php/blog`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subject: subject
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();

    return {
      title: data.title || '',
      excerpt: data.excerpt || '',
      content: data.content || '',
      tags: data.tags || [],
      category: data.category || 'General'
    };
  } catch (error) {
    console.error('Error generating blog post:', error);
    throw new Error(`Failed to generate blog post: ${error.message}`);
  }
}

/**
 * Generate pros and cons for a tool
 * @param {string} toolName - The name of the tool
 * @param {string} description - Optional existing description
 * @returns {Promise<Object>} Pros and cons data
 */
export async function generateProsCons(toolName, description = '') {
  try {
    const response = await fetch(`${API_BASE_URL}/openrouter.php/pros-cons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        toolName: toolName,
        description: description
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    return {
      pros: data.pros || [],
      cons: data.cons || []
    };
  } catch (error) {
    console.error('Error generating pros/cons:', error);
    throw new Error(`Failed to generate pros/cons: ${error.message}`);
  }
}

/**
 * Generate comparison between two tools
 * @param {string} tool1 - First tool name
 * @param {string} tool2 - Second tool name
 * @param {string} useCase - Optional use case to focus on
 * @returns {Promise<Object>} Comparison data
 */
export async function generateComparison(tool1, tool2, useCase = '') {
  try {
    const response = await fetch(`${API_BASE_URL}/openrouter.php/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tool1: tool1,
        tool2: tool2,
        useCase: useCase
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating comparison:', error);
    throw new Error(`Failed to generate comparison: ${error.message}`);
  }
}

/**
 * Generate SEO meta description
 * @param {string} toolName - The name of the tool
 * @param {string} description - Optional existing description
 * @returns {Promise<Object>} Meta description
 */
export async function generateMetaDescription(toolName, description = '') {
  try {
    const response = await fetch(`${API_BASE_URL}/openrouter.php/meta-description`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        toolName: toolName,
        description: description
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    return {
      metaDescription: data.metaDescription || ''
    };
  } catch (error) {
    console.error('Error generating meta description:', error);
    throw new Error(`Failed to generate meta description: ${error.message}`);
  }
}

/**
 * Generate use cases for a tool
 * @param {string} toolName - The name of the tool
 * @param {string} description - Optional existing description
 * @returns {Promise<Object>} Use cases data
 */
export async function generateUseCases(toolName, description = '') {
  try {
    const response = await fetch(`${API_BASE_URL}/openrouter.php/use-cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        toolName: toolName,
        description: description
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    return {
      useCases: data.useCases || []
    };
  } catch (error) {
    console.error('Error generating use cases:', error);
    throw new Error(`Failed to generate use cases: ${error.message}`);
  }
}

/**
 * Generate blog post with different types
 * @param {string} subject - The blog topic/subject
 * @param {string} articleType - Type: 'general', 'top10', 'howto', 'comparison'
 * @param {Array} tools - Array of tool names (for top10/comparison)
 * @param {string} industry - Industry name (for top10)
 * @returns {Promise<Object>} Generated blog post data
 */
export async function generateBlogPostAdvanced(subject, articleType = 'general', tools = [], industry = '') {
  try {
    const response = await fetch(`${API_BASE_URL}/openrouter.php/blog`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subject: subject,
        articleType: articleType,
        tools: tools,
        industry: industry
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating blog post:', error);
    throw new Error(`Failed to generate blog post: ${error.message}`);
  }
}

/**
 * Generate AI prompt for image or video
 * @param {string} promptType - 'IMAGE' or 'VIDEO'
 * @param {string} description - Description of what the prompt should create
 * @param {string} style - Optional style preference (e.g., 'cinematic', 'realistic', 'anime')
 * @param {string} toolName - Optional AI tool name (e.g., 'Midjourney', 'DALL-E', 'Stable Diffusion')
 * @returns {Promise<Object>} Generated prompt data
 */
export async function generateAIPrompt(promptType, description, style = '', toolName = '') {
  try {
    const response = await fetch(`${API_BASE_URL}/openrouter.php/prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        promptType: promptType,
        description: description,
        style: style,
        toolName: toolName
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();

    return {
      title: data.title || '',
      description: data.description || '',
      prompt_text: data.prompt_text || '',
      tags: data.tags || [],
      difficulty: data.difficulty || 'BEGINNER',
      parameters: data.parameters || {}
    };
  } catch (error) {
    console.error('Error generating AI prompt:', error);
    throw new Error(`Failed to generate AI prompt: ${error.message}`);
  }
}

/**
 * Check if OpenRouter API is available
 * Note: This is a simplified check - the actual availability is checked by the backend
 */
export async function checkOpenRouterAvailability() {
  try {
    const response = await fetch(`${API_BASE_URL}/openrouter.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        toolName: 'test'
      })
    });
    return response.ok;
  } catch {
    return false;
  }
}

export default {
  generateToolInfo,
  generateBlogPost,
  generateBlogPostAdvanced,
  generateProsCons,
  generateComparison,
  generateMetaDescription,
  generateUseCases,
  generateAIPrompt,
  checkOpenRouterAvailability
};

