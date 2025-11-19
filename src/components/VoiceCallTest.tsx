'use client';

import { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Loader2 } from 'lucide-react';

interface VoiceCallTestProps {
  agentId: string;
  agentName: string;
  onCallEnd?: (callData: any) => void;
}

export default function VoiceCallTest({ agentId, agentName, onCallEnd }: VoiceCallTestProps) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [vapi, setVapi] = useState<any>(null);
  const [callDuration, setCallDuration] = useState(0);

  // Load Vapi Web SDK
  useEffect(() => {
    const loadVapiSDK = () => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@vapi-ai/web@latest/dist/index.js';
      script.onload = () => {
        if ((window as any).Vapi) {
          const vapiInstance = new (window as any).Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY);
          
          // Set up event listeners
          vapiInstance.on('call-start', () => {
            console.log('Call started');
            setIsCallActive(true);
            setIsConnecting(false);
          });

          vapiInstance.on('call-end', (callData: any) => {
            console.log('Call ended', callData);
            setIsCallActive(false);
            setIsConnecting(false);
            setCallDuration(0);
            if (onCallEnd) {
              onCallEnd(callData);
            }
          });

          vapiInstance.on('error', (error: any) => {
            console.error('Vapi error:', error);
            setIsCallActive(false);
            setIsConnecting(false);
          });

          vapiInstance.on('message', (message: any) => {
            console.log('Vapi message:', message);
          });

          setVapi(vapiInstance);
        }
      };
      script.onerror = () => {
        console.error('Failed to load Vapi SDK');
      };
      document.head.appendChild(script);
    };

    if (!(window as any).Vapi) {
      loadVapiSDK();
    } else {
      const vapiInstance = new (window as any).Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY);
      setVapi(vapiInstance);
    }
  }, []);

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCallActive]);

  const startCall = async () => {
    if (!vapi) {
      console.error('Vapi not initialized');
      return;
    }

    setIsConnecting(true);
    try {
      await vapi.start({
        assistantId: agentId,
        // Additional configuration
        transcriber: {
          provider: 'deepgram',
          model: 'nova-2'
        }
      });
    } catch (error) {
      console.error('Failed to start call:', error);
      setIsConnecting(false);
    }
  };

  const endCall = () => {
    if (vapi && isCallActive) {
      vapi.stop();
    }
  };

  const toggleMute = () => {
    if (vapi) {
      if (isMuted) {
        vapi.unmute();
      } else {
        vapi.mute();
      }
      setIsMuted(!isMuted);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      {/* Call Button */}
      {!isCallActive && !isConnecting && (
        <button
          onClick={startCall}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition-colors border border-emerald-400/30"
        >
          <Phone className="w-3.5 h-3.5" />
          Test Call
        </button>
      )}

      {/* Connecting State */}
      {isConnecting && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 text-amber-300 rounded-lg text-xs font-medium border border-amber-400/30">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Connecting...
        </div>
      )}

      {/* Active Call Controls */}
      {isCallActive && (
        <div className="flex items-center gap-2">
          {/* Call Duration */}
          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded text-xs font-mono border border-emerald-400/30">
            🔴 {formatDuration(callDuration)}
          </div>

          {/* Mute Button */}
          <button
            onClick={toggleMute}
            className={`p-1.5 rounded-lg text-xs transition-colors border ${
              isMuted 
                ? 'bg-red-500/20 text-red-300 border-red-400/30 hover:bg-red-500/30' 
                : 'bg-slate-700/50 text-slate-300 border-slate-600/50 hover:bg-slate-600/50'
            }`}
          >
            {isMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
          </button>

          {/* End Call Button */}
          <button
            onClick={endCall}
            className="inline-flex items-center gap-1 px-2 py-1.5 bg-red-500/20 text-red-300 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-colors border border-red-400/30"
          >
            <PhoneOff className="w-3 h-3" />
            End
          </button>
        </div>
      )}
    </div>
  );
}