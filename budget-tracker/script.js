// ====== Estado & Persistencia ======
const LS_KEY = "budget-tracker:v2";
const THEME_KEY = "budget-tracker:theme";
let state = load();

function load(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { currency: "MXN", transactions: [], budgets: {} };
    const s = JSON.parse(raw);
    s.currency ||= "MXN";
    s.transactions ||= [];
    s.budgets ||= {};
    return s;
  }catch{ return { currency: "MXN", transactions: [], budgets: {} }; }
}
function save(){ localStorage.setItem(LS_KEY, JSON.stringify(state)); }

// ====== Helpers ======
const $ = sel => document.querySelector(sel);

const localeFor = cur => (cur==="MXN"?"es-MX":cur==="EUR"?"es-ES":"en-US");
const symbolFor = cur => ({MXN:"$",USD:"$",EUR:"€",COP:"$",ARS:"$"}[cur] || "$");

function fmt(amount){
  return new Intl.NumberFormat(localeFor(state.currency), {
    style:"currency", currency: state.currency, maximumFractionDigits:2
  }).format(amount||0);
}
function ym(dateStr){
  const d = new Date(dateStr); if (isNaN(d)) return null;
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}
function todayISO(){ const d = new Date(); return d.toISOString().slice(0,10); }
function uid(){ return crypto.randomUUID(); }
function monthName(ymStr){
  const [y,m] = ymStr.split("-").map(Number);
  return new Date(y, m-1, 1).toLocaleDateString("es-MX",{ month:"long", year:"numeric" });
}

// Count-up animation for KPIs
function animateAmount(el, value){
  const from = Number(el.dataset.amount||0);
  const to = Number(value||0);
  const start = performance.now();
  const dur = 450;
  function step(t){
    const p = Math.min(1, (t-start)/dur);
    const v = from + (to-from)*p;
    el.textContent = fmt(v);
    if (p<1) requestAnimationFrame(step); else {
      el.dataset.amount = to.toString();
      balanceColor(); // actualizar color si es el balance
    }
  }
  requestAnimationFrame(step);
}

// Toast
const toastEl = $("#toast");
function toast(msg){
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  setTimeout(()=> toastEl.classList.remove("show"), 1800);
}

// ====== UI elements ======
const currencySelect = $("#currencySelect");
const themeBtn = $("#themeBtn");
const exportBtn = $("#exportBtn");
const importFile = $("#importFile");
const clearBtn = $("#clearBtn");

const monthFilter = $("#monthFilter");
const typeFilter = $("#typeFilter");
const searchInput = $("#searchInput");
const monthLabel = $("#monthLabel");
const currentMonthText = $("#currentMonthText");

const balanceEl = $("#balance");
const incomeTotalEl = $("#incomeTotal");
const expenseTotalEl = $("#expenseTotal");

const typeSel = $("#type");
const amountInput = $("#amount");
const categoryInput = $("#category");
const noteInput = $("#note");
const dateInput = $("#date");
const addBtn = $("#addBtn");

const budgetCategory = $("#budgetCategory");
const budgetAmount = $("#budgetAmount");
const setBudgetBtn = $("#setBudgetBtn");
const budgetsList = $("#budgetsList");

const tableBody = $("#tableBody");
const emptyState = $("#emptyState");

// ====== Tema ======
(function initTheme(){
  const pref = localStorage.getItem(THEME_KEY) || "dark";
  document.body.classList.toggle("light", pref === "light");
  themeBtn.textContent = pref === "light" ? "🌙" : "☀️";
})();
themeBtn.addEventListener("click", ()=>{
  const isLight = document.body.classList.toggle("light");
  localStorage.setItem(THEME_KEY, isLight ? "light" : "dark");
  themeBtn.textContent = isLight ? "🌙" : "☀️";
});

// ====== Inicialización ======
(function init(){
  currencySelect.value = state.currency;
  syncPlaceholders();

  dateInput.value = todayISO();
  const ymNow = ym(todayISO());
  monthFilter.value = ymNow;
  currentMonthText.textContent = `Mes: ${monthName(ymNow)}`;

  currencySelect.addEventListener("change", ()=>{
    state.currency = currencySelect.value; save(); syncPlaceholders(); render(true);
  });
  monthFilter.addEventListener("change", ()=>{
    currentMonthText.textContent = `Mes: ${monthName(monthFilter.value)}`; render(true);
  });
  typeFilter.addEventListener("change", render);
  searchInput.addEventListener("input", render);

  addBtn.addEventListener("click", addTransaction);
  // Atajo: Enter en descripción agrega
  noteInput.addEventListener("keydown", (e)=>{ if (e.key==="Enter") { e.preventDefault(); addTransaction(); } });

  setBudgetBtn.addEventListener("click", setBudget);

  exportBtn.addEventListener("click", exportJSON);
  importFile.addEventListener("change", importJSON);
  clearBtn.addEventListener("click", clearAll);

  render(true);
})();

