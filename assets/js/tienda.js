// ===== TIENDA.JS - Innovare Barber Tech =====
let productos = [];
let cart = JSON.parse(localStorage.getItem('innovare_cart') || '[]');

// Cargar productos
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const r = await fetch('assets/data/productos.json');
    if (!r.ok) throw new Error('No se pudo cargar productos');
    productos = await r.json();
    renderProducts('todas');
    updateCartUI();
  } catch(e) {
    // Fallback: productos hardcodeados
    productos = [
      { id:1, nombre:'Shampoo Profesional Biotina', categoria:'shampoo', precio:249, img:'🧴' },
      { id:2, nombre:'Shampoo Anticaspa Mentolado', categoria:'shampoo', precio:199, img:'🧴' },
      { id:3, nombre:'Shampoo Voluminizador', categoria:'shampoo', precio:229, img:'🧴' },
      { id:4, nombre:'Shampoo Keratina Reparadora', categoria:'shampoo', precio:279, img:'🧴' },
      { id:5, nombre:'Acondicionador Hidratante Argán', categoria:'acondicionador', precio:259, img:'🧴' },
      { id:6, nombre:'Acondicionador Leave-In', categoria:'acondicionador', precio:219, img:'🧴' },
      { id:7, nombre:'Acondicionador Reparador Barba', categoria:'acondicionador', precio:189, img:'🧴' },
      { id:8, nombre:'Pomada Fuerte Hold Mate', categoria:'pomada', precio:179, img:'💈' },
      { id:9, nombre:'Pomada Brillo Natural', categoria:'pomada', precio:159, img:'💈' },
      { id:10, nombre:'Cera Capilar Texturizante', categoria:'cera', precio:199, img:'💈' },
      { id:11, nombre:'Cera para Barba Modeladora', categoria:'cera', precio:149, img:'🧔' },
      { id:12, nombre:'Aceite Barba Argán + Jojoba', categoria:'aceite', precio:299, img:'🧔' },
      { id:13, nombre:'Aceite Capilar Anticaída', categoria:'aceite', precio:349, img:'💆' },
      { id:14, nombre:'Tónico Capilar Revitalizante', categoria:'tonico', precio:229, img:'💆' },
      { id:15, nombre:'Tónico After Shave Calmante', categoria:'tonico', precio:189, img:'🪒' },
      { id:16, nombre:'Gel Fijador Extra Fuerte', categoria:'gel', precio:139, img:'💈' },
      { id:17, nombre:'Spray Texturizante Salino', categoria:'spray', precio:219, img:'🌊' },
      { id:18, nombre:'Crema para Peinar', categoria:'crema', precio:169, img:'💈' },
      { id:19, nombre:'Kit Viajero (3 piezas)', categoria:'kit', precio:499, img:'🎒' },
      { id:20, nombre:'Peine Carbono Profesional', categoria:'accesorio', precio:129, img:'🪮' },
      { id:21, nombre:'Cepillo Redondo Profesional', categoria:'accesorio', precio:179, img:'🪮' }
    ];
    renderProducts('todas');
    updateCartUI();
  }
  
  // Filtros
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      renderProducts(this.dataset.filter);
    });
  });
});

function renderProducts(filter) {
  const grid = document.getElementById('product-grid');
  const filtered = filter === 'todas' ? productos : productos.filter(p => p.categoria === filter);
  
  grid.innerHTML = filtered.map(p => {
    const inCart = cart.find(c => c.id === p.id);
    return `
      <div class="product-card">
        <span class="product-category">${p.categoria}</span>
        <div class="product-img">${p.img}</div>
        <div class="product-name">${p.nombre}</div>
        <div class="product-desc">${p.descripcion || ''}</div>
        <div class="product-price">$${p.precio}</div>
        <div class="product-actions">
          ${inCart 
            ? `<button class="btn btn-sm btn-outline" onclick="addToCart(${p.id})">✓ En carrito (${inCart.qty})</button>`
            : `<button class="btn btn-sm btn-primary" onclick="addToCart(${p.id})">Agregar</button>`
          }
        </div>
      </div>
    `;
  }).join('');
}

function addToCart(id) {
  const p = productos.find(x => x.id === id);
  if (!p) return;
  const exist = cart.find(c => c.id === id);
  if (exist) {
    exist.qty = (exist.qty || 1) + 1;
  } else {
    cart.push({ id: p.id, nombre: p.nombre, precio: p.precio, img: p.img, qty: 1 });
  }
  saveCart();
  updateCartUI();
  renderProducts(document.querySelector('.filter-btn.active')?.dataset?.filter || 'todas');
}

function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  saveCart();
  updateCartUI();
}

function changeQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty = Math.max(1, (item.qty || 1) + delta);
  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('innovare_cart', JSON.stringify(cart));
}

