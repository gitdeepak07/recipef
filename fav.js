document.addEventListener('DOMContentLoaded', function() {
    const favoritesGrid = document.getElementById('favoritesGrid');
    const emptyState = document.getElementById('emptyState');

    // Function to fetch and display favorite recipes
    function loadFavorites() {
        fetch('api/getFav.php')
            .then(response => response.json())
            .then(favorites => {
                favoritesGrid.innerHTML = ''; // Clear the grid

                if (!favorites || favorites.length === 0) {
                    emptyState.style.display = 'block'; // Show empty state
                } else {
                    emptyState.style.display = 'none'; // Hide empty state
                    favorites.forEach(recipe => {
                        const card = document.createElement('div');
                        card.className = 'recipe-card';
                        // Use data-* attribute to store the ID
                        card.setAttribute('data-recipe-id', recipe.recipe_id);

                        card.innerHTML = `
                            <img src="${recipe.image_url || 'placeholder.jpg'}" alt="${recipe.title}" class="recipe-image">
                            <div class="recipe-content">
                                <div class="recipe-title">
                                    <span>${recipe.title}</span>
                                    <i class="fas fa-star favorite-icon"></i>
                                </div>
                                <div class="recipe-meta">
                                    <span><i class="fas fa-clock"></i> ${recipe.prep_time || 'N/A'}</span>
                                    <span><i class="fas fa-utensils"></i> ${recipe.servings || 'N/A'} servings</span>
                                </div>
                                <div class="recipe-actions">
                                    <button class="action-btn view-btn">View Recipe</button>
                                    <button class="action-btn remove-btn">Remove</button>
                                </div>
                            </div>
                        `;
                        favoritesGrid.appendChild(card);
                    });
                }
            })
            .catch(error => console.error('Error loading favorites:', error));
    }

    // Event listener for both "Remove" and "View" buttons
    favoritesGrid.addEventListener('click', function(event) {
        const card = event.target.closest('.recipe-card');
        if (!card) return; // Exit if the click was not inside a card

        const recipeId = card.dataset.recipeId;

        // --- FIX for "Remove" Button ---
        if (event.target.classList.contains('remove-btn')) {
            if (confirm('Are you sure you want to remove this from your favorites?')) {
                fetch('api/removeFav.php', {
                    method: 'POST',
                    // This now sends data as a form, which your PHP expects
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: 'recipe_id=' + encodeURIComponent(recipeId)
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        card.remove(); // Remove the card from the page
                        if (favoritesGrid.children.length === 0) {
                            emptyState.style.display = 'block';
                        }
                    } else {
                        alert('Error: ' + data.message);
                    }
                })
                .catch(error => console.error('Error removing favorite:', error));
            }
        }

        // --- NEW LOGIC for "View Recipe" Button ---
        if (event.target.classList.contains('view-btn')) {
            // Redirect to the main page and add the recipe ID to the URL
            window.location.href = `index.html?id=${recipeId}`;
        }
    });

    // Initial load of favorites
    loadFavorites();
});