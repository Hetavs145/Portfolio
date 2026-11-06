import React from 'react';
import { motion } from 'framer-motion';

/**
 * Module header shared by every section: "MOD.0x" label, a big tight title and
 * a right-aligned meta line, closed by a heavy ink rule. Keeping it in one
 * place is what makes the sections read as one system.
 */
const SectionHeader = ({ mod, title, meta }) => (
    <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        viewport={{ once: true }}
        className="grid grid-cols-[auto_1fr] md:grid-cols-[200px_1fr_auto] items-end gap-x-6 gap-y-2 border-b-[1.5px] border-ink pb-4"
    >
        <span className="label text-ink-mute md:pb-2 row-start-1 col-start-1 md:row-start-auto md:col-start-auto">MOD.{mod}</span>
        <h2 className="text-5xl sm:text-6xl md:text-[64px] font-semibold tracking-display leading-[0.9] text-ink col-span-2 md:col-span-1 row-start-2 md:row-start-auto md:col-start-auto">
            {title}
        </h2>
        {meta && <span className="label text-ink-mute md:pb-2 justify-self-end text-right row-start-1 col-start-2 md:row-start-auto md:col-start-auto">{meta}</span>}
    </motion.div>
);

export default SectionHeader;
