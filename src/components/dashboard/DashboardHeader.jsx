import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import { Button } from '../ui/Button';

const DashboardHeader = ({ title, status, breadcrumbs }) => {
    const navigate = useNavigate();

    return (
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border h-16 px-4 md:px-6 flex items-center justify-between">
            {/* Left: Breadcrumbs / Title */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span
                        className="cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => navigate('/lobby')}
                    >
                        Lobby
                    </span>
                    <Icon name="ChevronRight" size={12} />
                    <span className="font-medium text-foreground">{title}</span>
                </div>
                {status === 'live' && (
                    <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-wider border border-red-500/20">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                        </span>
                        LIVE
                    </span>
                )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground hidden sm:flex"
                    onClick={() => navigate('/')} // Settings placeholer
                >
                    <Icon name="Settings" size={18} />
                </Button>
                <div className="h-4 w-px bg-border hidden sm:block" />
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/lobby')}
                    className="text-xs"
                >
                    Exit
                </Button>
            </div>
        </header>
    );
};

export default DashboardHeader;
