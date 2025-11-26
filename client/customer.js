const BASE_URL = 'https://restaurant-menu-1-60u0.onrender.com';
let cart = JSON.parse(localStorage.getItem('asaCart') || '[]');

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([loadMenu(), loadReviews()]);
  updateCart();
});

const loadMenu = async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/menu`);
    const { data } = await res.json();
    const categories = [...new Set(data.map((i) => i.category_name))];

    // Category buttons
    document.getElementById('categories').innerHTML = categories
      .map(
        (cat, i) =>
          `<button ${
            i === 0 ? 'class="active"' : ''
          } onclick="showCategory('${cat}')">${cat}</button>`
      )
      .join('');

    // Menu items
    document.getElementById('menu').innerHTML = categories
      .map(
        (cat, i) => `
      <div class="category-section ${i === 0 ? 'active' : ''}">
        <h2 class="category-title">${cat}</h2>
        <div class="items-grid">
          ${data
            .filter((item) => item.category_name === cat)
            .map(
              (item) => `
            <div class="item" onclick="window.location='food.html?id=${
              item.id
            }'" style="cursor:pointer;">
              ${
                item.image_url
                  ? `<img src="${item.image_url}" class="item-img" onerror="this.src='https://via.placeholder.com/300'" alt="${item.name}">`
                  : ''
              }
              <div class="item-details">
                <div class="item-name">${item.name}</div>
                <div class="item-desc">${
                  item.description || 'Freshly prepared'
                }</div>
                <div class="item-price">₦${Number(
                  item.price
                ).toLocaleString()}</div>
              </div>
            </div>`
            )
            .join('')}
        </div>
      </div>`
      )
      .join('');

    if (categories[0]) showCategory(categories[0]);
  } catch (err) {
    document.getElementById('menu').innerHTML =
      "<p style='text-align:center;color:#d32f2f;padding:100px;'>No internet connection</p>";
  }
};

const updateCart = () => {
  const count = cart.reduce((s, i) => s + i.quantity, 0);
  document
    .querySelectorAll('#floatCount, #cartCount')
    .forEach((el) => el && (el.textContent = count));
};

function addToCart(id, name, price) {
  const existing = cart.find((i) => i.id === id);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ id, name, price: Number(price), quantity: 1 });
  }
  localStorage.setItem('asaCart', JSON.stringify(cart));
  updateCart();
  alert(`${name} added to cart!`);
}

function openOrderForm() {
  if (cart.length === 0) return alert('Your cart is empty!');

  let html = '';
  let total = 0;

  cart.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    html += `
      <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #eee;">
        <span><strong>${item.quantity}×</strong> ${item.name}</span>
        <span>₦${itemTotal.toLocaleString()}</span>
      </div>`;
  });

  document.getElementById('orderItems').innerHTML = html;
  document.getElementById('orderTotal').textContent = total.toLocaleString();
  document.getElementById('orderForm').style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeOrderForm() {
  document.getElementById('orderForm').style.display = 'none';
  document.body.style.overflow = 'auto';
}

window.placeOrder = async () => {
  const name = document.getElementById('cname').value.trim();
  const phone = document.getElementById('cphone').value.trim();
  const address = document.getElementById('caddress').value.trim();

  if (!name || !phone || !address) return alert('Please fill all fields');

  const btn = document.querySelector('.beautiful-order-btn');
  const oldText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = 'Sending Order...';

  const orderData = {
    customer_name: name,
    customer_phone: phone,
    delivery_address: address,
    note: document.getElementById('cnote').value.trim() || null,
    items: JSON.stringify(cart),
    total_price: cart.reduce((sum, i) => sum + i.price * i.quantity, 0),
  };

  try {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });

    if (res.ok) {
      alert("Order placed successfully! We'll call you soon");
      cart = [];
      localStorage.removeItem('asaCart');
      updateCart();
      closeOrderForm();
      document.getElementById('customerForm').reset();
    } else {
      throw new Error('Failed');
    }
  } catch (err) {
    alert(
      "No internet — your order is saved! We'll send it when you're online."
    );
    localStorage.setItem('pendingOrder', JSON.stringify(orderData));
  } finally {
    btn.disabled = false;
    btn.innerHTML = oldText;
  }
};

const showCategory = (name) => {
  document.querySelectorAll('#categories button').forEach((b) => {
    b.classList.toggle('active', b.textContent === name);
  });
  document.querySelectorAll('.category-section').forEach((section) => {
    const title = section.querySelector('h2')?.textContent;
    section.classList.toggle('active', title === name);
  });
};

const loadReviews = async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/feedbacks`);
    const { data = [] } = await res.json();

    const container = document.getElementById('reviews-container');
    container.innerHTML = data.length
      ? data
          .map(
            (r) => `
      <div class="review-card">
        <h4>${r.customer_name}</h4>
        <div class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(
              5 - r.rating
            )}</div>
        <p>${r.comment}</p>
        <small>${new Date(r.created_at).toLocaleDateString('en-NG')}</small>
      </div>`
          )
          .join('')
      : "<p style='text-align:center;color:#888;padding:60px;'>No reviews yet. Be the first!</p>";
  } catch (err) {
    console.error('Failed to load reviews');
  }
};

// ======= FEEDBACK FORM =========
document
  .getElementById('feedbackForm')
  ?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const rating = document.querySelectorAll('.stars i.fas').length || 5;

    await fetch(`${BASE_URL}/api/feedbacks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: e.target.customer_name.value,
        rating,
        comment: e.target.comment.value,
      }),
    });

    e.target.reset();

    document.getElementById('formMessage').textContent =
      'Thank you! Review submitted';
    document.getElementById('formMessage').style.color = 'green';

    document
      .querySelectorAll('.stars i')
      .forEach((i) => (i.className = 'far fa-star'));

    loadReviews();
  });

// Star rating
document.querySelectorAll('.stars i').forEach((star) => {
  star.addEventListener('click', () => {
    const value = star.dataset.value;
    document.querySelectorAll('.stars i').forEach((s, i) => {
      s.className = i < value ? 'fas fa-star filled' : 'far fa-star';
    });
  });
});
