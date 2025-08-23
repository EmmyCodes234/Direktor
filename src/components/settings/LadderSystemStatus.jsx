import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import Icon from '../AppIcon';

const LadderSystemStatus = () => {
    const [status, setStatus] = useState('checking'); // 'checking', 'available', 'unavailable'
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkLadderSystemStatus();
    }, []);

    const checkLadderSystemStatus = async () => {
        try {
            // Try to query the ladder_system_config table
            const { error } = await supabase
                .from('ladder_system_config')
                .select('id')
                .limit(1);

            if (error) {
                if (error.code === '42P01') {
                    // Table doesn't exist
                    setStatus('unavailable');
                } else {
                    // Other error
                    setStatus('unavailable');
                }
            } else {
                // Table exists
                setStatus('available');
            }
        } catch (error) {
            setStatus('unavailable');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Icon name="Loader2" size={14} className="animate-spin" />
                <span>Checking ladder system status...</span>
            </div>
        );
    }

    if (status === 'available') {
        return (
            <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                <Icon name="CheckCircle" size={14} />
                <span>Ladder System Mode is ready to use</span>
            </div>
        );
    }

    return (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex items-start space-x-2">
                <Icon name="AlertTriangle" size={16} className="text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                        Database Migration Required
                    </p>
                    <p className="text-amber-700 dark:text-amber-300 mb-2">
                        The Ladder System Mode requires a database migration to be applied before it can be used.
                    </p>
                    <div className="bg-amber-100 dark:bg-amber-800 rounded p-2 font-mono text-xs">
                        npx supabase db push
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LadderSystemStatus;
