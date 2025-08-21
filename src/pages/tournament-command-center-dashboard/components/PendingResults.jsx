import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { motion } from 'framer-motion';

const PendingResults = ({ pending, onApprove, onReject }) => {
  return (
    <div className="glass-card">
        <div className="p-4 lg:p-6 border-b border-border/10 flex justify-between items-center">
             <h3 className="font-heading font-semibold text-foreground flex items-center space-x-2">
                <Icon name="Mail" size={18} className="text-primary" />
                <span>Pending Results</span>
            </h3>
            {pending.length > 0 && (
                <motion.span 
                  className="bg-primary text-primary-foreground text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                    {pending.length}
                </motion.span>
            )}
        </div>
        <div className="p-4 lg:p-6 space-y-4 max-h-96 overflow-y-auto">
            {pending.length === 0 ? (
                <div className="text-center py-8">
                    <Icon name="CheckCircle" size={48} className="text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">No pending results to review.</p>
                </div>
            ) : (
                pending.map((p, index) => (
                    <motion.div 
                      key={p.id} 
                      className="bg-muted/10 p-4 lg:p-6 rounded-xl border border-border/10"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="font-medium text-foreground">
                                        {p.player1_name} vs {p.player2_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Round {p.round} • Submitted by {p.submitted_by_name}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="bg-background/50 p-3 rounded-lg">
                                <div className="flex items-center justify-center space-x-4">
                                    <div className="text-center">
                                        <span className="font-medium text-foreground">{p.player1_name}</span>
                                        <div className="font-mono font-bold text-2xl text-primary">
                                            {p.score1}
                                        </div>
                                    </div>
                                    <div className="text-muted-foreground">
                                        <Icon name="Minus" size={20} />
                                    </div>
                                    <div className="text-center">
                                        <span className="font-medium text-foreground">{p.player2_name}</span>
                                        <div className="font-mono font-bold text-2xl text-primary">
                                            {p.score2}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => onReject(p.id)}
                                  className="touch-target-mobile flex-1"
                                >
                                    <Icon name="X" size={16} className="mr-2" />
                                    Reject
                                </Button>
                                <Button 
                                  size="sm" 
                                  onClick={() => onApprove(p)}
                                  className="touch-target-mobile flex-1"
                                >
                                    <Icon name="Check" size={16} className="mr-2" />
                                    Approve
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                ))
            )}
        </div>
    </div>
  );
};

export default PendingResults;