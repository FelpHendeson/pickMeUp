"use client";

import {
  ACHIEVEMENT_DEFINITIONS,
  DAILY_MISSION_DEFINITIONS,
  formatMissionReward,
  getAchievementProgress,
  getClaimableMissionCount,
  getDailyMissionProgress,
  isAchievementComplete,
  isDailyMissionComplete,
  type MissionReward,
} from "@/src/game";
import { UiAlertBox, UiBadge, UiButton, UiProgressBar } from "@/app/components/ui";
import { useGameStore } from "@/src/store/gameStore";
import { useEffect, useMemo, useState } from "react";

type ObjectiveKind = "daily" | "achievement";
type ObjectiveStatus = "claimable" | "near-complete" | "in-progress" | "claimed";

type ObjectiveEntry = {
  id: string;
  kind: ObjectiveKind;
  title: string;
  description: string;
  progress: number;
  target: number;
  reward: MissionReward;
  status: ObjectiveStatus;
  canClaim: boolean;
};

const STATUS_LABEL: Record<ObjectiveStatus, string> = {
  claimable: "Pronta para coletar",
  "near-complete": "Quase concluida",
  "in-progress": "Em andamento",
  claimed: "Registrada",
};

const STATUS_BADGE_TONE: Record<ObjectiveStatus, "success" | "warning" | "default" | "gold"> = {
  claimable: "success",
  "near-complete": "warning",
  "in-progress": "default",
  claimed: "gold",
};

function getObjectiveStatus(progress: number, target: number, complete: boolean, claimed: boolean): ObjectiveStatus {
  if (claimed) return "claimed";
  if (complete) return "claimable";
  const ratio = progress / Math.max(1, target);
  if (ratio >= 0.75) return "near-complete";
  return "in-progress";
}

function getStatusPriority(status: ObjectiveStatus): number {
  if (status === "claimable") return 0;
  if (status === "near-complete") return 1;
  if (status === "in-progress") return 2;
  return 3;
}

function buildDailyEntries(state: ReturnType<typeof useGameStore.getState>["state"]): ObjectiveEntry[] {
  return DAILY_MISSION_DEFINITIONS.map((mission) => {
    const progress = getDailyMissionProgress(state, mission);
    const complete = isDailyMissionComplete(state, mission);
    const claimed = Boolean(state.dailyMissions.claimed[mission.id]);
    const status = getObjectiveStatus(progress, mission.target, complete, claimed);
    return {
      id: mission.id,
      kind: "daily" as const,
      title: mission.title,
      description: mission.description,
      progress,
      target: mission.target,
      reward: mission.reward,
      status,
      canClaim: complete && !claimed,
    };
  }).sort((a, b) => getStatusPriority(a.status) - getStatusPriority(b.status) || a.title.localeCompare(b.title));
}

function buildAchievementEntries(state: ReturnType<typeof useGameStore.getState>["state"]): ObjectiveEntry[] {
  return ACHIEVEMENT_DEFINITIONS.map((achievement) => {
    const progress = getAchievementProgress(state, achievement);
    const complete = isAchievementComplete(state, achievement);
    const claimed = Boolean(state.achievements[achievement.id]?.claimed);
    const status = getObjectiveStatus(progress, achievement.target, complete, claimed);
    return {
      id: achievement.id,
      kind: "achievement" as const,
      title: achievement.title,
      description: achievement.description,
      progress,
      target: achievement.target,
      reward: achievement.reward,
      status,
      canClaim: complete && !claimed,
    };
  }).sort((a, b) => getStatusPriority(a.status) - getStatusPriority(b.status) || a.title.localeCompare(b.title));
}

function groupEntries(entries: ObjectiveEntry[]) {
  return {
    claimable: entries.filter((entry) => entry.status === "claimable"),
    active: entries.filter((entry) => entry.status === "near-complete" || entry.status === "in-progress"),
    completed: entries.filter((entry) => entry.status === "claimed"),
  };
}

