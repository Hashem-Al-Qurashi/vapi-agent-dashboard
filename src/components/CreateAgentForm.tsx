'use client';

import { useState } from 'react';
import { Bot, Loader2, X, Settings, Mic, Brain, Phone } from 'lucide-react';

interface CreateAgentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: AgentFormData) => Promise<void>;
}

export interface AgentFormData {
  agent_name: string;
  system_prompt: string;
  first_message: string;
  model: string;
  voice: string;
  // Advanced Vapi configurations
  maxDurationSeconds?: number;
  backgroundSound?: string;
  backchannelingEnabled?: boolean;
  backgroundDenoisingEnabled?: boolean;
  modelTemperature?: number;
  endCallFunctionEnabled?: boolean;
  endCallPhrases?: string[];
  interruptionThreshold?: number;
  responseDelaySeconds?: number;
}

export default function CreateAgentForm({ isOpen, onClose, onSubmit }: CreateAgentFormProps) {
  const [formData, setFormData] = useState<AgentFormData>({
    agent_name: '',
    system_prompt: '',
    first_message: '',
    model: '',
    voice: '',
    // Advanced defaults
    maxDurationSeconds: 1800, // 30 minutes
    backgroundSound: 'none',
    backchannelingEnabled: true,
    backgroundDenoisingEnabled: true,
    modelTemperature: 0.7,
    endCallFunctionEnabled: true,
    endCallPhrases: ['goodbye', 'bye', 'end call', 'hang up'],
    interruptionThreshold: 100,
    responseDelaySeconds: 0.5
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<AgentFormData>>({});
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Available models and voices from Vapi
  const models = [
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
    { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' }
  ];

  const voices = [
    { value: 'alloy', label: 'Alloy (Professional)' },
    { value: 'echo', label: 'Echo (Warm)' },
    { value: 'fable', label: 'Fable (Expressive)' },
    { value: 'onyx', label: 'Onyx (Deep)' },
    { value: 'nova', label: 'Nova (Clear)' },
    { value: 'shimmer', label: 'Shimmer (Bright)' }
  ];

  const handleInputChange = (field: keyof AgentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<AgentFormData> = {};
    
    if (!formData.agent_name.trim()) newErrors.agent_name = 'Agent name is required';
    if (!formData.system_prompt.trim()) newErrors.system_prompt = 'System prompt is required';
    if (!formData.first_message.trim()) newErrors.first_message = 'First message is required';
    if (!formData.model) newErrors.model = 'Model selection is required';
    if (!formData.voice) newErrors.voice = 'Voice selection is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
      // Reset form on success
      setFormData({
        agent_name: '',
        system_prompt: '',
        first_message: '',
        model: '',
        voice: ''
      });
      onClose();
    } catch (error) {
      console.error('Error creating agent:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-emerald-500/30 bg-slate-950/95 backdrop-blur-2xl shadow-[0_40px_120px_rgba(15,118,110,0.45)]">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-emerald-500/20 to-transparent pointer-events-none"></div>
        
        {/* Header */}
        <div className="relative flex items-center justify-between p-6 border-b border-emerald-500/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-400/40">
              <Bot className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Create Voice AI Agent</h2>
              <p className="text-sm text-slate-400">Deploy a new intelligent voice assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Agent Name */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Agent Name
            </label>
            <input
              type="text"
              value={formData.agent_name}
              onChange={(e) => handleInputChange('agent_name', e.target.value)}
              placeholder="e.g., Customer Support AI"
              className={`w-full px-4 py-3 bg-slate-900/60 border rounded-xl text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all backdrop-blur-xl ${
                errors.agent_name ? 'border-red-400/50 focus:border-red-400/50 focus:ring-red-400/50' : 'border-slate-700/50 focus:border-emerald-400/50'
              }`}
            />
            {errors.agent_name && (
              <p className="mt-1 text-sm text-red-400">{errors.agent_name}</p>
            )}
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              <Brain className="w-4 h-4 inline mr-2" />
              System Prompt
            </label>
            <textarea
              value={formData.system_prompt}
              onChange={(e) => handleInputChange('system_prompt', e.target.value)}
              placeholder="You are a helpful assistant that..."
              rows={4}
              className={`w-full px-4 py-3 bg-slate-900/60 border rounded-xl text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all backdrop-blur-xl resize-none ${
                errors.system_prompt ? 'border-red-400/50 focus:border-red-400/50 focus:ring-red-400/50' : 'border-slate-700/50 focus:border-emerald-400/50'
              }`}
            />
            {errors.system_prompt && (
              <p className="mt-1 text-sm text-red-400">{errors.system_prompt}</p>
            )}
          </div>

          {/* First Message */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              First Message / Greeting
            </label>
            <input
              type="text"
              value={formData.first_message}
              onChange={(e) => handleInputChange('first_message', e.target.value)}
              placeholder="Hello! How can I help you today?"
              className={`w-full px-4 py-3 bg-slate-900/60 border rounded-xl text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all backdrop-blur-xl ${
                errors.first_message ? 'border-red-400/50 focus:border-red-400/50 focus:ring-red-400/50' : 'border-slate-700/50 focus:border-emerald-400/50'
              }`}
            />
            {errors.first_message && (
              <p className="mt-1 text-sm text-red-400">{errors.first_message}</p>
            )}
          </div>

          {/* Model Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                <Settings className="w-4 h-4 inline mr-2" />
                Model
              </label>
              <select
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                className={`w-full px-4 py-3 bg-slate-900/60 border rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all backdrop-blur-xl ${
                  errors.model ? 'border-red-400/50 focus:border-red-400/50 focus:ring-red-400/50' : 'border-slate-700/50 focus:border-emerald-400/50'
                }`}
              >
                <option value="">Select a model</option>
                {models.map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
              {errors.model && (
                <p className="mt-1 text-sm text-red-400">{errors.model}</p>
              )}
            </div>

            {/* Voice Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                <Mic className="w-4 h-4 inline mr-2" />
                Voice
              </label>
              <select
                value={formData.voice}
                onChange={(e) => handleInputChange('voice', e.target.value)}
                className={`w-full px-4 py-3 bg-slate-900/60 border rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all backdrop-blur-xl ${
                  errors.voice ? 'border-red-400/50 focus:border-red-400/50 focus:ring-red-400/50' : 'border-slate-700/50 focus:border-emerald-400/50'
                }`}
              >
                <option value="">Select a voice</option>
                {voices.map((voice) => (
                  <option key={voice.value} value={voice.value}>
                    {voice.label}
                  </option>
                ))}
              </select>
              {errors.voice && (
                <p className="mt-1 text-sm text-red-400">{errors.voice}</p>
              )}
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <div className="border-t border-slate-700/50 pt-6">
            <button
              type="button"
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-emerald-300 transition-colors mb-4"
            >
              <Settings className="w-4 h-4" />
              Advanced Vapi Configuration
              <span className={`transition-transform duration-200 ${showAdvancedSettings ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {/* Advanced Settings Panel */}
            {showAdvancedSettings && (
              <div className="space-y-6 p-4 bg-slate-900/40 rounded-xl border border-slate-700/30" style={{animation: 'fadeSlideIn 0.3s ease-out both'}}>
                
                {/* Call Behavior */}
                <div>
                  <h4 className="text-sm font-medium text-slate-200 mb-3 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-300" />
                    Call Behavior
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Max Call Duration (seconds)
                      </label>
                      <input
                        type="number"
                        value={formData.maxDurationSeconds}
                        onChange={(e) => handleInputChange('maxDurationSeconds', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800/60 border border-slate-600/50 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Response Delay (seconds)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.responseDelaySeconds}
                        onChange={(e) => handleInputChange('responseDelaySeconds', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800/60 border border-slate-600/50 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* AI Model Settings */}
                <div>
                  <h4 className="text-sm font-medium text-slate-200 mb-3 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-emerald-300" />
                    AI Model Settings
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Model Temperature (0.0 - 2.0)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="2"
                        value={formData.modelTemperature}
                        onChange={(e) => handleInputChange('modelTemperature', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800/60 border border-slate-600/50 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all"
                      />
                      <p className="text-xs text-slate-400 mt-1">Lower = more focused, Higher = more creative</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Interruption Threshold (ms)
                      </label>
                      <input
                        type="number"
                        value={formData.interruptionThreshold}
                        onChange={(e) => handleInputChange('interruptionThreshold', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800/60 border border-slate-600/50 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all"
                      />
                      <p className="text-xs text-slate-400 mt-1">How quickly agent responds to interruptions</p>
                    </div>
                  </div>
                </div>

                {/* Audio Settings */}
                <div>
                  <h4 className="text-sm font-medium text-slate-200 mb-3 flex items-center gap-2">
                    <Mic className="w-4 h-4 text-emerald-300" />
                    Audio Settings
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm text-slate-300">
                        <input
                          type="checkbox"
                          checked={formData.backchannelingEnabled}
                          onChange={(e) => setFormData(prev => ({ ...prev, backchannelingEnabled: e.target.checked }))}
                          className="w-4 h-4 bg-slate-800 border border-slate-600 rounded focus:ring-2 focus:ring-emerald-400/50 text-emerald-400"
                        />
                        Enable Backchanneling (uh-huh, mm-hmm)
                      </label>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm text-slate-300">
                        <input
                          type="checkbox"
                          checked={formData.backgroundDenoisingEnabled}
                          onChange={(e) => setFormData(prev => ({ ...prev, backgroundDenoisingEnabled: e.target.checked }))}
                          className="w-4 h-4 bg-slate-800 border border-slate-600 rounded focus:ring-2 focus:ring-emerald-400/50 text-emerald-400"
                        />
                        Background Noise Reduction
                      </label>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm text-slate-300">
                        <input
                          type="checkbox"
                          checked={formData.endCallFunctionEnabled}
                          onChange={(e) => setFormData(prev => ({ ...prev, endCallFunctionEnabled: e.target.checked }))}
                          className="w-4 h-4 bg-slate-800 border border-slate-600 rounded focus:ring-2 focus:ring-emerald-400/50 text-emerald-400"
                        />
                        Smart Call Ending Detection
                      </label>
                    </div>
                  </div>
                </div>

                {/* End Call Phrases */}
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    End Call Phrases
                  </label>
                  <div className="space-y-2">
                    <textarea
                      value={formData.endCallPhrases?.join(', ') || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        endCallPhrases: e.target.value.split(',').map(phrase => phrase.trim()).filter(Boolean)
                      }))}
                      placeholder="goodbye, bye, end call, hang up, talk later"
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-800/60 border border-slate-600/50 rounded-lg text-slate-100 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all resize-none"
                    />
                    <p className="text-xs text-slate-400">
                      Comma-separated phrases that trigger call ending
                    </p>
                  </div>
                </div>

                {/* Background Sound */}
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Background Sound
                  </label>
                  <select
                    value={formData.backgroundSound}
                    onChange={(e) => handleInputChange('backgroundSound', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/60 border border-slate-600/50 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all"
                  >
                    <option value="none">No Background Sound</option>
                    <option value="office">Office Ambience</option>
                    <option value="nature">Nature Sounds</option>
                    <option value="cafe">Cafe Atmosphere</option>
                    <option value="white_noise">White Noise</option>
                  </select>
                </div>

              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/50">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="relative inline-flex items-center justify-center gap-2 overflow-hidden transition-all duration-300 hover:ring-emerald-400/70 hover:shadow-[0_0_0_1px_rgba(52,211,153,0.4),0_30px_80px_rgba(16,185,129,0.3)] group ring-emerald-500/40 ring-1 font-medium text-slate-950 tracking-tight bg-emerald-400 rounded-full py-3 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Agent...</span>
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4" />
                  <span>Create Agent</span>
                </>
              )}
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300" style={{background: 'radial-gradient(circle at 0% 0%, rgba(250,250,250,0.4), transparent 55%)'}}></span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}