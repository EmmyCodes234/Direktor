import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';

const DivisionManager = ({ formData, onDivisionsChange }) => {
  const [divisions, setDivisions] = useState(formData.divisions || [{ name: 'Division A', min_rating: 1600, max_rating: 9999 }, { name: 'Division B', min_rating: 0, max_rating: 1599 }]);

  const handleDivisionChange = (index, field, value) => {
    const newDivisions = [...divisions];
    newDivisions[index][field] = value;
    setDivisions(newDivisions);
    onDivisionsChange(newDivisions);
  };

  const addDivision = () => {
    const newDivisions = [...divisions, { name: `Division ${String.fromCharCode(65 + divisions.length)}`, min_rating: 0, max_rating: 0 }];
    setDivisions(newDivisions);
    onDivisionsChange(newDivisions);
  };

  const removeDivision = (index) => {
    const newDivisions = divisions.filter((_, i) => i !== index);
    setDivisions(newDivisions);
    onDivisionsChange(newDivisions);
  };

  return (
    <div className="glass-card p-8 mb-8 animate-fade-in">
      <div className="flex items-center space-x-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
          <Icon name="Columns" size={20} color="white" />
        </div>
        <div>
          <h2 className="text-xl font-heading font-semibold text-foreground">
            Division Setup
          </h2>
          <p className="text-sm text-muted-foreground">
            Create divisions based on player ratings.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {divisions.map((division, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-[2fr,1fr,1fr,auto] gap-4 items-end p-4 bg-muted/20 rounded-lg"
            >
              <Input
                label={`Division ${String.fromCharCode(65 + index)} Name`}
                value={division.name}
                onChange={(e) => handleDivisionChange(index, 'name', e.target.value)}
              />

              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`caps-${index}`}
                    checked={division.use_rating_caps || false}
                    onChange={(e) => handleDivisionChange(index, 'use_rating_caps', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor={`caps-${index}`} className="text-sm font-medium text-muted-foreground cursor-pointer">
                    Rating Limit
                  </label>
                </div>
                {division.use_rating_caps && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Min"
                      type="number"
                      value={division.min_rating}
                      onChange={(e) => handleDivisionChange(index, 'min_rating', parseInt(e.target.value) || 0)}
                      className="bg-background/50"
                    />
                    <Input
                      placeholder="Max"
                      type="number"
                      value={division.max_rating}
                      onChange={(e) => handleDivisionChange(index, 'max_rating', parseInt(e.target.value) || 0)}
                      className="bg-background/50"
                    />
                  </div>
                )}
              </div>
              <Button variant="destructive" size="icon" onClick={() => removeDivision(index)}>
                <Icon name="Trash2" size={16} />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-6">
        <Button variant="outline" onClick={addDivision} className="w-full">
          <Icon name="Plus" className="mr-2" />
          Add Division
        </Button>
      </div>
    </div>
  );
};

export default DivisionManager;