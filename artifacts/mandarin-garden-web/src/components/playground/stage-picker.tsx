import { Check, Loader2 } from 'lucide-react';
import type { Language } from '@/lib/garden-data';
import { STAGE_NUMBERS } from '@/lib/playground-content';
import { pick, stageAges, stageLabel, stageNames, stageNotes, tr } from '@/lib/playground-copy';
import { XP_COMPLETE, type NormalizedProgress } from '@/hooks/use-learning';

export function StagePicker({ progress, l, onSelect, pendingStage, disabled, showNotes = true }: {
  progress: NormalizedProgress; l: Language; onSelect?: (stage: number) => void; pendingStage?: number | null; disabled?: boolean; showNotes?: boolean;
}) {
  return (
    <div className="stage-picker" role="radiogroup" aria-label={tr(l, 'Learning stage', '學習階段', '学习阶段')}>
      {STAGE_NUMBERS.map((stage) => {
        const xp = progress.xpByStage[stage - 1];
        const complete = xp >= XP_COMPLETE;
        const selected = progress.selectedStage === stage;
        const pending = pendingStage === stage;
        return (
          <button
            key={stage}
            role="radio"
            aria-checked={selected}
            className={`stage-option stage-tone-${stage} ${selected ? 'selected' : ''}`}
            disabled={disabled || !onSelect || pending}
            onClick={() => onSelect?.(stage)}
            data-testid={`button-stage-${stage}`}
          >
            <span className="stage-option-top">
              <span className="stage-num">{stage}</span>
              <span className="stage-meta">{stageLabel(l, stage)} · {tr(l, `ages ${stageAges[stage - 1]}`, `${stageAges[stage - 1]} 歲`, `${stageAges[stage - 1]} 岁`)}</span>
              {pending ? <Loader2 size={14} className="spin" /> : complete ? <span className="stage-done" title={tr(l, 'Complete', '已完成', '已完成')}><Check size={12} strokeWidth={3} /></span> : null}
            </span>
            <strong>{pick(l, stageNames[stage - 1])}</strong>
            {showNotes ? <span className="stage-note">{pick(l, stageNotes[stage - 1])}</span> : null}
            <span className="stage-xp" data-testid={`text-stage-xp-${stage}`}>
              <span className="xp-bar slim"><span style={{ transform: `scaleX(${Math.min(1, xp / XP_COMPLETE)})` }} /></span>
              <em>{xp} XP{complete ? ` · ${tr(l, 'complete', '已完成', '已完成')}` : ''}</em>
            </span>
          </button>
        );
      })}
    </div>
  );
}
