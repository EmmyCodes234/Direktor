import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardSidebar from '../../pages/tournament-command-center-dashboard/components/DashboardSidebar';
import DashboardHeader from './DashboardHeader';
import Icon from '../AppIcon';

const DashboardLayout = ({ children, tournamentInfo, ladderConfig }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background text-foreground flex">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar - Desktop Fixed / Mobile Slide-over */}
            <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:h-screen lg:sticky lg:top-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <DashboardSidebar tournamentInfo={tournamentInfo} ladderConfig={ladderConfig} />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header Trigger */}
                <div className="lg:hidden sticky top-0 z-30 bg-background border-b border-border h-14 flex items-center px-4 justify-between">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-muted-foreground">
                        <Icon name="Menu" />
                    </button>
                    <span className="font-semibold text-sm truncate">{tournamentInfo?.name}</span>
                    <div className="w-8" />
                </div>

                {/* Desktop Header */}
                <div className="hidden lg:block">
                    <DashboardHeader title={tournamentInfo?.name} status={tournamentInfo?.status} />
                </div>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
