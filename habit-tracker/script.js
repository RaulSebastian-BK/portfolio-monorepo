// ======= Utilidades de fecha =======
const todayKey = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
const yesterdayKey = () => {
  const d = new Date(); d.setDate(d.getDate()-1);
  return d.toLocaleDateString("en-CA");
};

// ======= Estado y persistencia =======
const LS_KEY = "habit-tracker:data";
const THEME_KEY = "habit-tracker:theme";

let state = loadState();

// Estructura de un hábito:
// { id, name, emoji, createdAt, completedToday (bool), lastDone (YYYY-MM-DD|null), streak (int), archived (bool) }

function loadState(){
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { habits: [], lastOpen: todayKey() };
    const parsed = JSON.parse(raw);

    // Migraciones simples
    parsed.habits = (parsed.habits || []).map(h => ({
      id: h.id || crypto.randomUUID(),
      name: h.name || "Hábito",
      emoji: h.emoji || "",
      createdAt: h.createdAt || todayKey(),
      completedToday: !!h.completedToday,
      lastDone: h.lastDone || null,
      streak: Number.isInteger(h.streak) ? h.streak : 0,
      archived: !!h.archived
    }));

    parsed.lastOpen = parsed.lastOpen || todayKey();
    return parsed;
  } catch(_) {
    return { habits: [], lastOpen: todayKey() };
  }
}

