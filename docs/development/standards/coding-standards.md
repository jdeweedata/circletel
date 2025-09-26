# CircleTel Coding Standards

## Overview

This document defines the coding standards and best practices for the CircleTel project. These standards ensure code consistency, maintainability, and quality across the entire codebase, building on existing CircleTel components and patterns.

## TypeScript Standards

### General Rules
- **Strict Mode**: Always use TypeScript strict mode
- **File Extension**: Use `.ts` for TypeScript files, `.tsx` for React components
- **Imports**: Use relative imports for files within the same feature/module
- **Exports**: Prefer named exports over default exports for better tree-shaking

### Type Definitions (Aligned with Current Codebase)
```typescript
// ✅ Good: Clear and specific types matching existing patterns
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

type UserRole = 'admin' | 'user' | 'guest';

interface FormSubmissionResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    clinicName: string;
    submittedAt: string;
  };
  error?: string;
  details?: string;
}

// ❌ Avoid: Generic or unclear types
interface Data {
  id: any;
  info: object;
}
```

### Function Signatures (Using Existing Patterns)
```typescript
// ✅ Good: Clear parameter and return types using existing patterns
const createUser = async (
  userData: CreateUserData,
  options?: CreateUserOptions
): Promise<FormSubmissionResponse> => {
  // Implementation using existing Supabase patterns
};

// ✅ Good: Proper async/await usage with existing error handling
const fetchUsers = async (): Promise<User[]> => {
  try {
    const response = await supabase.from('users').select('*');
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw new Error('Failed to fetch users');
  }
};

// ❌ Avoid: Missing return types or unclear parameters
const createUser = async (data, options?) => {
  // Implementation
};
```

## React Standards

### Component Structure
```typescript
// ✅ Good: Proper component structure
import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface UserProfileProps {
  user: User;
  onUpdate: (user: User) => void;
  onDelete?: (userId: string) => void;
  className?: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  user,
  onUpdate,
  onDelete,
  className
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(user);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onUpdate(formData);
      setIsEditing(false);
    } catch (error) {
      // Handle error
    }
  }, [formData, onUpdate]);

  const fullName = useMemo(() =>
    `${user.firstName} ${user.lastName}`,
    [user.firstName, user.lastName]
  );

  return (
    <div className={cn('user-profile', className)}>
      {/* Component JSX */}
    </div>
  );
};
```

### Hooks Usage
```typescript
// ✅ Good: Proper custom hook structure
export const useUserProfile = (userId: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const userData = await api.get(`/users/${userId}`);
      setUser(userData);
    } catch (err) {
      setError('Failed to fetch user');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    try {
      const updatedUser = await api.put(`/users/${userId}`, updates);
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      setError('Failed to update user');
      throw err;
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    isLoading,
    error,
    updateUser,
    refetch: fetchUser
  };
};
```

### Component Naming
- **File Names**: PascalCase for components (e.g., `UserProfile.tsx`)
- **Component Names**: PascalCase (e.g., `UserProfile`)
- **Props Interface**: ComponentName + "Props" (e.g., `UserProfileProps`)
- **Hook Names**: camelCase with "use" prefix (e.g., `useUserProfile`)

## CSS and Styling Standards

### Tailwind CSS Usage
```typescript
// ✅ Good: Consistent and readable Tailwind classes
<div className={cn(
  'flex items-center justify-between',
  'p-6 bg-white rounded-lg shadow-sm',
  'border border-gray-200 hover:border-gray-300',
  'transition-colors duration-200',
  isActive && 'bg-blue-50 border-blue-200',
  className
)}>

// ✅ Good: Logical class grouping
<div className="flex flex-col gap-4 p-6 bg-white rounded-lg shadow-sm">
  <div className="flex items-center justify-between">
    <h3 className="text-lg font-semibold text-gray-900">
      {title}
    </h3>
    {isOptional && (
      <span className="text-sm text-gray-500">(Optional)</span>
    )}
  </div>
  <div className="space-y-2">
    {children}
  </div>
</div>

// ❌ Avoid: Unorganized or conflicting classes
<div className="flex p-6 bg-white rounded-lg shadow-sm items-center justify-between border border-gray-200 hover:border-gray-300 transition-colors duration-200">
```

