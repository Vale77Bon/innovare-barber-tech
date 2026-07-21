// ===== RESERVAS.JS - Standalone + Stripe Simulation =====
document.addEventListener('DOMContentLoaded', initReservasPage);

var EMBEDDED = {
  barbers: [
    { id: 1, name: "Alex Martínez", specialty: "Cortes Clásicos", rating: 4.9, experience: 8 },
    { id: 2, name: "Carlos Gómez", specialty: "Barbas y Perfilados VIP", rating: 4.8, experience: 6 },
    { id: 3, name: "Miguel Torres", specialty: "Degradados Modernos", rating: 4.9, experience: 5 },
    { id: 4, name: "David Rojas", specialty: "Estilos Premium", rating: 4.7, experience: 10 }
  ],
  services: [
    { id: 1, name: "Corte & Estilo Técnico Premium", price: 450, duration: 45 },
    { id: 2, name: "Corte Degradado Luxury Fade", price: 550, duration: 50 },
    { id: 3, name: "Perfilado de Barba VIP", price: 350, duration: 30 },
    { id: 4, name: "Corte + Barba (Combo Ejecutivo)", price: 680, duration: 60 },
    { id: 5, name: "Escáner Capilar 3D + IA", price: 400, duration: 15 },
    { id: 6, name: "Simulación AR (Espejo Inteligente)", price: 250, duration: 10 },
    { id: 7, name: "Afeitado Clásico con Navaja", price: 380, duration: 35 },
    { id: 8, name: "Lavado + Masaje + Ozono VIP", price: 280, duration: 20 }
  ],
  appointments: [
    { id: 1001, date: "2026-07-20", time: "10:00", barber_id:1, barber_name:"Alex Martínez", service_id:1, service_name:"Corte & Estilo Técnico", price:180, clientName:"Roberto Hernández", estado:"completada" },
    { id: 1002, date: "2026-07-20", time: "11:00", barber_id:2, barber_name:"Carlos Gómez", service_id:3, service_name:"Perfilado de Barba VIP", price:150, clientName:"Luis Fernández", estado:"completada" },
    { id: 1003, date: "2026-07-20", time: "12:00", barber_id:3, barber_name:"Miguel Torres", service_id:2, service_name:"Corte Degradado Premium", price:250, clientName:"Andrés López", estado:"confirmada" },
    { id: 1004, date: "2026-07-21", time: "15:00", barber_id:1, barber_name:"Alex Martínez", service_id:4, service_name:"Corte + Barba (Combo)", price:280, clientName:"Jorge Ramírez", estado:"confirmada" },
    { id: 1005, date: "2026-07-21", time: "16:30", barber_id:4, barber_name:"David Rojas", service_id:5, service_name:"Escáner Capilar 3D", price:200, clientName:"Fernando Castillo", estado:"pendiente" }
  ]
};

var state = {
  selDate:null, selTime:null, selBarber:null, selService:null,
  month:new Date().getMonth(), year:new Date().getFullYear()
};
var SLOTS = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30'];

function initReservasPage() {
  state.barbers = EMBEDDED.barbers;
  state.services = JSON.parse(JSON.stringify(EMBEDDED.services));
  var mem = JSON.parse(localStorage.getItem('innovare_membership') || 'null');
  state.membership = (mem && mem.status === 'active') ? mem : null;
  var saved = JSON.parse(localStorage.getItem('innovare_appointments')||'[]');
  state.appointments = saved.length ? saved : EMBEDDED.appointments;
  renderAll(); setupBookingBtn();
}

function renderAll() { renderCalendar(); renderBarbers(); renderServices(); updateSummary(); }
function $d(id){ return document.getElementById(id); }

