import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from './Card';
import { GlowingEffect } from './GlowingEffect';
import Icon from '../AppIcon';
import { cn } from '../../utils/cn';

const StatCard = ({ stat, index, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -2 }}
      className={cn(
        "cursor-pointer",
        onClick && "hover:scale-105 transition-transform duration-200"
      )}
      onClick={onClick}
    >
      <GlowingEffect spread={25} glow={true} proximity={50}>
        <Card className="text-center hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 sm:p-6">
            {/* Icon */}
            <div className={cn(
              "w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-sm",
              stat.color || "from-blue-500 to-cyan-500"
            )}>
              <Icon name={stat.icon} size={20} className="text-white" />
            </div>
            
            {/* Value */}
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 + 0.3, type: "spring", stiffness: 200 }}
              className="text-2xl sm:text-3xl font-bold text-foreground mb-1"
            >
              {stat.value}
            </motion.div>
            
            {/* Label */}
            <div className="text-xs sm:text-sm text-muted-foreground">
              {stat.label}
            </div>
            
            {/* Description */}
            {stat.description && (
              <div className="text-xs text-muted-foreground/80 mt-1 hidden sm:block">
                {stat.description}
              </div>
            )}
            
            {/* Trend Indicator */}
            {stat.trend && (
              <div className={cn(
                "flex items-center justify-center mt-2 text-xs",
                stat.trend.direction === 'up' ? "text-green-600" : 
                stat.trend.direction === 'down' ? "text-red-600" : "text-gray-600"
              )}>
                <Icon 
                  name={stat.trend.direction === 'up' ? 'TrendingUp' : 
                        stat.trend.direction === 'down' ? 'TrendingDown' : 'Minus'} 
                  size={12} 
                  className="mr-1" 
                />
                <span>{stat.trend.value}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </GlowingEffect>
    </motion.div>
  );
};

const StatsGrid = ({
  stats,
  columns = 4,
  onStatClick,
  className,
  ...props
}) => {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
    5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
    6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className={cn(
        "grid gap-4 sm:gap-6",
        gridCols[columns] || "grid-cols-2 md:grid-cols-4",
        className
      )}
      {...props}
    >
      {stats.map((stat, index) => (
        <StatCard
          key={stat.key || stat.label}
          stat={stat}
          index={index}
          onClick={onStatClick ? () => onStatClick(stat) : undefined}
        />
      ))}
    </motion.div>
  );
};

export default StatsGrid;