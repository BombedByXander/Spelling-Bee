const ROT13_REGEX = /[a-zA-Z]/g;
const VOWEL_SHIFT_REGEX = /[aeiou]/gi;
const LETTER_REGEX = /[a-z]/i;
const ALPHABET_REGEX = /[a-zA-Z]/;
const VOWEL_REGEX = /[aeiou]/i;
// Disallow numeric characters in the typing input; only letters and space allowed by default.
const BASE_ALLOWED_INPUT_CHAR_REGEX = /[a-zA-Z ]/;
const CONSONANTS = "bcdfghjklmnpqrstvwxyz";
const LEET_MAP: Record<string, string> = {
  a: "4",
  e: "3",
  i: "1",
  o: "0",
  s: "5",
  t: "7",
  b: "8",
  g: "6",
};

export const CASE_SENSITIVE_FUNBOX_MODIFIERS = new Set([
  "ALL_CAPS",
  "capitals",
  "instant_messaging",
  "sPoNgEcAsE",
  "rAnDoMcAsE",
]);

export const TRANSFORMING_FUNBOX_MODIFIERS = new Set([
  "ALL_CAPS",
  "backwards",
  "camel_wave",
  "capitals",
  "caesar_plus",
  "caesar_minus",
  "consonant_caps",
  "consonant_echo",
  "consonant_shift",
  "ddoouubblleedd",
  "dot_chain",
  "double_edges",
  "inside_out",
  "instant_messaging",
  "kebab_chain",
  "kebab_upper",
  "leet",
  "half_swap",
  "mirror_chunks",
  "no_vowels",
  "palindrome_tail",
  "pirate",
  "pig_latin",
  "pipe_chain",
  "plus_chain",
  "rAnDoMcAsE",
  "remove_first",
  "remove_first_vowel",
  "remove_last",
  "remove_last_consonant",
  "repeat_word",
  "rotor_11",
  "rotor_19",
  "rotor_3",
  "rotor_7",
  "rot13",
  "shuffle_pair",
  "slash_chain",
  "snake_lower",
  "snake_chain",
  "spaced_out",
  "sPoNgEcAsE",
  "stutter",
  "strip_every_second",
  "tilde_chain",
  "triplet_case",
  "vowel_echo",
  "vowel_caps",
  "vowel_shift_back",
  "vowel_shift",
  "word_flip_flop",
  "wrap_braces",
  "wrap_brackets",
  "wrap_parens",
]);

export const SYMBOL_ENABLING_FUNBOX_MODIFIERS: Record<string, string[]> = {
  dot_chain: ["."],
  kebab_chain: ["-"],
  snake_chain: ["_"],
  stutter: ["-"],
  wrap_parens: ["(", ")"],
  wrap_brackets: ["[", "]"],
  wrap_braces: ["{", "}"],
  slash_chain: ["/"],
  plus_chain: ["+"],
  pipe_chain: ["|"],
  tilde_chain: ["~"],
  pirate: ["'"],
};

function getAllowedInputSymbols(activeModifiers: string[]): Set<string> {
  const symbols = new Set<string>();
  activeModifiers.forEach((modifierId) => {
    const enabledSymbols = SYMBOL_ENABLING_FUNBOX_MODIFIERS[modifierId] ?? [];
    enabledSymbols.forEach((symbol) => symbols.add(symbol));
  });
  return symbols;
}

export function sanitizeInputForActiveModifiers(value: string, activeModifiers: string[]): string {
  const allowedSymbols = getAllowedInputSymbols(activeModifiers);

  return value
    .split("")
    .filter((char) => BASE_ALLOWED_INPUT_CHAR_REGEX.test(char) || allowedSymbols.has(char))
    .join("");
}

function applyRot13(value: string): string {
  return value.replace(ROT13_REGEX, (char) => {
    const code = char.charCodeAt(0);
    const base = code >= 97 ? 97 : 65;
    return String.fromCharCode(((code - base + 13) % 26) + base);
  });
}

function applySpongeCase(value: string): string {
  return value
    .split("")
    .map((char, index) => {
      if (!/[a-z]/i.test(char)) return char;
      return index % 2 === 0 ? char.toLowerCase() : char.toUpperCase();
    })
    .join("");
}

function applyDeterministicRandomCase(value: string): string {
  const seed = value
    .split("")
    .reduce((total, char, index) => total + char.charCodeAt(0) * (index + 1), 0);

  return value
    .split("")
    .map((char, index) => {
      if (!/[a-z]/i.test(char)) return char;
      const parity = (seed + index * 17) % 2;
      return parity === 0 ? char.toLowerCase() : char.toUpperCase();
    })
    .join("");
}

function applyLeet(value: string): string {
  return value
    .split("")
    .map((char) => LEET_MAP[char.toLowerCase()] ?? char)
    .join("");
}

