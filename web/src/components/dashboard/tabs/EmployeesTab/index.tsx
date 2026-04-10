"use client";

import React, { useState, useEffect } from 'react';
import { Search, UserPlus, RefreshCw } from 'lucide-react';
import { Employee } from '@/types/employee.types';
import EmployeeList from '@/components/dashboard/tabs/EmployeesTab/EmployeeList';
import EmployeeModal from '@/components/dashboard/tabs/EmployeesTab/EmployeeModal';
import { SellerStockModal } from '@/components/dashboard/tabs/EmployeesTab/SellerStockModal';
import { Pagination } from '@/components/dashboard/shared/Pagination';

interface Props {
  serverUrl: string;
  tenantSlug: string;
}

export function EmployeesTab({ serverUrl, tenantSlug }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>();
  const [stockEmployee, setStockEmployee] = useState<Employee | null>(null);

  const fetchEmployees = async (page = 1) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        name: searchTerm,
      });
      const res = await fetch(`${serverUrl}/api/employees?${query.toString()}`, {
        headers: { 'x-tenant-slug': tenantSlug }
      });
      const data = await res.json();
      setEmployees(data.items || []);
      setPagination(data.pagination || { page: 1, total: 0, pages: 1 });
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees(pagination.page);
  }, [tenantSlug, pagination.page, searchTerm]);

  const filteredEmployees = employees.filter(emp =>
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.appCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (employee?: Employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await fetch(`${serverUrl}/api/employees/${id}/toggle-status`, {
        method: 'POST',
        headers: { 'x-tenant-slug': tenantSlug }
      });
      fetchEmployees(pagination.page);
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleOpenStockModal = (employee: Employee) => {
    setStockEmployee(employee);
    setIsStockModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Funcionários</h1>
          <p className="text-zinc-400 mt-1">Gerencie os vendedores e suas rotas de acesso.</p>
        </div>
        
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/20 active:scale-95 whitespace-nowrap"
        >
          <UserPlus size={20} />
          Novo Funcionário
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome ou código app..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
          />
        </div>
        <button 
          onClick={() => fetchEmployees()}
          className="bg-zinc-900/50 border border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl px-4 flex items-center justify-center gap-2 transition-all"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      <EmployeeList 
        employees={employees}
        loading={loading}
        onEdit={handleOpenModal}
        onToggleStatus={handleToggleStatus}
        onViewStock={handleOpenStockModal}
      />

      {pagination.pages > 1 && (
        <Pagination 
          currentPage={pagination.page}
          totalPages={pagination.pages}
          onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))}
        />
      )}

      {isModalOpen && (
        <EmployeeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchEmployees();
          }}
          employee={selectedEmployee}
          serverUrl={serverUrl}
          tenantSlug={tenantSlug}
        />
      )}

      {isStockModalOpen && (
        <SellerStockModal
          isOpen={isStockModalOpen}
          onClose={() => setIsStockModalOpen(false)}
          employee={stockEmployee}
          serverUrl={serverUrl}
          tenantSlug={tenantSlug}
        />
      )}
    </div>
  );
}
