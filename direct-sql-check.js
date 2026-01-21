#!/usr/bin/env node

import 'dotenv/config';
import mysql from 'mysql2/promise';

async function directCheck() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_mis'
  });

  console.log('🔍 Direct SQL check for test19\n');

  const [rows] = await connection.execute(
    'SELECT id, username, password, salt, status, role FROM users WHERE username = ? LIMIT 1',
    ['test19']
  );

  if (rows.length === 0) {
    console.log('❌ User not found');
    await connection.end();
    return;
  }

  const user = rows[0];
  console.log('✅ User found:');
  console.log('   ID:', user.id);
  console.log('   Username:', user.username);
  console.log('   Role:', user.role);
  console.log('   Status:', user.status);
  console.log('');
  console.log('🔐 Password Data:');
  console.log('   Password (full):', user.password);
  console.log('   Password length:', user.password?.length || 0);
  console.log('   Salt:', user.salt || 'NULL');
  console.log('');
  console.log('📊 Hash from creation logs:');
  console.log('   $2a$12$JQKAYh1o6NyUan0HuReCX.nHWrQEUvTPJRo/lNGOS0IPWU4wWo/Dq');
  console.log('');
  console.log('Are they the same?', user.password === '$2a$12$JQKAYh1o6NyUan0HuReCX.nHWrQEUvTPJRo/lNGOS0IPWU4wWo/Dq' ? '✅ YES' : '❌ NO');

  await connection.end();
}

directCheck().catch(console.error);
