import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import Link from 'next/link';

interface HeaderProps {
    subtitle: string;
    description?: string;
    icon?: LucideIcon;
    iconClassName?: string;
    subtitleClassName?: string;
}

export function Header({ subtitle, description, icon: Icon, iconClassName, subtitleClassName }: HeaderProps) {
    return (
        <header className="p-4 border-b bg-card">
            <div className="container mx-auto">
                <h1 className="text-3xl font-bold font-headline text-primary">
                    <Link href="/">DCC Gen AI Authoring Tool</Link>
                </h1>
                {description && (
                    <p className="text-muted-foreground mt-2">
                        {description}
                    </p>
                )}
            </div>
        </header>
    );
}
