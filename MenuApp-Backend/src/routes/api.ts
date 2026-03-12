import { Router } from 'express';
import { login } from '../controllers/authController';
import { getMenuBySlug, placeOrder } from '../controllers/menuController';
import { getOrders, updateOrderStatus, updateOrderPaymentStatus, getCategories, createProduct, getLocalSettings, updateLocalSettings } from '../controllers/adminController';
import { getTables, createTable, deleteTable } from '../controllers/tableController';
import { createPreference, webhook } from '../controllers/paymentController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/auth/login', login);
router.get('/menu/:slug', getMenuBySlug);
router.post('/orders', placeOrder);

// Admin routes (Protected)
router.get('/admin/orders', authenticateToken, getOrders);
router.put('/admin/orders/:id/status', authenticateToken, updateOrderStatus);
router.put('/admin/orders/:id/payment', authenticateToken, updateOrderPaymentStatus);
router.get('/admin/categories', authenticateToken, getCategories);
router.post('/admin/products', authenticateToken, createProduct);

// Table management
router.get('/admin/tables', authenticateToken, getTables);
router.post('/admin/tables', authenticateToken, createTable);
router.delete('/admin/tables/:id', authenticateToken, deleteTable);

// Local settings
router.get('/admin/local', authenticateToken, getLocalSettings);
router.put('/admin/local', authenticateToken, updateLocalSettings);

// Payment routes
router.post('/payment/create-preference', createPreference);
router.post('/payment/webhook', webhook);

export default router;
