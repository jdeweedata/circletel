'use client';

interface OrderingAsCardProps {
  fullName: string;
  email: string;
  onSignOut: () => void;
}

export function OrderingAsCard({ fullName, email, onSignOut }: OrderingAsCardProps) {
  return (
    <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm">
          {fullName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">Ordering as {fullName}</p>
          <p className="text-xs text-gray-500">{email}</p>
        </div>
      </div>
      <button
        onClick={onSignOut}
        className="text-xs text-blue-600 hover:text-blue-800 underline"
      >
        Not you? Sign out
      </button>
    </div>
  );
}
