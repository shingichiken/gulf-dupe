'use client';
import { useState } from 'react';

export default function GulfDupeHome() {
  const [activeTab, setActiveTab] = useState('name');
  const [textInput, setTextInput] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults(null);

    try {
      let response;
      if (activeTab === 'name') {
        response = await fetch(`${API_BASE}/api/search/name`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: textInput }),
        });
      } else if (activeTab === 'url') {
        response = await fetch(`${API_BASE}/api/search/url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: textInput }),
        });
      } else if (activeTab === 'image') {
        const formData = new FormData();
        formData.append('image', imageFile);
        response = await fetch(`${API_BASE}/api/search/image`, {
          method: 'POST',
          body: formData,
        });
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Something went wrong');
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 py-5 px-6">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-emerald-700">
            GulfDupe <span className="text-slate-400 font-normal text-sm">| GCC Smart Saver</span>
          </h1>
          <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-medium">
            UAE • Qatar • KSA • Kuwait
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Find the Exact Look & Quality for Less
          </h2>
          <p className="text-slate-600">
            Search by product name, paste any expensive store link, or upload a screenshot to find cheaper GCC alternatives.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex gap-2 mb-5 border-b border-slate-100 pb-3">
            {[
              { id: 'name', label: '🔍 Product Name' },
              { id: 'url', label: '🔗 Paste Link (URL)' },
              { id: 'image', label: '📸 Upload Photo' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setTextInput('');
                  setError('');
                }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
            {activeTab === 'name' && (
              <input
                type="text"
                required
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="e.g., Creed Aventus, Dyson Airwrap, Loewe Basket Bag..."
                className="flex-1 border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            )}

            {activeTab === 'url' && (
              <input
                type="url"
                required
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste link from Ounass, Sephora, Farfetch, Amazon..."
                className="flex-1 border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            )}

            {activeTab === 'image' && (
              <input
                type="file"
                accept="image/*"
                required
                onChange={(e) => setImageFile(e.target.files[0])}
                className="flex-1 border border-dashed border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50"
              />
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-8 py-3 rounded-xl transition disabled:opacity-50"
            >
              {loading ? 'Scanning GCC Stores...' : 'Find Dupes'}
            </button>
          </form>

          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
        </div>

        {results && (
          <div className="mt-10">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex justify-between items-center">
              <div>
                <span className="text-xs uppercase font-bold text-amber-700">Original Item Detected</span>
                <h3 className="text-lg font-bold text-slate-900">{results.originalProduct.name}</h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Typical GCC Retail</span>
                <span className="text-lg font-bold text-red-600 line-through">
                  {results.originalProduct.estimatedOriginalPrice}
                </span>
              </div>
            </div>

            <h4 className="text-xl font-bold mb-4">Top Cheaper Alternatives in the Gulf</h4>
            <div className="grid md:grid-cols-2 gap-5">
              {results.dupes.map((dupe, index) => (
                <div
                  key={index}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-md">
                        Save ~{dupe.savingsPercentage}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 uppercase">
                        Available on {dupe.store}
                      </span>
                    </div>
                    <h5 className="text-lg font-bold text-slate-900 mb-1">{dupe.name}</h5>
                    <p className="text-sm text-slate-600 mb-4">{dupe.whyItsAGoodDupe}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block">Est. Price</span>
                      <span className="text-xl font-extrabold text-emerald-700">
                        {dupe.estimatedPrice}
                      </span>
                    </div>
                    <a
                      href={dupe.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
                    >
                      View Deal on {dupe.store} →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
