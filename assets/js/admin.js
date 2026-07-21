// ===== ADMIN.JS - Innovare Barber Tech =====
// Lógica para leer citas, calcular comisiones y propinas

document.addEventListener('DOMContentLoaded', () => {
  initAdminPage();
});

let adminState = {
  appointments: [],
  payments: [],
  barbers: [],
  services: []
};

async function initAdminPage() {
  const data = await InnovareApp.loadSimulatedData();
  if (!data) {
    showAdminError('Error al cargar datos del panel.');
    return;
  }
  
  adminState.barbers = data.barbers || [];
  adminState.services = data.services || [];
  
  // Load from localStorage
  adminState.appointments = JSON.parse(localStorage.getItem('innovare_appointments') || '[]');
  adminState.payments = JSON.parse(localStorage.getItem('innovare_payments') || '[]');
  
  // If no appointments in localStorage, use simulated ones
  if (adminState.appointments.length === 0) {
    adminState.appointments = data.appointments || [];
  }
  
  updateStats();
  renderAppointmentsTable();
  renderCommissions();
  renderRecentActivity();
  setupAdminActions();
  renderTipManagement();
}

// ===== STATS =====
function updateStats() {
  const totalAppointments = adminState.appointments.length;
  const pendingAppointments = adminState.appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length;
  const completedAppointments = adminState.appointments.filter(a => a.status === 'completed').length;
  const totalRevenue = adminState.payments.reduce((sum, p) => sum + (p.total || 0), 0);
  const uniqueClients = new Set(adminState.appointments.map(a => a.clientName)).size;
  
  const elPending = document.getElementById('stat-pending');
  const elCompleted = document.getElementById('stat-completed');
  const elRevenue = document.getElementById('stat-revenue');
  const elClients = document.getElementById('stat-clients');
  
  if (elPending) {
    elPending.textContent = pendingAppointments;
    elPending.parentElement.querySelector('.stat-info p').textContent = 'Citas Pendientes';
  }
  
  if (elCompleted) {
    elCompleted.textContent = completedAppointments;
    elCompleted.parentElement.querySelector('.stat-info p').textContent = 'Completadas Hoy';
  }
  
  if (elRevenue) {
    elRevenue.textContent = InnovareApp.formatCurrency(totalRevenue);
    elRevenue.parentElement.querySelector('.stat-info p').textContent = 'Ingresos Totales';
  }
  
  if (elClients) {
    elClients.textContent = uniqueClients;
    elClients.parentElement.querySelector('.stat-info p').textContent = 'Clientes Únicos';
  }
}

