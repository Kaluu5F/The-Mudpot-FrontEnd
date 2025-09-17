const API_BASE = "http://localhost:8080";
const CART_KEY = "curryCart_v1";  
const JWT_KEY  = "jwtToken";

  function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  function resolveImageUrl(imageUrl) {
    if (!imageUrl) return 'https://via.placeholder.com/1200x675?text=No+Image';
    if (imageUrl.startsWith('/')) return `${API_BASE}${imageUrl}`;
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('uploads/')) return `${API_BASE}/${imageUrl}`;
    return imageUrl;
  }

  function availabilityBadgeClass(aRaw) {
    const a = String(aRaw || '').toUpperCase().trim();
    switch (a) {
      case 'AVAILABLE': return 'badge-success';
      case 'OUT_OF_STOCK': return 'badge-danger';
      case 'SEASONAL': return 'badge-primary';
      case 'DISCONTINUED': return 'badge-secondary';
      default: return 'badge-light';
    }
  }

  function isUser() {
    const token = localStorage.getItem('jwtToken');
    if (!token) return false;
    const p = parseJwt(token);
    if (!p || isTokenExpired(p)) return false;
    // Your JWT: { sub, role: "admin", username, iat, exp }
    return String(p.role || '').toLowerCase() === 'user';
  }

  function isTokenExpired(payload) {
    // exp is in seconds since epoch
    if (!payload || !payload.exp) return false;
    const nowSec = Math.floor(Date.now() / 1000);
    return nowSec >= payload.exp;
  }

  function parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(atob(base64).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      return JSON.parse(json);
    } catch {
      return null;
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

  // Fetch & display curry item details
  function getCurryItemDetails(id) {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      (typeof swal === "function")
        ? swal({ text: "Authorization failed! Please log in again.", icon: "warning", button: "OK" })
            .then(() => window.location.href = "login.html")
        : (alert("Authorization failed! Please log in again."), window.location.href = "login.html");
      return;
    }

    $.ajax({
      method: "GET",
      url: `${API_BASE}/api/admin/curries/${encodeURIComponent(id)}`,
      headers: { "Authorization": `Bearer ${token}` },
      success: function (data) {
        if (!data) {
          $("#curry-details").html(`
            <div class="text-center text-muted py-5"><em>Curry item not found.</em></div>
          `);
          return;
        }

        const {
          id, name, description, price, imageUrl,
          availability, createdAt, updatedAt
        } = data;

        const priceStr = (price != null && !isNaN(Number(price)))
          ? `Rs. ${Number(price).toFixed(2)}`
          : '';

        const statusBadge = availability
          ? `<span class="badge ${availabilityBadgeClass(availability)}">${escapeHtml(availability)}</span>`
          : '';
        const user=isUser();
        const created = createdAt ? new Date(createdAt).toLocaleString() : '';
        const updated = updatedAt ? new Date(updatedAt).toLocaleString() : '';

        const html = `
          <div class="card shadow-lg border-0 rounded-lg">
            <img src="${resolveImageUrl(imageUrl)}" class="card-img-top rounded-top" alt="${escapeHtml(name || 'Curry Image')}">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <h2 class="text-dark font-weight-bold mb-2">${escapeHtml(name || 'Untitled Curry')}</h2>
                <h4 class="text-primary mb-0">${priceStr}</h4>
              </div>

              <div class="mb-3">${statusBadge}</div>

              <p class="card-text">${escapeHtml(description || 'No description available.')}</p>

              <div class="text-muted small mt-3">
                ${created ? `Created: ${escapeHtml(created)}` : ''}
                ${updated ? ` &nbsp; | &nbsp; Updated: ${escapeHtml(updated)}` : ''}
              </div>
            </div>
            ${user && id ? `
              <div class="card-footer d-flex justify-content-end">
              <button class="btn btn-sm btn-outline-success mr-2"
                      onclick="onAddToCart(event, '${id}', '${escapeHtml(name || '')}')">
                  Add to Cart
              </button>
              <button class="btn btn-sm btn-success"
                      onclick="onBuyNow(event, '${id}', '${escapeHtml(name || '')}')">
                  Buy Now
              </button>
              </div>`: ``}
            <div class="card-footer d-flex justify-content-end">
              <button class="btn btn-outline-primary mr-2" onclick="window.history.back()">Back</button>
              <!-- Optional: Edit button
              <button class="btn btn-warning" onclick="window.location.href='curry-edit.html?id=${encodeURIComponent(id)}'">Edit</button>
              -->
            </div>
          </div>
        `;

        $("#curry-details").html(html);
      },
      error: function (xhr, status, error) {
        console.error("Error fetching curry item details:", error);
        (typeof swal === "function")
          ? swal({ text: "Failed to load curry item.", icon: "error", button: "OK" })
          : alert("Failed to load curry item.");
      }
    });
  }

  // Init on page load
  $(document).ready(function () {
    const id = getQueryParam("id");
    if (id) {
      getCurryItemDetails(id);
    } else {
      $("#curry-details").html(`
        <div class="text-center text-muted py-5">
          <em>No curry item id provided.</em>
        </div>
      `);
    }
  });

  
  
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(atob(base64).split('').map(c =>
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
    return JSON.parse(json);
  } catch { return null; }
}
function isExpired(payload) {
  if (!payload || !payload.exp) return false;
  return Math.floor(Date.now() / 1000) >= payload.exp;
}
function getToken() {
  const t = localStorage.getItem(JWT_KEY);
  if (!t) return null;
  const p = parseJwt(t);
  if (!p || isExpired(p)) return null;
  return t;
}
function isUserRole() {
  const t = getToken();
  if (!t) return false;
  const p = parseJwt(t);
  return String(p.role || '').toLowerCase() === 'user';
}
function authHeaders() {
  const t = getToken();
  return t ? { "Authorization": `Bearer ${t}` } : {};
}

