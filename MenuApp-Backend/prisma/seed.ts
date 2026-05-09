import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpiando base de datos para Chilli Garden...');
  
  // Limpiar datos antiguos en orden jerárquico correcto
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.kitchen.deleteMany();
  await prisma.category.deleteMany();
  await prisma.table.deleteMany();
  await prisma.user.deleteMany();
  await prisma.local.deleteMany();

  console.log('🏗️ Creando Local: Chilli Garden...');
  const local = await prisma.local.create({
    data: {
      nombre: 'Chilli Garden',
      slug: 'chilligarden',
      logo: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200&h=200',
      mercadoPagoLink: 'https://link.mercadopago.com.ar/chilligarden',
      cbuAlias: 'CHILLI.GARDEN.PAY',
      horarioApertura: '18:00',
      horarioCierre: '00:00',
    },
  });

  console.log('👤 Creando Administrador...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      email: 'admin@menuapp.com',
      password: hashedPassword,
      rol: 'owner',
      localId: local.id,
    },
  });

  console.log('🪑 Creando Mesas...');
  await prisma.table.createMany({
    data: [
      { numero: '1', localId: local.id },
      { numero: '2', localId: local.id },
      { numero: '3', localId: local.id },
      { numero: '4', localId: local.id },
      { numero: 'Vip 1', localId: local.id },
      { numero: 'Barra', localId: local.id },
    ],
  });

  console.log('📂 Creando Categorías y Productos...');

  // 1. Entrada
  const catEntrada = await prisma.category.create({
    data: { nombre: 'Entradas', orden: 1, localId: local.id },
  });
  await prisma.product.createMany({
    data: [
      { categoryId: catEntrada.id, nombre: 'Papas Fritas', descripcion: 'Porción clásica de papas fritas.', precio: 7500, imagen: '/images/chilligarden/img19.jpeg' },
      { categoryId: catEntrada.id, nombre: 'Papas Chilli', descripcion: 'Papas Fritas con Huevo.', precio: 8000, imagen: '/images/chilligarden/img5.jpeg' },
      { categoryId: catEntrada.id, nombre: 'Papas Cheddar y Panceta', descripcion: 'Papas Fritas con Cheddar, Panceta y verdeo.', precio: 9000, imagen: '/images/chilligarden/img8.jpeg' },
    ],
  });

  // 2. Lomos
  const catLomos = await prisma.category.create({
    data: { nombre: 'Lomos Especiales', orden: 2, localId: local.id },
  });
  await prisma.product.createMany({
    data: [
      { categoryId: catLomos.id, nombre: 'Lomo Especial', descripcion: 'Carne de lomo, jamón, queso tybo, huevo, tomate, lechuga y salsa casera.', precio: 22000, imagen: '/images/chilligarden/img4.jpeg' },
      { categoryId: catLomos.id, nombre: 'Lomo Provolone', descripcion: 'Carne de lomo, queso provolone, rúcula, cebolla caramelizada y salsa casera.', precio: 23000, imagen: '/images/chilligarden/img7.jpeg' },
      { categoryId: catLomos.id, nombre: 'Medio Lomo Especial', descripcion: 'Media porción del lomo especial completo.', precio: 16000, imagen: '/images/chilligarden/img9.jpeg' },
    ],
  });

  // 3. Burgers
  const catBurgers = await prisma.category.create({
    data: { nombre: 'Burgers Smash', orden: 3, localId: local.id },
  });
  await prisma.product.createMany({
    data: [
      { categoryId: catBurgers.id, nombre: 'Burger Cheese', descripcion: 'Pan de papa, carne smash, queso cheddar y ketchup.', precio: 13000, imagen: '/images/chilligarden/img1.jpeg' },
      { categoryId: catBurgers.id, nombre: 'Burger Americana', descripcion: 'Pan de papa, carne smash, queso cheddar, cebolla, panceta y ketchup.', precio: 13000, imagen: '/images/chilligarden/img16.jpeg' },
      { categoryId: catBurgers.id, nombre: 'Burger Chilli', descripcion: 'Pan de papa, carne smash, queso provolone y guacamole picante.', precio: 13000, imagen: '/images/chilligarden/img2.jpeg' },
      { categoryId: catBurgers.id, nombre: 'Burger Americana Doble', descripcion: 'Doble carne smash, cheddar, cebolla, panceta y ketchup.', precio: 15400, imagen: '/images/chilligarden/img17.jpeg' },
    ],
  });

  // 4. Ensaladas
  const catEnsaladas = await prisma.category.create({
    data: { nombre: 'Ensaladas', orden: 4, localId: local.id },
  });
  await prisma.product.createMany({
    data: [
      { categoryId: catEnsaladas.id, nombre: 'Ensalada Rústica', descripcion: 'Rúcula, lechuga, cherry, palta, queso provolone, crutones y mix de semillas.', precio: 12000, imagen: '/images/chilligarden/img12.jpeg' },
      { categoryId: catEnsaladas.id, nombre: 'Ensalada Cheta', descripcion: 'Rúcula, zanahoria, repollo morado, pollo en tiras y mix de semillas.', precio: 12000, imagen: '/images/chilligarden/img10.jpeg' },
    ],
  });

  // 5. Bebidas
  const catBebidas = await prisma.category.create({
    data: { nombre: 'Bebidas y Combos', orden: 5, localId: local.id },
  });
  await prisma.product.createMany({
    data: [
      { categoryId: catBebidas.id, nombre: 'Gaseosa 500cc', descripcion: 'Coca / Sprite / Aquarius.', precio: 4000, imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=600' },
      { categoryId: catBebidas.id, nombre: 'Cerveza Corona 710cc', descripcion: 'Envase grande helado.', precio: 8000, imagen: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?q=80&w=600' },
      { categoryId: catBebidas.id, nombre: 'Combo Branca', descripcion: 'Botella de Fernet + 2 cocas de vidrio 1,25Lt.', precio: 40000, imagen: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=600' },
    ],
  });

  console.log('✅ Base de datos de Chilli Garden lista.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
