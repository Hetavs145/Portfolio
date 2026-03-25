import React from 'react';
import { CursorProvider } from './context/CursorContext';
import { RouteProvider, useRoute } from './context/RouteContext';
import ResumeAura from './components/ResumeAura';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Hero from './components/Hero';
import About from './components/About';
import Projects from './components/Projects';
import RealTimeDemo from './components/RealTimeDemo';
import Contact from './components/Contact';
import Experience from './components/Experience';
import Achievements from './components/Achievements';

function AppContent() {
    const { currentPage } = useRoute();

    return (
        <div className="bg-navy-900 min-h-screen text-slate-light selection:bg-teal-400 selection:text-navy-900 cursor-none">
            <ResumeAura />
            <Navbar />

            {currentPage === 'agent' ? (
                <main>
                    <RealTimeDemo />
                </main>
            ) : (
                <main>
                    <Hero />
                    <About />
                    <Experience />
                    <Achievements />
                    <Projects />
                    <Contact />
                </main>
            )}

            <Footer />
        </div>
    );
}

function App() {
    return (
        <RouteProvider>
            <CursorProvider>
                <AppContent />
            </CursorProvider>
        </RouteProvider>
    );
}

export default App;