// =================== LOCAL CART (GUEST) ===================
function readCartLocal() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}
function writeCartLocal(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  if (typeof notifyCartChanged === 'function') notifyCartChanged();
}
function localAddToCart(id, qty = 1) {
  const cart = readCartLocal();
  const existing = cart.find(it => it.id === id);
  if (existing) existing.qty += qty;
  else cart.push({ id, qty });
  writeCartLocal(cart);
  return cart;
}
function localUpdateQty(id, qty) {
  let cart = readCartLocal();
  cart = cart.map(it => it.id === id ? { ...it, qty: Math.max(0, parseInt(qty || 0, 10)) } : it)
             .filter(it => it.qty > 0);
  writeCartLocal(cart);
  return cart;
}
function localRemoveFromCart(id) {
  let cart = readCartLocal().filter(it => it.id !== id);
  writeCartLocal(cart);
  return cart;
}
function localClearCart() { writeCartLocal([]); }
function localCartCount() {
  return readCartLocal().reduce((a, b) => a + (parseInt(b.qty || 0, 10) || 0), 0);
}

// =================== SERVER CART (LOGGED-IN USER) ===================
async function serverGetCart() {
  const resp = await fetch(`${API_BASE}/api/cart`, { headers: authHeaders() });
  if (!resp.ok) throw new Error("Failed to fetch cart");
  return resp.json(); // CartDTO
}
async function serverAddItem(curryItemId, quantity = 1) {
  const resp = await fetch(`${API_BASE}/api/cart/items`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ curryItemId, quantity })
  });
  if (!resp.ok) throw new Error("Failed to add item");
  return resp.json();
}
async function serverSetQty(curryItemId, quantity) {
  const resp = await fetch(`${API_BASE}/api/cart/items/${encodeURIComponent(curryItemId)}`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ quantity })
  });
  if (!resp.ok) throw new Error("Failed to update qty");
  return resp.json();
}
async function serverRemoveItem(curryItemId) {
  const resp = await fetch(`${API_BASE}/api/cart/items/${encodeURIComponent(curryItemId)}`, {
    method: "DELETE",
    headers: authHeaders()
  });
  if (!resp.ok && resp.status !== 204) throw new Error("Failed to remove item");
  return true;
}
async function serverClear() {
  const resp = await fetch(`${API_BASE}/api/cart`, {
    method: "DELETE",
    headers: authHeaders()
  });
  if (!resp.ok && resp.status !== 204) throw new Error("Failed to clear cart");
  return true;
}
async function serverCartCount() {
  try {
    const cart = await serverGetCart();
    return (cart.items || []).reduce((n, it) => n + (parseInt(it.quantity || 0, 10) || 0), 0);
  } catch { return 0; }
}

