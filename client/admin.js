const BASE_URL = 'https://restaurant-menu-1-60u0.onrender.com';
const adminToken = localStorage.getItem('asaToken');
let categories = [];

// ============= ADMIN LOGIN =============
window.login = async () => {
  const username = document.getElementById('username')?.value.trim();
  const password = document.getElementById('password')?.value;
  if (!username || !password) return;

  const msg = document.getElementById('loginMsg');
  msg.textContent = 'Logging in...';
  msg.style.color = '#006400';

  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (data.token) {
      localStorage.setItem('asaToken', data.token);
      location.reload();
    } else {
      msg.textContent = 'Wrong username or password';
      msg.style.color = '#d32f2f';
    }
  } catch (err) {
    msg.textContent = 'Server waking up... wait 30–50s';
    msg.style.color = '#ff6b00';
  }
};

window.logout = () => {
  localStorage.removeItem('asaToken');
  location.reload();
};

// ============= TABS =============
window.openTab = (id) => {
  document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
  document.querySelectorAll('.dash-nav button').forEach((b) => b.classList.remove('active'));

  document.getElementById(id)?.classList.add('active');
  document.querySelector(`button[onclick="openTab('${id}')"]`)?.classList.add('active');

  if (id === 'menu') loadMenuItems();
  if (id === 'categories') loadCategories();
  if (id === 'feedback') loadFeedback();
  if (id === 'orders') loadOrders();
};

const safeSetHTML = (selector, html) => {
  const el = document.querySelector(selector);
  if (el) el.innerHTML = html;
};

// ============= CATEGORIES =============
const loadCategories = async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/category`);
    const { data } = await res.json();
    categories = data || [];

    // Dropdown
    const dropdown = document.getElementById('newCategoryId');
    if (dropdown) {
      dropdown.innerHTML =
        `<option value="">Select Category</option>` +
        data.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
    }

    // Table
    safeSetHTML(
      '#catTable tbody',
      data.length
        ? data
            .map(
              (c) => `
        <tr>
          <td>${c.name}</td>
          <td>
            <button onclick="editCategory(${c.id}, '${c.name.replace(/'/g, "\\'")}')">Edit</button>
            <button onclick="deleteCategory(${c.id})">Delete</button>
          </td>
        </tr>`
            )
            .join('')
        : "<tr><td colspan='2' style='text-align:center;padding:40px;color:#888'>No categories</td></tr>"
    );
  } catch (err) {
    console.error('Load categories error:', err);
  }
};

window.addCategory = async () => {
  const nameInput = document.getElementById('newCatName');
  const name = nameInput?.value.trim();
  if (!name) return alert('Enter category name');

  if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
    return alert(`"${name}" already exists!`);
  }

  const btn = document.querySelector('#categories .action-btn');
  const oldText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Adding...';

  try {
    const res = await fetch(`${BASE_URL}/api/category`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ name }),
    });

    const result = await res.json();

    if (res.ok) {
      nameInput.value = '';
      alert(`"${name}" added successfully!`);
      await loadCategories();
    } else {
      alert('Failed: ' + (result.error || 'Try again'));
    }
  } catch (err) {
    alert('No internet or server error');
  } finally {
    btn.disabled = false;
    btn.textContent = oldText;
  }
};

window.editCategory = async (id, oldName) => {
  const name = prompt('New category name:', oldName);
  if (name && name !== oldName) {
    await fetch(`${BASE_URL}/api/category`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ name }),
    });

    await fetch(`${BASE_URL}/api/category/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    loadCategories();
    loadMenuItems();
  }
};

window.deleteCategory = (id) => {
  if (confirm('Delete this category and ALL its items?')) {
    fetch(`${BASE_URL}/api/category/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then(() => {
      loadCategories();
      loadMenuItems();
    });
  }
};

// ============= MENU ITEMS =============
window.addMenuItem = async () => {
  const category_id = document.getElementById('newCategoryId')?.value;
  const name = document.getElementById('newName')?.value.trim();
  const price = document.getElementById('newPrice')?.value;
  const description = document.getElementById('newDesc')?.value.trim() || null;
  const image_url = document.getElementById('newImage')?.value.trim() || null;
  const is_available = document.getElementById('newAvailable')?.value === 'true';

  if (!category_id || !name || !price) return alert('Fill required fields');

  await fetch(`${BASE_URL}/api/menu`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      category_id,
      name,
      description,
      price,
      image_url,
      is_available,
    }),
  });

  ['newName', 'newPrice', 'newDesc', 'newImage'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  loadMenuItems();
};

window.editMenuItem = (id, oldName, oldPrice, catId, oldDesc, oldImg, avail) => {
  const name = prompt('Name:', oldName);
  const price = prompt('Price:', oldPrice);
  const desc = prompt('Description:', oldDesc || '');
  const img = prompt('Image URL:', oldImg || '');

  if (name && price !== null) {
    fetch(`${BASE_URL}/api/menu/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name,
        description: desc || null,
        price: Number(price),
        image_url: img || null,
        category_id: catId,
        is_available: avail,
      }),
    }).then(() => loadMenuItems());
  }
};

