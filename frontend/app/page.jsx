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
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 py-4 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black tracking-tighter bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
              GulfDupe
            </span>
            <span className="text-xs bg-slate-800 text-emerald-400 px-3 py-1 rounded-full font-semibold border border-slate-700">
              GCC Edition 🇦🇪 🇶🇦 🇸🇦 🇰🇼
            </span>
          </div>
          <div className="text-xs text-slate-400 hidden sm:block">
            Smart AI Price Arbitrage & Alternatives
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 pt-16 pb-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
            Find Designer Quality <br/>
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Without the Luxury Tax.
            </span>
          </h1>
          <p className="text-slate-400 text-base md:text-lg">
            Search by item name, paste any store URL (Ounass, Sephora, Farfetch), or upload a photo to discover affordable GCC alternatives instantly.
          </p>
        </div>

        {/* Search Interface Card */}
        <div className="bg-slate-800/60 border border-slate-700/80 p-6 md:p-8 rounded-3xl shadow-2xl backdrop-blur-xl">
          <div className="flex gap-2 mb-6 border-b border-slate-700 pb-4 overflow-x-auto">
            {[
              { id: 'name', label: '🔍 Product Name' },
              { id: 'url', label: '🔗 Store URL' },
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
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-900/50 text-slate-400 hover:bg-slate-700 hover:text-white'
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
                placeholder="e.g., Tom Ford Oud Wood, Dyson Airwrap, Loewe Basket..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
              />
            )}

            {activeTab === 'url' && (
              <input
                type="url"
                required
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste product link from Ounass, Sephora, Namshi, Amazon..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
              />
            )}

            {activeTab === 'image' && (
              <input
                type="file"
                accept="image/*"
                required
                onChange={(e) => setImageFile(e.target.files[0])}
                className="flex-1 bg-slate-900 border border-dashed border-slate-700 rounded-2xl px-5 py-3.5 text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-emerald-500 file:text-slate-950 hover:file:bg-emerald-400 cursor-pointer transition"
              />
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-8 py-4 rounded-2xl transition shadow-lg shadow-emerald-500/10 disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-slate-950" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  >
                  Scanning GCC Markets...
                </span>
              ) : (
                'Find Dupes 🚀'
              )}
            </button>
          </form>

          {error && <p className="text-rose-400 text-sm mt-3 font-medium">⚠️ {error}</p>}
        </div>

        {/* Results Section */}
        {results && (
          <div className="mt-12 animate-fadeIn">
            {/* Original Item Header */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400 block mb-1">
                  Original Reference Item
                </span>
                <h3 className="text-xl font-bold text-white">{results.originalProduct.name}</h3>
              </div>
              <div className="text-left md:text-right bg-slate-900/60 px-5 py-3 rounded-xl border border-slate-700/50 w-full md:w-auto">
                <span className="text-xs text-slate-400 block">Est. Luxury Retail</span>
                <span className="text-xl font-black text-rose-400 line-through">
                  {results.originalProduct.estimatedOriginalPrice}
                </span>
              </div>
            </div>

            <h4 className="text-2xl font-extrabold mb-6 text-white">Recommended Gulf Alternatives</h4>
            <div className="grid md:grid-cols-2 gap-6">
              {results.dupes.map((dupe, index) => (
                <div
                  key={index}
                  className="bg-slate-800/40 border border-slate-700/80 hover:border-slate-600 rounded-3xl p-6 transition-all flex flex-col justify-between shadow-xl"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-black px-3 py-1 rounded-lg">
                        SAVE {dupe.savingsPercentage}
                      </span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                        {dupe.store}
                      </span>
                    </div>
                    <h5 className="text-lg font-bold text-white mb-2">{dupe.name}</h5>
                    <p className="text-sm text-slate-300 leading-relaxed mb-6">{dupe.whyItsAGoodDupe}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block">GCC Deal Price</span>
                      <span className="text-2xl font-black text-emerald-400">
                        {dupe.estimatedPrice}
                      </span>
                    </div>
                    <a
                      href={dupe.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white hover:bg-slate-200 text-slate-950 text-sm font-extrabold px-6 py-3 rounded-xl transition shadow-md"
                    >
                      Shop on {dupe.store} →
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
