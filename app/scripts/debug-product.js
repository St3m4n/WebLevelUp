
const fetch = require('node-fetch'); // Assuming node-fetch is available or using native fetch in newer node

async function testCreateProduct() {
  const product = {
    codigo: `TEST-${Date.now()}`,
    nombre: "Producto de Prueba",
    categoria: "Accesorios",
    fabricante: "TestFab",
    distribuidor: "TestDist",
    precio: 1000,
    stock: 10,
    stockCritico: 1,
    descripcion: "Descripcion de prueba",
    imagenUrl: "https://via.placeholder.com/150"
  };

  console.log("Enviando payload:", JSON.stringify(product, null, 2));

  try {
    const response = await fetch('http://localhost:8080/api/v1/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(product)
    });

    console.log("Status:", response.status);
    const text = await response.text();
    console.log("Response:", text);

    if (response.ok) {
        const json = JSON.parse(text);
        console.log("Producto creado. imagenUrl guardado:", json.imagenUrl);
        console.log("Producto creado. url guardado:", json.url);
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

testCreateProduct();
