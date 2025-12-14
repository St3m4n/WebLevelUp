# LEVEL-UP GAMER - ET - FULLSTACK 2

Tienda online de videojuegos y accesorios con sistema de administración, desarrollados con **React 18**, **TypeScript**, **Vite** y **Tailwind CSS**.

Esta aplicación Fullstack 2 presenta una migración modernizada desde la base HTML/CSS/JavaScript original, con arquitectura de componentes reutilizables, state management con Context API, y herramientas avanzadas de testing y análisis de código.

---

## 👥 Integrantes
- Francisca Barrera
- Patricio Zapata

---

## 🏗 Estructura del Proyecto

```
WebLevelUp/
├── app/                      # Aplicación moderna (React + TypeScript)
│   ├── src/
│   │   ├── components/       # Componentes reutilizables
│   │   ├── context/          # Context API (Auth, Cart, Toast)
│   │   ├── pages/            # Páginas (Home, Tienda, Admin, etc.)
│   │   ├── hooks/            # Custom hooks
│   │   ├── services/         # API client y servicios
│   │   ├── types/            # Tipos TypeScript
│   │   ├── utils/            # Utilities y helpers
│   │   ├── App.tsx           # Componente raíz
│   │   ├── main.tsx          # Entry point
│   │   └── routes.tsx        # Definición de rutas
│   ├── vite.config.ts        # Configuración Vite
│   ├── tsconfig.json         # TypeScript config
│   ├── package.json          # Dependencias del proyecto
│   └── coverage/             # Reportes de cobertura de tests
│
└── legacy/                    # Versión anterior (HTML/CSS/JS)
    ├── index.html
    ├── pages/
    ├── js/
    ├── css/
    └── data/
```

---

## 🎯 Características Principales

### Tienda (Store)
- **Catálogo de productos** con filtrado por categorías
- **Búsqueda avanzada** de productos
- **Carrito de compras** persistente (LocalStorage)
- **Sistema de puntos Level-Up**: acumula EXP y sube de nivel
- **Descuento automático DUOC** (-20%) para correos @duoc.cl
- **Detalles de producto** con stock en tiempo real
- **Autenticación de usuarios** (login/registro)
- **Perfil de usuario** personalizado
- **Sistema de comentarios** en comunidad

### Panel Administrativo
- **Dashboard** con métricas en tiempo real
- **Gestión de productos**: crear, editar, eliminar
- **Gestión de usuarios**: perfiles, roles, permisos
- **Gestión de órdenes** y historial de compras
- **Bitácora de auditoría** de todas las acciones
- **Reportes** de ventas y estadísticas

---

## 🛠 Stack Tecnológico

### Frontend
- **React 18** - Biblioteca UI
- **TypeScript** - Type safety
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Utilidades de estilos
- **TanStack Query** - State management del servidor
- **React Router** - Enrutamiento
- **Sonner** - Notificaciones toast

### Testing
- **Vitest** - Test runner
- **React Testing Library** - Testing de componentes
- **Coverage Reports** - Análisis de cobertura

### DevTools
- **ESLint** - Linting
- **TypeScript** - Type checking
- **PostCSS** - Procesamiento de CSS

---

## 🚀 Cómo ejecutar el proyecto

### Instalación
```bash
cd app
npm install
```

### Desarrollo
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### Build para producción
```bash
npm run build
```

### Tests
```bash
npm run test           # Ejecutar tests
npm run test:ui       # Interfaz visual de tests
npm run test:coverage # Reporte de cobertura
```

### Linting
```bash
npm run lint           # Verificar código
npm run lint:fix       # Corregir problemas automáticos
```

---

## 📊 Arquitectura de Datos

### Context API
- **AuthContext** - Gestión de autenticación y usuario actual
- **CartContext** - Carrito de compras compartido
- **ToastContext** - Sistema de notificaciones

### Custom Hooks
- `useProducts()` - Productos del catálogo
- `useCategories()` - Categorías disponibles
- `useOrders()` - Órdenes del usuario
- `useUsers()` - Gestión de usuarios (admin)
- `usePricing()` - Cálculos de precios
- `useLevelUpStats()` - Estadísticas del sistema Level-Up
- `useComunas()` / `useRegiones()` - Datos geográficos

### Servicios
- **apiClient.ts** - Cliente HTTP centralizado
- Endpoints para productos, usuarios, órdenes, etc.

---

## 🎨 Componentes Principales

- `Navbar` - Barra de navegación principal
- `SecondaryNav` - Navegación secundaria (categorías)
- `FeaturedOffers` - Sección de ofertas destacadas
- `RecommendationsGrid` - Grid de recomendaciones de productos
- `ProductCard` - Card individual de producto
- `CommunityComments` - Sección de comentarios
- `Footer` - Pie de página
- `ToastViewport` - Contenedor de notificaciones

---

## ✅ Validaciones Implementadas

### Usuarios
- RUN: formato válido con módulo 11
- Correo: formato correcto, dominios válidos
- Contraseña: mínimo 4-10 caracteres
- Región/Comuna: dependencia validada
- Dirección: máximo 300 caracteres

### Productos (Admin)
- Código: mínimo 3 caracteres, requerido
- Nombre: máximo 100 caracteres
- Descripción: máximo 500 caracteres
- Precio: número positivo
- Stock: número entero no negativo
- Stock crítico: alerta visual cuando alcanza el mínimo

### Carrito
- Validación de stock disponible
- Persistencia automática
- Cálculo dinámico de totales
- Descuentos automáticos aplicados

---

## 🔐 Persistencia y Estado

### LocalStorage
- Carrito de compras
- Preferencias de usuario
- Token de autenticación (si aplica)
- Configuración de la aplicación

### API
- Productos y categorías
- Información de usuario
- Órdenes y transacciones
- Auditoría de acciones

---

## 📱 Responsividad

La aplicación está completamente optimizada para:
- **Desktop** (1920px+)
- **Tablet** (768px - 1024px)
- **Mobile** (320px - 767px)

---

## 🧪 Testing

Cobertura de tests incluye:
- Componentes React
- Custom hooks
- Utilities y helpers
- Integración de componentes

Ver reporte en: `app/coverage/lcov-report/index.html`

---

## 📝 Convenciones de Código

### Naming
- Componentes: `PascalCase` (ej: `ProductCard.tsx`)
- Funciones: `camelCase` (ej: `calculateDiscount()`)
- Constantes: `UPPER_SNAKE_CASE`
- Archivos CSS Modules: `ComponentName.module.css`

### Estructura de Commits
```
feat(feature): descripción
fix(module): descripción
refactor(module): descripción
test(module): descripción
```

---

## 🌿 Ramas del Repositorio
- `main` — Rama principal (producción)
- `develop` — Desarrollo e integración
- `feature/*` — Features específicas
- `fix/*` — Correcciones de bugs

---

## 🧪 Troubleshooting

| Problema | Solución |
|----------|----------|
| Node modules no instalan | Elimina `node_modules` y `package-lock.json`, luego `npm install` |
| Errores de TypeScript | Ejecuta `npm run type-check` para ver errores completos |
| Build fallando | Verifica que no haya errores de ESLint con `npm run lint` |
| Tests no corren | Asegúrate de tener `node` 18+ con `node --version` |
| Puerto 5173 en uso | Cambia el puerto en `vite.config.ts` o mata el proceso |

---

## 📚 Recursos Útiles

- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs)
- [Vite Guide](https://vitejs.dev/guide)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TanStack Query](https://tanstack.com/query/latest)
