import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../AppIcon';

const StatCard = ({ label, value, icon, index }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow group"
    >
        <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
            <div className="p-2 rounded-lg bg-secondary/50 text-foreground group-hover:bg-foreground group-hover:text-background transition-colors">
                <Icon name={icon} size={18} />
            </div>
        </div>
        <div className="text-3xl font-bold tracking-tight text-foreground">
            {value}
        </div>
    </motion.div>
);

const LobbyStats = ({ totalTournaments, draftCount, activeCount }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <StatCard
                label="Total Tournaments"
                value={totalTournaments}
                icon="Trophy"
                index={0}
            />
            <StatCard
                label="Active Events"
                value={activeCount}
                icon="Activity"
                index={1}
            />
            <StatCard
                label="Drafts"
                value={draftCount}
                icon="FileText"
                index={2}
            />
        </div>
    );
};

export default LobbyStats;
