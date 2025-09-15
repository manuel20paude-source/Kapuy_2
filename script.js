// =========================
// VARIABLES GLOBALES
// =========================
let usuarios = [];
let prestamos = JSON.parse(localStorage.getItem('prestamos')) || [];
let configuracion = JSON.parse(localStorage.getItem('configuracion')) || {
    tasaInteres: 12.5,
    tasaMaxima: 25,
    plazoMaximo: 48,
    montoMaximo: 100000
};
let usuarioActual = null;

// =========================
// UTILIDADES DE STORAGE
// =========================
function guardarEnLocalStorage() {
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    localStorage.setItem('prestamos', JSON.stringify(prestamos));
    localStorage.setItem('configuracion', JSON.stringify(configuracion));
}

function cargarDesdeLocalStorage() {
    const data = localStorage.getItem('usuarios');
    if (data) {
        usuarios = JSON.parse(data);
    } else {
        usuarios = [];
    }
}
cargarDesdeLocalStorage();

// =========================
// INTERFAZ
// =========================
function mostrarLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registroForm').style.display = 'none';
    document.getElementById('panelUsuario').style.display = 'none';
}

function mostrarRegistro() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registroForm').style.display = 'block';
    document.getElementById('panelUsuario').style.display = 'none';
}

function mostrarPanelUsuario() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registroForm').style.display = 'none';
    document.getElementById('panelUsuario').style.display = 'block';
    
    document.getElementById('nombreUsuario').textContent = usuarioActual.usuario;
    
    if (usuarioActual.tipo === 'admin') {
        document.getElementById('menuAdmin').style.display = 'block';
        document.getElementById('menuCliente').style.display = 'none';
    } else {
        document.getElementById('menuAdmin').style.display = 'none';
        document.getElementById('menuCliente').style.display = 'block';
        mostrarMisPrestamos();
    }
}

// =========================
// GESTIÓN DE USUARIOS
// =========================
function crearUsuario(event) {
    event.preventDefault();
    
    const usuario = document.getElementById('regUsuario').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const password2 = document.getElementById('regPassword2').value;
    const tipo = document.getElementById('regTipo').value;
    
    if (!usuario || !email || !password || !password2 || !tipo) {
        alert('Todos los campos son obligatorios');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Por favor ingresa un correo válido');
        return;
    }
    
    if (password !== password2) {
        alert('Las contraseñas no coinciden');
        return;
    }
    
    if (usuarios.find(u => u.usuario === usuario)) {
        alert('El usuario ya existe');
        return;
    }

    const nuevoUsuario = {
        id: Date.now(),
        usuario,
        email,
        password,
        tipo,
        fechaRegistro: new Date().toISOString()
    };
    
    usuarios.push(nuevoUsuario);
    guardarEnLocalStorage();
    
    alert('Usuario creado exitosamente');
    mostrarLogin();
}

function iniciarSesion(event) {
    event.preventDefault();
    
    const usuario = document.getElementById('loginUsuario').value;
    const password = document.getElementById('loginPassword').value;
    
    const usuarioEncontrado = usuarios.find(u => u.usuario === usuario && u.password === password);
    
    if (usuarioEncontrado) {
        usuarioActual = usuarioEncontrado;
        mostrarPanelUsuario();
    } else {
        alert('Usuario o contraseña incorrectos');
    }
}

function cerrarSesion() {
    document.getElementById("loginUsuario").value = "";
    document.getElementById("loginPassword").value = "";
    usuarioActual = null;
    mostrarLogin();
}

// =========================
// GESTIÓN DE PRÉSTAMOS
// =========================
function solicitarPrestamo(event) {
    event.preventDefault();
    
    const monto = parseFloat(document.getElementById('montoPrestamo').value);
    const plazo = parseInt(document.getElementById('plazoPrestamo').value);
    
    if (monto > configuracion.montoMaximo) {
        alert(`El monto máximo permitido es $${configuracion.montoMaximo}`);
        return;
    }
    
    if (plazo > configuracion.plazoMaximo) {
        alert(`El plazo máximo permitido es ${configuracion.plazoMaximo} meses`);
        return;
    }
    
    const interes = configuracion.tasaInteres / 100;
    const cuotaMensual = calcularCuota(monto, interes, plazo);
    const totalPagar = cuotaMensual * plazo;
    const interesTotal = totalPagar - monto;
    
    const prestamo = {
        id: Date.now(),
        usuarioId: usuarioActual.id,
        usuario: usuarioActual.usuario,
        monto,
        plazo,
        tasaInteres: configuracion.tasaInteres,
        cuotaMensual,
        totalPagar,
        interesTotal,
        estado: 'pendiente',
        fechaSolicitud: new Date().toISOString()
    };
    
    prestamos.push(prestamo);
    guardarEnLocalStorage();
    
    mostrarResultadoPrestamo(prestamo);
    mostrarMisPrestamos();
}

function calcularCuota(monto, tasaInteres, plazo) {
    const tasaMensual = tasaInteres / 12;
    return (monto * tasaMensual) / (1 - Math.pow(1 + tasaMensual, -plazo));
}

function mostrarResultadoPrestamo(prestamo) {
    const resultado = document.getElementById('resultadoPrestamo');
    resultado.innerHTML = `
        <h3>Detalles del Préstamo</h3>
        <p><strong>Monto solicitado:</strong> $${prestamo.monto.toFixed(2)}</p>
        <p><strong>Plazo:</strong> ${prestamo.plazo} meses</p>
        <p><strong>Tasa de interés:</strong> ${prestamo.tasaInteres}% anual</p>
        <p><strong>Cuota mensual:</strong> $${prestamo.cuotaMensual.toFixed(2)}</p>
        <p><strong>Total a pagar:</strong> $${prestamo.totalPagar.toFixed(2)}</p>
        <p><strong>Interés total:</strong> $${prestamo.interesTotal.toFixed(2)}</p>
        <p><strong>Estado:</strong> ${prestamo.estado}</p>
    `;
}

