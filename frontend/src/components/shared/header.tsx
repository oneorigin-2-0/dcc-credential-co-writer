import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import Link from 'next/link';

interface HeaderProps {
    subtitle: string;
    icon?: LucideIcon;
    iconClassName?: string;
    subtitleClassName?: string;
}

export function Header({ subtitle, icon: Icon, iconClassName, subtitleClassName }: HeaderProps) {
    return (
        <header className="p-4 border-b bg-card">
            <div className="container mx-auto">
                <h1 className="text-3xl font-bold font-headline text-primary">
                    <Link href="/">DCC Gen AI Authoring Tool</Link>
                </h1>
                <div className="flex items-center gap-3 mt-2">
                    {Icon && <Icon className={cn("w-10 h-10 text-accent", iconClassName)} />}
                    <h2 className={cn("text-2xl font-semibold", subtitleClassName)}>
                        {subtitle}
                    </h2>
                </div>
            </div>
        </header>
    );
}
