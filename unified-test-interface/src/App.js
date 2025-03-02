import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import './App.css';
import ReactTest from './components/testing/react-test';
// Import pages
import WebSearchPage from '@/pages/web-search';
import CommandInterceptorPage from '@/pages/command-interceptor';
import RepoAnalysisPage from '@/pages/repo-analysis';
import BrowserAutomationPage from '@/pages/browser-automation';
import DocGenerationPage from '@/pages/doc-generation';
import SettingsPage from '@/pages/settings';
function App() {
    const [count, setCount] = useState(0);
    return (<Router>
      <Routes>
        {/* Redirect root to web search page */}
        <Route path="/" element={<Navigate to="/web-search" replace/>}/>
        
        {/* Tool pages */}
        <Route path="/web-search" element={<WebSearchPage />}/>
        <Route path="/command-interceptor" element={<CommandInterceptorPage />}/>
        <Route path="/repo-analysis" element={<RepoAnalysisPage />}/>
        <Route path="/browser-automation" element={<BrowserAutomationPage />}/>
        <Route path="/doc-generation" element={<DocGenerationPage />}/>
        <Route path="/settings" element={<SettingsPage />}/>
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/web-search" replace/>}/>
      </Routes>

      <div className="App">
        <h1>Unified Test Interface</h1>
        
        <div className="card">
          <button onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </button>
        </div>

        <div className="mt-4">
          <ReactTest />
        </div>
        
        <p className="read-the-docs">
          Click on the logo to learn more
        </p>
      </div>
    </Router>);
}
export default App;
