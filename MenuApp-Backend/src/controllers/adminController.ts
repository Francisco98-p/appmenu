import { Request, Response } from 'express';
import { prisma } from '../index';

export const getOrders = async (req: Request, res: Response) => {
  const localId = (req as any).user.localId;

  try {
    const orders = await prisma.order.findMany({
      where: { localId },
      include: {
        items: {
          include: { producto: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders' });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { estado } = req.body;

  try {
    const order = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { estado }
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error updating order status' });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  const localId = (req as any).user.localId;
  try {
    const categories = await prisma.category.findMany({
      where: { localId },
      orderBy: { orden: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  const { categoryId, nombre, descripcion, precio, imagen } = req.body;
  try {
    const product = await prisma.product.create({
      data: { categoryId, nombre, descripcion, precio, imagen }
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error creating product' });
  }
};
export const updateOrderPaymentStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { pagoConfirmado } = req.body;

  try {
    const order = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { pagoConfirmado }
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error updating payment status' });
  }
};

export const getLocalSettings = async (req: Request, res: Response) => {
  const localId = (req as any).user.localId;
  
  try {
    const local = await prisma.local.findUnique({
      where: { id: localId },
      select: {
        nombre: true,
        logo: true,
        slug: true,
        cbuAlias: true,
        mercadoPagoLink: true
      }
    });
    res.json(local);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching local settings' });
  }
};

export const updateLocalSettings = async (req: Request, res: Response) => {
  const localId = (req as any).user.localId;
  const { nombre, logo, cbuAlias, mercadoPagoLink } = req.body;
  
  try {
    const local = await prisma.local.update({
      where: { id: localId },
      data: { nombre, logo, cbuAlias, mercadoPagoLink }
    });
    res.json(local);
  } catch (error) {
    res.status(500).json({ message: 'Error updating local settings' });
  }
};
