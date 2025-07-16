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
}

async function searchMovies() {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) {
    document.getElementById('searchMovies').innerHTML = '';
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

    displaySearchResults(data.results);
  } catch (error) {
    searchContainer.innerHTML =
      '<div class="loading">Error searching movies</div>';
  }
}

const debouncedSearch = debounce(searchMovies, 500);

function displaySearchResults(movies) {
  const container = document.getElementById('searchMovies');

  if (!movies || movies.length === 0) {
    container.innerHTML = '<div class="loading">No movies found</div>';
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
      buttonHtml = '<button class="watch-btn favorite">Favorite</button>';
    } else {
      buttonHtml = `<button class="watch-btn unwatched" onclick="event.stopPropagation(); addToFavorites(${
        movie.id
      }, '${movie.title.replace(/'/g, "\\'")}', '${
        movie.poster_path || ''
      }', '${movie.release_date || ''}', ${
        movie.vote_average || 0
      })">Add to Favorites</button>`;
    }
  } else if (context === 'watchlist') {
    buttonHtml = `<button class="watch-btn watched" onclick="event.stopPropagation(); markAsWatched(${
      movie.id
    }, '${movie.title.replace(/'/g, "\\'")}', '${movie.poster_path || ''}', '${
      movie.release_date || ''
    }', ${movie.vote_average || 0})">Mark as Watched</button>`;
  } else if (context === 'favorites') {
    buttonHtml = '<button class="watch-btn favorite">Favorite</button>';
  }

  return `
        <div class="movie-card" onclick="showMovieDetails(${movie.id})">
          ${
            posterUrl
              ? `<img src="${posterUrl}" alt="${movie.title}" class="movie-poster">`
              : `<div class="no-poster">No Poster</div>`
          }
          <div class="movie-title">${movie.title}</div>
          <div class="movie-year">${year}</div>
          <div class="movie-rating">⭐ ${rating}</div>
          ${buttonHtml}
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
  }

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
  }

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
  }

  refreshCurrentView();
}

function refreshCurrentView() {
  if (currentTab === 'search') {
    const searchInput = document.getElementById('searchInput');
    if (searchInput.value.trim()) {
      searchMovies();
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
                    : '<div class="modal-poster" style="background: #e9ecef; display: flex; align-items: center; justify-content: center;">No Poster</div>'
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
                      movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'
                    }
                  </div>
                  <div class="modal-plot">
                    <strong>Plot:</strong><br>
                    ${movie.overview || 'No plot available.'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;

    document.body.insertAdjacentHTML('beforeend', modalContent);
  } catch (error) {
    console.error('Error fetching movie details:', error);
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

loadWatchedMovies();