// ===== CALENDAR =====
function renderCalendar() {
  var g=$d('calendar-grid'),t=$d('calendar-title'); if(!g||!t) return;
  var ms=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  t.textContent=ms[state.month]+' '+state.year;
  var fd=new Date(state.year,state.month,1).getDay(),dim=new Date(state.year,state.month+1,0).getDate(),now=new Date(),h='';
  ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].forEach(function(d){h+='<div class="day-name">'+d+'</div>';});
  for(var i=0;i<fd;i++)h+='<div class="day empty"></div>';
  for(var d=1;d<=dim;d++){
    var dt=new Date(state.year,state.month,d),today=dt.toDateString()===now.toDateString(),past=dt<new Date(now.getFullYear(),now.getMonth(),now.getDate()),sun=dt.getDay()===0,sel=state.selDate===dt.toISOString().split('T')[0],c='day'+(today?' today':'')+(past||sun?' disabled':'')+(sel?' selected':'');
    h+='<div class="'+c+'" data-d="'+dt.toISOString().split('T')[0]+'">'+d+'</div>';
  }
  g.innerHTML=h;
  g.querySelectorAll('.day:not(.disabled):not(.empty)').forEach(function(el){el.onclick=function(){state.selDate=el.dataset.d;renderCalendar();renderTimeSlots();updateSummary();};});
  renderTimeSlots();
}
function changeMonth(n){state.month+=n;if(state.month>11){state.month=0;state.year++;}else if(state.month<0){state.month=11;state.year--;}renderCalendar();}

// ===== TIME =====
function renderTimeSlots(){
  var g=$d('time-grid');if(!g)return;
  if(!state.selDate){g.innerHTML='<p style="color:#9e9eae;grid-column:1/-1;text-align:center;">Selecciona una fecha</p>';return;}
  var now=new Date(),sd=new Date(state.selDate+'T00:00:00'),h='';
  SLOTS.forEach(function(tm){
    var past=sd.toDateString()===now.toDateString()&&tm<=('0'+now.getHours()).slice(-2)+':'+('0'+now.getMinutes()).slice(-2);
    var bk=state.appointments.some(function(a){return a.date===state.selDate&&a.time===tm&&a.estado!=='cancelada';});
    var sel=state.selTime===tm,c='time-slot'+((past||bk)?' disabled':'')+(sel?' selected':'');
    h+='<div class="'+c+'" data-t="'+tm+'">'+fTime(tm)+'</div>';
  });
  g.innerHTML=h;
  g.querySelectorAll('.time-slot:not(.disabled)').forEach(function(el){el.onclick=function(){state.selTime=el.dataset.t;renderTimeSlots();updateSummary();};});
}

// ===== BARBERS =====
function renderBarbers(){
  var c=$d('barber-list');if(!c)return;var em=['👨‍🦰','👨‍🦱','👨‍🦳','👨‍🦲','🧔'],h='';
  state.barbers.forEach(function(b,i){var sel=state.selBarber&&state.selBarber.id===b.id;h+='<div class="barber-option'+(sel?' selected':'')+'" data-id="'+b.id+'"><div class="barber-avatar-sm">'+em[i%5]+'</div><div class="barber-info"><h4>'+b.name+'</h4><p>'+(b.specialty||'Barbero')+'</p></div><div class="barber-status">Disponible</div></div>';});
  c.innerHTML=h;
  c.querySelectorAll('.barber-option').forEach(function(el){el.onclick=function(){var id=parseInt(el.dataset.id);state.selBarber=state.barbers.find(function(b){return b.id===id;});renderBarbers();updateSummary();};});
}

// ===== SERVICES =====
function renderServices(){
  var c=$d('service-list');if(!c)return;var h='';
  state.services.forEach(function(s){
    var sel=state.selService&&state.selService.id===s.id;
    var disc = state.membership && state.membership.name==='VIP Tech' ? Math.round(s.price*0.85) : null;
    h+='<div class="service-option'+(sel?' selected':'')+'" data-id="'+s.id+'">';
    h+='<div class="service-name">'+s.name+'<small>'+s.duration+' min</small></div>';
    h+='<div class="service-price">'+fCur(s.price);
    if(disc)h+=' <span style="font-size:0.7rem;color:#00c853;">(-15%)</span>';
    h+='</div></div>';
  });
  c.innerHTML=h;
  c.querySelectorAll('.service-option').forEach(function(el){el.onclick=function(){var id=parseInt(el.dataset.id);state.selService=state.services.find(function(s){return s.id===id;});renderServices();updateSummary();};});
}

