// ===== TIENDA.JS - Innovare Barber Tech =====
let productos = [];
let cart = JSON.parse(localStorage.getItem('innovare_cart') || '[]');

// 1. Cargar productos
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const r = await fetch('assets/data/productos.json');
    if (!r.ok) throw new Error('No se pudo cargar productos');
    productos = await r.json();
    renderProducts('todas');
    updateCartUI();
  } catch(e) {
    // Fallback: productos hardcodeados
    // Fallback: productos con rutas de imágenes reales
    productos = [
      { id:1, nombre:'Shampoo Profesional Biotina', categoria:'shampoo', precio:249, img:'assets/img/productos/shampoo-biotina.png' },
      { id:2, nombre:'Shampoo Anticaspa Mentolado', categoria:'shampoo', precio:199, img:'assets/img/productos/shampoo-anticaspa.png' },
      { id:3, nombre:'Shampoo Voluminizador', categoria:'shampoo', precio:229, img:'assets/img/productos/shampoo-volumen.png' },
      { id:4, nombre:'Shampoo Keratina Reparadora', categoria:'shampoo', precio:279, img:'assets/img/productos/shampoo-keratina.png' },
      { id:5, nombre:'Acondicionador Hidratante Argán', categoria:'acondicionador', precio:259, img:'assets/img/productos/acondicionador-argan.png' },
      { id:6, nombre:'Acondicionador Leave-In', categoria:'acondicionador', precio:219, img:'assets/img/productos/acondicionador-leavein.png' },
      { id:7, nombre:'Acondicionador Reparador Barba', categoria:'acondicionador', precio:189, img:'assets/img/productos/acondicionador-barba.png' },
      { id:8, nombre:'Pomada Fuerte Hold Mate', categoria:'pomada', precio:179, img:'assets/img/productos/pomada-fuerte.png' },
      { id:9, nombre:'Pomada Brillo Natural', categoria:'pomada', precio:159, img:'assets/img/productos/pomada-brillo.png' },
      { id:10, nombre:'Cera Capilar Texturizante', categoria:'cera', precio:199, img:'assets/img/productos/cera-texturizante.png' },
      { id:11, nombre:'Cera para Barba Modeladora', categoria:'cera', precio:149, img:'assets/img/productos/cera-barba.png' },
      { id:12, nombre:'Aceite Barba Argán + Jojoba', categoria:'aceite', precio:299, img:'assets/img/productos/aceite-argan.png' },
      { id:13, nombre:'Aceite Capilar Anticaída', categoria:'aceite', precio:349, img:'assets/img/productos/aceite-anticaida.png' },
      { id:14, nombre:'Tónico Capilar Revitalizante', categoria:'tonico', precio:229, img:'assets/img/productos/tonico-revitalizante.png' },
      { id:15, nombre:'Tónico After Shave Calmante', categoria:'tonico', precio:189, img:'assets/img/productos/tonico-aftershave.png' },
      { id:16, nombre:'Gel Fijador Extra Fuerte', categoria:'gel', precio:139, img:'assets/img/productos/gel-fijador.png' },
      { id:17, nombre:'Spray Texturizante Salino', categoria:'spray', precio:219, img:'assets/img/productos/spray-salino.png' },
      { id:18, nombre:'Crema para Peinar', categoria:'crema', precio:169, img:'assets/img/productos/crema-peinar.png' },
      { id:19, nombre:'Kit Viajero (3 piezas)', categoria:'kit', precio:499, img:'assets/img/productos/kit-viajero.png' },
      { id:20, nombre:'Peine Carbono Profesional', categoria:'accesorio', precio:129, img:'assets/img/productos/peine-carbono.png' },
      { id:21, nombre:'Cepillo Redondo Profesional', categoria:'accesorio', precio:179, img:'assets/img/productos/cepillo-redondo.png' }
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

  initPaymentToggle();
});

function initPaymentToggle() {
  const paymentRadios = document.querySelectorAll('input[name="payment"]');
  paymentRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const method = e.target.value;
      const allForms = ['card-form', 'instructions-digital', 'instructions-oxxo', 'instructions-spei'];
      allForms.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = 'none';
      });
      if (method === 'stripe') {
        document.getElementById('card-form').style.display = 'block';
      } else if (method === 'paypal' || method === 'mercado') {
        document.getElementById('instructions-digital').style.display = 'block';
      } else {
        document.getElementById(`instructions-${method}`).style.display = 'block';
      }
    });
  });
}

