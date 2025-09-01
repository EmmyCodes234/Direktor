# 📸 Nimbus POS - Photo Upload System

A comprehensive photo management system for tournament players, built with React Native and Supabase. This system allows tournament directors to upload, manage, and display player photos with intelligent matching and secure storage.

## 🚀 **Features**

### **Core Functionality**
- ✅ **Bulk Photo Upload** - Upload ZIP files containing multiple player photos
- ✅ **Intelligent Player Matching** - Automatic matching based on filename patterns
- ✅ **Manual Matching Interface** - Fallback for unmatched photos
- ✅ **Secure Storage** - Supabase storage with proper access controls
- ✅ **Image Optimization** - Automatic compression and resizing
- ✅ **Mobile-First Design** - Responsive interface optimized for mobile devices

### **Advanced Features**
- 🔒 **Row Level Security (RLS)** - Users can only access their own tournament photos
- 📱 **Mobile Optimization** - Touch-friendly interface with 44px+ touch targets
- 🎨 **Image Processing** - Support for JPG, PNG, GIF, WebP formats
- 📊 **Progress Tracking** - Real-time upload and processing progress
- 🔄 **Bulk Operations** - Select and manage multiple photos at once
- 📤 **Export Functionality** - Download photo database as CSV

## 🏗️ **Architecture**

### **Frontend Components**
- `PhotoDatabaseManager` - Main photo management interface
- `MobileOptimizer` - Mobile performance optimization wrapper
- `Button`, `Icon` - Reusable UI components
- `toast` - User feedback system (Sonner)

### **Backend Infrastructure**
- **Supabase Database** - PostgreSQL with RLS policies
- **Supabase Storage** - Secure file storage with access controls
- **Row Level Security** - Tournament-level access control
- **Automatic Cleanup** - Orphaned photo management

### **Data Flow**
```
ZIP Upload → Storage Bucket → Image Processing → Player Matching → Database Storage → Photo Display
```

## 📋 **Prerequisites**

### **System Requirements**
- Node.js 16+ 
- React Native 0.70+
- Supabase account and project
- Modern web browser with ES6+ support

### **Dependencies**
```json
{
  "react": "^18.0.0",
  "react-native": "^0.70.0",
  "framer-motion": "^10.0.0",
  "sonner": "^1.0.0",
  "jszip": "^3.10.0",
  "@supabase/supabase-js": "^2.0.0"
}
```

## 🛠️ **Installation & Setup**

### **1. Database Setup**

#### **Run Migrations**
```bash
# Apply core migrations
supabase migration up 20250101000000  # Player photos table
supabase migration up 20250101000001  # Storage bucket
supabase migration up 20250101000002  # Optional: is_public enhancement
```

#### **Verify Database Structure**
```sql
-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('player_photos', 'tournaments', 'players');

-- Check storage bucket
SELECT * FROM storage.buckets WHERE id = 'tournament-photos';

-- Check RLS policies
SELECT policyname FROM pg_policies WHERE tablename = 'player_photos';
```

### **2. Component Integration**

#### **Import Component**
```jsx
import PhotoDatabaseManager from './components/PhotoDatabaseManager';
```

#### **Basic Usage**
```jsx
<PhotoDatabaseManager
  isOpen={showPhotoManager}
  onClose={() => setShowPhotoManager(false)}
  players={tournamentPlayers}
  tournamentId={tournament.id}
  onPhotosUpdated={handlePhotosUpdated}
/>
```

### **3. Storage Configuration**

#### **Supabase Storage Setup**
```sql
-- Verify bucket exists
SELECT * FROM storage.buckets WHERE id = 'tournament-photos';

-- Check bucket settings
SELECT 
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types 
FROM storage.buckets 
WHERE id = 'tournament-photos';
```

## 📖 **Usage Guide**

### **Photo Upload Process**

#### **1. Prepare Photos**
- **File Format**: JPG, PNG, GIF, WebP
- **Naming Convention**: Use player names (e.g., "John Smith.jpg")
- **File Size**: Individual photos < 10MB, ZIP < 50MB
- **Organization**: Place all photos in a single ZIP file

#### **2. Upload Photos**
1. **Open PhotoDatabaseManager** in your tournament
2. **Click "Choose ZIP File"** and select your photo ZIP
3. **Wait for processing** - system will extract and compress images
4. **Review matches** - automatic matching results will be shown
5. **Manual matching** - assign unmatched photos to players

#### **3. Photo Management**
- **View Photos**: See all uploaded photos with player details
- **Edit Photos**: Replace photos for existing players
- **Delete Photos**: Remove photos individually or in bulk
- **Export Data**: Download photo database as CSV

### **Photo Naming Best Practices**

#### **Recommended Formats**
```bash
# Exact player names
John Smith.jpg
Jane Doe.png
Bob Wilson.jpeg

# With underscores
John_Smith.jpg
Jane_Doe.png
Bob_Wilson.jpeg

# With hyphens
John-Smith.jpg
Jane-Doe.png
Bob-Wilson.jpeg
```

