 const API_BASE = "http://localhost:8080"; 

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
  function isAdmin() {
    const token = localStorage.getItem('jwtToken');
    if (!token) return false;
    const p = parseJwt(token);
    if (!p || isTokenExpired(p)) return false;
    return String(p.role || '').toLowerCase() === 'admin';
  }

  // --- utils ---
  function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }
  function resolveImageUrl(imageUrl) {
    if (!imageUrl) return 'https://via.placeholder.com/800x450?text=No+Image';
    if (imageUrl.startsWith('/')) return `${API_BASE}${imageUrl}`;
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('uploads/')) return `${API_BASE}/${imageUrl}`;
    return imageUrl;
  }
  function previewNewImage() {
    const input = document.getElementById("curryImage");
    const preview = document.getElementById("imagePreview");
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = e => { preview.src = e.target.result; preview.style.display = "block"; };
      reader.readAsDataURL(input.files[0]);
    }
  }

  // --- load item into form ---
  async function loadCurryForEdit(id) {
    const token = localStorage.getItem('jwtToken');
    if (!token || !isAdmin()) {
      const msg = !token ? "Authorization failed! Please log in again."
                         : "You do not have permission to edit curry items.";
      if (typeof swal === "function") {
        swal({ text: msg, icon: "warning", button: "OK" })
          .then(() => window.location.href = "login.html");
      } else {
        alert(msg);
        window.location.href = "login.html";
      }
      return;
    }

    try {
      const resp = await fetch(`${API_BASE}/api/admin/curries/${encodeURIComponent(id)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      document.getElementById("curryId").value = data.id || id;
      document.getElementById("curryName").value = data.name || "";
      document.getElementById("curryPrice").value = (data.price != null && !isNaN(Number(data.price)))
          ? Number(data.price).toFixed(2) : "";
      document.getElementById("curryDescription").value = data.description || "";
      document.getElementById("availability").value = (data.availability || "AVAILABLE");

      const preview = document.getElementById("imagePreview");
      preview.src = resolveImageUrl(data.imageUrl);
      preview.style.display = "block";
    } catch (e) {
      console.error("Failed to load curry item:", e);
      if (typeof swal === "function") {
        swal({ text: "Failed to load curry item.", icon: "error", button: "OK" });
      } else {
        alert("Failed to load curry item.");
      }
    }
  }

  // --- save (PUT JSON if no new image; otherwise PUT multipart) ---
  async function saveCurryEdit() {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      (typeof swal === "function")
        ? swal({ text: "Authorization failed! Please log in again.", icon: "warning", button: "OK" })
            .then(() => window.location.href = "login.html")
        : (alert("Authorization failed! Please log in again."), window.location.href = "login.html");
      return;
    }

    const id = document.getElementById("curryId").value;
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
      (typeof swal === "function")
        ? swal({ text: errors.join("\n"), icon: "warning", button: "OK" })
        : alert(errors.join("\n"));
      return;
    }

    const endpoint = `${API_BASE}/api/admin/curries/${encodeURIComponent(id)}`;

    try {
      let resp;
      if (imageFile) {
        // PUT multipart for image replacement
        const formData = new FormData();
        formData.append("id", id); // harmless if backend ignores
        formData.append("name", name);
        formData.append("price", Number(priceStr).toFixed(2));
        formData.append("description", description);
        formData.append("availability", availability);
        formData.append("image", imageFile); // matches @RequestPart("image")

        resp = await fetch(endpoint, {
          method: "PUT",
          headers: { "Authorization": `Bearer ${token}` },
          body: formData
        });
      } else {

        const dto = {
          id, name,
          price: Number(priceStr).toFixed(2),
          description, availability,
          createdAt: null, updatedAt: null
        };
        resp = await fetch(endpoint, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(dto)
        });
      }

      if (resp.ok) {
        (typeof swal === "function")
          ? swal({ text: "Curry item updated.", icon: "success", button: "OK" })
              .then(() => window.history.back())
          : (alert("Curry item updated."), window.history.back());
      } else {
        let message = "Failed to update curry item.";
        try {
          const err = await resp.json();
          if (err?.message) message = err.message;
        } catch {}
        (typeof swal === "function")
          ? swal({ text: message, icon: "warning", button: "OK" })
          : alert(message);
      }

    } catch (e) {
      console.error("Update error:", e);
      (typeof swal === "function")
        ? swal({ text: "Network or server error.", icon: "error", button: "OK" })
        : alert("Network or server error.");
    }
  }

  function resetEditFields() {
    const id = document.getElementById("curryId").value;
    if (id) loadCurryForEdit(id);
    const fileInput = document.getElementById("curryImage");
    if (fileInput) fileInput.value = "";
  }

  // --- init ---
  document.addEventListener('DOMContentLoaded', () => {
    const id = getQueryParam("id");
    if (!id) {
      const container = document.getElementById("curryItemEditContainer");
      if (container) {
        container.innerHTML = `<div class="text-center text-muted py-5"><em>No curry item id provided.</em></div>`;
      }
      return;
    }
    loadCurryForEdit(id);
  });