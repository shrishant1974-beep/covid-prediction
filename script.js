// Fixed version: All DOM & events inside DOMContentLoaded, syntax clean
const products = [
  { id: 1, name: 'Running Shoes', price: 79.99, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', desc: 'Comfortable running shoes for daily use.', category: 'shoes' },
{ id: 2, name: 'Luxury Watch', price: 299.99, image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', desc: 'Elegant stainless steel watch.', category: 'watch' },
  { id: 3, name: 'Leather Bag', price: 129.99, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', desc: 'Premium leather handbag.', category: 'bag' },
{ id: 4, name: 'Smartphone', price: 699.99, image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8c21hcnRwaG9uZXxlbnwwfHwwfHx8MA%3D%3D', desc: 'Latest model smartphone with great camera.', category: 'phone' },
  { id: 5, name: 'Sneakers', price: 89.99, image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', desc: 'Stylish casual sneakers.', category: 'shoes' },
{ id: 6, name: 'Sports Watch', price: 199.99, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8BOQaSYh4ktWMy-db6XBXH9fpV8vYmTpBCQ&s', desc: 'Water-resistant sports watch.', category: 'watch' },
{ id: 7, name: 'Backpack', price: 59.99, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', desc: 'Durable travel backpack.', category: 'bag' },
  { id: 8, name: 'Tablet', price: 399.99, image: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', desc: 'High-performance tablet.', category: 'phone' }
];

let cart = JSON.parse(localStorage.getItem('cart')) || [];

function renderProducts(container, productsToShow = products) {
  container.innerHTML = '';
  productsToShow.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card fade-in';
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="product-img">
      <div class="product-info">
        <h3 class="product-name">${product.name}</h3>
        <div class="price-tag">$${product.price.toFixed(2)}</div>
        <button class="add-to-cart">Add to Cart</button>
      </div>
    `;
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('add-to-cart')) {
        addToCart(product.id);
      } else {
        showProductModal(product);
      }
    });
    container.appendChild(card);
  });
}

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  const cartItem = cart.find(item => item.id === productId);
  if (cartItem) {
    cartItem.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  updateCart();
}

function updateCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
  if (cartCount) cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
  renderCartModal();
}

function renderCartModal() {
  const itemsContainer = document.getElementById('cart-items-modal');
  const totalEl = document.getElementById('total-price-modal');
  if (!itemsContainer || !totalEl) return;
  itemsContainer.innerHTML = '';
  let total = 0;
  if (cart.length === 0) {
    itemsContainer.innerHTML = '<p style="text-align: center; font-size: 1.2rem; color: rgba(255,255,255,0.6);">Your cart is empty.</p>';
    totalEl.textContent = '$0.00';
    totalEl.style.color = 'rgba(255,255,255,0.5)';
  } else {
    cart.forEach((item, index) => {
      total += item.price * item.quantity;
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <span>${item.name}</span>
        <div>
          <button onclick="updateQuantity(${index}, -1)">-</button>
          <span>${item.quantity}</span>
          <button onclick="updateQuantity(${index}, 1)">+</button>
          <button onclick="removeFromCart(${index})">Remove</button>
        </div>
        <span>$${(item.price * item.quantity).toFixed(2)}</span>
      `;
      itemsContainer.appendChild(div);
    });
    totalEl.textContent = `$${total.toFixed(2)}`;
    totalEl.style.color = '#00ff88';
  }
}

window.updateQuantity = function(index, delta) {
  cart[index].quantity += delta;
  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }
  updateCart();
};

window.removeFromCart = function(index) {
  cart.splice(index, 1);
  updateCart();
};

function applyFilters() {
  let filtered = products;
  const term = document.getElementById('searchInput').value.toLowerCase().trim();
  if (term) {
    filtered = filtered.filter(p => p.name.toLowerCase().includes(term));
  }
  const active = document.querySelector('.filter-btn.active');
  if (active && active.dataset.category !== 'all') {
    filtered = filtered.filter(p => p.category === active.dataset.category);
  }
  renderProducts(productsGrid, filtered);
}

function showProductModal(product) {
  const details = document.getElementById('product-details');
  const modal = document.getElementById('product-modal');
  details.innerHTML = `
    <img src="${product.image}" alt="${product.name}" style="width:100%;border-radius:10px;">
    <h2>${product.name}</h2>
    <div class="price-tag">$${product.price.toFixed(2)}</div>
    <p>${product.desc}</p>
    <button class="add-to-cart">Add to Cart</button>
  `;
  const btn = details.querySelector('.add-to-cart');
  btn.onclick = () => addToCart(product.id);
  modal.style.display = 'flex';
}

function showCartModal() {
  renderCartModal();
  document.getElementById('cart-modal').style.display = 'flex';
}

function showCheckoutModal() {
  document.getElementById('checkout-modal').style.display = 'flex';
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  productsGrid = document.getElementById('products-grid');
  searchInput = document.getElementById('searchInput');
  filterBtns = document.querySelectorAll('.filter-btn');
  cartCount = document.getElementById('cart-count');
  productModal = document.getElementById('product-modal');
  cartModal = document.getElementById('cart-modal');
  checkoutModal = document.getElementById('checkout-modal');
  productDetails = document.getElementById('product-details');
  cartItemsModal = document.getElementById('cart-items-modal');
  totalPriceModal = document.getElementById('total-price-modal');

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilters();
    });
  });

  // Modals
  document.querySelector('.cart-icon').addEventListener('click', showCartModal);
  document.querySelectorAll('.close').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.closest('.modal').id));
  });
  window.addEventListener('click', e => {
    if (e.target.classList.contains('modal')) {
      closeModal(e.target.id);
    }
  });
  const form = document.getElementById('checkout-form');
  if (form) {
  form.addEventListener('submit', e => {
      e.preventDefault();
      alert('Order placed successfully! Thank you for shopping at Strikes.');
      cart = [];
      localStorage.removeItem('cart');
      updateCart();
      closeModal('checkout-modal');
    });
  }

  renderProducts(productsGrid);
  updateCart();
});
