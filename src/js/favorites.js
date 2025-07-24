/**
 * LocalStorage utility class for managing favorites
 */
export class FavoritesManager {
  constructor() {
    this.storageKey = 'familyCookbook_favorites';
  }

  /**
   * Get all favorite recipes from localStorage
   * @returns {Array} Array of favorite recipe objects
   */
  getFavorites() {
    try {
      const favorites = localStorage.getItem(this.storageKey);
      return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
      console.error('Error loading favorites:', error);
      return [];
    }
  }

  /**
   * Add a recipe to favorites
   * @param {Object} recipe - Recipe object to add
   * @returns {boolean} Success status
   */
  addFavorite(recipe) {
    try {
      const favorites = this.getFavorites();
      
      // Check if recipe is already in favorites
      const exists = favorites.some(fav => fav.id === recipe.id);
      if (exists) {
        return false; // Already exists
      }

      favorites.push({
        ...recipe,
        dateAdded: new Date().toISOString()
      });
      
      localStorage.setItem(this.storageKey, JSON.stringify(favorites));
      return true;
    } catch (error) {
      console.error('Error adding favorite:', error);
      return false;
    }
  }

  /**
   * Remove a recipe from favorites
   * @param {string} recipeId - ID of recipe to remove
   * @returns {boolean} Success status
   */
  removeFavorite(recipeId) {
    try {
      const favorites = this.getFavorites();
      const filtered = favorites.filter(fav => fav.id !== recipeId);
      
      localStorage.setItem(this.storageKey, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error removing favorite:', error);
      return false;
    }
  }

  /**
   * Check if a recipe is in favorites
   * @param {string} recipeId - ID of recipe to check
   * @returns {boolean} True if recipe is favorited
   */
  isFavorite(recipeId) {
    const favorites = this.getFavorites();
    return favorites.some(fav => fav.id === recipeId);
  }

  /**
   * Clear all favorites
   * @returns {boolean} Success status
   */
  clearFavorites() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Error clearing favorites:', error);
      return false;
    }
  }

  /**
   * Get favorite count
   * @returns {number} Number of favorite recipes
   */
  getFavoriteCount() {
    return this.getFavorites().length;
  }
}
