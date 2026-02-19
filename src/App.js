import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { syncService } from './services/syncService';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import ToolDetailPage from './components/ToolDetailPage';
import CategoriesPage from './components/CategoriesPage';
import CategoryDetailPage from './components/CategoryDetailPage';
import AboutPage from './components/AboutPage';
import SubmitToolPage from './components/SubmitToolPage';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import ToolsDashboard from './components/utilities/ToolsDashboard';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';
import ResetPasswordPage from './components/auth/ResetPasswordPage';
import VerifyEmailPage from './components/auth/VerifyEmailPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import UserProfile from './components/UserProfile';
import SavedToolsPage from './components/SavedToolsPage';
import MySubmissionsPage from './components/MySubmissionsPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import CookiePolicy from './components/CookiePolicy';
import Disclaimer from './components/Disclaimer';
import CookieBanner from './components/CookieBanner';
import PromptsPage from './components/PromptsPage';
import PromptDetailPage from './components/PromptDetailPage';
import PromptForm from './components/PromptForm';
import PromptCollections from './components/PromptCollections';
import BlogPage from './components/BlogPage';
import BlogDetailPage from './components/BlogDetailPage';
import AIGeneratorTest from './components/AIGeneratorTest';
import Chatbot from './components/Chatbot';
import NotFoundPage from './components/NotFoundPage';

// Converter Tool Components (lazy loaded)
const PdfToWord = lazy(() => import('./components/utilities/PdfToWord'));
const JsonToExcel = lazy(() => import('./components/utilities/JsonToExcel'));
const ImageToWebP = lazy(() => import('./components/utilities/ImageToWebP'));
const WordToPdf = lazy(() => import('./components/utilities/WordToPdf'));
const PngToJpg = lazy(() => import('./components/utilities/PngToJpg'));
const JpgToPng = lazy(() => import('./components/utilities/JpgToPng'));
const ImageResizer = lazy(() => import('./components/utilities/ImageResizer'));
const CsvToExcel = lazy(() => import('./components/utilities/CsvToExcel'));
const ExcelToCsv = lazy(() => import('./components/utilities/ExcelToCsv'));
const HeicToJpg = lazy(() => import('./components/utilities/HeicToJpg'));
const PdfCompressor = lazy(() => import('./components/utilities/PdfCompressor'));
const PdfMerger = lazy(() => import('./components/utilities/PdfMerger'));
const PdfSplitter = lazy(() => import('./components/utilities/PdfSplitter'));
const Base64Tool = lazy(() => import('./components/utilities/Base64Tool'));
const HashGenerator = lazy(() => import('./components/utilities/HashGenerator'));
const ImageRotation = lazy(() => import('./components/utilities/ImageRotation'));
const TextToPdf = lazy(() => import('./components/utilities/TextToPdf'));
const ImageCompressor = lazy(() => import('./components/utilities/ImageCompressor'));
const QrCodeGenerator = lazy(() => import('./components/utilities/QrCodeGenerator'));
const JsonFormatter = lazy(() => import('./components/utilities/JsonFormatter'));
const PasswordGenerator = lazy(() => import('./components/utilities/PasswordGenerator'));
const WordCounter = lazy(() => import('./components/utilities/WordCounter'));
const CaseConverter = lazy(() => import('./components/utilities/CaseConverter'));
const TextDiff = lazy(() => import('./components/utilities/TextDiff'));
const FaviconGenerator = lazy(() => import('./components/utilities/FaviconGenerator'));
const SitemapGenerator = lazy(() => import('./components/utilities/SitemapGenerator'));


