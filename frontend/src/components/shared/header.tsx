import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import Link from 'next/link';

interface HeaderProps {
    icon?: LucideIcon;
    iconClassName?: string;
}

export function Header({ icon: Icon, iconClassName }: HeaderProps) {
    return (
        <header className="p-4 border-b bg-card">
            <div className="container mx-auto">
                <h1 className="text-3xl font-bold font-headline text-primary">
                    <Link href="/">DCC Gen AI Authoring Tool</Link>
                </h1>
                <div className="flex items-center gap-3 mt-2">
                    {Icon && <Icon className={cn("w-10 h-10 text-accent", iconClassName)} />}
                </div>
            </div>
        </header>
    );
}