function updateCartUI() {
  const count = cart.reduce((s, c) => s + (c.qty || 1), 0);
  const total = cart.reduce((s, c) => s + c.precio * (c.qty || 1), 0);
  document.getElementById('cart-count').textContent = count;
  document.getElementById('cart-total').textContent = '$' + total.toFixed(2);
  document.querySelector('.cart-footer').style.display = cart.length ? 'block' : 'none';
  
  // Render carrito
  const items = document.getElementById('cart-items');
  if (!cart.length) {
    items.innerHTML = '<p style="color:#6e6e7e;text-align:center;padding:2rem;">Carrito vacío</p>';
    return;
  }
  items.innerHTML = cart.map(c => `
    <div class="cart-item">
      <div class="cart-item-img">${c.img}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${c.nombre}</div>
        <div class="cart-item-price">$${(c.precio * (c.qty || 1)).toFixed(2)}</div>
      </div>
      <div class="cart-item-qty">
        <button class="qty-btn" onclick="changeQty(${c.id}, -1)">−</button>
        <span>${c.qty || 1}</span>
        <button class="qty-btn" onclick="changeQty(${c.id}, 1)">+</button>
      </div>
      <span class="cart-item-remove" onclick="removeFromCart(${c.id})">✕</span>
    </div>
  `).join('');
}

function toggleCart() {
  document.getElementById('cart-sidebar').classList.toggle('open');
  document.getElementById('cart-overlay').classList.toggle('open');
}

// ===== CHECKOUT =====
function showCheckout() {
  if (!cart.length) return alert('Carrito vacío');
  toggleCart();
  document.getElementById('checkout-modal').style.display = 'flex';
  gotoStep1();
}

function closeCheckout() {
  document.getElementById('checkout-modal').style.display = 'none';
}

function gotoStep1() {
  document.getElementById('checkout-step-1').style.display = 'block';
  document.getElementById('checkout-step-2').style.display = 'none';
  document.getElementById('checkout-step-3').style.display = 'none';
  document.querySelectorAll('.step').forEach((s, i) => s.classList.toggle('active', i === 0));
  
  // Render resumen
  const items = document.getElementById('checkout-items');
  items.innerHTML = cart.map(c => `
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f4;font-size:0.9rem;">
      <span>${c.img} ${c.nombre} x${c.qty || 1}</span>
      <span style="font-weight:600;">$${(c.precio * (c.qty || 1)).toFixed(2)}</span>
    </div>
  `).join('');
  
  const subtotal = cart.reduce((s, c) => s + c.precio * (c.qty || 1), 0);
  const envio = subtotal >= 500 ? 0 : 59;
  const total = subtotal + envio;
  
  document.getElementById('co-subtotal').textContent = '$' + subtotal.toFixed(2);
  document.getElementById('co-envio').textContent = envio === 0 ? 'Gratis' : '$' + envio.toFixed(2);
  document.getElementById('co-total').textContent = '$' + total.toFixed(2);
}

function gotoStep2() {
  document.getElementById('checkout-step-1').style.display = 'none';
  document.getElementById('checkout-step-2').style.display = 'block';
  document.getElementById('checkout-step-3').style.display = 'none';
  document.querySelectorAll('.step').forEach((s, i) => s.classList.toggle('active', i === 1));
  
  const total = cart.reduce((s, c) => s + c.precio * (c.qty || 1), 0) + (total >= 500 ? 0 : 59);
  document.getElementById('pay-amount').textContent = '$' + total.toFixed(2);
}

async function processPayment() {
  const payment = document.querySelector('input[name="payment"]:checked').value;
  const btn = document.querySelector('#checkout-step-2 .btn-primary');
  btn.disabled = true;
  btn.textContent = 'Procesando...';
  
  const names = { stripe: 'Stripe', paypal: 'PayPal', mercado: 'Mercado Pago', oxxo: 'OXXO', spei: 'SPEI' };
  const subtotal = cart.reduce((s, c) => s + c.precio * (c.qty || 1), 0);
  const envio = subtotal >= 500 ? 0 : 59;
  const total = subtotal + envio;
  
  const orderData = {
    id: 'ORD-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase(),
    items: cart.map(c => ({ id: c.id, nombre: c.nombre, precio: c.precio, qty: c.qty || 1 })),
    subtotal: subtotal,
    envio: envio,
    total: total,
    paymentMethod: payment,
    paymentMethodName: names[payment],
    status: 'completado',
    fecha: new Date().toISOString(),
    cliente: JSON.parse(localStorage.getItem('innovare_user') || '{}').email || 'Invitado'
  };
  
  // Simular procesamiento de pago
  await new Promise(r => setTimeout(r, 2000));
  
  // Guardar en localStorage
  const orders = JSON.parse(localStorage.getItem('innovare_orders') || '[]');
  orders.unshift(orderData);
  localStorage.setItem('innovare_orders', JSON.stringify(orders));
  
  // Guardar en Supabase si está conectado
  try {
    if (window.InnovareDB && InnovareDB.isConnected()) {
      await InnovareDB.saveOrder(orderData);
    }
  } catch(e) {
    console.log('Order saved locally (Supabase unavailable)');
  }
  
  // Mostrar confirmación
  document.getElementById('checkout-step-1').style.display = 'none';
  document.getElementById('checkout-step-2').style.display = 'none';
  document.getElementById('checkout-step-3').style.display = 'block';
  document.querySelectorAll('.step').forEach((s, i) => s.classList.toggle('active', i === 2));
  
  document.getElementById('order-number').textContent = orderData.id;
  document.getElementById('order-payment').textContent = names[payment];
  document.getElementById('order-total').textContent = '$' + total.toFixed(2);
  document.getElementById('order-date').textContent = new Date().toLocaleDateString('es-MX', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' });
  
  // Limpiar carrito
  cart = [];
  saveCart();
  updateCartUI();
  
  btn.disabled = false;
  btn.textContent = 'Pagar';
}