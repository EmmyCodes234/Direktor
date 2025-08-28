import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardTitle } from './Card';
import { GlowingEffect } from './GlowingEffect';
import Button from './Button';
import Icon from '../AppIcon';
import { cn } from '../../utils/cn';

const EmptyState = ({
  icon = 'Trophy',
  title,
  description,
  action,
  className,
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={cn("text-center py-16", className)}
      {...props}
    >
      <GlowingEffect spread={40} glow={true} proximity={80}>
        <Card className="max-w-md mx-auto">
          <CardContent className="p-12 text-center">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-full flex items-center justify-center"
            >
              <Icon name={icon} size={32} className="text-primary" />
            </motion.div>
            
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <CardTitle className="mb-2">{title}</CardTitle>
            </motion.div>
            
            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <CardDescription className="mb-6">{description}</CardDescription>
            </motion.div>
            
            {/* Action */}
            {action && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {action}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </GlowingEffect>
    </motion.div>
  );
};

export default EmptyState;