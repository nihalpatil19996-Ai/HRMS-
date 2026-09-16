import React, { useState } from 'react';
import { Upload, FileSpreadsheet, UserCheck, Plus, Search, Download, Filter, CheckSquare, Square, Layers, ListOrdered, Trash2, PhoneCall, Sparkles } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Lead, Employee, CallStatus, CallQueue } from '../../types/crm';
import { StorageService } from '../../services/storage';
import { parseExcelOrCsvFile, downloadSampleExcelTemplate } from '../../utils/excelHelper';
import { QueueSheetDetailModal } from '../common/QueueSheetDetailModal';

interface LeadManagerProps {
  leads: Lead[];
  employees: Employee[];
  onRefresh: () => void;
}

export const LeadManager: React.FC<LeadManagerProps> = ({ leads, employees, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [fileFilter, setFileFilter] = useState<string>('ALL');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [batchAssignEmpId, setBatchAssignEmpId] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [custName, setCustName] = useState('');
  const [custMobile, setCustMobile] = useState('');
  const [custCity, setCustCity] = useState('');
  const [custState, setCustState] = useState('');
  const [custProduct, setCustProduct] = useState('Share Market Sales');
  const [assignedEmpId, setAssignedEmpId] = useState('');

  // Call Queue modal state
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [queueName, setQueueName] = useState('');
  const [queueDesc, setQueueDesc] = useState('');
  const [queueAssignEmpId, setQueueAssignEmpId] = useState('ALL');
  const [queueFile, setQueueFile] = useState<File | null>(null);

  // Queue Detail Modal state
  const [adminDetailQueueOrFileName, setAdminDetailQueueOrFileName] = useState<string | null>(null);
  const [adminDetailDesc, setAdminDetailDesc] = useState<string | undefined>(undefined);
  const [adminDetailAssignedName, setAdminDetailAssignedName] = useState<string | undefined>(undefined);

  const activeQueues: CallQueue[] = StorageService.getCallQueues();

  const handleCreateQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queueName.trim()) {
      alert('Please enter a Queue Name (e.g. August HDFC Campaign)');
      return;
    }

    let parsedLeadsList: Array<Omit<Lead, 'id' | 'createdAt'>> = [];

    if (queueFile) {
      try {
        const parsedRows = await parseExcelOrCsvFile(queueFile);
        if (parsedRows.length === 0) {
          alert('No valid lead records found in the uploaded file.');
          return;
        }
        const targetEmp = employees.find((e) => e.id === queueAssignEmpId);

        parsedLeadsList = parsedRows.map((row) => ({
          customerName: row.customerName,
          mobile: row.mobile,
          city: row.city || 'Mumbai',
          state: row.state || 'Maharashtra',
          product: row.product || 'Share Market Sales',
          status: 'Pending' as CallStatus,
          assignedTo: queueAssignEmpId === 'ALL' ? '' : queueAssignEmpId,
          assignedToName: queueAssignEmpId === 'ALL' ? 'All Agents' : (targetEmp ? targetEmp.name : 'Assigned Agent'),
          sourceFile: queueFile.name,
          remarks: row.remarks || `Imported via Queue "${queueName}"`,
        }));
      } catch (err) {
        alert('Failed to parse uploaded Excel file. Please verify file format.');
        return;
      }
    } else {
      const targetEmp = employees.find((e) => e.id === queueAssignEmpId);
      parsedLeadsList = [
        { customerName: 'Rajesh Mittal', mobile: '9811002233', city: 'Mumbai', state: 'Maharashtra', product: 'Share Market Sales', status: 'Pending', assignedTo: queueAssignEmpId === 'ALL' ? '' : queueAssignEmpId, assignedToName: targetEmp?.name || 'All Agents' },
        { customerName: 'Sunita Narang', mobile: '9822113344', city: 'Delhi', state: 'NCR', product: 'Health Insurance', status: 'Pending', assignedTo: queueAssignEmpId === 'ALL' ? '' : queueAssignEmpId, assignedToName: targetEmp?.name || 'All Agents' },
        { customerName: 'Vikrant Saxena', mobile: '9833224455', city: 'Bangalore', state: 'Karnataka', product: 'Personal Loan', status: 'Pending', assignedTo: queueAssignEmpId === 'ALL' ? '' : queueAssignEmpId, assignedToName: targetEmp?.name || 'All Agents' },
        { customerName: 'Neha Kapoor', mobile: '9844335566', city: 'Pune', state: 'Maharashtra', product: 'Home Loan Express', status: 'Pending', assignedTo: queueAssignEmpId === 'ALL' ? '' : queueAssignEmpId, assignedToName: targetEmp?.name || 'All Agents' },
      ];
    }

    const targetEmp = employees.find((e) => e.id === queueAssignEmpId);
    StorageService.createCallQueue({
      name: queueName.trim(),
      description: queueDesc.trim(),
      assignedTo: queueAssignEmpId,
      assignedToName: queueAssignEmpId === 'ALL' ? 'All Agents' : (targetEmp ? targetEmp.name : 'Assigned Agent'),
      fileName: queueFile ? queueFile.name : 'Campaign_Batch_Leads.xlsx',
      leadsList: parsedLeadsList,
    });

    onRefresh();
    setShowQueueModal(false);
    setQueueName('');
    setQueueDesc('');
    setQueueFile(null);
    alert(`Call Queue "${queueName}" created successfully with ${parsedLeadsList.length} leads! Agents can now view and auto dial this queue in their mobile app.`);
  };

  const handleDeleteQueue = (qId: string, qName: string) => {
    if (confirm(`Are you sure you want to delete Call Queue "${qName}"?`)) {
      StorageService.deleteCallQueue(qId);
      onRefresh();
    }
  };

  // Extract list of distinct uploaded files
  const uploadedFilesList = Array.from(
    new Set(leads.map((l) => l.sourceFile).filter(Boolean) as string[])
  );

  // Excel / CSV File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedRows = await parseExcelOrCsvFile(file);
      if (parsedRows.length === 0) {
        alert('No valid lead records found in uploaded file.');
        return;
      }

      const formattedLeads = parsedRows.map((row) => ({
        customerName: row.customerName,
        mobile: row.mobile,
        city: row.city || 'Mumbai',
        state: row.state || 'Maharashtra',
        product: row.product || 'Share Market Sales',
        status: 'Pending' as CallStatus,
        assignedTo: '',
        sourceFile: file.name,
        remarks: row.remarks || `Imported from ${file.name}`,
      }));

      StorageService.batchImportLeads(formattedLeads);
      onRefresh();
      setFileFilter(file.name);
      alert(`Successfully imported ${formattedLeads.length} leads from file "${file.name}"!`);
    } catch (err) {
      alert('Error parsing uploaded file. Please use the downloaded template format.');
    }
  };

  const handleDownloadSampleExcel = () => {
    const sampleData = [
      { Name: 'Aarav Patel', Mobile: '9876501122', City: 'Mumbai', State: 'Maharashtra', Product: 'Health Protect Pro' },
      { Name: 'Sneha Sharma', Mobile: '9812304455', City: 'Delhi', State: 'NCR', Product: 'Personal Loan Premier' },
      { Name: 'Karan Malhotra', Mobile: '9765408899', City: 'Bangalore', State: 'Karnataka', Product: 'Term Life Care 1Cr' },
      { Name: 'Pooja Nair', Mobile: '9654303322', City: 'Chennai', State: 'Tamil Nadu', Product: 'Gold Cashback Credit Card' },
      { Name: 'Rahul Sen', Mobile: '9543207766', City: 'Kolkata', State: 'West Bengal', Product: 'Home Loan Express' },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sample_Leads');
    XLSX.writeFile(wb, 'Sample_Lead_Import_Template.xlsx');
  };

  const handleBatchAssign = () => {
    if (selectedLeadIds.length === 0) {
      alert('Please select at least one lead from the list.');
      return;
    }
    if (!batchAssignEmpId) {
      alert('Please select an employee to assign leads to.');
      return;
    }

    const targetEmp = employees.find((e) => e.id === batchAssignEmpId);
    if (targetEmp) {
      StorageService.assignLeads(selectedLeadIds, targetEmp.id, targetEmp.name);
      setSelectedLeadIds([]);
      onRefresh();
      alert(`Assigned ${selectedLeadIds.length} lead(s) to ${targetEmp.name}!`);
    }
  };

  const handleSelectAll = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map((l) => l.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedLeadIds.includes(id)) {
      setSelectedLeadIds(selectedLeadIds.filter((item) => item !== id));
    } else {
      setSelectedLeadIds([...selectedLeadIds, id]);
    }
  };

  const handleAddManualLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !custMobile) {
      alert('Customer Name and Mobile are required.');
      return;
    }

    const assignedEmp = employees.find((e) => e.id === assignedEmpId);

    StorageService.addLead({
      customerName: custName,
      mobile: custMobile,
      city: custCity || 'Mumbai',
      state: custState || 'Maharashtra',
      product: custProduct,
      status: 'Pending',
      assignedTo: assignedEmpId,
      assignedToName: assignedEmp ? assignedEmp.name : undefined,
    });

    onRefresh();
    setShowAddModal(false);
    setCustName('');
    setCustMobile('');
    setCustCity('');
    setCustState('');
  };

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.mobile.includes(searchTerm) ||
      l.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.product.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
    const matchesFile = fileFilter === 'ALL' || l.sourceFile === fileFilter;

    return matchesSearch && matchesStatus && matchesFile;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Excel Upload controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Lead Management & Batch Assignment</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Import Excel/CSV lists, distribute leads to sales agents, and monitor lead disposition statuses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowQueueModal(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <ListOrdered className="w-4 h-4 text-amber-300" />
              + Create Agent Call Queue
            </button>

            <button
              onClick={downloadSampleExcelTemplate}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-slate-500" />
              Template
            </button>

            <label className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm">
              <FileSpreadsheet className="w-4 h-4" />
              Import Excel
              <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Lead
            </button>
          </div>
        </div>

        {/* Active Agent Call Queues / Campaigns Section */}
        {activeQueues.length > 0 && (
          <div className="bg-slate-50 border border-indigo-100 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Active Agent Call Queues / Campaigns ({activeQueues.length})
                </h3>
              </div>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                Visible in Mobile App for Auto/Manual Dialing
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeQueues.map((q) => {
                const pendingCount = leads.filter(
                  (l) => (l.queueId === q.id || l.queueName === q.name || l.sourceFile === q.fileName) && l.status === 'Pending'
                ).length;
                const totalCount = leads.filter(
                  (l) => (l.queueId === q.id || l.queueName === q.name || l.sourceFile === q.fileName)
                ).length || q.totalLeads;
                const completedCount = totalCount - pendingCount;
                const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                return (
                  <div
                    key={q.id}
                    className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-2 hover:border-indigo-300 transition-all relative group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                          <span className="text-indigo-600 font-mono">📁</span>
                          {q.name}
                        </div>
                        {q.description && (
                          <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{q.description}</div>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteQueue(q.id, q.name)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                        title="Delete Queue"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                      <span>Assigned Agent:</span>
                      <span className="text-indigo-700 font-bold">
                        👤 {q.assignedToName || (q.assignedTo === 'ALL' ? 'All Agents' : q.assignedTo)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500">
                        <span>Calling Progress</span>
                        <span className="text-slate-800">{completedCount} / {totalCount} Calls ({percent}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100 text-slate-400">
                      <span>📄 {q.fileName || 'Excel Sheet'}</span>
                      <span className="text-emerald-600 font-bold">⚡ {pendingCount} Pending to Dial</span>
                    </div>

                    <button
                      onClick={() => {
                        setAdminDetailQueueOrFileName(q.name);
                        setAdminDetailDesc(q.description || `Campaign with ${totalCount} numbers`);
                        setAdminDetailAssignedName(q.assignedToName || 'Assigned Agent');
                      }}
                      className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
                    >
                      <Search className="w-3.5 h-3.5 text-indigo-600" />
                      View Dialed / Not Dialed Counts & Comments
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Batch Assignment & Search Filter Bar */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 pt-1">
          
          {/* Batch assign action */}
          <div className="w-full lg:w-auto flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-xl">
            <span className="text-xs font-semibold text-slate-600 pl-2">
              Batch Assign ({selectedLeadIds.length} selected):
            </span>
            <select
              value={batchAssignEmpId}
              onChange={(e) => setBatchAssignEmpId(e.target.value)}
              className="bg-white border border-slate-200 text-xs text-slate-800 rounded-lg px-2 py-1 focus:outline-none"
            >
              <option value="">Select Field Agent</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.role})
                </option>
              ))}
            </select>
            <button
              onClick={handleBatchAssign}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              Assign Now
            </button>
          </div>

          {/* Search and status filter */}
          <div className="w-full lg:w-auto flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, phone, city, product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl px-3 py-1.5 focus:outline-none font-medium"
            >
              <option value="ALL">All Statuses ({leads.length})</option>
              <option value="Pending">Pending / New</option>
              <option value="Interested">Interested</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Meeting Fixed">Meeting Fixed</option>
              <option value="Converted">Converted</option>
              <option value="Busy">Busy</option>
              <option value="Switch Off">Switch Off</option>
              <option value="Wrong Number">Wrong Number</option>
              <option value="Not Interested">Not Interested</option>
            </select>

            {/* Filter by Uploaded Excel/CSV File */}
            <select
              value={fileFilter}
              onChange={(e) => setFileFilter(e.target.value)}
              className="bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 font-bold rounded-xl px-3 py-1.5 focus:outline-none"
            >
              <option value="ALL">📁 All Uploaded Files ({uploadedFilesList.length})</option>
              {uploadedFilesList.map((fileName) => {
                const count = leads.filter((l) => l.sourceFile === fileName).length;
                return (
                  <option key={fileName} value={fileName}>
                    📄 {fileName} ({count} leads)
                  </option>
                );
              })}
            </select>
          </div>

        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-10">
                  <button onClick={handleSelectAll} className="text-slate-500 hover:text-slate-800">
                    {selectedLeadIds.length > 0 && selectedLeadIds.length === filteredLeads.length ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">City / State</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Assigned To</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Latest Remarks / Follow-up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredLeads.map((lead) => {
                const isSelected = selectedLeadIds.includes(lead.id);

                return (
                  <tr key={lead.id} className={`hover:bg-slate-50/70 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}>
                    <td className="py-3 px-4">
                      <button onClick={() => handleToggleSelect(lead.id)} className="text-slate-500">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{lead.customerName}</div>
                      <div className="text-[11px] text-slate-500">{lead.mobile}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {lead.city}, {lead.state}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {lead.product}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {lead.assignedToName ? (
                        <div className="flex items-center gap-1 text-slate-900 font-semibold">
                          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                          {lead.assignedToName}
                        </div>
                      ) : (
                        <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-medium text-[11px]">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                          lead.status === 'Converted'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : lead.status === 'Interested' || lead.status === 'Meeting Fixed'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : lead.status === 'Follow-up'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : lead.status === 'Pending'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {lead.remarks || 'No call log yet.'}
                      {lead.nextFollowup && (
                        <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                          Followup: {lead.nextFollowup}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Single Lead</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddManualLead} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anand Mahindra"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mobile Phone *</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98000 11122"
                  value={custMobile}
                  onChange={(e) => setCustMobile(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Pune"
                    value={custCity}
                    onChange={(e) => setCustCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">State</label>
                  <input
                    type="text"
                    placeholder="e.g. Maharashtra"
                    value={custState}
                    onChange={(e) => setCustState(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Product Category</label>
                <select
                  value={custProduct}
                  onChange={(e) => setCustProduct(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="Health Protect Pro">Health Protect Pro</option>
                  <option value="Personal Loan Premier">Personal Loan Premier</option>
                  <option value="Term Life Care 1Cr">Term Life Care 1Cr</option>
                  <option value="Gold Cashback Credit Card">Gold Cashback Credit Card</option>
                  <option value="Home Loan Express">Home Loan Express</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Assign to Agent Immediately</label>
                <select
                  value={assignedEmpId}
                  onChange={(e) => setAssignedEmpId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="">Leave Unassigned</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Call Queue Modal */}
      {showQueueModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900">Create New Call Queue / Campaign</h3>
              </div>
              <button onClick={() => setShowQueueModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateQueue} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-800 font-bold mb-1">Queue / Campaign Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. August HDFC Health Leads / Share Market Hot Queue"
                  value={queueName}
                  onChange={(e) => setQueueName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. High response rate leads collected from recent Facebook ad campaign."
                  value={queueDesc}
                  onChange={(e) => setQueueDesc(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Assign Queue to Agent</label>
                <select
                  value={queueAssignEmpId}
                  onChange={(e) => setQueueAssignEmpId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-900"
                >
                  <option value="ALL">🌐 All Agents (Shared Queue Bucket)</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      👤 {e.name} ({e.role} - ID: {e.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-indigo-50/70 border border-indigo-200 p-3.5 rounded-xl space-y-2">
                <label className="block text-indigo-950 font-extrabold text-xs">
                  📄 Upload Queue Excel / CSV File (Optional)
                </label>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => setQueueFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                />
                <p className="text-[11px] text-indigo-800 font-medium">
                  If an Excel file is uploaded, all rows will be parsed into leads for this queue. If left empty, sample queue leads will be auto-generated.
                </p>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQueueModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl shadow-md cursor-pointer"
                >
                  Create & Publish Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Queue / Sheet Detail Modal */}
      {adminDetailQueueOrFileName && (
        <QueueSheetDetailModal
          isOpen={!!adminDetailQueueOrFileName}
          onClose={() => setAdminDetailQueueOrFileName(null)}
          queueOrFileName={adminDetailQueueOrFileName}
          queueDescription={adminDetailDesc}
          assignedToName={adminDetailAssignedName}
          leads={leads}
          onStartAutoDial={(filteredLeads) => {
            alert(`Auto-dialer campaign for ${filteredLeads.length} leads is configured! Agent mobile view can now execute auto-dialing.`);
          }}
          onManualDialLead={(lead) => {
            alert(`Selected lead ${lead.customerName} (${lead.mobile}). Mobile app is ready for calling.`);
          }}
        />
      )}

    </div>
  );
};
