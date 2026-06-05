"use client";

import {
  getRelicCurrentEffectText,
  getRelicNextEffectText,
  getRelicState,
  getRelicUnlockText,
  getRelicUpgradeCost,
  isRelicUnlocked,
  RELIC_DEFINITIONS,
  type RelicDefinition,
} from "@/src/game";
import { UiAlertBox, UiBadge, UiButton, UiProgressBar } from "@/app/components/ui";
import { useGameStore } from "@/src/store/gameStore";
import { useEffect, useMemo, useState } from "react";

type RelicCardStatus = "upgradeable" | "active" | "maxed" | "locked";

type RelicCardEntry = {
  relic: RelicDefinition;
  level: number;
  unlocked: boolean;
  maxed: boolean;
  cost: number;
  affordable: boolean;
  canUpgrade: boolean;
  status: RelicCardStatus;
  tier: "primal" | "forged" | "ancient" | "mythic";
  currentEffect: string;
  nextEffect: string;
  unlockText: string;
};

type UpgradeFeedback = {
  tone: "success" | "warning";
  relicName: string;
  previousLevel: number;
  newLevel: number;
  costSpent: number;
  previousEffect: string;
  newEffect: string;
  message: string;
};

function getRelicTier(relic: RelicDefinition): RelicCardEntry["tier"] {
  if (relic.unlock.type === "expeditionsCollected" || (relic.unlock.type === "floorReached" && relic.unlock.floor >= 15)) {
    return "mythic";
  }
  if (relic.unlock.type === "floorReached" && relic.unlock.floor >= 10) return "ancient";
  if (relic.unlock.type === "floorReached" && relic.unlock.floor >= 5) return "forged";
  return "primal";
}

function getStatusPriority(status: RelicCardStatus): number {
  if (status === "upgradeable") return 0;
  if (status === "active") return 1;
  if (status === "maxed") return 2;
  return 3;
}

function getRelicStatus(unlocked: boolean, maxed: boolean, canUpgrade: boolean): RelicCardStatus {
  if (!unlocked) return "locked";
  if (maxed) return "maxed";
  if (canUpgrade) return "upgradeable";
  return "active";
}

function buildRelicEntries(state: ReturnType<typeof useGameStore.getState>["state"]): RelicCardEntry[] {
  return RELIC_DEFINITIONS.map((relic) => {
    const relicState = getRelicState(state, relic.id);
    const unlocked = isRelicUnlocked(state, relic);
    const maxed = relicState.level >= relic.maxLevel;
    const cost = getRelicUpgradeCost(relic, relicState.level);
    const affordable = state.echoFragments >= cost;
    const canUpgrade = unlocked && !maxed && affordable;
    const status = getRelicStatus(unlocked, maxed, canUpgrade);

    return {
      relic,
      level: relicState.level,
      unlocked,
      maxed,
      cost,
      affordable,
      canUpgrade,
      status,
      tier: getRelicTier(relic),
      currentEffect: unlocked ? getRelicCurrentEffectText(state, relic) : "Selada no eco antigo.",
      nextEffect: unlocked ? getRelicNextEffectText(state, relic) : "Revelada apos cumprir o rito de despertar.",
      unlockText: getRelicUnlockText(state, relic),
    };
  }).sort(
    (a, b) =>
      getStatusPriority(a.status) - getStatusPriority(b.status) ||
      b.level - a.level ||
      a.relic.name.localeCompare(b.relic.name),
  );
}

function groupRelicEntries(entries: RelicCardEntry[]) {
  return {
    upgradeable: entries.filter((entry) => entry.status === "upgradeable"),
    active: entries.filter((entry) => entry.status === "active"),
    maxed: entries.filter((entry) => entry.status === "maxed"),
    locked: entries.filter((entry) => entry.status === "locked"),
  };
}

const STATUS_LABEL: Record<RelicCardStatus, string> = {
  upgradeable: "Ritual disponivel",
  active: "Desperta",
  maxed: "Ascendida",
  locked: "Selada",
};

const STATUS_BADGE_TONE: Record<RelicCardStatus, "success" | "warning" | "gold" | "arcane" | "default"> = {
  upgradeable: "success",
  active: "warning",
  maxed: "gold",
  locked: "arcane",
};

function RelicLevelTrack({ level, maxLevel }: { level: number; maxLevel: number }) {
  const percent = Math.min(100, Math.round((level / Math.max(1, maxLevel)) * 100));
  return (
    <div className="relic-artifact-level">
      <div className="relic-artifact-level-head">
        <span>Nivel do artefato</span>
        <strong>
          {level}/{maxLevel}
        </strong>
      </div>
      <UiProgressBar label={`Nivel ${level} de ${maxLevel}`} value={percent} />
    </div>
  );
}

