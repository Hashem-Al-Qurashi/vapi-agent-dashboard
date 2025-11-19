'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Phone, 
  Clock, 
  DollarSign, 
  User, 
  Calendar,
  Play,
  Pause,
  Volume2,
  VolumeX,
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Copy,
  Download,
  ExternalLink
} from 'lucide-react';
import type { Call } from '@/types/calls';

interface CallDetailModalProps {
  call: Call;
  isOpen: boolean;
  onClose: () => void;
}

export default function CallDetailModal({ call, isOpen, onClose }: CallDetailModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeTab, setActiveTab] = useState<'transcript' | 'analytics' | 'details'>('transcript');
  
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [call.recording_url]);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !audio.muted;
    setIsMuted(audio.muted);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const progressBar = e.currentTarget;
    if (!audio || !duration) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    audio.currentTime = newTime;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const remainingSecs = seconds % 60;
    return mins > 0 ? `${mins}m ${remainingSecs}s` : `${remainingSecs}s`;
  };

  const formatCost = (cost?: number) => {
    if (!cost) return '$0.00';
    return `$${cost.toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ended': return 'text-green-400 bg-green-400/10';
      case 'in-progress': return 'text-blue-400 bg-blue-400/10';
      case 'failed': return 'text-red-400 bg-red-400/10';
      default: return 'text-yellow-400 bg-yellow-400/10';
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-400';
      case 'negative': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="w-4 h-4" />;
      case 'negative': return <TrendingDown className="w-4 h-4" />;
      default: return <Minus className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] mx-4 bg-slate-950 rounded-3xl border border-slate-800/50 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800/50">
          <div className="flex items-center gap-4">
            <Phone className="w-6 h-6 text-emerald-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">Call Details</h2>
              <p className="text-sm text-slate-400">
                {call.phone_number || 'Web Call'} → {call.agent?.agent_name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(call.status)}`}>
              {call.status}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Call Info Cards */}
        <div className="p-6 border-b border-slate-800/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-slate-400">Duration</span>
              </div>
              <div className="text-lg font-semibold text-white">
                {formatDuration(call.duration_seconds)}
              </div>
            </div>

            <div className="bg-slate-900/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-slate-400">Cost</span>
              </div>
              <div className="text-lg font-semibold text-white">
                {formatCost(call.cost_usd)}
              </div>
            </div>

            <div className="bg-slate-900/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-slate-400">Started</span>
              </div>
              <div className="text-lg font-semibold text-white">
                {new Date(call.started_at).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>

            {call.sentiment && (
              <div className="bg-slate-900/40 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={getSentimentColor(call.sentiment)}>
                    {getSentimentIcon(call.sentiment)}
                  </div>
                  <span className="text-sm text-slate-400">Sentiment</span>
                </div>
                <div className={`text-lg font-semibold capitalize ${getSentimentColor(call.sentiment)}`}>
                  {call.sentiment}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Audio Player */}
        {call.recording_url && (
          <div className="p-6 border-b border-slate-800/50">
            <div className="bg-slate-900/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-slate-200">Call Recording</span>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={togglePlayback}
                  className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>

                <div className="flex-1">
                  <div 
                    className="h-2 bg-slate-700 rounded-full cursor-pointer overflow-hidden"
                    onClick={handleSeek}
                  >
                    <div 
                      className="h-full bg-emerald-400 transition-all duration-100"
                      style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                <button
                  onClick={toggleMute}
                  className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-slate-300 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              <audio
                ref={audioRef}
                src={call.recording_url}
                preload="metadata"
              />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-800/50">
          <button
            onClick={() => setActiveTab('transcript')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'transcript'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Transcript
            </div>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </div>
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'details'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Details
            </div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'transcript' && (
            <div>
              {call.transcript ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Conversation</h3>
                    <button className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-slate-300 transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="bg-slate-900/40 rounded-xl p-4">
                    <pre className="whitespace-pre-wrap text-sm text-slate-300 leading-relaxed">
                      {call.transcript}
                    </pre>
                  </div>
                  {call.summary && (
                    <div>
                      <h4 className="text-md font-semibold text-white mb-3">Summary</h4>
                      <div className="bg-slate-900/40 rounded-xl p-4">
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {call.summary}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-300 mb-2">No Transcript Available</h3>
                  <p className="text-slate-500">The transcript for this call is not available.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Call Analytics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {call.sentiment && (
                  <div className="bg-slate-900/40 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">Sentiment</span>
                      <div className={getSentimentColor(call.sentiment)}>
                        {getSentimentIcon(call.sentiment)}
                      </div>
                    </div>
                    <div className={`text-lg font-semibold capitalize ${getSentimentColor(call.sentiment)}`}>
                      {call.sentiment}
                    </div>
                  </div>
                )}

                {call.intent && (
                  <div className="bg-slate-900/40 rounded-xl p-4">
                    <div className="text-sm text-slate-400 mb-2">Intent</div>
                    <div className="text-lg font-semibold text-white capitalize">
                      {call.intent}
                    </div>
                  </div>
                )}

                {call.satisfaction_score && (
                  <div className="bg-slate-900/40 rounded-xl p-4">
                    <div className="text-sm text-slate-400 mb-2">Satisfaction Score</div>
                    <div className="text-lg font-semibold text-white">
                      {call.satisfaction_score}/10
                    </div>
                  </div>
                )}

                <div className="bg-slate-900/40 rounded-xl p-4">
                  <div className="text-sm text-slate-400 mb-2">End Reason</div>
                  <div className="text-lg font-semibold text-white capitalize">
                    {call.end_reason?.replace(/-/g, ' ') || 'Unknown'}
                  </div>
                </div>
              </div>

              {call.vapi_raw_data && (
                <div>
                  <h4 className="text-md font-semibold text-white mb-3">Raw Data</h4>
                  <div className="bg-slate-900/40 rounded-xl p-4">
                    <pre className="text-xs text-slate-400 overflow-x-auto">
                      {JSON.stringify(call.vapi_raw_data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Call Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-semibold text-white mb-4">Call Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Call ID:</span>
                      <span className="text-slate-300 font-mono text-sm">{call.vapi_call_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Phone Number:</span>
                      <span className="text-slate-300">{call.phone_number || 'Web Call'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Started:</span>
                      <span className="text-slate-300">
                        {new Date(call.started_at).toLocaleString()}
                      </span>
                    </div>
                    {call.ended_at && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Ended:</span>
                        <span className="text-slate-300">
                          {new Date(call.ended_at).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-semibold text-white mb-4">Agent Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Agent:</span>
                      <span className="text-slate-300">{call.agent?.agent_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Voice:</span>
                      <span className="text-slate-300 capitalize">{call.agent?.voice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Model:</span>
                      <span className="text-slate-300">{call.agent?.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Assistant ID:</span>
                      <span className="text-slate-300 font-mono text-sm">{call.vapi_assistant_id}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800/50">
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 rounded-lg transition-colors">
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 rounded-lg transition-colors">
                  <ExternalLink className="w-4 h-4" />
                  View in Vapi
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}