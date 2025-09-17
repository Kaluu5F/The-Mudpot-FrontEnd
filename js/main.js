
(function () {
  const API_BASE = window.API_BASE || "http://localhost:8080";
  const JWT_KEY = "jwtToken";

  // ---- Auth helpers ----
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

  function isExpired(payload) {
    if (!payload || !payload.exp) return false;
    return Math.floor(Date.now() / 1000) >= payload.exp;
  }

  function getToken() {
    const token = localStorage.getItem(JWT_KEY);
    const p = token ? parseJwt(token) : null;
    if (!token || !p || isExpired(p)) return null;
    return token;
  }

  function isUserRole() {
    const token = getToken();
    if (!token) return false;
    const p = parseJwt(token);
    return String(p.role || '').toLowerCase() === 'user';
  }

  // ---- Server cart count ----
  async function getServerCartCount() {
    const token = getToken();
    if (!token) return 0;
    try {
      const resp = await fetch(`${API_BASE}/api/cart`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!resp.ok) return 0;
      const cart = await resp.json();
      const items = Array.isArray(cart?.items) ? cart.items : [];
      return items.reduce((n, it) => n + (parseInt(it?.quantity || 0, 10) || 0), 0);
    } catch {
      return 0;
    }
  }

  // ---- UI update (only shows for user role) ----
  window.updateCartBadge = async function () {
    const li = document.getElementById("cartNavItem");
    const badge = document.getElementById("cart-count-badge");
    if (!li || !badge) return;

    // Show cart only for USER role; hide for admin/guest
    if (!isUserRole()) {
      li.classList.add("d-none");
      badge.classList.add("d-none");
      return;
    } else {
      li.classList.remove("d-none");
    }

    // Always use server count only
    let count = await getServerCartCount();
    badge.textContent = count;
    badge.classList.toggle("d-none", !(count > 0));
  };

  // Run now (even if DOMContentLoaded already fired)
  function init() { window.updateCartBadge(); }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  // Refresh when returning to tab (bfcache/back button, etc.)
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) window.updateCartBadge();
  });

  // Manual notifier you can call after cart mutations
  window.notifyCartChanged = () => window.updateCartBadge();
})();




(function(){
  const JWT_KEY = "jwtToken";

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
  function isExpired(p) {
    if (!p || !p.exp) return true;
    return Math.floor(Date.now()/1000) >= p.exp;
  }
  function isAdminRole() {
    const tok = localStorage.getItem(JWT_KEY);
    if (!tok) return false;
    const p = parseJwt(tok);
    if (!p || isExpired(p)) return false;
    return String(p.role || '').toLowerCase() === 'admin';
  }

 function toggleAdminLinks() {
    const show = isAdminRole();
    document.querySelectorAll(".admin-only").forEach(el => {
      el.classList.toggle("d-none", !show);
      el.setAttribute("aria-hidden", String(!show));
    });
  }

  // initial paint (works even if DOMContentLoaded already fired)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", toggleAdminLinks, { once: true });
  } else {
    toggleAdminLinks();
  }

  // update if auth changes (login/logout)
  window.addEventListener("storage", (e) => {
    if (e.key === JWT_KEY) toggleAdminLinks();
  });
  const _set = localStorage.setItem;
  localStorage.setItem = function(k, v) {
    _set.apply(this, arguments);
    if (k === JWT_KEY) toggleAdminLinks();
  };
  const _rem = localStorage.removeItem;
  localStorage.removeItem = function(k) {
    _rem.apply(this, arguments);
    if (k === JWT_KEY) toggleAdminLinks();
  };
})();

