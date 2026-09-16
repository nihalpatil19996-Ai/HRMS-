import React, { useState } from 'react';
import { FilePlus, FileText, Video, FileSpreadsheet, Trash2, Download, ExternalLink, CheckCircle } from 'lucide-react';
import { DistributedFile, FileCategory } from '../../types/crm';
import { StorageService } from '../../services/storage';

interface FileDistributionProps {
  files: DistributedFile[];
  onRefresh: () => void;
}

export const FileDistribution: React.FC<FileDistributionProps> = ({ files, onRefresh }) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<FileCategory>('PDF Document');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [uploadedBy, setUploadedBy] = useState('Branch Admin');

  const handleAddFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      alert('File Title is required.');
      return;
    }

    StorageService.addFile({
      title,
      category,
      description,
      fileUrl: fileUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      uploadedBy,
      fileSize: '1.5 MB',
    });

    onRefresh();
    setShowUploadModal(false);
    setTitle('');
    setDescription('');
    setFileUrl('');
  };

  const handleDelete = (id: string, fileTitle: string) => {
    if (confirm(`Remove file "${fileTitle}" from field distribution?`)) {
      StorageService.deleteFile(id);
      onRefresh();
    }
  };

  const getCategoryIcon = (cat: FileCategory) => {
    switch (cat) {
      case 'PDF Document':
      case 'Circular':
      case 'Brochure':
        return <FileText className="w-5 h-5 text-rose-500" />;
      case 'Excel Rate Sheet':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      case 'Training Video':
        return <Video className="w-5 h-5 text-purple-600" />;
      default:
        return <FileText className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">File & Document Distribution System</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload product rate sheets, training videos, circulars, & brochures — automatically distributed to all agents' mobile apps
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2 whitespace-nowrap"
        >
          <FilePlus className="w-4 h-4" />
          Distribute New File
        </button>
      </div>

      {/* Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {files.map((file) => (
          <div
            key={file.id}
            className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex-shrink-0">
                {getCategoryIcon(file.category)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {file.category}
                  </span>
                  <span className="text-[11px] text-slate-400">{file.uploadedDate}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm mt-1 line-clamp-1">{file.title}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{file.description}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">Uploaded by: {file.uploadedBy}</span>
              <div className="flex items-center gap-2">
                <a
                  href={file.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors flex items-center gap-1 text-[11px]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View / Open
                </a>
                <button
                  onClick={() => handleDelete(file.id, file.title)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload File Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Distribute New File to Agents</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddFile} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q3 Health Protect Rate Card 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FileCategory)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="PDF Document">PDF Document</option>
                  <option value="Excel Rate Sheet">Excel Rate Sheet</option>
                  <option value="Training Video">Training Video</option>
                  <option value="Circular">Circular</option>
                  <option value="Brochure">Brochure</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description / Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Provide guidance or mandatory read instructions for agents..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">File URL / Download Link</label>
                <input
                  type="url"
                  placeholder="https://... or leave blank for sample link"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl"
                >
                  Publish & Distribute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
