'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface CustomerFilterProps {
  customers: Array<{ cust_id: number; cust_name: string | null }>;
  currentCustomer?: number;
}

export function CustomerFilter({ customers, currentCustomer }: CustomerFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('customer', value);
    } else {
      params.delete('customer');
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex gap-2 items-center">
      <label htmlFor="customer-filter" className="text-sm font-medium text-gray-700">
        Cliente:
      </label>
      <select
        id="customer-filter"
        value={currentCustomer || ''}
        onChange={(e) => handleChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
      >
        <option value="">Tutti i clienti</option>
        {customers.map((customer) => (
          <option key={customer.cust_id} value={customer.cust_id}>
            {customer.cust_name}
          </option>
        ))}
      </select>
    </div>
  );
}
