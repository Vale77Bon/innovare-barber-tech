// ===== SUPABASE INTEGRATION - INNOVARE BARBER TECH =====
// Solo Supabase, sin LocalStorage fallback

var SUPABASE_URL = 'https://mbftnsvjnmnsxjsmkoab.supabase.co';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ
pc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iZnRuc3Zqbm1uc3hqc21rb2FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NDEzODcsImV4cCI6MjEwMDIxNzM4N30.RR1-a6RAO1XlkR4IuPfaCNdWXf2hmGFSQFKT2cGVryE';

var sb = null;

// Inicializar Supabase
(function initSupabase() {
  if (typeof supabase !== 'undefined' && supabase.createClient) {
    try {
      sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      console.log('✅ Supabase conectado:', SUPABASE_URL);
    } catch(e) {
      console.error('❌ Error al conectar Supabase:', e.message);
      sb = null;
    }
  } else {
    console.error('❌ Supabase JS no cargado. Agrega: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
  }
})();

// ===== API SUPABASE (sin LocalStorage) =====
var InnovareDB = {
  isConnected: function() { return sb !== null; },

  // ===== USUARIOS =====
  login: async function(email, password) {
    if (!sb) throw new Error('Supabase no conectado');
    var r = await sb.auth.signInWithPassword({ email: email, password: password });
    if (r.error) throw r.error;
    return { user: r.data.user, token: r.data.session.access_token };
  },

  register: async function(email, password, nombre, rol) {
    if (!sb) throw new Error('Supabase no conectado');
    var r = await sb.auth.signUp({ email: email, password: password, options: { data: { nombre: nombre, rol: rol } } });
    if (r.error) throw r.error;
    return r.data;
  },

  getUser: async function() {
    if (!sb) throw new Error('Supabase no conectado');
    var r = await sb.auth.getUser();
    if (r.error) throw r.error;
    return r.data.user;
  },

  // ===== BARBEROS =====
  getBarbers: async function() {
    if (!sb) throw new Error('Supabase no conectado');
    var r = await sb.from('barberos').select('*').eq('activo', true);
    if (r.error) throw r.error;
    return r.data;
  },

  // ===== SERVICIOS =====
  getServices: async function() {
    if (!sb) throw new Error('Supabase no conectado');
    var r = await sb.from('servicios').select('*').eq('activo', true);
    if (r.error) throw r.error;
    return r.data;
  },

  // ===== CITAS =====
  getCitas: async function(userId, role) {
    if (!sb) throw new Error('Supabase no conectado');
    var q = sb.from('citas')
      .select('*, barberos!inner(nombre, especialidad), servicios!inner(nombre, precio)')
      .order('fecha', { ascending: false });
    if (role !== 'admin') q = q.eq('cliente_id', userId);
    var r = await q;
    if (r.error) throw r.error;
    return r.data;
  },

  createCita: async function(cita) {
    if (!sb) throw new Error('Supabase no conectado');
    var r = await sb.from('citas').insert([cita]).select();
    if (r.error) throw r.error;
    return r.data[0];
  },

  updateCita: async function(id, updates) {
    if (!sb) throw new Error('Supabase no conectado');
    var r = await sb.from('citas').update(updates).eq('id', id);
    if (r.error) throw r.error;
    return true;
  },

  // ===== MEMBRESÍAS =====
  getMemberships: async function() {
    if (!sb) throw new Error('Supabase no conectado');
    var r = await sb.from('membresias').select('*, membresias_caracteristicas(*)').eq('activo', true);
    if (r.error) throw r.error;
    return r.data;
  },

  // ===== DIAGNÓSTICOS =====
  saveDiagnostico: async function(d) {
    if (!sb) throw new Error('Supabase no conectado');
    var r = await sb.from('diagnosticos_3d').insert([d]);
    if (r.error) throw r.error;
    return true;
  },

  getDiagnosticos: async function(userId) {
    if (!sb) throw new Error('Supabase no conectado');
    var r = await sb.from('diagnosticos_3d').select('*').eq('cliente_id', userId).order('fecha', { ascending: false });
    if (r.error) throw r.error;
    return r.data;
  },

  // ===== TEST CONNECTION =====
  testConnection: async function() {
    var results = { supabase: false, barberos: false, servicios: false, citas: false };
    try {
      if (!sb) { results.error = 'sb es null - Supabase no inicializado'; return results; }
      var t1 = await sb.from('barberos').select('count', { count: 'exact', head: true });
      results.barberos = t1.count !== null;
      results.barberosCount = t1.count;
      var t2 = await sb.from('servicios').select('count', { count: 'exact', head: true });
      results.servicios = t2.count !== null;
      results.serviciosCount = t2.count;
      var t3 = await sb.from('citas').select('count', { count: 'exact', head: true });
      results.citas = t3.count !== null;
      results.citasCount = t3.count;
      results.supabase = true;
    } catch(e) {
      results.error = e.message;
    }
    return results;
  }
};

window.InnovareDB = InnovareDB;