import { useState, useCallback } from 'react';
import api from '../api/axios';
import type { Table } from '../types';

export function useTableManager() {
  const [allTables, setAllTables] = useState<Table[]>([]);

  const fetchTables = useCallback(async () => {
    try {
      const response = await api.get<Table[]>('/admin/tables');
      setAllTables(response.data);
    } catch {
      // Retain previous data
    }
  }, []);

  const addTable = useCallback(async (numero: string) => {
    await api.post('/admin/tables', { numero });
    await fetchTables();
  }, [fetchTables]);

  const deleteTable = useCallback(async (id: number) => {
    await api.delete(`/admin/tables/${id}`);
    await fetchTables();
  }, [fetchTables]);

  return { allTables, fetchTables, addTable, deleteTable };
}
