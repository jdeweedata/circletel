import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPageById, savePage } from '../services/storageService';
import { Page, PageStatus } from '../types';
import { Save, ArrowLeft, ExternalLink, RefreshCw, ChevronDown, Circle } from 'lucide-react';
import { generateImage } from '../services/geminiService';
import RichTextEditor from './RichTextEditor';

const Editor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = useState<Page | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);

  useEffect(() => {
    if (id) {
      const data = getPageById(id);
      if (data) setPage(data);
    }
  }, [id]);

  if (!page) return <div className="p-8 text-center text-gray-500">Loading editor...</div>;

  const handleSave = () => {
    setIsSaving(true);
    savePage(page);
    setTimeout(() => setIsSaving(false), 800);
  };

  const updateStatus = (newStatus: PageStatus) => {
    setPage({ ...page, status: newStatus });
  };

  const updateHero = (field: string, value: string) => {
    setPage({
      ...page,
      content: { ...page.content, hero: { ...page.content.hero, [field]: value } }
    });
  };

  const updateSection = (index: number, field: string, value: string) => {
    const newSections = [...page.content.sections];
    newSections[index] = { ...newSections[index], [field]: value };
    setPage({
      ...page,
      content: { ...page.content, sections: newSections }
    });
  };

  const handleRegenerateImage = async () => {
    if (!page.content.image_prompt) return;
    setIsRegeneratingImage(true);
    try {
      const newImage = await generateImage(page.content.image_prompt);
      setPage({ ...page, featured_image: newImage });
      handleSave();
    } catch (e) {
      console.error(e);
      alert("Failed to regenerate image");
    } finally {
      setIsRegeneratingImage(false);
    }
  };

  const getStatusColor = (status: PageStatus) => {
    switch (status) {
      case 'published': return 'bg-green-50 text-green-700 border-green-200';
      case 'archived': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar Controls */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col h-full shadow-lg z-20">
        <div className="p-4 border-b border-gray-200 flex flex-col gap-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-gray-500 hover:text-gray-900 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h2 className="font-semibold text-gray-800">Editor</h2>
             <button 
               onClick={handleSave}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${
                 isSaving 
                   ? 'bg-green-100 text-green-700' 
                   : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
               }`}
             >
               <Save size={16} />
               {isSaving ? 'Saved' : 'Save Changes'}
             </button>
          </div>
          
          <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-200">
            <span className="text-sm font-medium text-gray-500 ml-1">Status</span>
            <div className="relative w-32">
              <div className={`absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${
                page.status === 'published' ? 'bg-green-500' : 
                page.status === 'archived' ? 'bg-gray-400' : 'bg-yellow-500'
              }`}></div>
              <select
                value={page.status}
                onChange={(e) => updateStatus(e.target.value as PageStatus)}
                className={`appearance-none text-sm rounded-md block w-full py-1.5 pl-6 pr-8 cursor-pointer font-medium border focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${getStatusColor(page.status)}`}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-gray-200">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <span>Hero Section</span>
              <div className="h-px bg-gray-200 flex-1"></div>
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Headline</label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-shadow shadow-sm"
                  rows={2}
                  value={page.content.hero.headline}
                  onChange={(e) => updateHero('headline', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Subheadline</label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-shadow shadow-sm"
                  rows={3}
                  value={page.content.hero.subheadline}
                  onChange={(e) => updateHero('subheadline', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">CTA Button</label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow shadow-sm"
                  value={page.content.hero.cta}
                  onChange={(e) => updateHero('cta', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
             <div className="flex items-center justify-between">
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Featured Image</h3>
               <button 
                onClick={handleRegenerateImage}
                disabled={isRegeneratingImage}
                className="text-xs flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
               >
                 <RefreshCw size={12} className={isRegeneratingImage ? 'animate-spin' : ''} />
                 Regenerate
               </button>
             </div>
             <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative group shadow-sm">
                <img src={page.featured_image} alt="Featured" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs p-4 text-center">
                   {page.content.image_prompt}
                </div>
             </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <span>Sections</span>
              <div className="h-px bg-gray-200 flex-1"></div>
            </h3>
            {page.content.sections.map((section, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4 transition-all hover:border-blue-300 hover:shadow-md">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Section Heading</label>
                  <input
                    type="text"
                    className="w-full bg-white font-semibold text-gray-900 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    value={section.heading}
                    onChange={(e) => updateSection(idx, 'heading', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Content</label>
                  <RichTextEditor 
                    content={section.content}
                    onChange={(html) => updateSection(idx, 'content', html)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <Link 
            to={`/p/${page.slug}`} 
            target="_blank"
            className="flex items-center justify-center gap-2 w-full py-3 bg-gray-900 text-white rounded-lg hover:bg-black transition-all shadow-md hover:shadow-lg font-medium"
          >
            <ExternalLink size={16} />
            View Live Page
          </Link>
        </div>
      </div>

      {/* Live Preview Area */}
      <div className="flex-1 overflow-y-auto bg-gray-100 p-8 flex justify-center">
        <div className="w-full max-w-5xl bg-white min-h-[calc(100vh-4rem)] shadow-2xl rounded-xl overflow-hidden scale-[0.95] origin-top transform transition-transform border border-gray-200">
          {/* Mock Browser Header */}
          <div className="bg-gray-100 border-b border-gray-200 px-4 py-3 flex items-center gap-4 sticky top-0 z-50">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400 border border-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-400 border border-green-500"></div>
            </div>
            <div className="flex-1 bg-white border border-gray-200 rounded-md px-4 py-1.5 text-xs text-gray-500 flex items-center justify-center shadow-sm">
              <span className="truncate">mysite.com/p/{page.slug}</span>
            </div>
             <div className="w-16"></div> 
          </div>

          {/* Actual Page Content */}
          <div className="font-sans text-gray-900">
             {/* Hero */}
             <div className="relative h-[550px] flex items-center justify-center text-center px-6">
                <div className="absolute inset-0 z-0">
                  <img src={page.featured_image} className="w-full h-full object-cover brightness-[0.5]" alt="Hero" />
                </div>
                <div className="relative z-10 max-w-4xl mx-auto text-white">
                  <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight drop-shadow-lg">{page.content.hero.headline}</h1>
                  <p className="text-xl md:text-2xl text-gray-100 mb-10 font-light max-w-2xl mx-auto drop-shadow-md">{page.content.hero.subheadline}</p>
                  <button className="bg-white text-gray-900 px-8 py-4 rounded-full font-bold text-lg transition-transform hover:scale-105 shadow-xl hover:bg-gray-50">
                    {page.content.hero.cta}
                  </button>
                </div>
             </div>

             {/* Content Sections */}
             <div className="max-w-4xl mx-auto py-20 px-8 space-y-20">
               {page.content.sections.map((section, idx) => (
                 <div key={idx} className="group">
                   <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gray-900 border-b pb-4 border-gray-100 inline-block">{section.heading}</h2>
                   <div 
                     className="prose prose-lg prose-blue text-gray-600 leading-relaxed max-w-none"
                     dangerouslySetInnerHTML={{ __html: section.content }}
                   />
                 </div>
               ))}
             </div>

             {/* Footer */}
             <footer className="bg-gray-50 border-t border-gray-100 py-16 text-center">
                <div className="max-w-4xl mx-auto px-6">
                  <h4 className="font-bold text-lg mb-2 text-gray-900">{page.content.seo.title}</h4>
                  <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} All rights reserved.</p>
                </div>
             </footer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;