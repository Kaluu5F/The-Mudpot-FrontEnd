// Save Menu Item
async function saveMenuItem() {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        swal({
            text: "Authorization failed! Please log in again.",
            icon: "warning",
            button: "OK"
        }).then(() => window.location.href = "login.html");
        return;
    }

    // Collect fields
    const name = document.getElementById("itemName").value.trim();
    const category = document.getElementById("itemCategory").value;          // e.g., APPETIZER
    const priceStr = document.getElementById("itemPrice").value;             // string from input
    const currency = (document.getElementById("currency")?.value || "").trim();
    const description = document.getElementById("itemDescription").value.trim();
    const availability = document.getElementById("availability").value;      // e.g., AVAILABLE
    const sku = (document.getElementById("sku")?.value || "").trim();

    const vegetarian = document.getElementById("vegetarian")?.checked || false;
    const vegan = document.getElementById("vegan")?.checked || false;
    const glutenFree = document.getElementById("glutenFree")?.checked || false;
    const lactoseFree = document.getElementById("lactoseFree")?.checked || false;

    const spicyLevel = document.getElementById("spicyLevel")?.value;
    const calories = document.getElementById("calories")?.value;
    const prepTimeMinutes = document.getElementById("prepTimeMinutes")?.value;

    const tagsRaw = document.getElementById("tags")?.value || "";
    const menuImage = document.getElementById("menuImage")?.files?.[0] || null;

    // Basic validation
    const errors = [];
    if (!name) errors.push("Item name is required.");
    if (!category) errors.push("Category is required.");
    if (!priceStr || isNaN(Number(priceStr)) || Number(priceStr) < 0) errors.push("Price must be a valid number ≥ 0.");
    if (!description) errors.push("Description is required.");
    if (!availability) errors.push("Availability is required.");
    if (errors.length) {
        swal({ text: errors.join("\n"), icon: "warning", button: "OK" });
        return;
    }

    // Build FormData to match MenuItemDTO fields (server expects multipart/form-data)
    const formData = new FormData();
    formData.append("name", name);
    formData.append("category", category); // must match enum (APPETIZER, MAIN_COURSE, etc.)
    formData.append("price", Number(priceStr).toFixed(2)); // keep 2 decimals
    if (currency) formData.append("currency", currency.toUpperCase());
    formData.append("description", description);
    formData.append("availability", availability); // AVAILABLE, OUT_OF_STOCK, etc.
    if (sku) formData.append("sku", sku);

    formData.append("vegetarian", vegetarian);
    formData.append("vegan", vegan);
    formData.append("glutenFree", glutenFree);
    formData.append("lactoseFree", lactoseFree);

    if (spicyLevel !== "" && spicyLevel != null) formData.append("spicyLevel", spicyLevel);
    if (calories !== "" && calories != null) formData.append("calories", calories);
    if (prepTimeMinutes !== "" && prepTimeMinutes != null) formData.append("prepTimeMinutes", prepTimeMinutes);

    // Tags: append multiple entries to bind Set<String>
    tagsRaw.split(",")
        .map(t => t.trim())
        .filter(t => t.length > 0)
        .forEach(tag => formData.append("tags", tag));

    if (menuImage) formData.append("image", menuImage); // matches @RequestPart("image")

    try {
        const response = await fetch("http://localhost:8080/api/menu-items", {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }, // don't set Content-Type for FormData
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            console.log("Menu Item Response:", result);
            swal({
                text: "Menu item saved successfully!",
                icon: "success",
                button: "OK"
            }).then(() => {
                // Optional: reset form & preview
                document.getElementById("itemName").value = "";
                document.getElementById("itemCategory").value = "";
                document.getElementById("itemPrice").value = "";
                if (document.getElementById("currency")) document.getElementById("currency").value = "";
                document.getElementById("itemDescription").value = "";
                document.getElementById("availability").value = "AVAILABLE";
                if (document.getElementById("sku")) document.getElementById("sku").value = "";
                if (document.getElementById("vegetarian")) document.getElementById("vegetarian").checked = false;
                if (document.getElementById("vegan")) document.getElementById("vegan").checked = false;
                if (document.getElementById("glutenFree")) document.getElementById("glutenFree").checked = false;
                if (document.getElementById("lactoseFree")) document.getElementById("lactoseFree").checked = false;
                if (document.getElementById("spicyLevel")) document.getElementById("spicyLevel").value = "";
                if (document.getElementById("calories")) document.getElementById("calories").value = "";
                if (document.getElementById("prepTimeMinutes")) document.getElementById("prepTimeMinutes").value = "";
                if (document.getElementById("tags")) document.getElementById("tags").value = "";
                const preview = document.getElementById("imagePreview");
                if (preview) { preview.src = "#"; preview.style.display = "none"; }
                const fileInput = document.getElementById("menuImage");
                if (fileInput) fileInput.value = "";
            });
        } else {
            let message = "Failed to save menu item.";
            try {
                const error = await response.json();
                console.error("Menu Item Error:", error);
                if (error?.message) message = error.message;
            } catch (_) { /* ignore parse error */ }
            swal({ text: message, icon: "warning", button: "OK" });
        }
    } catch (err) {
        console.error("Error saving menu item:", err);
        swal({
            text: "An error occurred while saving the menu item. Please try again.",
            icon: "error",
            button: "OK"
        });
    }
}


function resetFields() {
    // Clear all fields
    document.getElementById("title").value = "";
    document.getElementById("location").value = "";
    document.getElementById("description").value = "";
    document.getElementById("severity").value = "";
    document.getElementById("disasterImage").value = "";
}

