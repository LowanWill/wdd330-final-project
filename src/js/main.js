import { RecipeManager } from './recipe-manager.js';

/**
 * Main application class
 */
class FamilyCookbookApp {
  constructor() {
    this.recipeManager = new RecipeManager();
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      await this.recipeManager.init();
      this.setupGlobalEventListeners();
      console.log('Family Cookbook App initialized successfully');
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  }

  /**
   * Setup event listeners
   */
  setupGlobalEventListeners() {
    // Close modals with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.querySelector('.modal[style*="block"]');
        if (modal) {
          modal.style.display = 'none';
        }
      }
    });

    // Handle form submissions
    document.addEventListener('submit', (e) => {
      // Prevent default form submission for recipe forms
      if (e.target.classList.contains('recipe-form')) {
        e.preventDefault();
      }
    });
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new FamilyCookbookApp();
  app.init();
});

export default FamilyCookbookApp;
