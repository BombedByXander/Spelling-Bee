interface StreakDisplayProps {
  streak: number;
}

const StreakDisplay = ({ streak }: StreakDisplayProps) => {
  if (streak !== 67) {
    return <>{streak}</>;
  }

  return (
    <span className="streak-sixty-seven-wrap" aria-label="67">
      {String(streak)
        .split("")
        .map((digit, index) => (
          <span
            key={`${digit}-${index}`}
            className={`streak-sixty-seven-digit ${index % 2 === 0 ? "streak-sixty-seven-up" : "streak-sixty-seven-down"}`}
            style={{ ["--streak-delay" as string]: `${index * 180}ms` }}
          >
            {digit}
          </span>
        ))}
    </span>
  );
};

export default StreakDisplay;
