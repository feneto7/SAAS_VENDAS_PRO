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
    <div className="nm-flex-col nm-gap-lg nm-animate-fade-in">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 className="nm-heading" style={{ fontSize: "var(--nm-text-2xl)" }}>Funcionários</h1>
          <p className="nm-caption" style={{ marginTop: "0.25rem" }}>Gerencie os vendedores e suas rotas de acesso.</p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="nm-btn nm-btn--accent nm-btn--sm"
        >
          <UserPlus size={16} />
          Novo Funcionário
        </button>
      </div>

      {/* Filtros */}
      <div className="nm-card nm-card--sm" style={{ zIndex: 20, marginBottom: 0, overflow: "visible", padding: "1rem" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingBottom: "0.4rem", marginRight: "0.5rem" }}>
            <div className="nm-icon-circle nm-icon-circle--sm" style={{ color: "var(--nm-accent)" }}>
              <Search size={14} />
            </div>
            <span style={{ fontSize: "var(--nm-text-sm)", fontWeight: 600, color: "var(--nm-text-primary)" }}>Filtros</span>
          </div>

          <div className="nm-input-group" style={{ flex: 1, minWidth: "250px" }}>
            <label className="nm-input-group__label">Busca Geral</label>
            <input
              type="text"
              placeholder="Buscar por nome ou código app..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="nm-input"
              style={{ padding: "0.4rem 0.75rem", fontSize: "var(--nm-text-sm)" }}
            />
          </div>

          <button
            onClick={() => fetchEmployees()}
            className="nm-btn nm-btn--flat nm-btn--xs"
            style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.4rem 0.75rem", height: "34px", flexShrink: 0 }}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>
      </div>

      <EmployeeList
        employees={filteredEmployees}
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
