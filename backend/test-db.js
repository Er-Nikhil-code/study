const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:zoUXRAuUOFOnqLRiKaMjYmdPsyVGisjV@acela.proxy.rlwy.net:44768/railway';

console.log('Testing connection to:', connectionString.substring(0, 50) + '...');

const client = new Client({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false },
});

client.connect((err) => {
  if (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }
  console.log('✅ Connection successful!');
  client.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('❌ Query failed:', err.message);
    } else {
      console.log('✅ Query result:', res.rows[0]);
    }
    client.end();
    process.exit(0);
  });
});