#### **Avoid These Formats**
```bash
# Unclear naming
IMG_001.jpg
Photo1.png
DSC_1234.jpeg

# Special characters
John@Smith.jpg
Jane#Doe.png
Bob$Wilson.jpeg
```

### **Player Matching Algorithm**

#### **Matching Priority**
1. **Exact Match** - Filename exactly matches player name
2. **Normalized Match** - Handles spaces, underscores, hyphens
3. **Partial Match** - Filename contains unique player identifier
4. **Word Match** - Multiple words match between filename and player name

#### **Example Matching**
```bash
Filename: "john_smith.jpg"
Player: "John Smith"
Result: ✅ Automatic match

Filename: "smith.jpg"
Player: "John Smith" (if unique)
Result: ✅ Automatic match

Filename: "player001.jpg"
Player: None
Result: ❌ Manual matching required
```

## 🔧 **Configuration**

### **Environment Variables**
```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# Photo Upload Settings
REACT_APP_MAX_PHOTO_SIZE=10485760        # 10MB per photo
REACT_APP_MAX_ZIP_SIZE=52428800          # 50MB total
REACT_APP_IMAGE_COMPRESSION_QUALITY=0.8  # 80% quality
REACT_APP_MAX_IMAGE_WIDTH=800            # Max width in pixels
```

### **Storage Bucket Settings**
```sql
-- Default bucket configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tournament-photos',
  'tournament-photos',
  false,                    -- Private bucket
  52428800,                -- 50MB limit
  ARRAY[
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/gif', 
    'image/webp', 
    'application/zip', 
    'application/x-zip-compressed', 
    'application/octet-stream'
  ]
);
```

### **RLS Policy Configuration**
```sql
-- Users can view photos for tournaments they own
CREATE POLICY "Users can view photos for tournaments they own" ON player_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tournaments 
      WHERE tournaments.id = player_photos.tournament_id 
      AND tournaments.user_id = auth.uid()
    )
  );

-- Users can insert photos for tournaments they own
CREATE POLICY "Users can insert photos for tournaments they own" ON player_photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tournaments 
      WHERE tournaments.id = player_photos.tournament_id 
      AND tournaments.user_id = auth.uid()
    )
  );
```

## 🧪 **Testing**

### **Automated Testing**
```bash
# Run test script in browser console
# Copy and paste test-photo-upload.js content

# Manual test execution
window.testPhotoUpload.runAllTests()
window.testPhotoUpload.testStorageBucket()
window.testPhotoUpload.testDatabaseTable()
```

### **Manual Testing Checklist**
- [ ] **File Upload**
  - [ ] Valid ZIP file uploads successfully
  - [ ] Invalid file types are rejected
  - [ ] Oversized files show appropriate errors
  - [ ] Progress indicators update correctly

- [ ] **Image Processing**
  - [ ] Images are extracted from ZIP
  - [ ] Compression works for large images
  - [ ] Various formats are supported
  - [ ] Processing doesn't freeze UI

- [ ] **Player Matching**
  - [ ] Automatic matching works correctly
  - [ ] Manual matching interface is functional
  - [ ] Unmatched photos are handled gracefully
  - [ ] Matched photos appear in database

- [ ] **Photo Management**
  - [ ] Photos display correctly
  - [ ] Edit/delete operations work
  - [ ] Bulk operations function properly
  - [ ] Export generates correct CSV

- [ ] **Security**
  - [ ] RLS policies enforce access control
  - [ ] Users can only access their tournaments
  - [ ] Storage policies are secure
  - [ ] Public access is properly controlled

### **Performance Testing**
```bash
# Upload speed benchmarks
Small ZIP (1-5MB): < 30 seconds
Medium ZIP (5-20MB): < 2 minutes
Large ZIP (20-50MB): < 5 minutes

# Image processing benchmarks
Compression: 20-60% size reduction
Quality: Visually acceptable results
Memory: < 100MB RAM usage
```

## 🚨 **Troubleshooting**

### **Common Issues**

#### **1. Upload Errors**
```bash
# Error: "Please upload a ZIP file"
Solution: Ensure file has .zip extension and is valid ZIP format

# Error: "File size must be less than 50MB"
Solution: Reduce ZIP file size or split into multiple uploads

# Error: "Failed to process photo database"
Solution: Check ZIP file integrity and image formats
```

#### **2. Player Matching Issues**
```bash
# Photos not matching automatically
Solution: Ensure filenames follow naming conventions
Solution: Use manual matching for unmatched photos

# Incorrect matches
Solution: Review automatic matches and correct manually
Solution: Improve filename clarity for future uploads
```

#### **3. Database Errors**
```bash
# Error: "column does not exist"
Solution: Run database migrations to create required tables

# Error: "policy already exists"
Solution: Use DROP POLICY IF EXISTS in migrations

# Error: "permission denied"
Solution: Check RLS policies and user authentication
```