// 2. Función Helper Centralizada para las matemáticas (Aplica VIP Tech 15%)
function calcularTotales() {
  const count = cart.reduce((s, c) => s + (c.qty || 1), 0);
  const subtotal = cart.reduce((s, c) => s + c.precio * (c.qty || 1), 0);
  
  let discount = 0;
  let isVIP = false;
  
  // Verificar Membresía VIP Tech
  const memStr = localStorage.getItem('innovare_membership');
  if (memStr) {
    const mem = JSON.parse(memStr);
    if (mem.status === 'active' && mem.name === 'VIP Tech') {
      discount = subtotal * 0.15; // 15% de descuento
      isVIP = true;
    }
  }

  const subtotalFinal = subtotal - discount;
  // Envío gratis en compras mayores a 500 (después del descuento)
  const envio = (subtotalFinal >= 500 || subtotalFinal === 0) ? 0 : 59;
  const total = subtotalFinal + envio;

  return { count, subtotal, discount, isVIP, subtotalFinal, envio, total };
}

function renderProducts(filter) {
  const grid = document.getElementById('product-grid');
  const filtered = filter === 'todas' ? productos : productos.filter(p => p.categoria === filter);
  
  grid.innerHTML = filtered.map(p => {
    const inCart = cart.find(c => c.id === p.id);
    return `
      <div class="product-card">
        <span class="product-category">${p.categoria}</span>
        <div class="product-img" style="text-align: center; margin-bottom: 1rem;">
          <img src="${p.img}" alt="${p.nombre}" style="width: 100%; height: 150px; object-fit: contain; drop-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        </div>
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
  const totales = calcularTotales();
  
  document.getElementById('cart-count').textContent = totales.count;
  
  // Mostrar descuento en el carrito lateral
  if (totales.isVIP && totales.count > 0) {
    document.getElementById('cart-total').innerHTML = `<span style="text-decoration:line-through; font-size:0.8rem; color:#9e9eae;">$${totales.subtotal.toFixed(2)}</span> <span style="color:#00E5FF;">$${totales.total.toFixed(2)}</span>`;
  } else {
    document.getElementById('cart-total').textContent = '$' + totales.total.toFixed(2);
  }
  
  document.querySelector('.cart-footer').style.display = cart.length ? 'block' : 'none';
  
  const items = document.getElementById('cart-items');
  if (!cart.length) {
    items.innerHTML = '<p style="color:#6e6e7e;text-align:center;padding:2rem;">Carrito vacío</p>';
    return;
  }
  // Dentro de la función updateCartUI(), busca la parte del items.innerHTML y cámbiala por esto:
  // Dentro de la función updateCartUI(), busca la parte del items.innerHTML y cámbiala por esto:
  // CÓDIGO CORREGIDO
  items.innerHTML = cart.map(c => `
    <div class="cart-item" style="display: grid; grid-template-columns: 60px 1fr auto; gap: 15px; align-items: center; padding: 15px 0; border-bottom: 1px solid #f0f0f4; position: relative;">
      
      <div class="cart-item-img" style="width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; background: #fff; border-radius: 8px; overflow: hidden; border: 1px solid #e8eaf0;">
        <img src="${c.img}" alt="${c.nombre}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
      </div>
      
      <div class="cart-item-info" style="display: flex; flex-direction: column; gap: 4px;">
        <div class="cart-item-name" style="font-weight: 600; font-size: 0.9rem; line-height: 1.2; padding-right: 20px;">${c.nombre}</div>
        <div class="cart-item-price" style="color: #00E5FF; font-weight: 700; font-size: 0.9rem;">$${(c.precio * (c.qty || 1)).toFixed(2)}</div>
      </div>
      
      <div class="cart-item-actions" style="display: flex; flex-direction: column; align-items: flex-end; gap: 10px;">
        <span class="cart-item-remove" onclick="removeFromCart(${c.id})" style="cursor: pointer; color: #ff1744; font-size: 1.1rem; position: absolute; top: 15px; right: 0;">✕</span>
        
        <div class="cart-item-qty" style="display: flex; align-items: center; background: #f8f9fa; border-radius: 20px; padding: 2px 8px; border: 1px solid #e8eaf0; margin-top: 15px;">
          <button class="qty-btn" onclick="changeQty(${c.id}, -1)" style="background: none; border: none; cursor: pointer; color: #6e6e7e; font-size: 1.2rem; padding: 0 5px;">−</button>
          <span style="font-weight: 600; font-size: 0.9rem; min-width: 20px; text-align: center;">${c.qty || 1}</span>
          <button class="qty-btn" onclick="changeQty(${c.id}, 1)" style="background: none; border: none; cursor: pointer; color: #6e6e7e; font-size: 1.2rem; padding: 0 5px;">+</button>
        </div>
      </div>
      
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
  
  const totales = calcularTotales();
  const items = document.getElementById('checkout-items');
  
  // Dentro de la función gotoStep1(), busca la variable items.innerHTML y cámbiala por esto:
  items.innerHTML = cart.map(c => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #f0f0f4; font-size:0.9rem;">
      <span style="display:flex; align-items:center; gap:12px;">
        <img src="${c.img}" alt="${c.nombre}" style="width: 35px; height: 35px; object-fit: contain; border-radius: 4px; background: #fff;"> 
        ${c.nombre} x${c.qty || 1}
      </span>
      <span style="font-weight:600;">$${(c.precio * (c.qty || 1)).toFixed(2)}</span>
    </div>
  `).join('');
  
  // Agregar fila de descuento si aplica
  if (totales.isVIP) {
    items.innerHTML += `
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f4;font-size:0.9rem;color:#00c853;background:rgba(0,200,83,0.05);">
      <span>👑 Descuento VIP Tech (15%)</span>
      <span style="font-weight:600;">-$${totales.discount.toFixed(2)}</span>
    </div>`;
  }
  
  document.getElementById('co-subtotal').textContent = '$' + totales.subtotal.toFixed(2);
  document.getElementById('co-envio').textContent = totales.envio === 0 ? 'Gratis' : '$' + totales.envio.toFixed(2);
  document.getElementById('co-total').textContent = '$' + totales.total.toFixed(2);
}

function gotoStep2() {
  document.getElementById('checkout-step-1').style.display = 'none';
  document.getElementById('checkout-step-2').style.display = 'block';
  document.getElementById('checkout-step-3').style.display = 'none';
  document.querySelectorAll('.step').forEach((s, i) => s.classList.toggle('active', i === 1));
  
  const totales = calcularTotales();
  document.getElementById('pay-amount').textContent = totales.total.toFixed(2);
}

async function processPayment() {
  const payment = document.querySelector('input[name="payment"]:checked').value;
  const btn = document.querySelector('#checkout-step-2 button.btn-primary');
  btn.disabled = true;
  btn.textContent = 'Procesando...';
  
  const names = { stripe: 'Stripe', paypal: 'PayPal', mercado: 'Mercado Pago', oxxo: 'OXXO', spei: 'SPEI' };
  const totales = calcularTotales();
  
  // Variables dinámicas para el pedido
  let reference = '';
  let status = 'completado';
  let paymentDetailsStr = names[payment];

  // Simulación de códigos
  if (payment === 'oxxo') {
    reference = Math.floor(10000000000000 + Math.random() * 90000000000000).toString(); // 14 dígitos
    status = 'pendiente';
    paymentDetailsStr += `<br><small style="color:#ff9800; font-size: 0.9rem;">Referencia a dictar: <b style="letter-spacing:1px;">${reference}</b></small>`;
  } else if (payment === 'spei') {
    reference = '646180' + Math.floor(100000000000 + Math.random() * 900000000000).toString(); // 18 dígitos
    status = 'pendiente';
    paymentDetailsStr += `<br><small style="color:#ff9800; font-size: 0.9rem;">CLABE destino: <b style="letter-spacing:1px;">${reference}</b></small>`;
  } else {
    reference = 'TXN-' + Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Si el usuario está logueado
  const userString = localStorage.getItem('innovare_user');
  let clienteId = null;
  if(userString) {
      const userData = JSON.parse(userString);
      clienteId = userData.id || null;
  }
  
  // Guardar datos con el descuento reflejado en la BD
  const orderDataBD = {
    cliente_id: clienteId,
    total: totales.total,
    metodo_pago: payment,
    estado: status,
    referencia_pago: reference,
    detalles: { 
      items: cart.map(c => ({ id: c.id, nombre: c.nombre, precio: c.precio, qty: c.qty || 1 })),
      descuento_vip: totales.isVIP ? totales.discount : 0
    }
  };
  
  await new Promise(r => setTimeout(r, 1500));
  
  try {
    if (window.InnovareDB && InnovareDB.isConnected()) {
      await InnovareDB.saveOrder(orderDataBD);
    }
  } catch(e) {
    console.error('Error guardando pedido en BD:', e);
  }
  
  // Preparar Paso 3 Visual
  document.getElementById('checkout-step-1').style.display = 'none';
  document.getElementById('checkout-step-2').style.display = 'none';
  document.getElementById('checkout-step-3').style.display = 'block';
  document.querySelectorAll('.step').forEach((s, i) => s.classList.toggle('active', i === 2));
  
  const orderVisualId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
  document.getElementById('order-number').textContent = orderVisualId;
  document.getElementById('order-payment').innerHTML = paymentDetailsStr;
  document.getElementById('order-total').textContent = '$' + totales.total.toFixed(2);
  document.getElementById('order-date').textContent = new Date().toLocaleDateString('es-MX', { year:'numeric', month:'long', day:'numeric' });
  
  // Limpiar carrito
  cart = [];
  saveCart();
  updateCartUI();
  
  btn.disabled = false;
  btn.textContent = `Pagar $${totales.total.toFixed(2)}`;
}
