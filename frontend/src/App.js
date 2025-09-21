import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { Toaster } from 'react-hot-toast';

import GlobalStyles from './styles/GlobalStyles';
import { darkTheme } from './styles/theme';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Vaults from './pages/Vaults';
import Logs from './pages/Logs';
import Settings from './pages/Settings';
import MarkdownViewer from './pages/MarkdownViewer';

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <GlobalStyles />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/vaults" element={<Vaults />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/markdown" element={<MarkdownViewer />} />
          </Routes>
        </Layout>
      </Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a1a',
            color: '#ffffff',
            border: '1px solid #333',
          },
          success: {
            iconTheme: {
              primary: '#00d4ff',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ff4757',
              secondary: '#ffffff',
            },
          },
        }}
      />
    </ThemeProvider>
  );
}

export default App;
