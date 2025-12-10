import React, { useState } from 'react';
import { ScanSession, Detection } from '../types';
import { 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  Download, 
  Info, 
  ArrowLeft, 
  BrainCircuit,
  Gavel,
  Lightbulb,
  Globe
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ResultsDashboardProps {
  session: ScanSession;
  onReset: () => void;
}

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ session, onReset }) => {
  const { result, imageUrl, sourceUrl } = session;
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);

  if (!result) return null;

  // Calculate coordinates for overlay
  const getBoxStyle = (box: number[]) => {
    // Box is [ymin, xmin, ymax, xmax] in 0-1000 scale
    const [ymin, xmin, ymax, xmax] = box;
    return {
      top: `${ymin / 10}%`,
      left: `${xmin / 10}%`,
      height: `${(ymax - ymin) / 10}%`,
      width: `${(xmax - xmin) / 10}%`,
    };
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'bg-red-500 border-red-600';
      case 'medium': return 'bg-amber-500 border-amber-600';
      case 'low': return 'bg-yellow-400 border-yellow-500';
      default: return 'bg-slate-400 border-slate-500';
    }
  };
  
  const getSeverityBg = (severity: string) => {
     switch (severity.toLowerCase()) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200';
      case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'low': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const trustData = [
    { name: 'Trust', value: result.overallTrustScore },
    { name: 'Risk', value: 100 - result.overallTrustScore },
  ];
  
  const COLORS = ['#10b981', '#f43f5e'];

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onReset}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">UX Audit Report</h1>
            <div className="flex items-center space-x-2 text-sm text-slate-500">
              <span>Session ID: {session.id.slice(0, 8)}</span>
              {sourceUrl && (
                <>
                  <span className="w-1 h-1 bg-slate-300 rounded-full" />
                  <div className="flex items-center text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    <Globe className="w-3 h-3 mr-1" />
                    <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="max-w-[200px] truncate hover:underline" title={sourceUrl}>
                      {sourceUrl}
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => window.print()} 
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
          
          {/* Left Column: Image & Overlay */}
          <div className="col-span-12 lg:col-span-7 flex flex-col space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
              <div className="absolute top-4 left-4 z-10 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                Analyzed Viewport
              </div>
              <div className="relative w-full">
                <img 
                  src={imageUrl} 
                  alt="Analyzed Screenshot" 
                  className="w-full h-auto block"
                />
                {/* Bounding Boxes */}
                {result.detections.map((detection, idx) => (
                  <div
                    key={detection.id || idx}
                    className={`absolute border-2 transition-all duration-200 cursor-pointer ${
                      selectedDetection?.id === detection.id 
                        ? 'bg-red-500/20 border-red-500 z-10 shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                        : 'border-red-500/60 hover:bg-red-500/10 hover:border-red-500'
                    }`}
                    style={getBoxStyle(detection.boundingBox)}
                    onClick={() => setSelectedDetection(detection)}
                  >
                    <div className="absolute -top-7 left-0 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded shadow-sm font-bold uppercase tracking-wider whitespace-nowrap">
                      {detection.patternName}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Analysis Summary Card */}
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
               <h3 className="text-lg font-bold text-slate-800 mb-4">Executive Summary</h3>
               <p className="text-slate-600 leading-relaxed text-sm">
                 {result.executiveSummary}
               </p>
               
               {result.regulatoryRisks.length > 0 && (
                 <div className="mt-4 pt-4 border-t border-slate-100">
                   <h4 className="text-sm font-semibold text-slate-800 mb-2 flex items-center">
                     <Gavel className="w-4 h-4 mr-2 text-indigo-600" />
                     Regulatory Exposure
                   </h4>
                   <ul className="space-y-1">
                     {result.regulatoryRisks.map((risk, i) => (
                       <li key={i} className="text-xs text-slate-500 flex items-start">
                         <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 mr-2 flex-shrink-0" />
                         {risk}
                       </li>
                     ))}
                   </ul>
                 </div>
               )}
             </div>
          </div>

          {/* Right Column: Details & Scores */}
          <div className="col-span-12 lg:col-span-5 flex flex-col space-y-6">
            
            {/* Scores */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
                <div className="relative w-24 h-24 mb-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={trustData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={45}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                      >
                        {trustData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-2xl font-bold text-slate-800">{result.overallTrustScore}</span>
                  </div>
                </div>
                <span className="text-sm font-medium text-slate-500">Trust Score</span>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <AlertTriangle className="w-24 h-24 text-red-500" />
                </div>
                <span className={`text-4xl font-bold mb-1 ${result.darkPatternRiskScore > 50 ? 'text-red-600' : 'text-amber-500'}`}>
                  {result.darkPatternRiskScore}
                </span>
                <span className="text-sm font-medium text-slate-500">Dark Pattern Risk</span>
                <div className="mt-2 text-xs text-center text-slate-400 px-2">
                  Based on pattern severity and frequency
                </div>
              </div>
            </div>

            {/* Detections List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col min-h-[400px]">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Detected Patterns ({result.detections.length})</h3>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                  Select a pattern to view details
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {selectedDetection ? (
                  <div className="p-0">
                    <button 
                      onClick={() => setSelectedDetection(null)}
                      className="flex items-center text-sm text-indigo-600 font-medium p-4 hover:underline"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" /> Back to list
                    </button>
                    
                    <div className="px-5 pb-5">
                      <div className="flex items-center justify-between mb-4">
                         <h2 className="text-lg font-bold text-slate-900">{selectedDetection.patternName}</h2>
                         <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${
                           selectedDetection.severity === 'High' ? 'bg-red-100 text-red-700' : 
                           selectedDetection.severity === 'Medium' ? 'bg-amber-100 text-amber-700' : 
                           'bg-yellow-100 text-yellow-700'
                         }`}>
                           {selectedDetection.severity} Severity
                         </span>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                           <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Description</h4>
                           <p className="text-sm text-slate-700">{selectedDetection.description}</p>
                        </div>

                        <div>
                           <div className="flex items-center mb-2">
                              <BrainCircuit className="w-4 h-4 text-purple-600 mr-2" />
                              <h4 className="text-sm font-bold text-slate-800">Psychological Mechanics</h4>
                           </div>
                           <div className="pl-6 space-y-2">
                             <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                               <span className="text-slate-500">Cognitive Bias:</span>
                               <span className="font-medium text-slate-800">{selectedDetection.psychology.bias}</span>
                               <span className="text-slate-500">Emotion:</span>
                               <span className="font-medium text-slate-800">{selectedDetection.psychology.emotion}</span>
                               <span className="text-slate-500">Effect:</span>
                               <span className="text-slate-700">{selectedDetection.psychology.effect}</span>
                             </div>
                           </div>
                        </div>

                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                           <div className="flex items-center mb-3">
                              <Lightbulb className="w-4 h-4 text-indigo-600 mr-2" />
                              <h4 className="text-sm font-bold text-indigo-900">Ethical Redesign</h4>
                           </div>
                           <p className="text-sm text-indigo-800 mb-3 font-medium">
                             "{selectedDetection.redesign.suggestion}"
                           </p>
                           <div className="flex flex-wrap gap-2">
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-white text-indigo-600 border border-indigo-200">
                                {selectedDetection.redesign.principle}
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-white text-green-600 border border-green-200">
                                {selectedDetection.redesign.impact}
                              </span>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {result.detections.map((detection) => (
                      <div 
                        key={detection.id}
                        onClick={() => setSelectedDetection(detection)}
                        className="p-4 hover:bg-slate-50 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-semibold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                            {detection.patternName}
                          </h4>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${getSeverityBg(detection.severity)}`}>
                            {detection.severity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                          {detection.description}
                        </p>
                        <div className="flex items-center text-xs text-slate-400">
                           <BrainCircuit className="w-3 h-3 mr-1" />
                           {detection.psychology.bias}
                        </div>
                      </div>
                    ))}
                    
                    {result.detections.length === 0 && (
                       <div className="p-8 text-center text-slate-500">
                         <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                         <p>No dark patterns detected!</p>
                       </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsDashboard;