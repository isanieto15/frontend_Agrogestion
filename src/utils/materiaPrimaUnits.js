const UNIT_GROUPS = [
  ['kilogramo', ['kg', 'kilogramo', 'kilogramos']],
  ['tonelada', ['t', 'tonelada', 'toneladas']],
  ['libra', ['lb', 'lbs', 'libra', 'libras']],
  ['unidad', ['und', 'unidad', 'unidades']],
  ['bulto', ['bulto', 'bultos']],
  ['gramo', ['g', 'gr', 'gramo', 'gramos']],
  ['litro', ['l', 'lt', 'lts', 'litro', 'litros']],
  ['mililitro', ['ml', 'mililitro', 'mililitros']],
]

const UNIT_ALIASES = new Map(
  UNIT_GROUPS.flatMap(([canonical, aliases]) => aliases.map((alias) => [alias, canonical]))
)

export function normalizeMateriaPrimaUnit(value) {
  const normalized = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()

  return UNIT_ALIASES.get(normalized) || normalized
}

export function getCompatibleMateriaPrimaUnits(outputUnit, units = []) {
  const normalizedOutputUnit = normalizeMateriaPrimaUnit(outputUnit)
  if (!normalizedOutputUnit || !Array.isArray(units)) return []

  return units.filter((unit) => normalizeMateriaPrimaUnit(unit.nombre) === normalizedOutputUnit)
}
