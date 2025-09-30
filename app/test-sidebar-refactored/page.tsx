import SidebarDemoRefactored from "@/components/sidebar-demo-refactored";

export default function TestSidebarRefactoredPage() {
  return (
    <div className="min-h-screen">
      <h1 className="p-8 text-2xl font-bold">Refactored Sidebar Demo</h1>
      <p className="px-8 pb-4 text-gray-600">
        This is the improved, refactored version with better maintainability and performance.
      </p>
      <SidebarDemoRefactored />
    </div>
  );
}