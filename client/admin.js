const BASE_URL = "https://restaurant-menu-1-60u0.onrender.com";   

const adminToken = localStorage.getItem("asaToken");
let categories = [];

// ============= ADMIN LOGIN =============
window.login = async () => {
  const username = document.getElementById("username")?.value.trim();
  const password = document.getElementById("password")?.value;
  if (!username || !password) return;

  const msg = document.getElementById("loginMsg");
  msg.textContent = "Logging in...";
  msg.style.color = "#006400";

  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.token) {
      localStorage.setItem("asaToken", data.token);
      location.reload();
    } else {
      msg.textContent = "Wrong username or password";
      msg.style.color = "#d32f2f";
    }
  } catch (err) {
    msg.textContent = "Server is waking up... wait 30–50s on first try";
    msg.style.color = "#ff6b00";
  }
};

window.logout = () => {
  localStorage.removeItem("asaToken");
  location.reload();
};

// ============= TABS =============
window.openTab = (id) => {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".dash-nav button").forEach(b => b.classList.remove("active"));
  document.getElementById(id)?.classList.add("active");
  document.querySelector(`button[onclick="openTab('${id}')"]`)?.classList.add("active");

  if (id === "menu") loadMenuItems();
  loadMenuItems();
  if (id === "categories") loadCategories();
  if (id === "feedback") loadFeedback();
  if (id === "orders") loadOrders();
};

const safeSetHTML = (selector, html) => {
  const el = document.querySelector(selector);
  if (el) el.innerHTML = html;
};

// ============= CATEGORIES =============
const loadCategories = async () => {
  const { data } = await (await fetch(`${BASE_URL}/api/category`)).json();
  categories = data || [];
  const sel = document.getElementById("newCategoryId");
  if (sel) sel.innerHTML = `<option value="">Select Category</option>` + data.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
  safeSetHTML("#catTable tbody", data.map(c => `
    <tr><td>${c.name}</td>
    <td>
      <button onclick="editCategory(${c.id}, '${c.name.replace(/'/g,"\\'")}')">Edit</button>
      <button onclick="deleteCategory(${c.id})">Delete</button>
    </td></tr>
  `).join("") || "<tr><td colspan='2'>No categories</td></tr>");
};

// ADD CATEGORY
window.addCategory = async () => {
  const nameInput = document.getElementById("newCatName");
  const name = nameInput?.value.trim();
  if (!name) return alert("Please enter a category name");

  // Show loading
  const btn = document.querySelector("#categories .add-form button");
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Adding...";

  try {
    const response = await fetch(`${BASE_URL}/api/category`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`   // THIS LINE WAS MISSING OR WRONG
      },
      body: JSON.stringify({ name })
    });

    const result = await response.json();

    if (response.ok) {
      nameInput.value = "";
      alert(`"${name}" added successfully!`);
      loadCategories();  // This updates dropdown in Menu tab instantly
    } else {
      // This shows the EXACT error from backend
      alert("Failed: " + (result.error || result.message || "Unknown error"));
    }
  } catch (err) {
    alert("No internet or server is down. Try again in 30 seconds.");
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
};
// EDIT & DELETE CATEGORY
window.editCategory = async (id, old) => {
  const name = prompt("New name:", old);
  if (name && name !== old) {
    await fetch(`${BASE_URL}/api/category`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` }, body: JSON.stringify({ name }) });
    await fetch(`${BASE_URL}/api/category/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${adminToken}` } });
    loadCategories(); loadMenuItems();
  }
};

window.deleteCategory = async (id) => {
  if (confirm("Delete category + all items?")) {
    await fetch(`${BASE_URL}/api/category/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${adminToken}` } });
    loadCategories(); loadMenuItems();
  }
};

