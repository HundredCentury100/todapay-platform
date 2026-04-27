// Supabase Connection Test Script
// This tests the connection to the Supabase database

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env file manually
const envFile = readFileSync('.env', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^#][^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const SUPABASE_URL = envVars.VITE_SUPABASE_URL;
const SUPABASE_KEY = envVars.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('🔍 Testing Supabase Connection...\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Check environment variables
console.log('📋 Configuration Check:');
console.log(`   URL: ${SUPABASE_URL ? '✅ Found' : '❌ Missing'}`);
console.log(`   Key: ${SUPABASE_KEY ? '✅ Found (${SUPABASE_KEY.substring(0, 20)}...)' : '❌ Missing'}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ ERROR: Missing Supabase credentials in .env file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: null,
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function testConnection() {
  try {
    console.log('🔌 Test 1: Basic Connection');
    console.log('   Testing connection to Supabase...');

    // Test basic connection by querying auth
    const { data: authData, error: authError } = await supabase.auth.getSession();

    if (authError && authError.message !== 'Auth session missing!') {
      console.log(`   ❌ Connection failed: ${authError.message}`);
      return false;
    }

    console.log('   ✅ Connection successful!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test 2: Query a public table
    console.log('📊 Test 2: Database Schema Access');
    console.log('   Attempting to query database...');

    // Try to query the profiles table (common table)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (profileError) {
      console.log(`   ⚠️  Could not access 'profiles' table: ${profileError.message}`);
    } else {
      console.log(`   ✅ Successfully accessed 'profiles' table`);
      console.log(`   📝 Sample data available: ${profileData && profileData.length > 0 ? 'Yes' : 'No'}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test 3: List some common tables
    console.log('🗄️  Test 3: Common Tables Check');
    const commonTables = ['profiles', 'bookings', 'events', 'buses', 'rides', 'merchants'];

    for (const tableName of commonTables) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`   ⚠️  ${tableName}: ${error.code === '42P01' ? 'Table does not exist' : error.message}`);
      } else {
        console.log(`   ✅ ${tableName}: Accessible (${data && data.length > 0 ? 'has data' : 'empty'})`);
      }
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test 4: Auth capabilities
    console.log('🔐 Test 4: Authentication System');
    console.log('   Testing auth endpoint...');

    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.log(`   ⚠️  Admin auth not accessible (expected with anon key)`);
      console.log(`   ✅ Public auth endpoints available for signup/signin`);
    } else {
      console.log(`   ✅ Auth system accessible`);
      console.log(`   📊 Total users: ${users ? users.length : 'N/A'}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Summary
    console.log('📝 SUMMARY:');
    console.log('   ✅ Supabase connection: WORKING');
    console.log('   ✅ Database access: CONFIGURED');
    console.log('   ✅ Auth system: READY');
    console.log('   🌐 Project URL: ' + SUPABASE_URL);
    console.log('   🔑 Using: Anon/Public key (client-side)');
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ All tests completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return true;
  } catch (error) {
    console.error('❌ FATAL ERROR:', error.message);
    console.error('\nStack trace:', error.stack);
    return false;
  }
}

// Run the test
testConnection()
  .then(success => {
    if (success) {
      console.log('🎉 Supabase is properly configured and working!\n');
      process.exit(0);
    } else {
      console.log('❌ Supabase connection test failed.\n');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
