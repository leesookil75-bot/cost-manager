'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const pathname = usePathname();
    
    const navItems = [
        { name: '대시보드', path: '/' },
        { name: '원자재(부품) 관리', path: '/parts' },
        { name: '기구 및 BOM 구성', path: '/equipment' },
    ];

    return (
        <nav className="bg-zinc-900 border-b border-zinc-800 text-zinc-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <Link href="/">
                                <span className="font-bold text-xl text-white">Pilates Cost</span>
                            </Link>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            {navItems.map(item => (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                                        pathname === item.path
                                            ? 'border-indigo-500 text-white'
                                            : 'border-transparent hover:border-zinc-700 hover:text-zinc-100'
                                    }`}
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            {/* Mobile menu (simplified) */}
            <div className="sm:hidden border-t border-zinc-800">
                <div className="pt-2 pb-3 space-y-1 flex overflow-x-auto px-2">
                    {navItems.map(item => (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium whitespace-nowrap ${
                                pathname === item.path
                                    ? 'bg-indigo-900/50 border-indigo-500 text-indigo-200'
                                    : 'border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                            }`}
                        >
                            {item.name}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
}
