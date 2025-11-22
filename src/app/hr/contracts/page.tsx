'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import Badge from "@/components/common/Badge";

interface Contract {
  id: string;
  contractNo: string;
  facultyName: string;
  email: string;
  phone?: string;
  college: string;
  jobTitle: string;
  position: string;
  employmentType: string;
  ratePerHour: number;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
}

export default function ContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Check authentication
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/');
      return;
    }
    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/');
    }
  }, [router]);

  // Fetch contracts
  useEffect(() => {
    const fetchContracts = async () => {
      if (!user) return;

      try {
        const response = await fetch('/api/contracts');
        if (!response.ok) {
          throw new Error('Failed to fetch contracts');
        }

        const data = await response.json();
        const contractsList = Array.isArray(data) ? data : data.data || [];
        
        // Update contract status based on end date
        const updatedContracts = contractsList.map((contract: Contract) => {
          const endDate = new Date(contract.endDate);
          const today = new Date();
          const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          if (endDate < today && contract.status === 'Active') {
            return { ...contract, status: 'Expired' };
          } else if (daysUntilExpiry <= 90 && daysUntilExpiry > 0 && contract.status === 'Active') {
            return { ...contract, status: 'Pending Renewal' };
          }
          return contract;
        });

        setContracts(updatedContracts);
      } catch (error: any) {
        console.error('Error fetching contracts:', error);
        alert('Failed to load contracts: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchContracts();
    }
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contract?')) {
      return;
    }

    try {
      const response = await fetch(`/api/contracts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete contract');
      }

      setContracts(prev => prev.filter(c => c.id !== id));
      alert('Contract deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting contract:', error);
      alert('Failed to delete contract: ' + error.message);
    }
  };

  const activeContracts = contracts.filter(c => c.status === 'Active').length;
  const expiredContracts = contracts.filter(c => c.status === 'Expired').length;
  const pendingRenewals = contracts.filter(c => c.status === 'Pending Renewal').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading contracts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Contracts" subtitle="Manage faculty contracts" />
      
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Active Contracts" value={activeContracts} sub="Currently active" />
        <StatCard title="Expired Contracts" value={expiredContracts} sub="Requires attention" />
        <StatCard title="Pending Renewals" value={pendingRenewals} sub="Up for renewal" />
      </div>

      <div className="rounded-xl border bg-white overflow-hidden mt-2">
        {contracts.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p>No contracts found</p>
            <p className="text-sm mt-2">Contracts will appear here after approving applicants in the Contract Queue</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3">Contract No</th>
                <th>Faculty Name</th>
                <th>College</th>
                <th>Job Title</th>
                <th>Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Rate/hr</th>
                <th>Status</th>
                <th className="w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map(contract => (
                <tr key={contract.id} className="border-t">
                  <td className="p-3">{contract.contractNo}</td>
                  <td>{contract.facultyName}</td>
                  <td><Badge tone="gray">{contract.college}</Badge></td>
                  <td>{contract.jobTitle}</td>
                  <td>{contract.employmentType}</td>
                  <td>{new Date(contract.startDate).toLocaleDateString()}</td>
                  <td>{new Date(contract.endDate).toLocaleDateString()}</td>
                  <td>₱{contract.ratePerHour.toFixed(2)}</td>
                  <td>
                    {contract.status === "Active" && <Badge tone="green">Active</Badge>}
                    {contract.status === "Expired" && <Badge tone="red">Expired</Badge>}
                    {contract.status === "Pending Renewal" && <Badge tone="yellow">Pending Renewal</Badge>}
                  </td>
                  <td className="pr-3 text-right space-x-2">
                    <button 
                      className="rounded-md border px-2 py-1"
                      onClick={() => alert(`Edit contract ${contract.contractNo}`)}
                    >
                      ✏️
                    </button>
                    <button 
                      className="rounded-md border px-2 py-1"
                      onClick={() => handleDelete(contract.id)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}