import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.table.deleteMany();
  await prisma.local.deleteMany();

  // Create Local
  const local = await prisma.local.create({
    data: {
      nombre: 'San Juan Gourmet',
      slug: 'sanjuan-gourmet',
      logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=200&h=200',
    },
  });

  // Create Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      email: 'admin@menuapp.com',
      password: hashedPassword,
      rol: 'owner',
      localId: local.id,
    },
  });

  // Create Categories
  const catBeer = await prisma.category.create({
    data: {
      nombre: 'Cervezas',
      orden: 1,
      localId: local.id,
    },
  });

  const catTapas = await prisma.category.create({
    data: {
      nombre: 'Tapas',
      orden: 2,
      localId: local.id,
    },
  });

  const catPizzas = await prisma.category.create({
    data: {
      nombre: 'Pizzas',
      orden: 3,
      localId: local.id,
    },
  });

  // Create Tables
  await prisma.table.createMany({
    data: [
      { numero: '1', localId: local.id },
      { numero: '2', localId: local.id },
      { numero: '3', localId: local.id },
      { numero: '4', localId: local.id },
      { numero: '5', localId: local.id },
      { numero: '6', localId: local.id },
    ],
  });

  // Create Products
  await prisma.product.createMany({
    data: [
      {
        categoryId: catBeer.id,
        nombre: 'IPA Artesanal',
        descripcion: 'Cerveza intensa con notas cítricas y amargor equilibrado.',
        precio: 1200,
        imagen: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&q=80&w=600',
      },
      {
        categoryId: catBeer.id,
        nombre: 'Honey Beer',
        descripcion: 'Cerveza suave con un toque dulce de miel natural.',
        precio: 1100,
        imagen: 'https://images.unsplash.com/photo-1584225064785-c62a8b43d148?auto=format&fit=crop&q=80&w=600',
      },
      {
        categoryId: catTapas.id,
        nombre: 'Papas Bravas',
        descripcion: 'Papas rústicas con salsa picante de la casa y alioli.',
        precio: 1500,
        imagen: 'https://images.unsplash.com/photo-1573225342350-16731dd9bf3d?auto=format&fit=crop&q=80&w=600',
      },
      {
        categoryId: catPizzas.id,
        nombre: 'Pizza Margherita',
        descripcion: 'Mozzarella, tomate natural, albahaca fresca y aceite de oliva.',
        precio: 3500,
        imagen: 'https://images.unsplash.com/photo-1574071318508-1cdbad80ad38?auto=format&fit=crop&q=80&w=600',
      },
    ],
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
