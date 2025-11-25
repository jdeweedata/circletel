import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Wizard from './components/Wizard';
import Editor from './components/Editor';
import PageRenderer from './components/PageRenderer';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create" element={<Wizard />} />
          <Route path="/editor/:id" element={<Editor />} />
          <Route path="/p/:slug" element={<PageRenderer />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;