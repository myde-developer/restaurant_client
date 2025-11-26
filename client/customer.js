const BASE_URL = 'https://restaurant-menu-1-60u0.onrender.com';
let cart = JSON.parse(localStorage.getItem('asaCart') || '[]');

document.addEventListener('DOMContentLoaded', async () => {
  if (document.getElementById('menu')) {
    await loadMenu();
    updateCart();
  }
  if (document.getElementById('foodDetails')) {
    await initFoodPage();
  }
});

const loadMenu = async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/menu`);
    const { data } = await res.json();
    const categories = [...new Set(data.map((i) => i.category_name))];

    document.getElementById('categories').innerHTML = categories
      .map(
        (cat, i) =>
          `<button ${
            i === 0 ? 'class="active"' : ''
          } onclick="showCategory('${cat}')">${cat}</button>`
      )
      .join('');

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
                  ? `<img src="${item.image_url}" class="item-img" onerror="this.src='https://via.placeholder.com/300x200/006400/ffffff?text=No+Image'" alt="${item.name}">`
                  : `<img src="https://via.placeholder.com/300x200/006400/ffffff?text=No+Image" class="item-img" alt="${item.name}">`
              }
              <div class="item-details">
                <div class="item-name">${item.name}</div>
                <div class="item-desc">${
                  item.description || 'Freshly prepared'
                }</div>
                <div class="item-price">₦${Number(
                  item.price
                ).toLocaleString()}</div>
                <button onclick="event.stopPropagation(); addToCart(${item.id}, '${item.name.replace(/'/g, "\\'")}', ${item.price})" 
                        class="add-to-cart">
                  Add to Cart
                </button>
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

async function initFoodPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const foodId = urlParams.get('id');
  
  if (foodId) {
    await loadFoodDetails(foodId);
    await loadFoodReviews(foodId);
  }
  
  // Initialize star rating for food page
  document.querySelectorAll('#rateStars i').forEach(star => {
    star.addEventListener('click', () => {
      const value = parseInt(star.dataset.value);
      document.querySelectorAll('#rateStars i').forEach((s, i) => {
        s.className = i < value ? 'fas fa-star filled' : 'far fa-star';
      });
    });
  });
}

async function loadFoodDetails(id) {
  try {
    const res = await fetch(`${BASE_URL}/api/menu/${id}`);
    const { data } = await res.json();
    
    if (data) {
      document.getElementById('foodDetails').innerHTML = `
        <div class="food-grid">
          <div class="food-image">
            <img src="${data.image_url || 'https://via.placeholder.com/500x400/006400/ffffff?text=No+Image'}" 
                 alt="${data.name}" 
                 onerror="this.src='https://via.placeholder.com/500x400/006400/ffffff?text=No+Image'">
          </div>
          <div class="food-info">
            <h1>${data.name}</h1>
            <div class="food-desc">${data.description || 'Freshly prepared with authentic ingredients'}</div>
            <div class="food-price">₦${Number(data.price).toLocaleString()}</div>
            <button onclick="addToCart(${data.id}, '${data.name.replace(/'/g, "\\'")}', ${data.price})" 
                    class="add-to-cart-big">
              Add to Cart - ₦${Number(data.price).toLocaleString()}
            </button>
          </div>
        </div>
      `;
    } else {
      document.getElementById('foodDetails').innerHTML = `
        <p style="text-align:center;color:#d32f2f;padding:100px;">Food item not found</p>
      `;
    }
  } catch (err) {
    console.error('Error loading food details:', err);
    document.getElementById('foodDetails').innerHTML = `
      <p style="text-align:center;color:#d32f2f;padding:100px;">Failed to load food details. Please check your connection.</p>
    `;
  }
}

async function loadFoodReviews(foodId) {
  try {
    const res = await fetch(`${BASE_URL}/api/feedbacks?menu_item_id=${foodId}`);
    const { data = [] } = await res.json();
    
    const reviewsContainer = document.getElementById('foodReviews');
    if (data.length > 0) {
      reviewsContainer.innerHTML = data.map(review => `
        <div class="review-card">
          <h4>${review.customer_name || 'Anonymous'}</h4>
          <div class="stars">
            ${'<i class="fas fa-star"></i>'.repeat(review.rating)}
            ${'<i class="far fa-star"></i>'.repeat(5 - review.rating)}
          </div>
          <p>${review.comment}</p>
          <small>${new Date(review.created_at).toLocaleDateString('en-NG')}</small>
        </div>
      `).join('');
    } else {
      reviewsContainer.innerHTML = `
        <div style="text-align:center;padding:40px;color:#888;grid-column:1/-1;">
          <p>No reviews yet. Be the first to review this food!</p>
        </div>
      `;
    }
  } catch (err) {
    console.error('Error loading reviews:', err);
    document.getElementById('foodReviews').innerHTML = `
      <div style="text-align:center;padding:40px;color:#d32f2f;grid-column:1/-1;">
        <p>Failed to load reviews</p>
      </div>
    `;
  }
}

async function submitFoodReview() {
  const urlParams = new URLSearchParams(window.location.search);
  const foodId = urlParams.get('id');
  const rating = document.querySelectorAll('#rateStars i.fas').length;
  const comment = document.getElementById('foodComment').value.trim();
  
  if (!rating) return alert('Please select a rating');
  if (!comment) return alert('Please enter a comment');
  if (!foodId) return alert('Food ID missing');
  
  const btn = document.querySelector('.submit-review-btn');
  const oldText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Submitting...';
  
  try {
    const res = await fetch(`${BASE_URL}/api/feedbacks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Customer',
        rating,
        comment,
        menu_item_id: parseInt(foodId)
      })
    });
    
    if (res.ok) {
      document.getElementById('reviewMessage').textContent = 'Review submitted successfully!';
      document.getElementById('reviewMessage').style.color = '#006400';
      document.getElementById('foodComment').value = '';
      
      // Reset stars
      document.querySelectorAll('#rateStars i').forEach(star => {
        star.className = 'far fa-star';
      });
      
      // Reload reviews
      await loadFoodReviews(foodId);
    } else {
      throw new Error('Failed to submit review');
    }
  } catch (err) {
    document.getElementById('reviewMessage').textContent = 'Failed to submit review. Please try again.';
    document.getElementById('reviewMessage').style.color = '#d32f2f';
  } finally {
    btn.disabled = false;
    btn.textContent = oldText;
  }
}

// ============ GLOBAL FUNCTIONS ============
window.addToCart = addToCart;
window.openOrderForm = openOrderForm;
window.closeOrderForm = closeOrderForm;
window.placeOrder = placeOrder;
window.showCategory = showCategory;
window.submitFoodReview = submitFoodReview;