import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  open: boolean;
  onClose: () => void;
  customWordsInput: string;
  onCustomWordsChange: (words: string) => void;
}

const CustomSettings = ({ open, onClose, customWordsInput, onCustomWordsChange }: Props) => {
  const [input, setInput] = useState(customWordsInput);
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    setInput(customWordsInput);
  }, [customWordsInput, open]);

  useEffect(() => {
    const words = input
      .split(",")
      .map(w => w.trim())
      .filter(w => w.length > 0);
    setWordCount(words.length);
  }, [input]);

  const handleSave = () => {
    const words = input
      .split(",")
      .map(w => w.trim())
      .filter(w => w.length > 0);
    
    if (words.length === 0) {
      alert("Please enter at least one word separated by commas.");
      return;
    }

    onCustomWordsChange(input);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Custom Words Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Enter words separated by commas:</label>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., Hello, world, XD, amazing, beautiful"
              className="min-h-32 font-mono text-sm"
            />
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">
              {wordCount} word{wordCount !== 1 ? "s" : ""} will be used
            </span>
            <div className="space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={wordCount === 0}>
                Save Words
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomSettings;
