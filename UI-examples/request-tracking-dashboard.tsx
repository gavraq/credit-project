import React, { useState } from 'react';
import { Search, Filter, Eye, Edit, Plus, Bell, User, ChevronDown, ArrowDown, ArrowUp } from 'lucide-react';

const CreditRiskDashboard = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [sortField, setSortField] = useState('submittedDate');
  const [sortDirection, setSortDirection] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Brand colors
  const colors = {
    icbcRed: '#e31937',
    standardBankBlue: '#0c4da2',
    redLight: '#fde8eb',
    blueLight: '#e6edf7',
    neutral100: '#FFFFFF',
    neutral200: '#F5F7FA',
    neutral300: '#E4E7EB',
    neutral400: '#CBD2D9',
    neutral500: '#9AA5B1',
    neutral600: '#7B8794',
    neutral700: '#4A5568',
    neutral800: '#323F4B',
    neutral900: '#1F2933',
    success: '#38B2AC',
    warning: '#F6AD55',
    error: '#E53E3E'
  };

  // Mock credit requests data
  const creditRequests = [
    {
      id: 'CR-2025-0124',
      title: 'ABC Corporation - Limit Increase',
      counterparty: 'ABC Corporation',
      status: 'pending',
      submittedBy: 'Michael Chen',
      rank: 1,
      priority: 'High',
      submittedDate: '2025-05-10',
      requiredByDate: '2025-05-15'
    },
    {
      id: 'CR-2025-0123',
      title: 'XYZ Holdings - New Facility',
      counterparty: 'XYZ Holdings Ltd.',
      status: 'in-progress',
      submittedBy: 'Sarah Johnson',
      rank: 2,
      priority: 'High',
      submittedDate: '2025-05-09',
      requiredByDate: '2025-05-20'
    },
    {
      id: 'CR-2025-0122',
      title: 'Global Trading - Annual Review',
      counterparty: 'Global Trading Co.',
      status: 'in-progress',
      submittedBy: 'David Wilson',
      rank: 1,
      priority: 'Medium',
      submittedDate: '2025-05-08',
      requiredByDate: '2025-05-25'
    },
    {
      id: 'CR-2025-0121',
      title: 'Eastern Investments - New Client',
      counterparty: 'Eastern Investments',
      status: 'pending',
      submittedBy: 'Jennifer Lee',
      rank: 3,
      priority: 'Medium',
      submittedDate: '2025-05-07',
      requiredByDate: '2025-05-30'
    },
    {
      id: 'CR-2025-0120',
      title: 'Westcoast Manufacturing - Limit Extension',
      counterparty: 'Westcoast Manufacturing Inc.',
      status: 'approved',
      submittedBy: 'Robert Taylor',
      rank: 1,
      priority: 'Low',
      submittedDate: '2025-05-05',
      requiredByDate: '2025-05-12'
    },
    {
      id: 'CR-2025-0119',
      title: 'Northern Resources - Annual Review',
      counterparty: 'Northern Resources Ltd.',
      status: 'approved',
      submittedBy: 'Emma Davis',
      rank: 2,
      priority: 'Low',
      submittedDate: '2025-05-03',
      requiredByDate: '2025-05-10'
    },
    {
      id: 'CR-2025-0118',
      title: 'Southern Telecom - New Facility',
      counterparty: 'Southern Telecom Corp.',
      status: 'rejected',
      submittedBy: 'Michael Chen',
      rank: 1,
      priority: 'Medium',
      submittedDate: '2025-05-01',
      requiredByDate: '2025-05-08'
    },
    {
      id: 'CR-2025-0117',
      title: 'Metro Banks - Credit Line Renewal',
      counterparty: 'Metro Banks Inc.',
      status: 'draft',
      submittedBy: 'Michael Chen',
      rank: 2,
      priority: 'Low',
      submittedDate: '2025-05-01',
      requiredByDate: '2025-06-01'
    }
  ];

  // Calculate counts for summary cards
  const counts = {
    draft: creditRequests.filter(r => r.status === 'draft').length,
    pending: creditRequests.filter(r => r.status === 'pending').length,
    inProgress: creditRequests.filter(r => r.status === 'in-progress').length,
    approved: creditRequests.filter(r => r.status === 'approved').length,
    rejected: creditRequests.filter(r => r.status === 'rejected').length,
    overdue: creditRequests.filter(r => new Date(r.requiredByDate) < new Date() && r.status !== 'approved' && r.status !== 'rejected').length
  };

  // Status chip component
  const StatusChip = ({ status }) => {
    let color, bgColor, label;
    
    switch(status) {
      case 'approved':
        color = '#065f46';
        bgColor = '#d1fae5';
        label = 'Approved';
        break;
      case 'in-progress':
        color = '#1e40af';
        bgColor = '#dbeafe';
        label = 'In Progress';
        break;
      case 'pending':
        color = '#92400e';
        bgColor = '#fef3c7';
        label = 'Pending';
        break;
      case 'rejected':
        color = '#b91c1c';
        bgColor = '#fee2e2';
        label = 'Rejected';
        break;
      case 'draft':
        color = '#1f2937';
        bgColor = '#f3f4f6';
        label = 'Draft';
        break;
      default:
        color = '#1f2937';
        bgColor = '#f3f4f6';
        label = status || 'Unknown';
    }
    
    return (
      <div 
        className="px-2.5 py-0.5 rounded-full text-xs font-medium inline-block"
        style={{ backgroundColor: bgColor, color: color }}
      >
        {label}
      </div>
    );
  };

  // Priority chip component
  const PriorityChip = ({ priority }) => {
    let color, bgColor;
    
    switch(priority.toLowerCase()) {
      case 'high':
        color = '#b91c1c';
        bgColor = '#fee2e2';
        break;
      case 'medium':
        color = '#92400e';
        bgColor = '#fef3c7';
        break;
      case 'low':
        color = '#065f46';
        bgColor = '#d1fae5';
        break;
      default:
        color = '#1f2937';
        bgColor = '#f3f4f6';
    }
    
    return (
      <div 
        className="px-2.5 py-0.5 rounded-full text-xs font-medium inline-block"
        style={{ backgroundColor: bgColor, color: color }}
      >
        {priority}
      </div>
    );
  };

  // Summary card component
  const SummaryCard = ({ count, label, bgColor, textColor, onClick }) => {
    return (
      <div 
        className="p-4 rounded-lg cursor-pointer transition-all hover:shadow-md"
        style={{ backgroundColor: bgColor }}
        onClick={onClick}
      >
        <p 
          className="text-3xl font-bold mb-1"
          style={{ color: textColor }}
        >
          {count}
        </p>
        <p 
          className="text-sm font-medium"
          style={{ color: textColor ? `${textColor}99` : colors.neutral600 }}
        >
          {label}
        </p>
      </div>
    );
  };

  // Current user
  const currentUser = 'Michael Chen';

  // Filter requests based on active tab and filters
  const filteredRequests = creditRequests.filter(request => {
    // Filter by tab
    if (activeTab === 'my' && request.submittedBy !== currentUser) {
      return false;
    }

    // Filter by status
    if (statusFilter && request.status !== statusFilter) {
      return false;
    }

    // Filter by priority
    if (priorityFilter && request.priority.toLowerCase() !== priorityFilter.toLowerCase()) {
      return false;
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        request.id.toLowerCase().includes(query) ||
        request.title.toLowerCase().includes(query) ||
        request.counterparty.toLowerCase().includes(query) ||
        request.submittedBy.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Sort requests
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    let valueA = a[sortField];
    let valueB = b[sortField];
    
    if (typeof valueA === 'string') {
      valueA = valueA.toLowerCase();
      valueB = valueB.toLowerCase();
    }
    
    if (valueA < valueB) {
      return sortDirection === 'asc' ? -1 : 1;
    }
    if (valueA > valueB) {
      return sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Handle sort click
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Render sort icon
  const renderSortIcon = (field) => {
    if (field !== sortField) return null;
    
    return sortDirection === 'asc' ? (
      <ArrowUp size={14} className="inline ml-1" />
    ) : (
      <ArrowDown size={14} className="inline ml-1" />
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center mr-6">
                <div className="flex items-center space-x-1 mr-4">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span className="font-bold text-xl">CreditFlow</span>
              </div>
              
              <div className="ml-10 flex items-center space-x-4">
                <a href="#" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                  Dashboard
                </a>
                <a href="#" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                  Credit Requests
                </a>
                <a href="#" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                  Reviews
                </a>
                <a href="#" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                  Analytics
                </a>
              </div>
            </div>
            
            <div className="flex items-center">
              <button className="p-1 rounded-full hover:bg-blue-700 relative">
                <Bell size={20} />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-blue-800"></span>
              </button>
              
              <div className="ml-4 flex items-center">
                <button className="flex items-center text-sm font-medium">
                  <User size={18} className="mr-1" />
                  {currentUser}
                  <ChevronDown size={16} className="ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header with title and action button */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Credit Request Dashboard</h1>
          
          <button className="px-4 py-2 rounded bg-red-600 text-white font-medium flex items-center hover:bg-red-700">
            <Plus size={18} className="mr-2" />
            New Request
          </button>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <SummaryCard
            count={counts.pending}
            label="Pending"
            bgColor={colors.blueLight}
            textColor={colors.standardBankBlue}
            onClick={() => setStatusFilter('pending')}
          />
          <SummaryCard
            count={counts.inProgress}
            label="In Progress"
            bgColor="#dbeafe"
            textColor="#1e40af"
            onClick={() => setStatusFilter('in-progress')}
          />
          <SummaryCard
            count={counts.approved}
            label="Approved"
            bgColor="#d1fae5"
            textColor="#065f46"
            onClick={() => setStatusFilter('approved')}
          />
          <SummaryCard
            count={counts.rejected}
            label="Rejected"
            bgColor="#fee2e2"
            textColor="#b91c1c"
            onClick={() => setStatusFilter('rejected')}
          />
          <SummaryCard
            count={counts.draft}
            label="Draft"
            bgColor={colors.neutral200}
            textColor={colors.neutral800}
            onClick={() => setStatusFilter('draft')}
          />
          <SummaryCard
            count={counts.overdue}
            label="Overdue"
            bgColor={colors.redLight}
            textColor={colors.icbcRed}
          />
        </div>
        
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              className={`pb-4 font-medium text-sm border-b-2 ${
                activeTab === 'all' 
                  ? `border-blue-600 text-blue-600` 
                  : `border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300`
              }`}
              onClick={() => setActiveTab('all')}
            >
              All Requests
            </button>
            <button
              className={`pb-4 font-medium text-sm border-b-2 ${
                activeTab === 'my' 
                  ? `border-blue-600 text-blue-600` 
                  : `border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300`
              }`}
              onClick={() => setActiveTab('my')}
            >
              My Requests
            </button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="col-span-1 md:col-span-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Search requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <select
                className="block w-full border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            
            <div>
              <select
                className="block w-full border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            
            <div>
              <button
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Filter size={16} className="mr-2" />
                More Filters
              </button>
            </div>
          </div>
        </div>
        
        {/* Requests Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('id')}
                  >
                    Request ID {renderSortIcon('id')}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('title')}
                  >
                    Title {renderSortIcon('title')}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('counterparty')}
                  >
                    Counterparty {renderSortIcon('counterparty')}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('status')}
                  >
                    Status {renderSortIcon('status')}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('submittedBy')}
                  >
                    Submitted By {renderSortIcon('submittedBy')}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('rank')}
                  >
                    Rank {renderSortIcon('rank')}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('priority')}
                  >
                    Priority {renderSortIcon('priority')}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('submittedDate')}
                  >
                    Submitted {renderSortIcon('submittedDate')}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('requiredByDate')}
                  >
                    Required By {renderSortIcon('requiredByDate')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedRequests.length > 0 ? (
                  sortedRequests.map((request, index) => (
                    <tr 
                      key={request.id}
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {request.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.counterparty}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusChip status={request.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.submittedBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {request.rank}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PriorityChip priority={request.priority} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.submittedDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.requiredByDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-800">
                            <Eye size={18} />
                          </button>
                          {request.status !== 'approved' && request.status !== 'rejected' && (
                            <button className="text-red-600 hover:text-red-800">
                              <Edit size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="px-6 py-10 text-center text-sm text-gray-500">
                      No matching requests found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination (simplified) */}
          <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{sortedRequests.length}</span> of <span className="font-medium">{creditRequests.length}</span> results
            </div>
            
            <div className="flex space-x-2">
              <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50">
                Previous
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditRiskDashboard;