type FlagModule = { default: string }

const flagModules = import.meta.glob<FlagModule>('../assets/worldcup_2026_flags/*.png', {
  eager: true,
})

const flagByNormalizedName = new Map<string, string>()

function normalizeCountryName(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

for (const [path, module] of Object.entries(flagModules)) {
  const fileName = path.split('/').pop()?.replace(/\.png$/i, '') ?? ''
  flagByNormalizedName.set(normalizeCountryName(fileName), module.default)
}

const aliases: Record<string, string> = {
  usa: 'United States',
  us: 'United States',
  unitedstatesofamerica: 'United States',
  southkorea: 'South Korea',
  korearepublic: 'South Korea',
  republicofkorea: 'South Korea',
  drcongo: 'DR Congo',
  democraticrepublicofthecongo: 'DR Congo',
  ivorycoast: 'Ivory Coast',
  cotedivoire: 'Ivory Coast',
  caboverde: 'Cape Verde',
  netherlands: 'Netherlands',
  'england': 'England',
}

export function getTeamFlag(team: string): string {
  const normalizedTeam = normalizeCountryName(team)
  const resolvedName = aliases[normalizedTeam] ?? team
  const normalizedResolvedName = normalizeCountryName(resolvedName)

  return flagByNormalizedName.get(normalizedResolvedName) ?? ''
}

export function getTeamFlagLabel(team: string): string {
  return team
}
