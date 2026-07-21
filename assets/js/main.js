// ===== MAIN.JS - Innovare Barber Tech - Rol-based =====
document.addEventListener('DOMContentLoaded', () => initializeApp());

const API = window.location.origin;

function initializeApp() {
  loadRoleBasedNav();
  loadFooter();
  setupMobileMenu();
}

function isAuthenticated() {
  return !!localStorage.getItem('innovare_token');
}

function getUser() {
  try { return JSON.parse(localStorage.getItem('innovare_user')); }
  catch { return null; }
}

function logout() {
  localStorage.removeItem('innovare_token');
  localStorage.removeItem('innovare_user');
  window.location.href = 'login.html';
}

function setupMobileMenu() {
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (!hamburger || !navLinks) return;
  
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
  });
  
  document.querySelectorAll('.nav-links a, .nav-links .logout-btn').forEach(el => {
    el.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinks.classList.remove('active');
    });
  });
}

function loadRoleBasedNav() {
  const placeholder = document.getElementById('navbar-placeholder');
  if (!placeholder) return;

  const user = getUser();
  const token = localStorage.getItem('innovare_token');
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  let links = '';
  
  if (token && user) {
    if (user.rol === 'admin') {
      // Admin nav: Dashboard, Inicio, Reservar, Smart Mirror
      const adminLinks = [
        { href: 'dashboard-admin.html', label: 'Dashboard' },
        { href: 'index.html', label: 'Inicio' },
        { href: 'reservas.html', label: 'Reservar' },
        { href: 'escaneo-ar.html', label: 'Smart Mirror' }
      ];
      adminLinks.forEach(l => {
        links += `<a href="${l.href}" class="${l.href === currentPath ? 'active' : ''}">${l.label}</a>`;
      });
      links += `<span class="user-badge">👑 Admin</span>`;
      links += `<button class="logout-btn" onclick="logout()">Salir</button>`;
    } else {
      // Client nav: Inicio, Reservar, Smart Mirror
      const clientLinks = [
        { href: 'index.html', label: 'Inicio' },
        { href: 'reservas.html', label: 'Reservar' },
        { href: 'escaneo-ar.html', label: 'Smart Mirror' },
        { href: 'mis-citas.html', label: 'Mis Citas' }
      ];
      clientLinks.forEach(l => {
        links += `<a href="${l.href}" class="${l.href === currentPath ? 'active' : ''}">${l.label}</a>`;
      });
      links += `<span class="user-badge">👤 ${user.nombre.split(' ')[0]}</span>`;
      links += `<button class="logout-btn" onclick="logout()">Salir</button>`;
    }
  } else {
    // No auth: login + public pages
    const publicLinks = [
      { href: 'index.html', label: 'Inicio' },
      { href: 'reservas.html', label: 'Reservar' },
      { href: 'escaneo-ar.html', label: 'Smart Mirror' }
    ];
    publicLinks.forEach(l => {
      links += `<a href="${l.href}" class="${l.href === currentPath ? 'active' : ''}">${l.label}</a>`;
    });
    links += `<a href="login.html" class="${currentPath === 'login.html' ? 'active' : ''}">Ingresar</a>`;
  }

  placeholder.innerHTML = `
    <nav class="navbar">
      <a href="index.html" class="logo">
        <span class="logo-icon">💈</span>
        Innovare <span class="highlight">Barber</span> Tech
      </a>
      <div class="nav-links">${links}</div>
      <button class="hamburger" aria-label="Menú">
        <span></span><span></span><span></span>
      </button>
    </nav>
  `;
  setupMobileMenu();
}

function loadFooter() {
  const fp = document.getElementById('footer-placeholder');
  if (!fp) return;
  fp.innerHTML = `
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-col">
          <h4>💈 Innovare Barber Tech</h4>
          <p>Tradición clásica · Innovación digital. Diagnóstico capilar 3D, simulación AR y membresías digitales.</p>
          <div class="social-links">
            <a href="https://www.instagram.com/innovarebarbertech" target="_blank" rel="noopener" aria-label="Instagram">📸</a>
            <a href="https://www.facebook.com/InnovareBarberTechPuebla" target="_blank" rel="noopener" aria-label="Facebook">📘</a>
            <a href="https://wa.me/522221175554" target="_blank" rel="noopener" aria-label="WhatsApp">💬</a>
          </div>
        </div>
        <div class="footer-col">
          <h4>Enlaces</h4>
          <a href="index.html">Inicio</a>
          <a href="reservas.html">Reservar Cita</a>
          <a href="escaneo-ar.html">Smart Mirror</a>
          <a href="aviso-privacidad.html">Aviso de Privacidad</a>
        </div>
        <div class="footer-col">
          <h4>Horario</h4>
          <p>Lun - Vie: 9:00 AM - 8:00 PM</p>
          <p>Sáb: 9:00 AM - 6:00 PM</p>
          <p>Dom: Cerrado</p>
        </div>
        <div class="footer-col">
          <h4>Contacto</h4>
          <p>📍 Plaza Solesta, PB-14 · Puebla</p>
          <p>📞 +52 222 117 5554</p>
          <p>✉️ hola@innovarebarber.tech</p>
        </div>
      </div>
      <div class="footer-bottom">
        &copy; ${new Date().getFullYear()} Innovare Barber Tech · NE1 ITP
      </div>
    </footer>`;
}

// ===== API Helpers =====
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('innovare_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  
  const res = await fetch(API + endpoint, { ...options, headers });
  if (res.status === 401) { logout(); return null; }
  return res.json();
}

function showNotification(msg, type = 'success') {
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();
  
  const n = document.createElement('div');
  n.className = `notification notification-${type}`;
  n.textContent = msg;
  
  const s = document.createElement('style');
  s.textContent = `
    .notification { position: fixed; top: 80px; right: 20px; padding: 16px 24px; border-radius: 8px; font-family: 'Inter', sans-serif; font-size: 0.9rem; font-weight: 500; z-index: 9999; animation: slideIn 0.3s ease; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
    .notification-success { background: #00c853; color: white; }
    .notification-error { background: #ff1744; color: white; }
    .notification-warning { background: #ffd600; color: #1e1e2e; }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
  `;
  document.head.appendChild(s);
  document.body.appendChild(n);
  setTimeout(() => {
    n.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => n.remove(), 300);
  }, 3000);
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(t) {
  const [h, m] = t.split(':');
  const hour = parseInt(h), ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
}

function formatCurrency(n) {
  return '$' + parseFloat(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

window.InnovareApp = { apiFetch, showNotification, formatDate, formatTime, formatCurrency };
window.logout = logout;