// src/components/ScrollToTopButton.jsx
import React, { useState, useEffect, useRef } from 'react';
import '../styles/ScrollToTopButton.css';

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hideInChat, setHideInChat] = useState(false);
  const scrollingToTopRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollingToTopRef.current) {
        if (window.scrollY < 50) scrollingToTopRef.current = false;
        setIsVisible(false);
        return;
      }
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);

    const observer = new MutationObserver(() =>
      setHideInChat(document.body.classList.contains('chat-fullscreen-active'))
    );

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });

    setHideInChat(document.body.classList.contains('chat-fullscreen-active'));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  if (hideInChat) return null;

  const scrollToTop = () => {
    scrollingToTopRef.current = true;
    setIsVisible(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      scrollingToTopRef.current = false;
    }, 1000);
  };

  return (
    <button
      onClick={scrollToTop}
      className={`scroll-to-top-button ${isVisible ? 'visible' : ''}`}
      title="Back to top"
    >
      ↑
    </button>
  );
};

export default ScrollToTopButton;