// ===== SUMMARY =====
function updateSummary(){
  var sv=function(id,v){var e=$d(id);if(e)e.textContent=v;};
  sv('summary-date',state.selDate?dFmt(state.selDate):'—');
  sv('summary-time',state.selTime?fTime(state.selTime):'—');
  sv('summary-barber',state.selBarber?state.selBarber.name:'—');
  sv('summary-service',state.selService?state.selService.name:'—');
  var price=state.selService?state.selService.price:0;
  sv('summary-price',state.selService?fCur(price):'—');
  var discount=0;
  var de=$d('summary-discount-row');
  if(state.membership&&state.membership.name==='VIP Tech'&&price>0){
    discount=Math.round(price*0.15);
    if(de)de.style.display='flex';
    sv('summary-discount','-15% = -'+fCur(discount));
  }else{if(de)de.style.display='none';}
  var fp=price-discount;
  sv('summary-deposit','10% = '+fCur(fp*0.1));
  sv('summary-total',state.selService?fCur(fp):'—');
  var btn=$d('book-btn');
  if(btn){var ok=state.selDate&&state.selTime&&state.selBarber&&state.selService;btn.disabled=!ok;btn.style.opacity=ok?'1':'0.5';btn.style.cursor=ok?'pointer':'not-allowed';}
}

function setupBookingBtn(){
  var btn=$d('book-btn');if(!btn)return;
  btn.onclick=function(){
    if(!state.selDate||!state.selTime||!state.selBarber||!state.selService){alert('Completa todos los campos');return;}
    var sp=state.selService.price;
    var dc=0;
    if(state.membership&&state.membership.name==='VIP Tech'){dc=Math.round(sp*0.15);}
    var fpr=sp-dc;
    var dp=fpr*0.1;
    showStripeModal(sp,dc,dp,fpr);
  };
}

