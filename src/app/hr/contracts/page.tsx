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
  const [filterStatus, setFilterStatus] = useState<string>('all');

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
          today.setHours(0, 0, 0, 0); // Reset time for accurate comparison
          const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          let status = contract.status || 'Active';

          // Convert APPROVED status to Active (legacy status from Contract Queue)
          if (status === 'APPROVED' || status === 'Approved') {
            status = 'Active';
          }

          // Auto-update status based on dates
          if (endDate < today) {
            status = 'Expired';
          } else if (daysUntilExpiry <= 90 && daysUntilExpiry > 0 && status === 'Active') {
            status = 'Pending Renewal';
          } else if (status !== 'Expired' && status !== 'Pending Renewal' && status !== 'Terminated') {
            // If status is anything other than these specific statuses, set to Active
            status = 'Active';
          }

          return { ...contract, status };
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

  const handleEdit = (contract: Contract) => {
    // Navigate to edit page with contract data
    router.push(`/hr/contracts/edit/${contract.id}`);
  };

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

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    
    if (statusLower === 'active') {
      return <Badge tone="green">Active</Badge>;
    } else if (statusLower === 'expired') {
      return <Badge tone="red">Expired</Badge>;
    } else if (statusLower === 'pending renewal') {
      return <Badge tone="yellow">Pending Renewal</Badge>;
    } else if (statusLower === 'terminated') {
      return <Badge tone="red">Terminated</Badge>;
    } else {
      // For any other status (like APPROVED, Pending, etc.), show as Active
      return <Badge tone="green">Active</Badge>;
    }
  };

  const activeContracts = contracts.filter(c => c.status === 'Active').length;
  const expiredContracts = contracts.filter(c => c.status === 'Expired').length;
  const pendingRenewals = contracts.filter(c => c.status === 'Pending Renewal').length;

  // Filter contracts based on selected filter
  const filteredContracts = filterStatus === 'all' 
    ? contracts 
    : contracts.filter(c => c.status.toLowerCase() === filterStatus.toLowerCase());

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
        <StatCard title="Active Contracts" value={activeContracts} />
        <StatCard title="Expired Contracts" value={expiredContracts} />
        <StatCard title="Pending Renewals" value={pendingRenewals} />
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2 items-center">
        <span className="text-sm font-medium text-gray-700">Filter by status:</span>
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === 'all'
              ? 'bg-teal-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({contracts.length})
        </button>
        <button
          onClick={() => setFilterStatus('active')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === 'active'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Active ({activeContracts})
        </button>
        <button
          onClick={() => setFilterStatus('pending renewal')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === 'pending renewal'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Pending Renewal ({pendingRenewals})
        </button>
        <button
          onClick={() => setFilterStatus('expired')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === 'expired'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Expired ({expiredContracts})
        </button>
      </div>

      <div className="rounded-xl border bg-white overflow-hidden mt-2">
        {filteredContracts.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p>No contracts found</p>
            {filterStatus !== 'all' ? (
              <p className="text-sm mt-2">No contracts with status "{filterStatus}"</p>
            ) : (
              <p className="text-sm mt-2">Contracts will appear here after approving applicants in the Contract Queue</p>
            )}
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
              {filteredContracts.map(contract => (
                <tr key={contract.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{contract.contractNo}</td>
                  <td>{contract.facultyName}</td>
                  <td><Badge tone="gray">{contract.college}</Badge></td>
                  <td>{contract.jobTitle}</td>
                  <td>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      contract.employmentType === 'Full-time' ? 'bg-blue-100 text-blue-800' :
                      contract.employmentType === 'Part-time' ? 'bg-purple-100 text-purple-800' :
                      contract.employmentType === 'Contractual' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {contract.employmentType || 'N/A'}
                    </span>
                  </td>
                  <td>{new Date(contract.startDate).toLocaleDateString()}</td>
                  <td>{new Date(contract.endDate).toLocaleDateString()}</td>
                  <td>₱{contract.ratePerHour.toFixed(2)}</td>
                  <td>
                    {getStatusBadge(contract.status)}
                  </td>
                  <td className="pr-3 text-right space-x-2">
                    <button 
                      className="rounded-md border border-gray-300 px-2 py-1 hover:bg-gray-100 transition-colors"
                      onClick={() => handleEdit(contract)}
                      title="Edit contract"
                    >
                      ✏️
                    </button>
                    <button 
                      className="rounded-md border border-red-300 px-2 py-1 hover:bg-red-50 transition-colors"
                      onClick={() => handleDelete(contract.id)}
                      title="Delete contract"
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