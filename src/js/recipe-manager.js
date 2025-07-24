import { FavoritesManager } from './favorites.js';
import { TastyApiService } from './api.js';

/**
 * Main recipe manager class
 */
export class RecipeManager {
  constructor() {
    this.favoritesManager = new FavoritesManager();
    this.apiService = new TastyApiService();
    this.familyRecipes = [];
    this.searchResults = [];
    this.currentView = 'family'; // 'family', 'search', 'favorites'
  }

  /**
   * Initialize the recipe manager
   */
  async init() {
    await this.loadFamilyRecipes();
    this.setupEventListeners();
    this.renderRecipes();
  }

  /**
   * Load family recipes from JSON file
   */
  async loadFamilyRecipes() {
    try {
      const response = await fetch('./src/data/family-recipes.json');
      this.familyRecipes = await response.json();
    } catch (error) {
      console.error('Error loading family recipes:', error);
      this.familyRecipes = [];
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Search functionality
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    
    if (searchForm) {
      searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
          await this.searchRecipes(query);
        }
      });
    }

    // Navigation
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.target.dataset.view;
        this.switchView(view);
      });
    });

    // Recipe interactions
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('favorite-btn')) {
        const recipeId = e.target.dataset.recipeId;
        this.toggleFavorite(recipeId);
      }
      
      if (e.target.classList.contains('view-recipe-btn')) {
        const recipeId = e.target.dataset.recipeId;
        this.viewRecipeDetails(recipeId);
      }
    });
  }

  /**
   * Search for recipes using the API
   * @param {string} query - Search query
   */
  async searchRecipes(query) {
    const loadingEl = document.getElementById('loading');
    const resultsEl = document.getElementById('search-results');
    
    if (loadingEl) loadingEl.style.display = 'block';
    
    try {
      this.searchResults = await this.apiService.searchRecipes(query);
      this.currentView = 'search';
      this.renderRecipes();
    } catch (error) {
      console.error('Search failed:', error);
      this.showError('Failed to search recipes. Please try again.');
    }
    
    if (loadingEl) loadingEl.style.display = 'none';
  }

  /**
   * Switch between different views
   * @param {string} view - View to switch to ('family', 'search', 'favorites')
   */
  switchView(view) {
    this.currentView = view;
    this.updateNavigation();
    this.renderRecipes();
  }

  /**
   * Update navigation active state
   */
  updateNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === this.currentView);
    });
  }

  /**
   * Toggle favorite status of a recipe
   * @param {string} recipeId - Recipe ID to toggle
   */
  toggleFavorite(recipeId) {
    const recipe = this.findRecipeById(recipeId);
    if (!recipe) return;

    const isFavorited = this.favoritesManager.isFavorite(recipeId);
    
    if (isFavorited) {
      this.favoritesManager.removeFavorite(recipeId);
      this.showMessage('Recipe removed from favorites');
    } else {
      this.favoritesManager.addFavorite(recipe);
      this.showMessage('Recipe added to favorites');
    }
    
    this.updateFavoriteButtons();
    
    // If currently viewing favorites, re-render
    if (this.currentView === 'favorites') {
      this.renderRecipes();
    }
  }

  /**
   * Find a recipe by ID across all sources
   * @param {string} recipeId - Recipe ID
   * @returns {Object|null} Recipe object or null
   */
  findRecipeById(recipeId) {
    // Check family recipes
    let recipe = this.familyRecipes.find(r => r.id === recipeId);
    if (recipe) return recipe;
    
    // Check search results
    recipe = this.searchResults.find(r => r.id === recipeId);
    if (recipe) return recipe;
    
    // Check favorites
    recipe = this.favoritesManager.getFavorites().find(r => r.id === recipeId);
    return recipe || null;
  }

  /**
   * Render recipes based on current view
   */
  renderRecipes() {
    let recipes = [];
    
    switch (this.currentView) {
      case 'family':
        recipes = this.familyRecipes;
        break;
      case 'search':
        recipes = this.searchResults;
        break;
      case 'favorites':
        recipes = this.favoritesManager.getFavorites();
        break;
    }
    
    const container = document.getElementById('recipes-container');
    if (!container) return;
    
    if (recipes.length === 0) {
      container.innerHTML = this.getEmptyStateHTML();
      return;
    }
    
    container.innerHTML = recipes.map(recipe => this.createRecipeCard(recipe)).join('');
    this.updateFavoriteButtons();
  }

  /**
   * Create HTML for a recipe card
   * @param {Object} recipe - Recipe object
   * @returns {string} HTML string
   */
  createRecipeCard(recipe) {
    const isFavorited = this.favoritesManager.isFavorite(recipe.id);
    const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
    
    return `
      <div class="recipe-card" data-recipe-id="${recipe.id}">
        <div class="recipe-image">
          ${recipe.image ? 
            `<img src="${recipe.image}" alt="${recipe.name}" loading="lazy">` :
            `<div class="no-image">📝</div>`
          }
        </div>
        <div class="recipe-content">
          <h3 class="recipe-title">${recipe.name}</h3>
          <p class="recipe-description">${recipe.description}</p>
          <div class="recipe-meta">
            <span class="servings">🍽️ ${recipe.servings} servings</span>
            ${totalTime > 0 ? `<span class="time">⏱️ ${totalTime} min</span>` : ''}
            <span class="category">${recipe.category}</span>
          </div>
          ${recipe.isFamilyRecipe ? 
            `<div class="family-badge">👨‍👩‍👧‍👦 ${recipe.familyMember}</div>` : 
            `<div class="source-badge">🌐 ${recipe.source || 'External'}</div>`
          }
          <div class="recipe-actions">
            <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" 
                    data-recipe-id="${recipe.id}"
                    title="${isFavorited ? 'Remove from favorites' : 'Add to favorites'}">
              ${isFavorited ? '❤️' : '🤍'}
            </button>
            <button class="view-recipe-btn" data-recipe-id="${recipe.id}">
              View Recipe
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get empty state HTML for different views
   * @returns {string} HTML string
   */
  getEmptyStateHTML() {
    switch (this.currentView) {
      case 'family':
        return `
          <div class="empty-state">
            <h3>No Family Recipes Yet</h3>
            <p>Start by adding your family's favorite recipes!</p>
          </div>
        `;
      case 'search':
        return `
          <div class="empty-state">
            <h3>No Search Results</h3>
            <p>Try searching for a different recipe or ingredient.</p>
          </div>
        `;
      case 'favorites':
        return `
          <div class="empty-state">
            <h3>No Favorites Yet</h3>
            <p>Heart some recipes to see them here!</p>
          </div>
        `;
      default:
        return '<div class="empty-state"><p>No recipes found.</p></div>';
    }
  }

  /**
   * Update favorite button states
   */
  updateFavoriteButtons() {
    const favoriteButtons = document.querySelectorAll('.favorite-btn');
    favoriteButtons.forEach(btn => {
      const recipeId = btn.dataset.recipeId;
      const isFavorited = this.favoritesManager.isFavorite(recipeId);
      
      btn.classList.toggle('favorited', isFavorited);
      btn.innerHTML = isFavorited ? '❤️' : '🤍';
      btn.title = isFavorited ? 'Remove from favorites' : 'Add to favorites';
    });
  }

  /**
   * View detailed recipe information
   * @param {string} recipeId - Recipe ID
   */
  viewRecipeDetails(recipeId) {
    const recipe = this.findRecipeById(recipeId);
    if (!recipe) return;
    
    // Show recipe in modal
    this.showRecipeModal(recipe);
  }

  /**
   * Show recipe in modal overlay
   * @param {Object} recipe - Recipe object
   */
  showRecipeModal(recipe) {
    const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
    const isFavorited = this.favoritesManager.isFavorite(recipe.id);
    
    // Create modal HTML
    const modalHTML = `
      <div class="modal-overlay" id="recipe-modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">${recipe.name}</h2>
            <button class="modal-close" id="close-modal">&times;</button>
          </div>
          
          <div class="modal-body">
            <div class="recipe-modal-info">
              <p class="recipe-description">${recipe.description}</p>
              
              ${recipe.isFamilyRecipe ? 
                `<div class="family-badge-large">👨‍👩‍👧‍👦 Family Recipe by ${recipe.familyMember}</div>` : 
                `<div class="source-badge-large">🌐 ${recipe.source || 'External Recipe'}</div>`
              }
              
              <div class="recipe-meta-modal">
                <span class="servings">🍽️ ${recipe.servings} servings</span>
                ${recipe.prepTime ? `<span class="prep-time">⏲️ ${recipe.prepTime} min prep</span>` : ''}
                ${recipe.cookTime ? `<span class="cook-time">🔥 ${recipe.cookTime} min cook</span>` : ''}
                ${totalTime > 0 ? `<span class="total-time">⏱️ ${totalTime} min total</span>` : ''}
                <span class="category">🏷️ ${recipe.category}</span>
              </div>
            </div>
            
            <div class="recipe-modal-content">
              <div class="ingredients-column">
                <h3>🥘 Ingredients</h3>
                <ul class="ingredients-list-modal">
                  ${recipe.ingredients.map(ingredient => `
                    <li class="ingredient-item-modal">${ingredient}</li>
                  `).join('')}
                </ul>
              </div>
              
              <div class="instructions-column">
                <h3>👩‍🍳 Instructions</h3>
                <ol class="instructions-list-modal">
                  ${recipe.instructions.map(instruction => `
                    <li class="instruction-item-modal">${instruction}</li>
                  `).join('')}
                </ol>
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="favorite-btn-modal ${isFavorited ? 'favorited' : ''}" 
                    data-recipe-id="${recipe.id}"
                    title="${isFavorited ? 'Remove from favorites' : 'Add to favorites'}">
              ${isFavorited ? '❤️ Favorited' : '🤍 Add to Favorites'}
            </button>
            <button class="modal-close-btn" id="close-modal-btn">Close</button>
          </div>
        </div>
      </div>
    `;
    
    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Setup modal event listeners
    this.setupModalEventListeners();
    
    // Update favorite button functionality
    this.updateFavoriteButtons();
  }

  /**
   * Setup modal event listeners
   */
  setupModalEventListeners() {
    const modal = document.getElementById('recipe-modal');
    const closeButtons = modal.querySelectorAll('#close-modal, #close-modal-btn');
    
    // Close modal when clicking close buttons
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => this.closeRecipeModal());
    });
    
    // Close modal when clicking overlay
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeRecipeModal();
      }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeRecipeModal();
      }
    });
  }

  /**
   * Close recipe modal
   */
  closeRecipeModal() {
    const modal = document.getElementById('recipe-modal');
    if (modal) {
      modal.remove();
    }
  }

  /**
   * Show a temporary message to the user
   * @param {string} message - Message to show
   */
  showMessage(message) {
    // Remove existing messages
    const existingMsg = document.querySelector('.temp-message');
    if (existingMsg) existingMsg.remove();
    
    const msgEl = document.createElement('div');
    msgEl.className = 'temp-message';
    msgEl.textContent = message;
    document.body.appendChild(msgEl);
    
    setTimeout(() => msgEl.remove(), 3000);
  }

  /**
   * Show an error message
   * @param {string} message - Error message
   */
  showError(message) {
    console.error(message);
    this.showMessage(`Error: ${message}`);
  }
}
