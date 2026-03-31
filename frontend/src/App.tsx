import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

// Auth pages
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));

// Client pages
const ClientListPage = lazy(() => import('@/pages/clients/ClientListPage'));
const ClientCreatePage = lazy(() => import('@/pages/clients/ClientCreatePage'));
const ClientDetailPage = lazy(() => import('@/pages/clients/ClientDetailPage'));
const ClientEditPage = lazy(() => import('@/pages/clients/ClientEditPage'));

// Project pages
const ProjectListPage = lazy(() => import('@/pages/projects/ProjectListPage'));
const ProjectCreatePage = lazy(() => import('@/pages/projects/ProjectCreatePage'));
const ProjectDetailPage = lazy(() => import('@/pages/projects/ProjectDetailPage'));
const ProjectEditPage = lazy(() => import('@/pages/projects/ProjectEditPage'));

// Rate Card
const RateCardPage = lazy(() => import('@/pages/rate-card/RateCardPage'));

// Quotation pages
const QuotationListPage = lazy(() => import('@/pages/quotations/QuotationListPage'));
const QuotationBuilderPage = lazy(() => import('@/pages/quotations/QuotationBuilderPage'));
const QuotationDetailPage = lazy(() => import('@/pages/quotations/QuotationDetailPage'));

// Proposal pages
const ProposalListPage = lazy(() => import('@/pages/proposals/ProposalListPage'));
const ProposalGeneratePage = lazy(() => import('@/pages/proposals/ProposalGeneratePage'));
const ProposalDetailPage = lazy(() => import('@/pages/proposals/ProposalDetailPage'));

// Labour pages
const LabourListPage = lazy(() => import('@/pages/labour/LabourListPage'));

// Admin pages
const AdminPage = lazy(() => import('@/pages/admin/AdminPage'));

// Dashboard pages
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const SettingsPage = lazy(() => import('@/pages/dashboard/SettingsPage'));

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<Loading />}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Protected routes with layout */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/projects" element={<ProjectListPage />} />
                <Route path="/projects/new" element={<ProjectCreatePage />} />
                <Route path="/projects/:id" element={<ProjectDetailPage />} />
                <Route path="/projects/:id/edit" element={<ProjectEditPage />} />
                <Route path="/clients" element={<ClientListPage />} />
                <Route path="/clients/new" element={<ClientCreatePage />} />
                <Route path="/clients/:id" element={<ClientDetailPage />} />
                <Route path="/clients/:id/edit" element={<ClientEditPage />} />
                <Route path="/rate-card" element={<RateCardPage />} />
                <Route path="/quotations" element={<QuotationListPage />} />
                <Route path="/quotations/new" element={<QuotationBuilderPage />} />
                <Route path="/quotations/:id" element={<QuotationDetailPage />} />
                <Route path="/proposals" element={<ProposalListPage />} />
                <Route path="/proposals/generate" element={<ProposalGeneratePage />} />
                <Route path="/proposals/:id" element={<ProposalDetailPage />} />
                <Route path="/labour" element={<LabourListPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/profile" element={<SettingsPage />} />
              </Route>

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
