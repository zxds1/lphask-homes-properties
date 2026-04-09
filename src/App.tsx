import { Suspense, lazy } from "react";

const AppContent = lazy(() => import("./AppContent"));

export default function App() {
  return (
    <Suspense fallback={null}>
      <AppContent />
    </Suspense>
  );
}
