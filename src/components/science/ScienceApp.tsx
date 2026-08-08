"use client";

import { useState } from "react";
import { ArrowLeft, Beaker, ChevronRight } from "lucide-react";
import { scienceModels, type ScienceModel } from "../../lib/science/science-data";
import { ModelViewer } from "./ModelViewer";
import { useRouter } from "next/navigation";

export function ScienceApp() {
  const router = useRouter();
  const [selectedModel, setSelectedModel] = useState<ScienceModel>(scienceModels[0]);

  return (
    <div className="flex h-screen bg-[#2f2a27] text-white overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-80 bg-[#241f1c] border-r border-[#3a3532] flex flex-col z-20 shadow-2xl relative">
        <div className="p-6 border-b border-[#3a3532] shrink-0 bg-[#1f1a18]">
          <button 
            onClick={() => router.push('/student-dashboard')}
            className="flex items-center text-sm text-[#8d847c] hover:text-white transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#3a3532] rounded-lg text-[#eb7c6b]">
              <Beaker className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-medium tracking-tight">Science Lab</h1>
              <p className="text-sm text-[#8d847c] mt-0.5">Explore 3D Models</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {scienceModels.map((model) => (
            <button
              key={model.id}
              onClick={() => setSelectedModel(model)}
              className={`w-full text-left p-4 rounded-xl transition-all duration-200 group flex items-center justify-between ${
                selectedModel.id === model.id
                  ? "bg-[#3a3532] text-white shadow-inner"
                  : "hover:bg-[#2f2a27] text-[#8d847c] hover:text-[#d4ccc6]"
              }`}
            >
              <div>
                <div className={`font-medium mb-1 transition-colors ${
                  selectedModel.id === model.id ? "text-white" : "group-hover:text-white"
                }`}>
                  {model.name}
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${
                selectedModel.id === model.id ? "text-[#eb7c6b] translate-x-1" : "opacity-0 group-hover:opacity-100 group-hover:translate-x-1"
              }`} />
            </button>
          ))}
        </div>
      </aside>

      {/* Main Viewer Area */}
      <main className="flex-1 relative flex flex-col bg-[#2f2a27]">
        {/* Top Bar with Description */}
        <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10 pointer-events-none">
          <div className="max-w-2xl bg-[#1f1a18]/80 backdrop-blur-md p-6 rounded-2xl border border-[#3a3532] pointer-events-auto shadow-2xl">
            <h2 className="text-2xl font-light tracking-wide text-white mb-2">
              {selectedModel.name}
            </h2>
            <p className="text-[#a49a92] leading-relaxed text-sm">
              {selectedModel.description}
            </p>
          </div>
        </header>

        {/* 3D Canvas */}
        <div className="flex-1 w-full h-full">
          <ModelViewer 
            fileUrl={selectedModel.fileUrl} 
            scale={selectedModel.scale} 
            cameraPosition={selectedModel.cameraPosition} 
          />
        </div>
      </main>
    </div>
  );
}
