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
        // `cursor-hidden-fine` hides the native cursor only on devices that have
        // one (see index.css). Applying cursor-none globally did nothing useful on
        // touch, where ResumeAura — the canvas replacement — never mounts.
        <div className="bg-navy-900 min-h-screen text-slate-light selection:bg-teal-400 selection:text-navy-900 cursor-hidden-fine">
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
