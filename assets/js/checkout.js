// ===== CHECKOUT.JS - Innovare Barber Tech =====
// Cálculo matemático: Servicio + Retail - Depósito

document.addEventListener('DOMContentLoaded', () => {
  initCheckoutPage();
});

let checkoutState = {
  appointment: null,
  selectedProducts: [],
  deposit: 0,
  tip: 0
};

const RETAIL_PRODUCTS = [
  { id: 1, name: 'Pomada Clásica', price: 180, category: 'Pomadas', emoji: '🧴' },
  { id: 2, name: 'Aceite para Barba', price: 220, category: 'Aceites', emoji: '🫒' },
  { id: 3, name: 'Shampoo Especial', price: 160, category: 'Shampoos', emoji: '🧪' },
  { id: 4, name: 'Cera Modeladora', price: 200, category: 'Ceras', emoji: '🕯️' },
  { id: 5, name: 'Tónico Capilar', price: 190, category: 'Tónicos', emoji: '💧' },
  { id: 6, name: 'Peine Profesional', price: 120, category: 'Accesorios', emoji: '🪮' },
  { id: 7, name: 'Toalla Caliente', price: 50, category: 'Extras', emoji: '🧖' },
  { id: 8, name: 'Kit Completo', price: 450, category: 'Kits', emoji: '🎁' }
];

async function initCheckoutPage() {
  // Load appointment from localStorage
  const lastAppointment = localStorage.getItem('lastAppointment');
  if (lastAppointment) {
    checkoutState.appointment = JSON.parse(lastAppointment);
  }
  
  renderAppointmentInfo();
  renderRetailProducts();
  updateTotals();
  setupCheckoutForm();
}

