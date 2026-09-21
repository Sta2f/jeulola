export type EducationScore = {
  points: number;
  correct: number;
  wrong: number;
  gifts: number;
  celebration: boolean;
};
export const emptyEducationScore = (): EducationScore => ({
  points: 0,
  correct: 0,
  wrong: 0,
  gifts: 0,
  celebration: false,
});
export function validEducationScore(value: unknown): value is EducationScore {
  if (!value || typeof value !== 'object') return false;
  const v = value as EducationScore;
  return (
    [v.points, v.correct, v.wrong, v.gifts].every(
      (n) => Number.isSafeInteger(n) && n >= 0,
    ) &&
    v.points < 50 &&
    typeof v.celebration === 'boolean'
  );
}
export function answerScore(
  state: EducationScore,
  correct: boolean,
): EducationScore {
  // The celebration pauses scoring until Lola continues, including rapid taps.
  if (state.celebration) return state;
  const points = Math.max(0, state.points + (correct ? 1 : -1));
  const gift = points === 50;
  return {
    points: gift ? 0 : points,
    correct: state.correct + Number(correct),
    wrong: state.wrong + Number(!correct),
    gifts: state.gifts + Number(gift),
    celebration: gift,
  };
}