function applyVowelShift(value: string): string {
  return value.replace(VOWEL_SHIFT_REGEX, (char) => {
    const lower = char.toLowerCase();
    const next = lower === "a" ? "e" : lower === "e" ? "i" : lower === "i" ? "o" : lower === "o" ? "u" : "a";
    return char === lower ? next : next.toUpperCase();
  });
}

function applyVowelShiftBack(value: string): string {
  return value.replace(VOWEL_SHIFT_REGEX, (char) => {
    const lower = char.toLowerCase();
    const previous = lower === "a" ? "u" : lower === "e" ? "a" : lower === "i" ? "e" : lower === "o" ? "i" : "o";
    return char === lower ? previous : previous.toUpperCase();
  });
}

function applyCaesarShift(value: string, amount: number): string {
  return value.replace(ROT13_REGEX, (char) => {
    const code = char.charCodeAt(0);
    const base = code >= 97 ? 97 : 65;
    return String.fromCharCode(((code - base + amount + 26) % 26) + base);
  });
}

function applyJoinCharacters(value: string, separator: string): string {
  return value.length <= 1 ? value : value.split("").join(separator);
}

function applyWrap(value: string, left: string, right: string): string {
  return `${left}${value}${right}`;
}

function applyInsideOut(value: string): string {
  if (value.length <= 2) return value;
  return `${value[0]}${value.slice(1, -1).split("").reverse().join("")}${value[value.length - 1]}`;
}

function applyMirrorChunks(value: string): string {
  const chars = value.split("");
  const output: string[] = [];

  for (let index = 0; index < chars.length; index += 3) {
    output.push(chars.slice(index, index + 3).reverse().join(""));
  }

  return output.join("");
}

function applyShufflePair(value: string): string {
  const chars = value.split("");
  for (let index = 0; index < chars.length - 1; index += 2) {
    const current = chars[index];
    chars[index] = chars[index + 1] ?? current;
    chars[index + 1] = current;
  }
  return chars.join("");
}

function applyDoubleEdges(value: string): string {
  if (value.length === 0) return value;
  if (value.length === 1) return value.repeat(2);
  return `${value[0]}${value}${value[value.length - 1]}`;
}

function applyStripEverySecond(value: string): string {
  const chars = value.split("");
  let letterCounter = 0;

  return chars
    .filter((char) => {
      if (!LETTER_REGEX.test(char)) return true;
      const keep = letterCounter % 2 === 0;
      letterCounter += 1;
      return keep;
    })
    .join("");
}

function applyStutter(value: string): string {
  const firstLetter = value.split("").find((char) => LETTER_REGEX.test(char));
  if (!firstLetter) return value;
  return `${firstLetter}-${value}`;
}

function applyVowelEcho(value: string): string {
  return value
    .split("")
    .map((char) => (VOWEL_REGEX.test(char) ? `${char}${char}` : char))
    .join("");
}

function applyConsonantEcho(value: string): string {
  return value
    .split("")
    .map((char) => {
      if (!ALPHABET_REGEX.test(char) || VOWEL_REGEX.test(char)) return char;
      return `${char}${char}`;
    })
    .join("");
}

function applyConsonantShift(value: string): string {
  return value
    .split("")
    .map((char) => {
      const lower = char.toLowerCase();
      const idx = CONSONANTS.indexOf(lower);
      if (idx === -1) return char;
      const shifted = CONSONANTS[(idx + 1) % CONSONANTS.length] ?? lower;
      return char === lower ? shifted : shifted.toUpperCase();
    })
    .join("");
}

function applyHalfSwap(value: string): string {
  if (value.length <= 1) return value;
  const split = Math.floor(value.length / 2);
  return `${value.slice(split)}${value.slice(0, split)}`;
}

function applyVowelCaps(value: string): string {
  return value
    .split("")
    .map((char) => {
      if (!ALPHABET_REGEX.test(char)) return char;
      return VOWEL_REGEX.test(char) ? char.toUpperCase() : char.toLowerCase();
    })
    .join("");
}

function applyConsonantCaps(value: string): string {
  return value
    .split("")
    .map((char) => {
      if (!ALPHABET_REGEX.test(char)) return char;
      return VOWEL_REGEX.test(char) ? char.toLowerCase() : char.toUpperCase();
    })
    .join("");
}

function applyTripletCase(value: string): string {
  let letterCounter = 0;
  return value
    .split("")
    .map((char) => {
      if (!ALPHABET_REGEX.test(char)) return char;
      const group = Math.floor(letterCounter / 3) % 2;
      letterCounter += 1;
      return group === 0 ? char.toLowerCase() : char.toUpperCase();
    })
    .join("");
}

function removeFirstVowel(value: string): string {
  const chars = value.split("");
  const index = chars.findIndex((char) => VOWEL_REGEX.test(char));
  if (index === -1) return value;
  chars.splice(index, 1);
  return chars.join("");
}

