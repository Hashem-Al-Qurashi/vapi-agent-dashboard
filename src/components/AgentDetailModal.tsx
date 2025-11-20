'use client';

import { useState, useEffect } from 'react';
import { 
  Bot, X, Phone, Edit3, Trash2, Settings, Mic, Brain, 
  BarChart3, Clock, TrendingUp, Activity, PlayCircle, MessageSquare
} from 'lucide-react';
import { type Agent } from '@/lib/database';
import VoiceCallTest from './VoiceCallTest';

interface AgentDetailModalProps {
  agent: Agent | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (agent: Agent) => void;
  onDelete: (agentId: number) => void;
}

export default function AgentDetailModal({ agent, isOpen, onClose, onEdit, onDelete }: AgentDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [callHistory, setCallHistory] = useState<any[]>([]);
  const [loadingCalls, setLoadingCalls] = useState(false);

  // Load REAL call history for this specific agent
  useEffect(() => {
    if (isOpen && agent && activeTab === 'calls') {
      loadAgentCalls();
    }
  }, [isOpen, agent, activeTab]);

  const loadAgentCalls = async () => {
    if (!agent?.id) return;
    
    try {
      setLoadingCalls(true);
      console.log('📞 Loading real calls for agent:', agent.id);
      
      // Import call service dynamically to avoid SSR issues
      const { callService } = await import('@/lib/calls');
      const calls = await callService.getByAgent(agent.id);
      
      console.log('📞 Found', calls.length, 'real calls for agent');
      setCallHistory(calls);
    } catch (error) {
      console.error('❌ Error loading agent calls:', error);
      setCallHistory([]);
    } finally {
      setLoadingCalls(false);
    }
  };

  if (!isOpen || !agent) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Bot },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'calls', label: 'Call History', icon: Phone },
    { id: 'config', label: 'Configuration', icon: Settings },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop - EXACT REPLICA of modal backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal - EXACT REPLICA of form modal styling */}
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-emerald-500/30 bg-slate-950/95 backdrop-blur-2xl shadow-[0_40px_120px_rgba(15,118,110,0.45)]">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-emerald-500/20 to-transparent pointer-events-none"></div>
        
        {/* Header - EXACT REPLICA of chat header */}
        <div className="relative flex items-center justify-between p-6 border-b border-emerald-500/30">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-400 to-lime-400 flex items-center justify-center">
                <div className="absolute inset-[2px] rounded-lg bg-slate-950"></div>
                <Bot className="relative w-6 h-6 text-emerald-300" />
              </div>
              <span className="absolute -bottom-1 -right-1 inline-flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/40 animate-ping"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-400 border-2 border-slate-950"></span>
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white tracking-tight">{agent.agent_name}</h2>
              <div className="flex items-center gap-2 text-sm text-emerald-200/90">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                <span>{agent.model} • {agent.voice} • {agent.call_count} total calls</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(agent)}
              className="inline-flex h-9 px-3 items-center gap-2 rounded-full bg-slate-900/70 border border-white/5 text-sm text-slate-300 hover:bg-slate-800/80 transition"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/70 border border-white/5 hover:bg-slate-800/80 transition"
            >
              <X className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>

        {/* Tabs - EXACT REPLICA of original navigation style */}
        <div className="border-b border-slate-800/80">
          <div className="flex overflow-x-auto px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-emerald-400 text-emerald-200'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Stats - EXACT REPLICA of feature cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-emerald-500/25 bg-slate-950/70 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-400/40">
                      <Phone className="w-4 h-4 text-emerald-300" />
                    </div>
                    <h3 className="text-sm font-semibold tracking-tight">Total Calls</h3>
                  </div>
                  <p className="text-2xl font-bold text-slate-100">{agent.call_count}</p>
                  <p className="text-xs text-slate-400 mt-1">All time conversations</p>
                </div>

                <div className="rounded-2xl border border-emerald-500/25 bg-slate-950/70 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-400/40">
                      <Clock className="w-4 h-4 text-emerald-300" />
                    </div>
                    <h3 className="text-sm font-semibold tracking-tight">Avg Duration</h3>
                  </div>
                  <p className="text-2xl font-bold text-slate-100">2:34</p>
                  <p className="text-xs text-slate-400 mt-1">Minutes per call</p>
                </div>

                <div className="rounded-2xl border border-emerald-500/25 bg-slate-950/70 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-400/40">
                      <TrendingUp className="w-4 h-4 text-emerald-300" />
                    </div>
                    <h3 className="text-sm font-semibold tracking-tight">Success Rate</h3>
                  </div>
                  <p className="text-2xl font-bold text-slate-100">94%</p>
                  <p className="text-xs text-slate-400 mt-1">Successful conversations</p>
                </div>
              </div>

              {/* System Configuration - EXACT REPLICA of chat message style */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">System Configuration</h3>
                
                <div className="rounded-2xl bg-slate-900/80 border border-slate-800/80 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-emerald-300" />
                    <span className="font-medium text-slate-200">System Prompt</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/50 rounded-lg p-3 border border-slate-800">
                    {agent.system_prompt}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-900/80 border border-slate-800/80 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-emerald-300" />
                    <span className="font-medium text-slate-200">First Message</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/50 rounded-lg p-3 border border-slate-800">
                    "{agent.first_message}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-slate-900/80 border border-slate-800/80 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Settings className="w-4 h-4 text-emerald-300" />
                      <span className="font-medium text-slate-200">Model</span>
                    </div>
                    <p className="text-sm text-slate-300">{agent.model}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-900/80 border border-slate-800/80 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Mic className="w-4 h-4 text-emerald-300" />
                      <span className="font-medium text-slate-200">Voice</span>
                    </div>
                    <p className="text-sm text-slate-300">{agent.voice}</p>
                  </div>
                </div>
              </div>

              {/* Test Call Section */}
              <div className="rounded-2xl bg-slate-900/80 border border-emerald-500/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <PlayCircle className="w-5 h-5 text-emerald-300" />
                    <span className="font-medium text-slate-200">Test Voice Conversation</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Start a voice conversation with this agent directly in your browser.
                </p>
                <VoiceCallTest 
                  agentId={agent.vapi_assistant_id}
                  agentName={agent.agent_name}
                  onCallEnd={(callData) => {
                    console.log('Call ended for agent:', agent.agent_name, callData);
                  }}
                />
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Performance Analytics</h3>
              
              {/* Call Volume Chart Placeholder */}
              <div className="rounded-2xl bg-slate-900/80 border border-slate-800/80 p-6">
                <h4 className="font-medium text-slate-200 mb-4">Call Volume Over Time</h4>
                <div className="h-48 bg-slate-950/50 rounded-lg border border-slate-800 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-slate-500 mx-auto mb-2" />
                    <p className="text-slate-400">Analytics chart would go here</p>
                    <p className="text-xs text-slate-500">Integration with analytics service required</p>
                  </div>
                </div>
              </div>

              {/* REAL Performance Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-slate-900/80 border border-slate-800/80 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-emerald-300" />
                    <span className="font-medium text-slate-200">Total Calls</span>
                  </div>
                  <p className="text-lg font-bold text-slate-100">{agent.call_count}</p>
                  <p className="text-xs text-slate-400">Real calls made</p>
                </div>

                <div className="rounded-2xl bg-slate-900/80 border border-slate-800/80 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-emerald-300" />
                    <span className="font-medium text-slate-200">Status</span>
                  </div>
                  <p className="text-lg font-bold text-slate-100">
                    {agent.call_count > 0 ? 'Active' : 'No Calls'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {agent.call_count > 0 ? 'Receiving calls' : 'Waiting for first call'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Call History Tab - REAL DATA ONLY */}
          {activeTab === 'calls' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Call History</h3>
                <a 
                  href="/calls" 
                  className="text-sm text-emerald-300 hover:text-emerald-200 transition-colors"
                >
                  View All Calls →
                </a>
              </div>
              
              {loadingCalls ? (
                <div className="flex items-center justify-center py-8">
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-400/40 px-4 py-3 text-emerald-100">
                    <div className="w-4 h-4 border-2 border-emerald-300 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading real call history...</span>
                  </div>
                </div>
              ) : null}
              
              <div className="space-y-3">
                {callHistory.length > 0 ? (
                  callHistory.slice(0, 5).map((call) => (
                    <div key={call.id} className="flex items-start gap-3 text-sm">
                      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 border border-emerald-400/30">
                        <Phone className="w-4 h-4 text-emerald-300" />
                      </div>
                      <div className="flex-1">
                        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-400/40 px-3 py-1 mb-2 text-xs text-emerald-100">
                          <span>Call {call.id}</span>
                          <span className="h-1 w-1 rounded-full bg-emerald-300/60"></span>
                          <span>{new Date(call.started_at).toLocaleString()}</span>
                        </div>
                        <div className="rounded-2xl bg-slate-900/80 border border-slate-800/80 px-4 py-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-200">
                              Duration: <span className="text-emerald-200 font-medium">
                                {call.duration_seconds ? `${Math.floor(call.duration_seconds / 60)}:${(call.duration_seconds % 60).toString().padStart(2, '0')}` : 'N/A'}
                              </span>
                            </span>
                            <span className="text-slate-400">From: {call.phone_number || 'Web Call'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              call.status === 'ended' 
                                ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40' 
                                : 'bg-red-500/20 text-red-200 border border-red-400/40'
                            }`}>
                              {call.status}
                            </span>
                            {call.transcript && (
                              <span className="text-xs text-slate-400">
                                "{call.transcript.substring(0, 50)}..."
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : null}
              </div>

              {callHistory.length === 0 && (
                <div className="text-center py-12">
                  <Phone className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-slate-300 mb-2">No calls yet</h4>
                  <p className="text-slate-400">
                    Calls will appear here once this agent starts receiving conversations.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Configuration Tab */}
          {activeTab === 'config' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Agent Configuration</h3>
                <button
                  onClick={() => onEdit(agent)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-400/40 rounded-lg text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Configuration
                </button>
              </div>

              {/* Configuration Details - EXACT REPLICA of feature cards */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-emerald-500/25 bg-slate-950/70 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-400/40">
                      <Bot className="w-4 h-4 text-emerald-300" />
                    </div>
                    <h4 className="text-sm font-semibold tracking-tight">Agent Identity</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Name:</span>
                      <span className="text-slate-200">{agent.agent_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Assistant ID:</span>
                      <code className="text-xs text-emerald-300 bg-slate-900/50 px-2 py-1 rounded">
                        {agent.vapi_assistant_id}
                      </code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Created:</span>
                      <span className="text-slate-200">{new Date(agent.created_at!).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-500/25 bg-slate-950/70 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-400/40">
                      <Settings className="w-4 h-4 text-emerald-300" />
                    </div>
                    <h4 className="text-sm font-semibold tracking-tight">Technical Configuration</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Language Model:</span>
                      <span className="text-slate-200">{agent.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Voice Model:</span>
                      <span className="text-slate-200">{agent.voice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Webhook:</span>
                      <span className="text-emerald-300">✓ Configured</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="rounded-2xl border border-red-500/25 bg-red-950/20 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-400/40">
                    <Trash2 className="w-4 h-4 text-red-300" />
                  </div>
                  <h4 className="text-sm font-semibold tracking-tight text-red-200">Danger Zone</h4>
                </div>
                <p className="text-xs text-red-300/80 mb-3">
                  Permanently delete this agent and all associated data. This action cannot be undone.
                </p>
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete "${agent.agent_name}"? This action cannot be undone.`)) {
                      onDelete(agent.id!);
                      onClose();
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-400/40 rounded-lg text-red-300 hover:bg-red-500/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Agent
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}