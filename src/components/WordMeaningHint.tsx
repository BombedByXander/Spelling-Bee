import { getWordMeaning } from "@/data/wordMeanings";

interface Props {
  word: string;
  enabled: boolean;
  className?: string;
}

const WordMeaningHint = ({ word, enabled, className }: Props) => {
  const meaning = enabled ? getWordMeaning(word) : null;

  if (!enabled || !meaning) return null;

  return (
    <p className={`text-xs text-muted-foreground max-w-2xl mx-auto text-center px-2 ${className ?? ""}`}>
      Means: {meaning}
    </p>
  );
};

export default WordMeaningHint;
