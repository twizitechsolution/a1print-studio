import React from 'react';
import { Order } from '../types';
import { useCartStore } from '../store/useCartStore';
import { AdminOrderList } from '../components/admin/AdminOrderList';

interface AdminPageProps {
  orders: Order[];
}

export const AdminPage: React.FC<AdminPageProps> = ({ orders }) => {
  const { updateOrderStatus, updatePaymentStatus, updateOrderAdminRemark, recordOrderAction } = useCartStore();

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <AdminOrderList
        orders={orders}
        onUpdateOrderStatus={updateOrderStatus}
        onUpdatePaymentStatus={updatePaymentStatus}
        onUpdateAdminRemark={updateOrderAdminRemark}
        onRecordOrderAction={recordOrderAction}
      />
    </div>
  );
};
