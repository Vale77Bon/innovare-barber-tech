// ===== API CLIENT - INNOVARE BARBER TECH =====
// Cliente para comunicarse con el backend Express + PostgreSQL

const API_BASE = window.location.origin; // Usa el mismo origen (funciona en Vercel y local)

const InnovareAPI = {
  // ===== AUTH =====
  login: async function(email, password) {
    const r = await fetch(API_BASE + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!r.ok) {
      const err = await r.json();
      throw new Error(err.error || 'Error al iniciar sesión');
    }
    return await r.json();
  },

  register: async function(nombre, email, telefono, password) {
    const r = await fetch(API_BASE + '/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, telefono, password })
    });
    if (!r.ok) {
      const err = await r.json();
      throw new Error(err.error || 'Error al registrar');
    }
    return await r.json();
  },

  getMe: async function(token) {
    const r = await fetch(API_BASE + '/api/auth/me', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!r.ok) throw new Error('No autorizado');
    return await r.json();
  },

  // ===== BARBEROS =====
  getBarbers: async function() {
    const r = await fetch(API_BASE + '/api/barberos');
    if (!r.ok) throw new Error('Error al obtener barberos');
    return await r.json();
  },

  // ===== SERVICIOS =====
  getServices: async function() {
    const r = await fetch(API_BASE + '/api/servicios');
    if (!r.ok) throw new Error('Error al obtener servicios');
    return await r.json();
  },

  // ===== CITAS =====
  getCitas: async function(token) {
    const r = await fetch(API_BASE + '/api/citas', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!r.ok) throw new Error('Error al obtener citas');
    return await r.json();
  },

  createCita: async function(token, cita) {
    const r = await fetch(API_BASE + '/api/citas', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(cita)
    });
    if (!r.ok) {
      const err = await r.json();
      throw new Error(err.error || 'Error al crear cita');
    }
    return await r.json();
  },

  // ===== DIAGNÓSTICOS =====
  saveDiagnostico: async function(token, diagnostico) {
    const r = await fetch(API_BASE + '/api/diagnosticos', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(diagnostico)
    });
    if (!r.ok) throw new Error('Error al guardar diagnóstico');
    return await r.json();
  },

  getDiagnosticos: async function(token) {
    const r = await fetch(API_BASE + '/api/diagnosticos', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!r.ok) throw new Error('Error al obtener diagnósticos');
    return await r.json();
  },

  // ===== SMART MIRROR =====
  analyzeFace: async function(imageData) {
    const r = await fetch(API_BASE + '/api/smart-mirror/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageData })
    });
    if (!r.ok) throw new Error('Error al analizar imagen');
    return await r.json();
  },

  // ===== STATS (Admin) =====
  getStats: async function(token) {
    const r = await fetch(API_BASE + '/api/stats', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!r.ok) throw new Error('Error al obtener estadísticas');
    return await r.json();
  }
};

window.InnovareAPI = InnovareAPI;