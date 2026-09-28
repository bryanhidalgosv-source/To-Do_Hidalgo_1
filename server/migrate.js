import pg from 'pg'

const { Pool } = pg

const neonPool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_DZoRXCbUL46K@ep-divine-lab-b5xy852n-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false },
})

const localPool = new Pool({
  connectionString: 'postgresql://postgres:43214321@localhost:5432/todo_app',
})

const result = await neonPool.query('SELECT * FROM tareas ORDER BY id')
console.log(`Encontradas ${result.rows.length} tareas en producción`)

for (const row of result.rows) {
  await localPool.query(
    `INSERT INTO tareas (id, texto, completada, eliminada, creada_en)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE SET texto = $2, completada = $3, eliminada = $4`,
    [row.id, row.texto, row.completada, row.eliminada, row.creada_en]
  )
  console.log(`  ✓ ${row.texto}`)
}

await localPool.query(`SELECT setval('tareas_id_seq', (SELECT MAX(id) FROM tareas))`)
console.log('\n¡Migración completada!')

await neonPool.end()
await localPool.end()
