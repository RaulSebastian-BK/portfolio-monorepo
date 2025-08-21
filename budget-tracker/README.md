# 💰 Personal Budget Tracker

App web minimalista para **gestionar ingresos, gastos y presupuestos** por categoría.  
Construida con **HTML + CSS + JavaScript (Chart.js)** y persistencia en **localStorage**.

---

## 🌐 Demo

👉 [Probar aquí](https://budget-tracker-iota-eight.vercel.app)

---

## 👨‍💻 Autor

- **Raúl Sebastián**  
- Portafolio: [raulsebastian.vercel.app](https://raulsebastian.vercel.app)  
- GitHub: [@RaulSebastian-BK](https://github.com/RaulSebastian-BK)

---

## ✨ Funcionalidades

- 📊 KPIs: **Balance / Ingresos / Gastos** con animación.  
- 🔎 **Filtros**: por mes, tipo y búsqueda.  
- 📝 **CRUD** de transacciones.  
- 🎯 **Presupuestos por categoría** con barras y colores por umbral.  
- 📈 **Gráficas** (pie y línea) por categoría y flujo de caja.  
- 🌙 **Tema claro/oscuro** persistente.  
- 📂 **Exportar / Importar** datos en JSON.  
- 💱 **Multimoneda** (MXN, USD, EUR, COP, ARS).

---

## 🛠 Tecnologías

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)

---

## 🧭 Estructura

budget-tracker/
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
   cd portfolio-monorepo/budget-tracker
Abre index.html en tu navegador (no requiere backend).

📌 Los datos se guardan en localStorage.
Para resetearlos, usa “Borrar todo” en la barra superior.

📦 Exportar & Importar
Exportar → genera un archivo budget-YYYY-MM.json con tu estado actual.

Importar → carga un JSON válido para recuperar tus datos.

📸 Capturas
Agrega aquí screenshots o un GIF de la app en acción
Ejemplo:


🧠 Aprendizajes
Mejoré mi manejo del DOM y eventos en JS.

Implementé persistencia de datos con localStorage.

Aprendí a usar Chart.js para visualizaciones personalizadas.

Diseñé una interfaz con glassmorphism suave y soporte dark/light mode.

🚧 Próximos pasos
 Exportar también a Excel/CSV.

 Dashboard responsive completo para móviles.

 Soporte para cuentas múltiples.

 Notificaciones de presupuesto excedido.

⚖️ Licencia
Este proyecto está bajo la licencia MIT.
Ver LICENSE para más detalles.