function syncPlaceholders(){
  const sym = symbolFor(state.currency);
  amountInput.placeholder = `0.00 ${sym}`;
  budgetAmount.placeholder = `0.00 ${sym}`;
}

// ====== CRUD ======
function addTransaction(){
  const type = typeSel.value;
  const amount = Number(amountInput.value);
  const category = (categoryInput.value || "").trim();
  const note = (noteInput.value || "").trim();
  const date = dateInput.value || todayISO();

  if (!amount || amount<=0 || !category){
    alert("Ingresa un monto válido y una categoría.");
    return;
  }

  state.transactions.push({ id: uid(), type, amount, category, note, date });
  save();

  // Reset de UI
  amountInput.value = "";
  categoryInput.value = "";
  noteInput.value = "";
  dateInput.value = todayISO();
  typeFilter.value = "all";
  searchInput.value = "";
  toast("Transacción agregada");

  render(true); // true => refresca KPIs con animación
}
function removeTransaction(id){
  state.transactions = state.transactions.filter(t => t.id !== id);
  save(); toast("Transacción eliminada"); render(true);
}
function editTransaction(id){
  const t = state.transactions.find(x=>x.id===id); if (!t) return;
  const amount = prompt("Nuevo monto:", t.amount); if (amount===null) return;
  const category = prompt("Nueva categoría:", t.category) || t.category;
  const note = prompt("Nueva descripción:", t.note) ?? t.note;
  const date = prompt("Nueva fecha (YYYY-MM-DD):", t.date) || t.date;

  const n = Number(amount);
  if (!n || n<=0){ alert("Monto inválido."); return; }
  Object.assign(t, { amount:n, category, note, date });
  save(); toast("Transacción actualizada"); render(true);
}

// ====== Presupuestos ======
function setBudget(){
  const cat = (budgetCategory.value || "").trim();
  const amt = Number(budgetAmount.value);
  if (!cat || amt<0){ alert("Ingresa categoría y monto válido."); return; }
  state.budgets[cat] = amt;
  budgetCategory.value = ""; budgetAmount.value = "";
  save(); toast("Presupuesto guardado"); renderBudgets();
}
function renderBudgets(){
  budgetsList.innerHTML = "";
  const month = monthFilter.value || ym(todayISO());
  const expenses = state.transactions.filter(t=>t.type==="expense" && ym(t.date)===month);

  // gasto acumulado por categoría
  const spent = {};
  for (const t of expenses){ spent[t.category] = (spent[t.category] || 0) + t.amount; }

  for (const [cat, limit] of Object.entries(state.budgets)){
    const used = spent[cat] || 0;
    const pct = limit>0 ? Math.round((used/limit)*100) : 0;

    const item = document.createElement("div");
    item.className = "budget-item";
    // color por umbral
    const color =
      pct >= 100 ? "linear-gradient(90deg,#ef4444,#fb7185)" :
      pct >= 80  ? "linear-gradient(90deg,#f59e0b,#fbbf24)" :
                   "linear-gradient(90deg,var(--primary),#8cffd1)";
    item.innerHTML = `
      <strong>${cat}</strong>
      <span class="bar"><span style="width:${Math.min(100, Math.max(0,pct))}%; background:${color}"></span></span>
      <span>${fmt(used)} / ${fmt(limit)} (${Math.max(0,pct)}%)</span>
      <span class="spacer"></span>
      <button class="ghost" data-edit="${cat}">Editar</button>
      <button class="danger" data-del="${cat}">Eliminar</button>
    `;
    item.querySelector('[data-edit]').onclick = () => {
      const newAmt = prompt(`Nuevo presupuesto para "${cat}"`, limit);
      if (newAmt===null) return;
      const v = Number(newAmt); if (isNaN(v) || v<0){ alert("Monto inválido."); return; }
      state.budgets[cat] = v; save(); renderBudgets();
    };
    item.querySelector('[data-del]').onclick = () => {
      delete state.budgets[cat]; save(); renderBudgets();
    };
    budgetsList.appendChild(item);
  }
}

// ====== Render principal ======
let pieChart, lineChart;

function balanceColor(){
  const v = Number(balanceEl.dataset.amount || 0);
  balanceEl.classList.toggle("positive", v >= 0);
  balanceEl.classList.toggle("negative", v < 0);
}