// ===== APPOINTMENT INFO =====
function renderAppointmentInfo() {
  const infoContainer = document.getElementById('appointment-info');
  if (!infoContainer) return;
  
  if (!checkoutState.appointment) {
    infoContainer.innerHTML = `
      <div class="card" style="text-align: center; padding: 2rem;">
        <div style="font-size: 2rem; margin-bottom: 1rem;">📅</div>
        <h3>Sin cita reciente</h3>
        <p>No tienes una cita pendiente de pago.</p>
        <a href="reservas.html" class="btn btn-primary mt-1">Reservar ahora</a>
      </div>
    `;
    return;
  }
  
  const apt = checkoutState.appointment;
  infoContainer.innerHTML = `
    <div class="checkout-appointment">
      <div class="checkout-appointment-header">
        <span class="badge badge-gold">Cita Confirmada</span>
        <small>#${apt.id}</small>
      </div>
      <div class="checkout-details-grid">
        <div class="checkout-detail-item">
          <span class="detail-icon">📅</span>
          <div>
            <small>Fecha</small>
            <p>${InnovareApp.formatDate(apt.date)}</p>
          </div>
        </div>
        <div class="checkout-detail-item">
          <span class="detail-icon">⏰</span>
          <div>
            <small>Hora</small>
            <p>${InnovareApp.formatTime(apt.time)}</p>
          </div>
        </div>
        <div class="checkout-detail-item">
          <span class="detail-icon">💈</span>
          <div>
            <small>Barbero</small>
            <p>${apt.barber?.name || '—'}</p>
          </div>
        </div>
        <div class="checkout-detail-item">
          <span class="detail-icon">✂️</span>
          <div>
            <small>Servicio</small>
            <p>${apt.service?.name || '—'}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ===== RETAIL PRODUCTS =====
function renderRetailProducts() {
  const productsContainer = document.getElementById('retail-products');
  if (!productsContainer) return;
  
  let html = '';
  RETAIL_PRODUCTS.forEach(product => {
    const isSelected = checkoutState.selectedProducts.find(p => p.id === product.id);
    
    html += `
      <div class="retail-product ${isSelected ? 'selected' : ''}" data-product-id="${product.id}">
        <div class="product-emoji">${product.emoji}</div>
        <div class="product-info">
          <h4>${product.name}</h4>
          <small>${product.category}</small>
        </div>
        <div class="product-price">${InnovareApp.formatCurrency(product.price)}</div>
        <div class="product-qty">
          <button class="qty-btn minus" data-product-id="${product.id}">−</button>
          <span class="qty-value">${isSelected ? isSelected.qty : 0}</span>
          <button class="qty-btn plus" data-product-id="${product.id}">+</button>
        </div>
      </div>
    `;
  });
  
  productsContainer.innerHTML = html;
  
  // Add event listeners
  productsContainer.querySelectorAll('.plus').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const productId = parseInt(btn.dataset.productId);
      addProduct(productId);
    });
  });
  
  productsContainer.querySelectorAll('.minus').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const productId = parseInt(btn.dataset.productId);
      removeProduct(productId);
    });
  });
}

function addProduct(productId) {
  const existing = checkoutState.selectedProducts.find(p => p.id === productId);
  if (existing) {
    existing.qty++;
  } else {
    const product = RETAIL_PRODUCTS.find(p => p.id === productId);
    checkoutState.selectedProducts.push({ ...product, qty: 1 });
  }
  renderRetailProducts();
  updateTotals();
}

function removeProduct(productId) {
  const existing = checkoutState.selectedProducts.find(p => p.id === productId);
  if (existing) {
    existing.qty--;
    if (existing.qty <= 0) {
      checkoutState.selectedProducts = checkoutState.selectedProducts.filter(p => p.id !== productId);
    }
  }
  renderRetailProducts();
  updateTotals();
}

// ===== TOTALS CALCULATION =====
function updateTotals() {
  const servicePrice = checkoutState.appointment?.service?.price || 0;
  const retailTotal = checkoutState.selectedProducts.reduce((sum, p) => sum + (p.price * p.qty), 0);
  const subtotal = servicePrice + retailTotal;
  const deposit = Math.min(servicePrice * 0.3, 100); // 30% of service, max $100
  const tip = checkoutState.tip;
  const total = subtotal + tip - deposit;
  
  checkoutState.deposit = deposit;
  
  // Update UI
  const elServicePrice = document.getElementById('checkout-service-price');
  const elRetailTotal = document.getElementById('checkout-retail-total');
  const elSubtotal = document.getElementById('checkout-subtotal');
  const elDeposit = document.getElementById('checkout-deposit');
  const elTip = document.getElementById('checkout-tip');
  const elTotal = document.getElementById('checkout-total');
  const elPayBtn = document.getElementById('pay-btn');
  
  if (elServicePrice) elServicePrice.textContent = InnovareApp.formatCurrency(servicePrice);
  if (elRetailTotal) elRetailTotal.textContent = InnovareApp.formatCurrency(retailTotal);
  if (elSubtotal) elSubtotal.textContent = InnovareApp.formatCurrency(subtotal);
  if (elDeposit) elDeposit.textContent = `-${InnovareApp.formatCurrency(deposit)}`;
  if (elTip) elTip.textContent = InnovareApp.formatCurrency(tip);
  if (elTotal) elTotal.textContent = InnovareApp.formatCurrency(total);
  
  if (elPayBtn) {
    elPayBtn.textContent = `Pagar ${InnovareApp.formatCurrency(total)}`;
    elPayBtn.disabled = total <= 0;
  }
}

// ===== TIP =====
function setupTipButtons() {
  const tipButtons = document.querySelectorAll('.tip-btn');
  tipButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const amount = parseFloat(btn.dataset.tip);
      checkoutState.tip = checkoutState.tip === amount ? 0 : amount;
      tipButtons.forEach(b => b.classList.remove('selected'));
      if (checkoutState.tip > 0) btn.classList.add('selected');
      updateTotals();
    });
  });
  
  const customTip = document.getElementById('custom-tip');
  if (customTip) {
    customTip.addEventListener('input', () => {
      const val = parseFloat(customTip.value) || 0;
      checkoutState.tip = val;
      tipButtons.forEach(b => b.classList.remove('selected'));
      updateTotals();
    });
  }
}

// ===== CHECKOUT FORM =====
function setupCheckoutForm() {
  setupTipButtons();
  
  const payBtn = document.getElementById('pay-btn');
  if (!payBtn) return;
  
  payBtn.addEventListener('click', () => {
    // Simulate payment processing
    payBtn.disabled = true;
    payBtn.textContent = 'Procesando...';
    
    setTimeout(() => {
      // Save payment to localStorage
      const payment = {
        id: Date.now(),
        appointmentId: checkoutState.appointment?.id,
        servicePrice: checkoutState.appointment?.service?.price || 0,
        products: checkoutState.selectedProducts,
        tip: checkoutState.tip,
        deposit: checkoutState.deposit,
        total: parseFloat(document.getElementById('checkout-total')?.textContent.replace(/[$,]/g, '') || '0'),
        date: new Date().toISOString(),
        status: 'completed'
      };
      
      savePayment(payment);
      
      InnovareApp.showNotification('✅ ¡Pago procesado con éxito!');
      
      setTimeout(() => {
        localStorage.removeItem('lastAppointment');
        window.location.href = 'dashboard-admin.html';
      }, 1500);
    }, 2000);
  });
  
  // Payment method selection
  document.querySelectorAll('.payment-method').forEach(method => {
    method.addEventListener('click', () => {
      document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
      method.classList.add('selected');
    });
  });
}

function savePayment(payment) {
  let payments = JSON.parse(localStorage.getItem('innovare_payments') || '[]');
  payments.push(payment);
  localStorage.setItem('innovare_payments', JSON.stringify(payments));
}

// Expose functions
window.addProduct = addProduct;
window.removeProduct = removeProduct;