/**
 * Simule un délai réseau pour les appels API mock
 * @param ms Durée en millisecondes (par défaut aléatoire entre 200 et 800ms)
 */
export function simulerDelai(ms?: number): Promise<void> {
  const duree = ms ?? Math.floor(Math.random() * 600) + 200
  return new Promise((resolve) => setTimeout(resolve, duree))
}

/**
 * Simule un délai avec possibilité d'erreur aléatoire
 * @param tauxErreur Probabilité d'erreur (0 à 1)
 */
export async function simulerDelaiAvecErreur(tauxErreur: number = 0): Promise<void> {
  await simulerDelai()
  if (Math.random() < tauxErreur) {
    throw new Error('Erreur réseau simulée')
  }
}
