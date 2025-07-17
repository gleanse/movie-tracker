const API_KEY = 'a01f29b03b92f13bfa9d3dd2dd5c5bcc';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

let watchedMovies = [];
let watchlistMovies = [];
let favoriteMovies = [];
let currentTab = 'search';
let searchTimeout;

function debounce(func, wait) {
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(searchTimeout);
      func(...args);
    };
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(later, wait);
  };
}

function loadWatchedMovies() {
  displayWatchedMovies();
  displayWatchlistMovies();
  displayFavoriteMovies();
  loadPopularMovies();
}

async function loadPopularMovies() {
  const searchContainer = document.getElementById('searchMovies');
  searchContainer.innerHTML =
    '<div class="loading">Loading popular movies...</div>';

  try {
    const response = await fetch(
      `${BASE_URL}/movie/popular?api_key=${API_KEY}`
    );
    const data = await response.json();

    displaySearchResults(data.results);
    document.getElementById('searchSectionTitle').textContent =
      'Popular Movies';
  } catch (error) {
    let errorMessage = 'Unable to load popular movies. ';

    if (!navigator.onLine) {
      errorMessage += 'Please check your internet connection.';
    } else {
      errorMessage += 'Please try again later.';
    }
    searchContainer.innerHTML = `<div class="loading">${errorMessage}</div>`;
  }
}

function showTab(tab) {
  currentTab = tab;

  document
    .querySelectorAll('.tab')
    .forEach((t) => t.classList.remove('active'));
  event.target.classList.add('active');

  document.querySelectorAll('.tab-content').forEach((content) => {
    content.style.display = 'none';
  });

  if (tab === 'search') {
    document.getElementById('searchResults').style.display = 'block';
  } else if (tab === 'watched') {
    document.getElementById('watchedMovies').style.display = 'block';
    displayWatchedMovies();
  } else if (tab === 'watchlist') {
    document.getElementById('watchlistMovies').style.display = 'block';
    displayWatchlistMovies();
  } else if (tab === 'favorites') {
    document.getElementById('favoriteMovies').style.display = 'block';
    displayFavoriteMovies();
  }
  refreshCurrentView();
}

async function searchMovies() {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) {
    document.getElementById('searchInput').value = '';
    loadPopularMovies();
    return;
  }

  const searchContainer = document.getElementById('searchMovies');
  searchContainer.innerHTML = '<div class="loading">Searching...</div>';

  try {
    const response = await fetch(
      `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(
        query
      )}`
    );
    const data = await response.json();

    displaySearchResults(data.results, query);
    document.getElementById(
      'searchSectionTitle'
    ).textContent = `Search Results for "${query}"`;
  } catch (error) {
    let errorMessage = 'Unable to search movies. ';

    if (!navigator.onLine) {
      errorMessage += 'Please check your internet connection.';
    } else {
      errorMessage += 'Please try again later.';
    }
    searchContainer.innerHTML = `<div class="loading">${errorMessage}</div>`;
  }
}

const debouncedSearch = debounce(searchMovies, 500);

function displaySearchResults(movies, searchTerm = '') {
  const container = document.getElementById('searchMovies');

  if (!movies || movies.length === 0) {
    const noResultsMessage = searchTerm
      ? `No movies found for "${searchTerm}"`
      : 'No movies found';
    container.innerHTML = `<div class="loading">${noResultsMessage}</div>`;
    return;
  }

  container.innerHTML = movies
    .map((movie) => createMovieCard(movie, 'search'))
    .join('');
}

function displayWatchedMovies() {
  const container = document.getElementById('watchedList');

  if (watchedMovies.length === 0) {
    container.innerHTML = '<div class="loading">No watched movies yet</div>';
    return;
  }

  container.innerHTML = watchedMovies
    .map((movie) => createMovieCard(movie, 'watched'))
    .join('');
}

function displayWatchlistMovies() {
  const container = document.getElementById('watchlistList');

  if (watchlistMovies.length === 0) {
    container.innerHTML =
      '<div class="loading">No movies in watchlist yet</div>';
    return;
  }

  container.innerHTML = watchlistMovies
    .map((movie) => createMovieCard(movie, 'watchlist'))
    .join('');
}

