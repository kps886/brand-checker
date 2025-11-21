import React, { useState } from 'react';
import { Download, Search, Loader2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

// Define interfaces for data types
interface AnalysisResult {
  id: number;
  prompt: string;
  brand: string;
  mentioned: boolean;
  position: string | number;
  rawAnswer?: string;
}

interface ApiResponse {
  success: boolean;
  answer: string;
  mentioned: boolean;
  position: string | number;
  error?: string;
}

export default function App() {
  // Add type annotations to state
  const [prompt, setPrompt] = useState<string>('');
  const [brand, setBrand] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Typed event handler
  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt || !brand) {
      setError("Please fill in both fields.");
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      let backendUrl = 'http://localhost:5000';

      const env = import.meta.env as Record<string, string>;
      if (env && env.VITE_BACKEND_URL) {
        backendUrl = env.VITE_BACKEND_URL;
      }
      
      const response = await fetch(`${backendUrl}/api/check-brand`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, brand }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch from backend');
      }

      const data: ApiResponse = await response.json();
      
      const newResult: AnalysisResult = {
        id: Date.now(),
        prompt: prompt,
        brand: brand,
        mentioned: data.mentioned,
        position: data.position,
        rawAnswer: data.answer
      };

      setResults(prev => [newResult, ...prev]);
      setPrompt(''); 
    } catch (err) {
      console.error("API Error:", err);

      const mockResult: AnalysisResult = {
        id: Date.now(),
        prompt: prompt,
        brand: brand,
        mentioned: Math.random() > 0.5, 
        position: Math.floor(Math.random() * 5) + 1,
        rawAnswer: "This is a simulated answer because the backend is not reachable."
      };
      setResults(prev => [mockResult, ...prev]);
      setError("Backend not reachable. Added a simulated result for UI demo.");
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (results.length === 0) return;

    const headers = ['Prompt', 'Brand', 'Mentioned', 'Position'];
    const csvContent = [
      headers.join(','),
      ...results.map(row => {
        const safePrompt = `"${row.prompt.replace(/"/g, '""')}"`;
        const safeBrand = `"${row.brand.replace(/"/g, '""')}"`;
        return [safePrompt, safeBrand, row.mentioned ? 'Yes' : 'No', row.position].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'gemini_brand_check_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        
        <header className="mb-8 text-center md:text-left">
          <h1 className="text-3xl font-bold text-blue-700 mb-2">Gemini Brand Mention Checker</h1>
          <p className="text-gray-600">Check if your brand ranks in AI-generated recommendations.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Input Form */}
          <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Search size={20} className="text-blue-600" />
                New Check
              </h2>
              
              <form onSubmit={handleRun} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enter Prompt
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
                    placeholder="e.g., Recommend the best CRM software"
                    className="prompt w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none h-32 resize-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBrand(e.target.value)}
                    placeholder="e.g., Salesforce"
                    className="brand w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-start gap-2">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all ${
                    loading 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-md hover:shadow-lg'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Checking...
                    </>
                  ) : (
                    'Run Check'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Results Table */}
          <div className="md:col-span-2">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Results History</h2>
                {results.length > 0 && (
                  <button
                    onClick={downloadCSV}
                    className="flex items-center gap-2 text-sm text-green-700 bg-green-50 hover:bg-green-100 px-3 py-2 rounded-lg transition-colors border border-green-200"
                  >
                    <Download size={16} />
                    Download CSV
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-auto">
                {results.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
                    <Search size={48} className="mb-4 opacity-20" />
                    <p>No checks run yet.</p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">Prompt</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mentioned</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {results.map((row) => (
                          <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              <div className="font-medium line-clamp-2" title={row.prompt}>
                                {row.prompt}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                Checking for: <span className="font-medium text-gray-600">{row.brand}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {row.mentioned ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle size={12} /> Yes
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  <XCircle size={12} /> No
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">
                              {row.position}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}