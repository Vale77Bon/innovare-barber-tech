// ===== SUPABASE CLIENT - Innovare Barber Tech =====
// Configuración para conectar con Supabase + Vercel
// Reemplaza con tus credenciales reales después de crear el proyecto en supabase.com

const SUPABASE_CONFIG = {
  // Crea un proyecto en https://supabase.com y pega aquí:
  url: 'https://YOUR-PROJECT-ID.supabase.co',
  anonKey: 'YOUR-ANON-KEY',
};

// Cliente de Supabase (se carga desde CDN en index.html)
let supabase = null;

function getSupabase() {
  if (supabase) return supabase;
  if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    return supabase;
  }
  console.warn('⚡ Supabase CDN no cargado - usando modo offline (LocalStorage)');
  return null;
}

// ===== API OFFLINE/ONLINE ABSTRACTA =====
// Funciona con Supabase si está configurado, o con LocalStorage si no
const InnovareAPI = {
  // ---- USUARIOS ----
  async login(email, password) {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { user: data.user, token: data.session.access_token };
    }
    // Offline mock
    const MOCK_USERS = [
      { id: 'admin-001', nombre: 'Admin Barber', email: 'admin@innovarebarber.tech', rol: 'admin' },
      { id: 'client-001', nombre: 'Cliente Demo', email: 'cliente@demo.com', rol: 'cliente' }
    ];
    const u = MOCK_USERS.find(m => m.email === email);
    if (!u || password !== 'innovare2026') throw new Error('Credenciales inválidas');
    return { user: u, token: btoa(JSON.stringify({ id: u.id, email: u.email, rol: u.rol })) };
  },

  // ---- CITAS ----
  async getCitas(userId, role) {
    const sb = getSupabase();
    if (sb) {
      let query = sb.from('citas').select('*, barberos(nombre,especialidad), servicios(nombre,precio)').order('fecha', { ascending: false });
      if (role !== 'admin') query = query.eq('cliente_id', userId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
    // Offline LocalStorage
    return JSON.parse(localStorage.getItem('innovare_appointments') || '[]');
  },

  async createCita(cita) {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from('citas').insert([cita]).select();
      if (error) throw error;
      return data[0];
    }
    // Offline LocalStorage
    const citas = JSON.parse(localStorage.getItem('innovare_appointments') || '[]');
    cita.id = Date.now();
    citas.push(cita);
    localStorage.setItem('innovare_appointments', JSON.stringify(citas));
    return cita;
  },

  async updateCita(id, updates) {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from('citas').update(updates).eq('id', id).select();
      if (error) throw error;
      return data[0];
    }
    // Offline
    const citas = JSON.parse(localStorage.getItem('innovare_appointments') || '[]');
    const idx = citas.findIndex(c => c.id === id);
    if (idx >= 0) {
      citas[idx] = { ...citas[idx], ...updates };
      localStorage.setItem('innovare_appointments', JSON.stringify(citas));
    }
    return citas[idx];
  },

  async cancelCita(id) {
    return this.updateCita(id, { estado: 'cancelada' });
  },

  // ---- USUARIOS ----
  async getUser(userId) {
    const sb = getSupabase();
    if (sb) {
      const { data } = await sb.from('usuarios').select('*').eq('id', userId).single();
      return data;
    }
    return JSON.parse(localStorage.getItem('innovare_user') || '{}');
  }
};

window.InnovareAPI = InnovareAPI;