function displayFavoriteMovies() {
  const container = document.getElementById('favoritesList');

  if (favoriteMovies.length === 0) {
    container.innerHTML = '<div class="loading">No favorite movies yet</div>';
    return;
  }

  container.innerHTML = favoriteMovies
    .map((movie) => createMovieCard(movie, 'favorites'))
    .join('');
}

function createMovieCard(movie, context) {
  const posterUrl = movie.poster_path
    ? `${IMAGE_BASE_URL}${movie.poster_path}`
    : null;

  const year = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : 'N/A';
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

  let buttonHtml = '';

  if (context === 'search') {
    const isWatched = watchedMovies.find((m) => m.id === movie.id);
    const isInWatchlist = watchlistMovies.find((m) => m.id === movie.id);

    if (isWatched) {
      buttonHtml = '<button class="watch-btn watched">Watched</button>';
    } else if (isInWatchlist) {
      buttonHtml = '<button class="watch-btn watchlist">In Watchlist</button>';
    } else {
      buttonHtml = `<button class="watch-btn unwatched" onclick="event.stopPropagation(); addToWatchlist(${
        movie.id
      }, '${movie.title.replace(/'/g, "\\'")}', '${
        movie.poster_path || ''
      }', '${movie.release_date || ''}', ${
        movie.vote_average || 0
      })">Add to Watchlist</button>`;
    }
  } else if (context === 'watched') {
    const isFavorite = favoriteMovies.find((m) => m.id === movie.id);
    if (isFavorite) {
      buttonHtml = `
        <button class="watch-btn favorite">Favorite</button>
        <button class="remove-btn" onclick="event.stopPropagation(); removeFromWatched(${movie.id})">Remove</button>
      `;
    } else {
      buttonHtml = `
        <button class="watch-btn unwatched" onclick="event.stopPropagation(); addToFavorites(${
          movie.id
        }, '${movie.title.replace(/'/g, "\\'")}', '${
        movie.poster_path || ''
      }', '${movie.release_date || ''}', ${
        movie.vote_average || 0
      })">Add to Favorites</button>
        <button class="remove-btn" onclick="event.stopPropagation(); removeFromWatched(${
          movie.id
        })">Remove</button>
      `;
    }
  } else if (context === 'watchlist') {
    buttonHtml = `
      <button class="watch-btn watched" onclick="event.stopPropagation(); markAsWatched(${
        movie.id
      }, '${movie.title.replace(/'/g, "\\'")}', '${
      movie.poster_path || ''
    }', '${movie.release_date || ''}', ${
      movie.vote_average || 0
    })">Mark as Finished</button>
      <button class="remove-btn" onclick="event.stopPropagation(); removeFromWatchlist(${
        movie.id
      })">Remove</button>
    `;
  } else if (context === 'favorites') {
    buttonHtml = `
      <button class="watch-btn favorite">Favorite</button>
      <button class="remove-btn" onclick="event.stopPropagation(); removeFromFavorites(${movie.id})">Remove</button>
    `;
  }

  return `
            <div class="movie-card" onclick="showMovieDetails(${movie.id})">
              ${
                posterUrl
                  ? `<img src="${posterUrl}" alt="${movie.title}" class="movie-poster">`
                  : `<div class="no-poster">No Poster Available</div>`
              }
              <div class="movie-title">${movie.title}</div>
              <div class="movie-year">${year}</div>
              <div class="movie-rating">⭐ ${rating}</div>
              <div class="button-container">
              ${buttonHtml}
              </div>
            </div>
          `;
}

function addToWatchlist(id, title, posterPath, releaseDate, voteAverage) {
  const existingIndex = watchlistMovies.findIndex((movie) => movie.id === id);

  if (existingIndex === -1) {
    watchlistMovies.push({
      id,
      title,
      poster_path: posterPath,
      release_date: releaseDate,
      vote_average: voteAverage,
    });
    saveToLocalStorage();
    loadWatchedMovies();
  }
  showWatchlistToast();
  refreshCurrentView();
}

