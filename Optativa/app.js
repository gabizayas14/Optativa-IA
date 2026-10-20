
/*
  CONFIGURACIÓN
  Sustituye esta dirección por la URL pública de tu modelo.
  Ejemplo: https://teachablemachine.withgoogle.com/models/ABC123/
*/

const URL_MODELO = "./modelo/";

const CLAVE_HISTORIAL = "visionAI_historial_v1";

const $ = (id) => document.getElementById(id);

let modelo = null;
let webcam = null;
let ejecutando = false;
let analizando = false;
let generacionCamara = 0;

let ultimaPrediccion = null;
let ultimoOrigen = "";
let ultimoEsCoincidencia = false;
let imagenSeleccionada = null;
let tipoVista = "ninguna";


const botonIniciar = $("iniciar");
const botonParar = $("parar");
const botonGuardar = $("guardar");
const archivo = $("archivo");
const umbral = $("umbral");

function obtenerUmbral() {
    return Number(umbral.value) / 100;
}

function obtenerHistorial() {
    try {
        const datos = JSON.parse(
            localStorage.getItem(CLAVE_HISTORIAL) || "[]"
        );
        return Array.isArray(datos) ? datos : [];
    } catch (error) {
        console.error("No se pudo leer el histórico:", error);
        return [];
    }
}

function actualizarEstado(texto, activo = false) {
    $("estado").textContent = texto;
    $("estado").classList.toggle("activo", activo);
}


async function cargarModelo() {
    if (modelo) return modelo;

    const base = URL_MODELO.endsWith("/")
        ? URL_MODELO
        : URL_MODELO + "/";

    modelo = await tmImage.load(
        base + "model.json",
        base + "metadata.json"
    );

    return modelo;
}


// INICIAR CÁMARA
botonIniciar.addEventListener("click", async () => {
    if (ejecutando || analizando) return;

    botonIniciar.disabled = true;
    actualizarEstado("Cargando modelo...");

    try {
        await cargarModelo();

        webcam = new tmImage.Webcam(320, 320, true);
        await webcam.setup();
        await webcam.play();

        // Descarta una cámara si se canceló la operación mientras cargaba.
        webcamContainerMostrar();
        $("placeholder").hidden = true;
        $("imagen-subida").hidden = true;

        $("webcam-container").replaceChildren(webcam.canvas);
        tipoVista = "camara";
        imagenSeleccionada = null;

        ejecutando = true;
        generacionCamara++;
        const generacion = generacionCamara;

        botonParar.disabled = false;
        actualizarEstado("Cámara activa", true);
        actualizarPredicciones([]);

        cicloCamara(generacion);
    } catch (error) {
        console.error(error);
        actualizarEstado("No se pudo iniciar");
        mostrarMensaje(
            error.message ||
            "No se pudo acceder a la cámara. Comprueba los permisos.",
            false
        );

        if (webcam) {
            try { webcam.stop(); } catch (_) {}
            webcam = null;
        }

        ejecutando = false;
        botonParar.disabled = true;
    } finally {
        botonIniciar.disabled = false;
    }
});

function webcamContainerMostrar() {
    $("webcam-container").hidden = false;
}

async function cicloCamara(generacion) {
    if (!ejecutando || generacion !== generacionCamara) return;
    if (analizando) return;

    try {
        webcam.update();
        const predicciones = await modelo.predict(webcam.canvas);

        if (!ejecutando || generacion !== generacionCamara) return;

        procesarPredicciones(predicciones, "Cámara");
    } catch (error) {
        console.error("Error en la predicción:", error);
    }

    if (ejecutando && generacion === generacionCamara) {
        requestAnimationFrame(() => cicloCamara(generacion));
    }
}

// DETENER CÁMARA
botonParar.addEventListener("click", detenerCamara);

function detenerCamara() {
    ejecutando = false;
    generacionCamara++;

    if (webcam) {
        try { webcam.stop(); } catch (error) {
            console.warn("No se pudo detener la cámara:", error);
        }
        webcam = null;
    }

    $("webcam-container").replaceChildren();
    $("webcam-container").hidden = true;
    botonParar.disabled = true;
    actualizarEstado("Inactivo");

    if (tipoVista === "camara") {
        $("placeholder").hidden = false;
        tipoVista = "ninguna";
        ultimaPrediccion = null;
        botonGuardar.disabled = true;
        actualizarPredicciones([]);
        $("mensaje").textContent =
            "Cámara detenida. Puedes iniciar otra vez o subir una imagen.";
        $("mensaje").className = "mensaje";
    }
}