function RelicArtifactCard({ entry, onUpgrade }: { entry: RelicCardEntry; onUpgrade: (entry: RelicCardEntry) => void }) {
  const { relic, level, unlocked, maxed, cost, affordable, canUpgrade, status, tier, currentEffect, nextEffect, unlockText } = entry;

  return (
    <article
      className={`relic-artifact-card tier-${tier} status-${status}${canUpgrade ? " upgradeable" : ""}${!unlocked ? " locked" : ""}${maxed ? " maxed" : ""}`}
    >
      <span aria-hidden="true" className="relic-artifact-rune" />
      {!unlocked ? <span aria-hidden="true" className="relic-artifact-veil" /> : null}

      <div className="relic-artifact-head">
        <div>
          <span className="relic-artifact-kind">{unlocked ? "Artefato ancestral" : "Eco adormecido"}</span>
          <h4>{relic.name}</h4>
        </div>
        <UiBadge tone={STATUS_BADGE_TONE[status]}>{STATUS_LABEL[status]}</UiBadge>
      </div>

      <p className="relic-artifact-desc">
        {unlocked ? relic.description : "Um fragmento antigo aguarda o rito certo para revelar seu poder permanente."}
      </p>

      {unlocked ? (
        <>
          <RelicLevelTrack level={level} maxLevel={relic.maxLevel} />
          <div className="relic-artifact-effect current">
            <strong>Efeito atual</strong>
            <span>{currentEffect}</span>
            <small>Beneficio permanente para toda a conta.</small>
          </div>
          {!maxed ? (
            <div className="relic-artifact-effect next">
              <strong>Proximo nivel</strong>
              <span>{nextEffect}</span>
            </div>
          ) : (
            <div className="relic-artifact-effect ascended">
              <strong>Legado completo</strong>
              <span>Poder maximo atingido. Este artefato permanece ativo em toda a campanha.</span>
            </div>
          )}
        </>
      ) : (
        <div className="relic-artifact-seal">
          <strong>Rito de despertar</strong>
          <span>{unlockText}</span>
        </div>
      )}

      <div className="relic-artifact-cost">
        <strong>{maxed ? "Custo" : unlocked ? "Custo do ritual" : "Estado"}</strong>
        <span>
          {maxed
            ? "Nenhum — nivel maximo"
            : unlocked
              ? `${cost} Fragmentos de Eco${affordable ? "" : " (insuficientes)"}`
              : "Bloqueada ate cumprir o requisito"}
        </span>
      </div>

      {canUpgrade ? (
        <UiButton className="relic-upgrade-button" onClick={() => onUpgrade(entry)} variant="primary">
          Aprimorar ritual ({cost} fragmentos)
        </UiButton>
      ) : unlocked && !maxed && !affordable ? (
        <p className="relic-artifact-hint">Acumule Fragmentos de Eco em chefes, conquistas e recompensas raras.</p>
      ) : null}
    </article>
  );
}

function RelicArtifactGroup({
  title,
  hint,
  entries,
  onUpgrade,
}: {
  title: string;
  hint: string;
  entries: RelicCardEntry[];
  onUpgrade: (entry: RelicCardEntry) => void;
}) {
  if (entries.length === 0) return null;

  return (
    <div className="relic-artifact-group">
      <div className="relic-artifact-group-head">
        <h4>{title}</h4>
        <small>{hint}</small>
      </div>
      <div className="relic-artifact-list">
        {entries.map((entry) => (
          <RelicArtifactCard entry={entry} key={entry.relic.id} onUpgrade={onUpgrade} />
        ))}
      </div>
    </div>
  );
}

