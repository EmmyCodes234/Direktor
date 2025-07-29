import React, { useState, useEffect, useRef } from 'react';
import Icon from '../AppIcon';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { motion, AnimatePresence } from 'framer-motion';

const PlayerEditModal = ({ player, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({ name: '', email: '', rating: '' });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => { 
    if (player) {
      setFormData(player);
      setPhotoPreview(player.photo_url || null);
      setPhotoFile(null); // Reset file on new player
    }
  }, [player]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, photoFile);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="glass-card w-full max-w-md mx-4"
            onClick={e => e.stopPropagation()}
          >
            <form onSubmit={handleSubmit}>
                <div className="p-6">
                  <h2 className="text-xl font-heading font-semibold mb-6">Edit Player</h2>
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="relative">
                      <img 
                        src={photoPreview || `https://ui-avatars.com/api/?name=${formData.name.split(' ').join('+')}&background=007BFF&color=fff`} 
                        alt="Player" 
                        className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                      />
                      <button type="button" onClick={() => fileInputRef.current.click()} className="absolute bottom-0 right-0 bg-accent text-white rounded-full p-1.5 hover:bg-accent/80">
                          <Icon name="Camera" size={14}/>
                      </button>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{formData.name}</h3>
                      <p className="text-sm text-muted-foreground">Update player details and photo.</p>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handlePhotoChange}
                        accept="image/png, image/jpeg" 
                        className="hidden" 
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Input label="Player Name" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} />
                    <Input label="Email" type="email" value={formData.email || ''} onChange={e => handleChange('email', e.target.value)} />
                    <Input label="Rating" type="number" value={formData.rating || ''} onChange={e => handleChange('rating', e.target.value)} />
                  </div>
                </div>
                <div className="p-4 bg-muted/10 flex justify-end space-x-2">
                  <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
                  <Button type="submit">Save Changes</Button>
                </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
export default PlayerEditModal;