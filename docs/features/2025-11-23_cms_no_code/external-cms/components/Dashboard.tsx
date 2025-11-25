import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPages } from '../services/storageService';
import { Page, PageStatus } from '../types';
import { Edit2, Eye, Trash2, Calendar, FileText, Circle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [pages, setPages] = useState<Page[]>([]);

  useEffect(() => {
    setPages(getPages().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
  }, []);

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this page?')) {
      // Direct storage manipulation for simplicity in this demo
      const updatedPages = pages.filter(p => p.id !== id);
      localStorage.setItem('ai_cms_pages', JSON.stringify(updatedPages));
      setPages(updatedPages);
    }
  };

  const getStatusColor = (status: PageStatus) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-700 border-green-200';
      case 'archived': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Pages</h1>
          <p className="text-gray-500 mt-1">Manage and edit your AI-generated content.</p>
        </div>
        <Link
          to="/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all duration-200 flex items-center gap-2"
        >
          <div className="w-5 h-5 flex items-center justify-center border-2 border-white/30 rounded-full text-xs">
            +
          </div>
          Create New Page
        </Link>
      </div>

      {pages.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 border-dashed">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No pages yet</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">Get started by generating your first AI-powered landing page or blog post.</p>
          <Link to="/create" className="text-blue-600 font-medium hover:underline">
            Create your first page &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pages.map((page) => (
            <div key={page.id} className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
              <div className="relative h-48 bg-gray-100 overflow-hidden">
                {page.featured_image ? (
                  <img
                    src={page.featured_image}
                    alt={page.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <FileText size={48} />
                  </div>
                )}
                
                <div className="absolute top-3 left-3 flex gap-2">
                   <div className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize shadow-sm border ${getStatusColor(page.status)}`}>
                     {page.status}
                   </div>
                </div>

                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-semibold text-gray-700 capitalize shadow-sm">
                  {page.content_type}
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="mb-4 flex-1">
                  <h3 className="font-bold text-lg text-gray-900 line-clamp-1 mb-1" title={page.title}>
                    {page.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {page.content.seo.description}
                  </p>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                  <div className="flex items-center text-xs text-gray-400 gap-1">
                    <Calendar size={12} />
                    {new Date(page.created_at).toLocaleDateString()}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(page.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                    <Link
                      to={`/editor/${page.id}`}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </Link>
                    <Link
                      to={`/p/${page.slug}`}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="View"
                    >
                      <Eye size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;