function markAsWatched(id, title, posterPath, releaseDate, voteAverage) {
  const watchlistIndex = watchlistMovies.findIndex((movie) => movie.id === id);
  if (watchlistIndex > -1) {
    watchlistMovies.splice(watchlistIndex, 1);
  }

  const watchedIndex = watchedMovies.findIndex((movie) => movie.id === id);
  if (watchedIndex === -1) {
    watchedMovies.push({
      id,
      title,
      poster_path: posterPath,
      release_date: releaseDate,
      vote_average: voteAverage,
    });
    saveToLocalStorage();
    loadWatchedMovies();
  }
  showFinishedToast();
  refreshCurrentView();
}

function addToFavorites(id, title, posterPath, releaseDate, voteAverage) {
  const existingIndex = favoriteMovies.findIndex((movie) => movie.id === id);

  if (existingIndex === -1) {
    favoriteMovies.push({
      id,
      title,
      poster_path: posterPath,
      release_date: releaseDate,
      vote_average: voteAverage,
    });
    saveToLocalStorage();
    loadWatchedMovies();
  }
  showFavoritesToast();
  refreshCurrentView();
}

function removeFromWatched(id) {
  const index = watchedMovies.findIndex((movie) => movie.id === id);
  if (index > -1) {
    watchedMovies.splice(index, 1);
    saveToLocalStorage();
    displayWatchedMovies();
    refreshCurrentView();
    showRemovedToast();
    updateAllTabs();
  }
}

function removeFromWatchlist(id) {
  const index = watchlistMovies.findIndex((movie) => movie.id === id);
  if (index > -1) {
    watchlistMovies.splice(index, 1);
    saveToLocalStorage();
    displayWatchlistMovies();
    refreshCurrentView();
    showRemovedToast();
    updateAllTabs();
  }
}

function removeFromFavorites(id) {
  const index = favoriteMovies.findIndex((movie) => movie.id === id);
  if (index > -1) {
    favoriteMovies.splice(index, 1);
    saveToLocalStorage();
    displayFavoriteMovies();
    refreshCurrentView();
    showRemovedToast();
    updateAllTabs();
  }
}

function createToast(type, title, message, icon) {
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  toast.innerHTML = `
        <div class="toast-icon">${icon || '🔔'}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="closeToast(this)">×</button>
    `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 100);

  setTimeout(() => {
    removeToast(toast);
  }, 3000);
}

function closeToast(button) {
  const toast = button.closest('.toast');
  removeToast(toast);
}

function removeToast(toast) {
  if (toast && toast.parentNode) {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }
}

const toastTypes = {
  favorites: {
    icon: '❤️',
    title: 'Added to Favorites',
    message: 'Item has been added to your favorites list',
  },
  watchlist: {
    icon: '📺',
    title: 'Added to Watchlist',
    message: 'Item has been added to your watchlist',
  },
  finished: {
    icon: '✅',
    title: 'Marked as Finished',
    message: 'Item has been marked as completed',
  },
  removed: {
    icon: '🗑️',
    title: 'Item Removed',
    message: 'Item has been removed from your collection',
  },
};

function showToast(type) {
  const toastData = toastTypes[type];
  if (!toastData) return;

  createToast(type, toastData.title, toastData.message, toastData.icon);
}

function showFavoritesToast() {
  showToast('favorites');
}

function showWatchlistToast() {
  showToast('watchlist');
}

function showFinishedToast() {
  showToast('finished');
}

function showRemovedToast() {
  showToast('removed');
}

function refreshCurrentView() {
  if (currentTab === 'search') {
    const searchInput = document.getElementById('searchInput');
    if (searchInput.value.trim()) {
      searchMovies();
    } else {
      loadPopularMovies();
    }
  } else if (currentTab === 'watched') {
    displayWatchedMovies();
  } else if (currentTab === 'watchlist') {
    displayWatchlistMovies();
  } else if (currentTab === 'favorites') {
    displayFavoriteMovies();
  }
}