function MissionProgressBlock({ entry }: { entry: ObjectiveEntry }) {
  const percent = Math.min(100, Math.round((entry.progress / Math.max(1, entry.target)) * 100));
  return (
    <div className={`mission-objective-progress tone-${entry.status}`}>
      <div className="mission-objective-progress-head">
        <span>Progresso</span>
        <strong>
          {entry.progress}/{entry.target}
        </strong>
      </div>
      <UiProgressBar label={`${entry.title}: ${percent}%`} value={percent} />
      <small>{percent}% concluido</small>
    </div>
  );
}

function ObjectiveCard({
  entry,
  onClaim,
}: {
  entry: ObjectiveEntry;
  onClaim: (id: string, kind: ObjectiveKind) => void;
}) {
  const rewardText = formatMissionReward(entry.reward);

  return (
    <article
      className={`mission-objective-card kind-${entry.kind} status-${entry.status}${entry.canClaim ? " claimable" : ""}`}
      key={entry.id}
    >
      {entry.kind === "achievement" ? <span aria-hidden="true" className="mission-guild-seal" /> : null}

      <div className="mission-objective-head">
        <div>
          <span className="mission-objective-rune">{entry.kind === "daily" ? "Ordem do dia" : "Marco da campanha"}</span>
          <h4>{entry.title}</h4>
        </div>
        <UiBadge tone={STATUS_BADGE_TONE[entry.status]}>{STATUS_LABEL[entry.status]}</UiBadge>
      </div>

      <p className="mission-objective-desc">{entry.description}</p>

      {entry.status !== "claimed" ? <MissionProgressBlock entry={entry} /> : null}

      <div className="mission-objective-reward">
        <strong>Recompensa</strong>
        <span>{rewardText}</span>
      </div>

      {entry.canClaim ? (
        <UiButton className="mission-claim-button" onClick={() => onClaim(entry.id, entry.kind)} variant="primary">
          Coletar recompensa
        </UiButton>
      ) : entry.status === "claimed" ? (
        <p className="mission-objective-footnote">Marco registrado no diario de campanha.</p>
      ) : null}
    </article>
  );
}

function ObjectiveGroup({
  title,
  hint,
  entries,
  onClaim,
}: {
  title: string;
  hint: string;
  entries: ObjectiveEntry[];
  onClaim: (id: string, kind: ObjectiveKind) => void;
}) {
  if (entries.length === 0) return null;

  return (
    <div className="mission-objective-group">
      <div className="mission-objective-group-head">
        <h4>{title}</h4>
        <small>{hint}</small>
      </div>
      <div className="mission-objective-list">
        {entries.map((entry) => (
          <ObjectiveCard entry={entry} key={entry.id} onClaim={onClaim} />
        ))}
      </div>
    </div>
  );
}

function MissionDiarySection({
  eyebrow,
  title,
  description,
  entries,
  onClaim,
}: {
  eyebrow: string;
  title: string;
  description: string;
  entries: ObjectiveEntry[];
  onClaim: (id: string, kind: ObjectiveKind) => void;
}) {
  const groups = groupEntries(entries);
  const claimableCount = groups.claimable.length;

  return (
    <section className={`mission-diary-scroll${claimableCount > 0 ? " has-claimable" : ""}`}>
      <header className="mission-diary-scroll-head">
        <span>{eyebrow}</span>
        <h3>{title}</h3>
        <p>{description}</p>
      </header>

      {claimableCount > 0 ? (
        <UiAlertBox tone="success">
          <strong>{claimableCount} recompensa(s) aguardando coleta.</strong>
          <span>Resgate agora para nao perder o impulso da campanha.</span>
        </UiAlertBox>
      ) : null}

      <ObjectiveGroup
        entries={groups.claimable}
        hint="Objetivos concluidos aguardando resgate."
        onClaim={onClaim}
        title="Prontas para coletar"
      />
      <ObjectiveGroup
        entries={groups.active}
        hint="Continue avancando para desbloquear estas recompensas."
        onClaim={onClaim}
        title="Em andamento"
      />
      <ObjectiveGroup
        entries={groups.completed}
        hint="Registros ja resgatados nesta secao."
        onClaim={onClaim}
        title="Concluidas"
      />
    </section>
  );
}

