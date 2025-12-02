import React from 'react';
import { CursorProvider } from './context/CursorContext';
import ResumeAura from './components/ResumeAura';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Hero from './components/Hero';
import About from './components/About';
import Projects from './components/Projects';
import RealTimeDemo from './components/RealTimeDemo';
import Contact from './components/Contact';
import Experience from './components/Experience';

function App() {
    return (
        <CursorProvider>
            <div className="bg-navy-900 min-h-screen text-slate-light selection:bg-teal-400 selection:text-navy-900 cursor-none">
                <ResumeAura />
                <Navbar />

                <main>
                    <Hero />
                    <About />
                    <Experience />
                    <Projects />
                    <RealTimeDemo />
                    <Contact />
                </main>

                <Footer />
            </div>
        </CursorProvider>
    );
}

export default App;
