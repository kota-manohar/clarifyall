import cachedDbService from './cachedDbService';

// Get all categories (uses cached service)
export const getCategories = async () => {
  return await cachedDbService.getCategories();
};

// Get category by ID (uses cached service)
export const getCategoryById = async (id) => {
  try {
    const category = await cachedDbService.getCategoryById(id);
    if (!category) {
      console.warn(`Category with ID ${id} not found`);
      return null; // Return null instead of throwing error
    }
    return category;
  } catch (err) {
    console.warn(`Error fetching category ${id}:`, err);
    return null; // Return null instead of throwing error
  }
};

// Get category by slug (uses cached service)
export const getCategoryBySlug = async (slug) => {
  const categories = await cachedDbService.getCategories();
  const category = categories.find(cat => cat.slug === slug);
  if (!category) {
    throw new Error('Category not found');
  }
  return category;
};

// Export as default object as well for backward compatibility
export default {
  getCategories,
  getCategoryById,
  getCategoryBySlug,
};