export function MissionsPanel() {
  const state = useGameStore((store) => store.state);
  const claimDailyMission = useGameStore((store) => store.claimDailyMission);
  const claimAchievement = useGameStore((store) => store.claimAchievement);
  const [feedback, setFeedback] = useState<{ message: string; tone: "success" | "warning" } | null>(null);

  const dailyEntries = useMemo(() => buildDailyEntries(state), [state]);
  const achievementEntries = useMemo(() => buildAchievementEntries(state), [state]);
  const claimableCount = getClaimableMissionCount(state);
  const dailyClaimable = dailyEntries.filter((entry) => entry.canClaim).length;
  const achievementClaimable = achievementEntries.filter((entry) => entry.canClaim).length;
  const dailyCompleted = dailyEntries.filter((entry) => entry.status === "claimed").length;
  const achievementsCompleted = achievementEntries.filter((entry) => entry.status === "claimed").length;

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 5000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  function handleClaim(id: string, kind: ObjectiveKind) {
    const result = kind === "daily" ? claimDailyMission(id) : claimAchievement(id);
    setFeedback({ message: result.message, tone: result.ok ? "success" : "warning" });
  }

  return (
    <section className="missions-panel missions-diary">
      <div className="section-heading">
        <span>Diario de campanha</span>
        <h2>Missões e conquistas</h2>
        <p>Acompanhe ordens do dia, marcos permanentes e recompensas pendentes como um registro de comando.</p>
      </div>

      <div className="missions-diary-banner">
        <div>
          <span>Situacao atual</span>
          <strong>
            {claimableCount > 0
              ? `${claimableCount} recompensa(s) pronta(s) para coletar`
              : "Nenhuma recompensa pendente no momento"}
          </strong>
          <p>
            {claimableCount > 0
              ? "Priorize a coleta antes de seguir para a torre ou expedicoes."
              : "Avance nos objetivos em andamento para desbloquear novos selos e recursos."}
          </p>
        </div>
        <div className="missions-diary-stats">
          <div>
            <strong>Coletaveis</strong>
            <span>{claimableCount}</span>
          </div>
          <div>
            <strong>Diarias</strong>
            <span>
              {dailyCompleted}/{DAILY_MISSION_DEFINITIONS.length}
            </span>
          </div>
          <div>
            <strong>Conquistas</strong>
            <span>
              {achievementsCompleted}/{ACHIEVEMENT_DEFINITIONS.length}
            </span>
          </div>
        </div>
      </div>

      {dailyClaimable + achievementClaimable > 0 ? (
        <div className="missions-diary-priority">
          <span>Prioridade imediata</span>
          <div className="missions-diary-priority-chips">
            {dailyClaimable > 0 ? <UiBadge tone="success">{dailyClaimable} diaria(s)</UiBadge> : null}
            {achievementClaimable > 0 ? <UiBadge tone="gold">{achievementClaimable} conquista(s)</UiBadge> : null}
          </div>
        </div>
      ) : null}

      <div className="mission-diary-sections">
        <MissionDiarySection
          description="Ordens renovadas a cada dia. Conclua, colete e mantenha o ritmo da campanha."
          entries={dailyEntries}
          eyebrow="Hoje"
          onClaim={handleClaim}
          title="Missões diarias"
        />

        <MissionDiarySection
          description="Marcos permanentes da sua ascensao. Cada conquista fica registrada como legado da torre."
          entries={achievementEntries}
          eyebrow="Legado"
          onClaim={handleClaim}
          title="Conquistas"
        />
      </div>

      {feedback ? (
        <UiAlertBox tone={feedback.tone === "success" ? "success" : "warning"}>
          <strong>{feedback.tone === "success" ? "Recompensa recebida" : "Acao indisponivel"}</strong>
          <span>{feedback.message}</span>
        </UiAlertBox>
      ) : null}
    </section>
  );
}
