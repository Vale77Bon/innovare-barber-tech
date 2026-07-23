// ===== MAIN.JS - Innovare Barber Tech - Rol-based =====
document.addEventListener('DOMContentLoaded', () => initializeApp());

const API = window.location.origin;

async function initializeApp() {
  // --- NUEVO: Sincronización Automática con Supabase ---
  if (window.sb) {
    // 1. Revisar si hay una sesión activa al cargar la página
    const { data: { session } } = await window.sb.auth.getSession();
    if (session) {
      await syncUserProfile(session);
    }

    // 2. Escuchar cuando el usuario regresa de confirmar el correo (Magia en tiempo real)
    window.sb.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) {
          await syncUserProfile(session);
          loadRoleBasedNav(); // Repintamos la barra para que quite "Usuario" y ponga el nombre real
        }
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('innovare_token');
        localStorage.removeItem('innovare_user');
        loadRoleBasedNav();
      }
    });
  }

  loadRoleBasedNav();
  loadFooter();
}

// Función auxiliar para traer los datos frescos de la BD
async function syncUserProfile(session) {
  localStorage.setItem('innovare_token', session.access_token);
  try {
    // Buscar el perfil completo en la tabla usuarios
    const { data: dbUser } = await window.sb
      .from('usuarios')
      .select('*')
      .eq('id', session.user.id)
      .single();
      
    if (dbUser) {
      // Combinamos la info de auth con la info de tu tabla (nombre, rol, etc.)
      const fullUser = { ...session.user, ...dbUser };
      localStorage.setItem('innovare_user', JSON.stringify(fullUser));
    } else {
      localStorage.setItem('innovare_user', JSON.stringify(session.user));
    }
  } catch (error) {
    console.error("Error sincronizando perfil:", error);
  }
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
    // Determinar rol del usuario
    var userRole = user.rol || (user.user_metadata && user.user_metadata.rol) || 'cliente';
    
    if (userRole === 'admin') {
      const adminLinks = [
        { href: 'dashboard-admin.html', label: 'Dashboard' },
        { href: 'index.html', label: 'Inicio' },
        { href: 'tienda.html', label: 'Tienda' },
        { href: 'reservas.html', label: 'Reservar' },
        { href: 'escaneo-ar.html', label: 'Smart Mirror' }
      ];
      adminLinks.forEach(l => {
        links += `<a href="${l.href}" class="${l.href === currentPath ? 'active' : ''}">${l.label}</a>`;
      });
      links += `<span class="user-badge">👑 Admin</span>`;
      links += `<button class="logout-btn" onclick="logout()">Salir</button>`;
    } else {
      const clientLinks = [
        { href: 'index.html', label: 'Inicio' },
        { href: 'tienda.html', label: 'Tienda' },
        { href: 'reservas.html', label: 'Reservar' },
        { href: 'escaneo-ar.html', label: 'Smart Mirror' },
        { href: 'mis-citas.html', label: 'Mis Citas' },
        { href: 'mis-pedidos.html', label: 'Mis Pedidos' }
      ];
      clientLinks.forEach(l => {
        links += `<a href="${l.href}" class="${l.href === currentPath ? 'active' : ''}">${l.label}</a>`;
      });
      var mem = JSON.parse(localStorage.getItem('innovare_membership') || 'null');
      var userName = user.nombre ? user.nombre.split(' ')[0] : 'Usuario';
      links += `<span class="user-badge">👤 ${userName}</span>`;
      if (mem && mem.status === 'active') {
        links += `<span class="user-badge" style="background:rgba(0,200,83,0.15);border-color:rgba(0,200,83,0.3);color:#00c853;">👑 ${mem.name}</span>`;
      }
      links += `<button class="logout-btn" onclick="logout()">Salir</button>`;
    }
  } else {
    const publicLinks = [
      { href: 'index.html', label: 'Inicio' },
      { href: 'tienda.html', label: 'Tienda' },
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
    <footer style="background-color: #11111e; padding: 4rem 2rem 2rem; color: #fff; margin-top: auto; border-top: 1px solid rgba(0,229,255,0.1);">
      <div style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem;">
        
        <div>
          <h3 style="color: #00E5FF; margin-bottom: 1rem; display: flex; align-items: center; gap: 8px;">
            💈 Innovare Barber Tech
          </h3>
          <p style="color: #9e9eae; font-size: 0.9rem; line-height: 1.6;">
            Tradición clásica · Innovación digital.<br>Diagnóstico capilar 3D, simulación AR y membresías digitales.
          </p>
          
          <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
            <a href="https://www.facebook.com/share/19bxBqUFrL/" target="_blank" style="width: 38px; height: 38px; border-radius: 50%; background: rgba(0,229,255,0.1); color: #00E5FF; display: flex; align-items: center; justify-content: center; text-decoration: none; font-size: 1.2rem; transition: all 0.3s;" onmouseover="this.style.background='#00E5FF'; this.style.color='#11111e'" onmouseout="this.style.background='rgba(0,229,255,0.1)'; this.style.color='#00E5FF'" title="Facebook">📘</a>
            <a href="https://www.instagram.com/innovarebarbertech?igsh=eTdwcDVpeDVjbDlr" target="_blank" style="width: 38px; height: 38px; border-radius: 50%; background: rgba(0,229,255,0.1); color: #00E5FF; display: flex; align-items: center; justify-content: center; text-decoration: none; font-size: 1.2rem; transition: all 0.3s;" onmouseover="this.style.background='#00E5FF'; this.style.color='#11111e'" onmouseout="this.style.background='rgba(0,229,255,0.1)'; this.style.color='#00E5FF'" title="Instagram">📸</a>
            <a href="https://www.tiktok.com/@innovarebarbertec?_r=1&_t=ZS-98EMg5WlDhE" target="_blank" style="width: 38px; height: 38px; border-radius: 50%; background: rgba(0,229,255,0.1); color: #00E5FF; display: flex; align-items: center; justify-content: center; text-decoration: none; font-size: 1.2rem; transition: all 0.3s;" onmouseover="this.style.background='#00E5FF'; this.style.color='#11111e'" onmouseout="this.style.background='rgba(0,229,255,0.1)'; this.style.color='#00E5FF'" title="TikTok">🎵</a>
            <a href="https://wa.me/522221175554?text=Hola,%20Innovare%20Barber%20Tech,%20tengo%20una%20duda%20¿en%20qué%20pueden%20ayudarme%20hoy?" target="_blank" style="width: 38px; height: 38px; border-radius: 50%; background: rgba(0,229,255,0.1); color: #00E5FF; display: flex; align-items: center; justify-content: center; text-decoration: none; font-size: 1.2rem; transition: all 0.3s;" onmouseover="this.style.background='#00E5FF'; this.style.color='#11111e'" onmouseout="this.style.background='rgba(0,229,255,0.1)'; this.style.color='#00E5FF'" title="WhatsApp">💬</a>
            <a href="mailto:innovarebarber.tech@outlook.com" style="width: 38px; height: 38px; border-radius: 50%; background: rgba(0,229,255,0.1); color: #00E5FF; display: flex; align-items: center; justify-content: center; text-decoration: none; font-size: 1.2rem; transition: all 0.3s;" onmouseover="this.style.background='#00E5FF'; this.style.color='#11111e'" onmouseout="this.style.background='rgba(0,229,255,0.1)'; this.style.color='#00E5FF'" title="Correo Electrónico">✉️</a>
          </div>
        </div>
        
        <div>
          <h4 style="color: #00E5FF; margin-bottom: 1rem;">Enlaces Rápidos</h4>
          <div style="display: flex; flex-direction: column; gap: 0.8rem;">
            <a href="index.html" style="color: #9e9eae; text-decoration: none; font-size: 0.9rem; transition: color 0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#9e9eae'">Inicio</a>
            <a href="reservas.html" style="color: #9e9eae; text-decoration: none; font-size: 0.9rem; transition: color 0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#9e9eae'">Reservar Cita</a>
            <a href="tienda.html" style="color: #9e9eae; text-decoration: none; font-size: 0.9rem; transition: color 0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#9e9eae'">Tienda</a>
            <a href="escaneo-ar.html" style="color: #9e9eae; text-decoration: none; font-size: 0.9rem; transition: color 0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#9e9eae'">Smart Mirror</a>
            <a href="aviso-privacidad.html" style="color: #9e9eae; text-decoration: none; font-size: 0.9rem; transition: color 0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#9e9eae'">Aviso de Privacidad</a>
          </div>
        </div>

        <div>
          <h4 style="color: #00E5FF; margin-bottom: 1rem;">Horario y Ubicación</h4>
          <p style="color: #9e9eae; font-size: 0.9rem; margin-bottom: 0.5rem;">Lun - Vie: 9:00 AM - 8:00 PM</p>
          <p style="color: #9e9eae; font-size: 0.9rem; margin-bottom: 0.5rem;">Sáb: 9:00 AM - 6:00 PM</p>
          <p style="color: #9e9eae; font-size: 0.9rem; margin-bottom: 1.5rem;">Dom: Cerrado</p>
          <p style="color: #9e9eae; font-size: 0.9rem;">📍 Local PB-14, Plaza Solesta, Puebla</p>
        </div>
      </div>
      
      <div style="text-align: center; color: #6e6e7e; font-size: 0.8rem; margin-top: 3rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1.5rem;">
        &copy; ${new Date().getFullYear()} Innovare Barber Tech. Todos los derechos reservados.
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