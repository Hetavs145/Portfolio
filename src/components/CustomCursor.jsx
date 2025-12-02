import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const CustomCursor = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [cursorVariant, setCursorVariant] = useState("default");

    useEffect(() => {
        const mouseMove = (e) => {
            setMousePosition({
                x: e.clientX,
                y: e.clientY
            });
        };

        window.addEventListener("mousemove", mouseMove);

        return () => {
            window.removeEventListener("mousemove", mouseMove);
        };
    }, []);

    const variants = {
        default: {
            x: mousePosition.x - 16,
            y: mousePosition.y - 16,
            backgroundColor: "transparent",
            border: "2px solid #64ffda",
        },
        text: {
            height: 150,
            width: 150,
            x: mousePosition.x - 75,
            y: mousePosition.y - 75,
            backgroundColor: "rgba(100, 255, 218, 0.1)",
            border: "none",
            mixBlendMode: "difference"
        }
    };

    const dotVariants = {
        default: {
            x: mousePosition.x - 4,
            y: mousePosition.y - 4,
            backgroundColor: "#64ffda",
        },
        text: {
            backgroundColor: "transparent",
        }
    };

    return (
        <>
            <motion.div
                className="fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-50 hidden md:block"
                variants={variants}
                animate={cursorVariant}
                transition={{ type: "spring", stiffness: 500, damping: 28 }}
            />
            <motion.div
                className="fixed top-0 left-0 w-2 h-2 rounded-full pointer-events-none z-50 hidden md:block"
                variants={dotVariants}
                animate={cursorVariant}
                transition={{ type: "spring", stiffness: 1000, damping: 50 }}
            />
        </>
    );
};

export default CustomCursor;
