// ===================== Configuración & utilidades =====================
const inputText      = document.getElementById("inputText");
const outputBox      = document.getElementById("outputBox");
const summarizeBtn   = document.getElementById("summarizeBtn");
const clearBtn       = document.getElementById("clearBtn");
const copyBtn        = document.getElementById("copyBtn");
const downloadBtn    = document.getElementById("downloadBtn");
const themeBtn       = document.getElementById("themeBtn");

const langBadge      = document.getElementById("langBadge");
const statsBadge     = document.getElementById("statsBadge");
const ratioBadge     = document.getElementById("ratioBadge");

const langSelect     = document.getElementById("langSelect");
const sentencesRange = document.getElementById("sentencesRange");
const sentencesCount = document.getElementById("sentencesCount");

const THEME_KEY = "mini-summarizer:theme";

// Idiomas soportados y stopwords (subset curado)
const STOPWORDS = {
  es: new Set("de la que el en y a los del se las por un para con no una su al lo como más pero sus le ya o este sí porque cuando muy sin sobre también me hasta hay dónde todo han ser son fue era desde está mi si ese esa esto esto es entre dos así antes después cada e incluso toda todos hacer contra".split(" ")),
  en: new Set("the of and to in a is that for it on as with was are be by this from at an or have has not you your we they he she their our".split(" ")),
  pt: new Set("de da do das dos e a o que em para com não uma um no na os as por se ele ela você vocês nós eu suas seus ao aos".split(" ")),
  fr: new Set("de la le les des et à un une en pour avec pas qui que dans sur par il elle ils elles nous vous ce cette ces est sont au aux du".split(" ")),
  de: new Set("der die und in den von zu mit das ist des nicht sich ein eine auf für im dem".split(" ")),
  it: new Set("di e la il che a per in con non una un le lo gli dei delle del degli".split(" ")),
};

// Emojis de idioma
const LANG_EMOJI = { es:"🇪🇸", en:"🇺🇸", pt:"🇵🇹", fr:"🇫🇷", de:"🇩🇪", it:"🇮🇹", auto:"🌐" };

// Tokenizadores básicos por idioma (separadores de oración)
const SENTENCE_REGEX = /[^.!?…]+[.!?…]?/g;

// ===================== Tema (dark/light) =====================
initTheme();
function initTheme(){
  const pref = localStorage.getItem(THEME_KEY) || "dark";
  document.body.classList.toggle("light", pref === "light");
  themeBtn.textContent = pref === "light" ? "🌙" : "☀️";
}
themeBtn.addEventListener("click", ()=>{
  const isLight = document.body.classList.toggle("light");
  localStorage.setItem(THEME_KEY, isLight ? "light" : "dark");
  themeBtn.textContent = isLight ? "🌙" : "☀️";
});

// ===================== Detección de idioma =====================
function detectLanguage(text){
  // Heurística: conteo de coincidencias con stopwords por idioma
  const words = (text.toLowerCase().match(/\b[\p{L}]+/gu) || []);
  const scores = { es:0,en:0,pt:0,fr:0,de:0,it:0 };
  for (const w of words){
    for (const lang of Object.keys(STOPWORDS)){
      if (STOPWORDS[lang].has(w)) scores[lang]++;
    }
  }
  // bonus por caracteres diacríticos típicos
  const add = (lang, re) => { if (re.test(text)) scores[lang]+=2; };
  add("es", /ñ|á|é|í|ó|ú/gi);
  add("pt", /ã|õ|ç/gi);
  add("fr", /ç|é|è|ê|à|î|ï|ô|ù/gi);
  add("de", /ä|ö|ü|ß/gi);
  add("it", /à|è|é|ì|ò|ù/gi);

  let best = "en", max = -1;
  for (const [k,v] of Object.entries(scores)){
    if (v > max){ max = v; best = k; }
  }
  return best;
}

