/**
 * Vector encoding for the committed index.
 *
 * Storing 2048-dim vectors as JSON float arrays cost 1.9 MB for 70 chunks — and
 * the daily refresh workflow commits this file, so that would add up to hundreds
 * of megabytes of git history a year on a portfolio repo.
 *
 * int8 quantisation with a per-vector scale brings it to ~190 KB (10x smaller).
 * Cosine similarity is scale-invariant and only the *ranking* matters here, so
 * the precision loss is immaterial — `scripts/verify-codec.js` asserts that
 * top-5 retrieval is byte-identical to the float32 version across sample queries.
 */

/** Encode Float64/Float32 values as base64 int8 plus the scale needed to undo it. */
export function encodeVector(vec) {
    let max = 0;
    for (const v of vec) {
        const a = Math.abs(v);
        if (a > max) max = a;
    }
    const scale = max === 0 ? 1 : max / 127;

    const bytes = new Int8Array(vec.length);
    for (let i = 0; i < vec.length; i++) {
        // Round-half-away-from-zero, then clamp — Math.round alone can produce 128.
        const q = Math.round(vec[i] / scale);
        bytes[i] = q > 127 ? 127 : q < -127 ? -127 : q;
    }

    return { b64: Buffer.from(bytes.buffer).toString('base64'), scale };
}

/** Decode back to a Float32Array. */
export function decodeVector(b64, scale) {
    const buf = Buffer.from(b64, 'base64');
    const bytes = new Int8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    const out = new Float32Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) out[i] = bytes[i] * scale;
    return out;
}
