export const CONFIG = Object.freeze({ step: 1 / 60, waveSeconds: 24, maxEnemies: 170, maxParticles: 420, maxPickups: 240, playerSpeed: 235, playerRadius: 15, weaponRange: 620 });
export const ENEMIES = Object.freeze({
  scout: { radius: 13, speed: 83, hp: 2, damage: 12, score: 20, xp: 1, color: '#ff627f', sides: 3 },
  runner: { radius: 10, speed: 153, hp: 1, damage: 9, score: 30, xp: 1, color: '#ffb45e', sides: 4 },
  tank: { radius: 24, speed: 51, hp: 10, damage: 23, score: 80, xp: 3, color: '#b797ff', sides: 6 },
});
export const UPGRADES = ['FIRE RATE INCREASED', 'PULSE DAMAGE INCREASED', 'MULTISHOT UNLOCKED'];
