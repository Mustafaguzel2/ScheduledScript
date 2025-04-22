import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

// Helper function to run queries
export async function query(text: string, params?: (string | number | boolean | null)[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error executing query', { text, error });
    throw error;
  }
}
export async function getTables() {
  const query = `
    SELECT 
      table_schema,
      table_name
    FROM information_schema.tables 
    WHERE table_schema IN ('deneme', 'public')
    AND table_type = 'BASE TABLE'
    ORDER BY table_schema, table_name;
  `;
  
  const res = await pool.query(query);
  return res.rows.map((row: { table_schema: string; table_name: string }) => ({
    schema: row.table_schema,
    table: row.table_name
  }));
}

// Cleanup function for graceful shutdown
export async function closePool() {
  await pool.end();
} 