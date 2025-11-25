import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generatePageContent, generateImage, improvePrompt } from '../services/geminiService';
import { savePage } from '../services/storageService';
import { Page, GenerationParams } from '../types';
import { Loader2, Wand2, Sparkles } from 'lucide-react';

const Wizard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [step, setStep] = useState(0); // 0: input, 1: generating text, 2: generating image
  
  const [formData, setFormData] = useState<GenerationParams>({
    topic: '',
    type: 'landing page',
    tone: 'professional',
    targetAudience: '',
    keywords: '',
    imageStyle: 'photorealistic'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEnhance = async () => {
    if (!formData.topic.trim()) return;
    setEnhancing(true);
    try {
      const improved = await improvePrompt(formData.topic, formData.type);
      setFormData(prev => ({
        ...prev,
        topic: improved.refinedTopic,
        targetAudience: improved.targetAudience,
        keywords: improved.keywords
      }));
    } catch (error) {
      console.error("Failed to enhance prompt", error);
    } finally {
      setEnhancing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStep(1);

    try {
      // 1. Generate Text Content
      const content = await generatePageContent(formData);
      
      setStep(2);
      // 2. Generate Image
      const imageUrl = await generateImage(content.image_prompt);

      // 3. Create Page Object
      const newPage: Page = {
        id: crypto.randomUUID(),
        slug: formData.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000),
        title: content.seo.title,
        content_type: formData.type,
        status: 'draft',
        content: content,
        featured_image: imageUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // 4. Save
      savePage(newPage);
      
      // 5. Redirect
      navigate(`/editor/${newPage.id}`);
    } catch (error) {
      console.error(error);
      alert("Failed to generate content. Please check your API key and try again.");
      setLoading(false);
      setStep(0);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
              <div className="relative bg-blue-600 text-white p-4 rounded-full">
                <Wand2 size={32} />
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {step === 1 ? 'Writing your content...' : 'Designing visuals...'}
            </h3>
            <p className="text-gray-500 max-w-xs mx-auto">
              Gemini is analyzing your request for "{formData.topic}" to create the perfect {formData.type}.
            </p>
          </div>
        ) : (
          <div className="p-8">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900">Create New Page</h2>
              <p className="text-gray-500 mt-1">Describe what you need, and AI will build it.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Topic</label>
                <div className="relative">
                  <input
                    name="topic"
                    required
                    type="text"
                    placeholder="e.g., Organic Coffee Subscription"
                    value={formData.topic}
                    onChange={handleChange}
                    className="w-full pl-4 pr-12 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleEnhance}
                    disabled={enhancing || !formData.topic.trim()}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all ${
                      !formData.topic.trim() ? 'text-gray-300' : 
                      enhancing ? 'bg-purple-100 text-purple-600' : 'text-purple-500 hover:bg-purple-50 hover:text-purple-700'
                    }`}
                    title="Enhance with AI"
                  >
                    {enhancing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  </button>
                </div>
                {enhancing && <p className="text-xs text-purple-600 font-medium animate-pulse">Refining your idea...</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="landing page">Landing Page</option>
                    <option value="blog post">Blog Post</option>
                    <option value="portfolio">Portfolio</option>
                    <option value="product page">Product Page</option>
                    <option value="sales page">Sales Page</option>
                    <option value="marketing page">Marketing Page</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Tone</label>
                  <select
                    name="tone"
                    value={formData.tone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="professional">Professional</option>
                    <option value="enthusiastic">Enthusiastic</option>
                    <option value="minimalist">Minimalist</option>
                    <option value="persuasive">Persuasive</option>
                    <option value="friendly">Friendly</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Image Style</label>
                <select
                  name="imageStyle"
                  value={formData.imageStyle}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="photorealistic">Photorealistic</option>
                  <option value="illustration">Illustration</option>
                  <option value="minimalist">Minimalist</option>
                  <option value="abstract">Abstract</option>
                  <option value="3d render">3D Render</option>
                  <option value="retro">Retro</option>
                  <option value="cartoon">Cartoon</option>
                  <option value="oil painting">Oil Painting</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Target Audience <span className="text-gray-400 font-normal">(Optional)</span></label>
                <input
                  name="targetAudience"
                  type="text"
                  placeholder="e.g., Coffee enthusiasts, Remote workers"
                  value={formData.targetAudience}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Keywords <span className="text-gray-400 font-normal">(Optional)</span></label>
                <input
                  name="keywords"
                  type="text"
                  placeholder="e.g., sustainable, fair trade, dark roast"
                  value={formData.keywords}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
              >
                <Wand2 size={18} />
                Generate with AI
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wizard;