function removeLastConsonant(value: string): string {
  for (let index = value.length - 1; index >= 0; index -= 1) {
    const char = value[index] ?? "";
    if (ALPHABET_REGEX.test(char) && !VOWEL_REGEX.test(char)) {
      return `${value.slice(0, index)}${value.slice(index + 1)}`;
    }
  }
  return value;
}

function applyWordFlipFlop(value: string): string {
  return value
    .split(" ")
    .map((word, index) => (index % 2 === 1 ? word.split("").reverse().join("") : word))
    .join(" ");
}

function removeFirstLetter(value: string): string {
  const index = value.split("").findIndex((char) => LETTER_REGEX.test(char));
  if (index === -1) return value;
  return `${value.slice(0, index)}${value.slice(index + 1)}`;
}

function removeLastLetter(value: string): string {
  for (let index = value.length - 1; index >= 0; index -= 1) {
    if (LETTER_REGEX.test(value[index] ?? "")) {
      return `${value.slice(0, index)}${value.slice(index + 1)}`;
    }
  }
  return value;
}

function applyPalindromeTail(value: string): string {
  if (value.length <= 1) return value;
  return `${value}${value.slice(0, -1).split("").reverse().join("")}`;
}

function applyCamelWave(value: string): string {
  let letterIndex = 0;
  return value
    .split("")
    .map((char) => {
      if (!LETTER_REGEX.test(char)) return char;
      const shouldUpper = letterIndex % 2 === 0;
      letterIndex += 1;
      return shouldUpper ? char.toUpperCase() : char.toLowerCase();
    })
    .join("");
}

function applySnakeLower(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "_");
}

function applyKebabUpper(value: string): string {
  return value.toUpperCase().replace(/\s+/g, "-");
}

function applyPirate(value: string): string {
  const wasLeadingUpper = LETTER_REGEX.test(value[0] ?? "") && value[0] === (value[0] ?? "").toUpperCase();
  let transformed = value
    .toLowerCase()
    .replace(/\byou\b/g, "ye")
    .replace(/\bmy\b/g, "me")
    .replace(/\bfor\b/g, "fer")
    .replace(/ing\b/g, "in'");

  if (wasLeadingUpper) {
    transformed = transformed.charAt(0).toUpperCase() + transformed.slice(1);
  }

  return transformed;
}

function applyPigLatin(value: string): string {
  const match = value.match(/^([a-zA-Z]+)([^a-zA-Z]*)$/);
  if (!match) return `${value}ay`;

  const [, letters, suffix] = match;
  const lower = letters.toLowerCase();
  const vowelIndex = lower.search(/[aeiou]/);

  let transformed = "";
  if (vowelIndex === 0) transformed = `${lower}yay`;
  else if (vowelIndex > 0) transformed = `${lower.slice(vowelIndex)}${lower.slice(0, vowelIndex)}ay`;
  else transformed = `${lower}ay`;

  if (letters[0] === letters[0].toUpperCase()) {
    transformed = transformed.charAt(0).toUpperCase() + transformed.slice(1);
  }

  return `${transformed}${suffix}`;
}

