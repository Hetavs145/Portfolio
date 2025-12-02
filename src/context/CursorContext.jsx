import React, { createContext, useContext, useState } from 'react';

const CursorContext = createContext();

export const useCursor = () => useContext(CursorContext);

export const CursorProvider = ({ children }) => {
    const [cursorState, setCursorState] = useState({
        type: 'default', // default, text, project, skill, button
        text: '',
        keywords: [],
    });

    const setCursor = (type, text = '', keywords = []) => {
        setCursorState({ type, text, keywords });
    };

    const resetCursor = () => {
        setCursorState({ type: 'default', text: '', keywords: [] });
    };

    return (
        <CursorContext.Provider value={{ cursorState, setCursor, resetCursor }}>
            {children}
        </CursorContext.Provider>
    );
};
