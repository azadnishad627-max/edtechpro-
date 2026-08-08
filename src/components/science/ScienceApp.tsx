"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Beaker, ChevronRight, Search, Loader2 } from "lucide-react";
import { scienceModels, type ScienceModel, type Hotspot } from "../../lib/science/science-data";
import { ModelViewer } from "./ModelViewer";
import { useRouter } from "next/navigation";

export function ScienceApp() {
  const router = useRouter();
  const [selectedModel, setSelectedModel] = useState<ScienceModel>(scienceModels[0]);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);

  // Mobile detection state for responsive design
  const [isMobile, setIsMobile] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ScienceModel[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch initial batch of ~100 biology models on load
  useEffect(() => {
    const fetchInitialBiologyModels = async () => {
      try {
        const queries = ['biology cell', 'human anatomy', 'virus', 'microscope'];
        const allFetched: ScienceModel[] = [];
        
        for (const q of queries) {
          const res = await fetch(`https://api.sketchfab.com/v3/search?type=models&q=${encodeURIComponent(q)}&sort_by=-likeCount`);
          const data = await res.json();
          const items = data.results.slice(0, 24).map((item: any) => ({
            id: item.uid,
            name: item.name,
            description: "Sketchfab 3D Model: " + item.name + " (Auto-fetched online)",
            sketchfabId: item.uid
          }));
          
          for (const item of items) {
            if (!allFetched.find(m => m.id === item.id) && !scienceModels.find(m => m.sketchfabId === item.id)) {
              allFetched.push(item);
            }
          }
        }
        
        // Append them as search results initially, but without hiding default models completely
        setSearchResults(allFetched);
        // We will show them by default along with regular models
      } catch (err) {
        console.error("Failed to load initial biology models", err);
      }
    };
    
    fetchInitialBiologyModels();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setShowSearchResults(false);
      return;
    }
    
    setIsSearching(true);
    setShowSearchResults(true);
    try {
      const res = await fetch(`https://api.sketchfab.com/v3/search?type=models&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      
      const results: ScienceModel[] = data.results.map((item: any) => ({
        id: item.uid,
        name: item.name,
        description: `Sketchfab 3D Model: ${item.name}`,
        sketchfabId: item.uid
      }));
      
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const displayModels = showSearchResults && searchQuery ? searchResults : [...scienceModels, ...searchResults];

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100vh', backgroundColor: '#2f2a27', color: 'white', overflow: 'hidden', fontFamily: 'sans-serif' }}>
      
      {/* Sidebar / Top Menu */}
      {isMobile ? (
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', backgroundColor: '#241f1c', borderBottom: '1px solid #3a3532', zIndex: 20 }}>
          <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #3a3532' }}>
            <button 
              onClick={() => router.push('/student-dashboard')}
              style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: '#8d847c', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
            >
              <ArrowLeft style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }} />
              Dashboard
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Beaker style={{ width: '1.25rem', height: '1.25rem', color: '#eb7c6b' }} />
              <h1 style={{ fontSize: '1rem', fontWeight: 500, margin: 0 }}>Science Lab</h1>
            </div>
          </div>
          
          <div style={{ padding: '0.5rem 1rem' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                placeholder="Search models... (e.g. DNA)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #3a3532', backgroundColor: '#1f1a18', color: 'white' }}
              />
              <button type="submit" style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: '#eb7c6b', border: 'none', color: 'white', cursor: 'pointer' }}>
                <Search style={{ width: '1rem', height: '1rem' }} />
              </button>
            </form>
          </div>
          
          <div style={{ display: 'flex', overflowX: 'auto', padding: '0.75rem', gap: '0.5rem', whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch' }}>
            {isSearching ? (
               <div style={{ padding: '0.5rem 1rem', color: '#8d847c' }}><Loader2 className="animate-spin" style={{width:'1rem',height:'1rem'}} /></div>
            ) : displayModels.length === 0 ? (
               <div style={{ padding: '0.5rem 1rem', color: '#8d847c' }}>No results</div>
            ) : displayModels.map(model => {
              const isSelected = selectedModel.id === model.id;
              return (
                <button
                  key={model.id}
                  onClick={() => { setSelectedModel(model); setActiveHotspot(null); }}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '9999px',
                    border: '1px solid',
                    borderColor: isSelected ? '#eb7c6b' : '#3a3532',
                    backgroundColor: isSelected ? 'rgba(235, 124, 107, 0.1)' : 'transparent',
                    color: isSelected ? '#eb7c6b' : '#8d847c',
                    cursor: 'pointer',
                    fontWeight: isSelected ? 500 : 400,
                    transition: 'all 0.2s'
                  }}
                >
                  {model.name}
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <aside style={{ 
          width: '320px', 
          height: '100%', 
          backgroundColor: '#241f1c', 
          borderRight: '1px solid #3a3532',
          display: 'flex', 
          flexDirection: 'column', 
          zIndex: 20, 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', 
          position: 'relative',
          flexShrink: 0
        }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #3a3532', backgroundColor: '#1f1a18', flexShrink: 0 }}>
            <button 
              onClick={() => router.push('/student-dashboard')}
              style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: '#8d847c', cursor: 'pointer', marginBottom: '1.5rem', background: 'none', border: 'none', padding: 0 }}
              onMouseOver={(e) => e.currentTarget.style.color = 'white'}
              onMouseOut={(e) => e.currentTarget.style.color = '#8d847c'}
            >
              <ArrowLeft style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
              Back to Dashboard
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', backgroundColor: '#3a3532', borderRadius: '0.5rem', color: '#eb7c6b' }}>
                <Beaker style={{ width: '1.5rem', height: '1.5rem' }} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 500, margin: 0, letterSpacing: '-0.025em' }}>Science Lab</h1>
                <p style={{ fontSize: '0.875rem', color: '#8d847c', margin: '0.125rem 0 0 0' }}>Explore 3D Models</p>
              </div>
            </div>
            
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
              <input 
                type="text" 
                placeholder="Search anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #3a3532', backgroundColor: '#241f1c', color: 'white', fontSize: '0.875rem' }}
              />
              <button type="submit" style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#eb7c6b', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Search style={{ width: '1.25rem', height: '1.25rem' }} />
              </button>
            </form>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {isSearching ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem', color: '#8d847c' }}>
                <Loader2 className="animate-spin" style={{ width: '1.5rem', height: '1.5rem' }} />
              </div>
            ) : displayModels.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '2rem', color: '#8d847c' }}>No models found</div>
            ) : displayModels.map((model) => {
              const isSelected = selectedModel.id === model.id;
              return (
                <button
                  key={model.id}
                  onClick={() => { setSelectedModel(model); setActiveHotspot(null); }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: isSelected ? '#3a3532' : 'transparent',
                    color: isSelected ? 'white' : '#8d847c',
                    boxShadow: isSelected ? 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)' : 'none'
                  }}
                  onMouseOver={(e) => { if (!isSelected) { e.currentTarget.style.backgroundColor = '#2f2a27'; e.currentTarget.style.color = '#d4ccc6'; } }}
                  onMouseOut={(e) => { if (!isSelected) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#8d847c'; } }}
                >
                  <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '0.5rem' }}>
                    {model.name}
                  </div>
                  <ChevronRight style={{ width: '1rem', height: '1rem', opacity: isSelected ? 1 : 0.5, color: isSelected ? '#eb7c6b' : 'currentColor', flexShrink: 0 }} />
                </button>
              );
            })}
          </div>
        </aside>
      )}

      {/* Main Viewer Area */}
      <main style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', backgroundColor: '#2f2a27' }}>
        {/* Top Bar with Description */}
        <header style={{ position: isMobile ? 'relative' : 'absolute', top: 0, left: 0, right: 0, padding: isMobile ? '1rem' : '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 10, pointerEvents: 'none' }}>
          <div style={{ maxWidth: '42rem', width: '100%', backgroundColor: 'rgba(31, 26, 24, 0.8)', backdropFilter: 'blur(12px)', padding: isMobile ? '1rem' : '1.5rem', borderRadius: '1rem', border: '1px solid #3a3532', pointerEvents: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <h2 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 300, letterSpacing: '0.025em', color: 'white', margin: '0 0 0.5rem 0' }}>
              {activeHotspot ? activeHotspot.title : selectedModel.name}
            </h2>
            <p style={{ color: '#a49a92', lineHeight: 1.6, fontSize: '0.875rem', margin: 0 }}>
              {activeHotspot ? activeHotspot.description : selectedModel.description}
            </p>
          </div>
        </header>

        {/* 3D Canvas / Sketchfab */}
        <div style={{ flex: 1, width: '100%', height: '100%' }}>
          {selectedModel.sketchfabId ? (
            <div style={{ width: '100%', height: '100%', borderRadius: '12px', overflow: 'hidden' }}>
              <iframe 
                title={selectedModel.name}
                style={{ width: '100%', height: '100%', border: 'none' }}
                allowFullScreen 
                allow="autoplay; fullscreen; xr-spatial-tracking" 
                execution-while-out-of-viewport="true" 
                execution-while-not-rendered="true" 
                web-share="true" 
                src={`https://sketchfab.com/models/${selectedModel.sketchfabId}/embed?autostart=1&ui_theme=dark`}
              ></iframe>
            </div>
          ) : (
            <ModelViewer 
              fileUrl={selectedModel.fileUrl || ""} 
              scale={selectedModel.scale} 
              cameraPosition={selectedModel.cameraPosition}
              hotspots={selectedModel.hotspots}
              onHotspotClick={setActiveHotspot}
            />
          )}
        </div>
      </main>
    </div>
  );
}
