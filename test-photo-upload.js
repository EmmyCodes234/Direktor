// 📸 Photo Upload System Test Script
// Run this in the browser console to test the photo upload functionality

console.log('🧪 Testing Photo Upload System...');

// Test 1: Check if PhotoDatabaseManager component exists
if (typeof PhotoDatabaseManager !== 'undefined') {
  console.log('✅ PhotoDatabaseManager component found');
} else {
  console.log('❌ PhotoDatabaseManager component not found');
}

// Test 2: Check if Supabase client is configured
if (typeof supabase !== 'undefined') {
  console.log('✅ Supabase client found');
  
  // Test Supabase connection
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.log('❌ Supabase connection error:', error);
    } else {
      console.log('✅ Supabase connection successful');
      if (data.session) {
        console.log('✅ User authenticated:', data.session.user.email);
      } else {
        console.log('⚠️ User not authenticated');
      }
    }
  });
} else {
  console.log('❌ Supabase client not found');
}

// Test 3: Check if storage bucket exists
async function testStorageBucket() {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.log('❌ Storage bucket check failed:', error);
      return;
    }
    
    const tournamentPhotosBucket = data.find(bucket => bucket.id === 'tournament-photos');
    if (tournamentPhotosBucket) {
      console.log('✅ tournament-photos bucket found');
      console.log('📊 Bucket details:', {
        id: tournamentPhotosBucket.id,
        name: tournamentPhotosBucket.name,
        public: tournamentPhotosBucket.public,
        file_size_limit: tournamentPhotosBucket.file_size_limit,
        allowed_mime_types: tournamentPhotosBucket.allowed_mime_types
      });
    } else {
      console.log('❌ tournament-photos bucket not found');
    }
  } catch (error) {
    console.log('❌ Storage bucket test failed:', error);
  }
}

// Test 4: Check database table structure
async function testDatabaseTable() {
  try {
    const { data, error } = await supabase
      .from('player_photos')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Database table check failed:', error);
      return;
    }
    
    console.log('✅ player_photos table accessible');
    console.log('📊 Sample record structure:', data.length > 0 ? Object.keys(data[0]) : 'No records found');
  } catch (error) {
    console.log('❌ Database table test failed:', error);
  }
}

// Test 5: Check RLS policies
async function testRLSPolicies() {
  try {
    // This would require admin access to check policies
    console.log('ℹ️ RLS policies can only be checked with admin access');
    console.log('ℹ️ Expected policies:');
    console.log('  - Users can view photos for tournaments they own');
    console.log('  - Users can insert photos for tournaments they own');
    console.log('  - Users can update photos for tournaments they own');
    console.log('  - Users can delete photos for tournaments they own');
  } catch (error) {
    console.log('❌ RLS policy test failed:', error);
  }
}

// Test 6: Check if tournaments exist
async function testTournaments() {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select('id, name, user_id')
      .limit(5);
    
    if (error) {
      console.log('❌ Tournaments check failed:', error);
      return;
    }
    
    console.log('✅ Tournaments table accessible');
    console.log('📊 Found tournaments:', data.length);
    data.forEach(tournament => {
      console.log(`  - ${tournament.name} (ID: ${tournament.id}, User: ${tournament.user_id})`);
    });
  } catch (error) {
    console.log('❌ Tournaments test failed:', error);
  }
}

// Test 7: Check if players exist
async function testPlayers() {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('id, name')
      .limit(5);
    
    if (error) {
      console.log('❌ Players check failed:', error);
      return;
    }
    
    console.log('✅ Players table accessible');
    console.log('📊 Found players:', data.length);
    data.forEach(player => {
      console.log(`  - ${player.name} (ID: ${player.id})`);
    });
  } catch (error) {
    console.log('❌ Players test failed:', error);
  }
}

// Test 8: Check existing photos
async function testExistingPhotos() {
  try {
    const { data, error } = await supabase
      .from('player_photos')
      .select('*')
      .limit(5);
    
    if (error) {
      console.log('❌ Existing photos check failed:', error);
      return;
    }
    
    console.log('✅ Existing photos check successful');
    console.log('📊 Found photos:', data.length);
    if (data.length > 0) {
      data.forEach(photo => {
        console.log(`  - ${photo.filename} for player ${photo.player_id} in tournament ${photo.tournament_id}`);
      });
    }
  } catch (error) {
    console.log('❌ Existing photos test failed:', error);
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n🚀 Running comprehensive tests...\n');
  
  await testStorageBucket();
  await testDatabaseTable();
  await testRLSPolicies();
  await testTournaments();
  await testPlayers();
  await testExistingPhotos();
  
  console.log('\n🎉 All tests completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Create a test ZIP file with player photos');
  console.log('2. Open PhotoDatabaseManager in a tournament');
  console.log('3. Upload the test ZIP file');
  console.log('4. Verify photos are matched and stored correctly');
}

// Auto-run tests after a short delay
setTimeout(runAllTests, 1000);

// Export for manual testing
window.testPhotoUpload = {
  runAllTests,
  testStorageBucket,
  testDatabaseTable,
  testRLSPolicies,
  testTournaments,
  testPlayers,
  testExistingPhotos
};

console.log('💡 Manual testing available via: window.testPhotoUpload.runAllTests()');
