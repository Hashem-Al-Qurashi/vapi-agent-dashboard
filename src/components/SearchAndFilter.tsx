'use client';

import React, { useState } from 'react';
import { Search, Filter, X, SlidersHorizontal, Calendar, BarChart3 } from 'lucide-react';
import { type Agent } from '@/lib/database';

interface SearchAndFilterProps {
  agents: Agent[];
  onFilteredResults: (filteredAgents: Agent[]) => void;
}

export default function SearchAndFilter({ agents, onFilteredResults }: SearchAndFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [callCountFilter, setCallCountFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Get unique models and voices from agents
  const availableModels = [...new Set(agents.map(agent => agent.model))];
  const availableVoices = [...new Set(agents.map(agent => agent.voice))];

  // Filter and sort agents
  const filterAgents = () => {
    let filtered = agents.filter(agent => {
      // Search term filter
      const matchesSearch = !searchTerm || 
        agent.agent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.system_prompt.toLowerCase().includes(searchTerm.toLowerCase());

      // Model filter
      const matchesModel = !selectedModel || agent.model === selectedModel;

      // Voice filter
      const matchesVoice = !selectedVoice || agent.voice === selectedVoice;

      // Call count filter
      const matchesCallCount = callCountFilter === 'all' || 
        (callCountFilter === 'active' && agent.call_count > 0) ||
        (callCountFilter === 'inactive' && agent.call_count === 0);

      return matchesSearch && matchesModel && matchesVoice && matchesCallCount;
    });

    // Sort agents
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.agent_name.toLowerCase();
          bValue = b.agent_name.toLowerCase();
          break;
        case 'calls':
          aValue = a.call_count;
          bValue = b.call_count;
          break;
        case 'created_at':
        default:
          aValue = new Date(a.created_at!).getTime();
          bValue = new Date(b.created_at!).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    onFilteredResults(filtered);
  };

  // Apply filters whenever inputs change
  React.useEffect(() => {
    filterAgents();
  }, [searchTerm, selectedModel, selectedVoice, sortBy, sortOrder, callCountFilter, agents]);

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedModel('');
    setSelectedVoice('');
    setSortBy('created_at');
    setSortOrder('desc');
    setCallCountFilter('all');
  };

  const activeFilterCount = [searchTerm, selectedModel, selectedVoice, callCountFilter !== 'all'].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Main Search Bar - EXACT REPLICA of original input styling */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search agents, prompts, or configurations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all backdrop-blur-xl"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700/50 rounded-full transition-colors"
            >
              <X className="w-3 h-3 text-slate-400" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Filters */}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="px-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all backdrop-blur-xl"
          >
            <option value="">All Models</option>
            {availableModels.map((model) => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>

          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="px-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all backdrop-blur-xl"
          >
            <option value="">All Voices</option>
            {availableVoices.map((voice) => (
              <option key={voice} value={voice}>{voice}</option>
            ))}
          </select>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`relative p-3 rounded-xl border transition-all backdrop-blur-xl ${
              showAdvancedFilters || activeFilterCount > 0
                ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                : 'bg-slate-900/60 border-slate-700/50 text-slate-300 hover:text-emerald-300 hover:border-emerald-400/50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-emerald-400 text-slate-950 rounded-full text-xs font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel - EXACT REPLICA of feature cards styling */}
      {showAdvancedFilters && (
        <div className="rounded-2xl border border-emerald-500/25 bg-slate-950/70 p-5 space-y-4" style={{animation: 'fadeSlideIn 0.3s ease-out both'}}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-400/40">
                <Filter className="w-4 h-4 text-emerald-300" />
              </div>
              <h3 className="text-sm font-semibold tracking-tight">Advanced Filters</h3>
            </div>
            <button
              onClick={clearAllFilters}
              className="text-xs text-slate-400 hover:text-emerald-300 transition-colors"
            >
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Call Activity Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">Call Activity</label>
              <select
                value={callCountFilter}
                onChange={(e) => setCallCountFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all backdrop-blur-xl text-sm"
              >
                <option value="all">All Agents</option>
                <option value="active">Active (has calls)</option>
                <option value="inactive">Inactive (no calls)</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all backdrop-blur-xl text-sm"
              >
                <option value="created_at">Creation Date</option>
                <option value="name">Agent Name</option>
                <option value="calls">Call Count</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all backdrop-blur-xl text-sm"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Filter Results Summary */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
            <div className="text-sm text-slate-400">
              Showing {agents.length} of {agents.length} agents
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              {activeFilterCount > 0 && (
                <>
                  <span>{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active</span>
                  <button
                    onClick={clearAllFilters}
                    className="text-emerald-300 hover:text-emerald-200 transition-colors"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search Results Summary */}
      {(searchTerm || selectedModel || selectedVoice || callCountFilter !== 'all') && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Filter className="w-4 h-4" />
          <span>
            {searchTerm && `"${searchTerm}"`}
            {selectedModel && ` • ${selectedModel}`}
            {selectedVoice && ` • ${selectedVoice}`}
            {callCountFilter !== 'all' && ` • ${callCountFilter} agents`}
          </span>
        </div>
      )}
    </div>
  );
}