async function showMovieDetails(movieId) {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits`
    );
    const movie = await response.json();

    const director = movie.credits.crew.find(
      (person) => person.job === 'Director'
    );
    const genres = movie.genres.map((g) => g.name).join(', ');
    const runtime = movie.runtime ? `${movie.runtime} min` : 'N/A';

    const modalContent = `
              <div class="modal" id="movieModal" style="display: block;">
                <div class="modal-content">
                  <span class="close" onclick="closeModal()">&times;</span>
                  <div style="overflow: hidden;">
                    ${
                      movie.poster_path
                        ? `<img src="${IMAGE_BASE_URL}${movie.poster_path}" alt="${movie.title}" class="modal-poster">`
                        : '<div class="modal-poster" style="background: #1a1a1a; display: flex; align-items: center; justify-content: center; border: 1px solid #444; color: #666;">No Poster Available</div>'
                    }
                    <div class="modal-info">
                      <div class="modal-title">${movie.title}</div>
                      <div class="modal-details">
                        <strong>Year:</strong> ${
                          movie.release_date
                            ? new Date(movie.release_date).getFullYear()
                            : 'N/A'
                        }<br>
                        <strong>Runtime:</strong> ${runtime}<br>
                        <strong>Genre:</strong> ${genres || 'N/A'}<br>
                        <strong>Director:</strong> ${
                          director ? director.name : 'N/A'
                        }<br>
                        <strong>Rating:</strong> ⭐ ${
                          movie.vote_average
                            ? movie.vote_average.toFixed(1)
                            : 'N/A'
                        }
                      </div>
                      <div class="modal-synopsis">
                        <strong>Synopsis:</strong><br>
                        ${movie.overview || 'No synopsis available.'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            `;

    document.body.insertAdjacentHTML('beforeend', modalContent);
  } catch (error) {
    console.error('Error fetching movie details:', error);
    let errorMessage = 'Unable to load movie details. ';
    if (!navigator.onLine) {
      errorMessage += 'Please check your internet connection.';
    } else {
      errorMessage += 'Please try again later.';
    }

    const errorModal = `
      <div class="modal" id="movieModal" style="display: block;">
        <div class="modal-content">
          <span class="close" onclick="closeModal()">&times;</span>
          <div style="padding: 20px; text-align: center;">
            <h3>Error</h3>
            <p>${errorMessage}</p>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', errorModal);
  }
}

function closeModal() {
  const modal = document.getElementById('movieModal');
  if (modal) {
    modal.remove();
  }
}

window.onclick = function (event) {
  const modal = document.getElementById('movieModal');
  if (modal && event.target === modal) {
    closeModal();
  }
};

document.getElementById('searchInput').addEventListener('input', function (e) {
  debouncedSearch();
});

function loadFromLocalStorage() {
  watchedMovies = JSON.parse(localStorage.getItem('watchedMovies')) || [];
  watchlistMovies = JSON.parse(localStorage.getItem('watchlistMovies')) || [];
  favoriteMovies = JSON.parse(localStorage.getItem('favoriteMovies')) || [];
}

function saveToLocalStorage() {
  localStorage.setItem('watchedMovies', JSON.stringify(watchedMovies));
  localStorage.setItem('watchlistMovies', JSON.stringify(watchlistMovies));
  localStorage.setItem('favoriteMovies', JSON.stringify(favoriteMovies));

  updateAllTabs();
}

function updateAllTabs() {
  displayWatchedMovies();
  displayWatchlistMovies();
  displayFavoriteMovies();

  if (currentTab === 'search') {
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput.value.trim()) {
      searchMovies();
    } else {
      loadPopularMovies();
    }
  }
}

window.addEventListener('storage', function (e) {
  if (
    e.key === 'watchedMovies' ||
    e.key === 'watchlistMovies' ||
    e.key === 'favoriteMovies'
  ) {
    loadFromLocalStorage();
    updateAllTabs();
  }
});

loadFromLocalStorage();
loadWatchedMovies();