// SUBIR Y ANALIZAR UNA IMAGEN
archivo.addEventListener("change", async (evento) => {
    const fichero = evento.target.files[0];
    if (!fichero) return;

    if (!fichero.type.startsWith("image/")) {
        mostrarMensaje("Selecciona un archivo de imagen válido.", false);
        archivo.value = "";
        return;
    }

    detenerCamara();

    analizando = true;
    botonIniciar.disabled = true;
    archivo.disabled = true;
    actualizarEstado("Analizando imagen...");

    const imagen = new Image();
    imagen.alt = "Imagen seleccionada";

    imagen.onload = async () => {
        try {
            await cargarModelo();

            imagenSeleccionada = imagen;
            tipoVista = "imagen";

            $("placeholder").hidden = true;
            $("webcam-container").replaceChildren();
            $("webcam-container").hidden = true;

            const vista = $("imagen-subida");
            vista.src = imagen.src;
            vista.hidden = false;

            const predicciones = await modelo.predict(imagen);
            procesarPredicciones(predicciones, "Imagen subida");
            actualizarEstado("Imagen analizada", true);
        } catch (error) {
            console.error(error);
            mostrarMensaje(
                error.message || "No se pudo analizar la imagen.",
                false
            );
            actualizarEstado("Error");
        } finally {
            analizando = false;
            botonIniciar.disabled = false;
            archivo.disabled = false;
            archivo.value = "";
        }
    };

    imagen.onerror = () => {
        analizando = false;
        botonIniciar.disabled = false;
        archivo.disabled = false;
        archivo.value = "";
        actualizarEstado("Error");
        mostrarMensaje("No se pudo abrir esa imagen.", false);
    };

    imagen.src = URL.createObjectURL(fichero);
});

// CLASIFICAR Y MOSTRAR LAS PREDICCIONES
function procesarPredicciones(predicciones, origen) {
    if (!predicciones || predicciones.length === 0) return;

    const ordenadas = [...predicciones].sort(
        (a, b) => b.probability - a.probability
    );

    const mejor = ordenadas[0];
    ultimaPrediccion = {
        clase: mejor.className,
        confianza: mejor.probability,
        predicciones: ordenadas.map((p) => ({
            clase: p.className,
            confianza: p.probability
        }))
    };

    ultimoOrigen = origen;
    ultimoEsCoincidencia = mejor.probability >= obtenerUmbral();

    actualizarPredicciones(ordenadas);
    actualizarMensajeResultado();
    botonGuardar.disabled = false;
}

function actualizarPredicciones(predicciones) {
    const contenedor = $("predicciones");
    contenedor.replaceChildren();

    if (!predicciones.length) {
        const texto = document.createElement("p");
        texto.className = "texto-vacio";
        texto.textContent = "Todavía no hay predicciones.";
        contenedor.appendChild(texto);
        return;
    }

    for (const prediccion of predicciones) {
        const porcentaje = prediccion.probability * 100;
        const bloque = document.createElement("div");

        const cabecera = document.createElement("div");
        cabecera.className = "prediccion-cabecera";

        const nombre = document.createElement("span");
        nombre.textContent = prediccion.className;

        const valor = document.createElement("span");
        valor.textContent = porcentaje.toFixed(1) + "%";

        cabecera.append(nombre, valor);

        const fondo = document.createElement("div");
        fondo.className = "barra-fondo";

        const barra = document.createElement("div");
        barra.className = "barra-progreso";
        barra.style.width = porcentaje + "%";

        fondo.appendChild(barra);
        bloque.append(cabecera, fondo);
        contenedor.appendChild(bloque);
    }
}

