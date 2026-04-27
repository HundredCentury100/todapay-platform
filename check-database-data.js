// Database Data Check Script
// This checks what data actually exists in the Supabase database

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env file
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

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🔍 Checking Database Data...\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function checkAllTables() {
  const tables = [
    'venues',
    'events',
    'buses',
    'bus_routes',
    'bus_schedules',
    'properties',
    'workspaces',
    'experiences',
    'car_rentals',
    'transfers',
    'merchants',
    'profiles',
    'bookings'
  ];

  console.log('📊 CHECKING ALL TABLES:\n');

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: false })
        .limit(5);

      if (error) {
        if (error.code === '42P01') {
          console.log(`❌ ${table.padEnd(20)} - TABLE DOES NOT EXIST`);
        } else {
          console.log(`⚠️  ${table.padEnd(20)} - Error: ${error.message}`);
        }
      } else {
        const recordCount = data ? data.length : 0;
        if (recordCount === 0) {
          console.log(`⚪ ${table.padEnd(20)} - EXISTS but EMPTY (0 records)`);
        } else {
          console.log(`✅ ${table.padEnd(20)} - ${recordCount} records found`);
          // Show sample of first record
          if (data && data[0]) {
            const sampleKeys = Object.keys(data[0]).slice(0, 3);
            console.log(`   Sample fields: ${sampleKeys.join(', ')}`);
          }
        }
      }
    } catch (err) {
      console.log(`❌ ${table.padEnd(20)} - Error: ${err.message}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Check specific venue data
  console.log('🏢 DETAILED VENUE CHECK:\n');

  const { data: venueData, error: venueError } = await supabase
    .from('venues')
    .select('*')
    .limit(3);

  if (venueError) {
    console.log(`❌ Cannot query venues table: ${venueError.message}`);
    console.log(`   Error code: ${venueError.code}`);
    console.log(`   Details: ${venueError.details || 'None'}`);
  } else if (!venueData || venueData.length === 0) {
    console.log('⚪ Venues table exists but has NO DATA');
    console.log('   This is why you see "no places found"!');
  } else {
    console.log(`✅ Found ${venueData.length} venues in database:`);
    venueData.forEach((venue, i) => {
      console.log(`   ${i + 1}. ${venue.name || venue.title || 'Unnamed'} (ID: ${venue.id})`);
    });
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Check events
  console.log('🎉 DETAILED EVENTS CHECK:\n');

  const { data: eventData, error: eventError } = await supabase
    .from('events')
    .select('*')
    .limit(3);

  if (eventError) {
    console.log(`❌ Cannot query events table: ${eventError.message}`);
  } else if (!eventData || eventData.length === 0) {
    console.log('⚪ Events table exists but has NO DATA');
  } else {
    console.log(`✅ Found ${eventData.length} events in database:`);
    eventData.forEach((event, i) => {
      console.log(`   ${i + 1}. ${event.name || event.title || 'Unnamed'} (ID: ${event.id})`);
    });
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Check buses
  console.log('🚌 DETAILED BUSES/ROUTES CHECK:\n');

  const { data: busData, error: busError } = await supabase
    .from('bus_routes')
    .select('*')
    .limit(3);

  if (busError) {
    console.log(`❌ Cannot query bus_routes table: ${busError.message}`);
  } else if (!busData || busData.length === 0) {
    console.log('⚪ Bus routes table exists but has NO DATA');
  } else {
    console.log(`✅ Found ${busData.length} bus routes in database:`);
    busData.forEach((route, i) => {
      console.log(`   ${i + 1}. ${route.from_city || 'Unknown'} → ${route.to_city || 'Unknown'} (ID: ${route.id})`);
    });
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Summary
  console.log('📝 DIAGNOSIS:\n');
  console.log('If all tables show "EMPTY" or "DOES NOT EXIST", then:');
  console.log('');
  console.log('1. ✅ Database connection is WORKING');
  console.log('2. ❌ Database has NO SEED DATA');
  console.log('3. 💡 You need to populate the database with sample data');
  console.log('');
  console.log('NEXT STEPS:');
  console.log('• Check if there are seed/migration scripts');
  console.log('• Look for SQL files to populate initial data');
  console.log('• Or manually add data through Supabase dashboard');
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

checkAllTables().catch(console.error);
