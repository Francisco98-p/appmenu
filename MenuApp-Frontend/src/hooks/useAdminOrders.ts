import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import api from '../api/axios';
import type { Order } from '../types';

export function useAdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const socketConnected = useRef(false);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await api.get<Order[]>('/admin/orders');
      setOrders(response.data.filter((o) => o.estado !== 'Cobrado'));
    } catch {
      // Silently retain previous data on fetch error
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = useCallback(async (orderId: number, nextStatus: string) => {
    await api.put(`/admin/orders/${orderId}/status`, { estado: nextStatus });
    await fetchOrders();
  }, [fetchOrders]);

  const togglePayment = useCallback(async (orderId: number, currentStatus: boolean) => {
    await api.put(`/admin/orders/${orderId}/payment`, { pagoConfirmado: !currentStatus });
    await fetchOrders();
  }, [fetchOrders]);

  const closeTable = useCallback(async (_tableMesa: string, tableOrders: Order[]) => {
    await Promise.all(
      tableOrders.map((o) => api.put(`/admin/orders/${o.id}/status`, { estado: 'Cobrado' }))
    );
    await fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchOrders();

    const socket: Socket = io(window.location.origin, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => { socketConnected.current = true; });
    socket.on('disconnect', () => { socketConnected.current = false; });
    socket.on('newOrder', (order: Order) => {
      setOrders((prev) => [order, ...prev]);
    });

    const interval = setInterval(() => {
      if (!socketConnected.current) fetchOrders();
    }, 30000);

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [fetchOrders]);

  return { orders, loading, fetchOrders, updateStatus, togglePayment, closeTable };
}