function App() {
  useEffect(() => {
    // Add global sync functions
    window.exportData = async () => {
      const data = await syncService.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clarifyall-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    };

    window.importData = (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const data = JSON.parse(e.target.result);
            await syncService.importData(data);
            alert('Data imported successfully! Refreshing page...');
            window.location.reload();
          } catch (error) {
            alert('Invalid file format');
          }
        };
        reader.readAsText(file);
      }
    };
  }, []);

  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Admin routes without Navbar */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />

            {/* Public routes with Navbar and Footer */}
            <Route path="/*" element={
              <>
                <Navbar />
                <Chatbot />
                <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    {/* Auth routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/verify-email" element={<VerifyEmailPage />} />

                    {/* Tool routes */}
                    <Route path="/tool/:id" element={<ToolDetailPage />} />
                    <Route path="/categories" element={<CategoriesPage />} />
                    <Route path="/category/:slug" element={<CategoryDetailPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/submit" element={
                      <ProtectedRoute requireVerified={true}>
                        <SubmitToolPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/profile/:userId" element={<UserProfile />} />
                    <Route path="/saved-tools" element={
                      <ProtectedRoute>
                        <SavedToolsPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/my-submissions" element={
                      <ProtectedRoute>
                        <MySubmissionsPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/my-profile" element={
                      <ProtectedRoute>
                        <UserProfile />
                      </ProtectedRoute>
                    } />

                    {/* Prompts routes */}
                    <Route path="/prompts" element={<PromptsPage />} />
                    <Route path="/prompts/:slug" element={<PromptDetailPage />} />
                    <Route path="/submit-prompt" element={
                      <ProtectedRoute requireVerified={true}>
                        <PromptForm />
                      </ProtectedRoute>
                    } />
                    <Route path="/my-collections" element={
                      <ProtectedRoute>
                        <PromptCollections />
                      </ProtectedRoute>
                    } />

                    {/* Blog routes */}
                    <Route path="/blog" element={<BlogPage />} />
                    <Route path="/blog/:slug" element={<BlogDetailPage />} />

                    {/* Utility Tools routes */}
                    <Route path="/tools" element={<ToolsDashboard />} />
                    <Route path="/tools/pdf-to-word" element={<PdfToWord />} />
                    <Route path="/tools/word-to-pdf" element={<WordToPdf />} />
                    <Route path="/tools/json-to-excel" element={<JsonToExcel />} />
                    <Route path="/tools/image-to-webp" element={<ImageToWebP />} />
                    <Route path="/tools/png-to-jpg" element={<PngToJpg />} />
                    <Route path="/tools/jpg-to-png" element={<JpgToPng />} />
                    <Route path="/tools/image-resizer" element={<ImageResizer />} />
                    <Route path="/tools/csv-to-excel" element={<CsvToExcel />} />
                    <Route path="/tools/excel-to-csv" element={<ExcelToCsv />} />
                    <Route path="/tools/heic-to-jpg" element={<HeicToJpg />} />
                    <Route path="/tools/pdf-compressor" element={<PdfCompressor />} />
                    <Route path="/tools/pdf-merger" element={<PdfMerger />} />
                    <Route path="/tools/pdf-splitter" element={<PdfSplitter />} />
                    <Route path="/tools/base64" element={<Base64Tool />} />
                    <Route path="/tools/hash-generator" element={<HashGenerator />} />
                    <Route path="/tools/image-rotation" element={<ImageRotation />} />
                    <Route path="/tools/text-to-pdf" element={<TextToPdf />} />
                    <Route path="/tools/image-compressor" element={<ImageCompressor />} />
                    <Route path="/tools/qr-code-generator" element={<QrCodeGenerator />} />
                    <Route path="/tools/json-formatter" element={<JsonFormatter />} />
                    <Route path="/tools/password-generator" element={<PasswordGenerator />} />
                    <Route path="/tools/word-counter" element={<WordCounter />} />
                    <Route path="/tools/case-converter" element={<CaseConverter />} />
                    <Route path="/tools/text-diff" element={<TextDiff />} />
                    <Route path="/tools/favicon-generator" element={<FaviconGenerator />} />
                    <Route path="/tools/sitemap-generator" element={<SitemapGenerator />} />

                    {/* Test routes */}
                    <Route path="/test-ai-generators" element={<AIGeneratorTest />} />

                    {/* Legal pages */}
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/cookies" element={<CookiePolicy />} />
                    <Route path="/disclaimer" element={<Disclaimer />} />

                    {/* 404 Page - Must be last */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
                <Footer />
                <CookieBanner />
              </>
            } />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;