window.deleteMenuItem = (id) => {
  if (confirm('Delete this menu item?')) {
    fetch(`${BASE_URL}/api/menu/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then(() => loadMenuItems());
  }
};

const loadMenuItems = async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/menu`);
    const { data } = await res.json();

    safeSetHTML(
      '#menuTable tbody',
      data.length
        ? data
            .map(
              (i) => `
        <tr>
          <td>${i.name}</td>
          <td>₦${Number(i.price).toLocaleString()}</td>
          <td>${i.category_name}</td>
          <td>${i.is_available ? 'Yes' : 'No'}</td>
          <td>
            <button onclick="editMenuItem(
              ${i.id},
              '${i.name.replace(/'/g, "\\'")}',
              ${i.price},
              ${i.category_id},
              '${(i.description || '').replace(/'/g, "\\'")}',
              '${i.image_url || ''}',
              ${i.is_available}
            )"
            style="background:#ffbf00;padding:6px 12px;border:none;border-radius:5px;cursor:pointer;color:#333;">
              Edit
            </button>
            <button onclick="deleteMenuItem(${i.id})"
              style="background:#d32f2f;color:white;padding:6px 12px;border:none;border-radius:5px;cursor:pointer;">
              Delete
            </button>
          </td>
        </tr>`
            )
            .join('')
        : "<tr><td colspan='5' style='text-align:center;padding:40px;color:#888'>No menu items</td></tr>"
    );
  } catch (err) {
    console.error('Load menu error:', err);
  }
};

// ============= FEEDBACK =============
const loadFeedback = async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/feedbacks`);
    const { data = [] } = await res.json();

    safeSetHTML(
      '#feedbackTable tbody',
      data.length
        ? data
            .map(
              (f) => `
        <tr>
          <td>${f.customer_name}</td>
          <td class="admin-stars">
            ${"<i class='fas fa-star'></i>".repeat(f.rating)}
            ${"<i class='far fa-star'></i>".repeat(5 - f.rating)}
          </td>
          <td>${f.comment}</td>
          <td>${f.menu_item_name || 'N/A'}</td>
          <td>${new Date(f.created_at).toLocaleDateString('en-NG')}</td>
        </tr>`
            )
            .join('')
        : "<tr><td colspan='5' style='text-align:center;padding:50px;color:#888'>No reviews yet</td></tr>"
    );
  } catch (err) {
    console.error('Load feedback error:', err);
  }
};

// ============= ORDERS =============
const loadOrders = async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const { data = [] } = await res.json();

    data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    safeSetHTML(
      '#ordersTable tbody',
      data.length
        ? data
            .map((o) => {
              const items = JSON.parse(o.items || '[]');
              const note = o.note
                ? `<br><br><strong style="color:#d32f2f;font-size:1.1em;">Note: ${o.note}</strong>`
                : '';

              return `
        <tr>
          <td><strong>#${o.id}</strong></td>
          <td>${o.customer_name}</td>
          <td>${o.customer_phone}</td>
          <td>${o.delivery_address || '-'}</td>
          <td><strong>₦${Number(o.total_price).toLocaleString()}</strong></td>
          <td>
            ${new Date(o.created_at).toLocaleDateString('en-NG')}<br>
            <small>${new Date(o.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}</small>
          </td>
          <td style="line-height:1.9;">
            ${items.map((x) => `• ${x.name} ×${x.quantity}`).join('<br>')}
            ${note}
          </td>
        </tr>`;
            })
            .join('')
        : "<tr><td colspan='7' style='text-align:center;padding:80px;color:#888;font-size:1.1rem;'>No orders yet</td></tr>"
    );
  } catch (err) {
    safeSetHTML(
      '#ordersTable tbody',
      "<tr><td colspan='7' style='text-align:center;padding:80px;color:#d32f2f;'>Failed to load orders</td></tr>"
    );
  }
};

// ============= LOAD ON LOGIN =============
if (document.getElementById('loginBox') && adminToken) {
  document.getElementById('loginBox').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  loadMenuItems();
  loadCategories();
  loadFeedback();
  loadOrders();
}