import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface HeaderProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    iconClassName?: string;
    titleClassName?: string;
}

export function Header({ title, description, icon: Icon, iconClassName, titleClassName }: HeaderProps) {
    return (
        <header className="p-4 border-b bg-card">
            <div className="container mx-auto">
                <h1 className={cn("text-4xl font-bold font-headline text-primary flex items-center gap-3", titleClassName)}>
                    {Icon && <Icon className={cn("w-10 h-10 text-accent", iconClassName)} />}
                    {title}
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
