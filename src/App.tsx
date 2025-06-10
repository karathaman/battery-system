import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/use-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Lazy load pages
const Index = lazy(() => import("./pages/Index"));
const CustomerFollowUp = lazy(() => import("./pages/CustomerFollowUp"));
const SupplierFollowUp = lazy(() => import("./pages/SupplierFollowUp"));
const SalesPage = lazy(() => import("./pages/SalesPage"));
const PurchasesPage = lazy(() => import("./pages/PurchasesPage"));
const VouchersPage = lazy(() => import("./pages/VouchersPage"));
const TaxDeclarationPage = lazy(() => import("./pages/TaxDeclarationPage"));
const NotesAndBatteriesPage = lazy(() => import("./pages/NotesAndBatteriesPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner size="lg" />
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <SonnerToaster />
        <BrowserRouter>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:text-foreground"
          >
            تخطي إلى المحتوى الرئيسي
          </a>
          <main id="main-content">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route
                  path="/"
                  element={
                    <ErrorBoundary>
                      <Index />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/customer-followup"
                  element={
                    <ErrorBoundary>
                      <CustomerFollowUp />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/supplier-followup"
                  element={
                    <ErrorBoundary>
                      <SupplierFollowUp />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/sales"
                  element={
                    <ErrorBoundary>
                      <SalesPage />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/purchases"
                  element={
                    <ErrorBoundary>
                      <PurchasesPage />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/vouchers"
                  element={
                    <ErrorBoundary>
                      <VouchersPage />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/tax-declaration"
                  element={
                    <ErrorBoundary>
                      <TaxDeclarationPage />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/notes-batteries"
                  element={
                    <ErrorBoundary>
                      <NotesAndBatteriesPage />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="*"
                  element={
                    <ErrorBoundary>
                      <NotFound />
                    </ErrorBoundary>
                  }
                />
              </Routes>
            </Suspense>
          </main>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
