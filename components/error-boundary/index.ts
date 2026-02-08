/**
 * Error Boundary Components
 *
 * React error boundary components for graceful error handling in the UI.
 *
 * @example
 * // Wrap a page or section
 * import { ErrorBoundary, SectionErrorBoundary } from '@/components/error-boundary';
 *
 * <ErrorBoundary>
 *   <YourPageContent />
 * </ErrorBoundary>
 *
 * <SectionErrorBoundary sectionName="User Profile">
 *   <UserProfileSection />
 * </SectionErrorBoundary>
 */

export {
  ErrorBoundary,
  SectionErrorBoundary,
  useErrorReporter,
} from './ErrorBoundary';

export { default } from './ErrorBoundary';
