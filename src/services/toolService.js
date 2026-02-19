import cachedDbService from './cachedDbService';

// Get all tools with filters (uses cached service)
export const getTools = async (filters = {}) => {
  const response = await cachedDbService.getTools(filters);
  // cachedDbService now returns full response with pagination
  return response;
};

// Get tool by ID (uses cached service)
export const getToolById = async (id) => {
  const tool = await cachedDbService.getToolById(id);
  if (!tool) {
    throw new Error('Tool not found');
  }
  return tool;
};

// Submit a new tool
export const submitTool = async (toolData, logoFile) => {
  // First, upload the logo if provided
  let logoUrl = '/logos/default.png';

  if (logoFile) {
    try {
      const uploadResult = await cachedDbService.uploadLogo(logoFile);
      logoUrl = uploadResult.logoUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      // Continue with default logo if upload fails
    }
  }

  const toolToSubmit = {
    ...toolData,
    logoUrl
  };

  const toolId = await cachedDbService.createTool(toolToSubmit);

  return {
    success: true,
    message: 'Tool submitted successfully! It will be reviewed and published soon.',
    toolId
  };
};

// Increment view count
export const incrementViewCount = async (id) => {
  await cachedDbService.incrementViewCount(id);
  return { success: true };
};

// Increment save count
export const incrementSaveCount = async (id) => {
  // This will be handled by user save/unsave actions
  return { success: true };
};

// Get popular tools (uses cached service)
export const getPopularTools = async () => {
  const tools = await cachedDbService.getTools({ sortBy: 'popular', size: 6 });
  return tools;
};

// Get recent tools (uses cached service)
export const getRecentTools = async () => {
  const tools = await cachedDbService.getTools({ sortBy: 'recent', size: 6 });
  return tools;
};

// Get similar tools based on category and related content
export const getSimilarTools = async (id) => {
  try {
    const currentTool = await cachedDbService.getToolById(id);
    if (!currentTool) return [];

    const relatedTools = [];
    const seenIds = new Set([parseInt(id)]);

    // 1. Get tools from same category (primary match)
    if (currentTool.category_id) {
      try {
        const categoryTools = await cachedDbService.getTools({
          categoryId: currentTool.category_id,
          size: 10
        });
        const tools = categoryTools.tools || categoryTools || [];
        for (const tool of tools) {
          if (tool.id && !seenIds.has(parseInt(tool.id))) {
            relatedTools.push(tool);
            seenIds.add(parseInt(tool.id));
            if (relatedTools.length >= 6) break;
          }
        }
      } catch (err) {
        console.warn('Error loading tools by category:', err);
      }
    }

    // 2. If we don't have enough, get tools with similar pricing model
    const currentPricingModel = currentTool.pricingModel || currentTool.pricing_model;
    if (relatedTools.length < 6 && currentPricingModel) {
      try {
        const pricingTools = await cachedDbService.getTools({
          size: 20
        });
        const tools = pricingTools.tools || pricingTools || [];
        for (const tool of tools) {
          const toolPricingModel = tool.pricingModel || tool.pricing_model;
          if (tool.id && !seenIds.has(parseInt(tool.id)) &&
            toolPricingModel === currentPricingModel) {
            relatedTools.push(tool);
            seenIds.add(parseInt(tool.id));
            if (relatedTools.length >= 6) break;
          }
        }
      } catch (err) {
        console.warn('Error loading tools by pricing:', err);
      }
    }

    // 3. If still not enough, get popular tools
    if (relatedTools.length < 6) {
      try {
        const popularTools = await cachedDbService.getTools({
          sortBy: 'popular',
          size: 20
        });
        const tools = popularTools.tools || popularTools || [];
        for (const tool of tools) {
          if (tool.id && !seenIds.has(parseInt(tool.id))) {
            relatedTools.push(tool);
            seenIds.add(parseInt(tool.id));
            if (relatedTools.length >= 6) break;
          }
        }
      } catch (err) {
        console.warn('Error loading popular tools:', err);
      }
    }

    return relatedTools.slice(0, 6);
  } catch (error) {
    console.error('Error loading similar tools:', error);
    return [];
  }
};

// Export as default object as well for backward compatibility
export default {
  getTools,
  getToolById,
  submitTool,
  incrementViewCount,
  incrementSaveCount,
  getPopularTools,
  getRecentTools,
  getSimilarTools,
};
