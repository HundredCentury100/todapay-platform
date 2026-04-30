// Test if booking_type constraint allows 'stay'
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBookingTypeConstraint() {
  console.log('Testing booking_type constraint...\n');

  // Try to insert a test booking with type 'stay'
  const testBooking = {
    booking_type: 'stay',
    guest_email: 'test@example.com',
    item_id: '00000000-0000-0000-0000-000000000000',
    item_name: 'Test Stay',
    passenger_name: 'Test User',
    passenger_email: 'test@example.com',
    passenger_phone: '1234567890',
    base_price: 100,
    total_price: 100,
    ticket_number: `TEST-${Date.now()}`,
    status: 'pending',
    payment_status: 'pending'
  };

  const { data, error } = await supabase
    .from('bookings')
    .insert(testBooking)
    .select();

  if (error) {
    if (error.message.includes('bookings_booking_type_check')) {
      console.log('❌ CONSTRAINT NOT UPDATED');
      console.log('Error:', error.message);
      console.log('\nThe migration has NOT been applied yet.');
      console.log('\nPlease apply it manually via Supabase Dashboard:');
      console.log('1. Go to: https://supabase.com/dashboard');
      console.log('2. Open SQL Editor');
      console.log('3. Run the SQL from: supabase/migrations/20260429_fix_booking_type_constraint.sql');
    } else {
      console.log('❌ Different error:', error.message);
    }
  } else {
    console.log('✅ CONSTRAINT UPDATED SUCCESSFULLY!');
    console.log('booking_type "stay" is now allowed');
    console.log('\nTest booking created with ID:', data[0].id);

    // Clean up test booking
    await supabase.from('bookings').delete().eq('id', data[0].id);
    console.log('Test booking cleaned up');
  }
}

testBookingTypeConstraint().catch(console.error);
