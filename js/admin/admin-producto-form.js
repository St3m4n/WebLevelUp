// /js/admin/admin-producto-form.js

// --- Helpers DOM ---
const $ = (q, ctx = document) => ctx.querySelector(q);
const $$ = (q, ctx = document) => [...ctx.querySelectorAll(q)];

// --- Storage helpers ---
const LS_KEY = "productos";

// Carga desde localStorage; si no hay, toma del archivo /data/productos.js
function loadProductos() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    }
  } catch (e) { /* ignore */ }
  return Array.isArray(window.productos) ? [...window.productos] : [];
}

function saveProductos(arr) {
  localStorage.setItem(LS_KEY, JSON.stringify(arr));
}

// --- Utils validación ---
function isInt(n) { return Number.isInteger(Number(n)); }
function isNum(n) { return !Number.isNaN(Number(n)); }

// --- Inicialización ---
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(location.search);
  const id = params.get("id"); // código del producto cuando es edición
  const form = $('[data-ref="form"]');
  const btnGuardar = $('[data-ref="btn-guardar"]');
  const titulo = $('[data-ref="titulo"]');

  let data = loadProductos();
  let editing = false;
  let originalCode = null;

  // Referencias a inputs
  const iCodigo = $('#codigo');
  const iNombre = $('#nombre');
  const iDescripcion = $('#descripcion');
  const iPrecio = $('#precio');
  const iStock = $('#stock');
  const iStockCritico = $('#stockCritico');
  const iCategoria = $('#categoria');
  const iImagen = $('#imagen');

  // --- Modo edición si hay ?id=... ---
  if (id) {
    const found = data.find(p => String(p.codigo).toLowerCase() === String(id).toLowerCase());
    if (found) {
      editing = true;
      originalCode = found.codigo;

      titulo.textContent = `Editar producto: ${found.codigo}`;
      iCodigo.value = found.codigo;
      iCodigo.setAttribute('readonly', 'readonly'); // Evita cambiar clave primaria
      iNombre.value = found.nombre || "";
      iDescripcion.value = found.descripcion || "";
      iPrecio.value = found.precio ?? "";
      iStock.value = found.stock ?? "";
      iStockCritico.value = (found.stockCritico ?? "") === null ? "" : found.stockCritico;
      iCategoria.value = found.categoria || "";

      // Imagen: en esta fase no persistimos archivos; si tuvieras URL, podrías setearla en un input text aparte
    } else {
      // Si el id no existe, modo crear
      titulo.textContent = "Nuevo producto";
    }
  } else {
    titulo.textContent = "Nuevo producto";
  }

  // --- Reglas de validación (JS puras, sin plugins) ---
  function validar() {
    let ok = true;

    // Código
    const codigo = iCodigo.value.trim();
    if (codigo.length < 3) ok = setInvalid(iCodigo);
    else if (!editing) {
      const dup = data.some(p => String(p.codigo).toLowerCase() === codigo.toLowerCase());
      if (dup) ok = setInvalid(iCodigo);
      else clearInvalid(iCodigo);
    } else {
      clearInvalid(iCodigo);
    }

    // Nombre
    if (!iNombre.value.trim() || iNombre.value.length > 100) ok = setInvalid(iNombre); else clearInvalid(iNombre);

    // Descripción (opcional, max 500)
    if (iDescripcion.value && iDescripcion.value.length > 500) ok = setInvalid(iDescripcion); else clearInvalid(iDescripcion);

    // Precio (requerido, número >= 0)
    const precio = Number(iPrecio.value);
    if (!isNum(iPrecio.value) || precio < 0) ok = setInvalid(iPrecio); else clearInvalid(iPrecio);

    // Stock (requerido, entero >= 0)
    const stock = Number(iStock.value);
    if (!isNum(iStock.value) || !isInt(iStock.value) || stock < 0) ok = setInvalid(iStock); else clearInvalid(iStock);

    // Stock crítico (opcional, entero >= 0 si viene)
    if (iStockCritico.value !== "") {
      const sc = Number(iStockCritico.value);
      if (!isNum(iStockCritico.value) || !isInt(iStockCritico.value) || sc < 0) ok = setInvalid(iStockCritico);
      else clearInvalid(iStockCritico);
    } else {
      clearInvalid(iStockCritico);
    }

    // Categoría (requerido)
    if (!iCategoria.value) ok = setInvalid(iCategoria); else clearInvalid(iCategoria);

    return ok;
  }

  function setInvalid(input) {
    input.classList.add("is-invalid");
    return false;
  }
  function clearInvalid(input) {
    input.classList.remove("is-invalid");
  }

  // Validación en tiempo real básica
  [iCodigo, iNombre, iDescripcion, iPrecio, iStock, iStockCritico, iCategoria].forEach(inp => {
    inp.addEventListener("input", () => clearInvalid(inp));
    inp.addEventListener("change", () => clearInvalid(inp));
  });

  // --- Guardar ---
  btnGuardar.addEventListener("click", () => {
    if (!validar()) {
      // foco al primero inválido
      const firstInvalid = $('.is-invalid', form);
      firstInvalid?.focus();
      return;
    }

    const payload = {
      codigo: iCodigo.value.trim(),
      nombre: iNombre.value.trim(),
      descripcion: iDescripcion.value.trim(),
      precio: Number(iPrecio.value),
      stock: Number(iStock.value),
      stockCritico: iStockCritico.value === "" ? null : Number(iStockCritico.value),
      categoria: iCategoria.value,
      // imagen: solo guardaremos el nombre del archivo si subiste algo
      imagen: iImagen?.files?.[0]?.name || null
    };

    if (editing) {
      data = data.map(p => p.codigo === originalCode ? { ...p, ...payload, codigo: originalCode } : p);
    } else {
      data = [...data, payload];
    }

    saveProductos(data);

    // Redirigir al listado
    location.href = "./productos.html";
  });
});
