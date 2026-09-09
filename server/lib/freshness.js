/**
 * Per-source freshness reporting for an index build.
 *
 * Sources degrade quietly by design — a rate-limited GitHub or a dead LinkedIn
 * scraper falls back to cached text so the bot keeps answering. That safety net
 * is also a hazard: without a signal, a run that served month-old text looks
 * exactly like a run that served today's, and the knowledge base rots silently.
 *
 * Every source therefore reports what it actually used. `build-index.js --strict`
 * turns any fallback into a failed build, so a degraded nightly run shows a red X
 * instead of shipping stale text under a fresh `builtAt`.
 */

const reports = new Map();

/**
 * @param {string} source  'github' | 'linkedin' | ...
 * @param {{fresh: boolean, reason?: string, asOf?: string}} status
 */
export function reportSource(source, status) {
    reports.set(source, { source, fresh: Boolean(status.fresh), ...status });
}

export function freshnessReport() {
    return [...reports.values()];
}

export function staleSources() {
    return freshnessReport().filter((r) => !r.fresh);
}

/** Test seam — build scripts run once, but tests reuse the module. */
export function resetFreshness() {
    reports.clear();
}
