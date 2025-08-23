import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '../supabaseClient';
import Icon from './AppIcon';
import Button from './ui/Button';
import { cn } from '../utils/cn';

const PhotoDatabaseManager = ({ 
  isOpen, 
  onClose, 
  players, 
  tournamentId,
  onPhotosUpdated 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [photoMatches, setPhotoMatches] = useState([]);
  const [unmatchedPhotos, setUnmatchedPhotos] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManualMatchModal, setShowManualMatchModal] = useState({ show: false, filename: null });
  const [selectedPhotos, setSelectedPhotos] = useState(new Set());
  const [bulkAction, setBulkAction] = useState(null);
  const fileInputRef = useRef(null);

  // Load existing photos when modal opens
  useEffect(() => {
    if (isOpen && tournamentId) {
      loadExistingPhotos();
    }
  }, [isOpen, tournamentId]);

  const loadExistingPhotos = async () => {
    try {
      const { data: photos, error } = await supabase
        .from('player_photos')
        .select('*')
        .eq('tournament_id', tournamentId);

      if (error) throw error;
      setExistingPhotos(photos || []);
    } catch (error) {
      console.error('Error loading existing photos:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.zip')) {
      toast.error('Please upload a ZIP file containing player photos');
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      toast.error('File size must be less than 50MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload the zip file to Supabase storage
      const fileName = `photo-database-${Date.now()}.zip`;
      const { data, error } = await supabase.storage
        .from('tournament-photos')
        .upload(`${tournamentId}/${fileName}`, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      setUploadProgress(50);
      
      // Process the zip file to extract and match photos
      await processPhotoDatabase(data.path);
      
      setUploadProgress(100);
      toast.success('Photo database uploaded and processed successfully!');
      
      // Refresh existing photos
      await loadExistingPhotos();
      
      if (onPhotosUpdated) {
        onPhotosUpdated();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload photo database: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const processPhotoDatabase = async (zipFilePath) => {
    setIsProcessing(true);
    
    try {
      // Download the ZIP file from storage
      const { data: zipData, error: downloadError } = await supabase.storage
        .from('tournament-photos')
        .download(zipFilePath);

      if (downloadError) throw downloadError;

      // Convert the ZIP data to a File object for processing
      const zipFile = new File([zipData], 'photo-database.zip', { type: 'application/zip' });
      
      // Extract files from ZIP using JSZip
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(zipFile);
      
      const extractedFiles = [];
      const photoFiles = [];
      
      // Extract all files from the ZIP
      for (const [filename, file] of Object.entries(zipContent.files)) {
        if (!file.dir && isImageFile(filename)) {
          const blob = await file.async('blob');
          extractedFiles.push({ filename, blob });
          photoFiles.push(filename);
        }
      }

      if (extractedFiles.length === 0) {
        throw new Error('No image files found in the ZIP');
      }

      // Upload extracted images to storage with compression
      const uploadedPhotos = [];
      let processedCount = 0;
      
      for (const { filename, blob } of extractedFiles) {
        processedCount++;
        // Update progress for processing
        setUploadProgress(50 + (processedCount / extractedFiles.length) * 40);
        try {
          // Compress image if it's a supported format
          let processedBlob = blob;
          if (isImageFile(filename) && filename.toLowerCase().includes('.jpg') || filename.toLowerCase().includes('.jpeg') || filename.toLowerCase().includes('.png')) {
            processedBlob = await compressImage(blob, filename);
          }

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('tournament-photos')
            .upload(`${tournamentId}/photos/${filename}`, processedBlob, {
              cacheControl: '3600',
              upsert: true
            });

          if (uploadError) {
            console.warn(`Failed to upload ${filename}:`, uploadError);
            continue;
          }

          const photoUrl = supabase.storage
            .from('tournament-photos')
            .getPublicUrl(`${tournamentId}/photos/${filename}`).data.publicUrl;

          uploadedPhotos.push({ filename, photoUrl });
        } catch (error) {
          console.warn(`Failed to process ${filename}:`, error);
          continue;
        }
      }

      // Attempt to match photos with players
      const matches = [];
      const unmatched = [];

      for (const { filename, photoUrl } of uploadedPhotos) {
        const playerName = extractPlayerNameFromFilename(filename);
        const matchedPlayer = findPlayerByName(playerName);
        
        if (matchedPlayer) {
          matches.push({
            playerId: matchedPlayer.player_id,
            playerName: matchedPlayer.name,
            photoUrl,
            filename
          });
        } else {
          unmatched.push(filename);
        }
      }

      // Save matched photos to database
      if (matches.length > 0) {
        await savePhotoMatches(matches);
      }

      // Update state
      setPhotoMatches(matches);
      setUnmatchedPhotos(unmatched);
      
      // Refresh existing photos
      await loadExistingPhotos();

      toast.success(`Processed ${uploadedPhotos.length} photos. ${matches.length} matched, ${unmatched.length} unmatched.`);

    } catch (error) {
      console.error('Processing error:', error);
      toast.error(`Failed to process photo database: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to check if file is an image
  const isImageFile = (filename) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return imageExtensions.includes(ext);
  };

  // Helper function to compress and optimize images
  const compressImage = async (blob, filename, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with compression
        canvas.toBlob((compressedBlob) => {
          resolve(compressedBlob);
        }, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(blob);
    });
  };

  // Helper function to extract player name from filename
  const extractPlayerNameFromFilename = (filename) => {
    // Remove file extension
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
    
    // Remove common prefixes/suffixes and clean up
    let cleanName = nameWithoutExt
      .replace(/^photo_?/i, '')
      .replace(/^player_?/i, '')
      .replace(/^img_?/i, '')
      .replace(/^pic_?/i, '')
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
    
    console.log(`Extracted name from "${filename}": "${cleanName}"`);
    return cleanName;
  };

  // Helper function to find player by name (fuzzy matching)
  const findPlayerByName = (photoName) => {
    const normalizedPhotoName = photoName.toLowerCase().replace(/\s+/g, ' ');
    console.log(`Looking for player matching: "${normalizedPhotoName}"`);
    console.log(`Available players:`, players.map(p => p.name.toLowerCase()));
    
    // First try exact match
    let player = players.find(p => 
      p.name.toLowerCase().replace(/\s+/g, ' ') === normalizedPhotoName
    );
    
    if (player) {
      console.log(`Exact match found: ${player.name}`);
      return player;
    }
    
    // Try partial matches (photo name contains player name or vice versa)
    player = players.find(p => {
      const playerName = p.name.toLowerCase();
      return playerName.includes(normalizedPhotoName) || normalizedPhotoName.includes(playerName);
    });
    
    if (player) {
      console.log(`Partial match found: ${player.name}`);
      return player;
    }
    
    // Try matching by first and last name separately
    const photoNameParts = normalizedPhotoName.split(' ').filter(part => part.length > 0);
    if (photoNameParts.length >= 2) {
      player = players.find(p => {
        const playerNameParts = p.name.toLowerCase().split(' ').filter(part => part.length > 0);
        
        // Check if first and last names match (in either order)
        const firstNameMatch = photoNameParts[0] === playerNameParts[0];
        const lastNameMatch = photoNameParts[photoNameParts.length - 1] === playerNameParts[playerNameParts.length - 1];
        
        // Check if first name matches last name and vice versa
        const firstLastMatch = photoNameParts[0] === playerNameParts[playerNameParts.length - 1];
        const lastFirstMatch = photoNameParts[photoNameParts.length - 1] === playerNameParts[0];
        
        return (firstNameMatch && lastNameMatch) || (firstLastMatch && lastFirstMatch);
      });
      
      if (player) {
        console.log(`Name parts match found: ${player.name}`);
        return player;
      }
    }
    
    // Try matching individual words
    if (photoNameParts.length >= 2) {
      player = players.find(p => {
        const playerNameParts = p.name.toLowerCase().split(' ').filter(part => part.length > 0);
        
        // Check if at least 2 words match between photo name and player name
        const matchingWords = photoNameParts.filter(word => 
          playerNameParts.some(playerWord => playerWord === word)
        );
        
        return matchingWords.length >= 2;
      });
      
      if (player) {
        console.log(`Word matching found: ${player.name}`);
        return player;
      }
    }
    
    console.log(`No match found for: "${normalizedPhotoName}"`);
    return null;
  };

  const savePhotoMatches = async (matches) => {
    try {
      const photoRecords = matches.map(match => ({
        tournament_id: tournamentId,
        player_id: match.playerId,
        photo_url: match.photoUrl,
        filename: match.filename,
        uploaded_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('player_photos')
        .upsert(photoRecords, { onConflict: 'tournament_id,player_id' });

      if (error) throw error;
      
      toast.success(`${matches.length} player photos matched and saved!`);
    } catch (error) {
      console.error('Save error:', error);
      toast.error(`Failed to save photo matches: ${error.message}`);
    }
  };

  const handleManualMatch = async (photoFilename, playerId) => {
    try {
      const player = players.find(p => p.player_id === playerId);
      if (!player) return;

      // Generate photo URL from filename
      const photoUrl = `${supabase.storage.from('tournament-photos').getPublicUrl(`${tournamentId}/photos/${photoFilename}`).data.publicUrl}`;

      const photoRecord = {
        tournament_id: tournamentId,
        player_id: playerId,
        photo_url: photoUrl,
        filename: photoFilename,
        uploaded_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('player_photos')
        .upsert(photoRecord, { onConflict: 'tournament_id,player_id' });

      if (error) throw error;

      // Update local state
      setExistingPhotos(prev => [...prev.filter(p => p.player_id !== playerId), photoRecord]);
      setUnmatchedPhotos(prev => prev.filter(p => p !== photoFilename));
      
      toast.success(`Photo matched with ${player.name}`);
    } catch (error) {
      console.error('Manual match error:', error);
      toast.error(`Failed to match photo: ${error.message}`);
    }
  };

  const handleRemovePhoto = async (playerId) => {
    try {
      const { error } = await supabase
        .from('player_photos')
        .delete()
        .eq('tournament_id', tournamentId)
        .eq('player_id', playerId);

      if (error) throw error;

      setExistingPhotos(prev => prev.filter(p => p.player_id !== playerId));
      toast.success('Photo removed successfully');
    } catch (error) {
      console.error('Remove error:', error);
      toast.error(`Failed to remove photo: ${error.message}`);
    }
  };

  const handleBulkRemovePhotos = async () => {
    if (selectedPhotos.size === 0) return;
    
    try {
      const { error } = await supabase
        .from('player_photos')
        .delete()
        .eq('tournament_id', tournamentId)
        .in('player_id', Array.from(selectedPhotos));

      if (error) throw error;

      setExistingPhotos(prev => prev.filter(p => !selectedPhotos.has(p.player_id)));
      setSelectedPhotos(new Set());
      toast.success(`${selectedPhotos.size} photos removed successfully`);
    } catch (error) {
      console.error('Bulk remove error:', error);
      toast.error(`Failed to remove photos: ${error.message}`);
    }
  };

  const togglePhotoSelection = (playerId) => {
    const newSelected = new Set(selectedPhotos);
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId);
    } else {
      newSelected.add(playerId);
    }
    setSelectedPhotos(newSelected);
  };

  const exportPhotoDatabase = async () => {
    try {
      const photoData = existingPhotos.map(photo => {
        const player = players.find(p => p.player_id === photo.player_id);
        return {
          player_name: player?.name || 'Unknown',
          player_id: photo.player_id,
          photo_url: photo.photo_url,
          filename: photo.filename,
          uploaded_at: photo.uploaded_at
        };
      });

      const csvContent = [
        ['Player Name', 'Player ID', 'Photo URL', 'Filename', 'Uploaded At'],
        ...photoData.map(photo => [
          photo.player_name,
          photo.player_id,
          photo.photo_url,
          photo.filename,
          photo.uploaded_at
        ])
      ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `photo-database-${tournamentId}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Photo database exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export photo database');
    }
  };

  const getPlayerPhoto = (playerId) => {
    return existingPhotos.find(p => p.player_id === playerId);
  };

  const getPlayerStats = (player) => {
    if (player.wins !== undefined && player.losses !== undefined) {
      return `${player.wins}W-${player.losses}L`;
    }
    if (player.rating) {
      return `Rating: ${player.rating}`;
    }
    return '';
  };

  return (
    <AnimatePresence key="main-modal">
      {isOpen && (
        <motion.div
          key="photo-database-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-card w-full h-full sm:h-auto sm:max-w-4xl sm:max-h-[90vh] overflow-hidden rounded-none sm:rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-border/20">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">Photo Database Manager</h2>
                  <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                    Upload player photos and automatically match them with players
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="touch-target">
                  <Icon name="X" size={20} />
                </Button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] sm:h-[calc(90vh-120px)]">
              {/* Left Panel - Upload and Matches */}
              <div className="w-full lg:w-1/2 p-4 sm:p-6 border-r border-border/20 overflow-y-auto">
                <div className="space-y-4 sm:space-y-6">
                  {/* Upload Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Upload Photo Database</h3>
                    
                    <div className="border-2 border-dashed border-border/30 rounded-lg p-4 sm:p-6 text-center">
                      <Icon name="Upload" size={48} className="mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                        Upload a ZIP file containing player photos. Photos should be named with player names.
                      </p>
                      <div className="text-xs text-muted-foreground mb-4 text-left">
                        <p className="font-medium mb-2">📸 Photo Naming Tips:</p>
                        <ul className="space-y-1">
                          <li>• Use player names: "John Smith.jpg"</li>
                          <li>• With underscores: "John_Smith.jpg" or "enyi_emmanuel.jpg"</li>
                          <li>• With hyphens: "John-Smith.jpg" or "enyi-emmanuel.jpg"</li>
                          <li>• Supported formats: JPG, PNG, GIF, WebP</li>
                          <li>• Max file size: 50MB total</li>
                          <li>• Images will be automatically compressed for better performance</li>
                        </ul>
                      </div>
                      
                      <div className="text-xs text-muted-foreground mb-4 p-3 bg-primary/10 rounded-lg">
                        <p className="font-medium mb-1">💡 Pro Tips:</p>
                        <ul className="space-y-1">
                          <li>• Photos are automatically matched using smart name recognition</li>
                          <li>• Unmatched photos can be manually assigned to players</li>
                          <li>• Photos are optimized for web display (max 800px width)</li>
                          <li>• Use clear, well-lit photos for best results</li>
                        </ul>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".zip"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isUploading || isProcessing}
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || isProcessing}
                        className="w-full touch-target"
                        size="mobile-lg"
                      >
                        {isUploading ? (
                          <>
                            <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                            Uploading... {uploadProgress}%
                          </>
                        ) : isProcessing ? (
                          <>
                            <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                            Processing Photos...
                          </>
                        ) : (
                          <>
                            <Icon name="Upload" size={16} className="mr-2" />
                            Choose ZIP File
                          </>
                        )}
                      </Button>
                    </div>

                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="w-full bg-muted/20 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Matched Photos */}
                  {photoMatches.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">Matched Photos</h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {photoMatches.map((match, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 bg-primary/10 rounded-lg">
                            <img
                              src={match.photoUrl}
                              alt={match.playerName}
                              className="w-8 h-8 rounded-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">
                                {match.playerName}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {match.filename}
                              </div>
                            </div>
                            <Icon name="Check" size={16} className="text-primary" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Unmatched Photos */}
                  {unmatchedPhotos.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">Unmatched Photos</h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {unmatchedPhotos.map((filename, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                            <span className="text-sm font-mono text-muted-foreground truncate">
                              {filename}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowManualMatchModal({ filename, show: true })}
                              className="touch-target"
                            >
                              <Icon name="Link" size={14} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel - Player Photos */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-foreground">Player Photos</h3>
                    {selectedPhotos.size > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {selectedPhotos.size} selected
                        </span>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleBulkRemovePhotos}
                          className="touch-target"
                        >
                          <Icon name="Trash2" size={14} className="mr-1" />
                          Remove Selected
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {players.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Icon name="Users" size={64} className="mx-auto mb-4 opacity-50" />
                      <p>No players found in this tournament</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {players.map((player) => {
                        const photo = getPlayerPhoto(player.player_id);
                        return (
                          <div key={player.player_id} className={cn(
                            "mobile-card-compact transition-all",
                            selectedPhotos.has(player.player_id) && "ring-2 ring-primary bg-primary/5"
                          )}>
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                {photo ? (
                                  <img
                                    src={photo.photo_url}
                                    alt={player.name}
                                    className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <div 
                                  className={cn(
                                    "w-16 h-16 rounded-full border-2 flex items-center justify-center",
                                    photo ? "hidden" : "border-border/30 bg-muted/20"
                                  )}
                                >
                                  <Icon name="User" size={24} className="text-muted-foreground" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-foreground truncate">{player.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {photo ? 'Photo uploaded' : 'No photo'}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {photo && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => togglePhotoSelection(player.player_id)}
                                      className={cn(
                                        "text-muted-foreground hover:text-foreground touch-target",
                                        selectedPhotos.has(player.player_id) && "text-primary"
                                      )}
                                    >
                                      <Icon name={selectedPhotos.has(player.player_id) ? "CheckSquare" : "Square"} size={16} />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemovePhoto(player.player_id)}
                                      className="text-destructive hover:text-destructive touch-target"
                                    >
                                      <Icon name="Trash2" size={16} />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-6 border-t border-border/20 bg-muted/5">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  {existingPhotos.length} of {players.length} players have photos
                </div>
                <div className="flex space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={exportPhotoDatabase}
                    disabled={existingPhotos.length === 0}
                    size="mobile-default"
                  >
                    <Icon name="Download" size={16} className="mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline" onClick={onClose} size="mobile-default">
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Manual Match Modal */}
      <AnimatePresence key="manual-match-modal">
        {showManualMatchModal.show && (
          <motion.div
            key="manual-match-modal-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowManualMatchModal({ show: false, filename: null })}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card w-full max-w-md mx-4 rounded-t-xl sm:rounded-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Match Photo to Player</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Select a player to match with: <strong>{showManualMatchModal.filename}</strong>
                </p>
                
                <div className="mb-4">
                  <div className="text-center">
                    <img
                      src={supabase.storage.from('tournament-photos').getPublicUrl(`${tournamentId}/photos/${showManualMatchModal.filename}`).data.publicUrl}
                      alt="Photo to match"
                      className="w-32 h-32 object-cover rounded-lg mx-auto border border-border"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {players.map((player) => (
                    <button
                      key={player.player_id}
                      onClick={() => {
                        handleManualMatch(showManualMatchModal.filename, player.player_id);
                        setShowManualMatchModal({ show: false, filename: null });
                      }}
                      className="w-full p-3 text-left bg-muted/10 hover:bg-muted/20 rounded-lg transition-colors touch-target"
                    >
                      <div className="font-medium text-foreground">{player.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Rank #{player.rank} • {getPlayerStats(player)}
                      </div>
                    </button>
                  ))}
                </div>
                
                <div className="mt-6 flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowManualMatchModal({ show: false, filename: null })}
                    size="mobile-default"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};

export default PhotoDatabaseManager;
