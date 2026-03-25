import React, { createContext, useContext, useState } from 'react';

const RouteContext = createContext();

export const useRoute = () => useContext(RouteContext);

export const RouteProvider = ({ children }) => {
    const [currentPage, setCurrentPage] = useState('home');

    return (
        <RouteContext.Provider value={{ currentPage, setCurrentPage }}>
            {children}
        </RouteContext.Provider>
    );
};
