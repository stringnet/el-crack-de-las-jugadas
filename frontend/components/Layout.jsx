// components/Layout.jsx
import React from 'react';

const Layout = ({ children }) => {
  const layoutStyle = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    textAlign: 'center',
  };

  return <div style={layoutStyle}>{children}</div>;
};

export default Layout;
