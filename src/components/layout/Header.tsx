import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/search', label: 'Search' },
  { to: '/units', label: 'Units' },
];

export function Header() {
  const location = useLocation();

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-14 items-center px-4">
        <Link to="/" className="mr-8 font-semibold">
          Inside Books Project
        </Link>
        <nav className="flex gap-6">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`text-sm transition-colors hover:text-foreground ${
                location.pathname === item.to ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
