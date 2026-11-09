# Práctica 2.2: Clustering con K-Means

## Descripción
Notebook de aprendizaje no supervisado con el conjunto de datos Iris de `scikit-learn`. Se aplica K-Means para agrupar flores en distintos números de clústeres y se comparan los grupos obtenidos con las especies reales.

## Contenido
- `practica_2_2_clustering_con_k_means.ipynb`: notebook con los ejercicios y sus resultados.
- `requirements.txt`: dependencias necesarias.
- `.gitignore`: archivos temporales que no se deben subir.

## Requisitos
Python 3.9 o superior (también se puede ejecutar en Google Colab).

## Cómo ejecutar
1. Abre el notebook en [Google Colab](https://colab.research.google.com/).
2. Súbelo desde **Archivo > Subir notebook** o abre el archivo `.ipynb`.
3. Ejecuta las celdas en orden con **Entorno de ejecución > Ejecutar todo**.

En local, instala las dependencias con:

```bash
pip install -r requirements.txt
```

Y abre Jupyter Notebook o JupyterLab.

## Datos y metodología
Se utiliza el conjunto Iris incluido en `sklearn.datasets`, con 150 muestras y cuatro medidas por flor. K-Means se prueba con 2, 3, 4 y 5 clústeres.

La comparación final incluye una tabla cruzada y las métricas Adjusted Rand Index (ARI) y Normalized Mutual Information (NMI). Estas métricas no requieren que los números asignados a los clústeres coincidan con los códigos de las especies, porque las etiquetas de K-Means son arbitrarias.

## Nota
K-Means es un método no supervisado: durante el entrenamiento no utiliza las especies reales. Las etiquetas reales se emplean únicamente al final para evaluar y comparar el agrupamiento.
