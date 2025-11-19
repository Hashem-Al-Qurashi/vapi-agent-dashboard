'use client';

import { useState } from 'react';
import { Bot } from 'lucide-react';
import CallHistory from '@/components/CallHistory';
import CallDetailModal from '@/components/CallDetailModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { Call } from '@/types/calls';

export default function CallsPage() {
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [showCallDetail, setShowCallDetail] = useState(false);

  const handleCallSelect = (call: Call) => {
    setSelectedCall(call);
    setShowCallDetail(true);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-950">
        {/* Background effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.07] via-transparent to-transparent"></div>
          
          {/* Floating orbs */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-emerald-400/5 blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-3/4 left-1/2 w-48 h-48 rounded-full bg-emerald-600/8 blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
        </div>

        {/* Navigation Header - Matches main dashboard */}
        <header className="relative border-b border-white/[0.08] backdrop-blur-xl z-50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <a href="/" className="flex items-center gap-3">
                <div className="relative h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-400 to-lime-400 flex items-center justify-center">
                  <div className="absolute inset-[2px] rounded-lg bg-slate-950"></div>
                  <Bot className="relative w-4 h-4 text-emerald-300" />
                </div>
                <span className="text-base sm:text-lg font-semibold tracking-tight">
                  VapiChat
                </span>
              </a>

              <nav className="hidden lg:flex items-center gap-7 text-xs sm:text-sm text-slate-300/80">
                <a href="/#product" className="hover:text-white transition">Agents</a>
                <a href="/calls" className="text-emerald-300 font-medium">Call History</a>
                <a href="/#workspaces" className="hover:text-white transition">Analytics</a>
                <a href="/#features" className="hover:text-white transition">Settings</a>
                <a href="/#pricing" className="hover:text-white transition">Billing</a>
              </nav>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="relative z-10 pt-6">
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
    </ErrorBoundary>
  );
}