// ===================== Métricas =====================
function countWords(text){
  return (text.match(/\b[\p{L}\p{N}']+\b/gu) || []).length;
}
function readingTime(text, wpm=230){
  return Math.max(1, Math.round(countWords(text)/wpm));
}

// ===================== Resumen =====================
function summarize(text, lang, nSentences){
  const sentences = (text.match(SENTENCE_REGEX) || []).map(s=>s.trim()).filter(Boolean);
  if (sentences.length === 0) return "";
  if (sentences.length <= nSentences) return sentences.join(" ");

  const stop = STOPWORDS[lang] || STOPWORDS.en;
  const words = (text.toLowerCase().match(/\b[\p{L}]+/gu) || []).filter(w=>!stop.has(w));
  if (words.length === 0) return sentences.slice(0, nSentences).join(" ");

  // Frecuencia
  const freq = new Map();
  for (const w of words) freq.set(w, (freq.get(w)||0)+1);

  // Normalización para que palabras muy frecuentes no dominen
  const maxFreq = Math.max(...freq.values());
  for (const [k,v] of freq) freq.set(k, v/maxFreq);

  // Score de oraciones
  const scored = sentences.map((s, idx) => {
    const ws = s.toLowerCase().match(/\b[\p{L}]+/gu) || [];
    const lenPenalty = Math.max(0.5, Math.min(1.2, 60 / Math.max(8, ws.length))); // favorece oraciones 8–60 tokens
    const score = ws.reduce((a,w)=> a + (freq.get(w)||0), 0) * lenPenalty + (idx===0 ? 0.1 : 0); // leve sesgo a la 1ª
    return { s, i: idx, score };
  });

  // Top-N manteniendo orden original
  const top = scored.sort((a,b)=>b.score-a.score).slice(0, nSentences).sort((a,b)=>a.i-b.i);
  return top.map(x=>x.s).join(" ");
}

// ===================== UI bindings =====================
sentencesRange.addEventListener("input", ()=>{
  sentencesCount.textContent = sentencesRange.value;
});

inputText.addEventListener("input", ()=>{
  const text = inputText.value.trim();
  const words = countWords(text);
  const mins = readingTime(text);
  statsBadge.textContent = `${words} ${words===1?"palabra":"palabras"} · ${mins} min`;
  // detección en vivo si está en auto
  if (langSelect.value === "auto"){
    const det = text ? detectLanguage(text) : "auto";
    langBadge.textContent = `${LANG_EMOJI[det]||"🌐"} ${det.toUpperCase()}`;
  }
});

langSelect.addEventListener("change", ()=>{
  const code = langSelect.value;
  if (code === "auto"){
    const text = inputText.value.trim();
    const det = text ? detectLanguage(text) : "auto";
    langBadge.textContent = `${LANG_EMOJI[det]||"🌐"} ${det.toUpperCase()}`;
  } else {
    langBadge.textContent = `${LANG_EMOJI[code]} ${code.toUpperCase()}`;
  }
});

summarizeBtn.addEventListener("click", ()=>{
  const text = inputText.value.trim();
  if (!text){ outputBox.textContent = "Escribe o pega texto para resumir."; return; }

  const chosen = langSelect.value;
  const lang = chosen === "auto" ? detectLanguage(text) : chosen;
  langBadge.textContent = `${LANG_EMOJI[lang]||"🌐"} ${lang.toUpperCase()}`;

  const n = parseInt(sentencesRange.value, 10);
  const summary = summarize(text, lang, n);
  outputBox.textContent = summary || "No se pudo generar un resumen útil.";

  // compresión
  const r = Math.min(99, Math.round((countWords(summary) / Math.max(1,countWords(text))) * 100));
  ratioBadge.textContent = `Compresión: ${r}%`;
});

clearBtn.addEventListener("click", ()=>{
  inputText.value = "";
  outputBox.textContent = "El resumen aparecerá aquí…";
  statsBadge.textContent = "0 palabras · 0 min";
  ratioBadge.textContent = "Compresión: 0%";
  langBadge.textContent = "🌐 Auto";
});

copyBtn.addEventListener("click", ()=>{
  const txt = outputBox.textContent || "";
  navigator.clipboard.writeText(txt).then(()=> alert("Resumen copiado ✅"));
});

downloadBtn.addEventListener("click", ()=>{
  const txt = outputBox.textContent || "";
  const blob = new Blob([txt], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "resumen.txt"; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
});
