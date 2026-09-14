import { BrowserRouter, Route, Routes, useLocation } from 'react-router';
import { memo, Suspense, useEffect } from 'react';
import PageSkeleton from './components/skeletons/PageSkeleton';
import DashboardLoading from './components/DashboardLoading';
import RouteProgressBar from './components/RouteProgressBar';
import RouteErrorBoundary from './components/RouteErrorBoundary';
import { lazyWithRetry } from './utils/lazyWithRetry';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
}

const HomePage = lazyWithRetry(() => import('./page/HomePage'));
const AboutPage = lazyWithRetry(() => import('./page/AboutPage'));
const CreatorPortfolioPage = lazyWithRetry(
  () => import('./page/CreatorPortfolioPage')
);
const PrivacyPolicyPage = lazyWithRetry(
  () => import('./page/PrivacyPolicyPage')
);
const TermsConditionsPage = lazyWithRetry(
  () => import('./page/TermsConditionsPage')
);
const JSPlayground = lazyWithRetry(() => import('./page/JSPlayground'));
const ReactPlayground = lazyWithRetry(() => import('./page/ReactPlayground'));
const TSPlayground = lazyWithRetry(() => import('./page/TSPlayground'));
const Dashboard = lazyWithRetry(() => import('./page/Dashboard'));
const Interview = lazyWithRetry(() => import('./page/InterviewQuestion'));
const Bin = lazyWithRetry(() => import('./page/Bin'));
const PageNotFound = lazyWithRetry(() => import('./page/PageNotFound'));
const JSsaved = lazyWithRetry(() => import('./page/JSsaved'));
const TSsaved = lazyWithRetry(() => import('./page/TSsaved'));
const HTMLPlayground = lazyWithRetry(() => import('./page/HTMLPlayground'));
const HTMLStandalonePreview = lazyWithRetry(
  () => import('./page/HTMLStandalonePreview')
);
const SavedPlaygroundRedirect = lazyWithRetry(
  () => import('./page/SavedPlaygroundRedirect')
);

const Problemset = lazyWithRetry(() => import('./page/Problemset'));
const ProblemSolving = lazyWithRetry(() => import('./page/ProblemSolving'));

const LearnHomePage = lazyWithRetry(() => import('./page/LearnHomePage'));
const LearnLessonPage = lazyWithRetry(() => import('./page/LearnLessonPage'));
const OutputQuestions = lazyWithRetry(() => import('./page/OutputQuestions'));
const JSVisualizer = lazyWithRetry(() => import('./page/JSVisualizer'));
const JSExecutionContextVisualizer = lazyWithRetry(
  () => import('./page/JSExecutionContextVisualizer')
);

function AppRouter() {
  return (
    <BrowserRouter useTransitions={false}>
      <RouteProgressBar />
      <ScrollToTop />
      <RouteErrorBoundary>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/kishorekumar" element={<CreatorPortfolioPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsConditionsPage />} />
            <Route
              path="/terms-and-conditions"
              element={<TermsConditionsPage />}
            />
            <Route path="/problems" element={<Problemset />} />
            <Route path="/problems/:slug" element={<ProblemSolving />} />
            <Route path="/learn" element={<LearnHomePage />} />
            <Route path="/learn/:slug" element={<LearnLessonPage />} />
            <Route path="/js" element={<JSPlayground />} />
            <Route path="/visualizer" element={<JSVisualizer />} />
            <Route
              path="/execution-context"
              element={<JSExecutionContextVisualizer />}
            />
            <Route
              path="/context-visualizer"
              element={<JSExecutionContextVisualizer />}
            />
            <Route path="/react" element={<ReactPlayground />} />
            <Route path="/react/:id" element={<ReactPlayground />} />
            <Route path="/js/:id" element={<JSsaved />} />
            <Route path="/ts" element={<TSPlayground />} />
            <Route path="/ts/:id" element={<TSsaved />} />
            <Route path="/html" element={<HTMLPlayground />} />
            <Route path="/html/:id" element={<HTMLPlayground />} />
            <Route path="/html-preview" element={<HTMLStandalonePreview />} />
            <Route
              path="/dashboard"
              element={
                <Suspense fallback={<DashboardLoading />}>
                  <Dashboard />
                </Suspense>
              }
            />
            <Route
              path="/dashboard/playground/:id"
              element={<SavedPlaygroundRedirect />}
            />
            <Route path="/interview" element={<Interview />} />
            <Route path="/output-questions" element={<OutputQuestions />} />
            <Route path="/bin" element={<Bin />} />
            <Route path="/404" element={<PageNotFound />} />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Suspense>
      </RouteErrorBoundary>
    </BrowserRouter>
  );
}

export default memo(AppRouter);
