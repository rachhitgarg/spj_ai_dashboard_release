import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { FilterProvider } from './contexts/FilterContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Overview from './pages/Overview';
import AITutor from './pages/AITutor';
import AIMentor from './pages/AIMentor';
import JPT from './pages/JPT';
import Placements from './pages/Placements';
import DataUploader from './pages/DataUploader';
import Profile from './pages/Profile';

function App() {
  return (
    <AuthProvider>
      <FilterProvider>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Navigate to="/overview" replace />} />
                      <Route path="/overview" element={<Overview />} />
                      <Route path="/ai-tutor" element={<AITutor />} />
                      <Route path="/ai-mentor" element={<AIMentor />} />
                      <Route path="/jpt" element={<JPT />} />
                      <Route path="/placements" element={<Placements />} />
                      <Route path="/data-uploader" element={<DataUploader />} />
                      <Route path="/profile" element={<Profile />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </FilterProvider>
    </AuthProvider>
  );
}

export default App;
