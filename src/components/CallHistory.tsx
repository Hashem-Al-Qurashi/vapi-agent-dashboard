'use client';

import { useState, useEffect } from 'react';
import { 
  Phone, 
  Clock, 
  DollarSign, 
  Users, 
  Filter, 
  Search, 
  Calendar,
  TrendingUp,
  Play,
  FileText,
  BarChart3,
  ChevronRight,
  Circle
} from 'lucide-react';
import { callService, subscribeToCallUpdates } from '@/lib/calls';
import type { Call } from '@/types/calls';

interface CallHistoryProps {
  onCallSelect?: (call: Call) => void;
}

export default function CallHistory({ onCallSelect }: CallHistoryProps) {
  const [calls, setCalls] = useState<Call[]>([]);
  const [filteredCalls, setFilteredCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [stats, setStats] = useState<any>(null);

  // Load calls and stats
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [callsData, statsData] = await Promise.all([
          callService.getAll(100),
          callService.getStats()
        ]);
        
        setCalls(callsData);
        setFilteredCalls(callsData);
        setStats(statsData);
        
        console.log('📞 Loaded', callsData.length, 'calls from database');
      } catch (error) {
        console.error('Error loading call history:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();

    // Subscribe to real-time updates
    const subscription = subscribeToCallUpdates((updatedCalls) => {
      setCalls(updatedCalls);
      // Reapply current filters
      applyFilters(updatedCalls, searchQuery, selectedStatus, selectedAgent, dateRange);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Apply filters whenever any filter changes
  useEffect(() => {
    applyFilters(calls, searchQuery, selectedStatus, selectedAgent, dateRange);
  }, [calls, searchQuery, selectedStatus, selectedAgent, dateRange]);

  // Filter logic
  function applyFilters(
    callsList: Call[], 
    search: string, 
    status: string, 
    agent: string, 
    dateFilter: string
  ) {
    let filtered = [...callsList];

    // Search filter (transcript or agent name)
    if (search.trim()) {
      const query = search.toLowerCase();
      filtered = filtered.filter(call => 
        call.transcript?.toLowerCase().includes(query) ||
        call.agent?.agent_name.toLowerCase().includes(query) ||
        call.phone_number?.includes(query) ||
        call.summary?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (status !== 'all') {
      filtered = filtered.filter(call => call.status === status);
    }

    // Agent filter
    if (agent !== 'all') {
      filtered = filtered.filter(call => call.agent?.agent_name === agent);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let filterDate: Date;

      switch (dateFilter) {
        case 'today':
          filterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          filterDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          filterDate = new Date(0);
      }

      filtered = filtered.filter(call => new Date(call.started_at) >= filterDate);
    }

    setFilteredCalls(filtered);
  }

  // Get unique agents for filter dropdown
  const uniqueAgents = Array.from(new Set(calls.map(call => call.agent?.agent_name).filter(Boolean)));

  // Format duration helper
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // Format cost helper
  const formatCost = (cost?: number) => {
    if (!cost) return '$0.00';
    return `$${cost.toFixed(2)}`;
  };

  // Status indicator component
  const StatusIndicator = ({ status }: { status: string }) => {
    const colors = {
      'ended': 'text-green-400',
      'in-progress': 'text-blue-400',
      'failed': 'text-red-400',
      'queued': 'text-yellow-400',
      'ringing': 'text-purple-400'
    };

    return (
      <div className="flex items-center gap-1">
        <Circle className={`w-2 h-2 fill-current ${colors[status as keyof typeof colors] || 'text-gray-400'}`} />
        <span className="text-xs text-slate-400 capitalize">{status}</span>
      </div>
    );
  };

  // Sentiment indicator
  const SentimentIndicator = ({ sentiment }: { sentiment?: string }) => {
    if (!sentiment) return null;
    
    const colors = {
      'positive': 'text-green-400',
      'negative': 'text-red-400', 
      'neutral': 'text-yellow-400'
    };

    const emojis = {
      'positive': '😊',
      'negative': '😞',
      'neutral': '😐'
    };

    return (
      <span className={`text-sm ${colors[sentiment as keyof typeof colors]}`}>
        {emojis[sentiment as keyof typeof emojis]} {sentiment}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-400/40 px-4 py-3 text-emerald-100">
          <div className="w-4 h-4 border-2 border-emerald-300 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading call history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header with Stats */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-white mb-2">Call History</h1>
            <p className="text-slate-400">Real-time call data from your voice AI agents</p>
          </div>
          
          {/* Live indicator */}
          <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-400/40 px-3 py-2">
            <Circle className="w-2 h-2 fill-current text-emerald-400 animate-pulse" />
            <span className="text-sm text-emerald-300">Live Data</span>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="rounded-2xl border border-slate-800/50 bg-slate-900/40 p-4">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="text-2xl font-semibold text-white">{stats.total}</div>
                  <div className="text-xs text-slate-400">Total Calls</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800/50 bg-slate-900/40 p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-2xl font-semibold text-white">{formatDuration(Math.round(stats.avgDuration))}</div>
                  <div className="text-xs text-slate-400">Avg Duration</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800/50 bg-slate-900/40 p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-yellow-400" />
                <div>
                  <div className="text-2xl font-semibold text-white">{formatCost(stats.totalCost)}</div>
                  <div className="text-xs text-slate-400">Total Cost</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800/50 bg-slate-900/40 p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <div>
                  <div className="text-2xl font-semibold text-white">
                    {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                  </div>
                  <div className="text-xs text-slate-400">Success Rate</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search calls, transcripts, or agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-700/50 rounded-lg text-slate-200 text-sm placeholder-slate-400 focus:border-emerald-400/50 focus:outline-none min-w-64"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-lg text-slate-200 text-sm focus:border-emerald-400/50 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="ended">Completed</option>
            <option value="in-progress">In Progress</option>
            <option value="failed">Failed</option>
          </select>

          {/* Agent Filter */}
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-lg text-slate-200 text-sm focus:border-emerald-400/50 focus:outline-none"
          >
            <option value="all">All Agents</option>
            {uniqueAgents.map(agentName => (
              <option key={agentName} value={agentName}>{agentName}</option>
            ))}
          </select>

          {/* Date Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-lg text-slate-200 text-sm focus:border-emerald-400/50 focus:outline-none"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Call List */}
      <div className="space-y-3">
        {filteredCalls.length === 0 ? (
          <div className="text-center py-16">
            <Phone className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">No calls found</h3>
            <p className="text-slate-500">
              {calls.length === 0 
                ? "Make some voice calls to see them here!" 
                : "Try adjusting your filters to see more results."}
            </p>
          </div>
        ) : (
          filteredCalls.map((call) => (
            <CallCard 
              key={call.id} 
              call={call} 
              onSelect={onCallSelect}
            />
          ))
        )}
      </div>

      {/* Show count */}
      <div className="mt-6 text-center">
        <p className="text-sm text-slate-400">
          Showing {filteredCalls.length} of {calls.length} calls
        </p>
      </div>
    </div>
  );
}

// Individual Call Card Component
function CallCard({ call, onSelect }: { call: Call; onSelect?: (call: Call) => void }) {
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatCost = (cost?: number) => {
    if (!cost) return '$0.00';
    return `$${cost.toFixed(2)}`;
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const callTime = new Date(date);
    const diffMs = now.getTime() - callTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div 
      className="group relative rounded-2xl border border-slate-800/50 bg-slate-900/40 backdrop-blur-sm transition-all duration-200 hover:border-emerald-500/30 hover:bg-slate-900/60 cursor-pointer"
      onClick={() => onSelect?.(call)}
    >
      <div className="p-5">
        <div className="flex items-start justify-between">
          {/* Left side - Call info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400" />
                <span className="font-medium text-slate-200">
                  {call.phone_number || 'Web Call'}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600" />
              <span className="text-slate-300">{call.agent?.agent_name}</span>
            </div>

            <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
              <span>{formatDuration(call.duration_seconds)}</span>
              <span>{getTimeAgo(call.started_at)}</span>
              <span>{formatCost(call.cost_usd)}</span>
              {call.sentiment && (
                <div className="flex items-center gap-1">
                  <span className={
                    call.sentiment === 'positive' ? 'text-green-400' :
                    call.sentiment === 'negative' ? 'text-red-400' : 'text-yellow-400'
                  }>
                    {call.sentiment === 'positive' ? '😊' : 
                     call.sentiment === 'negative' ? '😞' : '😐'}
                  </span>
                  <span className="capitalize">{call.sentiment}</span>
                </div>
              )}
            </div>

            {call.summary || call.transcript ? (
              <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">
                {call.summary || (call.transcript && `"${call.transcript.substring(0, 120)}..."`)}
              </p>
            ) : (
              <p className="text-sm text-slate-500 italic">No transcript available</p>
            )}
          </div>

          {/* Right side - Status and actions */}
          <div className="flex flex-col items-end gap-3 ml-4">
            <div className="flex items-center gap-1">
              <Circle className={`w-2 h-2 fill-current ${
                call.status === 'ended' ? 'text-green-400' :
                call.status === 'in-progress' ? 'text-blue-400' :
                call.status === 'failed' ? 'text-red-400' : 'text-yellow-400'
              }`} />
              <span className="text-xs text-slate-400 capitalize">{call.status}</span>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {call.recording_url && (
                <button className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-slate-300 transition-colors">
                  <Play className="w-3 h-3" />
                </button>
              )}
              {call.transcript && (
                <button className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-slate-300 transition-colors">
                  <FileText className="w-3 h-3" />
                </button>
              )}
              <button className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-slate-300 transition-colors">
                <BarChart3 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}