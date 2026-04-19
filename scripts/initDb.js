const { sql } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });

async function initDb() {
  try {
    console.log('Creating pc_equipment table...');
    await sql`
      CREATE TABLE IF NOT EXISTS pc_equipment (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log('Creating pc_parts table...');
    await sql`
      CREATE TABLE IF NOT EXISTS pc_parts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        part_code VARCHAR(100),
        name VARCHAR(255) NOT NULL,
        main_category VARCHAR(100),
        sub_category VARCHAR(100),
        unit_price INTEGER DEFAULT 0,
        specs TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log('Creating pc_equipment_bom table...');
    await sql`
      CREATE TABLE IF NOT EXISTS pc_equipment_bom (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        equipment_id UUID REFERENCES pc_equipment(id) ON DELETE CASCADE,
        part_id UUID REFERENCES pc_parts(id) ON DELETE CASCADE,
        required_qty INTEGER DEFAULT 1
      );
    `;

    console.log('Creating pc_part_price_history table...');
    await sql`
      CREATE TABLE IF NOT EXISTS pc_part_price_history (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        part_id UUID REFERENCES pc_parts(id) ON DELETE CASCADE,
        previous_price INTEGER NOT NULL,
        new_price INTEGER NOT NULL,
        changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log('Database initialization completed securely!');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

initDb();
