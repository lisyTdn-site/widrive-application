// Résultat typé commun aux repositories : jamais d'exception pour une erreur
// réseau/serveur attendue, l'appelant décide comment l'afficher.

export type RepoError = { message: string; code?: string };
export type RepoResult<T> = { ok: true; data: T } | { ok: false; error: RepoError };

export const ok = <T>(data: T): RepoResult<T> => ({ ok: true, data });
export const fail = (message: string, code?: string): RepoResult<never> => ({
  ok: false,
  error: { message, code },
});

/** Convertit une exception inattendue (ex. configuration absente) en résultat d'erreur. */
export function fromThrown(e: unknown): RepoResult<never> {
  return fail(e instanceof Error ? e.message : 'Erreur inconnue');
}
