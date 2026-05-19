const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos...');

  // Crear usuario admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { email: 'admin@ferresync.local' },
    create: {
      username: 'admin',
      email: 'admin@ferresync.local',
      password: hashedPassword,
      fullName: 'Administrador',
      role: 'ADMIN',
      active: true
    }
  });
  console.log('✅ Usuario admin creado:', admin.username);

  // Crear usuario vendedor de prueba
  const vendedorPassword = await bcrypt.hash('vendedor123', 10);
  const vendedor = await prisma.user.upsert({
    where: { username: 'vendedor1' },
    update: { email: 'vendedor1@ferresync.local' },
    create: {
      username: 'vendedor1',
      email: 'vendedor1@ferresync.local',
      password: vendedorPassword,
      fullName: 'Juan Pérez',
      role: 'VENDEDOR',
      active: true
    }
  });
  console.log('✅ Usuario vendedor creado:', vendedor.username);

  // Crear categorías
  const categorias = [
    'Herramientas Manuales',
    'Herramientas Eléctricas',
    'Tornillería',
    'Plomería',
    'Electricidad',
    'Pinturas',
    'Ferretería General',
    'Seguridad'
  ];

  for (const nombre of categorias) {
    await prisma.category.upsert({
      where: { name: nombre },
      update: {},
      create: { name: nombre }
    });
  }
  console.log('✅ Categorías creadas:', categorias.length);

  // Obtener categorías para asignar productos
  const catHerramientas = await prisma.category.findUnique({ where: { name: 'Herramientas Manuales' } });
  const catTornilleria = await prisma.category.findUnique({ where: { name: 'Tornillería' } });
  const catPlomeria = await prisma.category.findUnique({ where: { name: 'Plomería' } });
  const catElectricidad = await prisma.category.findUnique({ where: { name: 'Electricidad' } });
  const catPinturas = await prisma.category.findUnique({ where: { name: 'Pinturas' } });
  const catFerreteriaGeneral = await prisma.category.findUnique({ where: { name: 'Ferretería General' } });
  const catSeguridad = await prisma.category.findUnique({ where: { name: 'Seguridad' } });

  // Crear productos de prueba
  const productos = [
    { sku: 'HM-001', barcode: '7501234567001', name: 'Martillo de uña 16oz', categoryId: catHerramientas.id, unit: 'pza', costPrice: 85.00, salePrice: 149.00, stock: 25, minStock: 5 },
    { sku: 'HM-002', barcode: '7501234567002', name: 'Destornillador plano 1/4"', categoryId: catHerramientas.id, unit: 'pza', costPrice: 25.00, salePrice: 45.00, stock: 50, minStock: 10 },
    { sku: 'HM-003', barcode: '7501234567003', name: 'Pinzas de electricista', categoryId: catHerramientas.id, unit: 'pza', costPrice: 65.00, salePrice: 115.00, stock: 30, minStock: 8 },
    { sku: 'HM-004', barcode: '7501234567004', name: 'Llave ajustable 10"', categoryId: catHerramientas.id, unit: 'pza', costPrice: 95.00, salePrice: 169.00, stock: 20, minStock: 5 },
    { sku: 'HM-005', barcode: '7501234567005', name: 'Flexómetro 5m', categoryId: catHerramientas.id, unit: 'pza', costPrice: 35.00, salePrice: 65.00, stock: 40, minStock: 10 },
    { sku: 'TN-001', barcode: '7501234567010', name: 'Tornillo para madera 2" (100pz)', categoryId: catTornilleria.id, unit: 'bolsa', costPrice: 45.00, salePrice: 79.00, stock: 100, minStock: 20 },
    { sku: 'TN-002', barcode: '7501234567011', name: 'Clavo 2.5" (1kg)', categoryId: catTornilleria.id, unit: 'kg', costPrice: 28.00, salePrice: 49.00, stock: 80, minStock: 15 },
    { sku: 'TN-003', barcode: '7501234567012', name: 'Tornillo tablaroca 1" (100pz)', categoryId: catTornilleria.id, unit: 'bolsa', costPrice: 35.00, salePrice: 59.00, stock: 120, minStock: 25 },
    { sku: 'PL-001', barcode: '7501234567020', name: 'Tubo PVC 4" x 6m', categoryId: catPlomeria.id, unit: 'pza', costPrice: 180.00, salePrice: 299.00, stock: 15, minStock: 5 },
    { sku: 'PL-002', barcode: '7501234567021', name: 'Codo PVC 4" 90°', categoryId: catPlomeria.id, unit: 'pza', costPrice: 25.00, salePrice: 45.00, stock: 50, minStock: 10 },
    { sku: 'PL-003', barcode: '7501234567022', name: 'Llave de paso 1/2"', categoryId: catPlomeria.id, unit: 'pza', costPrice: 55.00, salePrice: 95.00, stock: 25, minStock: 8 },
    { sku: 'EL-001', barcode: '7501234567030', name: 'Cable THW 12 (100m)', categoryId: catElectricidad.id, unit: 'rollo', costPrice: 850.00, salePrice: 1299.00, stock: 10, minStock: 3 },
    { sku: 'EL-002', barcode: '7501234567031', name: 'Interruptor sencillo', categoryId: catElectricidad.id, unit: 'pza', costPrice: 18.00, salePrice: 35.00, stock: 60, minStock: 15 },
    { sku: 'EL-003', barcode: '7501234567032', name: 'Foco LED 9W', categoryId: catElectricidad.id, unit: 'pza', costPrice: 28.00, salePrice: 49.00, stock: 80, minStock: 20 },
    { sku: 'PT-001', barcode: '7501234567040', name: 'Pintura vinílica blanca 4L', categoryId: catPinturas.id, unit: 'cubeta', costPrice: 180.00, salePrice: 299.00, stock: 20, minStock: 5 },
    { sku: 'PT-002', barcode: '7501234567041', name: 'Brocha 4"', categoryId: catPinturas.id, unit: 'pza', costPrice: 35.00, salePrice: 65.00, stock: 30, minStock: 8 },
    { sku: 'PT-003', barcode: '7501234567042', name: 'Rodillo 9"', categoryId: catPinturas.id, unit: 'pza', costPrice: 45.00, salePrice: 85.00, stock: 25, minStock: 8 },
    { sku: 'PT-004', barcode: '7501234567043', name: 'Lija de agua grano 120', categoryId: catPinturas.id, unit: 'pza', costPrice: 8.00, salePrice: 15.00, stock: 120, minStock: 20 },
    { sku: 'PT-005', barcode: '7501234567044', name: 'Lijadora orbital 1/4 hoja', categoryId: catPinturas.id, unit: 'pza', costPrice: 650.00, salePrice: 999.00, stock: 8, minStock: 2 },
    { sku: 'FG-001', barcode: '7501234567050', name: 'Cinta adhesiva de enmascarar 48mm', categoryId: catFerreteriaGeneral.id, unit: 'pza', costPrice: 28.00, salePrice: 49.00, stock: 60, minStock: 10 },
    { sku: 'SG-001', barcode: '7501234567060', name: 'Guantes de seguridad talla L', categoryId: catSeguridad.id, unit: 'par', costPrice: 22.00, salePrice: 39.00, stock: 50, minStock: 10 },
    { sku: 'SG-002', barcode: '7501234567061', name: 'Gafas de seguridad transparentes', categoryId: catSeguridad.id, unit: 'pza', costPrice: 35.00, salePrice: 69.00, stock: 40, minStock: 8 },
  ];

  for (const producto of productos) {
    await prisma.product.upsert({
      where: { sku: producto.sku },
      update: {},
      create: producto
    });
  }
  console.log('✅ Productos creados:', productos.length);

  // Crear clientes de prueba
  const clientes = [
    { name: 'Cliente General', phone: null, email: null },
    { name: 'Juan García López', phone: '555-1234567', email: 'juan.garcia@email.com', address: 'Calle Principal 123' },
    { name: 'Construcciones MX S.A.', phone: '555-9876543', email: 'contacto@construccionesmx.com', address: 'Av. Industrial 456', rfc: 'CMX201015ABC' },
    { name: 'María Hernández', phone: '555-4567890', email: 'maria.h@email.com' },
  ];

  for (const cliente of clientes) {
    const existing = await prisma.customer.findFirst({ where: { name: cliente.name } });
    if (!existing) {
      await prisma.customer.create({ data: cliente });
    }
  }
  console.log('✅ Clientes creados:', clientes.length);

  // Crear cuentas por cobrar para algunos clientes
  const clienteConstrucciones = await prisma.customer.findFirst({ where: { name: 'Construcciones MX S.A.' } });
  if (clienteConstrucciones) {
    const cuentaExistente = await prisma.account.findFirst({ where: { customerId: clienteConstrucciones.id } });
    if (!cuentaExistente) {
      await prisma.account.create({
        data: {
          customerId: clienteConstrucciones.id,
          balance: 2500.00,
          creditLimit: 10000.00
        }
      });
      console.log('✅ Cuenta por cobrar creada para Construcciones MX');
    }
  }

  console.log('🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
