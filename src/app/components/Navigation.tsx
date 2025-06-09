"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, UserPlus, Users, Database } from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Mirror", icon: Home },
    { href: "/train", label: "Train User", icon: UserPlus },
    { href: "/admin", label: "Admin", icon: Users },
  ];

  return (
    <nav className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="text-2xl">🪞</div>
            <span className="text-white font-bold text-lg">Magic Mirror</span>
          </div>

          {/* Navigation Links */}
          <div className="flex space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Status Indicator */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Database className="h-4 w-4 text-green-400" />
              <span className="text-xs text-green-400">DB Connected</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
