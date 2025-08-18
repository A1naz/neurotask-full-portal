import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { TokenBalanceProvider } from '@/contexts/TokenBalanceContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Login from '@/components/Login';
import Register from '@/components/Register';
import Assistant from '@/components/Assistant';
import BotManagement from '@/components/BotManagement';
import CalendarIntegration from '@/components/CalendarIntegration';
import UserSettings from '@/components/UserSettings';
import CookieDebug from '@/components/CookieDebug';
import ServerTest from '@/components/ServerTest';
import SessionDebug from '@/components/SessionDebug';
import TokenHistory from '@/components/TokenHistory';
import AISettings from '@/components/AISettings';
          import MultiChat from '@/components/MultiChat';
          import DropdownTest from '@/components/DropdownTest';
          import ContentFactory from '@/components/ContentFactory';
          import Agents from '@/components/Agents';
          import TeamManagement from '@/components/TeamManagement';
          import MarketingAgent from '@/components/agents/MarketingAgent';
          import SmmAgent from '@/components/agents/SmmAgent';
          import TargetologistAgent from '@/components/agents/TargetologistAgent';
          import DirectologistAgent from '@/components/agents/DirectologistAgent';
          import SupportAgent from '@/components/agents/SupportAgent';
          import SalesAgent from '@/components/agents/SalesAgent';
          import VideoGeneration from '@/components/generations/VideoGeneration';
          import ImageGeneration from '@/components/generations/ImageGeneration';
          import AudioGeneration from '@/components/generations/AudioGeneration';
          import Generations from '@/components/Generations';
          import Tasks from '@/components/Tasks';
          
import './App.css';

// Component to handle root redirect
const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return user ? <Navigate to="/assistant" replace /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <TokenBalanceProvider>
        <Router>
          <div className="App">
          <Routes>
            {/* Root redirect */}
            <Route path="/" element={<RootRedirect />} />
            
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes with Layout */}
            <Route
              path="/assistant"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Assistant />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assistant/bot-management"
              element={
                <ProtectedRoute>
                  <Layout>
                    <BotManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assistant/calendar-integration"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CalendarIntegration />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assistant/user-settings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <UserSettings />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assistant/cookie-debug"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CookieDebug />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assistant/server-test"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ServerTest />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assistant/session-debug"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SessionDebug />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assistant/token-history"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TokenHistory />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assistant/ai-settings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AISettings />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assistant/multi-chat"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MultiChat />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/assistant/tasks"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Tasks />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Team Management */}
            <Route
              path="/teams"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TeamManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teams/create"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TeamManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/assistant/dropdown-test"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DropdownTest />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Agents */}
            <Route
              path="/agents"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Agents />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Content Factory Agent */}
            <Route
              path="/agents/content-factory"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ContentFactory />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Marketing Agent */}
            <Route
              path="/agents/marketing"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MarketingAgent />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* SMM Agent */}
            <Route
              path="/agents/smm"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SmmAgent />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Targetologist Agent */}
            <Route
              path="/agents/targetologist"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TargetologistAgent />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Directologist Agent */}
            <Route
              path="/agents/directologist"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DirectologistAgent />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Support Agent */}
            <Route
              path="/agents/support"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SupportAgent />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Sales Agent */}
            <Route
              path="/agents/sales"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SalesAgent />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Generations */}
            <Route
              path="/generations"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Generations />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Video Generation */}
            <Route
              path="/generations/video"
              element={
                <ProtectedRoute>
                  <Layout>
                    <VideoGeneration />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Image Generation */}
            <Route
              path="/generations/images"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ImageGeneration />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Audio Generation */}
            <Route
              path="/generations/audio"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AudioGeneration />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Team Management */}
            <Route
              path="/teams"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TeamManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />


            {/* Legacy routes - redirect to new structure */}
            <Route path="/dashboard" element={<Navigate to="/assistant" replace />} />
            <Route path="/bot-management" element={<Navigate to="/assistant/bot-management" replace />} />
            <Route path="/calendar-integration" element={<Navigate to="/assistant/calendar-integration" replace />} />
            <Route path="/user-settings" element={<Navigate to="/assistant/user-settings" replace />} />
            
            {/* Catch all - redirect to root */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
      </TokenBalanceProvider>
    </AuthProvider>
  );
}

export default App;