function mostrarMisPrestamos() {
    const misPrestamos = prestamos.filter(p => p.usuarioId === usuarioActual.id);
    const contenedor = document.getElementById('misPrestamos');
    
    let html = '<h3>Mis Préstamos</h3>';
    
    if (misPrestamos.length === 0) {
        html += '<p>No tienes préstamos registrados</p>';
    } else {
        misPrestamos.forEach(prestamo => {
            html += `
                <div class="prestamo-card estado-${prestamo.estado}">
                    <p><strong>Monto:</strong> $${prestamo.monto.toFixed(2)}</p>
                    <p><strong>Plazo:</strong> ${prestamo.plazo} meses</p>
                    <p><strong>Cuota:</strong> $${prestamo.cuotaMensual.toFixed(2)}</p>
                    <p><strong>Estado:</strong> ${prestamo.estado}</p>
                </div>
            `;
        });
    }
    
    contenedor.innerHTML = html;
}

// =========================
// ADMINISTRADOR
// =========================
function mostrarConfiguracion() {
    const configDiv = document.getElementById('configuracion');
    configDiv.style.display = configDiv.style.display === 'none' ? 'block' : 'none';
    
    document.getElementById('tasaInteres').value = configuracion.tasaInteres;
    document.getElementById('tasaMaxima').value = configuracion.tasaMaxima;
    document.getElementById('plazoMaximo').value = configuracion.plazoMaximo;
    document.getElementById('montoMaximo').value = configuracion.montoMaximo;
}

function actualizarConfiguracion(event) {
    event.preventDefault();
    
    configuracion.tasaInteres = parseFloat(document.getElementById('tasaInteres').value);
    configuracion.tasaMaxima = parseFloat(document.getElementById('tasaMaxima').value);
    configuracion.plazoMaximo = parseInt(document.getElementById('plazoMaximo').value);
    configuracion.montoMaximo = parseFloat(document.getElementById('montoMaximo').value);
    
    guardarEnLocalStorage();
    alert('Configuración actualizada exitosamente');
}

function mostrarTodosPrestamos() {
    const todosDiv = document.getElementById('todosPrestamos');
    todosDiv.style.display = todosDiv.style.display === 'none' ? 'block' : 'none';
    
    let html = '<h3>Todos los Préstamos</h3>';
    
    if (prestamos.length === 0) {
        html += '<p>No hay préstamos registrados</p>';
    } else {
        html += `
            <table>
                <tr>
                    <th>ID</th>
                    <th>Usuario</th>
                    <th>Monto</th>
                    <th>Plazo</th>
                    <th>Cuota</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
        `;
        
        prestamos.forEach(prestamo => {
            html += `
                <tr>
                    <td>${prestamo.id}</td>
                    <td>${prestamo.usuario}</td>
                    <td>$${prestamo.monto.toFixed(2)}</td>
                    <td>${prestamo.plazo} meses</td>
                    <td>$${prestamo.cuotaMensual.toFixed(2)}</td>
                    <td>${prestamo.estado}</td>
                    <td>
                        <button 
                            onclick="cambiarEstadoPrestamo(${prestamo.id}, 'aprobado')" 
                            ${prestamo.estado !== "pendiente" ? "disabled" : ""}>
                            ${prestamo.estado === "aprobado" ? "✔ Aprobado" : "Aprobar"}
                        </button>
                        <button 
                            onclick="cambiarEstadoPrestamo(${prestamo.id}, 'rechazado')" 
                            ${prestamo.estado !== "pendiente" ? "disabled" : ""}>
                            ${prestamo.estado === "rechazado" ? "✖ Rechazado" : "Rechazar"}
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += '</table>';
    }
    
    todosDiv.innerHTML = html;
}

function cambiarEstadoPrestamo(id, estado) {
    const prestamo = prestamos.find(p => p.id === id);
    if (prestamo) {
        prestamo.estado = estado.toLowerCase(); // 🔑 siempre minúsculas
        guardarEnLocalStorage();
        mostrarTodosPrestamos();
        alert(`Préstamo ${estado} exitosamente`);
    }
}

// =========================
// USUARIOS ADMIN
// =========================
function mostrarUsuarios() {
    const usuariosDiv = document.getElementById('gestionUsuarios');
    usuariosDiv.style.display = usuariosDiv.style.display === 'none' ? 'block' : 'none';
    
    let html = '<h3>Gestionar Usuarios</h3>';
    
    if (usuarios.length === 0) {
        html += '<p>No hay usuarios registrados</p>';
    } else {
        html += `
            <table>
                <tr>
                    <th>ID</th>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Tipo</th>
                    <th>Fecha Registro</th>
                </tr>
        `;
        
        usuarios.forEach(usuario => {
            html += `
                <tr>
                    <td>${usuario.id}</td>
                    <td>${usuario.usuario}</td>
                    <td>${usuario.email}</td>
                    <td>${usuario.tipo}</td>
                    <td>${new Date(usuario.fechaRegistro).toLocaleDateString()}</td>
                </tr>
            `;
        });
        
        html += '</table>';
    }
    
    usuariosDiv.innerHTML = html;
}