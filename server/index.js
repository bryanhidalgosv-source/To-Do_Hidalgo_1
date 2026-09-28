import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import pg from 'pg'

const { Pool } = pg

const app = express()
app.use(cors())
app.use(express.json())

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:43214321@localhost:5432/todo_app',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
})

await pool.query(`
  CREATE TABLE IF NOT EXISTS tareas (
    id SERIAL PRIMARY KEY,
    texto TEXT NOT NULL,
    completada BOOLEAN DEFAULT false,
    eliminada BOOLEAN DEFAULT false,
    creada_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`)

// Obtener tareas activas
app.get('/api/tareas', async (req, res) => {
  const result = await pool.query('SELECT * FROM tareas WHERE eliminada = false ORDER BY id DESC')
  res.json(result.rows)
})

// Obtener tareas borradas (papelera)
app.get('/api/borradas', async (req, res) => {
  const result = await pool.query('SELECT * FROM tareas WHERE eliminada = true ORDER BY id DESC')
  res.json(result.rows)
})

// Agregar tarea
app.post('/api/tareas', async (req, res) => {
  const { texto } = req.body
  const result = await pool.query(
    'INSERT INTO tareas (texto) VALUES ($1) RETURNING *',
    [texto]
  )
  res.json(result.rows[0])
})

// Editar texto de tarea
app.put('/api/tareas/:id', async (req, res) => {
  const { id } = req.params
  const { texto } = req.body
  const result = await pool.query(
    'UPDATE tareas SET texto = $1 WHERE id = $2 RETURNING *',
    [texto, id]
  )
  res.json(result.rows[0])
})

// Alternar completada
app.put('/api/tareas/:id/completar', async (req, res) => {
  const { id } = req.params
  const result = await pool.query(
    'UPDATE tareas SET completada = NOT completada WHERE id = $1 RETURNING *',
    [id]
  )
  res.json(result.rows[0])
})

// Enviar a papelera (borrado lógico)
app.delete('/api/tareas/:id', async (req, res) => {
  const { id } = req.params
  await pool.query('UPDATE tareas SET eliminada = true WHERE id = $1', [id])
  res.json({ ok: true })
})

// Restaurar de papelera
app.put('/api/tareas/:id/restaurar', async (req, res) => {
  const { id } = req.params
  const result = await pool.query(
    'UPDATE tareas SET eliminada = false WHERE id = $1 RETURNING *',
    [id]
  )
  res.json(result.rows[0])
})

// Eliminar definitivamente
app.delete('/api/tareas/:id/eliminar', async (req, res) => {
  const { id } = req.params
  await pool.query('DELETE FROM tareas WHERE id = $1', [id])
  res.json({ ok: true })
})

app.listen(3001, '0.0.0.0', () => {
  console.log('Servidor corriendo en http://localhost:3001')
})
