import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Icon from '../AppIcon';

const PerformanceGraph = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground bg-muted/20 rounded-lg">
        <Icon name="BarChart2" size={48} className="opacity-50 mb-4" />
        <h4 className="font-heading font-semibold text-lg">Not Enough Data</h4>
        <p className="text-sm">Performance graph will appear once the player has competed in multiple tournaments.</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 h-80">
        <h3 className="font-heading font-semibold text-lg mb-4">Rating History</h3>
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis dataKey="tournamentName" stroke="rgba(255, 255, 255, 0.5)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255, 255, 255, 0.5)" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 50', 'dataMax + 50']} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'rgba(23, 23, 23, 0.8)',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '0.5rem',
                    }}
                />
                <Line type="monotone" dataKey="rating" stroke="#007BFF" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
            </LineChart>
        </ResponsiveContainer>
    </div>
  );
};

export default PerformanceGraph;