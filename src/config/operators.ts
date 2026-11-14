export type Operator = { id: string; label: string };

const BJ: Operator[] = [
  { id: 'mtn', label: 'MTN MoMo' },
  { id: 'moov', label: 'Moov Money' },
  { id: 'celtiis', label: 'Celtiis Cash' },
];

// Pour un nouveau pays : ajouter une ligne ici
export const operatorsByCountry: Record<string, Operator[]> = { BJ };

export const operatorsFor = (country?: string): Operator[] => operatorsByCountry[country ?? 'BJ'] ?? BJ;