// ADD MENU ITEM — IMAGE REQUIRED
window.addMenuItem = async () => {
  const category_id = document.getElementById("newCategoryId").value;
  const name = document.getElementById("newName").value.trim();
  const price = document.getElementById("newPrice").value;
  const description = document.getElementById("newDesc").value.trim() || null;
  const image_url = document.getElementById("newImage").value.trim();
  const is_available = document.getElementById("newAvailable").value === "true";

  if (!category_id || !name || !price || !image_url) {
    return alert("All fields required — especially Image URL!");
  }

  await fetch(`${BASE_URL}/api/menu`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ category_id, name, description, price, image_url, is_available })
  });

  ["newName","newPrice","newDesc","newImage"].forEach(i => document.getElementById(i).value = "");
  document.getElementById("newCategoryId").selectedIndex = 0;
  loadMenuItems();
};

window.editMenuItem = (id, oldName, oldPrice, catId, oldDesc, oldImg, avail) => {
  const name = prompt("Name:", oldName);
  const price = prompt("Price:", oldPrice);
  const desc = prompt("Description:", oldDesc || "");
  const img = prompt("Image URL:", oldImg || "");
  if (name && price !== null) {
    fetch(`${BASE_URL}/api/menu/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name, description: desc || null, price: Number(price), image_url: img || null, category_id: catId, is_available: avail })
    }).then(() => loadMenuItems());
  }
};

window.deleteMenuItem = (id) => {
  if (confirm("Delete this menu item?")) {
    fetch(`${BASE_URL}/api/menu/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${adminToken}` } })
      .then(() => loadMenuItems());
  }
};

const loadMenuItems = async () => {
  const { data } = await (await fetch(`${BASE_URL}/api/menu`)).json();
  safeSetHTML("#menuTable tbody", data.map(i => `
    <tr>
      <td>${i.name}</td>
      <td>₦${Number(i.price).toLocaleString()}</td>
      <td>${i.category_name}</td>
      <td>${i.is_available ? "Yes" : "No"}</td>
      <td>
        <button onclick="editMenuItem(${i.id},'${i.name.replace(/'/g,"\\'")}',${i.price},${i.category_id},'${(i.description||"").replace(/'/g,"\\'")}','${i.image_url||""}',${i.is_available})" 
                style="background:#ffbf00;padding:6px 12px;border:none;border-radius:5px;cursor:pointer;">Edit</button>
        <button onclick="deleteMenuItem(${i.id})" 
                style="background:#d32f2f;color:white;padding:6px 12px;border:none;border-radius:5px;cursor:pointer;">Delete</button>
      </td>
    </tr>`).join(""));
};

// ============= FEEDBACK & ORDERS =============
const loadFeedback = async () => {
  const { data = [] } = await (await fetch(`${BASE_URL}/api/feedbacks`)).json();
  
  safeSetHTML("#feedbackTable tbody", data.map(f => `
    <tr>
      <td>${f.customer_name}</td>
      <td class="admin-stars">
        ${"<i class='fas fa-star'></i>".repeat(f.rating)}
        ${"<i class='far fa-star'></i>".repeat(5 - f.rating)}
      </td>
      <td>${f.comment}</td>
      <td>${new Date(f.created_at).toLocaleDateString()}</td>
    </tr>
  `).join("") || "<tr><td colspan='4' style='text-align:center;padding:30px;color:#888'>No reviews yet</td></tr>");
};
const loadOrders = async () => {
  const res = await fetch(`${BASE_URL}/api/orders`, { headers: { Authorization: `Bearer ${adminToken}` } });
  const { data = [] } = await res.json();
  safeSetHTML("#ordersTable tbody", data.length ? data.map(o => `
    <tr>
      <td>${o.id}</td>
      <td>${o.customer_name}</td>
      <td>${o.customer_phone}</td>
      <td>${o.delivery_address || "-"}</td>
      <td>₦${Number(o.total_price).toLocaleString()}</td>
      <td>${new Date(o.created_at).toLocaleDateString()}</td>
      <td>${JSON.parse(o.items || "[]").map(x => x.name + " ×" + x.quantity).join(", ")}</td>
    </tr>`).join("") : "<tr><td colspan='7' style='text-align:center;color:#666'>No orders yet</td></tr>");
};

// ============= AUTO LOAD ON LOGIN =============
if (document.getElementById("loginBox") && adminToken) {
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  loadMenuItems();
  loadCategories();
  loadFeedback();
  loadOrders();
}