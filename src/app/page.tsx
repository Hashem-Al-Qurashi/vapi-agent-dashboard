'use client';

import { useState, useEffect } from 'react';
import { Bot, Plus, Menu, Play, Shield, Clock, Sparkles, Settings, Phone } from 'lucide-react';
import { agentService, subscribeToAgents, type Agent } from '@/lib/database';
import { vapiService } from '@/lib/vapi';
import CreateAgentForm, { type AgentFormData } from '@/components/CreateAgentForm';
import VoiceCallTest from '@/components/VoiceCallTest';
import VisualAgentBuilder from '@/components/VisualAgentBuilder';
import AgentDetailModal from '@/components/AgentDetailModal';
import SearchAndFilter from '@/components/SearchAndFilter';

export default function VapiDashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showVisualBuilder, setShowVisualBuilder] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showAgentDetail, setShowAgentDetail] = useState(false);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [vapi, setVapi] = useState<any>(null);
  const [activeCall, setActiveCall] = useState<string | null>(null);

  // Load agents from Supabase
  useEffect(() => {
    async function loadAgents() {
      try {
        const data = await agentService.getAll();
        setAgents(data);
      } catch (err) {
        console.error('Error loading agents:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAgents();

    // Set up real-time subscription (disabled for production testing)
    // const subscription = subscribeToAgents((updatedAgents) => {
    //   setAgents(updatedAgents);
    // });

    // return () => {
    //   subscription.unsubscribe();
    // };
  }, []);

  // Track scroll position for opacity changes
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load real Vapi SDK with proper import
  useEffect(() => {
    console.log('=== VAPI SDK INITIALIZATION ===');
    
    const loadRealVapi = async () => {
      try {
        // Use dynamic import with proper typing
        console.log('Loading Vapi SDK via dynamic import...');
        const VapiModule = await import('@vapi-ai/web');
        console.log('✅ Vapi module imported');
        
        // Use the default export which should be the Vapi class
        const Vapi = (VapiModule as any).default || VapiModule;
        console.log('✅ Vapi constructor found');
        
        const vapiInstance = new Vapi('bd62d6e3-2281-4307-bb87-a3c59ddb52ce');
        console.log('✅ Vapi instance created with public key');
        
        // Set up event listeners
        vapiInstance.on('call-start', () => {
          console.log('🎯 REAL CALL STARTED');
        });

        vapiInstance.on('call-end', (callData: any) => {
          console.log('🎯 REAL CALL ENDED:', callData);
          setActiveCall(null);
          alert('✅ Call completed! Webhook should fire automatically.');
        });

        vapiInstance.on('error', async (error: any) => {
          console.error('🎯 VAPI ERROR:', error);
          
          // Get detailed error info
          if (error.error && error.error.text) {
            const errorText = await error.error.text();
            console.error('🎯 VAPI ERROR DETAILS:', errorText);
            alert('Call failed: ' + errorText);
          } else {
            console.error('🎯 VAPI ERROR OBJECT:', JSON.stringify(error, null, 2));
            alert('Call failed: ' + (error.message || 'Unknown error'));
          }
          
          setActiveCall(null);
        });

        setVapi(vapiInstance);
        console.log('✅ Real Vapi SDK ready for voice calls');
        
      } catch (error) {
        console.error('❌ Failed to load real Vapi SDK:', error);
        console.log('🔄 Falling back to mock SDK...');
        
        // Fallback mock
        const mockVapi = {
          start: async (config: any) => {
            console.log('🎯 MOCK CALL (Real SDK failed):', config);
            alert(`📞 Mock Voice Call\n\nAgent: ${config.assistantId}\n\nReal SDK couldn't load, but this demonstrates the functionality.\n\nIn production, you'd have a real voice conversation!`);
            setActiveCall(null);
            return Promise.resolve();
          },
          stop: () => setActiveCall(null),
          on: () => {}
        };
        
        setVapi(mockVapi);
        console.log('✅ Mock SDK ready');
      }
    };

    loadRealVapi();
  }, []);

  // Handle agent creation via API route
  const handleCreateAgent = async (formData: AgentFormData) => {
    console.log('🚀 Starting agent creation:', formData);
    
    try {
      console.log('📡 Making API call to /api/agents...');
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('📡 API Response status:', response.status);
      const result = await response.json();
      console.log('📡 API Response data:', result);

      if (!response.ok) {
        console.error('❌ API Error:', result);
        throw new Error(result.error || 'Failed to create agent');
      }

      console.log('✅ Agent created successfully in API:', result);
      
      // Manually refresh the agents list since real-time is disabled
      console.log('🔄 Refreshing agents list...');
      const updatedAgents = await agentService.getAll();
      console.log('🔄 Updated agents from database:', updatedAgents.length, 'agents');
      setAgents(updatedAgents);
      
      // Close the create form
      setShowCreateForm(false);
      
      console.log('✅ All done! Agent should be visible now');
      alert('✅ Agent created successfully! Check the dashboard.');
    } catch (error) {
      console.error('❌ Error creating agent:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert('❌ Failed to create agent: ' + errorMessage);
      throw error; // Let the form handle the error display
    }
  };

  // Handle agent detail view
  const handleViewAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowAgentDetail(true);
  };

  const handleEditAgent = (agent: Agent) => {
    // For now, just close the detail modal and open the form
    // In a full implementation, this would pre-populate the form
    setShowAgentDetail(false);
    setShowCreateForm(true);
    console.log('Edit agent:', agent);
  };

  const handleDeleteAgent = async (agentId: number) => {
    try {
      await agentService.delete(agentId);
      // Refresh agents list
      const updatedAgents = await agentService.getAll();
      setAgents(updatedAgents);
    } catch (error) {
      console.error('Error deleting agent:', error);
      alert('Failed to delete agent');
    }
  };

  // Handle voice call testing
  const handleTestCall = async (agent: Agent) => {
    if (!vapi) {
      alert('Vapi SDK not loaded yet. Please try again in a moment.');
      return;
    }

    if (activeCall) {
      // End current call
      vapi.stop();
      setActiveCall(null);
      return;
    }

    try {
      setActiveCall(agent.vapi_assistant_id);
      console.log(`Starting call with agent: ${agent.agent_name}`);
      
      await vapi.start(agent.vapi_assistant_id);
      
    } catch (error) {
      console.error('Failed to start call:', error);
      setActiveCall(null);
      alert('Failed to start call: ' + (error as any).message);
    }
  };

  // Simple circular motion animation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes circle-float {
        0% { transform: translate(0, 0); }
        25% { transform: translate(30px, -40px); }
        50% { transform: translate(-20px, -20px); }
        75% { transform: translate(40px, 30px); }
        100% { transform: translate(0, 0); }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);


  return (
    <div className="antialiased text-slate-50 bg-black" style={{fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial'}}>
      
      {/* SCROLL-RESPONSIVE FLOATING CIRCLES */}
      <div className="fixed top-0 w-full h-screen overflow-hidden pointer-events-none" style={{zIndex: 999}}>
        
        {/* Calculate opacity based on scroll - LESS visible as you scroll down */}
        <div style={{
          position: 'absolute', width: '100px', height: '100px', background: '#10b981', borderRadius: '50%', 
          opacity: Math.max(0.05, 0.4 - (scrollY / 500)), filter: 'blur(8px)', 
          top: '20%', left: '15%', animation: 'circle-float 25s ease-in-out infinite'
        }} />
        
        <div style={{
          position: 'absolute', width: '100px', height: '100px', background: '#10b981', borderRadius: '50%', 
          opacity: Math.max(0.05, 0.4 - (scrollY / 500)), filter: 'blur(8px)', 
          top: '60%', right: '20%', animation: 'circle-float 20s ease-in-out infinite reverse'
        }} />
        
        <div style={{
          position: 'absolute', width: '100px', height: '100px', background: '#10b981', borderRadius: '50%', 
          opacity: Math.max(0.05, 0.4 - (scrollY / 500)), filter: 'blur(8px)', 
          bottom: '25%', left: '10%', animation: 'circle-float 30s ease-in-out infinite'
        }} />
        
        <div style={{
          position: 'absolute', width: '100px', height: '100px', background: '#10b981', borderRadius: '50%', 
          opacity: Math.max(0.05, 0.4 - (scrollY / 500)), filter: 'blur(8px)', 
          top: '30%', right: '40%', animation: 'circle-float 18s ease-in-out infinite reverse'
        }} />
        
        <div style={{
          position: 'absolute', width: '100px', height: '100px', background: '#10b981', borderRadius: '50%', 
          opacity: Math.max(0.05, 0.4 - (scrollY / 500)), filter: 'blur(8px)', 
          bottom: '40%', right: '10%', animation: 'circle-float 22s ease-in-out infinite'
        }} />
        
        <div style={{
          position: 'absolute', width: '100px', height: '100px', background: '#10b981', borderRadius: '50%', 
          opacity: Math.max(0.05, 0.4 - (scrollY / 500)), filter: 'blur(8px)', 
          top: '70%', left: '60%', animation: 'circle-float 28s ease-in-out infinite reverse'
        }} />

      </div>

      {/* Background: green depthy field - EXACT REPLICA */}
      <div className="absolute inset-0 -z-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-slate-950 to-emerald-900"></div>
        <div className="absolute -top-1/4 -left-1/4 w-[45rem] h-[45rem] bg-emerald-500/20 blur-3xl rounded-full mix-blend-screen"></div>
        <div className="absolute top-1/3 -right-1/3 w-[40rem] h-[40rem] bg-lime-400/20 blur-3xl rounded-full mix-blend-screen"></div>
        <div className="absolute bottom-[-30%] left-1/2 -translate-x-1/2 w-[50rem] h-[30rem] bg-gradient-to-t from-emerald-600/40 via-emerald-500/0 to-transparent blur-3xl opacity-80"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(22,163,74,0.18)_0,_transparent_55%)]"></div>
        <div className="absolute inset-0 opacity-40 mix-blend-soft-light" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.16) 1px, transparent 0)', backgroundSize: '20px 20px'}}></div>
      </div>

      <div className="gradient-blur">
        <div></div><div></div>
      </div>

      {/* NAV - EXACT REPLICA */}
      <header className="fixed z-30 bg-slate-900/60 w-full top-0 backdrop-blur-2xl border-b border-emerald-500/10" style={{animation: 'fadeSlideIn 0.5s ease-in-out 0.1s both'}}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <a href="#" className="flex items-center gap-3">
              <div className="relative h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-400 to-lime-400 flex items-center justify-center">
                <div className="absolute inset-[2px] rounded-lg bg-slate-950"></div>
                <Bot className="relative w-4 h-4 text-emerald-300" />
              </div>
              <span className="text-base sm:text-lg font-semibold tracking-tight">
                VapiChat
              </span>
            </a>

            <button className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition ml-auto" aria-label="Toggle menu">
              <Menu className="w-4 h-4" />
            </button>

            <nav className="hidden lg:flex items-center gap-7 text-xs sm:text-sm text-slate-300/80">
              <a href="#product" className="hover:text-white transition">Agents</a>
              <a href="/calls" className="hover:text-white transition">Call History</a>
              <a href="#workspaces" className="hover:text-white transition">Analytics</a>
              <a href="#features" className="hover:text-white transition">Settings</a>
              <a href="#pricing" className="hover:text-white transition">Billing</a>
            </nav>

            <div className="hidden sm:flex items-center gap-3">
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/update-webhooks', { method: 'POST' });
                    const result = await response.json();
                    console.log('Webhook update result:', result);
                    alert(`Updated webhooks for ${result.successCount}/${result.totalAgents} agents`);
                  } catch (error) {
                    console.error('Error updating webhooks:', error);
                    alert('Failed to update webhooks');
                  }
                }}
                className="text-xs sm:text-sm text-slate-300 hover:text-white transition"
              >
                Update Webhooks
              </button>
              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    const response = await fetch('/api/import-vapi-calls', { method: 'POST' });
                    const result = await response.json();
                    console.log('Import result:', result);
                    if (result.success) {
                      alert(`Successfully imported ${result.results.calls_imported} calls from Vapi!`);
                      // Reload agents to update call counts
                      const data = await agentService.getAll();
                      setAgents(data);
                    } else {
                      alert('Import completed but no calls were found to import');
                    }
                  } catch (error) {
                    console.error('Error importing calls:', error);
                    alert('Failed to import calls from Vapi');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="text-xs sm:text-sm text-slate-300 hover:text-white transition"
              >
                Import Calls
              </button>
              <button 
                onClick={() => setShowCreateForm(true)}
                className="relative inline-flex items-center justify-center gap-2 overflow-hidden transition-all duration-300 hover:ring-emerald-400/70 hover:shadow-[0_0_0_1px_rgba(52,211,153,0.4),0_30px_80px_rgba(16,185,129,0.3)] group ring-emerald-500/40 ring-1 text-xs sm:text-sm font-medium text-slate-950 tracking-tight bg-emerald-400 rounded-full py-2.5 px-4 chat-pulse"
              >
                <span className="relative z-[1] group-hover:translate-x-0.5 transition-transform duration-300">
                  Create Agent
                </span>
                <span className="relative z-[1] flex items-center justify-center w-5 h-5 rounded-full bg-slate-950/10">
                  <Plus className="w-3.5 h-3.5" />
                </span>
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300" style={{background: 'radial-gradient(circle at 0% 0%, rgba(250,250,250,0.4), transparent 55%)'}}></span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative overflow-hidden">
        {/* HERO: EXACT REPLICA but with Vapi content */}
        <section id="product" className="min-h-screen flex flex-col section-visible text-center pt-28 pb-20 px-6 relative items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-4 py-1.5 backdrop-blur border border-emerald-400/30 text-emerald-200/90" style={{animation: 'fadeSlideIn 0.6s ease-out 0.15s both'}}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/20 border border-emerald-300/40">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/40 opacity-75 animate-ping"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
              </span>
            </span>
            <span className="text-xs">
              Live · Voice AI agents ready to deploy
            </span>
          </div>

          <h1 className="leading-tight font-semibold text-white tracking-tight mt-8 mb-4">
            <span className="block text-[9vw] sm:text-5xl md:text-6xl lg:text-7xl">
              A focused home
            </span>
            <span className="block text-[9vw] sm:text-5xl md:text-6xl lg:text-7xl text-emerald-200 animate-shimmer-mask" style={{'--shine': '240%'} as React.CSSProperties}>
              for every voice conversation
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base md:text-lg text-slate-300/90 type-words is-in" data-stagger=".16s" data-duration="1.8s" data-ease="ease-in-out" data-delay=".3s" style={{'--stagger': '0.16s', '--dur': '1.8s', '--ease': 'ease-in-out', '--delay': '0.3s'} as React.CSSProperties}>
            <span className="w" style={{'--i': 0} as React.CSSProperties}>Deploy&nbsp;</span>
            <span className="w" style={{'--i': 1} as React.CSSProperties}>intelligent&nbsp;</span>
            <span className="w" style={{'--i': 2} as React.CSSProperties}>voice&nbsp;</span>
            <span className="w" style={{'--i': 3} as React.CSSProperties}>AI&nbsp;</span>
            <span className="w" style={{'--i': 4} as React.CSSProperties}>agents&nbsp;</span>
            <span className="w" style={{'--i': 5} as React.CSSProperties}>with&nbsp;</span>
            <span className="w" style={{'--i': 6} as React.CSSProperties}>custom&nbsp;</span>
            <span className="w" style={{'--i': 7} as React.CSSProperties}>voices,&nbsp;</span>
            <span className="w" style={{'--i': 8} as React.CSSProperties}>advanced&nbsp;</span>
            <span className="w" style={{'--i': 9} as React.CSSProperties}>models,&nbsp;</span>
            <span className="w" style={{'--i': 10} as React.CSSProperties}>and&nbsp;</span>
            <span className="w" style={{'--i': 11} as React.CSSProperties}>real-time&nbsp;</span>
            <span className="w" style={{'--i': 12} as React.CSSProperties}>analytics.&nbsp;</span>
            <span className="w" style={{'--i': 13} as React.CSSProperties}>Monitor&nbsp;</span>
            <span className="w" style={{'--i': 14} as React.CSSProperties}>performance&nbsp;</span>
            <span className="w" style={{'--i': 15} as React.CSSProperties}>and&nbsp;</span>
            <span className="w" style={{'--i': 16} as React.CSSProperties}>scale&nbsp;</span>
            <span className="w" style={{'--i': 17} as React.CSSProperties}>conversations&nbsp;</span>
            <span className="w" style={{'--i': 18} as React.CSSProperties}>effortlessly.&nbsp;</span>
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button 
              onClick={() => setShowCreateForm(true)}
              className="relative inline-flex items-center justify-center gap-2 overflow-hidden transition-all duration-300 hover:ring-emerald-400/70 hover:shadow-[0_0_0_1px_rgba(52,211,153,0.4),0_30px_80px_rgba(16,185,129,0.35)] group ring-emerald-500/40 ring-1 text-xs sm:text-sm font-medium text-slate-950 tracking-tight bg-emerald-400 rounded-full py-2.5 px-4"
            >
              <span className="relative z-[1] group-hover:translate-x-0.5 transition-transform duration-300">
                Create Agent
              </span>
              <span className="relative z-[1] flex items-center justify-center w-5 h-5 rounded-full bg-slate-950/10">
                <Plus className="w-3.5 h-3.5" />
              </span>
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300" style={{background: 'radial-gradient(circle at 0% 0%, rgba(250,250,250,0.4), transparent 55%)'}}></span>
            </button>
            <button 
              onClick={() => setShowVisualBuilder(true)}
              className="group inline-flex min-w-[140px] cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] border-gradient hover:text-white text-xs sm:text-sm font-medium text-slate-200/90 tracking-tight bg-white/5 rounded-full py-2.5 px-4 relative backdrop-blur-xl items-center justify-center"
            >
              <span className="relative flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-300" />
                Visual Builder
              </span>
              <span aria-hidden="true" className="transition-all duration-300 group-hover:opacity-80 opacity-20 w-[70%] h-[1px] rounded-full absolute bottom-0 left-1/2 -translate-x-1/2" style={{background: 'linear-gradient(90deg,rgba(226,232,240,0) 0%,rgba(226,232,240,1) 50%,rgba(226,232,240,0) 100%)'}}></span>
            </button>
          </div>

          {/* Stats Row - EXACT REPLICA but with Vapi content */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mt-10 text-[0.7rem] sm:text-xs text-slate-300/80" style={{animation: 'fadeSlideIn 0.6s ease-out 0.4s both'}}>
            <span className="inline-flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-300" />
              Enterprise-ready security
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Response time &lt; 200ms globally</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Built for voice-first experiences</span>
            </span>
          </div>

          {/* LINEAR-INSPIRED: Subtle Analytics Section */}
          <div className="mt-20 w-full max-w-6xl mx-auto mb-16">
            
            {/* Minimal Stats Header - Linear Style */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-medium text-white mb-1">Voice AI Analytics</h2>
                  <p className="text-sm text-slate-400">Monitor your agents and conversations</p>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    <span className="text-slate-300">{(filteredAgents.length > 0 ? filteredAgents : agents).length} active agents</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    <span className="text-slate-300">{(filteredAgents.length > 0 ? filteredAgents : agents).reduce((sum, agent) => sum + agent.call_count, 0)} total calls</span>
                  </div>
                  
                  {/* Call History Button */}
                  <a 
                    href="/calls"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 hover:bg-emerald-500/30 rounded-lg text-sm font-medium transition-all"
                  >
                    <Phone className="w-4 h-4" />
                    View Call History
                  </a>
                </div>
              </div>
            </div>

            {/* Search - Minimal and Elegant */}
            <div className="mb-8">
              <SearchAndFilter 
                agents={agents}
                onFilteredResults={setFilteredAgents}
              />
            </div>

            {/* Agent Grid - Linear-inspired Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(filteredAgents.length > 0 ? filteredAgents : agents).map((agent) => (
                <div key={agent.id} className="group relative rounded-2xl border border-slate-800/50 bg-slate-900/40 backdrop-blur-sm transition-all duration-200 hover:border-emerald-500/30 hover:bg-slate-900/60">
                  
                  <div className="p-5">
                    {/* Agent Header - Minimal */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-100 truncate">{agent.agent_name}</h3>
                        <p className="text-xs text-slate-500">{agent.model}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-emerald-400">{agent.call_count}</div>
                        <div className="text-xs text-slate-500">calls</div>
                      </div>
                    </div>

                    {/* Minimal Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Voice:</span>
                        <span className="text-slate-400">{agent.voice}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Created:</span>
                        <span className="text-slate-400">{new Date(agent.created_at!).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <button 
                        onClick={() => handleTestCall(agent)}
                        disabled={!vapi}
                        className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                          activeCall === agent.vapi_assistant_id
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                        } ${!vapi ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {activeCall === agent.vapi_assistant_id ? 'End Call' : 'Test Call'}
                      </button>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleViewAgent(agent)}
                          className="flex-1 py-1.5 px-3 bg-slate-700/50 text-slate-300 rounded-md text-xs font-medium hover:bg-slate-600/50 transition-colors"
                        >
                          Details
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete agent "${agent.agent_name}"? This cannot be undone.`)) {
                              if (agent.id) {
                                handleDeleteAgent(agent.id);
                              }
                            }
                          }}
                          className="flex-1 py-1.5 px-3 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-md text-xs font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Minimal Create Card */}
              <div 
                onClick={() => setShowCreateForm(true)}
                className="group cursor-pointer rounded-2xl border border-dashed border-slate-700/50 hover:border-emerald-500/40 bg-slate-900/20 hover:bg-slate-900/40 transition-all duration-200 flex flex-col items-center justify-center p-8 min-h-[200px]"
              >
                <Plus className="w-6 h-6 text-slate-500 group-hover:text-emerald-400 transition-colors mb-3" />
                <span className="text-sm text-slate-500 group-hover:text-emerald-400 transition-colors">New Agent</span>
              </div>
            </div>
          </div>
        </section>

        {/* Keep original two-column section below for comparison */}
        <section className="px-6 pb-20">
          <div className="w-full max-w-6xl mx-auto grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.15fr)] items-stretch">
            {/* Left: Agent showcase */}
            <div className="relative rounded-3xl border border-emerald-400/20 bg-slate-950/60 backdrop-blur-2xl overflow-hidden">
              <div className="absolute left-10 top-0 h-40 w-40 rounded-full bg-emerald-500/30 blur-3xl opacity-60"></div>
              <div className="relative p-6 sm:p-7 flex flex-col h-full">
                <div className="inline-flex items-center gap-2 rounded-full chat-tag-pill px-3 py-1 border border-emerald-500/40 text-[0.7rem] text-emerald-100">
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-950/60 border border-emerald-400/40">
                    <Bot className="w-2.5 h-2.5" />
                  </span>
                  Voice agents · Models · Analytics
                </div>

                <h2 className="mt-5 text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-white">
                  Deploy intelligent<br className="hidden sm:block" />voice conversations
                </h2>

                <p className="mt-3 text-sm sm:text-base text-slate-300/90">
                  Create custom voice AI agents with advanced models, natural voices, and real-time monitoring. Scale conversations across your business.
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3 text-left text-[0.72rem] sm:text-xs">
                  {(filteredAgents.length > 0 ? filteredAgents : agents).slice(0, 3).map((agent, index) => (
                    <div key={agent.id} className="rounded-2xl border border-white/5 bg-slate-900/70 p-3">
                      <div className="flex items-center gap-2 mb-1.5 text-slate-100">
                        <Bot className="w-3.5 h-3.5 text-emerald-300" />
                        <span className="font-medium">{agent.agent_name}</span>
                      </div>
                      <p className="text-slate-400 leading-snug">
                        {agent.call_count} calls • {agent.model} • {agent.voice}
                      </p>
                    </div>
                  ))}
                  
                  {agents.length < 3 && (
                    <div className="rounded-2xl border border-white/5 bg-slate-900/70 p-3">
                      <div className="flex items-center gap-2 mb-1.5 text-slate-100">
                        <Plus className="w-3.5 h-3.5 text-emerald-300" />
                        <span className="font-medium">Create Agent</span>
                      </div>
                      <p className="text-slate-400 leading-snug">
                        Deploy your first voice AI agent with custom configuration.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-[0.7rem] text-slate-400">
                  <div className="flex -space-x-2">
                    <span className="inline-flex h-6 w-6 rounded-full border border-slate-800 bg-gradient-to-br from-emerald-400 to-emerald-600"></span>
                    <span className="inline-flex h-6 w-6 rounded-full border border-slate-800 bg-slate-700"></span>
                    <span className="inline-flex h-6 w-6 rounded-full border border-slate-800 bg-slate-800"></span>
                  </div>
                  <span>Trusted by teams building voice-first products.</span>
                </div>
              </div>
            </div>

            {/* Right: Agent metrics panel */}
            <div className="relative rounded-3xl border border-emerald-500/30 bg-slate-950/80 backdrop-blur-2xl shadow-[0_40px_120px_rgba(15,118,110,0.45)] overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-emerald-500/20 to-transparent pointer-events-none"></div>
              <div className="relative flex flex-col h-full max-h-[32rem]">
                {/* Agent metrics header */}
                <div className="flex items-center justify-between px-4 sm:px-5 pt-3 pb-3 border-b border-emerald-500/30">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-emerald-400 to-lime-400 flex items-center justify-center">
                        <div className="absolute inset-[2px] rounded-lg bg-slate-950"></div>
                        <Bot className="relative w-3.5 h-3.5 text-emerald-300" />
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 inline-flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/40 animate-ping"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border border-slate-950"></span>
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-medium text-slate-100 tracking-tight">
                        Voice AI Analytics
                      </div>
                      <div className="text-[0.7rem] text-emerald-200/90 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                        Live metrics: {(filteredAgents.length > 0 ? filteredAgents : agents).length} agents, {(filteredAgents.length > 0 ? filteredAgents : agents).reduce((sum, agent) => sum + agent.call_count, 0)} total calls
                      </div>
                    </div>
                  </div>
                </div>

                {/* Agent metrics content */}
                <div className="flex-1 px-3 sm:px-4 pt-3 pb-3 space-y-3 overflow-y-auto text-left">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-400/40 px-3 py-2 text-[0.7rem] text-emerald-100">
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400/20">
                          <Bot className="w-3 h-3 text-emerald-300 animate-pulse" />
                        </span>
                        Loading agents...
                      </div>
                    </div>
                  ) : (
                    (filteredAgents.length > 0 ? filteredAgents : agents).slice(0, 4).map((agent) => (
                      <div key={agent.id} className="flex items-start gap-2 sm:gap-3 text-[0.72rem] sm:text-xs text-slate-300/90">
                        <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 border border-emerald-400/30">
                          <Bot className="w-3.5 h-3.5 text-emerald-300" />
                        </div>
                        <div className="max-w-[90%]">
                          <button 
                            onClick={() => handleViewAgent(agent)}
                            className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-400/40 px-2 py-1 mb-1 text-[0.65rem] text-emerald-100 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                          >
                            <span>{agent.agent_name}</span>
                            <span className="h-1 w-1 rounded-full bg-emerald-300/60"></span>
                            <span>{agent.model}</span>
                          </button>
                          <div className="rounded-2xl bg-slate-900/80 border border-slate-800/80 px-3 py-2.5">
                            <p className="mb-2">
                              <span className="text-emerald-200 font-medium">{agent.call_count} calls</span> • 
                              Voice: {agent.voice} • 
                              Created: {new Date(agent.created_at!).toLocaleDateString()}
                            </p>
                            <p className="text-slate-400 text-[0.65rem] mb-2">
                              {agent.system_prompt.substring(0, 60)}...
                            </p>
                            {/* Voice Call Test - Real Implementation */}
                            <div className="flex items-center gap-2 mt-2">
                              <button 
                                onClick={() => handleTestCall(agent)}
                                disabled={!vapi}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                                  activeCall === agent.vapi_assistant_id
                                    ? 'bg-red-500/20 text-red-300 border-red-400/30 hover:bg-red-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30 hover:bg-emerald-500/30'
                                } ${!vapi ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                <Phone className="w-3 h-3" />
                                {activeCall === agent.vapi_assistant_id ? 'End Call' : 'Test Call'}
                              </button>
                              <button 
                                onClick={() => handleViewAgent(agent)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-600/50 transition-colors border border-slate-600/50"
                              >
                                View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Create Agent Form Modal */}
      <CreateAgentForm 
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSubmit={handleCreateAgent}
      />

      {/* Visual Agent Builder */}
      <VisualAgentBuilder 
        isOpen={showVisualBuilder}
        onClose={() => setShowVisualBuilder(false)}
        onSave={handleCreateAgent}
      />

      {/* Agent Detail Modal */}
      <AgentDetailModal 
        agent={selectedAgent}
        isOpen={showAgentDetail}
        onClose={() => setShowAgentDetail(false)}
        onEdit={handleEditAgent}
        onDelete={handleDeleteAgent}
      />
    </div>
  );
}