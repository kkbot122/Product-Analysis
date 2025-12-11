import Link from 'next/link';

const navLinks = [
  { name: 'Features', href: '#' },
  { name: 'Pricing', href: '#' },
  { name: 'Integrations', href: '#' },
  { name: 'Contact', href: '#' },
];

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              {/* Replace with your actual logo or icon */}
              <span className="h-6 w-6 text-indigo-600" />
              <span className="text-xl font-bold text-gray-900">Naksbar</span> 
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-gray-500 hover:text-gray-900 transition duration-150"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            <Link
              href="/signin"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 hidden sm:inline-block"
            >
              Sign in
            </Link>
            <Link
              href="/get-started"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition duration-150"
            >
              Get started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};