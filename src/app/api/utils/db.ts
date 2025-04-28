import { Pool } from "pg";

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

export interface TableColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
}

export interface TableInfo {
  schema: string;
  table: string;
  type: string;
  columns: TableColumn[];
  data: Record<string, string | number | boolean | null>[];
}

interface TableListItem {
  id: string;
  name: string;
  schema: string;
  type: string;
  created_at: string;
  updated_at: string;
}

export async function getTableList(): Promise<TableListItem[]> {
  try {
    const query = `
      SELECT 
        CONCAT(table_schema, '.', table_name) as id,
        table_name as name,
        table_schema as schema,
        table_type as type,
        NOW() as created_at,
        NOW() as updated_at
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
      AND table_type IN ('BASE TABLE', 'VIEW')
      ORDER BY table_schema, table_name;
    `;

    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("Error fetching table list:", error);
    throw error;
  }
}

export async function getTableDetails(): Promise<TableInfo[]> {
  try {
    // Get all tables and views
    const tablesQuery = `
      SELECT table_schema, table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'deneme'
      AND table_type IN ('BASE TABLE', 'VIEW')
      ORDER BY table_schema, table_name;
    `;

    const tables = await pool.query(tablesQuery);

    // Get details for each table/view
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
          ;
        `;
        const data = await pool.query(dataQuery);

        return {
          schema: table.table_schema,
          table: table.table_name,
          type: table.table_type,
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