function saveState(){
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

// ======= Selectores =======
const habitInput = document.getElementById("habitInput");
const habitEmoji = document.getElementById("habitEmoji");
const addBtn = document.getElementById("addBtn");

const filterButtons = document.querySelectorAll(".filter");
const searchInput = document.getElementById("searchInput");

const habitList = document.getElementById("habitList");
const emptyState = document.getElementById("emptyState");

const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const todayLabel = document.getElementById("todayLabel");

const darkToggle = document.getElementById("darkToggle");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");
const clearAll = document.getElementById("clearAll");

const editModal = document.getElementById("editModal");
const editName = document.getElementById("editName");
const editEmoji = document.getElementById("editEmoji");
const saveEdit = document.getElementById("saveEdit");
const cancelEdit = document.getElementById("cancelEdit");

let currentFilter = "all";
let editingId = null;

// ======= Inicio =======
bootstrap();

function bootstrap(){
  // Reset del día si cambió la fecha
  const today = todayKey();
  if (state.lastOpen !== today){
    dailyReset();
    state.lastOpen = today;
    saveState();
  }

  // Tema
  const pref = localStorage.getItem(THEME_KEY) || "light";
  applyTheme(pref);

  // Render inicial
  todayLabel.textContent = new Date().toLocaleDateString("es-MX", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
  render();
}

// Reinicia completedToday si no es hoy
function dailyReset(){
  for (const h of state.habits){
    if (h.completedToday && h.lastDone !== todayKey()){
      h.completedToday = false;
    }
  }
}

// ======= Acciones de UI =======
addBtn.addEventListener("click", addHabit);
habitInput.addEventListener("keydown", (e)=>{ if(e.key==="Enter") addHabit(); });

function addHabit(){
  const name = habitInput.value.trim();
  if (!name) return;
  const emoji = habitEmoji.value.trim();

  state.habits.push({
    id: crypto.randomUUID(),
    name,
    emoji,
    createdAt: todayKey(),
    completedToday: false,
    lastDone: null,
    streak: 0,
    archived: false
  });
  habitInput.value = "";
  habitEmoji.value = "";
  saveState();
  render();
}

function toggleToday(id){
  const h = state.habits.find(x=>x.id===id);
  if (!h) return;

  // Si marcamos como hecho hoy
  if (!h.completedToday){
    // Cálculo de racha
    const y = yesterdayKey();
    if (h.lastDone === todayKey()){
      // ya estaba hecho hoy (edge), no sumar
    } else if (h.lastDone === y) {
      h.streak += 1;
    } else {
      h.streak = 1;
    }
    h.lastDone = todayKey();
    h.completedToday = true;
  } else {
    // Desmarcar hoy no rompe la racha pasada, pero no cuenta el día
    h.completedToday = false;
    // no cambiamos lastDone
  }

  saveState();
  render();
}

function deleteHabit(id){
  state.habits = state.habits.filter(x=>x.id!==id);
  saveState();
  render();
}

function archiveHabit(id){
  const h = state.habits.find(x=>x.id===id);
  if(!h) return;
  h.archived = !h.archived;
  saveState(); render();
}

filterButtons.forEach(btn=>{
  btn.addEventListener("click", ()=>{
    filterButtons.forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    render();
  });
});

searchInput.addEventListener("input", render);

// Editar
function openEdit(id){
  const h = state.habits.find(x=>x.id===id);
  if (!h) return;
  editingId = id;
  editName.value = h.name;
  editEmoji.value = h.emoji || "";
  editModal.showModal();
}

saveEdit.addEventListener("click", ()=>{
  if (!editingId) return;
  const h = state.habits.find(x=>x.id===editingId);
  if (!h) return;
  const newName = editName.value.trim();
  const newEmoji = editEmoji.value.trim();
  if (newName) h.name = newName;
  h.emoji = newEmoji;
  editingId = null;
  editModal.close();
  saveState(); render();
});
cancelEdit.addEventListener("click", (e)=>{ e.preventDefault(); editingId=null; editModal.close(); });

// Tema
darkToggle.addEventListener("click", ()=>{
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  darkToggle.textContent = isDark ? "☀️" : "🌙";
});

function applyTheme(mode){
  const dark = mode === "dark";
  document.body.classList.toggle("dark", dark);
  darkToggle.textContent = dark ? "☀️" : "🌙";
}

// Exportar
exportBtn.addEventListener("click", ()=>{
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `habit-tracker-${todayKey()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
});

// Importar
importFile.addEventListener("change", async (e)=>{
  const file = e.target.files?.[0];
  if (!file) return;
  try{
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data || !Array.isArray(data.habits)) throw new Error("Formato inválido");
    state = data;
    state.lastOpen = todayKey(); // normalizamos
    saveState(); render();
  } catch (err){
    alert("No se pudo importar el archivo. Verifica que sea JSON válido.");
  } finally {
    importFile.value = "";
  }
});

// Borrar todo
clearAll.addEventListener("click", ()=>{
  if (!confirm("¿Seguro que deseas borrar todos los datos?")) return;
  state = { habits: [], lastOpen: todayKey() };
  saveState(); render();
});

// ======= Render =======
function render(){
  // Filtro + búsqueda
  const q = (searchInput.value || "").toLowerCase();

  let visibles = state.habits.filter(h=>!h.archived);
  if (currentFilter === "active") visibles = visibles.filter(h=>!h.completedToday);
  if (currentFilter === "today") visibles = visibles.filter(h=>h.completedToday);
  if (q) visibles = visibles.filter(h => (h.name + " " + (h.emoji||"")).toLowerCase().includes(q));

  // Lista
  habitList.innerHTML = "";
  emptyState.style.display = visibles.length ? "none" : "block";

  for (const h of visibles){
    const li = document.createElement("li");
    li.className = "habit" + (h.completedToday ? " done" : "");
    li.innerHTML = `
      <div class="emoji">${h.emoji || "✅"}</div>
      <div>
        <div class="name">${escapeHTML(h.name)}</div>
        <div class="meta">
          <span class="badge">Racha: ${h.streak}🔥</span>
          <span class="badge">Creado: ${formatDate(h.createdAt)}</span>
          ${h.lastDone ? `<span class="badge">Último: ${formatDate(h.lastDone)}</span>`:""}
        </div>
      </div>
      <div class="actions">
        <button class="ghost" data-act="toggle">${h.completedToday ? "Desmarcar" : "Hecho hoy"}</button>
        <button class="ghost" data-act="edit">Editar</button>
        <button class="ghost" data-act="archive">${h.archived ? "Desarchivar" : "Archivar"}</button>
        <button class="danger ghost" data-act="delete">Eliminar</button>
      </div>
    `;

    li.querySelector('[data-act="toggle"]').addEventListener("click", ()=>toggleToday(h.id));
    li.querySelector('[data-act="edit"]').addEventListener("click", ()=>openEdit(h.id));
    li.querySelector('[data-act="archive"]').addEventListener("click", ()=>archiveHabit(h.id));
    li.querySelector('[data-act="delete"]').addEventListener("click", ()=>deleteHabit(h.id));
    habitList.appendChild(li);
  }

  // Progreso
  const total = state.habits.filter(h=>!h.archived).length;
  const done = state.habits.filter(h=>!h.archived && h.completedToday).length;
  const pct = total ? Math.round(done*100/total) : 0;
  progressBar.style.width = pct + "%";
  progressText.textContent = `${pct}% completado (${done}/${total})`;

  saveState();
}

// Helpers
function escapeHTML(str){ return str.replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s])); }
function formatDate(yyyy_mm_dd){
  try{
    const [y,m,d] = yyyy_mm_dd.split("-").map(Number);
    const dt = new Date(y, m-1, d);
    return dt.toLocaleDateString("es-MX", { day:"2-digit", month:"short"});
  } catch { return yyyy_mm_dd; }
}
