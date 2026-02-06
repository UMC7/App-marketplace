import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import PageTransitionSpinner from '../components/PageTransitionSpinner';

const DELAY_BEFORE_SPINNER_MS = 350;

const AnimatedLayout = () => {
  const location = useLocation();
  const [showSpinner, setShowSpinner] = useState(false);
  const delayTimerRef = useRef(null);
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname === prevPathRef.current) return;
    prevPathRef.current = location.pathname;
    setShowSpinner(false);

    delayTimerRef.current = setTimeout(() => {
      setShowSpinner(true);
      delayTimerRef.current = null;
    }, DELAY_BEFORE_SPINNER_MS);

    return () => {
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current);
        delayTimerRef.current = null;
      }
    };
  }, [location.pathname]);

  const handleAnimationComplete = () => {
    if (delayTimerRef.current) {
      clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
    setShowSpinner(false);
  };

  return (
    <>
      <PageTransitionSpinner visible={showSpinner} />
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          onAnimationComplete={handleAnimationComplete}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default AnimatedLayout;