// ===== STRIPE =====
function showStripeModal(servicePrice,discount,deposit,total){
  var ex=document.getElementById('stripe-modal');if(ex)ex.remove();
  var discHtml=discount>0?'<div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:0.9rem;"><span style="color:#00c853;">👑 Descuento VIP (-15%):</span><span style="color:#00c853;font-weight:600;">-'+fCur(discount)+'</span></div>':'';
  var pendiente=total-deposit;
  var m=document.createElement('div');m.id='stripe-modal';
  m.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:10000;display:flex;align-items:center;justify-content:center;font-family:Inter;';
  m.innerHTML='<div style="background:#fff;border-radius:16px;padding:32px;max-width:440px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.2);">'+
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;"><h3 style="margin:0;color:#1a1a2e;">💳 Stripe Checkout</h3><span style="font-size:0.75rem;color:#00c853;background:rgba(0,200,83,0.1);padding:4px 12px;border-radius:12px;">🔒 Simulación</span></div>'+
    '<div style="background:#f5f6fa;border-radius:12px;padding:20px;margin-bottom:20px;">'+
    '<div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:0.9rem;"><span style="color:#6e6e7e;">Precio del Servicio:</span><span style="color:#1a1a2e;font-weight:600;">'+fCur(total)+'</span></div>'+discHtml+
    '<div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:0.9rem;"><span style="color:#6e6e7e;">Depósito (10%):</span><span style="color:#00a0b8;font-weight:600;">'+fCur(deposit)+'</span></div>'+
    '<div style="border-top:1px solid #e0e0ea;padding-top:12px;display:flex;justify-content:space-between;font-size:1.1rem;"><span style="color:#1a1a2e;font-weight:700;">Cobro ahora (Stripe):</span><span style="color:#1a1a2e;font-weight:800;">'+fCur(deposit)+'</span></div>'+
    '<div style="margin-top:8px;background:#fff3e0;border:1px solid #ffe0b2;border-radius:8px;padding:12px;font-size:0.8rem;color:#e65100;text-align:center;"><strong>💡 Pendiente en barbería:</strong> '+fCur(pendiente)+' (pagas al llegar)</div></div>'+
    '<div style="margin-bottom:16px;">'+
    '<label style="display:block;font-size:0.8rem;font-weight:600;color:#1a1a2e;margin-bottom:6px;text-transform:uppercase;">Número de Tarjeta</label>'+
    '<input id="cc-n" type="text" class="form-input" placeholder="4242 4242 4242 4242" maxlength="19" value="4242 4242 4242 4242" style="background:#f5f6fa;border:1px solid #e0e0ea;">'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;">'+
    '<div><label style="display:block;font-size:0.8rem;font-weight:600;color:#1a1a2e;margin-bottom:6px;text-transform:uppercase;">Vencimiento</label><input id="cc-e" type="text" class="form-input" placeholder="MM/AA" maxlength="5" value="12/28" style="background:#f5f6fa;border:1px solid #e0e0ea;"></div>'+
    '<div><label style="display:block;font-size:0.8rem;font-weight:600;color:#1a1a2e;margin-bottom:6px;text-transform:uppercase;">CVC</label><input id="cc-c" type="text" class="form-input" placeholder="123" maxlength="4" value="123" style="background:#f5f6fa;border:1px solid #e0e0ea;"></div></div>'+
    '<div style="margin-top:12px;"><label style="display:block;font-size:0.8rem;font-weight:600;color:#1a1a2e;margin-bottom:6px;text-transform:uppercase;">Titular</label><input id="cc-na" type="text" class="form-input" value="Alejandro García" style="background:#f5f6fa;border:1px solid #e0e0ea;"></div></div>'+
    '<button id="spay" style="width:100%;padding:14px;background:#00E5FF;color:#1a1a2e;border:none;border-radius:8px;font-weight:700;font-size:1rem;cursor:pointer;">Pagar Depósito '+fCur(deposit)+'</button>'+
    '<button id="scancel" style="width:100%;padding:10px;background:none;border:none;color:#6e6e7e;margin-top:8px;cursor:pointer;font-size:0.85rem;">Cancelar</button></div>';
  document.body.appendChild(m);
  document.getElementById('spay').onclick=function(){
    m.innerHTML='<div style="background:#fff;border-radius:16px;padding:32px;max-width:440px;width:90%;text-align:center;"><div style="font-size:3rem;margin-bottom:16px;">⏳</div><h3 style="color:#1a1a2e;">Procesando pago...</h3></div>';
    setTimeout(function(){
      var apt={id:Date.now(),date:state.selDate,time:state.selTime,barber_name:state.selBarber.name,barber_id:state.selBarber.id,service_name:state.selService.name,service_id:state.selService.id,price:total,deposit:deposit,total:total, pendiente:pendiente, paymentMethod:'Stripe_Token',paymentStatus:'Completado',clientName:'Cliente Demo',estado:'confirmada',createdAt:new Date().toISOString()};
      var aps=JSON.parse(localStorage.getItem('innovare_appointments')||'[]');aps.push(apt);
      localStorage.setItem('innovare_appointments',JSON.stringify(aps));state.appointments=aps;
      m.innerHTML='<div style="background:#fff;border-radius:16px;padding:32px;max-width:440px;width:90%;text-align:center;"><div style="font-size:3rem;margin-bottom:16px;">✅</div><h3 style="color:#00c853;">¡Depósito procesado!</h3><p style="color:#6e6e7e;">Se cobró: <strong>'+fCur(deposit)+'</strong></p><div style="background:#fff3e0;border:1px solid #ffe0b2;border-radius:8px;padding:12px;margin:12px 0;font-size:0.85rem;color:#e65100;">💡 <strong>Pendiente en barbería:</strong> '+fCur(pendiente)+'</div><p style="color:#6e6e7e;font-size:0.8rem;">ID: #'+apt.id+'</p><button onclick="window.location.href=\'mis-citas.html\'" style="width:100%;padding:14px;background:#00E5FF;color:#1a1a2e;border:none;border-radius:8px;font-weight:700;font-size:1rem;cursor:pointer;margin-top:16px;">Ver Mis Citas</button></div>';
    },2000);
  };
  document.getElementById('scancel').onclick=function(){m.remove();};
}

function fTime(t){if(!t)return'—';var p=t.split(':'),h=parseInt(p[0]),a=h>=12?'PM':'AM';return(h%12||12)+':'+p[1]+' '+a;}
function fCur(n){return'$'+parseFloat(n).toFixed(2);}
function dFmt(d){try{return new Date(d+'T00:00:00').toLocaleDateString('es-MX',{year:'numeric',month:'long',day:'numeric'});}catch(e){return d;}}
window.changeMonth=changeMonth;