'use client';

import { useState } from 'react';
import CallHistory from '@/components/CallHistory';
import CallDetailModal from '@/components/CallDetailModal';
import type { Call } from '@/types/calls';

export default function CallsPage() {
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [showCallDetail, setShowCallDetail] = useState(false);

  const handleCallSelect = (call: Call) => {
    setSelectedCall(call);
    setShowCallDetail(true);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.07] via-transparent to-transparent"></div>
        
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-emerald-400/5 blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-3/4 left-1/2 w-48 h-48 rounded-full bg-emerald-600/8 blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <CallHistory onCallSelect={handleCallSelect} />
      </div>

      {/* Call Detail Modal */}
      {selectedCall && (
        <CallDetailModal
          call={selectedCall}
          isOpen={showCallDetail}
          onClose={() => {
            setShowCallDetail(false);
            setSelectedCall(null);
          }}
        />
      )}
    </div>
  );
}