function actualizarMensajeResultado() {
    if (!ultimaPrediccion) return;

    const coincide =
        ultimaPrediccion.confianza >= obtenerUmbral();

    ultimoEsCoincidencia = coincide;

    const mensaje = coincide
        ? $("mensaje-ok").value.trim() ||
        "¡Coincidencia encontrada!"
        : $("mensaje-no").value.trim() ||
        "No se ha encontrado una coincidencia suficiente.";

    mostrarMensaje(
        `${mensaje} Clase: ${ultimaPrediccion.clase} ` +
        `(${(ultimaPrediccion.confianza * 100).toFixed(1)}%).`,
        coincide
    );
}

function mostrarMensaje(texto, exito) {
    $("mensaje").textContent = texto;
    $("mensaje").className = "mensaje" +
        (exito === null ? "" : exito ? " exito" : " error");
}

// ACTUALIZAR UMBRAL Y MENSAJES PERSONALIZADOS
umbral.addEventListener("input", () => {
    $("valor-umbral").textContent = umbral.value + "%";

    if (ultimaPrediccion) {
        actualizarMensajeResultado();
    }
});

$("mensaje-ok").addEventListener("input", actualizarMensajeResultado);
$("mensaje-no").addEventListener("input", actualizarMensajeResultado);

// GUARDAR EL RESULTADO ACTUAL EN EL HISTÓRICO
botonGuardar.addEventListener("click", () => {
    if (!ultimaPrediccion) return;

    const coincide =
        ultimaPrediccion.confianza >= obtenerUmbral();

    const registro = {
        fecha: new Date().toISOString(),
        origen: ultimoOrigen,
        clase: ultimaPrediccion.clase,
        confianza: ultimaPrediccion.confianza,
        umbral: obtenerUmbral(),
        coincide
    };

    try {
        const historial = obtenerHistorial();
        historial.unshift(registro);

        // Limitar el histórico a los últimos 200 resultados.
        localStorage.setItem(
            CLAVE_HISTORIAL,
            JSON.stringify(historial.slice(0, 200))
        );

        renderizarHistorial();
        mostrarMensaje("Resultado guardado en el histórico.", coincide);
    } catch (error) {
        console.error(error);
        mostrarMensaje(
            "No se pudo guardar. Comprueba el almacenamiento del navegador.",
            false
        );
    }
});

// MOSTRAR EL HISTÓRICO
function renderizarHistorial() {
    const historial = obtenerHistorial();
    const filas = $("filas-historico");
    filas.replaceChildren();

    $("total").textContent = historial.length;
    $("aciertos").textContent =
        historial.filter((r) => r.coincide).length;

    $("confianza-media").textContent = historial.length
        ? (historial[0].confianza * 100).toFixed(1) + "%"
        : "—";

    if (!historial.length) {
        const fila = document.createElement("tr");
        const celda = document.createElement("td");
        celda.colSpan = 5;
        celda.className = "texto-vacio";
        celda.textContent = "Aún no hay resultados guardados.";
        fila.appendChild(celda);
        filas.appendChild(fila);
        return;
    }

    for (const registro of historial) {
        const fila = document.createElement("tr");

        const fecha = new Date(registro.fecha);
        const valores = [
            Number.isNaN(fecha.getTime())
                ? "Fecha desconocida"
                : fecha.toLocaleString("es-ES"),
            registro.origen,
            registro.clase,
            (registro.confianza * 100).toFixed(1) + "%"
        ];

        for (const valor of valores) {
            const celda = document.createElement("td");
            celda.textContent = valor;
            fila.appendChild(celda);
        }

        const estado = document.createElement("td");
        estado.textContent = registro.coincide
            ? "Coincidencia"
            : "Sin coincidencia";
        estado.className = registro.coincide
            ? "estado-coincidencia"
            : "estado-sin-coincidencia";

        fila.appendChild(estado);
        filas.appendChild(fila);
    }
}

// BORRAR HISTÓRICO
$("borrar-historial").addEventListener("click", () => {
    if (!confirm("¿Quieres borrar todo el histórico guardado?")) return;

    try {
        localStorage.removeItem(CLAVE_HISTORIAL);
        renderizarHistorial();
    } catch (error) {
        console.error(error);
        mostrarMensaje("No se pudo borrar el histórico.", false);
    }
});

// INICIALIZAR LA PÁGINA
$("webcam-container").hidden = true;
renderizarHistorial();