// Merge any guest cart lines into server cart once user is logged in
let _mergeAttempted = false;
async function syncLocalToServerIfNeeded() {
  if (!isUserRole() || _mergeAttempted) return;
  const guestLines = readCartLocal();
  if (!guestLines.length) { _mergeAttempted = true; return; }
  for (const line of guestLines) {
    try { await serverAddItem(line.id, parseInt(line.qty || 1, 10) || 1); } catch {}
  }
  localClearCart();
  _mergeAttempted = true;
}

// =================== PUBLIC API (prefers server, falls back to local) ===================
async function addToCart(id, qty = 1) {
  if (isUserRole()) {
    await syncLocalToServerIfNeeded();
    try { await serverAddItem(id, qty); } catch { /* fallback */ localAddToCart(id, qty); }
  } else {
    localAddToCart(id, qty);
  }
  if (typeof notifyCartChanged === 'function') notifyCartChanged();
  return true;
}

async function updateQty(id, qty) {
  const q = Math.max(0, parseInt(qty || 0, 10));
  if (isUserRole()) {
    try { await serverSetQty(id, q); } catch { localUpdateQty(id, q); }
  } else {
    localUpdateQty(id, q);
  }
  if (typeof notifyCartChanged === 'function') notifyCartChanged();
  return true;
}

async function removeFromCart(id) {
  if (isUserRole()) {
    try { await serverRemoveItem(id); } catch { localRemoveFromCart(id); }
  } else {
    localRemoveFromCart(id);
  }
  if (typeof notifyCartChanged === 'function') notifyCartChanged();
  return true;
}

async function clearCart() {
  if (isUserRole()) {
    try { await serverClear(); } catch { localClearCart(); }
  } else {
    localClearCart();
  }
  if (typeof notifyCartChanged === 'function') notifyCartChanged();
  return true;
}

// Sync version (for guests only); prefer cartCountAsync() in navbar
function cartCount() { return localCartCount(); }

// Async count that prefers server if logged in
async function cartCountAsync() {
  if (isUserRole()) return serverCartCount();
  return Promise.resolve(localCartCount());
}

// =================== UI HELPERS (unchanged) ===================
function toastOK(msg) {
  if (typeof swal === "function") swal({ text: msg, icon: "success", button: "OK" });
  else alert(msg);
}
function toastWarn(msg) {
  if (typeof swal === "function") swal({ text: msg, icon: "warning", button: "OK" });
  else alert(msg);
}
function toastErr(msg) {
  if (typeof swal === "function") swal({ text: msg, icon: "error", button: "OK" });
  else alert(msg);
}

// =================== BUTTON HANDLERS (now async) ===================
async function onAddToCart(e, id, nameForMsg) {
  e?.stopPropagation?.();
  try {
    await addToCart(id, 1);
    toastOK((nameForMsg ? `"${nameForMsg}" ` : "") + "added to cart.");
  } catch {
    toastErr("Failed to add to cart.");
  }
}
async function onBuyNow(e, id, nameForMsg) {
  e?.stopPropagation?.();
  try {
    await addToCart(id, 1);
    window.location.href = "checkout.html";
  } catch {
    toastErr("Failed to add to cart.");
  }
}