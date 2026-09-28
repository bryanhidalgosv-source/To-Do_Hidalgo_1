import { useState, useEffect } from 'react'

interface Tarea {
  id: number
  texto: string
  completada: boolean
  eliminada: boolean
}

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function App() {
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [borradas, setBorradas] = useState<Tarea[]>([])
  const [input, setInput] = useState('')
  const [editando, setEditando] = useState<number | null>(null)
  const [textoEditar, setTextoEditar] = useState('')
  const [mostrarPapelera, setMostrarPapelera] = useState(false)
  const [filtro, setFiltro] = useState<'todas' | 'activas' | 'completadas'>('todas')
  const [tema, setTema] = useState<'dark' | 'light'>('dark')
  const [toast, setToast] = useState<string | null>(null)
  const [confirmEliminarTodo, setConfirmEliminarTodo] = useState(0)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema)
  }, [tema])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const cargarTareas = () => {
    fetch(`${API}/tareas`).then((r) => r.json()).then(setTareas)
    fetch(`${API}/borradas`).then((r) => r.json()).then(setBorradas)
  }

  useEffect(() => { cargarTareas() }, [])

  const agregarTarea = async () => {
    if (input.trim() === '') return
    await fetch(`${API}/tareas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto: input.trim() }),
    })
    setInput('')
    cargarTareas()
  }

  const toggleTarea = async (id: number) => {
    const res = await fetch(`${API}/tareas/${id}/completar`, { method: 'PUT' })
    const actualizada = await res.json()
    if (actualizada.completada) {
      setToast(`✓ "${actualizada.texto}" completada!`)
    }
    cargarTareas()
  }

  const iniciarEdicion = (tarea: Tarea) => {
    setEditando(tarea.id)
    setTextoEditar(tarea.texto)
  }

  const guardarEdicion = async (id: number) => {
    await fetch(`${API}/tareas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto: textoEditar.trim() }),
    })
    setEditando(null)
    cargarTareas()
  }

  const enviarPapelera = async (id: number) => {
    await fetch(`${API}/tareas/${id}`, { method: 'DELETE' })
    cargarTareas()
  }

  const restaurar = async (id: number) => {
    await fetch(`${API}/tareas/${id}/restaurar`, { method: 'PUT' })
    cargarTareas()
  }

  const eliminarDefinitivo = async (id: number) => {
    if (confirm('Eliminar definitivamente?')) {
      await fetch(`${API}/tareas/${id}/eliminar`, { method: 'DELETE' })
      cargarTareas()
    }
  }

  const eliminarTodo = async () => {
    if (confirmEliminarTodo === 0) {
      setConfirmEliminarTodo(1)
      setToast('Esta acción es irreversible. Se eliminarán definitivamente de la base de datos.')
      setTimeout(() => setConfirmEliminarTodo(0), 4000)
      return
    }
    for (const tarea of borradas) {
      await fetch(`${API}/tareas/${tarea.id}/eliminar`, { method: 'DELETE' })
    }
    setConfirmEliminarTodo(0)
    setToast('Papelera vaciada. Todas las tareas fueron eliminadas definitivamente.')
    cargarTareas()
  }

  const tareasFiltradas = tareas.filter((t) => {
    if (filtro === 'activas') return !t.completada
    if (filtro === 'completadas') return t.completada
    return true
  })

  return (
    <div className="container">
      {toast && (
        <div className="toast">
          <span className="toast-icon">✓</span>
          <span className="toast-text">{toast}</span>
        </div>
      )}

      <div className="header">
        <h1>To-Do_Hidalgo_1</h1>
        <button className="theme-toggle" onClick={() => setTema(tema === 'dark' ? 'light' : 'dark')}>
          {tema === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="input-row">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && agregarTarea()}
          placeholder="Escribe una tarea..."
        />
        <button onClick={agregarTarea}>Agregar</button>
      </div>

      <div className="toolbar">
        <div className="tabs">
          <button
            className={!mostrarPapelera ? 'tab-activo' : 'tab'}
            onClick={() => setMostrarPapelera(false)}
          >
            Tareas ({tareas.length})
          </button>
          <button
            className={mostrarPapelera ? 'tab-activo' : 'tab'}
            onClick={() => setMostrarPapelera(true)}
          >
            Papelera ({borradas.length})
          </button>
        </div>

        {!mostrarPapelera && (
          <div className="filtros">
            <button className={filtro === 'todas' ? 'filtro-activo' : 'filtro'} onClick={() => setFiltro('todas')}>Todas</button>
            <button className={filtro === 'activas' ? 'filtro-activo' : 'filtro'} onClick={() => setFiltro('activas')}>Activas ({tareas.filter((t) => !t.completada).length})</button>
            <button className={filtro === 'completadas' ? 'filtro-activo' : 'filtro'} onClick={() => setFiltro('completadas')}>Hechas</button>
          </div>
        )}
      </div>

      {!mostrarPapelera ? (
        <ul className="lista">
          {tareasFiltradas.map((tarea) => (
            <li key={tarea.id} className={tarea.completada ? 'completada' : ''}>
              {editando === tarea.id ? (
                <div className="edit-row">
                  <input
                    value={textoEditar}
                    onChange={(e) => setTextoEditar(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && guardarEdicion(tarea.id)}
                    autoFocus
                  />
                  <button onClick={() => guardarEdicion(tarea.id)}>Guardar</button>
                  <button className="cancelar" onClick={() => setEditando(null)}>X</button>
                </div>
              ) : (
                <>
                  <label className="check-container">
                    <input type="checkbox" checked={tarea.completada} onChange={() => toggleTarea(tarea.id)} />
                    <span className="checkmark"></span>
                  </label>
                  <span className="texto-tarea" onClick={() => toggleTarea(tarea.id)}>{tarea.texto}</span>
                  <div className="acciones">
                    <button className="editar" onClick={() => iniciarEdicion(tarea)}>Editar</button>
                    <button className="eliminar" onClick={() => enviarPapelera(tarea.id)}>Papelera</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <>
          {borradas.length > 0 && (
            <div className="eliminar-todo-container">
              <button className={`eliminar-todo ${confirmEliminarTodo === 1 ? 'confirm-1' : ''} ${confirmEliminarTodo === 2 ? 'confirm-2' : ''}`} onClick={eliminarTodo}>
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg>
                <span>{confirmEliminarTodo === 0 ? 'Eliminar todo' : 'Confirmar eliminación definitiva'}</span>
              </button>
            </div>
          )}
          <ul className="lista">
            {borradas.map((tarea) => (
              <li key={tarea.id} className="borrada">
                <span>{tarea.texto}</span>
                <div className="acciones">
                  <button className="restaurar" onClick={() => restaurar(tarea.id)}>Restaurar</button>
                  <button className="eliminar-definitivo" onClick={() => eliminarDefinitivo(tarea.id)}>Eliminar</button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {!mostrarPapelera && (
        <p className="contador">
          {tareas.filter((t) => t.completada).length} de {tareas.length} completadas
        </p>
      )}
    </div>
  )
}

export default App