export function applySpellingFunboxModifiers(word: string, activeModifiers: string[]): string {
  let transformed = word;

  if (activeModifiers.includes("backwards")) {
    transformed = transformed.split("").reverse().join("");
  }

  if (activeModifiers.includes("mirror_chunks")) {
    transformed = applyMirrorChunks(transformed);
  }

  if (activeModifiers.includes("inside_out")) {
    transformed = applyInsideOut(transformed);
  }

  if (activeModifiers.includes("shuffle_pair")) {
    transformed = applyShufflePair(transformed);
  }

  if (activeModifiers.includes("ddoouubblleedd")) {
    transformed = transformed
      .split("")
      .map((char) => `${char}${char}`)
      .join("");
  }

  if (activeModifiers.includes("double_edges")) {
    transformed = applyDoubleEdges(transformed);
  }

  if (activeModifiers.includes("stutter")) {
    transformed = applyStutter(transformed);
  }

  if (activeModifiers.includes("rot13")) {
    transformed = applyRot13(transformed);
  }

  if (activeModifiers.includes("rotor_11")) {
    transformed = applyCaesarShift(transformed, 11);
  }

  if (activeModifiers.includes("rotor_19")) {
    transformed = applyCaesarShift(transformed, 19);
  }

  if (activeModifiers.includes("rotor_3")) {
    transformed = applyCaesarShift(transformed, 3);
  }

  if (activeModifiers.includes("rotor_7")) {
    transformed = applyCaesarShift(transformed, 7);
  }

  if (activeModifiers.includes("caesar_plus")) {
    transformed = applyCaesarShift(transformed, 1);
  }

  if (activeModifiers.includes("caesar_minus")) {
    transformed = applyCaesarShift(transformed, -1);
  }

  if (activeModifiers.includes("leet")) {
    transformed = applyLeet(transformed);
  }

  if (activeModifiers.includes("vowel_echo")) {
    transformed = applyVowelEcho(transformed);
  }

  if (activeModifiers.includes("consonant_echo")) {
    transformed = applyConsonantEcho(transformed);
  }

  if (activeModifiers.includes("consonant_shift")) {
    transformed = applyConsonantShift(transformed);
  }

  if (activeModifiers.includes("half_swap")) {
    transformed = applyHalfSwap(transformed);
  }

  if (activeModifiers.includes("vowel_shift")) {
    transformed = applyVowelShift(transformed);
  }

  if (activeModifiers.includes("vowel_shift_back")) {
    transformed = applyVowelShiftBack(transformed);
  }

  if (activeModifiers.includes("no_vowels")) {
    transformed = transformed.replace(/[aeiou]/gi, "");
  }

  if (activeModifiers.includes("pig_latin")) {
    transformed = applyPigLatin(transformed);
  }

  if (activeModifiers.includes("strip_every_second")) {
    transformed = applyStripEverySecond(transformed);
  }

  if (activeModifiers.includes("remove_first")) {
    transformed = removeFirstLetter(transformed);
  }

  if (activeModifiers.includes("remove_first_vowel")) {
    transformed = removeFirstVowel(transformed);
  }

  if (activeModifiers.includes("remove_last")) {
    transformed = removeLastLetter(transformed);
  }

  if (activeModifiers.includes("remove_last_consonant")) {
    transformed = removeLastConsonant(transformed);
  }

  if (activeModifiers.includes("palindrome_tail")) {
    transformed = applyPalindromeTail(transformed);
  }

  if (activeModifiers.includes("repeat_word")) {
    transformed = `${transformed} ${transformed}`;
  }

  if (activeModifiers.includes("word_flip_flop")) {
    transformed = applyWordFlipFlop(transformed);
  }

  if (activeModifiers.includes("spaced_out")) {
    transformed = applyJoinCharacters(transformed, " ");
  }

  if (activeModifiers.includes("kebab_chain")) {
    transformed = applyJoinCharacters(transformed, "-");
  }

  if (activeModifiers.includes("snake_chain")) {
    transformed = applyJoinCharacters(transformed, "_");
  }

  if (activeModifiers.includes("dot_chain")) {
    transformed = applyJoinCharacters(transformed, ".");
  }

  if (activeModifiers.includes("slash_chain")) {
    transformed = applyJoinCharacters(transformed, "/");
  }

  if (activeModifiers.includes("plus_chain")) {
    transformed = applyJoinCharacters(transformed, "+");
  }

  if (activeModifiers.includes("pipe_chain")) {
    transformed = applyJoinCharacters(transformed, "|");
  }

  if (activeModifiers.includes("tilde_chain")) {
    transformed = applyJoinCharacters(transformed, "~");
  }

  if (activeModifiers.includes("wrap_parens")) {
    transformed = applyWrap(transformed, "(", ")");
  }

  if (activeModifiers.includes("wrap_brackets")) {
    transformed = applyWrap(transformed, "[", "]");
  }

  if (activeModifiers.includes("wrap_braces")) {
    transformed = applyWrap(transformed, "{", "}");
  }

  if (activeModifiers.includes("ALL_CAPS")) {
    transformed = transformed.toUpperCase();
  } else if (activeModifiers.includes("capitals")) {
    transformed = transformed.charAt(0).toUpperCase() + transformed.slice(1).toLowerCase();
  }

  if (activeModifiers.includes("instant_messaging")) {
    transformed = transformed.toLowerCase();
  }

  if (activeModifiers.includes("sPoNgEcAsE")) {
    transformed = applySpongeCase(transformed);
  }

  if (activeModifiers.includes("rAnDoMcAsE")) {
    transformed = applyDeterministicRandomCase(transformed);
  }

  if (activeModifiers.includes("vowel_caps")) {
    transformed = applyVowelCaps(transformed);
  }

  if (activeModifiers.includes("consonant_caps")) {
    transformed = applyConsonantCaps(transformed);
  }

  if (activeModifiers.includes("triplet_case")) {
    transformed = applyTripletCase(transformed);
  }

  if (activeModifiers.includes("camel_wave")) {
    transformed = applyCamelWave(transformed);
  }

  if (activeModifiers.includes("snake_lower")) {
    transformed = applySnakeLower(transformed);
  }

  if (activeModifiers.includes("kebab_upper")) {
    transformed = applyKebabUpper(transformed);
  }

  if (activeModifiers.includes("pirate")) {
    transformed = applyPirate(transformed);
  }

  return transformed;
}