export function RelicsPanel() {
  const state = useGameStore((store) => store.state);
  const upgradeRelicAction = useGameStore((store) => store.upgradeRelic);
  const [feedback, setFeedback] = useState<UpgradeFeedback | null>(null);

  const entries = useMemo(() => buildRelicEntries(state), [state]);
  const groups = useMemo(() => groupRelicEntries(entries), [entries]);
  const unlockedCount = entries.filter((entry) => entry.unlocked).length;
  const totalLevels = entries.reduce((total, entry) => total + entry.level, 0);
  const upgradeableCount = groups.upgradeable.length;

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 6000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  function handleUpgrade(entry: RelicCardEntry) {
    const previousLevel = entry.level;
    const previousEffect = entry.currentEffect;
    const costSpent = entry.cost;
    const result = upgradeRelicAction(entry.relic.id);

    if (result.ok) {
      const freshState = useGameStore.getState().state;
      const newLevel = getRelicState(freshState, entry.relic.id).level;
      const newEffect = getRelicCurrentEffectText(freshState, entry.relic);
      setFeedback({
        tone: "success",
        relicName: entry.relic.name,
        previousLevel,
        newLevel,
        costSpent,
        previousEffect,
        newEffect,
        message: result.message,
      });
      return;
    }

    setFeedback({
      tone: "warning",
      relicName: entry.relic.name,
      previousLevel,
      newLevel: previousLevel,
      costSpent: 0,
      previousEffect,
      newEffect: previousEffect,
      message: result.message,
    });
  }

  return (
    <section className="relics-panel relics-altar">
      <div className="section-heading">
        <span>Altar dos ecos</span>
        <h2>Reliquias ancestrais</h2>
        <p>
          Artefatos permanentes que moldam toda a sua ascensao. Cada nivel fortalece a conta, nao apenas um heroi ou uma
          batalha.
        </p>
      </div>

      <div className="relics-altar-banner">
        <div className="relics-altar-shrine">
          <span className="relics-altar-glyph" aria-hidden="true">
            ◈
          </span>
          <div>
            <span>Fragmentos de Eco</span>
            <strong>{state.echoFragments}</strong>
            <p>
              {upgradeableCount > 0
                ? `${upgradeableCount} artefato(s) prontos para o ritual de aprimoramento.`
                : "Os fragmentos alimentam o altar e despertam poder antigo em toda a campanha."}
            </p>
          </div>
        </div>
        <div className="relics-altar-stats">
          <div>
            <strong>Fragmentos</strong>
            <span>{state.echoFragments}</span>
          </div>
          <div>
            <strong>Despertas</strong>
            <span>
              {unlockedCount}/{RELIC_DEFINITIONS.length}
            </span>
          </div>
          <div>
            <strong>Niveis totais</strong>
            <span>{totalLevels}</span>
          </div>
        </div>
      </div>

      {upgradeableCount > 0 ? (
        <div className="relics-altar-priority">
          <span>Rituais disponiveis</span>
          <UiBadge tone="success">{upgradeableCount} aprimoramento(s) agora</UiBadge>
        </div>
      ) : null}

      <div className="relics-altar-sections">
        {groups.upgradeable.length > 0 ? (
          <UiAlertBox tone="success">
            <strong>{groups.upgradeable.length} reliquia(s) podem evoluir agora.</strong>
            <span>O altar responde — invista fragmentos para expandir o poder permanente da conta.</span>
          </UiAlertBox>
        ) : null}

        <RelicArtifactGroup
          entries={groups.upgradeable}
          hint="Artefatos com fragmentos suficientes para o proximo nivel."
          onUpgrade={handleUpgrade}
          title="Prontas para o ritual"
        />
        <RelicArtifactGroup
          entries={groups.active}
          hint="Ja despertas, mas aguardando fragmentos ou proxima oportunidade."
          onUpgrade={handleUpgrade}
          title="Artefatos despertos"
        />
        <RelicArtifactGroup
          entries={groups.maxed}
          hint="Poder maximo alcancado — permanecem ativos em toda a campanha."
          onUpgrade={handleUpgrade}
          title="Legado ascendido"
        />
        <RelicArtifactGroup
          entries={groups.locked}
          hint="Visiveis no altar, mas ainda envoltas em eco antigo."
          onUpgrade={handleUpgrade}
          title="Seladas no eco"
        />
      </div>

      {feedback ? (
        <UiAlertBox tone={feedback.tone === "success" ? "success" : "warning"}>
          <strong>{feedback.tone === "success" ? "Ritual concluido" : "Ritual indisponivel"}</strong>
          {feedback.tone === "success" ? (
            <>
              <span>
                {feedback.relicName}: nivel {feedback.previousLevel} → {feedback.newLevel} · {feedback.costSpent}{" "}
                Fragmentos de Eco consumidos.
              </span>
              <span className="relic-upgrade-feedback-effect">
                Efeito anterior: {feedback.previousEffect}
                <br />
                Novo efeito: {feedback.newEffect}
              </span>
            </>
          ) : (
            <span>{feedback.message}</span>
          )}
        </UiAlertBox>
      ) : null}
    </section>
  );
}
