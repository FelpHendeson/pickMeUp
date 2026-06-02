import test from "node:test";
import assert from "node:assert/strict";

const DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/ascensao_dos_ecos?schema=public";
process.env.DATABASE_URL ||= DEFAULT_DATABASE_URL;

test("cloud save persiste snapshot normalizado, perfil e herois no PostgreSQL", async () => {
  const [{ addHeroToFormation, createInitialState, generateHero }, { createPlayerSaveSnapshot, getLatestPlayerSave }, { getPrismaClient }] =
    await Promise.all([
      import("../src/game/index.ts"),
      import("../src/lib/playerSave.ts"),
      import("../src/lib/prisma.ts"),
    ]);

  const prisma = getPrismaClient();
  const playerId = `db_regression_${Date.now()}`;
  const hero = generateHero({
    id: `${playerId}_hero`,
    name: "Elo da Nuvem",
    classKey: "mage",
    rarity: 4,
    random: () => 0.5,
  });
  const state = createInitialState();
  state.accountLevel = 3;
  state.accountXp = 42;
  state.towerFloor = 8;
  state.resources.gold = 1234;
  state.resources.crystals = 88;
  state.echoFragments = 9;
  state.heroContracts = 2;
  state.heroes.push(hero);
  addHeroToFormation(state, hero.id);

  try {
    const snapshot = await createPlayerSaveSnapshot(playerId, state);
    const loaded = await getLatestPlayerSave(playerId);
    const profile = await prisma.playerProfile.findUnique({ where: { playerId } });
    const heroRow = await prisma.hero.findUnique({ where: { id: hero.id } });
    const snapshotCount = await prisma.saveSnapshot.count({ where: { playerId } });

    assert.equal(snapshot.playerId, playerId);
    assert.equal(snapshot.version, state.saveVersion);
    assert.equal(loaded?.towerFloor, 8);
    assert.equal(loaded?.resources.gold, 1234);
    assert.equal(loaded?.heroes[0]?.id, hero.id);
    assert.equal(profile?.towerFloor, 8);
    assert.equal(profile?.gold, 1234);
    assert.equal(profile?.heroContracts, 2);
    assert.equal(heroRow?.name, hero.name);
    assert.equal(heroRow?.classKey, hero.classKey);
    assert.equal(heroRow?.rarity, hero.rarity);
    assert.equal(snapshotCount, 1);
  } finally {
    await prisma.player.delete({ where: { id: playerId } }).catch(() => undefined);
    await prisma.$disconnect();
  }
});
