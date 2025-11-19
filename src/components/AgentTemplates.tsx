'use client';

import { useState } from 'react';
import { Bot, Sparkles, Users, ShoppingCart, Calendar, Headphones, Building, Heart } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
  systemPrompt: string;
  firstMessage: string;
  model: string;
  voice: string;
  color: string;
}

interface AgentTemplatesProps {
  onSelectTemplate: (template: Template) => void;
}

export default function AgentTemplates({ onSelectTemplate }: AgentTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const templates: Template[] = [
    {
      id: 'customer-support',
      name: 'Customer Support Pro',
      description: 'Friendly, knowledgeable support agent that resolves issues efficiently',
      icon: Headphones,
      category: 'support',
      systemPrompt: 'You are a professional customer support representative. You are helpful, patient, and solution-oriented. Always acknowledge the customer\'s concern, ask clarifying questions, and provide clear step-by-step solutions. If you cannot resolve an issue, escalate appropriately.',
      firstMessage: 'Hello! I\'m here to help resolve any questions or issues you might have. What can I assist you with today?',
      model: 'gpt-4',
      voice: 'alloy',
      color: 'emerald'
    },
    {
      id: 'sales-assistant',
      name: 'Sales Specialist',
      description: 'Charismatic sales agent that converts leads and builds relationships',
      icon: Users,
      category: 'sales',
      systemPrompt: 'You are an expert sales representative. You are enthusiastic, persuasive, and customer-focused. Listen carefully to customer needs, ask qualifying questions, present solutions that match their requirements, and guide them through the sales process naturally.',
      firstMessage: 'Hi there! Welcome to our company. I\'d love to learn about what you\'re looking for and show you how we can help. What brings you here today?',
      model: 'gpt-4',
      voice: 'nova',
      color: 'blue'
    },
    {
      id: 'appointment-scheduler',
      name: 'Smart Scheduler',
      description: 'Efficient booking agent that manages calendars and appointments',
      icon: Calendar,
      category: 'operations',
      systemPrompt: 'You are a professional appointment scheduling assistant. You are organized, efficient, and detail-oriented. Help customers find suitable appointment times, confirm booking details, send reminders, and handle rescheduling requests professionally.',
      firstMessage: 'Hello! I can help you schedule an appointment. What service are you interested in and when would work best for you?',
      model: 'gpt-3.5-turbo',
      voice: 'shimmer',
      color: 'purple'
    },
    {
      id: 'e-commerce',
      name: 'Shopping Assistant',
      description: 'Personal shopping guide that helps customers find perfect products',
      icon: ShoppingCart,
      category: 'sales',
      systemPrompt: 'You are a knowledgeable shopping assistant. Help customers discover products, compare options, answer questions about features and specifications, and guide them through the purchase process. Be helpful and informative without being pushy.',
      firstMessage: 'Welcome to our store! I\'m here to help you find exactly what you\'re looking for. What type of product interests you today?',
      model: 'gpt-4',
      voice: 'echo',
      color: 'orange'
    },
    {
      id: 'receptionist',
      name: 'Virtual Receptionist',
      description: 'Professional front desk agent that handles inquiries and routing',
      icon: Building,
      category: 'operations',
      systemPrompt: 'You are a professional virtual receptionist. You are polite, efficient, and well-informed about company services. Greet callers warmly, direct them to appropriate departments, take messages, and provide general company information.',
      firstMessage: 'Good day! Thank you for calling. I\'m here to help connect you with the right person or answer any questions about our services. How may I assist you?',
      model: 'gpt-3.5-turbo',
      voice: 'alloy',
      color: 'slate'
    },
    {
      id: 'therapist',
      name: 'Wellness Coach',
      description: 'Empathetic wellness companion that provides emotional support',
      icon: Heart,
      category: 'wellness',
      systemPrompt: 'You are a compassionate wellness coach. You provide emotional support, active listening, and gentle guidance. Always validate feelings, ask open-ended questions, and offer constructive coping strategies. Remember you are not a replacement for professional therapy.',
      firstMessage: 'Hello, I\'m glad you reached out today. This is a safe space to share what\'s on your mind. How are you feeling right now?',
      model: 'gpt-4',
      voice: 'nova',
      color: 'pink'
    }
  ];

  const categories = [
    { id: 'all', label: 'All Templates', count: templates.length },
    { id: 'support', label: 'Customer Support', count: templates.filter(t => t.category === 'support').length },
    { id: 'sales', label: 'Sales & Marketing', count: templates.filter(t => t.category === 'sales').length },
    { id: 'operations', label: 'Operations', count: templates.filter(t => t.category === 'operations').length },
    { id: 'wellness', label: 'Wellness', count: templates.filter(t => t.category === 'wellness').length },
  ];

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const getColorClasses = (color: string) => {
    const colors = {
      emerald: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20',
      blue: 'border-blue-400/40 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20',
      purple: 'border-purple-400/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20',
      orange: 'border-orange-400/40 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20',
      slate: 'border-slate-400/40 bg-slate-500/10 text-slate-300 hover:bg-slate-500/20',
      pink: 'border-pink-400/40 bg-pink-500/10 text-pink-300 hover:bg-pink-500/20',
    };
    return colors[color as keyof typeof colors] || colors.emerald;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-4 py-2 backdrop-blur border border-emerald-400/30 text-emerald-200/90 mb-4">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm">Choose from professional templates</span>
        </div>
        <h2 className="text-2xl font-semibold text-white mb-2">Agent Templates</h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Start with proven templates designed for specific use cases. Each template includes optimized prompts, voice selection, and configuration.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === category.id
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                : 'bg-slate-900/50 text-slate-400 border border-slate-700/50 hover:text-slate-300 hover:border-slate-600/50'
            }`}
          >
            {category.label}
            <span className="ml-1 text-xs opacity-60">({category.count})</span>
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => {
          const Icon = template.icon;
          return (
            <div
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              className="group cursor-pointer rounded-2xl border border-slate-700/50 bg-slate-900/60 p-5 backdrop-blur-xl hover:border-emerald-400/40 hover:bg-slate-900/80 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${getColorClasses(template.color)}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100 group-hover:text-emerald-100 transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-xs text-slate-400">{template.category}</p>
                </div>
              </div>
              
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                {template.description}
              </p>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Model:</span>
                  <span className="text-slate-300">{template.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Voice:</span>
                  <span className="text-slate-300">{template.voice}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/50">
                <div className="text-xs text-slate-400 group-hover:text-emerald-300 transition-colors">
                  Click to use this template →
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}