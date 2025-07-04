// Test script for villa management database
// Run with: node test-database.js

const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabase() {
  console.log('🧪 Testing Villa Management Database...\n')

  try {
    // Test 1: Check users
    console.log('1️⃣ Testing users table...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
    
    if (usersError) throw usersError
    console.log(`✅ Found ${users.length} users:`)
    users.forEach(user => console.log(`   - ${user.name} (${user.role})`))
    console.log()

    // Test 2: Check properties
    console.log('2️⃣ Testing properties table...')
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select(`
        *,
        users!properties_client_id_fkey(name, email)
      `)
    
    if (propertiesError) throw propertiesError
    console.log(`✅ Found ${properties.length} properties:`)
    properties.forEach(prop => console.log(`   - ${prop.name} (Owner: ${prop.users.name})`))
    console.log()

    // Test 3: Check bookings
    console.log('3️⃣ Testing bookings table...')
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        *,
        properties(name)
      `)
    
    if (bookingsError) throw bookingsError
    console.log(`✅ Found ${bookings.length} bookings:`)
    bookings.forEach(booking => console.log(`   - ${booking.guest_name} at ${booking.properties.name} (${booking.status})`))
    console.log()

    // Test 4: Check tasks
    console.log('4️⃣ Testing tasks table...')
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select(`
        *,
        properties(name),
        users!tasks_staff_id_fkey(name)
      `)
    
    if (tasksError) throw tasksError
    console.log(`✅ Found ${tasks.length} tasks:`)
    tasks.forEach(task => console.log(`   - ${task.task_type} assigned to ${task.users.name} (${task.status})`))
    console.log()

    // Test 5: Check reports
    console.log('5️⃣ Testing reports table...')
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select(`
        *,
        properties(name)
      `)
    
    if (reportsError) throw reportsError
    console.log(`✅ Found ${reports.length} reports:`)
    reports.forEach(report => console.log(`   - ${report.properties.name} ${report.month}/${report.year}: ฿${report.income} income`))
    console.log()

    // Test 6: Test views
    console.log('6️⃣ Testing database views...')
    const { data: propertySummary, error: viewError } = await supabase
      .from('property_summary')
      .select('*')
    
    if (viewError) throw viewError
    console.log(`✅ Property summary view working: ${propertySummary.length} records`)
    console.log()

    // Test 7: Test functions
    console.log('7️⃣ Testing database functions...')
    const { data: occupancyResult, error: funcError } = await supabase
      .rpc('calculate_occupancy_rate', {
        property_uuid: '550e8400-e29b-41d4-a716-446655440003',
        start_date: '2024-02-01',
        end_date: '2024-02-28'
      })
    
    if (funcError) throw funcError
    console.log(`✅ Occupancy rate function working: ${occupancyResult}%`)
    console.log()

    // Test 8: Insert and delete test data
    console.log('8️⃣ Testing CRUD operations...')
    
    // Insert test user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{ name: 'Test User', email: 'test@test.com', role: 'client' }])
      .select()
    
    if (insertError) throw insertError
    console.log(`✅ Inserted test user: ${newUser[0].name}`)
    
    // Delete test user
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('email', 'test@test.com')
    
    if (deleteError) throw deleteError
    console.log(`✅ Deleted test user`)
    console.log()

    console.log('🎉 All database tests passed! Your schema is working correctly.')

  } catch (error) {
    console.error('❌ Database test failed:', error.message)
    console.error('Details:', error)
  }
}

// Run the tests
testDatabase()
