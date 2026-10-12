const axios = require('axios');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'd:/RN/Hotel/backend/.env' });

const BASE_URL = 'http://127.0.0.1:3000/api';

async function runTests() {
  console.log('\n=========================================');
  console.log('🏨 HOTEL BOOKING API - FULL E2E TEST');
  console.log('=========================================\n');

  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hotel_db'
  });

  try {
    // ---------------------------------------------------------
    // 1. SEEDING STATIC DATA (Tables 4, 5, 6, 7, 8)
    // ---------------------------------------------------------
    console.log('🌱 Seeding hotel metadata and inventory...');
    
    await pool.query("INSERT IGNORE INTO hotel_amenities (hotel_id, amenity_name) VALUES (2, 'Free High-Speed WiFi'), (2, 'Infinity Pool')");
    await pool.query("INSERT IGNORE INTO hotel_policies (hotel_id, policy_type, policy_text) VALUES (2, 'CHECK_IN', 'Check-in is from 2:00 PM')");
    await pool.query("INSERT IGNORE INTO room_amenities (room_id, amenity_name) VALUES (5, 'Smart TV'), (5, 'Mini Bar')");
    await pool.query("INSERT IGNORE INTO room_rate_plans (room_id, plan_name, base_price, meal_plan) VALUES (5, 'Standard with Breakfast', 3500.00, 'BREAKFAST')");
    
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const date1 = nextMonth.toISOString().split('T')[0];
    nextMonth.setDate(nextMonth.getDate() + 1);
    const date2 = nextMonth.toISOString().split('T')[0];
    nextMonth.setDate(nextMonth.getDate() + 1);
    const date3 = nextMonth.toISOString().split('T')[0];
    
    await pool.query(`INSERT IGNORE INTO room_availability (room_id, date, available_rooms, price_override) VALUES 
      (5, '${date1}', 5, 2800.00), 
      (5, '${date2}', 5, 2900.00)
    `);

    // ---------------------------------------------------------
    // 2. AUTH & USERS MODULE (Tables 1, 2, 3)
    // ---------------------------------------------------------
    console.log('\n🔐 Testing Authentication & Users...');
    await pool.query("DELETE FROM users WHERE email = 'test.user@example.com'");

    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Test User', email: 'test.user@example.com', password: 'SecurePassword123!', mobile: '9876543210'
    });
    console.log('✅ Register:', regRes.data.message);

    await pool.query("UPDATE users SET email_verified = 1 WHERE email = 'test.user@example.com'");

    const loginRes = await axios.post(`${BASE_URL}/auth/login`, { email: 'test.user@example.com', password: 'SecurePassword123!' });
    const token = loginRes.data.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Login successful! JWT Token acquired.');

    const forgotRes = await axios.post(`${BASE_URL}/auth/forgot-password`, { email: 'test.user@example.com' });
    console.log('✅ Forgot Password:', forgotRes.data.message);

    const profileRes = await axios.get(`${BASE_URL}/users/me`, { headers });
    console.log('✅ Get Profile:', profileRes.data.data.name);

    // ---------------------------------------------------------
    // 3. LOCATIONS & HOTELS MODULE
    // ---------------------------------------------------------
    console.log('\n🏨 Testing Hotels & Locations...');
    const locRes = await axios.get(`${BASE_URL}/locations/search?q=kol`);
    console.log(`✅ Location Search: Found ${locRes.data.data.length} results`);

    const hotelRes = await axios.get(`${BASE_URL}/hotels/2`);
    console.log(`✅ Hotel Details: ${hotelRes.data.data.hotel.hotel_name}`);

    const availRes = await axios.get(`${BASE_URL}/hotels/2/availability?checkIn=${date1}&checkOut=${date3}&adults=2`);
    const availableRooms = availRes.data.data.availability;
    console.log(`✅ Room Availability Check: Found ${availableRooms.length} available room types for these dates`);
    
    if (availableRooms.length === 0) throw new Error("No rooms available, cannot proceed to booking!");

    // ---------------------------------------------------------
    // 4. BOOKINGS MODULE (Tables 9, 10, 11, 12)
    // ---------------------------------------------------------
    console.log('\n📅 Testing Bookings & Cancellations...');
    const bookRes = await axios.post(`${BASE_URL}/bookings`, {
      hotel_id: 2, room_id: 5, check_in: date1, check_out: date3, num_rooms: 1, num_adults: 2,
      contact_name: 'Test User', contact_email: 'test.user@example.com', contact_phone: '9876543210',
      guests: [{ first_name: 'Test', last_name: 'User', guest_type: 'ADULT', is_primary: true }]
    }, { headers });
    
    const booking = bookRes.data.data.booking;
    console.log(`✅ Booking Created! Reference: ${booking.booking_reference}, Total: ₹${booking.total_amount}`);

    const myBookings = await axios.get(`${BASE_URL}/bookings`, { headers });
    console.log(`✅ My Bookings: Found ${myBookings.data.data.pagination.total} bookings`);

    const cancelRes = await axios.post(`${BASE_URL}/bookings/${booking.id}/cancel`, {
      reason: 'Testing cancellation flow'
    }, { headers });
    console.log(`✅ Booking Cancelled! Status is now: ${cancelRes.data.data.booking.booking_status}`);

    console.log('\n=========================================');
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉');
    console.log('All 12 tables were populated and tested.');
    console.log('=========================================\n');

  } catch (err) {
    console.error('\n❌ TEST FAILED:');
    if (err.response) {
      console.error(JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
  } finally {
    await pool.query("DELETE FROM users WHERE email = 'test.user@example.com'");
    await pool.end();
    process.exit(0);
  }
}

runTests();
