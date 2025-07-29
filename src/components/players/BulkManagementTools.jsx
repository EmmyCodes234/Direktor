import React, { useState, useRef } from 'react';
import Icon from '../AppIcon';
import Button from '../ui/Button';
import { cn } from '../../utils/cn';

const BulkManagementTools = ({ onBulkAdd, onCsvImport, onBatchOperation }) => {
  const [activeTab, setActiveTab] = useState('add');
  const [bulkNames, setBulkNames] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleBulkAdd = () => {
    if (!bulkNames.trim()) return;
    const names = bulkNames.split('\n').map(name => name.trim()).filter(Boolean);
    if (names.length > 0) {
      onBulkAdd(names);
      setBulkNames('');
    }
  };

  const handleFile = (file) => {
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target.result;
        const lines = csv.split('\n');
        const names = lines.slice(1).map(line => line.split(',')[0]?.trim()).filter(Boolean);
        if (names.length > 0) {
          onCsvImport(names);
        }
      };
      reader.readAsText(file);
    } else {
      alert('Please select a valid CSV file.');
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const tabs = [
    { id: 'add', label: 'Add Multiple', icon: 'Users' },
    { id: 'import', label: 'CSV Import', icon: 'FileUp' },
    { id: 'batch', label: 'Batch Actions', icon: 'Zap' },
  ];

  return (
    <div className="glass-card">
      <div className="border-b border-border flex">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center space-x-2 p-4 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:bg-muted/10"
            )}
          >
            <Icon name={tab.icon} size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="p-6">
        {activeTab === 'add' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Quickly add multiple players by entering their names below, one per line.
            </p>
            <textarea
              value={bulkNames}
              onChange={(e) => setBulkNames(e.target.value)}
              placeholder="John Smith\nJane Doe\n..."
              className="w-full h-40 p-3 bg-input border border-border rounded-lg resize-none focus:ring-2 focus:ring-primary"
            />
            <Button
              onClick={handleBulkAdd}
              disabled={!bulkNames.trim()}
              iconName="Plus"
              iconPosition="left"
              className="w-full"
            >
              Add Players to Roster
            </Button>
          </div>
        )}

        {activeTab === 'import' && (
          <div className="space-y-4">
             <p className="text-sm text-muted-foreground">
              Import a player list from a CSV file. The first column should contain player names.
            </p>
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 flex flex-col items-center justify-center space-y-3",
                isDragOver ? 'border-primary bg-primary/10' : 'border-border'
              )}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
            >
              <Icon name="UploadCloud" size={32} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drag & drop your CSV file here
              </p>
              <span className="text-xs text-muted-foreground">or</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                iconName="FileText"
                iconPosition="left"
              >
                Browse File
              </Button>
              <input ref={fileInputRef} type="file" accept=".csv" onChange={(e) => handleFile(e.target.files[0])} className="hidden" />
            </div>
          </div>
        )}

        {activeTab === 'batch' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select players from the list to perform batch operations like activate, deactivate, or remove.
            </p>
             <div className="p-8 text-center bg-muted/10 border border-border rounded-lg">
                <Icon name="MousePointerClick" size={32} className="mx-auto mb-2 text-muted-foreground" />
                <p className="font-medium">Select Players First</p>
                <p className="text-xs text-muted-foreground">Your batch tools will appear here once you select one or more players from the roster.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkManagementTools;