'use client';

import { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  NodeTypes,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Bot, Settings, Mic, MessageSquare, X, Play, Save } from 'lucide-react';

// Custom Node Components
const AgentNode = ({ data }: { data: any }) => (
  <div className="bg-slate-900/90 border border-emerald-400/40 rounded-xl p-4 backdrop-blur-xl shadow-xl min-w-[200px]">
    <div className="flex items-center gap-2 mb-3">
      <Bot className="w-5 h-5 text-emerald-300" />
      <span className="font-semibold text-slate-100">{data.label}</span>
    </div>
    <div className="space-y-2 text-xs text-slate-400">
      <div>Model: {data.model}</div>
      <div>Voice: {data.voice}</div>
    </div>
    <Handle type="target" position={Position.Left} className="w-3 h-3 bg-emerald-400 border-2 border-slate-900" />
    <Handle type="source" position={Position.Right} className="w-3 h-3 bg-emerald-400 border-2 border-slate-900" />
  </div>
);

const PromptNode = ({ data }: { data: any }) => (
  <div className="bg-slate-800/90 border border-blue-400/40 rounded-xl p-4 backdrop-blur-xl shadow-xl min-w-[180px]">
    <div className="flex items-center gap-2 mb-2">
      <MessageSquare className="w-4 h-4 text-blue-300" />
      <span className="font-medium text-slate-200">System Prompt</span>
    </div>
    <div className="text-xs text-slate-400 line-clamp-3">
      {data.prompt}
    </div>
    <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-400 border-2 border-slate-900" />
    <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-400 border-2 border-slate-900" />
  </div>
);

const VoiceNode = ({ data }: { data: any }) => (
  <div className="bg-slate-800/90 border border-purple-400/40 rounded-xl p-4 backdrop-blur-xl shadow-xl min-w-[160px]">
    <div className="flex items-center gap-2 mb-2">
      <Mic className="w-4 h-4 text-purple-300" />
      <span className="font-medium text-slate-200">Voice</span>
    </div>
    <div className="text-xs text-slate-400">
      {data.voice} ({data.provider})
    </div>
    <Handle type="target" position={Position.Left} className="w-3 h-3 bg-purple-400 border-2 border-slate-900" />
    <Handle type="source" position={Position.Right} className="w-3 h-3 bg-purple-400 border-2 border-slate-900" />
  </div>
);

const ModelNode = ({ data }: { data: any }) => (
  <div className="bg-slate-800/90 border border-orange-400/40 rounded-xl p-4 backdrop-blur-xl shadow-xl min-w-[160px]">
    <div className="flex items-center gap-2 mb-2">
      <Settings className="w-4 h-4 text-orange-300" />
      <span className="font-medium text-slate-200">Model</span>
    </div>
    <div className="text-xs text-slate-400">
      {data.model}
    </div>
    <Handle type="target" position={Position.Left} className="w-3 h-3 bg-orange-400 border-2 border-slate-900" />
    <Handle type="source" position={Position.Right} className="w-3 h-3 bg-orange-400 border-2 border-slate-900" />
  </div>
);

const nodeTypes: NodeTypes = {
  agent: AgentNode,
  prompt: PromptNode,
  voice: VoiceNode,
  model: ModelNode,
};

interface VisualAgentBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (agentConfig: any) => void;
}

export default function VisualAgentBuilder({ isOpen, onClose, onSave }: VisualAgentBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [agentConfig, setAgentConfig] = useState({
    name: '',
    model: 'gpt-4',
    voice: 'alloy',
    prompt: '',
    firstMessage: ''
  });

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Initialize default flow
  const initializeFlow = useCallback(() => {
    const initialNodes: Node[] = [
      {
        id: 'agent-1',
        type: 'agent',
        position: { x: 400, y: 200 },
        data: { label: 'Voice AI Agent', model: 'gpt-4', voice: 'alloy' },
      },
      {
        id: 'prompt-1',
        type: 'prompt',
        position: { x: 100, y: 100 },
        data: { prompt: 'You are a helpful assistant...' },
      },
      {
        id: 'voice-1',
        type: 'voice',
        position: { x: 100, y: 250 },
        data: { voice: 'alloy', provider: 'OpenAI' },
      },
      {
        id: 'model-1',
        type: 'model',
        position: { x: 100, y: 350 },
        data: { model: 'gpt-4' },
      },
    ];

    const initialEdges: Edge[] = [
      { id: 'e1-2', source: 'prompt-1', target: 'agent-1', animated: true, style: { stroke: '#10b981' } },
      { id: 'e2-3', source: 'voice-1', target: 'agent-1', animated: true, style: { stroke: '#a855f7' } },
      { id: 'e3-4', source: 'model-1', target: 'agent-1', animated: true, style: { stroke: '#f97316' } },
    ];

    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [setNodes, setEdges]);

  const handleSave = () => {
    // Extract configuration from nodes
    const promptNode = nodes.find(n => n.type === 'prompt');
    const voiceNode = nodes.find(n => n.type === 'voice');
    const modelNode = nodes.find(n => n.type === 'model');
    const agentNode = nodes.find(n => n.type === 'agent');

    const config = {
      agent_name: agentNode?.data.label || 'Visual Agent',
      system_prompt: promptNode?.data.prompt || 'You are a helpful assistant.',
      first_message: 'Hello! I was created using the visual agent builder.',
      model: modelNode?.data.model || 'gpt-4',
      voice: voiceNode?.data.voice || 'alloy'
    };

    onSave(config);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      <div className="absolute inset-4 bg-slate-950/95 border border-emerald-500/30 rounded-3xl backdrop-blur-2xl shadow-[0_40px_120px_rgba(15,118,110,0.45)] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-400/40">
              <Bot className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Visual Agent Builder</h2>
              <p className="text-sm text-slate-400">Drag and connect nodes to design your agent</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={initializeFlow}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700/50 transition-colors"
            >
              <Play className="w-4 h-4" />
              Reset Flow
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-400/40 rounded-lg text-emerald-300 hover:bg-emerald-500/30 transition-colors"
            >
              <Save className="w-4 h-4" />
              Create Agent
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* React Flow Canvas */}
        <div className="h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className="bg-slate-950"
            onInit={initializeFlow}
          >
            <Background 
              variant={BackgroundVariant.Dots} 
              gap={20} 
              size={1} 
              color="rgba(16,185,129,0.2)"
            />
            <Controls 
              className="bg-slate-900/90 border border-slate-700 rounded-lg"
              showInteractive={false}
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}