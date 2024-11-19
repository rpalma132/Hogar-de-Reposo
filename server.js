const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Configurar conexión a MySQL
const db = mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'United#1329',
    database: 'hogar_reposo'
});

// Conectar a la base de datos
db.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('Conexión exitosa a la base de datos');
});

// Rutas para API

// Obtener todos los trabajadores
app.get('/api/trabajadores', (req, res) => {
    db.query('SELECT * FROM trabajadores', (err, results) => {
        if (err) {
            console.error('Error al obtener trabajadores:', err);
            res.status(500).send('Error al obtener trabajadores');
        } else {
            res.json(results);
        }
    });
});

// Agregar un trabajador
app.post('/api/trabajadores', (req, res) => {
    const { nombre, rol } = req.body;

    // Lista de roles válidos
    const rolesValidos = ['Auxiliar', 'Enfermero', 'Administrativo'];

    // Validar el rol
    if (!rolesValidos.includes(rol)) {
        return res.status(400).json({ error: 'Rol inválido' });
    }

    // Insertar el trabajador
    db.query('INSERT INTO trabajadores (nombre, rol) VALUES (?, ?)', [nombre, rol], (err, result) => {
        if (err) {
            console.error('Error al agregar trabajador:', err);
            res.status(500).send('Error al agregar trabajador');
        } else {
            res.status(201).json({ message: 'Trabajador agregado', id: result.insertId });
        }
    });
});

// Eliminar un trabajador
app.delete('/api/trabajadores/:id', (req, res) => {
    const { id } = req.params;

    // Validar el ID
    if (!id || isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
    }

    // Eliminar el trabajador
    db.query('DELETE FROM trabajadores WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error('Error al eliminar trabajador:', err);
            res.status(500).send('Error al eliminar trabajador');
        } else if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Trabajador no encontrado' });
        } else {
            res.status(200).json({ message: 'Trabajador eliminado' });
        }
    });
});

// Servir archivos estáticos desde la carpeta "public"
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal (sirve index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicia el servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

// Buscar paciente por RUT
app.get('/api/pacientes/rut/:rut', (req, res) => {
    const { rut } = req.params;

    // Validar el RUT
    if (!rut) {
        return res.status(400).json({ error: 'RUT es requerido' });
    }

    db.query('SELECT * FROM pacientes WHERE rut = ?', [rut], (err, results) => {
        if (err) {
            console.error('Error al buscar paciente por RUT:', err);
            res.status(500).send('Error al buscar paciente');
        } else if (results.length === 0) {
            res.status(404).json({ error: 'Paciente no encontrado' });
        } else {
            res.json(results[0]);
        }
    });
});

// Obtener todos los pacientes
app.get('/api/pacientes', (req, res) => {
    db.query('SELECT * FROM pacientes', (err, results) => {
        if (err) {
            console.error('Error al obtener pacientes:', err);
            res.status(500).send('Error al obtener pacientes');
        } else {
            res.json(results);
        }
    });
});

// Agregar un paciente
app.post('/api/pacientes', (req, res) => {
    const { nombre, rut, edad, contacto_emergencia, ficha_medica, medicamentos } = req.body;

    if (!nombre || !rut || !edad) {
        return res.status(400).json({ error: 'Nombre, RUT y Edad son obligatorios' });
    }

    db.query(
        'INSERT INTO pacientes (nombre, rut, edad, contacto_emergencia, ficha_medica, medicamentos) VALUES (?, ?, ?, ?, ?, ?)',
        [nombre, rut, edad, contacto_emergencia, ficha_medica, medicamentos],
        (err, result) => {
            if (err) {
                console.error('Error al agregar paciente:', err);
                res.status(500).send('Error al agregar paciente');
            } else {
                res.status(201).json({ message: 'Paciente agregado', id: result.insertId });
            }
        }
    );
});

app.post('/api/entradas', (req, res) => {
    const { rut, hora_entrada, hora_salida } = req.body;

    if (!rut || !hora_entrada) {
        return res.status(400).json({ error: 'RUT y Hora de entrada son obligatorios' });
    }

    db.query(
        'INSERT INTO entradas_salidas (rut, hora_entrada, hora_salida) VALUES (?, ?, ?)',
        [rut, hora_entrada, hora_salida || null],
        (err, result) => {
            if (err) {
                console.error('Error al registrar entrada:', err);
                res.status(500).send('Error al registrar entrada');
            } else {
                res.status(201).json({ message: 'Entrada registrada', id: result.insertId });
            }
        }
    );
});


app.post('/api/salidas', (req, res) => {
    const { rut } = req.body;

    if (!rut) {
        return res.status(400).json({ error: 'RUT es obligatorio' });
    }

    db.query('UPDATE entradas_salidas SET hora_salida = NOW() WHERE rut = ? AND hora_salida IS NULL', [rut], (err, result) => {
        if (err) {
            console.error('Error al registrar salida:', err);
            res.status(500).send('Error al registrar salida');
        } else if (result.affectedRows === 0) {
            res.status(404).json({ error: 'No hay entradas pendientes para este RUT' });
        } else {
            res.status(200).json({ message: 'Salida registrada' });
        }
    });
});

app.get('/api/entradas-salidas', (req, res) => {
    db.query('SELECT * FROM entradas_salidas', (err, results) => {
        if (err) {
            console.error('Error al obtener historial:', err);
            res.status(500).send('Error al obtener historial');
        } else {
            res.json(results);
        }
    });
});

