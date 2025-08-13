// Fetch and show menu items 
async function fetchMenuItems(searchQuery = '', category = '', availability = '') {
  const token = localStorage.getItem('jwtToken');
  if (!token) {
    swal({ text: "Authorization failed! Please log in again.", icon: "warning", button: "OK" })
      .then(() => window.location.href = "login.html");
    return;
  }

  try {
  
    const apiUrl = `http://localhost:8080/api/menu-items?page=0&size=100`;
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!response.ok) throw new Error(`Error fetching menu items: ${response.statusText}`);

    const page = await response.json();
    const items = page.content || page || []; 

    // Client-side filtering
    const q = (searchQuery || "").toLowerCase().trim();
    const filtered = items.filter(it => {
      const nameMatch = !q || (it.name || "").toLowerCase().includes(q);
      const catMatch = !category || it.category === category;
      const availMatch = !availability || it.availability === availability;
      return nameMatch && catMatch && availMatch;
    });

    if (filtered.length > 0) {
      displayMenuItems(filtered);
    } else {
      clearMenuContainer();
    }

  } catch (err) {
    console.error("Error loading menu items:", err);
    swal({ text: "Failed to fetch menu items.", icon: "error", button: "Retry" });
  }
}

function displayMenuItems(items) {
  const container = document.getElementById("menu-container");
  if (!container) {
    swal({ text: "Display container not found in the DOM!", icon: "error", button: "OK" });
    return;
  }
  container.innerHTML = '';
  items.forEach(item => container.appendChild(createMenuItemCard(item)));
}

function clearMenuContainer() {
  const container = document.getElementById("menu-container");
  if (container) {
    container.innerHTML = `
      <div class="col-12 text-center text-muted py-5">
        <em>No menu items found.</em>
      </div>`;
  }
}

// Build a menu card
function createMenuItemCard(item) {
  const {
    id, name, category, description, price, currency,
    imageUrl, availability, tags = [],
    vegetarian, vegan, glutenFree, lactoseFree, spicyLevel
  } = item;

  const card = document.createElement('div');
  card.classList.add('col-md-4', 'mb-4');

  const priceStr = typeof price === "number" || typeof price === "string"
      ? `${currency ? currency + ' ' : ''}${Number(price).toFixed(2)}`
      : '';

  const dietBadges = [
    vegetarian ? '<span class="badge badge-success mr-1">Vegetarian</span>' : '',
    vegan ? '<span class="badge badge-success mr-1">Vegan</span>' : '',
    glutenFree ? '<span class="badge badge-info mr-1">Gluten-Free</span>' : '',
    lactoseFree ? '<span class="badge badge-info mr-1">Lactose-Free</span>' : ''
  ].join('');

  const tagBadges = (tags || []).map(t => `<span class="badge badge-secondary mr-1">${escapeHtml(t)}</span>`).join('');

  const spicy = (spicyLevel ?? '') !== '' ? `<span class="badge badge-warning ml-1">Spice: ${spicyLevel}/5</span>` : '';

  card.innerHTML = `
    <div class="card h-100 shadow-lg border-0 rounded-lg" onclick="redirectToMenuItem('${id}')">
      <img src="${resolveImageUrl(imageUrl)}" class="card-img-top rounded-top" alt="${escapeHtml(name || 'Menu Image')}">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <h5 class="card-title text-dark font-weight-bold mb-0">${escapeHtml(name || 'Untitled')}</h5>
          <span class="badge ${availabilityBadgeClass(availability)}">${escapeHtml(availability || 'UNKNOWN')}</span>
        </div>
        <h6 class="card-subtitle mb-2 text-muted">${escapeHtml(category || '')} ${spicy}</h6>
        <p class="card-text mb-2">${escapeHtml(description || 'No description available.')}</p>
        <p class="card-text font-weight-bold">${priceStr}</p>
        <div class="mb-2">${dietBadges}</div>
        <div>${tagBadges}</div>
      </div>
    </div>
  `;

  return card;
}

// Helpers
function resolveImageUrl(imageUrl) {
  if (!imageUrl) return 'https://via.placeholder.com/800x450?text=No+Image';
  // If backend returns relative like /uploads/xyz, prefix with API host for display
  if (imageUrl.startsWith('/')) return `http://localhost:8080${imageUrl}`;
  if (imageUrl.startsWith('http')) return imageUrl;
  // legacy pattern if files are on 8000
  if (imageUrl.startsWith('uploads/')) return `http://localhost:8000/${imageUrl}`;
  return imageUrl;
}

function availabilityBadgeClass(a) {
  switch (a) {
    case 'AVAILABLE': return 'badge-success';
    case 'OUT_OF_STOCK': return 'badge-danger';
    case 'SEASONAL': return 'badge-primary';
    case 'DISCONTINUED': return 'badge-secondary';
    default: return 'badge-light';
  }
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, s => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[s]));
}

function redirectToMenuItem(id) {
  window.location.href = `singlePage.html?id=${encodeURIComponent(id)}`;
}

// Wire up filters
(function initMenuListPage(){
  const searchEl = document.getElementById('search-input');
  const catEl = document.getElementById('filter-category');
  const availEl = document.getElementById('filter-availability');
  const refreshBtn = document.getElementById('refresh-btn');

  const reload = () => fetchMenuItems(searchEl.value, catEl.value, availEl.value);

  if (searchEl) searchEl.addEventListener('input', debounce(reload, 300));
  if (catEl) catEl.addEventListener('change', reload);
  if (availEl) availEl.addEventListener('change', reload);
  if (refreshBtn) refreshBtn.addEventListener('click', reload);

  // initial load
  reload();
})();

// Simple debounce to avoid spamming requests while typing
function debounce(fn, delay) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), delay);
  };
}


 

