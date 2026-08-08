"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Beaker, ChevronRight } from "lucide-react";
import { scienceModels, type ScienceModel, type Hotspot } from "../../lib/science/science-data";
import { ModelViewer } from "./ModelViewer";
import { useRouter } from "next/navigation";

export function ScienceApp() {
  const router = useRouter();
  const [selectedModel, setSelectedModel] = useState<ScienceModel>(scienceModels[0]);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);

  // Mobile detection state for responsive design
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
          
          <div style={{ display: 'flex', overflowX: 'auto', padding: '0.75rem', gap: '0.5rem', whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch' }}>
            {scienceModels.map(model => {
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
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {scienceModels.map((model) => {
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
                  <div style={{ fontWeight: 500 }}>
                    {model.name}
                  </div>
                  <ChevronRight style={{ width: '1rem', height: '1rem', opacity: isSelected ? 1 : 0.5, color: isSelected ? '#eb7c6b' : 'currentColor' }} />
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
