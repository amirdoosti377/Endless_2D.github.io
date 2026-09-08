export const CONFIG = Object.freeze({ step: 1 / 60, waveSeconds: 22, maxEnemies: 170, maxParticles: 420, maxPickups: 240, playerSpeed: 235, playerRadius: 15, weaponRange: 620 });
export const ENEMIES = Object.freeze({
  scout: { radius: 13, speed: 92, hp: 2, damage: 12, score: 20, xp: 1, color: '#ff627f', sides: 3 },
  runner: { radius: 10, speed: 170, hp: 1, damage: 9, score: 30, xp: 1, color: '#ffb45e', sides: 4 },
  weaver: { radius: 12, speed: 126, hp: 3, damage: 11, score: 40, xp: 2, color: '#54c7ff', sides: 5 },
  charger: { radius: 17, speed: 72, hp: 5, damage: 17, score: 65, xp: 2, color: '#ffdc73', sides: 3 },
  gunner: { radius: 18, speed: 65, hp: 5, damage: 12, score: 75, xp: 3, color: '#ff84df', sides: 4 },
  orbiter: { radius:16, speed:112, hp:4, damage:12, score:60, xp:2, color:'#68f5bb', sides:8 },
  hunter: { radius:11, speed:155, hp:2, damage:10, score:45, xp:2, color:'#ff7957', sides:3 },
  bomber: { radius:20, speed:58, hp:7, damage:16, score:90, xp:3, color:'#d8ed78', sides:6 },
  tank: { radius: 24, speed: 51, hp: 10, damage: 23, score: 80, xp: 3, color: '#b797ff', sides: 6 },
});

