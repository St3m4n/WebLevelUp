// /data/usuarios.js
// Esquema estándar de usuario seed (sin contraseñas):
// {
//   run: string (normalizado sin puntos ni guion, con DV como último carácter),
//   nombre: string,
//   apellidos: string,
//   correo: string,
//   perfil: 'Administrador' | 'Vendedor' | 'Cliente',
//   fechaNacimiento: string|null (YYYY-MM-DD) opcional,
//   region: string,
//   comuna: string,
//   direccion: string,
//   descuentoVitalicio: boolean (true solo para Clientes con correo @duoc.cl)
// }
window.usuarios = [
  { run:"000000000", nombre:"System", apellidos:"", correo:"system@levelup.local", perfil:"Administrador", fechaNacimiento:null, region:"", comuna:"", direccion:"", descuentoVitalicio:false, isSystem:true },
  { run:"190110222", nombre:"Felipe",    apellidos:"Ahumada Silva",     correo:"felipe@duoc.cl",              perfil:"Cliente",      fechaNacimiento:"1994-05-12", region:"Biobío",     comuna:"Concepción",  direccion:"Av. Los Carrera 123",   descuentoVitalicio:true  },
  { run:"123456785", nombre:"Ana",       apellidos:"Pérez Gómez",       correo:"ana@gmail.com",               perfil:"Vendedor",     fechaNacimiento:"1988-11-03", region:"RM",         comuna:"Santiago",    direccion:"Av. Providencia 456",   descuentoVitalicio:false },
  { run:"876543214", nombre:"Carlos",    apellidos:"Muñoz Torres",      correo:"carlos@profesor.duoc.cl",     perfil:"Administrador",fechaNacimiento:"1982-07-21", region:"Valparaíso", comuna:"Viña del Mar", direccion:"Calle Marina 789",     descuentoVitalicio:false },
  { run:"111111111", nombre:"María",     apellidos:"López Fernández",   correo:"maria@duoc.cl",               perfil:"Cliente",      fechaNacimiento:"1996-02-17", region:"RM",         comuna:"Las Condes",  direccion:"Camino El Alba 321",   descuentoVitalicio:true  },
  { run:"222222222", nombre:"Javier",    apellidos:"Rojas Díaz",        correo:"jrojas@gmail.com",            perfil:"Vendedor",     fechaNacimiento:"1990-09-30", region:"Biobío",     comuna:"Talcahuano",  direccion:"Calle Colón 987",      descuentoVitalicio:false },
  { run:"333333333", nombre:"Constanza", apellidos:"Soto Herrera",      correo:"constanza@profesor.duoc.cl",  perfil:"Administrador",fechaNacimiento:"1985-12-05", region:"Valparaíso", comuna:"Quilpué",     direccion:"Av. Los Carrera 147",  descuentoVitalicio:false },
  { run:"444444444", nombre:"Diego",     apellidos:"García Morales",    correo:"diegogm@gmail.com",           perfil:"Cliente",      fechaNacimiento:"2001-04-09", region:"RM",         comuna:"Maipú",       direccion:"Av. Pajaritos 654",    descuentoVitalicio:false },
  { run:"555555555", nombre:"Valentina", apellidos:"Ramírez Castro",    correo:"valen@duoc.cl",               perfil:"Vendedor",     fechaNacimiento:"1993-08-14", region:"Valparaíso", comuna:"Villa Alemana",direccion:"Calle Central 852",     descuentoVitalicio:false },
  { run:"666666666", nombre:"Francisco", apellidos:"Fuentes Bravo",     correo:"fran@profesor.duoc.cl",       perfil:"Administrador",fechaNacimiento:"1984-03-28", region:"Biobío",     comuna:"Chiguayante",direccion:"Pasaje Los Aromos 112",   descuentoVitalicio:false },
  { run:"777777777", nombre:"Camila",    apellidos:"Martínez Vargas",   correo:"camila@gmail.com",            perfil:"Cliente",      fechaNacimiento:"2000-06-22", region:"RM",         comuna:"Providencia", direccion:"Av. Providencia 3456",  descuentoVitalicio:false }
];
