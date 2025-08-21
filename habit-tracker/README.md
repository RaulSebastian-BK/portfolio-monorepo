# ✅ Habit Tracker

App web minimalista para **crear y seguir hábitos** con rachas diarias, filtros, búsqueda y exportación de datos.  
Construida con **HTML + CSS + JavaScript** y persistencia en **localStorage**.

---

## 🌐 Demo

👉 [Probar aquí](https://habit-tracker-web-app-delta.vercel.app)

---

## 👨‍💻 Autor

- **Raúl Sebastián**  
- Portafolio: [raulsebastian.vercel.app](https://raulsebastian.vercel.app)  
- GitHub: [@RaulSebastian-BK](https://github.com/RaulSebastian-BK)

---

## ✨ Funcionalidades

- ➕ **Agregar hábitos** con nombre y **emoji** opcional.
- 🗂️ **Filtros**: todos, activos, completados hoy.
- 🔎 **Búsqueda** por texto y emoji.
- 🔥 **Rachas diarias**: cálculo automático (yesterday/today).
- 📊 **Progreso del día** con barra y porcentaje.
- 🗃️ **Archivar/Desarchivar** hábitos sin perder historial.
- ✏️ **Editar** nombre/emoji y **eliminar** hábitos.
- 🌙 **Tema claro/oscuro** (persistente).
- 📦 **Exportar / Importar** a JSON.
- ♿ Accesibilidad básica: foco visible, semántica.

---

## 🛠 Tecnologías

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

---

## 🧭 Estructura

habit-tracker/
├─ index.html
├─ style.css
└─ script.js

yaml
Copiar
Editar

---

## 🚀 Uso local

1. Clona el monorepo:
   ```bash
   git clone https://github.com/RaulSebastian-BK/portfolio-monorepo.git
   cd portfolio-monorepo/habit-tracker
Abre index.html en tu navegador (no requiere backend).

Los datos se guardan en localStorage.
Para resetearlos, usa “Borrar todo” en la barra superior.

📦 Exportar & Importar
Exportar → genera habit-tracker-YYYY-MM-DD.json con tu estado actual.

Importar → selecciona un JSON válido (con estructura { habits: [...], lastOpen: "YYYY-MM-DD" }).

📸 Capturas
Agrega aquí imágenes o un GIF corto del uso (5–10s).
Ejemplo:


🧠 Aprendizajes
Lógica de streak (racha) con cálculo basado en yesterday/today.

Manejo de estado y persistencia con localStorage.

Render reactivo simple con DOM API (sin frameworks).

Diseño con glassmorphism y modo dark/light.

🚧 Próximos pasos
 Estadísticas por semana/mes.

 Recordatorios (notificaciones del navegador).

 Sincronización en la nube (login básico).

 Reordenar hábitos por drag & drop.

⚖️ Licencia
Este proyecto está bajo la licencia MIT.
Ver LICENSE para más detalles.