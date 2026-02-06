import React from 'react';

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    zIndex: 9998,
  },
  spinner: {
    width: 40,
    height: 40,
    border: '3px solid transparent',
    borderRadius: '50%',
    animation: 'page-transition-spin 0.8s linear infinite',
  },
};

function PageTransitionSpinner({ visible }) {
  if (!visible) return null;
  return (
    <div className="page-transition-spinner-overlay" style={styles.overlay} aria-hidden="true">
      <div className="page-transition-spinner" style={styles.spinner} />
    </div>
  );
}

export default PageTransitionSpinner;
