import React from 'react';

const statusConfig = {
  PENDING: { color: 'bg-yellow-100 text-yellow-800', label: 'En attente' },
  ACCEPTED: { color: 'bg-green-100 text-green-800', label: 'Accepté' },
  REFUSED: { color: 'bg-red-100 text-red-800', label: 'Refusé' },
  CONTACTED: { color: 'bg-blue-100 text-blue-800', label: 'Contact établi' },
  PREPARING: { color: 'bg-purple-100 text-purple-800', label: 'En préparation' },
  SHIPPED: { color: 'bg-indigo-100 text-indigo-800', label: 'Expédié' },
  DELIVERED: { color: 'bg-emerald-100 text-emerald-800', label: 'Livré' }
};

export default function OrderStatusBadge({ status, size = 'md' }) {
  const config = statusConfig[status] || statusConfig.PENDING;
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${config.color} ${sizeClasses[size]}`}>
      {config.label}
    </span>
  );
}