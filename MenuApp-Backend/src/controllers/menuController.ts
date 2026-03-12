import { Request, Response } from 'express';
import { prisma, io } from '../index';

export const getMenuBySlug = async (req: Request, res: Response) => {
  const { slug } = req.params;

  try {
    const local = await prisma.local.findUnique({
      where: { slug },
      include: {
        categorias: {
          orderBy: { orden: 'asc' },
          include: {
            productos: {
              where: { activo: true }
            }
          }
        },
        mesas: true
      }
    });

    if (!local) {
      return res.status(404).json({ message: 'Local not found' });
    }

    res.json(local);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const placeOrder = async (req: Request, res: Response) => {
  const { localId, mesa, metodoPago, items, total } = req.body;

  console.log('Order request:', { localId, mesa, metodoPago, total, items });

  try {
    // Verify local exists
    const local = await prisma.local.findUnique({ where: { id: localId } });
    if (!local) {
      return res.status(400).json({ message: 'Local not found', localId });
    }

    // Verify products exist
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        return res.status(400).json({ message: 'Product not found', productId: item.productId });
      }
    }

    const order = await prisma.order.create({
      data: {
        localId,
        mesa,
        metodoPago,
        total,
        estado: 'Recibido',
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            aclaracion: item.aclaracion
          }))
        }
      },
      include: { items: true }
    });

    // Notify administrators in real-time
    io.emit('newOrder', order);

    res.status(201).json(order);
  } catch (error: any) {
    console.error('Error placing order:', error);
    res.status(500).json({ message: 'Error placing order', error: error.message });
  }
};