#### **4. Storage Issues**
```bash
# Error: "bucket not found"
Solution: Create storage bucket using migration

# Error: "access denied"
Solution: Verify storage policies and user permissions

# Error: "file not found"
Solution: Check file paths and storage bucket configuration
```

### **Debug Tools**

#### **Console Logging**
```javascript
// Enable debug logging
console.log('Photo processing:', { filename, playerName, matchedPlayer });
console.log('Database operations:', { operation, result, error });
console.log('Storage operations:', { action, path, result });
```

#### **Network Monitoring**
- Use browser DevTools Network tab
- Monitor API calls to Supabase
- Check storage upload/download requests
- Verify CORS headers

#### **Database Inspection**
```sql
-- Check photo records
SELECT * FROM player_photos WHERE tournament_id = ?;

-- Check storage objects
SELECT * FROM storage.objects WHERE bucket_id = 'tournament-photos';

-- Verify RLS policies
SELECT * FROM pg_policies WHERE tablename = 'player_photos';
```

## 🔒 **Security**

### **Access Control**
- **Tournament Ownership**: Users can only access photos for tournaments they own
- **Row Level Security**: Database-level access control
- **Storage Policies**: File-level access control
- **Authentication Required**: All operations require valid user session

### **Data Protection**
- **Encrypted Storage**: Supabase provides encryption at rest
- **Secure URLs**: Temporary, signed URLs for photo access
- **Input Validation**: File type and size validation
- **SQL Injection Protection**: Parameterized queries

### **Privacy Considerations**
- **Photo Storage**: Photos are stored securely in Supabase
- **Access Logging**: All access attempts are logged
- **Data Retention**: Photos are retained until manually deleted
- **Export Control**: CSV export includes only necessary information

## 📱 **Mobile Optimization**

### **Touch Interface**
- **Touch Targets**: All interactive elements are 44px+
- **Gesture Support**: Swipe, pinch, and tap gestures
- **Responsive Design**: Adapts to all screen sizes
- **Performance**: Optimized for mobile devices

### **Mobile-Specific Features**
- **File Upload**: Native file picker integration
- **Image Compression**: Optimized for mobile bandwidth
- **Progress Indicators**: Clear feedback during operations
- **Error Handling**: Mobile-friendly error messages

## 🔄 **Maintenance**

### **Regular Tasks**
- **Cleanup Orphaned Photos**: Run cleanup function periodically
- **Monitor Storage Usage**: Check bucket size and cleanup old files
- **Update Policies**: Review and update RLS policies as needed
- **Performance Monitoring**: Monitor upload and processing times

### **Backup & Recovery**
- **Database Backups**: Regular Supabase backups
- **Storage Backups**: Important photos should be backed up separately
- **Configuration Backup**: Save migration files and configuration
- **Recovery Procedures**: Document recovery steps for critical failures

## 📚 **API Reference**

### **PhotoDatabaseManager Props**
```jsx
interface PhotoDatabaseManagerProps {
  isOpen: boolean;                    // Modal open state
  onClose: () => void;               // Close handler
  players: Player[];                  // Tournament players
  tournamentId: number;               // Tournament ID
  onPhotosUpdated?: () => void;      // Callback when photos updated
}
```

### **Player Interface**
```typescript
interface Player {
  player_id: number;                  // Unique player identifier
  name: string;                       // Player name
  rating?: number;                    // Player rating (optional)
  wins?: number;                      // Win count (optional)
  losses?: number;                    // Loss count (optional)
}
```

### **Photo Record Structure**
```sql
CREATE TABLE player_photos (
    id BIGSERIAL PRIMARY KEY,
    tournament_id BIGINT NOT NULL REFERENCES tournaments(id),
    player_id BIGINT NOT NULL REFERENCES players(id),
    photo_url TEXT NOT NULL,
    filename TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_id, player_id)
);
```

## 🤝 **Contributing**

### **Development Setup**
```bash
# Clone repository
git clone <repository-url>
cd nimbus-pos

# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test
```

### **Code Standards**
- **TypeScript**: Use TypeScript for type safety
- **ESLint**: Follow ESLint configuration
- **Prettier**: Use Prettier for code formatting
- **Testing**: Write tests for new features
- **Documentation**: Update documentation for changes

### **Pull Request Process**
1. **Fork repository** and create feature branch
2. **Implement changes** with proper testing
3. **Update documentation** for new features
4. **Submit pull request** with detailed description
5. **Code review** and approval process
6. **Merge changes** to main branch

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

### **Getting Help**
- **Documentation**: Check this README and testing guide
- **Issues**: Create GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact support team for urgent issues

### **Community**
- **GitHub**: [Repository](https://github.com/your-org/nimbus-pos)
- **Discord**: [Community Server](https://discord.gg/your-server)
- **Documentation**: [Full Documentation](https://docs.your-app.com)

---

**Built with ❤️ by the Nimbus POS Team**

*Last updated: January 2025*