// ===== APPOINTMENTS TABLE =====
function renderAppointmentsTable() {
  const tableBody = document.getElementById('appointments-body');
  if (!tableBody) return;
  
  if (adminState.appointments.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem; color: var(--gray);">
          No hay citas registradas
        </td>
      </tr>
    `;
    return;
  }
  
  const clientEmojis = ['👤', '👨', '👩', '🧑', '👨‍💼', '👩‍💼'];
  
  let html = '';
  adminState.appointments.slice().reverse().forEach((apt, index) => {
    const statusClass = apt.status === 'completed' ? 'completed' : 
                        apt.status === 'cancelled' ? 'cancelled' : 
                        apt.status === 'confirmed' ? 'confirmed' : 'pending';
    const statusText = apt.status === 'completed' ? 'Completada' : 
                       apt.status === 'cancelled' ? 'Cancelada' : 
                       apt.status === 'confirmed' ? 'Confirmada' : 'Pendiente';
    const emoji = clientEmojis[index % clientEmojis.length];
    
    html += `
      <tr>
        <td>
          <div class="client-cell">
            <div class="avatar">${emoji}</div>
            <span>${apt.clientName || 'Cliente'}</span>
          </div>
        </td>
        <td>${InnovareApp.formatDate(apt.date)}</td>
        <td>${InnovareApp.formatTime(apt.time)}</td>
        <td>${apt.barber?.name || apt.barber || '—'}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>
          <div class="action-btns">
            <button class="action-btn" title="Completar" onclick="completeAppointment(${apt.id})">✓</button>
            <button class="action-btn danger" title="Cancelar" onclick="cancelAppointment(${apt.id})">✕</button>
          </div>
        </td>
      </tr>
    `;
  });
  
  tableBody.innerHTML = html;
}

// ===== COMMISSIONS =====
function renderCommissions() {
  const commissionsList = document.getElementById('commissions-list');
  if (!commissionsList) return;
  
  const barberEmojis = ['👨‍🦰', '👨‍🦱', '👨‍🦳', '👨‍🦲', '🧔'];
  const commissionRate = 0.4; // 40% commission
  
  let html = '';
  
  if (adminState.barbers.length === 0) {
    commissionsList.innerHTML = '<p style="color: var(--gray); text-align: center;">No hay barberos registrados</p>';
    return;
  }
  
  adminState.barbers.forEach((barber, index) => {
    // Calculate completed appointments and revenue for this barber
    const barberAppointments = adminState.appointments.filter(a => 
      (a.barber?.id === barber.id || a.barber === barber.name) && 
      a.status === 'completed'
    );
    const appointmentsCount = barberAppointments.length;
    const barberRevenue = barberAppointments.reduce((sum, apt) => sum + (apt.service?.price || 0), 0);
    const commission = barberRevenue * commissionRate;
    const maxCommission = appointmentsCount * 200; // Average $200 max per appointment
    const progressPercent = maxCommission > 0 ? Math.min((commission / maxCommission) * 100, 100) : 0;
    
    const emoji = barberEmojis[index % barberEmojis.length];
    
    html += `
      <div class="commission-item">
        <div class="barber-info">
          <div class="avatar">${emoji}</div>
          <div>
            <h4>${barber.name}</h4>
            <small>${appointmentsCount} cortes · ${barber.specialty || 'Barbero'}</small>
          </div>
        </div>
        <div class="amount">${InnovareApp.formatCurrency(commission)}</div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${progressPercent}%"></div>
      </div>
    `;
  });
  
  commissionsList.innerHTML = html;
}

// ===== RECENT ACTIVITY =====
function renderRecentActivity() {
  const activityList = document.getElementById('activity-list');
  if (!activityList) return;
  
  const activities = [];
  
  // Generate activities from appointments
  adminState.appointments.slice(-5).reverse().forEach(apt => {
    activities.push({
      icon: apt.status === 'completed' ? '✅' : apt.status === 'cancelled' ? '❌' : '📅',
      text: apt.status === 'completed' ? 
        `${apt.clientName || 'Cliente'} completó su cita con ${apt.barber?.name || apt.barber || 'barbero'}` :
        apt.status === 'cancelled' ?
        `${apt.clientName || 'Cliente'} canceló su cita` :
        `${apt.clientName || 'Cliente'} reservó con ${apt.barber?.name || apt.barber || 'barbero'}`,
      time: apt.date ? `${InnovareApp.formatDate(apt.date)}` : 'Hoy'
    });
  });
  
  // Generate activities from payments
  adminState.payments.slice(-3).reverse().forEach(p => {
    activities.push({
      icon: '💰',
      text: `Pago de ${InnovareApp.formatCurrency(p.total || 0)} procesado`,
      time: p.date ? new Date(p.date).toLocaleString('es-MX') : 'Hoy'
    });
  });
  
  // Limit to first 5
  const displayActivities = activities.slice(0, 5);
  
  if (displayActivities.length === 0) {
    activityList.innerHTML = '<p style="color: var(--gray); text-align: center; padding: 1rem;">Sin actividad reciente</p>';
    return;
  }
  
  let html = '';
  displayActivities.forEach(act => {
    html += `
      <div class="activity-item">
        <div class="activity-icon">${act.icon}</div>
        <div class="activity-info">
          <p>${act.text}</p>
          <small>${act.time}</small>
        </div>
      </div>
    `;
  });
  
  activityList.innerHTML = html;
}

// ===== ADMIN ACTIONS =====
function setupAdminActions() {
  // Quick action buttons
  document.querySelectorAll('.quick-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      switch (action) {
        case 'new-appointment':
          window.location.href = 'reservas.html';
          break;
        case 'view-payments':
          InnovareApp.showNotification('Mostrando historial de pagos...');
          break;
        case 'add-barber':
          InnovareApp.showNotification('Funcionalidad: Agregar barbero (próximamente)', 'warning');
          break;
        case 'export':
          exportReport();
          break;
      }
    });
  });
}

function exportReport() {
  const report = {
    date: new Date().toISOString(),
    totalAppointments: adminState.appointments.length,
    totalRevenue: adminState.payments.reduce((sum, p) => sum + (p.total || 0), 0),
    barbers: adminState.barbers.map(b => ({
      name: b.name,
      appointments: adminState.appointments.filter(a => a.barber?.id === b.id).length
    }))
  };
  
  console.log('📊 Reporte exportado:', report);
  InnovareApp.showNotification('📊 Reporte descargado (console)');
}

// ===== TIP MANAGEMENT =====
function renderTipManagement() {
  const tipDetails = document.getElementById('tip-details');
  if (!tipDetails) return;
  
  const totalTips = adminState.payments.reduce((sum, p) => sum + (p.tip || 0), 0);
  
  tipDetails.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-md);">
      <span style="color: rgba(255,255,255,0.6);">Total en Propinas</span>
      <span style="font-weight: 700; font-size: 1.3rem; color: var(--secondary);">${InnovareApp.formatCurrency(totalTips)}</span>
    </div>
    <div class="tip-input-group">
      <input type="number" class="form-input" id="add-tip-input" placeholder="Monto de propina" min="0" step="10">
      <button class="btn btn-primary" id="add-tip-btn">Agregar</button>
    </div>
  `;
  
  const addTipBtn = document.getElementById('add-tip-btn');
  const addTipInput = document.getElementById('add-tip-input');
  
  if (addTipBtn && addTipInput) {
    addTipBtn.addEventListener('click', () => {
      const amount = parseFloat(addTipInput.value);
      if (isNaN(amount) || amount <= 0) {
        InnovareApp.showNotification('Ingresa un monto válido', 'warning');
        return;
      }
      
      // Add tip to a mock payment
      const mockPayment = {
        id: Date.now(),
        tip: amount,
        total: amount,
        date: new Date().toISOString(),
        status: 'completed'
      };
      
      savePayment(mockPayment);
      adminState.payments.push(mockPayment);
      updateStats();
      renderCommissions();
      renderRecentActivity();
      renderTipManagement();
      
      InnovareApp.showNotification(`✅ Propina de ${InnovareApp.formatCurrency(amount)} agregada`);
      addTipInput.value = '';
    });
  }
}

// ===== APPOINTMENT ACTIONS =====
function completeAppointment(id) {
  const apt = adminState.appointments.find(a => a.id === id);
  if (!apt) return;
  
  apt.status = 'completed';
  localStorage.setItem('innovare_appointments', JSON.stringify(adminState.appointments));
  
  renderAppointmentsTable();
  updateStats();
  renderCommissions();
  renderRecentActivity();
  InnovareApp.showNotification('✅ Cita marcada como completada');
}

function cancelAppointment(id) {
  if (!confirm('¿Cancelar esta cita?')) return;
  
  const apt = adminState.appointments.find(a => a.id === id);
  if (!apt) return;
  
  apt.status = 'cancelled';
  localStorage.setItem('innovare_appointments', JSON.stringify(adminState.appointments));
  
  renderAppointmentsTable();
  updateStats();
  renderRecentActivity();
  InnovareApp.showNotification('Cita cancelada', 'warning');
}

function savePayment(payment) {
  let payments = JSON.parse(localStorage.getItem('innovare_payments') || '[]');
  payments.push(payment);
  localStorage.setItem('innovare_payments', JSON.stringify(payments));
}

// ===== ERROR DISPLAY =====
function showAdminError(message) {
  const container = document.querySelector('.dashboard-grid');
  if (container) {
    container.innerHTML = `
      <div class="card" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
        <h3>Error del Sistema</h3>
        <p>${message}</p>
        <button class="btn btn-primary mt-1" onclick="location.reload()">Reintentar</button>
      </div>
    `;
  }
}

// Expose functions globally
window.completeAppointment = completeAppointment;
window.cancelAppointment = cancelAppointment;