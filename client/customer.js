
const BASE_URL = "https://restaurant-menu-1-60u0.onrender.com";
let cart = [];
let cartTotal = 0;

document.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([loadMenu(), loadReviews()]);
  updateCart();
});

const loadMenu = async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/menu`);
    const { data } = await res.json();
    if (!data || data.length === 0) {
      document.getElementById("menu").innerHTML = "<p style='text-align:center;padding:50px'>Menu loading...</p>";
      return;
    }

    const categories = [...new Set(data.map(i => i.category_name))];
    const nav = document.getElementById("categories");
    nav.innerHTML = categories.map((cat, i) => 
      `<button ${i===0?'class="active"':''} onclick="showCategory('${cat}')">${cat}</button>`
    ).join("");

    document.getElementById("menu").innerHTML = categories.map((cat, i) => `
      <div class="category-section ${i===0?'active':''}">
        <h2 class="category-title">${cat}</h2>
        <div class="items-grid">
          ${data.filter(item => item.category_name === cat).map(item => `
            <div class="item">
              ${item.image_url ? `<img src="${item.image_url}" class="item-img" onerror="this.src='https://via.placeholder.com/300x200/006400/white?text=No+Image'">` : ''}
              <div class="item-details">
                <div class="item-name">${item.name}</div>
                <div class="item-desc">${item.description || "Freshly prepared with love"}</div>
                <div class="item-price">₦${Number(item.price).toLocaleString()}</div>
                <button class="add-to-cart" onclick="addToCart(${item.id}, '${item.name.replace(/'/g, "\\'")}', ${item.price})">
                  Add to Cart
                </button>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `).join("");

    if (categories[0]) showCategory(categories[0]);
  } catch (err) {
    document.getElementById("menu").innerHTML = "<p style='text-align:center;color:#d32f2f;padding:50px'>No internet connection</p>";
  }
};

const updateCart = () => {
  const count = cart.reduce((s, i) => s + i.quantity, 0);
  document.querySelectorAll("#floatCount, #cartCount, .cart-badge").forEach(el => el && (el.textContent = count));

  const itemsDiv = document.getElementById("orderItems");
  const totalSpan = document.getElementById("orderTotal");
  if (!itemsDiv) return;

  if (cart.length === 0) {
    itemsDiv.innerHTML = "<p style='text-align:center;color:#888;margin:20px 0'>Your cart is empty</p>";
    totalSpan.textContent = "0";
    return;
  }

  itemsDiv.innerHTML = cart.map(item => `
    <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #eee;">
      <span><strong>${item.quantity}×</strong> ${item.name}</span>
      <span>₦${(item.price * item.quantity).toLocaleString()}</span>
    </div>
  `).join("");

  cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  totalSpan.textContent = cartTotal.toLocaleString();
};

function openOrderForm() {
  if (cart.length === 0) {
    alert("Your cart is empty! Add some food first");
    return;
  }
  updateCart();
  document.getElementById("orderForm").style.display = "block";
  document.body.style.overflow = "hidden";
}

function closeOrderForm() {
  document.getElementById("orderForm").style.display = "none";
  document.body.style.overflow = "auto";
}

function addToCart(id, name, price) {
  const existing = cart.find(i => i.id === id);
  if (existing) existing.quantity++;
  else cart.push({ id, name, price: Number(price), quantity: 1 });
  updateCart();
  alert(`${name} added to cart!`);
}

window.placeOrder = async () => {
  const name = document.getElementById("cname").value.trim();
  const phone = document.getElementById("cphone").value.trim();
  const address = document.getElementById("caddress").value.trim();

  if (!name || !phone || !address) return alert("Please fill all fields");

  const btn = document.querySelector(".beautiful-order-btn");
  const old = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = "Sending Order...";

  const order = {
    customer_name: name,
    customer_phone: phone,
    delivery_address: address,
    total_price: cartTotal,
    items: cart,             
    note: ""
  };

  try {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("SERVER ERROR:", data);
      alert("Order failed: " + (data.message || "Please try again later"));
      return;
    }

    alert("Order placed successfully!");
    cart = []; 
    updateCart(); 
    closeOrderForm();
    document.getElementById("customerForm").reset();

  } catch (err) {
    console.error(err);
    alert("No internet — your order is saved!");
    localStorage.setItem("pendingOrder", JSON.stringify(order));
  } finally {
    btn.disabled = false;
    btn.innerHTML = old;
  }
};

const showCategory = name => {
  document.querySelectorAll("#categories button").forEach(b => b.classList.toggle("active", b.textContent === name));
  document.querySelectorAll(".category-section").forEach(s => s.classList.toggle("active", s.querySelector("h2").textContent === name));
};

const loadReviews = async () => {
  try {
    const { data = [] } = await (await fetch(`${BASE_URL}/api/feedbacks`)).json();
    const container = document.getElementById("reviews-container");
    container.innerHTML = data.length ? data.map(r => `
      <div class="review-card">
        <h4>${r.customer_name}</h4>
        <div class="stars">${"★".repeat(r.rating)}${"☆".repeat(5-r.rating)}</div>
        <p>${r.comment}</p>
        <small>${new Date(r.created_at).toLocaleDateString("en-NG")}</small>
      </div>
    `).join("") : "<p style='text-align:center;color:#666'>No reviews yet</p>";
  } catch (err) {}
};

document.getElementById("feedbackForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  const rating = document.querySelectorAll(".stars i.fas").length || 5;
  await fetch(`${BASE_URL}/api/feedbacks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customer_name: e.target.customer_name.value, rating, comment: e.target.comment.value })
  });
  e.target.reset();
  document.getElementById("formMessage").textContent = "Thank you! Review submitted";
  document.querySelectorAll(".stars i").forEach(i => i.className = "far fa-star");
  loadReviews();
});

document.querySelectorAll(".stars i").forEach(s => {
  s.addEventListener("click", () => {
    const v = s.dataset.value;
    document.querySelectorAll(".stars i").forEach((x, i) => x.className = i < v ? "fas fa-star filled" : "far fa-star");
  });
});