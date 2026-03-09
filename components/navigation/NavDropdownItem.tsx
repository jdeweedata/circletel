'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { NavigationMenuLink } from '@/components/ui/navigation-menu';

export interface NavItem {
  name: string;
  href: string;
  description?: string;
}

interface NavDropdownItemProps {
  item: NavItem;
  isActive: boolean;
}

export function NavDropdownItem({ item, isActive }: NavDropdownItemProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    router.push(item.href);
  };

  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={item.href}
          onClick={handleClick}
          className={cn(
            'block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-all duration-150',
            'hover:bg-circleTel-orange/10 focus:bg-circleTel-orange/10 cursor-pointer',
            isActive && 'bg-circleTel-orange/10'
          )}
        >
          <div className="nav-item-title hover:text-circleTel-orange transition-colors">
            {item.name}
          </div>
          {item.description && (
            <p className="nav-item-description line-clamp-2 mt-1">
              {item.description}
            </p>
          )}
        </Link>
      </NavigationMenuLink>
    </li>
  );
}
