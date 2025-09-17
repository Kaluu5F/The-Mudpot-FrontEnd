  const API_BASE = "http://localhost:8080"; // change if deployed
  const CART_KEY = "curryCart_v1";

  // ---- JWT helpers (optionally used on checkout only) ----
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
  function isTokenExpired(payload) {
    if (!payload || !payload.exp) return false;
    const nowSec = Math.floor(Date.now() / 1000);
    return nowSec >= payload.exp;
  }

  // ---- Cart store ----
  function readCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch { return []; }
  }
  function writeCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }
  function addToCart(id, qty = 1) {
    const cart = readCart();
    const existing = cart.find(it => it.id === id);
    if (existing) existing.qty += qty;
    else cart.push({ id, qty });
    writeCart(cart);
    return cart;
  }
  function updateQty(id, qty) {
    let cart = readCart();
    cart = cart.map(it => it.id === id ? { ...it, qty: Math.max(0, parseInt(qty || 0, 10)) } : it)
               .filter(it => it.qty > 0);
    writeCart(cart);
    return cart;
  }
  function removeFromCart(id) {
    let cart = readCart().filter(it => it.id !== id);
    writeCart(cart);
    return cart;
  }
  function clearCart() {
    writeCart([]);
  }
  function cartCount() {
    return readCart().reduce((a, b) => a + (b.qty || 0), 0);
  }

  // ---- UI helpers ----
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

  // Used by list/single/checkout views
  function resolveImageUrl(imageUrl) {
    if (!imageUrl) return 'https://via.placeholder.com/800x450?text=No+Image';
    if (imageUrl.startsWith('/')) return `${API_BASE}${imageUrl}`;
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('uploads/')) return `${API_BASE}/${imageUrl}`;
    return imageUrl;
  }
  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, s => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
    }[s]));
  }

  // Add-to-cart event helpers (use in buttons)
  function onAddToCart(e, id, nameForMsg) {
    if (e && e.stopPropagation) e.stopPropagation();
    addToCart(id, 1);
    toastOK((nameForMsg ? `"${nameForMsg}" ` : "") + "added to cart.");
  }
  function onBuyNow(e, id, nameForMsg) {
    if (e && e.stopPropagation) e.stopPropagation();
    addToCart(id, 1);
    window.location.href = "checkout.html";
  }
