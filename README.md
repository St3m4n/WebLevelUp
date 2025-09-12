# LEVEL-UP GAMER — Evaluación Parcial 1 (Fullstack 2)

Tienda online + sistema de administración, desarrollados con **HTML, CSS (admin.css/tienda.css) y JavaScript**.  
Esta entrega se centra en **estructura**, **diseño**, **validaciones en JS** y **colaboración en GitHub**.

---

## 👥 Integrantes
- Francisca Barrera
- Patricio Zapata

---

## 🧭 Mapas de navegación

### Admin
- **Dashboard** `/pages/admin/index.html`
- **Productos (listado)** `/pages/admin/productos.html`
- **Producto (form)** `/pages/admin/producto-form.html`
- **Usuarios (listado)** `/pages/admin/usuarios.html`
- **Usuario (form)** `/pages/admin/usuario-form.html`
- **Perfil (admin)** `/pages/admin/perfil.html`

### Tienda

---

## 🗂 Estructura de carpetas
/css
  admin.css            # tema claro del panel admin (Orbitron/Roboto)
  tienda.css           # estilos públicos de la tienda

/data
  productos.js         # seed catálogo (window.productos)
  usuarios.js          # seed usuarios (window.usuarios)
  regiones-comunas.js  # catálogo regiones/comunas

/js
  /admin
    admin-productos.js
    admin-producto-form.js
    admin-usuarios.js
    admin-usuario-form.js
    index.js           # métricas dashboard + stock crítico
    perfil.js          # perfil del admin + validación y guardado
    menu-active.js     # marca activo el item del sidebar (autodetect)
  /tienda
    

/pages
  /admin
    index.html
    productos.html
    producto-form.html
    usuarios.html
    usuario-form.html
    perfil.html
  /tienda

---

## 🎨 Tema Admin (admin.css)
- **Usar siempre** `admin.css` en las páginas del panel.
- **Sidebar unificado** con clases: `.lup-sidebar`, `.lup-brand`, `.border-secondary`.
- Las **cards** del admin llevan además la clase `lup-card`.
- Fuentes: **Orbitron** (titulares) y **Roboto** (texto).

---

## 🧩 Sidebar
- Sidebar estándar (idéntico) en todas las vistas admin.

---

## 💾 Semillas y persistencia (LocalStorage)

### Claves de LS
- `productos` — catálogo persistente
- `usuarios` — usuarios persistentes
- `auditLog` — bitácora de acciones
- `currentUserRun` — usuario “logueado” (simulación E1)

### Estrategia
- **Listados** (`admin-productos.js`, `admin-usuarios.js`) cargan desde LS.  
  Si LS está vacío, **siembran** con `window.productos` / `window.usuarios` y guardan.
- **Forms** guardan cambios en LS y el listado se mantiene consistente.

### Orden de scripts (crítico)
En páginas que requieren seed:
- Seed primero (`data/*.js`)
- Lógica después (`js/admin/*.js`)

---

## 👤 Perfil del administrador
- Página: `/pages/admin/perfil.html`
- Carga el usuario actual desde `currentUserRun`.  
  Si no existe, usa el **primer Administrador** del seed/LS.
- Permite editar: **nombre, apellidos, correo, región/comuna, dirección**.  
  Valida dominios de correo y longitudes, y guarda en `usuarios` (LS).
- **Bitácora (auditLog)**: muestra últimas acciones (crear/editar/eliminar) y permite “Limpiar log”.

### Simular login (E1)
```js
localStorage.setItem("currentUserRun", "19011022K"); // RUN admin
```

---

## 📊 Dashboard (index.html del admin)
- Métricas en tiempo real desde LS:
  - **Catálogo total** de productos
  - **Stock bajo** (stock ≤ stockCrítico)
  - **Usuarios** totales
- Lista “Top 5” de **stock crítico** (orden ascendente).

---

## ✅ Validaciones implementadas
### Usuarios
- RUN: requerido, sin puntos/guion, 7–9, módulo 11.
- Nombre ≤ 50, Apellidos ≤ 100, Dirección ≤ 300.
- Correo ≤ 100, dominios válidos.
- Perfil: Administrador, Vendedor, Cliente.
- Región/Comuna dependiente.

### Productos
- Código requerido, min 3.
- Nombre ≤ 100, Descripción ≤ 500.
- Precio min 0, Stock min 0, entero.
- Stock crítico opcional; alerta si stock ≤ crítico.
- Categoría requerida.

### Tienda (E1)
- Login: correo válido + contraseña 4–10.
- Contacto: nombre ≤100, correo ≤100 (dominios válidos), comentario ≤500.
- Carrito: añadir/quitar, no stock negativo, persistencia LS.

---

## 🛠 Cómo correr el proyecto
1. Clonar:
```bash
git clone https://github.com/usuario/proyecto-levelup.git
```
2. Abrir:
- Admin → `/pages/admin/index.html`
- Tienda → `/pages/tienda/index.html`
---

## 🌿 Flujo de ramas (Git)
- `main` — integración
- `adminPages` — admin
- `frani` — tienda

Convenciones de commits:
- `feat(admin): persistencia de productos`
- `fix(admin): validar RUN en edición`
---

## 🧪 Troubleshooting
- **No cargan productos/usuarios**: limpia LS y revisa orden de scripts.
- **Perfil vacío**: define `currentUserRun` o revisa que haya admin en seed.