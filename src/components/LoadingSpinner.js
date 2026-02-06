import React from 'react';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    gap: '16px',
    minHeight: 'calc(100vh - 140px)',
    width: '100%',
    boxSizing: 'border-box',
  },
  spinner: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    animation: 'page-transition-spin 0.8s linear infinite',
    flexShrink: 0,
  },
  text: {
    fontSize: '16px',
    color: 'inherit',
    margin: 0,
  },
};

function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div style={styles.container}>
      <div className="page-transition-spinner" style={styles.spinner} />
      <p style={styles.text}>{message}</p>
    </div>
  );
}

export default LoadingSpinner;
