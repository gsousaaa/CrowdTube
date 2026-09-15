export function formatEther(value: bigint, maximumDecimals = 4) {
  const weiPerEther = 10n ** 18n;
  const wholePart = value / weiPerEther;
  const decimalPart = (value % weiPerEther)
    .toString()
    .padStart(18, "0")
    .replace(/0+$/, "")
    .slice(0, maximumDecimals);

  return decimalPart ? `${wholePart}.${decimalPart}` : wholePart.toString();
}

export function getProgressPercentage(totalRaised: bigint, goal: bigint) {
  if (goal === 0n) return 0;

  const percentageWithTwoDecimals = (totalRaised * 10_000n) / goal;
  const percentage = Number(percentageWithTwoDecimals) / 100;
  return  percentage > 100 ? 100 : percentage;
}

export function getProgressBarWidth(totalRaised: bigint, goal: bigint) {
  return Math.min(getProgressPercentage(totalRaised, goal), 100);
}
