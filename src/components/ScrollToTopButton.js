// src/components/ScrollToTopButton.jsx
import React, { useState, useEffect } from 'react';
import '../styles/ScrollToTopButton.css';

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hideInChat, setHideInChat] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsVisible(window.scrollY > 300);

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

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`scroll-to-top-button ${isVisible ? 'visible' : ''}`}
      title="Back to top"
    >
      ↑
    </button>
  );
};

export default ScrollToTopButton;