### Custom CSS Classes
```css
/* ✅ Good: BEM-like naming convention */
.user-profile {
  /* Base styles */
}

.user-profile__header {
  /* Header-specific styles */
}

.user-profile__content {
  /* Content-specific styles */
}

.user-profile--loading {
  /* Loading state modifier */
}

.user-profile--error {
  /* Error state modifier */
}
```

## File Organization

### Folder Structure Standards
```
📁 components/
├── 📁 ui/                    # Base UI components
│   ├── button.tsx           # Button component
│   ├── input.tsx            # Input component
│   └── modal.tsx            # Modal component
├── 📁 forms/                # Form-related components
│   ├── form-field.tsx       # Generic form field
│   ├── form-layout.tsx      # Form layout wrapper
│   └── form-section.tsx     # Form section component
├── 📁 features/             # Feature-specific components
│   ├── auth/                # Authentication components
│   ├── order/               # Order flow components
│   └── admin/               # Admin panel components
└── 📁 common/               # Shared components
    ├── layout.tsx           # Layout components
    └── navigation.tsx       # Navigation components

📁 lib/
├── 📁 services/             # Business logic services
│   ├── auth.service.ts      # Authentication service
│   ├── order.service.ts     # Order management service
│   └── api.service.ts       # Base API service
├── 📁 types/                # TypeScript type definitions
│   ├── auth.types.ts        # Authentication types
│   ├── order.types.ts       # Order-related types
│   └── api.types.ts         # API response types
├── 📁 utils/                # Utility functions
│   ├── format.ts            # Formatting utilities
│   ├── validation.ts        # Validation utilities
│   └── constants.ts         # Application constants
└── 📁 hooks/                # Custom React hooks
    ├── use-auth.ts          # Authentication hook
    └── use-order.ts         # Order management hook
```

### Import Organization
```typescript
// ✅ Good: Organized imports
import React from 'react';
import { useState, useCallback } from 'react';

// Third-party libraries
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Internal components
import { UserProfile } from './UserProfile';
import { UserActions } from './UserActions';

// Types and interfaces
import type { User } from '@/lib/types/user';
import type { ApiResponse } from '@/lib/types/api';

// Styles
import './UserProfile.css';

// ❌ Avoid: Disorganized imports
import React from 'react';
import { cn } from '@/lib/utils';
import './UserProfile.css';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import type { User } from '@/lib/types/user';
```

## Error Handling

### API Error Handling
```typescript
// ✅ Good: Comprehensive error handling
const fetchUser = async (userId: string): Promise<User> => {
  try {
    const response = await api.get(`/users/${userId}`);

    if (!response.data) {
      throw new Error('User not found');
    }

    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      // Handle API-specific errors
      switch (error.status) {
        case 404:
          throw new Error('User not found');
        case 403:
          throw new Error('Access denied');
        case 500:
          throw new Error('Server error');
        default:
          throw new Error('An unexpected error occurred');
      }
    }

    // Handle network errors
    if (error instanceof NetworkError) {
      throw new Error('Network connection failed');
    }

    // Re-throw unexpected errors
    throw error;
  }
};
```

