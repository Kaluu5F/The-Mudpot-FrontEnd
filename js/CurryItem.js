const API_BASE = "http://localhost:8080";
const CART_KEY = "curryCart_v1";  
const JWT_KEY  = "jwtToken";

  function previewImage() {
    const input = document.getElementById("curryImage");
    const preview = document.getElementById("imagePreview");
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = e => { preview.src = e.target.result; preview.style.display = "block"; };
      reader.readAsDataURL(input.files[0]);
    } else {
      preview.src = "#";
      preview.style.display = "none";
    }
  }

  function resetFields() {
    document.getElementById("curryName").value = "";
    document.getElementById("curryPrice").value = "";
    document.getElementById("curryDescription").value = "";
    document.getElementById("availability").value = "AVAILABLE";
    const fileInput = document.getElementById("curryImage");
    if (fileInput) fileInput.value = "";
    const preview = document.getElementById("imagePreview");
    if (preview) { preview.src = "#"; preview.style.display = "none"; }
  }

  // Save Curry Item — sends multipart/form-data (DTO via @ModelAttribute, file via @RequestPart("image"))
  async function saveCurryItem() {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      if (typeof swal === "function") {
        swal({ text: "Authorization failed! Please log in again.", icon: "warning", button: "OK" })
          .then(() => window.location.href = "login.html");
      } else {
        alert("Authorization failed! Please log in again.");
        window.location.href = "login.html";
      }
      return;
    }

    const name = document.getElementById("curryName").value.trim();
    const priceStr = document.getElementById("curryPrice").value;
    const description = document.getElementById("curryDescription").value.trim();
    const availability = document.getElementById("availability").value;
    const imageFile = document.getElementById("curryImage")?.files?.[0] || null;

    const errors = [];
    if (!name) errors.push("Curry name is required.");
    if (priceStr === "" || isNaN(Number(priceStr)) || Number(priceStr) < 0) errors.push("Price must be a valid number ≥ 0.");
    if (!description) errors.push("Description is required.");
    if (!availability) errors.push("Availability is required.");
    if (errors.length) {
      if (typeof swal === "function") {
        swal({ text: errors.join("\n"), icon: "warning", button: "OK" });
      } else {
        alert(errors.join("\n"));
      }
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("price", Number(priceStr).toFixed(2));   // BigDecimal-friendly
    formData.append("description", description);
    formData.append("availability", availability);           // AVAILABLE / OUT_OF_STOCK / SEASONAL / DISCONTINUED
    if (imageFile) formData.append("image", imageFile);      // must be 'image' to match @RequestPart("image")

    try {
      const resp = await fetch(`${API_BASE}/api/admin/curries`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }, // Don't set Content-Type for FormData
        body: formData
      });

      if (resp.ok) {
        const result = await resp.json();
        console.log("Created Curry Item:", result);
        if (typeof swal === "function") {
          swal({ text: "Curry item saved successfully!", icon: "success", button: "OK" })
            .then(() => resetFields());
        } else {
          alert("Curry item saved successfully!");
          resetFields();
        }
      } else {
        let message = "Failed to save curry item.";
        try {
          const err = await resp.json();
          if (err?.message) message = err.message;
        } catch (_) {}
        if (typeof swal === "function") {
          swal({ text: message, icon: "warning", button: "OK" });
        } else {
          alert(message);
        }
      }
    } catch (e) {
      console.error(e);
      if (typeof swal === "function") {
        swal({ text: "Network or server error. Please try again.", icon: "error", button: "OK" });
      } else {
        alert("Network or server error. Please try again.");
      }
    }
  }


