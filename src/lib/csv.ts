// Export CSV : téléchargement direct sur le web, partage natif sur mobile.

import { Platform } from 'react-native';

export function toCsv(rows: (string | number)[][]): string {
  const escape = (value: string | number) => {
    const text = String(value ?? '');
    return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  // Point-virgule : séparateur reconnu par Excel en locale française.
  return rows.map((row) => row.map(escape).join(';')).join('\r\n');
}

export async function downloadCsv(filename: string, rows: (string | number)[][]): Promise<void> {
  // BOM UTF-8 pour un affichage correct des accents dans Excel.
  const csv = `\uFEFF${toCsv(rows)}`;

  if (Platform.OS === 'web') {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return;
  }

  const FileSystem = await import('expo-file-system/legacy');
  const Sharing = await import('expo-sharing');
  const uri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, csv);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: filename });
  }
}
