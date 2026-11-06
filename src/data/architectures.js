/**
 * Architecture diagrams for the expandable rows in the Work section, keyed by
 * the project `title` in ./projects.js.
 *
 * Every entry is transcribed from the project's own repository — `source` says
 * where — so the diagram never shows a component the project doesn't have.
 * Kept out of projects.js on purpose: that module also feeds the RAG index,
 * and the bot doesn't need layout data.
 *
 * Shape:
 *   source  — where the diagram comes from (shown under the figure)
 *   layers  — top → bottom flow
 *     label     short UPPERCASE layer name
 *     nodes     [{ name, note?, accent? }]   boxes in this layer
 *     chain     [string]                     alternative to nodes: a sequential pipeline
 *     parallel  true when the nodes run concurrently (fan-out)
 *     edge      label for the connection to the next layer
 */
import { derived } from './architectures.derived.js';

export const architectures = {
    'VaquaH Cooling Service': {
        source: 'VaquaH / SYSTEM_ARCHITECTURE.md',
        layers: [
            {
                label: 'CLIENT',
                nodes: [
                    { name: 'React 18 + Vite', note: 'Tailwind · shadcn/ui · React Query' },
                    { name: 'Voice assistant', note: 'Web Speech API + TTS playback' },
                    { name: 'Firebase SDK', note: 'Google + email sign-in' },
                ],
                edge: 'https / rest',
            },
            {
                label: 'API',
                nodes: [
                    { name: 'Express.js API', note: 'chat · voice · payments · admin', accent: true },
                ],
                edge: 'services',
            },
            {
                label: 'SERVICES',
                nodes: [
                    { name: 'RAG chatbot', note: 'Groq llama-3.3-70b + retrieval' },
                    { name: 'Embeddings', note: 'all-MiniLM-L6-v2 · in-memory' },
                    { name: 'Voice I/O', note: 'Edge TTS · Whisper STT' },
                ],
                edge: 'sdk / api',
            },
            {
                label: 'PLATFORM',
                nodes: [
                    { name: 'Firebase', note: 'Firestore · Auth · Storage' },
                    { name: 'Groq Cloud', note: 'LLM + Whisper' },
                    { name: 'Razorpay', note: 'orders · verification' },
                ],
            },
        ],
    },

    TrafficMind: {
        source: 'TrafficMind / README.md — Architecture',
        layers: [
            {
                label: 'DATA',
                nodes: [
                    { name: 'Feed engine', note: '250 Brooklyn road segments' },
                    { name: 'Risk scorer', note: 'anomaly detector' },
                    { name: 'RAG', note: '12 SOPs · TF-IDF retrieval' },
                ],
                edge: 'incident state',
            },
            {
                label: 'AGENTS',
                parallel: true,
                nodes: [
                    { name: 'Signal agent', note: 'intersection re-timing' },
                    { name: 'Routing agent', note: 'diversion routes' },
                    { name: 'Alert agent', note: 'VMS · radio · social' },
                    { name: 'Density agent', note: 'vehicle density' },
                    { name: 'Narrative agent' },
                ],
                edge: 'fan-in',
            },
            {
                label: 'SUPERVISOR',
                nodes: [
                    { name: 'Supervisor (Gemini)', note: 'confidence · cascade risk · SOP', accent: true },
                ],
                edge: 'websocket',
            },
            {
                label: 'UI',
                nodes: [
                    { name: 'Next.js 16 + React 19', note: 'Dashboard · Digital Twin' },
                    { name: 'Mapbox', note: 'live road network' },
                ],
            },
        ],
    },

    Kontexo: {
        source: 'Kontexo / README.md — Architecture',
        layers: [
            {
                label: 'FRONTEND',
                nodes: [{ name: 'Next.js 14', note: 'DAG editor · HITL modal · live preview' }],
                edge: 'rest + sse',
            },
            {
                label: 'GATEWAY',
                nodes: [
                    { name: 'FastAPI', note: 'auth · rate limit · tenant isolation' },
                    { name: 'Celery + Redis', note: 'async workers · pub/sub → SSE' },
                ],
                edge: 'workflow',
            },
            {
                label: 'LANGGRAPH',
                chain: ['Classifier', 'Planner', 'Critic', 'HITL gate', 'Executor', 'Monitor', 'Synthesizer'],
                edge: 'tool calls',
            },
            {
                label: 'MCP-GUARD',
                nodes: [{ name: 'Security proxy', note: 'SHA-256 · injection scan · approval', accent: true }],
                edge: 'json-rpc 2.0',
            },
            {
                label: 'MCP SERVER',
                nodes: [
                    { name: 'GitHub', note: '7 tools' },
                    { name: 'Slack', note: '3 tools' },
                    { name: 'Sheets', note: '3 tools' },
                    { name: 'Trello', note: '6 tools' },
                ],
            },
        ],
    },

    FlowPilot: {
        source: 'ET-Gen-Hackathon / system_architecture.svg + workflow_diagram.svg',
        layers: [
            {
                label: 'FRONTEND',
                nodes: [
                    { name: 'Next.js UI', note: 'dashboard & workflows' },
                    { name: 'Firebase Auth', note: 'JWT provider' },
                ],
                edge: 'rest / sse',
            },
            {
                label: 'ORCHESTRATE',
                nodes: [
                    { name: 'Orchestrator agent', note: 'supervisor · LLM router (Gemini)', accent: true },
                ],
                edge: 'routes + reports back',
            },
            {
                label: 'AGENTS',
                nodes: [
                    { name: 'Data retrieval', note: 'input / schema checks' },
                    { name: 'Decision', note: 'business rules · SLA' },
                    { name: 'Verification', note: 'compliance · 3-way match' },
                    { name: 'Execution', note: 'POs · API integrations' },
                ],
                edge: 'on error',
            },
            {
                label: 'RECOVERY',
                chain: ['Retry', 'Reroute', 'Escalate'],
                edge: 'every decision',
            },
            {
                label: 'AUDIT',
                nodes: [{ name: 'Audit trail', note: 'Supabase PostgreSQL · immutable' }],
            },
        ],
    },

    ...derived,
};