### Component Error Boundaries
```typescript
// ✅ Good: Error boundary implementation
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ComponentType }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

## Testing Standards

### Unit Testing
```typescript
// ✅ Good: Comprehensive unit test
describe('UserProfile', () => {
  const mockUser: User = {
    id: '1',
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'user',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  };

  const mockOnUpdate = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render user information correctly', () => {
    render(
      <UserProfile
        user={mockUser}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
  });

  it('should call onUpdate when form is submitted', async () => {
    render(
      <UserProfile
        user={mockUser}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    // Implementation details...
  });

  it('should handle API errors gracefully', async () => {
    const errorUser = { ...mockUser, email: 'invalid-email' };
    mockOnUpdate.mockRejectedValue(new Error('Update failed'));

    render(
      <UserProfile
        user={errorUser}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    // Implementation details...
  });
});
```

### Integration Testing
```typescript
// ✅ Good: Integration test with real API calls
describe('User Management Flow', () => {
  let apiMock: MockAdapter;

  beforeEach(() => {
    apiMock = new MockAdapter(api);
  });

  afterEach(() => {
    apiMock.restore();
  });

  it('should complete full user creation flow', async () => {
    // Mock API responses
    apiMock.onPost('/users').reply(201, {
      id: '1',
      email: 'newuser@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Render the full user creation form
    render(<UserCreationForm />);

    // Fill out the form
    fireEvent.change(screen.getByLabelText('First Name'), {
      target: { value: 'Jane' }
    });
    fireEvent.change(screen.getByLabelText('Last Name'), {
      target: { value: 'Smith' }
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'newuser@example.com' }
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Create User' }));

    // Verify the API was called correctly
    await waitFor(() => {
      expect(apiMock.history.post).toHaveLength(1);
      expect(apiMock.history.post[0].data).toContain('Jane');
      expect(apiMock.history.post[0].data).toContain('Smith');
    });

    // Verify success state
    await waitFor(() => {
      expect(screen.getByText('User created successfully')).toBeInTheDocument();
    });
  });
});
```

## Performance Standards

### React Performance
```typescript
// ✅ Good: Performance-optimized component
const UserList: React.FC<{ users: User[] }> = React.memo(({ users }) => {
  const sortedUsers = useMemo(() =>
    [...users].sort((a, b) => a.lastName.localeCompare(b.lastName)),
    [users]
  );

  const handleUserClick = useCallback((userId: string) => {
    // Handle user click
  }, []);

  return (
    <div className="user-list">
      {sortedUsers.map((user) => (
        <UserItem
          key={user.id}
          user={user}
          onClick={handleUserClick}
        />
      ))}
    </div>
  );
});
```

### Bundle Size Optimization
- Use dynamic imports for large components
- Implement code splitting for routes
- Optimize images with Next.js Image component
- Minimize third-party library usage

## Security Standards

### Input Validation
```typescript
// ✅ Good: Server-side input validation
const createUser = async (req: Request, res: Response) => {
  const { email, firstName, lastName } = req.body;

  // Validate required fields
  if (!email || !firstName || !lastName) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }

  // Sanitize inputs
  const sanitizedData = {
    email: email.toLowerCase().trim(),
    firstName: firstName.trim(),
    lastName: lastName.trim()
  };

  // Create user with sanitized data
  const user = await User.create(sanitizedData);
  res.json({ success: true, data: user });
};
```

### Authentication
```typescript
// ✅ Good: Secure authentication implementation
const authenticateUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Rate limiting
  const attempts = await getLoginAttempts(email);
  if (attempts > 5) {
    return res.status(429).json({
      success: false,
      message: 'Too many login attempts'
    });
  }

  // Validate credentials
  const user = await User.findByEmail(email);
  if (!user) {
    await incrementLoginAttempts(email);
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    await incrementLoginAttempts(email);
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Reset login attempts on successful login
  await resetLoginAttempts(email);

  // Generate secure token
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({
    success: true,
    data: { token, user: { id: user.id, email: user.email, role: user.role } }
  });
};
```

## Git and Version Control

### Commit Message Standards
```bash
# ✅ Good: Clear and descriptive commit messages
feat(auth): add email verification flow
fix(order): resolve validation error on contact stage
docs: update API documentation for order endpoints
refactor: extract user validation logic into separate service
test: add unit tests for authentication service
chore: update dependencies and security patches

# ❌ Avoid: Unclear or incomplete commit messages
fix bug
update
done
```

### Branch Naming Convention
```bash
# ✅ Good: Clear branch naming
feature/order-system          # New feature development
fix/login-validation          # Bug fix
refactor/auth-components      # Code refactoring
docs/setup-guide              # Documentation updates
test/order-flow               # Testing related changes
chore/dependency-updates      # Maintenance tasks

# ❌ Avoid: Unclear branch names
fix
update
new-feature
```

## Code Review Checklist

### Before Submitting PR
- [ ] Code follows TypeScript and React standards
- [ ] All tests pass
- [ ] No linting errors
- [ ] Components are properly typed
- [ ] Error handling is implemented
- [ ] Performance considerations addressed
- [ ] Security best practices followed
- [ ] Documentation updated if needed
- [ ] Commit messages follow standards

### During Code Review
- [ ] Functionality works as expected
- [ ] Code is readable and maintainable
- [ ] No unnecessary complexity
- [ ] Proper error handling
- [ ] Adequate test coverage
- [ ] Performance impact considered
- [ ] Security implications reviewed
- [ ] Accessibility considerations

---

## Related Documentation

- [System Architecture](../architecture/system-overview.md)
- [Setup Guide](../guides/setup-guide.md)
- [Testing Standards](testing-standards.md)
- [Security Standards](security-standards.md)

---

*This coding standards document is maintained by the CircleTel development team and should be updated as technologies and best practices evolve.*
