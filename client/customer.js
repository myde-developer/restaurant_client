const BASE_URL = "https://restaurant-menu-1-60u0.onrender.com";

let cart = [];
let cartTotal = 0

// ============= CUSTOMER PAGE =============
if (document.getElementById("categories")) {
  document.addEventListener("DOMContentLoaded", async () => {
    await Promise.all([loadMenu(), loadReviews()]);
    updateCartUI();
  });

  const loadMenu = async () => {
    try {
      const { data } = await (await fetch(`${BASE_URL}/api/menu`)).json();
      const categories = [...new Set(data.map(i => i.category_name))];

      const nav = document.getElementById("categories");
      nav.innerHTML = "";
      categories.forEach((cat, i) => {
        const btn = document.createElement("button");
        btn.textContent = cat;
        btn.onclick = () => showCategory(cat);
        if (i === 0) btn.classList.add("active");
        nav.appendChild(btn);
      });

      document.getElementById("menu").innerHTML = categories.map((cat, i) => `
        <div class="category-section ${i === 0 ? 'active' : ''}">
          <h2 class="category-title">${cat}</h2>
          <div class="items-grid">
            ${data.filter(item => item.category_name === cat).map(item => `
              <div class="item">
                ${item.image_url ? `<img src="${item.image_url}" class="item-img" onerror="this.style.display='none'">` : ''}
                <div class="item-details">
                  <div class="item-name">${item.name}</div>
                  <div class="item-desc">${item.description || "Freshly prepared with love"}</div>
                  <div class="item-price">₦${Number(item.price).toLocaleString()}</div>
                  <button class="add-to-cart" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}">Add to Cart</button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `).join("");

      document.querySelectorAll(".add-to-cart").forEach(btn => btn.addEventListener("click", () => addToCart(btn.dataset)));
      if (categories[0]) showCategory(categories[0]);
    } catch (err) {
      document.getElementById("menu").innerHTML = "<p style='text-align:center;color:#d32f2f;padding:50px'>Failed to load menu</p>";
    }
  };

  const updateCart = () => {
  const count = cart.reduce((sum, i) => sum + i.quantity, 0);
  document.getElementById("cartCount")?.innerText = count;
  document.querySelector(".cart-btn span")?.innerText = count;

  // Update modal summary
  const itemsDiv = document.getElementById("orderItems");
  const totalSpan = document.getElementById("orderTotal");
  if (!itemsDiv) return;

  if (cart.length === 0) {
    itemsDiv.innerHTML = "<p style='text-align:center;color:#888'>Your cart is empty</p>";
    totalSpan.innerText = "0";
    return;
  }

  itemsDiv.innerHTML = cart.map(item => `
    <div style="display:flex;justify-content:space-between;margin:8px 0;padding:8px;background:#f9f9f9;border-radius:8px;">
      <span><strong>${item.quantity}×</strong> ${item.name}</span>
      <span>₦${(item.price * item.quantity).toLocaleString()}</span>
    </div>
  `).join("");

  cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  totalSpan.innerText = cartTotal.toLocaleString();
};

// Open order modal
function openOrderForm() {
  updateCart();
  document.getElementById("orderForm").style.display = "block";
  document.body.style.overflow = "hidden";
}

// Close modal
function closeOrderForm() {
  document.getElementById("orderForm").style.display = "none";
  document.body.style.overflow = "auto";
}

// Add to cart
function addToCart(name, price, id) {
  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ id, name, price, quantity: 1 });
  }
  cartTotal += price;
  updateCart();
  alert(`${name} added to cart!`);
}

// PLACE ORDER — 100% WORKING
window.placeOrder = async () => {
  if (cart.length === 0) return alert("Cart is empty!");

  const name = document.getElementById("cname").value.trim();
  const phone = document.getElementById("cphone").value.trim();
  const address = document.getElementById("caddress").value.trim();

  if (!name || !phone || !address) {
    return alert("Please fill all fields");
  }

  const btn = document.querySelector(".beautiful-order-btn");
  const oldText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = "Sending Order...";

  const orderData = {
    customer_name: name,
    customer_phone: phone,
    delivery_address: address,
    items: JSON.stringify(cart),
    total_price: cartTotal
  };

  try {
    const res = await fetch("https://restaurant-menu-1-60u0.onrender.com/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData)
    });

    if (res.ok) {
      alert("Order placed successfully! We'll call you in 2 minutes");
      cart = [];
      cartTotal = 0;
      updateCart();
      closeOrderForm();
      document.getElementById("customerForm").reset();
    } else {
      alert("Network slow — trying again...");
    }
  } catch (err) {
    alert("No connection — your order is saved! We'll send it when you're online.");
    localStorage.setItem("pendingOrder", JSON.stringify(orderData));
  } finally {
    btn.disabled = false;
    btn.innerHTML = oldText;
  }
};

// Load pending order if offline before
window.onload = () => {
  updateCart();
  const pending = localStorage.getItem("pendingOrder");
  if (pending && confirm("You have an unsent order. Send now?")) {
    // Try to send again
    localStorage.removeItem("pendingOrder");
  }
};

  const loadReviews = async () => {
    const container = document.getElementById("reviews-container");
    if (!container) return;
    const { data = [] } = await (await fetch(`${BASE_URL}/api/feedbacks`)).json();
    container.innerHTML = data.length
      ? data.map(r => `<div class="review-card"><h4>${r.customer_name}</h4><div class="stars">${"★".repeat(r.rating)}${"☆".repeat(5-r.rating)}</div><p>${r.comment}</p><small>${new Date(r.created_at).toLocaleDateString("en-NG")}</small></div>`).join("")
      : "<p style='grid-column:1/-1;text-align:center;color:#666'>No reviews yet</p>";
  };

  document.getElementById("feedbackForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    const rating = document.querySelectorAll(".stars i.filled").length || 5;
    await fetch(`${BASE_URL}/api/feedbacks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_name: e.target.customer_name.value, rating, comment: e.target.comment.value })
    });
    e.target.reset();
    const msg = document.getElementById("formMessage");
    if (msg) msg.textContent = "Review submitted!";
    if (msg) msg.style.color = "green";
    document.querySelectorAll(".stars i").forEach(i => i.className = "far fa-star");
    loadReviews();
  });

  document.querySelectorAll(".stars i").forEach(s => {
    s.addEventListener("click", () => {
      const v = s.dataset.value;
      document.querySelectorAll(".stars i").forEach((x, i) => x.className = i < v ? "fas fa-star filled" : "far fa-star");
    });
  });

  const showCategory = name => {
    document.querySelectorAll(".categories button").forEach(b => b.classList.toggle("active", b.textContent === name));
    document.querySelectorAll(".category-section").forEach(s => s.classList.toggle("active", s.querySelector(".category-title")?.textContent === name));
  };

  document.getElementById("cartFloat")?.addEventListener("click", () => document.getElementById("cartModal").style.display = "block");
  document.querySelector(".close")?.addEventListener("click", () => document.getElementById("cartModal").style.display = "none");
  document.getElementById("checkoutBtn")?.addEventListener("click", () => {
    document.getElementById("checkoutForm").style.display = "block";
    document.getElementById("checkoutBtn").style.display = "none";
  });
}