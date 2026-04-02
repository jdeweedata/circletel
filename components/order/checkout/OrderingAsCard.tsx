'use client';

interface OrderingAsCardProps {
  fullName: string;
  email: string;
  onSignOut: () => void;
}

export function OrderingAsCard({ fullName, email, onSignOut }: OrderingAsCardProps) {
  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-xl px-4 py-3.5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-circleTel-orange to-orange-600 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
          {initials || '?'}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">Ordering as {fullName}</p>
          <p className="text-xs text-gray-500 truncate">{email}</p>
        </div>
      </div>
      <button
        onClick={onSignOut}
        className="text-xs text-circleTel-orange hover:text-orange-700 ml-3 flex-shrink-0"
      >
        Not you?
      </button>
    </div>
  );
}
