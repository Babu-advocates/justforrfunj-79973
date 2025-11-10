import * as React from "react"
import { cn } from "@/lib/utils"
// @ts-ignore
import Typo from "typo-js"

let dictionary: any = null;

// Load dictionary on first use
const loadDictionary = async () => {
  if (!dictionary) {
    try {
      dictionary = new Typo("en_US", false, false, {
        dictionaryPath: "https://cdn.jsdelivr.net/npm/typo-js@1.2.4/dictionaries"
      });
    } catch (error) {
      console.error("Failed to load spell check dictionary:", error);
    }
  }
  return dictionary;
};

interface FloatingInputProps extends React.ComponentProps<"input"> {
  label: string;
  enableSpellCheck?: boolean;
}

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ className, label, id, enableSpellCheck = false, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);
    const [spellError, setSpellError] = React.useState<'severe' | 'minor' | null>(null);
    const [isComposing, setIsComposing] = React.useState(false);
    const inputId = id || `floating-input-${label.replace(/\s+/g, '-').toLowerCase()}`;
    const internalRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => internalRef.current!);

    const checkSpelling = async (text: string) => {
      if (!enableSpellCheck || !text || text.trim().length === 0) {
        setSpellError(null);
        return;
      }

      const dict = await loadDictionary();
      if (!dict) {
        setSpellError(null);
        return;
      }

      const words = text.split(/\s+/);
      let hasSevereError = false;
      let hasMinorError = false;

      words.forEach(word => {
        const cleanWord = word.replace(/[^a-zA-Z]/g, '');
        if (cleanWord.length > 0 && cleanWord.length > 2) {
          const isCorrect = dict.check(cleanWord);
          if (!isCorrect) {
            const suggestions = dict.suggest(cleanWord);
            if (suggestions && suggestions.length > 0) {
              const topSuggestion = suggestions[0];
              const similarity = calculateSimilarity(cleanWord.toLowerCase(), topSuggestion.toLowerCase());
              if (similarity < 0.5) {
                hasSevereError = true;
              } else {
                hasMinorError = true;
              }
            } else {
              hasSevereError = true;
            }
          }
        }
      });

      if (hasSevereError) {
        setSpellError('severe');
      } else if (hasMinorError) {
        setSpellError('minor');
      } else {
        setSpellError(null);
      }
    };

    const calculateSimilarity = (s1: string, s2: string): number => {
      const longer = s1.length > s2.length ? s1 : s2;
      const shorter = s1.length > s2.length ? s2 : s1;
      if (longer.length === 0) return 1.0;
      return (longer.length - editDistance(longer, shorter)) / longer.length;
    };

    const editDistance = (s1: string, s2: string): number => {
      const costs = [];
      for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
          if (i === 0) {
            costs[j] = j;
          } else if (j > 0) {
            let newValue = costs[j - 1];
            if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
              newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
            }
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
        if (i > 0) costs[s2.length] = lastValue;
      }
      return costs[s2.length];
    };

    const autoCorrectSevereErrors = async (text: string): Promise<string> => {
      const dict = await loadDictionary();
      if (!dict) return text;

      const words = text.split(/\s+/);
      const correctedWords = words.map(word => {
        const cleanWord = word.replace(/[^a-zA-Z]/g, '');
        const punctuation = word.replace(/[a-zA-Z]/g, '');
        
        if (cleanWord.length > 2) {
          const isCorrect = dict.check(cleanWord);
          if (!isCorrect) {
            const suggestions = dict.suggest(cleanWord);
            if (suggestions && suggestions.length > 0) {
              const topSuggestion = suggestions[0];
              const similarity = calculateSimilarity(cleanWord.toLowerCase(), topSuggestion.toLowerCase());
              if (similarity < 0.5) {
                return topSuggestion + punctuation;
              }
            }
          }
        }
        return word;
      });
      return correctedWords.join(' ');
    };

    // Auto-correct only the last word when user types a delimiter (space, punctuation)
    const autoCorrectLastWord = async (
      text: string
    ): Promise<{ corrected: string; changed: boolean }> => {
      const dict = await loadDictionary();
      if (!dict) return { corrected: text, changed: false };

      // Preserve trailing delimiters (spaces or punctuation) the user just typed
      const trailingMatch = text.match(/([ \t\n\.,!\?;:]+)$/);
      const trailing = trailingMatch ? trailingMatch[1] : '';
      const base = trailing ? text.slice(0, -trailing.length) : text;

      const wordMatch = base.match(/([A-Za-z]+)$/);
      if (!wordMatch) return { corrected: text, changed: false };

      const lastWord = wordMatch[1];
      if (lastWord.length <= 2) return { corrected: text, changed: false };

      const startIndex = base.length - lastWord.length;

      const isCorrect = dict.check(lastWord);
      if (isCorrect) return { corrected: text, changed: false };

      const suggestions = dict.suggest(lastWord);
      if (!suggestions || suggestions.length === 0) {
        return { corrected: text, changed: false };
      }

      const topSuggestion = suggestions[0];
      const similarity = calculateSimilarity(lastWord.toLowerCase(), topSuggestion.toLowerCase());

      // Aggressive but safe: auto-correct severe errors, and also confident minors
      if (similarity < 0.5 || similarity >= 0.75) {
        const correctedBase = base.slice(0, startIndex) + topSuggestion;
        return { corrected: correctedBase + trailing, changed: true };
      }

      return { corrected: text, changed: false };
    };
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(!!e.target.value);
      
      if (enableSpellCheck && e.target.value) {
        const corrected = await autoCorrectSevereErrors(e.target.value);
        if (corrected !== e.target.value) {
          e.target.value = corrected;
          const event = new Event('input', { bubbles: true });
          e.target.dispatchEvent(event);
          props.onChange?.(e as any);
        }
      }
      
      props.onBlur?.(e);
    };

    const handleCompositionStart = () => {
      setIsComposing(true);
    };

    const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
      setIsComposing(false);
      // After IME composition ends, re-check spelling
      checkSpelling(e.currentTarget.value);
    };

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      // Do not auto-correct while composing IME text
      if (isComposing) {
        props.onChange?.(e);
        return;
      }

      // If user just typed a delimiter (space or punctuation), correct the last word
      if (enableSpellCheck && /[ \n\.,!\?;:]$/.test(value)) {
        const { corrected, changed } = await autoCorrectLastWord(value);
        if (changed) {
          e.target.value = corrected;
          const event = new Event('input', { bubbles: true });
          e.target.dispatchEvent(event);
          // React will call onChange from the dispatched event
          return;
        }
      }

      // Always update highlighting as they type
      checkSpelling(value);
      props.onChange?.(e);
    };

    React.useEffect(() => {
      setHasValue(!!props.value || !!props.defaultValue);
    }, [props.value, props.defaultValue]);

    const isFloating = isFocused || hasValue || !!props.value;

    return (
      <div className="relative">
        <input
          id={inputId}
          ref={internalRef}
          className={cn(
            "peer flex h-12 w-full rounded-md border bg-white px-3 py-3 text-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-transparent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            isFocused ? "border-primary ring-2 ring-primary/20" : "border-input",
            spellError === 'severe' && "underline decoration-red-500 decoration-wavy decoration-2",
            spellError === 'minor' && "underline decoration-yellow-500 decoration-wavy decoration-2",
            className
          )}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          spellCheck={enableSpellCheck}
          autoCorrect={enableSpellCheck ? "on" : "off"}
          autoCapitalize="sentences"
          {...props}
          placeholder=" "
        />
        <label
          htmlFor={inputId}
          className={cn(
            "absolute left-3 text-sm transition-all pointer-events-none duration-200 ease-out",
            isFloating
              ? "-top-2.5 text-xs px-1 bg-white text-primary"
              : "top-3 text-muted-foreground"
          )}
        >
          {label}
        </label>
      </div>
    )
  }
)

FloatingInput.displayName = "FloatingInput"

export { FloatingInput }
