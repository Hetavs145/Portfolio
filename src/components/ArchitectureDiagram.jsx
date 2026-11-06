import React from 'react';

/**
 * Renders a layered architecture (see src/data/architectures.js) as a top →
 * bottom flow: a mono layer label on the left, boxes or a chained pipeline on
 * the right, and labelled connectors between layers. Plain HTML rather than
 * SVG so long names wrap on small screens instead of overflowing.
 */
const Node = ({ name, note, accent }) => (
    <div
        className={`rounded-md border px-3 py-2 min-w-0 ${
            accent ? 'bg-ink border-ink text-ice-hi' : 'bg-ice-hi border-ink/70 text-ink'
        }`}
    >
        <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] leading-snug">{name}</div>
        {note && (
            <div className={`text-[12px] leading-snug mt-0.5 ${accent ? 'text-ice-2/80' : 'text-ink-mute'}`}>{note}</div>
        )}
    </div>
);

const Connector = ({ label }) => (
    <div className="flex items-center gap-2.5 py-1 pl-4" aria-hidden="true">
        <svg width="10" height="26" viewBox="0 0 10 26" className="shrink-0 text-ink">
            <line x1="5" y1="0" x2="5" y2="22" stroke="currentColor" strokeWidth="1" />
            <path d="M1.5 19 L5 25 L8.5 19" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
        {label && <span className="label text-[10px] text-arc-deep">{label}</span>}
    </div>
);

const ArchitectureDiagram = ({ figId, diagram }) => {
    if (!diagram) return null;
    const { layers, source, basis } = diagram;

    return (
        <figure className="min-w-0">
            <figcaption className="label text-ink-mute flex flex-wrap justify-between gap-x-4 gap-y-1 mb-4">
                <span>Fig. {figId} — System architecture</span>
            </figcaption>

            <ol className="min-w-0">
                {layers.map((layer, i) => (
                    <li key={layer.label + i} className="min-w-0">
                        <div className="grid grid-cols-[84px_1fr] sm:grid-cols-[104px_1fr] gap-3 items-start">
                            <div className="label text-[10px] text-ink-mute pt-2.5 leading-tight">
                                {layer.label}
                                {layer.parallel && <span className="block text-arc-deep mt-1">∥ parallel</span>}
                            </div>

                            {layer.chain ? (
                                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                                    {layer.chain.map((step, j) => (
                                        <React.Fragment key={step}>
                                            {j > 0 && <span className="font-mono text-xs text-ink-mute" aria-hidden="true">→</span>}
                                            <span className="rounded-md border border-ink/70 bg-ice-hi px-2.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink">
                                                {step}
                                            </span>
                                        </React.Fragment>
                                    ))}
                                </div>
                            ) : (
                                <div
                                    className={`grid gap-2 min-w-0 ${
                                        layer.parallel ? 'border-l-2 border-arc pl-2.5' : ''
                                    } ${
                                        layer.nodes.length >= 3
                                            ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                                            : layer.nodes.length === 2
                                                ? 'grid-cols-1 sm:grid-cols-2'
                                                : 'grid-cols-1'
                                    }`}
                                >
                                    {layer.nodes.map((n) => (
                                        <Node key={n.name} {...n} />
                                    ))}
                                </div>
                            )}
                        </div>
                        {i < layers.length - 1 && (
                            <div className="grid grid-cols-[84px_1fr] sm:grid-cols-[104px_1fr] gap-3">
                                <span />
                                <Connector label={layer.edge} />
                            </div>
                        )}
                    </li>
                ))}
            </ol>

            <p className="label text-[10px] text-ink-mute mt-4 leading-relaxed">
                Source: {source}
                {basis && basis.length > 0 && <span className="normal-case tracking-normal"> — {basis.slice(0, 3).join(', ')}{basis.length > 3 ? ` +${basis.length - 3} more` : ''}</span>}
            </p>
        </figure>
    );
};

export default ArchitectureDiagram;
