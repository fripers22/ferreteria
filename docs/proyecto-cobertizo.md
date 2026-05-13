# Plantilla: estimacion de materiales para cobertizo

## Objetivo
Generar una lista estimada de materiales y herramientas para un cobertizo y construir un carrito basado en productos del inventario.

## Datos requeridos
- Largo (m)
- Ancho (m)
- Alto (m)
- Tipo de techo (lamina o policarbonato)
- Tipo de estructura (madera o metal)
- Separacion entre postes (m) - recomendado 3

## Estimaciones base (ejemplo)
- Area techo = largo * ancho
- Postes:
  - postesPorLadoLargo = ceil(largo / separacion)
  - postesPorLadoAncho = ceil(ancho / separacion)
  - totalPostes = 2 * postesPorLadoLargo + 2 * postesPorLadoAncho
- Vigas/travesanos = ceil(largo / 3) * 2
- Cubierta (laminas/paneles) = ceil(areaTecho / coberturaPorPieza)
- Tornillos = cobertura * 10

## Coberturas sugeridas (ajustables)
- lamina: 0.9 m2 por pieza
- policarbonato: 0.85 m2 por pieza

## Lista base de materiales (keywords)
- postes (madera o metal)
- vigas o travesanos
- laminas o paneles
- tornillos
- pintura o sellador (opcional)

## Herramientas sugeridas
- taladro
- brocas
- sierra o esmeril
- cinta metrica
- nivel

## Como generar el carrito
1) Calcular cantidades con las formulas.
2) Buscar cada material en el inventario por nombre o SKU.
3) Si hay varias opciones, pedir confirmacion.
4) Construir un carrito estimado (sin afectar stock).
