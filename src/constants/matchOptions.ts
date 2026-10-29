export type Lane = 'top' | 'jungle' | 'mid' | 'adc' | 'support';
export type GameMode = 'ranked_solo' | 'flex' | 'normal' | 'aram';

export const LANES: { value: Lane; label: string }[] = [
  { value: 'top', label: 'Top' },
  { value: 'jungle', label: 'Jungle' },
  { value: 'mid', label: 'Mid' },
  { value: 'adc', label: 'ADC' },
  { value: 'support', label: 'Suporte' },
];

export const MODES: { value: GameMode; label: string }[] = [
  { value: 'ranked_solo', label: 'Ranqueada Solo/Duo' },
  { value: 'flex', label: 'Flex' },
  { value: 'normal', label: 'Normal' },
  { value: 'aram', label: 'ARAM' },
];

export function laneLabel(value: string) {
  return LANES.find((l) => l.value === value)?.label ?? value;
}

export function modeLabel(value: string) {
  return MODES.find((m) => m.value === value)?.label ?? value;
}
