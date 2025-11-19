const BASE_URL = "https://restaurant-menu-1-60u0.onrender.com";
const adminToken = localStorage.getItem("asaToken");
let categories = [];

window.login = async () => {
  const u = document.getElementById("username").value.trim();
  const p = document.getElementById("password").value;
  const msg = document.getElementById("loginMsg");
  msg.textContent = "Logging in...";
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: u, password: p })
    });
    const { token } = await res.json();
    if (token) {
      localStorage.setItem("asaToken", token);
      location.reload();
    } else msg.textContent = "Wrong credentials";
  } catch {
    msg.textContent = "Server waking up...";
  }
};

window.logout = () => {
  localStorage.removeItem("asaToken");
  location.reload();
};

window.openTab = (id) => {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".dash-nav button").forEach(b => b.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.querySelector(`button[onclick="openTab('${id}')"]`).classList.add("active");
  if (id === "menu") loadMenuItems();
  if (id === "categories") loadCategories();
  if (id === "feedback") loadFeedback();
  if (id === "orders") loadOrders();
};

const safeSetHTML = (sel, html) => document.querySelector(sel)?.innerHTML = html;

const loadCategories = async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/category`);
    if (!res.ok) return;
    const { data } = await res.json();
    categories = data || [];

    const dropdown = document.getElementById("newCategoryId");
    if (dropdown) {
      dropdown.innerHTML = `<option value="">Select Category</option>` +
        data.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
    }

    safeSetHTML("#catTable tbody", data.length > 0 ? data.map(c => `
      <tr>
        <td>${c.name}</td>
        <td>
          <button onclick="editCategory(${c.id}, '${c.name.replace(/'/g, "\\'")}')" 
                  style="background:#ffbf00;padding:8px 16px;border:none;border-radius:6px;margin:2px;cursor:pointer;font-weight:600;">Edit</button>
          <button onclick="deleteCategory(${c.id})" 
                  style="background:#d32f2f;color:white;padding:8px 16px;border:none;border-radius:6px;cursor:pointer;font-weight:600;">Delete</button>
        </td>
      </tr>
    `).join("") : "<tr><td colspan='2' style='text-align:center;padding:30px;color:#888'>No categories yet</td></tr>");

  } catch (err) { }
};

window.addCategory = async () => {
  const nameInput = document.getElementById("newCatName");
  const name = nameInput?.value.trim();
  if (!name) return alert("Enter category name");
  if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
    return alert(`"${name}" already exists!`);
  }

  const btn = document.querySelector("#categories .action-btn");
  const oldText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Adding...";

  try {
    const res = await fetch(`${BASE_URL}/api/category`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ name })
    });

    const result = await res.json();

    if (res.ok) {
      nameInput.value = "";
      alert(`"${name}" added successfully!`);
      await loadCategories();
      setTimeout(loadCategories, 500);
    } else {
      alert("Failed: " + (result.error || "Try again"));
    }
  } catch (err) {
    alert("No internet or server sleeping");
  } finally {
    btn.disabled = false;
    btn.textContent = oldText;
  }
};

window.editCategory = async (id, old) => {
  const name = prompt("New name:", old);
  if (name && name !== old) {
    await fetch(`${BASE_URL}/api/category`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name })
    });
    await fetch(`${BASE_URL}/api/category/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    loadCategories();
    loadMenuItems();
  }
};

window.deleteCategory = async (id) => {
  if (confirm("Delete category + all items?")) {
    await fetch(`${BASE_URL}/api/category/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    loadCategories();
    loadMenuItems();
  }
};

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
                style="background:#ffbf00;padding:8px 16px;border:none;border-radius:6px;margin:2px;cursor:pointer;">Edit</button>
        <button onclick="deleteMenuItem(${i.id})"
                style="background:#d32f2f;color:white;padding:8px 16px;border:none;border-radius:6px;cursor:pointer;">Delete</button>
      </td>
    </tr>
  `).join(""));
};

window.editMenuItem = (id, n, p, cid, d, img, a) => {
  const name = prompt("Name:", n);
  const price = prompt("Price:", p);
  const desc = prompt("Description:", d || "");
  const image = prompt("Image URL:", img || "");
  if (name && price && image) {
    fetch(`${BASE_URL}/api/menu/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name, description: desc || null, price: Number(price), image_url: image, category_id: cid, is_available: a })
    }).then(() => loadMenuItems());
  }
};

window.deleteMenuItem = id => confirm("Delete item?") &&
  fetch(`${BASE_URL}/api/menu/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${adminToken}` } })
    .then(() => loadMenuItems());

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
  safeSetHTML("#ordersTable tbody", data.map(o => `
    <tr>
      <td>${o.id}</td>
      <td>${o.customer_name}</td>
      <td>${o.customer_phone}</td>
      <td>${o.delivery_address||"-"}</td>
      <td>₦${Number(o.total_price).toLocaleString()}</td>
      <td>${new Date(o.created_at).toLocaleDateString()}</td>
      <td>${JSON.parse(o.items||"[]").map(x=>x.name+" ×"+x.quantity).join(", ")}</td>
    </tr>
  `).join("") || "<tr><td colspan='7'>No orders</td></tr>");
};

if (adminToken) {
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  loadCategories();
  loadMenuItems();
  loadFeedback();
  loadOrders();
}