// Escape HTML to prevent XSS
function escapeHtml(str) {
  return (str || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

let currentRecipe = null;
let favoriteRecipeIds = new Set();
let userSelectedRating = 0; // Stores the user's new rating for a comment

// Fetches the list of favorite recipe IDs when the page loads
function getFavoriteIds() {
  fetch('api/getFavIds.php')
    .then(res => res.json())
    .then(data => { if (data.success) { favoriteRecipeIds = new Set(data.favorites); } })
    .catch(err => console.error('Error fetching favorite IDs:', err));
}

// Open modal with details
function openModal(recipe) {
  currentRecipe = recipe;
  userSelectedRating = 0; // Reset user rating each time modal opens

  document.getElementById('modalImg').src = recipe.image_url || 'placeholder.jpg';
  document.getElementById('modalTitle').textContent = recipe.title;

  function formatToList(text, title) {
    if (!text || text.trim() === '') return '';
    const items = text.split('\n').filter(item => item.trim() !== '');
    if (items.length === 0) return '';
    const listType = title.toLowerCase().includes('instructions') ? 'ol' : 'ul';
    let html = `<h3 class="modal-section-title">${title}</h3><${listType}>`;
    items.forEach(item => { html += `<li>${escapeHtml(item)}</li>`; });
    html += `</${listType}>`;
    return html;
  }

  const detailsContainer = document.getElementById('modalDetails');
  detailsContainer.innerHTML = '';
  detailsContainer.innerHTML += formatToList(recipe.ingredients, 'Ingredients');
  detailsContainer.innerHTML += formatToList(recipe.instructions, 'Instructions');

  // Favorite button logic
  const favBtn = document.getElementById('favoriteBtn');
  function updateFavoriteButton() {
    if (favoriteRecipeIds.has(String(recipe.recipe_id))) {
      favBtn.textContent = '✅ Remove from Favorites';
      favBtn.classList.add('favorited');
    } else {
      favBtn.textContent = '⭐ Add to Favorites';
      favBtn.classList.remove('favorited');
    }
  }
  updateFavoriteButton();
  favBtn.onclick = () => {
    const isFavorited = favoriteRecipeIds.has(String(recipe.recipe_id));
    const endpoint = isFavorited ? 'api/removeFav.php' : 'api/addFav.php';
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'recipe_id=' + encodeURIComponent(recipe.recipe_id)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        if (isFavorited) {
          favoriteRecipeIds.delete(String(recipe.recipe_id));
        } else {
          favoriteRecipeIds.add(String(recipe.recipe_id));
        }
        updateFavoriteButton();
      } else {
        alert(data.message || 'An error occurred.');
      }
    })
    .catch(err => console.error('Error updating favorite:', err));
  };

  // Logic for Ratings and Comments
  const commentList = document.getElementById('commentList');
  const avgRatingText = document.getElementById('avgRatingText');
  fetch(`api/getComment.php?recipe_id=${recipe.recipe_id}`)
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        avgRatingText.textContent = `${data.avg_rating} / 5 (${data.rating_count} ratings)`;
        commentList.innerHTML = '';
        data.comments.forEach(comment => {
          const li = document.createElement('li');
          let commentRatingHtml = '';
          if (comment.rating > 0) {
            commentRatingHtml = '<div class="comment-rating">';
            for (let i = 0; i < 5; i++) {
              commentRatingHtml += i < comment.rating ? '★' : '☆';
            }
            commentRatingHtml += '</div>';
          }
          li.innerHTML = `
            ${commentRatingHtml}
            <p class="comment-text">${escapeHtml(comment.comment_text)}</p>
          `;
          commentList.appendChild(li);
        });
      }
    });

  // Logic for Interactive Stars
  const stars = document.querySelectorAll('.stars-rating span');
  function highlightStars(value) {
    stars.forEach(star => {
      star.classList.toggle('hovered', star.dataset.value <= value);
    });
  }
  function resetStarsToSelected() {
    stars.forEach(star => {
      star.classList.remove('hovered');
      star.classList.toggle('selected', star.dataset.value <= userSelectedRating);
    });
  }
  stars.forEach(star => {
    star.addEventListener('mouseover', () => highlightStars(star.dataset.value));
    star.addEventListener('mouseout', () => resetStarsToSelected());
    star.addEventListener('click', () => {
      userSelectedRating = star.dataset.value;
      resetStarsToSelected();
    });
  });
  resetStarsToSelected(); // Initialize stars on open

  document.getElementById('recipeModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('recipeModal').style.display = 'none';
}

// addComment function
function addComment() {
  const input = document.getElementById('commentInput');
  const commentText = input.value.trim();
  if (!currentRecipe) return alert('No recipe selected');
  if (!commentText) return alert('Please enter a review.');

  const body = new URLSearchParams();
  body.append('recipe_id', currentRecipe.recipe_id);
  body.append('comment_text', commentText);
  body.append('rating', userSelectedRating);

  fetch('api/addComment.php', {
    method: 'POST',
    body: body
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      input.value = '';
      userSelectedRating = 0;
      openModal(currentRecipe); // Refresh modal to show new comment and updated average
    } else {
      alert('Error: ' + (data.message || 'Could not post review.'));
    }
  })
  .catch(err => console.error('Error posting comment:', err));
}

// This function runs when the page is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  getFavoriteIds();

  // Attach listener to post button
  const postCommentBtn = document.getElementById('postCommentBtn');
  if (postCommentBtn) {
    postCommentBtn.addEventListener('click', addComment);
  }

  const urlParams = new URLSearchParams(window.location.search);
  const recipeIdToOpen = urlParams.get('id');
  const grid = document.getElementById('recipeGrid');

  fetch('api/getRecipes.php')
    .then(res => res.json())
    .then(recipes => {
      grid.innerHTML = '';
      let recipeToOpen = null;
      recipes.forEach(recipe => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.cursor = 'pointer';
        card.innerHTML = `
          <img src="${recipe.image_url || 'placeholder.jpg'}" alt="${escapeHtml(recipe.title)}" class="recipe-image">
          <div class="card-content">
            <h3>${escapeHtml(recipe.title)}</h3>
            <p>${escapeHtml((recipe.instructions || '').substring(0, 80))}...</p>
          </div>
        `;
        card.onclick = () => openModal(recipe);
        grid.appendChild(card);
        if (recipeIdToOpen && String(recipe.recipe_id) === recipeIdToOpen) {
          recipeToOpen = recipe;
        }
      });
      if (recipeToOpen) {
        openModal(recipeToOpen);
      }
    })
    .catch(err => console.error('Error loading recipes:', err));
});