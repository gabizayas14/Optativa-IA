# Práctica 2.1 — Análisis de sentimientos

## Descripción
Notebook de Python para realizar análisis de sentimientos en español con el modelo
[`pysentimiento/robertuito-sentiment-analysis`](https://huggingface.co/pysentimiento/robertuito-sentiment-analysis)
a través de la librería Hugging Face `transformers`.

La práctica incluye ejemplos de clasificación de comentarios positivos, negativos,
neutros, irónicos y con emojis, además de un analizador que acepta o rechaza comentarios
según el sentimiento detectado y una lista negra configurable.

## Contenido
- `practica_2_1_sentimientos.ipynb`: notebook principal con la práctica resuelta.
- `requirements.txt`: dependencias de Python.

## Cómo ejecutarlo
### En Google Colab
1. Descarga o clona este repositorio.
2. Abre `practica_2_1_sentimientos.ipynb` en Google Colab.
3. Ejecuta las celdas en orden, desde el principio.
4. La primera ejecución puede tardar porque se descargan el modelo y sus dependencias.

### En local
Se recomienda Python 3.10 o superior. Instala las dependencias:

```bash
pip install -r requirements.txt
```

Después abre Jupyter Notebook o JupyterLab y ejecuta el archivo `.ipynb`.

## Configurar la lista negra
En la última celda del notebook encontrarás la variable `lista_negra`.
La lista incluida contiene valores de ejemplo (`insulto1`, `insulto2`, `spam`):
sustitúyelos por las palabras que indique el enunciado o el profesor.

## Criterios del analizador
- Los comentarios POS y NEU se aceptan si no contienen palabras de la lista negra.
- Los comentarios NEG se rechazan si contienen una palabra de la lista negra
  o si su puntuación (`score`) es superior a 0.5.
- Los comentarios vacíos y las etiquetas no contempladas se rechazan por seguridad.

## Tecnologías
- Python
- Hugging Face Transformers
- RoBERTuito / pysentimiento
