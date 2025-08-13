function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

function resolveImageUrl(imageUrl) {
  if (!imageUrl) return 'https://via.placeholder.com/1200x675?text=No+Image';
  if (imageUrl.startsWith('/')) return `http://localhost:8080${imageUrl}`;
  if (imageUrl.startsWith('http')) return imageUrl;
  if (imageUrl.startsWith('uploads/')) return `http://localhost:8080/${imageUrl}`;
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

function badge(label, cls = 'badge-secondary') {
  return `<span class="badge ${cls} mr-1">${escapeHtml(label)}</span>`;
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, s => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[s]));
}

// Fetch and display menu item details
function getMenuItemDetails(id) {
  const token = localStorage.getItem('jwtToken');
  if (!token) {
    swal({ text: "Authorization failed! Please log in again.", icon: "warning", button: "OK" })
      .then(() => window.location.href = "login.html");
    return;
  }

  $.ajax({
    method: "GET",
    url: `http://127.0.0.1:8080/api/menu-items/${encodeURIComponent(id)}`,
    headers: { "Authorization": `Bearer ${token}` },
    success: function (data) {
      if (!data) return;

      const {
        id, name, category, description, price, currency, imageUrl,
        availability, tags = [], vegetarian, vegan, glutenFree, lactoseFree,
        spicyLevel, calories, prepTimeMinutes, createdAt, updatedAt
      } = data;

      const priceStr = (price != null)
        ? `${currency ? escapeHtml(currency) + ' ' : ''}${Number(price).toFixed(2)}`
        : '';

      const dietBadges = [
        vegetarian ? badge('Vegetarian', 'badge-success') : '',
        vegan ? badge('Vegan', 'badge-success') : '',
        glutenFree ? badge('Gluten-Free', 'badge-info') : '',
        lactoseFree ? badge('Lactose-Free', 'badge-info') : ''
      ].join('');

      const tagBadges = (tags || []).map(t => badge(t)).join('');

      const metaBits = [
        category ? badge(category, 'badge-dark') : '',
        availability ? `<span class="badge ${availabilityBadgeClass(availability)}">${escapeHtml(availability)}</span>` : '',
        (spicyLevel != null && spicyLevel !== '') ? badge(`Spice ${spicyLevel}/5`, 'badge-warning') : '',
        (calories != null && calories !== '') ? badge(`${calories} kcal`, 'badge-light') : '',
        (prepTimeMinutes != null && prepTimeMinutes !== '') ? badge(`${prepTimeMinutes} min`, 'badge-light') : ''
      ].join(' ');

      const created = createdAt ? new Date(createdAt).toLocaleString() : '';
      const updated = updatedAt ? new Date(updatedAt).toLocaleString() : '';

      const html = `
        <div class="card shadow-lg border-0 rounded-lg">
          <img src="${resolveImageUrl(imageUrl)}" class="card-img-top rounded-top" alt="${escapeHtml(name || 'Menu Image')}">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <h2 class="text-dark font-weight-bold mb-2">${escapeHtml(name || 'Untitled')}</h2>
              <h4 class="text-primary">${priceStr}</h4>
            </div>

            <div class="mb-3">${metaBits}</div>

            ${tagBadges ? `<div class="mb-3">${tagBadges}</div>` : ''}

            ${dietBadges ? `<div class="mb-3">${dietBadges}</div>` : ''}

            <p class="card-text">${escapeHtml(description || 'No description available.')}</p>

            <div class="text-muted small mt-3">
              ${created ? `Created: ${escapeHtml(created)}` : ''}
              ${updated ? ` &nbsp; | &nbsp; Updated: ${escapeHtml(updated)}` : ''}
            </div>
          </div>
          <div class="card-footer d-flex justify-content-end">
            <button class="btn btn-outline-primary mr-2" onclick="window.history.back()">Back</button>
            <!-- Optional: Add-to-cart or Edit buttons -->
            <!-- <button class="btn btn-success">Add to Cart</button> -->
          </div>
        </div>
      `;

      $("#menu-details").html(html);
    },
    error: function (xhr, status, error) {
      console.error("Error fetching menu item details:", error);
      swal({ text: "Failed to load menu item.", icon: "error", button: "OK" });
    }
  });
}


// On page ready, read id from query and load details
$(document).ready(function () {
  const id = getQueryParam("id");
  if (id) {
    getMenuItemDetails(id);
  } else {
    $("#menu-details").html(`
      <div class="text-center text-muted py-5">
        <em>No menu item id provided.</em>
      </div>
    `);
  }
});
