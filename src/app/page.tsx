'use client';

import { useState, useEffect } from 'react';
import { Bot, Plus, Search, Settings, Phone, BarChart3, Sparkles, Clock, Filter, Grid, List } from 'lucide-react';
import { agentService, type Agent } from '@/lib/database';
import CreateAgentForm, { type AgentFormData } from '@/components/CreateAgentForm';
import VisualAgentBuilder from '@/components/VisualAgentBuilder';
import AgentDetailModal from '@/components/AgentDetailModal';

export default function OptimizedVapiDashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModel, setFilterModel] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showVisualBuilder, setShowVisualBuilder] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showAgentDetail, setShowAgentDetail] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [vapi, setVapi] = useState<any>(null);
  const [activeCall, setActiveCall] = useState<string | null>(null);

  // Load agents
  useEffect(() => {
    agentService.getAll().then(setAgents).catch(console.error).finally(() => setLoading(false));
  }, []);

  // Initialize Vapi SDK
  useEffect(() => {
    import('@vapi-ai/web').then(VapiModule => {
      const Vapi = VapiModule.Vapi || VapiModule.default;
      if (Vapi) {
        const instance = new Vapi('bd62d6e3-2281-4307-bb87-a3c59ddb52ce');
        instance.on('call-end', () => setActiveCall(null));
        setVapi(instance);
      }
    }).catch(() => {
      setVapi({ start: () => alert('Voice testing (demo mode)'), stop: () => setActiveCall(null) });
    });
  }, []);

  // Filter agents
  useEffect(() => {
    let filtered = agents.filter(agent => {
      const matchesSearch = !searchTerm || agent.agent_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesModel = !filterModel || agent.model === filterModel;
      return matchesSearch && matchesModel;
    });
    setFilteredAgents(filtered);
  }, [agents, searchTerm, filterModel]);

  const handleCreateAgent = async (formData: AgentFormData) => {
    const response = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (response.ok) {
      const newAgents = await agentService.getAll();
      setAgents(newAgents);
    }
  };

  const handleTestCall = async (agent: Agent) => {
    if (!vapi) return;
    if (activeCall) {
      vapi.stop();
      setActiveCall(null);
    } else {
      setActiveCall(agent.vapi_assistant_id);
      await vapi.start(agent.vapi_assistant_id);
    }
  };

  const displayAgents = filteredAgents.length > 0 ? filteredAgents : agents;

  return (
    <div className="min-h-screen bg-black text-slate-50">
      {/* Floating Background */}
      <div className="fixed top-0 w-full h-screen overflow-hidden pointer-events-none" style={{zIndex: 999}}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute', width: '100px', height: '100px', background: '#10b981', borderRadius: '50%', 
            opacity: 0.3, filter: 'blur(8px)', 
            top: `${20 + i * 15}%`, left: `${10 + i * 15}%`, 
            animation: `circle-float ${20 + i * 5}s ease-in-out infinite ${i % 2 ? 'reverse' : ''}`
          }} />
        ))}
      </div>

      {/* Background Gradients */}
      <div className="absolute inset-0 -z-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-slate-950 to-emerald-900"></div>
        <div className="absolute -top-1/4 -left-1/4 w-[45rem] h-[45rem] bg-emerald-500/20 blur-3xl rounded-full mix-blend-screen"></div>
        <div className="absolute top-1/3 -right-1/3 w-[40rem] h-[40rem] bg-lime-400/20 blur-3xl rounded-full mix-blend-screen"></div>
      </div>

      {/* Navigation */}
      <header className="fixed z-30 bg-slate-900/60 w-full top-0 backdrop-blur-2xl border-b border-emerald-500/10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="relative h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-400 to-lime-400 flex items-center justify-center">
                <div className="absolute inset-[2px] rounded-lg bg-slate-950"></div>
                <Bot className="relative w-4 h-4 text-emerald-300" />
              </div>
              <span className="text-lg font-semibold tracking-tight">VapiChat</span>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Stats in Navigation */}
              <div className="hidden md:flex items-center gap-6 text-sm text-slate-300/80">
                <span className="flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-emerald-300" />
                  {displayAgents.length} agents
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-300" />
                  {displayAgents.reduce((sum, agent) => sum + agent.call_count, 0)} calls
                </span>
              </div>
              
              <button 
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-400 text-slate-950 rounded-xl font-medium hover:bg-emerald-300 transition-all"
              >
                <Plus className="w-4 h-4" />
                New Agent
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-20 px-6">
        <div className="mx-auto max-w-7xl">
          
          {/* Clean Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-white mb-2">Voice AI Agents</h1>
            <p className="text-slate-400">Manage and test your intelligent voice assistants</p>
          </div>

          {/* Action Bar - Apple-style */}
          <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-700/50 rounded-xl text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all backdrop-blur-xl"
              />
            </div>
            
            {/* Filters & View Controls */}
            <div className="flex items-center gap-3">
              <select
                value={filterModel}
                onChange={(e) => setFilterModel(e.target.value)}
                className="px-3 py-2.5 bg-slate-900/60 border border-slate-700/50 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all backdrop-blur-xl"
              >
                <option value="">All Models</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5</option>
              </select>

              <div className="flex bg-slate-900/60 border border-slate-700/50 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-slate-300'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-slate-300'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <button 
                onClick={() => setShowVisualBuilder(true)}
                className="px-3 py-2.5 bg-slate-900/60 border border-slate-700/50 rounded-xl text-slate-300 hover:text-emerald-300 hover:border-emerald-400/50 transition-all"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Agent Grid/List - Clean and Focused */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-slate-400">Loading agents...</div>
            </div>
          ) : displayAgents.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-slate-300 mb-2">No agents found</h3>
              <p className="text-slate-400 mb-6">Create your first voice AI agent to get started</p>
              <button 
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-400 text-slate-950 rounded-xl font-medium hover:bg-emerald-300 transition-all"
              >
                <Plus className="w-4 h-4" />
                Create First Agent
              </button>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {displayAgents.map((agent) => (
                <div key={agent.id} className={`group relative rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-xl transition-all duration-300 hover:border-emerald-400/40 hover:bg-slate-900/80 hover:-translate-y-1 ${viewMode === 'list' ? 'flex items-center p-4' : 'p-6'}`}>
                  
                  {/* Agent Card Content */}
                  <div className={`${viewMode === 'list' ? 'flex-1 flex items-center gap-4' : ''}`}>
                    <div className={`${viewMode === 'list' ? 'flex items-center gap-3' : 'flex items-center gap-3 mb-4'}`}>
                      <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-400/40">
                        <Bot className="w-5 h-5 text-emerald-300" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-100 group-hover:text-emerald-100 transition-colors">
                          {agent.agent_name}
                        </h3>
                        <p className="text-xs text-slate-400">{agent.model} • {agent.voice}</p>
                      </div>
                    </div>

                    {viewMode === 'grid' && (
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-400">Total Calls</span>
                          <span className="text-lg font-bold text-emerald-300">{agent.call_count}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-400">Created</span>
                          <span className="text-sm text-slate-300">{new Date(agent.created_at!).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}

                    {viewMode === 'list' && (
                      <div className="flex items-center gap-6 text-sm">
                        <span className="text-slate-400">Calls: <span className="text-emerald-300 font-medium">{agent.call_count}</span></span>
                        <span className="text-slate-400">Created: {new Date(agent.created_at!).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons - Always Visible */}
                  <div className={`flex items-center gap-2 ${viewMode === 'list' ? '' : 'pt-4 border-t border-slate-700/50'}`}>
                    <button 
                      onClick={() => handleTestCall(agent)}
                      disabled={!vapi}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                        activeCall === agent.vapi_assistant_id
                          ? 'bg-red-500/20 text-red-300 border-red-400/30 hover:bg-red-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30 hover:bg-emerald-500/30'
                      } ${!vapi ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {activeCall === agent.vapi_assistant_id ? 'End Call' : 'Test Call'}
                    </button>
                    
                    <button 
                      onClick={() => {
                        setSelectedAgent(agent);
                        setShowAgentDetail(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-700/50 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-600/50 transition-colors border border-slate-600/50"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <CreateAgentForm 
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSubmit={handleCreateAgent}
      />

      <VisualAgentBuilder 
        isOpen={showVisualBuilder}
        onClose={() => setShowVisualBuilder(false)}
        onSave={handleCreateAgent}
      />

      <AgentDetailModal 
        agent={selectedAgent}
        isOpen={showAgentDetail}
        onClose={() => setShowAgentDetail(false)}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    </div>
  );
}