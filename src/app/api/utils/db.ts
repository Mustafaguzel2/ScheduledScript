import { Pool } from "pg";

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

interface TableColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
}

interface TableInfo {
  schema: string;
  table: string;
  columns: TableColumn[];
  data: Record<string, string | number | boolean | null>[];
}

export async function getTableDetails(): Promise<TableInfo[]> {
  try {
    // Get all tables
    const tablesQuery = `
      SELECT table_schema, table_name
      FROM information_schema.tables 
      WHERE table_schema = 'deneme'
      AND table_type = 'BASE TABLE'
      ORDER BY table_schema, table_name;
    `;

    const tables = await pool.query(tablesQuery);

    // Get details for each table
    const tableDetails = await Promise.all(
      tables.rows.map(async (table) => {
        // Get columns
        const columnsQuery = `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = $1 AND table_name = $2
          ORDER BY ordinal_position;
        `;
        const columns = await pool.query(columnsQuery, [
          table.table_schema,
          table.table_name,
        ]);

        // Get data
        const dataQuery = `
          SELECT *
          FROM "${table.table_schema}"."${table.table_name}"
          LIMIT 100;
        `;
        const data = await pool.query(dataQuery);

        return {
          schema: table.table_schema,
          table: table.table_name,
          columns: columns.rows,
          data: data.rows,
        };
      })
    );

    return tableDetails;
  } catch (error) {
    console.error("Error fetching table details:", error);
    throw error;
  }
}

// Cleanup function for graceful shutdown
export async function closePool() {
  await pool.end();
}