//   ===================Fetch the Items==============================

   // --- Auth / role helpers ---
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

  function isTokenExpired(payload) {
    // exp is in seconds since epoch
    if (!payload || !payload.exp) return false;
    const nowSec = Math.floor(Date.now() / 1000);
    return nowSec >= payload.exp;
  }

  function isAdmin() {
    const token = localStorage.getItem('jwtToken');
    if (!token) return false;
    const p = parseJwt(token);
    if (!p || isTokenExpired(p)) return false;
    // Your JWT: { sub, role: "admin", username, iat, exp }
    return String(p.role || '').toLowerCase() === 'admin';
  }

  function isUser() {
    const token = localStorage.getItem('jwtToken');
    if (!token) return false;
    const p = parseJwt(token);
    if (!p || isTokenExpired(p)) return false;
    // Your JWT: { sub, role: "admin", username, iat, exp }
    return String(p.role || '').toLowerCase() === 'user';
  }

  // --- Fetch & render ---
  async function fetchCurryItems(searchQuery = '', availabilityValue = '') {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      (typeof swal === "function")
        ? swal({ text: "Authorization failed! Please log in again.", icon: "warning", button: "OK" })
            .then(() => window.location.href = "login.html")
        : (alert("Authorization failed! Please log in again."), window.location.href = "login.html");
      return;
    }

    try {
      const url = `${API_BASE}/api/admin/curries`;
      const resp = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const data = await resp.json();
      const items = Array.isArray(data) ? data : (data.content || []);

      // normalize inputs
      const q = String(searchQuery || '').toLowerCase().trim();
      const selectedAvail = String(availabilityValue || '').toUpperCase().trim();

      const filtered = items.filter(it => {
        const name = String(it?.name || '').toLowerCase();
        const status = String(it?.availability || '').toUpperCase().trim();
        const nameMatch  = !q || name.includes(q);
        const availMatch = !selectedAvail || status === selectedAvail;
        return nameMatch && availMatch;
      });

      filtered.length ? displayCurryItems(filtered) : clearCurryContainer();

    } catch (err) {
      console.error("Error loading curry items:", err);
      (typeof swal === "function")
        ? swal({ text: "Failed to fetch curry items.", icon: "error", button: "Retry" })
        : alert("Failed to fetch curry items.");
    }
  }

  function displayCurryItems(items) {
    const container = document.getElementById("curry-container");
    if (!container) return;
    container.innerHTML = '';
    items.forEach(item => container.appendChild(createCurryItemCard(item)));
  }

  function clearCurryContainer() {
    const container = document.getElementById("curry-container");
    if (!container) return;
    container.innerHTML = `
      <div class="col-12 text-center text-muted py-5">
        <em>No curry items found.</em>
      </div>`;
  }

  // --- Card + helpers ---
  function createCurryItemCard(item) {
    const { id, name, description, price, imageUrl, availability } = item;
    const admin = isAdmin();
    const user= isUser();

    const priceStr = (price !== null && price !== undefined && !isNaN(Number(price)))
      ? Number(price).toFixed(2) : '';

    const card = document.createElement('div');
    card.classList.add('col-md-4', 'mb-4');
    card.setAttribute('data-card-id', id || '');

    card.innerHTML = `
      <div class="card h-100 shadow-lg border-0 rounded-lg" ${id ? `onclick="redirectToCurryItem('${id}')"` : ''}>
        <img src="${resolveImageUrl(imageUrl)}" class="card-img-top rounded-top" alt="${escapeHtml(name || 'Curry Image')}">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h5 class="card-title text-dark font-weight-bold mb-0">${escapeHtml(name || 'Untitled Curry')}</h5>
            <span class="badge ${availabilityBadgeClass(availability)}">${escapeHtml(availability || 'UNKNOWN')}</span>
          </div>
          <p class="card-text mb-2">${escapeHtml(description || 'No description available.')}</p>
          ${priceStr ? `<p class="card-text font-weight-bold">Rs. ${priceStr}</p>` : ''}
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

        ${admin && id ? `
        <div class="card-footer d-flex justify-content-end">
          <button class="btn btn-sm btn-outline-warning mr-2"
                  onclick="onEditCurry(event, '${id}')">Edit</button>
          <button class="btn btn-sm btn-outline-danger"
                  onclick="onDeleteCurry(event, '${id}', '${escapeHtml(name || '')}')">Delete</button>
        </div>` : ``}
      </div>
    `;
    return card;
  }

  function resolveImageUrl(imageUrl) {
    if (!imageUrl) return 'https://via.placeholder.com/800x450?text=No+Image';
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

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, s => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
    }[s]));
  }

  function redirectToCurryItem(id) {
    // go to single view page if you have one
    window.location.href = `singlePageCurryItem.html?id=${encodeURIComponent(id)}`;
  }

  // --- Admin actions ---
  function onEditCurry(e, id) {
    e.stopPropagation();
    // point to your edit page (you can reuse the add form in edit mode)
    window.location.href = `CurryItemEdit.html?id=${encodeURIComponent(id)}`;
  }

  async function onDeleteCurry(e, id, name) {
    e.stopPropagation();
    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    // confirm
    const doDelete = async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/admin/curries/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (resp.ok || resp.status === 204) {
          (typeof swal === "function")
            ? swal({ text: "Curry item deleted.", icon: "success", button: "OK" }).then(reloadCurryList)
            : (alert("Curry item deleted."), reloadCurryList());
        } else {
          let message = "Failed to delete curry item.";
          try {
            const err = await resp.json();
            if (err?.message) message = err.message;
          } catch {}
          (typeof swal === "function")
            ? swal({ text: message, icon: "warning", button: "OK" })
            : alert(message);
        }
      } catch (ex) {
        console.error(ex);
        (typeof swal === "function")
          ? swal({ text: "Network or server error.", icon: "error", button: "OK" })
          : alert("Network or server error.");
      }
    };

    if (typeof swal === "function") {
      swal({
        title: "Delete this curry?",
        text: name ? `“${name}” will be permanently removed.` : "This item will be permanently removed.",
        icon: "warning",
        buttons: ["Cancel", "Delete"],
        dangerMode: true
      }).then(confirmed => { if (confirmed) doDelete(); });
    } else {
      if (confirm("Delete this curry item?")) doDelete();
    }
  }

  // global reload that respects current filters
  function reloadCurryList() {
    const searchEl = document.getElementById('search-input');
    const availEl  = document.getElementById('filter-availability');
    fetchCurryItems(searchEl?.value || '', availEl?.value || '');
  }

  // --- Wire up filters & initial load ---
  (function initCurryListPage(){
    const searchEl = document.getElementById('search-input');
    const availEl  = document.getElementById('filter-availability');

    if (searchEl) searchEl.addEventListener('input', debounce(reloadCurryList, 300));
    if (availEl)  availEl.addEventListener('change', reloadCurryList);

    reloadCurryList();
  })();

  function debounce(fn, delay) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), delay); };
  }



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