function render(refreshKpis=false){
  const month = monthFilter.value || ym(todayISO());
  const type = typeFilter.value;
  const query = (searchInput.value || "").toLowerCase();

  monthLabel.textContent = month;

  // Filtrado para tabla (por mes + filtros de usuario)
  let rows = state.transactions.filter(t => ym(t.date)===month);
  if (type !== "all") rows = rows.filter(t => t.type===type);
  if (query) rows = rows.filter(t =>
    (t.category+t.note).toLowerCase().includes(query)
  );

  // Totales del mes (ignora filtros de tipo/búsqueda)
  const monthOnly = state.transactions.filter(t => ym(t.date)===month);
  const income = monthOnly.filter(t=>t.type==="income").reduce((a,b)=>a+b.amount,0);
  const expense = monthOnly.filter(t=>t.type==="expense").reduce((a,b)=>a+b.amount,0);
  const balance = income - expense;

  // KPIs
  if (refreshKpis){
    animateAmount(balanceEl, balance);
    animateAmount(incomeTotalEl, income);
    animateAmount(expenseTotalEl, expense);
  } else {
    balanceEl.textContent = fmt(balance);
    incomeTotalEl.textContent = fmt(income);
    expenseTotalEl.textContent = fmt(expense);
    balanceEl.dataset.amount = balance; incomeTotalEl.dataset.amount = income; expenseTotalEl.dataset.amount = expense;
    balanceColor();
  }

  // Tabla
  tableBody.innerHTML = "";
  if (rows.length === 0) {
    emptyState.style.display = "flex";
  } else {
    emptyState.style.display = "none";
    rows
      .sort((a,b)=> new Date(b.date) - new Date(a.date))
      .forEach(t=>{
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${t.date}</td>
          <td><span class="chip">${t.type==="income"?"Ingreso":"Gasto"}</span></td>
          <td>${t.category}</td>
          <td>${t.note||""}</td>
          <td class="num">${fmt(t.amount)}</td>
          <td class="actions">
            <button class="ghost" data-edit="${t.id}" title="Editar">Editar</button>
            <button class="danger" data-del="${t.id}" title="Eliminar">Eliminar</button>
          </td>
        `;
        tr.querySelector('[data-del]').onclick = () => removeTransaction(t.id);
        tr.querySelector('[data-edit]').onclick = () => editTransaction(t.id);
        tableBody.appendChild(tr);
      });
  }

  renderBudgets();
  renderCharts(month);
  save();
}

// ====== Gráficas ======
function palette(n){
  const base = [
    "#22c55e","#60a5fa","#f59e0b","#f472b6","#a78bfa","#34d399",
    "#f87171","#38bdf8","#84cc16","#fca5a5","#c084fc","#67e8f9"
  ];
  const out = [];
  for (let i=0;i<n;i++) out.push(base[i%base.length]);
  return out;
}

function renderCharts(month){
  // Pie: gasto por categoría
  const expenses = state.transactions.filter(t=>t.type==="expense" && ym(t.date)===month);
  const byCat = {};
  for (const t of expenses){ byCat[t.category] = (byCat[t.category]||0)+t.amount; }
  const pieLabels = Object.keys(byCat);
  const pieData = Object.values(byCat);

  if (pieChart) pieChart.destroy();
  pieChart = new Chart(document.getElementById("pieChart").getContext("2d"), {
    type:"pie",
    data:{ labels: pieLabels, datasets:[{ data: pieData, backgroundColor: palette(pieData.length) }] },
    options:{ plugins:{ legend:{ position:"bottom" } } }
  });

  // Line: flujo por día (ingresos - gastos)
  const map = {}; // yyyy-mm-dd -> neto
  const txMonth = state.transactions.filter(t=>ym(t.date)===month);
  for (const t of txMonth){
    map[t.date] = (map[t.date]||0) + (t.type==="income"? t.amount : -t.amount);
  }
  const days = Object.keys(map).sort();
  const series = days.map(d=> map[d]);

  if (lineChart) lineChart.destroy();
  lineChart = new Chart(document.getElementById("lineChart").getContext("2d"), {
    type:"line",
    data:{ labels: days, datasets:[{ data: series, tension:.3, fill:false, pointRadius:3 }] },
    options:{
      scales:{ y:{ ticks:{ callback:(v)=>fmt(v) } } },
      plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label:(ctx)=>fmt(ctx.parsed.y) } } }
    }
  });
}

// ====== Exportar / Importar / Borrar ======
function exportJSON(){
  const blob = new Blob([JSON.stringify(state,null,2)], { type:"application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `budget-${monthFilter.value||ym(todayISO())}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  toast("Exportado ✅");
}

async function importJSON(e){
  const file = e.target.files?.[0]; if (!file) return;
  try{
    const txt = await file.text();
    const data = JSON.parse(txt);
    if (!data || !Array.isArray(data.transactions)) throw new Error("Formato inválido");
    state = data; save(); render(true); toast("Importado ✅");
  }catch{
    alert("No se pudo importar el archivo. Verifica el formato JSON.");
  }finally{ importFile.value = ""; }
}

function clearAll(){
  if (!confirm("¿Seguro que quieres borrar todos los datos?")) return;
  state = { currency: state.currency, transactions: [], budgets: {} };
  save(); render(true); toast("Datos borrados");
}
