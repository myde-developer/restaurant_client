const BASE_URL = "https://restaurant-menu-1-60u0.onrender.com";

let cart = [];

// ============= CUSTOMER PAGE =============
if (document.getElementById("categories")) {
  document.addEventListener("DOMContentLoaded", async () => {
    await Promise.all([loadMenu(), loadReviews()]);
  });

  const loadMenu = async () => {
    try {
      const { data } = await (await fetch(`${BASE_URL}/api/menu`)).json();
      const categories = [...new Set(data.map(i => i.category_name))];

      const nav = document.getElementById("categories");
      categories.forEach((cat, i) => {
        const btn = document.createElement("button");
        btn.textContent = cat;
        btn.onclick = () => showCategory(cat);
        btn.className = i === 0 ? "active" : "";
        nav.appendChild(btn);
      });

      const container = document.getElementById("menu");
      container.innerHTML = categories.map((cat, i) => `
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
                  <button class="add-to-cart" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}">
                    Add to Cart
                  </button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `).join("");

      document.querySelectorAll(".add-to-cart").forEach(btn => {
        btn.addEventListener("click", () => addToCart(btn.dataset));
      });

      if (categories[0]) showCategory(categories[0]);
    } catch (err) {
      document.getElementById("menu").innerHTML = "<p style='text-align:center;color:#d32f2f;padding:50px'>Failed to load menu</p>";
    }
  };

  const addToCart = ({ id, name, price }) => {
    const item = cart.find(i => i.id === id);
    item ? item.quantity++ : cart.push({ id, name, price: Number(price), quantity: 1 });
    updateCartUI();
  };

  const updateCartUI = () => {
    const count = cart.reduce((s, i) => s + i.quantity, 0);
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

    document.getElementById("cartCount").textContent = count;
    document.getElementById("floatCount").textContent = count;
    document.getElementById("cartTotal").textContent = total.toLocaleString();

    document.getElementById("cartItems").innerHTML = cart.length
      ? cart.map(i => `<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #eee;">
          <span><strong>${i.name}</strong> × ${i.quantity}</span>
          <span>₦${(i.price * i.quantity).toLocaleString()}</span>
        </div>`).join("")
      : "<p style='text-align:center;color:#999;padding:40px'>Your cart is empty</p>";
  };

  window.placeOrder = async () => {
    const payload = {
      customer_name: document.getElementById("orderName").value,
      customer_phone: document.getElementById("orderPhone").value,
      delivery_address: document.getElementById("orderAddress").value,
      note: document.getElementById("orderNote").value || "",
      total_price: cart.reduce((s, i) => s + i.price * i.quantity, 0),
      items: JSON.stringify(cart)
    };

    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert("Order placed successfully! We'll call you soon");
      cart = [];
      updateCartUI();
      document.getElementById("cartModal").style.display = "none";
    }
  };

  document.getElementById("cartFloat").onclick = () => document.getElementById("cartModal").style.display = "block";
  document.querySelector(".close").onclick = () => document.getElementById("cartModal").style.display = "none";
  document.getElementById("checkoutBtn").onclick = () => {
    document.getElementById("checkoutForm").style.display = "block";
    document.getElementById("checkoutBtn").style.display = "none";
  };

  const loadReviews = async () => {
    const { data = [] } = await (await fetch(`${BASE_URL}/api/feedbacks`)).json();
    document.getElementById("reviews-container").innerHTML = data.length
      ? data.map(r => `
          <div class="review-card">
            <h4>${r.customer_name}</h4>
            <div class="stars">${"★".repeat(r.rating)}${"☆".repeat(5-r.rating)}</div>
            <p>${r.comment}</p>
            <small>${new Date(r.created_at).toLocaleDateString("en-NG")}</small>
          </div>
        `).join("")
      : "<p style='grid-column:1/-1;text-align:center;color:#666'>No reviews yet</p>";
  };

  document.getElementById("feedbackForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    const rating = document.querySelectorAll(".stars i.filled").length || 5;
    await fetch(`${BASE_URL}/api/feedbacks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: e.target.customer_name.value,
        rating,
        comment: e.target.comment.value
      })
    });
    e.target.reset();
    document.getElementById("formMessage").textContent = "Thank you! Review submitted.";
    document.getElementById("formMessage").style.color = "green";
    document.querySelectorAll(".stars i").forEach(i => i.className = "far fa-star");
    loadReviews();
  });

  document.querySelectorAll(".stars i").forEach(s => {
    s.addEventListener("click", () => {
      const v = s.dataset.value;
      document.querySelectorAll(".stars i").forEach((x, i) => {
        x.className = i < v ? "fas fa-star filled" : "far fa-star";
      });
    });
  });

  const showCategory = name => {
    document.querySelectorAll(".categories button").forEach(b => b.classList.toggle("active", b.textContent === name));
    document.querySelectorAll(".category-section").forEach(s => s.classList.toggle("active", s.querySelector(".category-title").textContent === name));
  };
}
