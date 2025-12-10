import React, { useState } from 'react';
import Layout from './components/Layout';
import Scanner from './components/Scanner';
import ResultsDashboard from './components/ResultsDashboard';
import { ScanSession } from './types';

const App: React.FC = () => {
  const [currentSession, setCurrentSession] = useState<ScanSession | null>(null);

  const handleScanComplete = (session: ScanSession) => {
    setCurrentSession(session);
  };

  const handleReset = () => {
    setCurrentSession(null);
  };

  return (
    <Layout>
      {currentSession && currentSession.status === 'complete' && currentSession.result ? (
        <ResultsDashboard session={currentSession} onReset={handleReset} />
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Top Bar for Dashboard Home */}
          {!currentSession && (
             <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
                  <p className="text-slate-500 text-sm">Welcome back, initiate a new audit below.</p>
                </div>
                <div className="flex space-x-3">
                   <button className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                     View History
                   </button>
                   <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm shadow-indigo-200">
                     New Project
                   </button>
                </div>
             </div>
          )}
          
          <div className="flex-1 flex items-center justify-center bg-slate-50/50 relative overflow-hidden">
             {/* Decorative background blobs */}
             <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-200/30 rounded-full blur-[100px] pointer-events-none" />
             <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-200/30 rounded-full blur-[100px] pointer-events-none" />
             
             <div className="z-10 w-full">
               <Scanner onScanComplete={handleScanComplete} />
             </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
