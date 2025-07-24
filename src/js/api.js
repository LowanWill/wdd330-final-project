/**
 * Tasty API service for fetching recipes
 */
export class TastyApiService {
  constructor() {
    this.baseUrl = 'https://tasty.p.rapidapi.com';
    this.headers = {
      'X-RapidAPI-Key': 'e86b24216fmsh3cbaae6e560bb60p11451ejsncb7da32d1681', //  actual API key
      'X-RapidAPI-Host': 'tasty.p.rapidapi.com'
    };
  }

  /**
   * Search for recipes by keyword
   * @param {string} query - Search keyword
   * @param {number} limit - Number of results (default: 20)
   * @returns {Promise<Array>} Array of recipe objects
   */
  async searchRecipes(query, limit = 20) {
    try {
      const url = `${this.baseUrl}/recipes/list?from=0&size=${limit}&tags=under_30_minutes&q=${encodeURIComponent(query)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return this.formatRecipes(data.results || []);
    } catch (error) {
      console.error('Error searching recipes:', error);
      return [];
    }
  }

  /**
   * Get recipe details by ID
   * @param {string} id - Recipe ID
   * @returns {Promise<Object>} Recipe object
   */
  async getRecipeById(id) {
    try {
      const url = `${this.baseUrl}/recipes/get-more-info?id=${id}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return this.formatRecipe(data);
    } catch (error) {
      console.error('Error fetching recipe details:', error);
      return null;
    }
  }

  /**
   * Format API recipe data to match internal structure
   * @param {Array} recipes - Raw API recipes
   * @returns {Array} Formatted recipes
   */
  formatRecipes(recipes) {
    return recipes.map(recipe => this.formatRecipe(recipe));
  }

  /**
   * Format single API recipe to match internal structure
   * @param {Object} recipe - Raw API recipe
   * @returns {Object} Formatted recipe
   */
  formatRecipe(recipe) {
    return {
      id: `tasty-${recipe.id}`,
      name: recipe.name || 'Unknown Recipe',
      description: recipe.description || '',
      servings: recipe.num_servings || 4,
      prepTime: recipe.prep_time_minutes || 0,
      cookTime: recipe.cook_time_minutes || 0,
      ingredients: this.extractIngredients(recipe.sections || []),
      instructions: this.extractInstructions(recipe.instructions || []),
      category: this.extractCategory(recipe.tags || []),
      familyMember: null,
      image: recipe.thumbnail_url || null,
      isFamilyRecipe: false,
      source: 'Tasty API',
      originalId: recipe.id
    };
  }

  /**
   * Extract ingredients from recipe sections
   * @param {Array} sections - Recipe sections
   * @returns {Array} Array of ingredient strings
   */
  extractIngredients(sections) {
    const ingredients = [];
    sections.forEach(section => {
      if (section.components) {
        section.components.forEach(component => {
          if (component.raw_text) {
            ingredients.push(component.raw_text);
          }
        });
      }
    });
    return ingredients;
  }

  /**
   * Extract instructions from recipe instructions
   * @param {Array} instructions - Recipe instructions
   * @returns {Array} Array of instruction strings
   */
  extractInstructions(instructions) {
    return instructions.map(instruction => instruction.display_text || '').filter(text => text);
  }

  /**
   * Extract category from tags
   * @param {Array} tags - Recipe tags
   * @returns {string} Recipe category
   */
  extractCategory(tags) {
    const categoryTags = ['dessert', 'main-course', 'appetizer', 'soup', 'salad', 'breakfast'];
    const foundCategory = tags.find(tag => categoryTags.includes(tag.name?.toLowerCase()));
    return foundCategory ? foundCategory.display_name : 'Other';
  }
}
