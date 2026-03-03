export interface WordEntry {
  primary: string;
  alternates: string[];
}

export interface ResolvedWordEntry {
  primary: string;
  alternates: string[];
  requiresExactCase: boolean;
}

const ALLOW_HOMOPHONES_KEY = "spelldown-allow-homophones";

import { isFunboxModifierActive } from "@/lib/funbox";
import { applySpellingFunboxModifiers, CASE_SENSITIVE_FUNBOX_MODIFIERS, TRANSFORMING_FUNBOX_MODIFIERS } from "@/lib/funboxWord";


export const beginnerWordList: WordEntry[] = [
  { primary: "Air", alternates: [] },
  { primary: "Baby", alternates: [] },
  { primary: "Bad", alternates: [] },
  { primary: "Bag", alternates: [] },
  { primary: "Ball", alternates: [] },
  { primary: "Bar", alternates: [] },
  { primary: "Bat", alternates: [] },
  { primary: "Bee", alternates: ["Be", "B"] },
  { primary: "Best", alternates: [] },
  { primary: "Big", alternates: [] },
  { primary: "Bird", alternates: [] },
  { primary: "Blue", alternates: ["Blew"] },
  { primary: "Book", alternates: [] },
  { primary: "Bug", alternates: [] },
  { primary: "Bus", alternates: [] },
  { primary: "Cake", alternates: [] },
  { primary: "Car", alternates: [] },
  { primary: "Cat", alternates: [] },
  { primary: "Cool", alternates: [] },
  { primary: "Cry", alternates: [] },
  { primary: "Cup", alternates: [] },
  { primary: "Dad", alternates: [] },
  { primary: "Dog", alternates: [] },
  { primary: "Duck", alternates: [] },
  { primary: "Eat", alternates: [] },
  { primary: "Elf", alternates: [] },
  { primary: "End", alternates: [] },
  { primary: "Eye", alternates: ["Aye"] },
  { primary: "Face", alternates: [] },
  { primary: "Fire", alternates: [] },
  { primary: "Fish", alternates: ["Phish"] },
  { primary: "Foot", alternates: [] },
  { primary: "Gold", alternates: [] },
  { primary: "Hand", alternates: [] },
  { primary: "Kiss", alternates: [] },
  { primary: "Milk", alternates: [] },
  { primary: "Mix", alternates: [] },
  { primary: "Mom", alternates: [] },
  { primary: "Moon", alternates: [] },
  { primary: "Mug", alternates: [] },
  { primary: "Newb", alternates: ["Noob"] },
  { primary: "Pie", alternates: ["Pi"] },
  { primary: "Pink", alternates: [] },
  { primary: "Rain", alternates: ["Reign"] },
  { primary: "Rat", alternates: [] },
  { primary: "Red", alternates: [] },
  { primary: "Ruby", alternates: [] },
  { primary: "Run", alternates: [] },
  { primary: "Sit", alternates: [] },
  { primary: "Size", alternates: [] },
  { primary: "Snow", alternates: [] },
  { primary: "Soda", alternates: [] },
  { primary: "Star", alternates: [] },
  { primary: "Suck", alternates: [] },
  { primary: "Sun", alternates: [] },
  { primary: "Tag", alternates: [] },
  { primary: "Tank", alternates: [] },
  { primary: "Tap", alternates: [] },
  { primary: "Town", alternates: [] },
  { primary: "Tree", alternates: [] },
  { primary: "Water", alternates: [] },
  { primary: "Wind", alternates: [] },
  { primary: "Word", alternates: [] },
  { primary: "Zoo", alternates: [] },
];

export const noviceWordList: WordEntry[] = [
  { primary: "Absorb", alternates: [] },
  { primary: "Angel", alternates: [] },
  { primary: "Ash", alternates: [] },
  { primary: "Bingo", alternates: [] },
  { primary: "Black", alternates: [] },
  { primary: "Boss", alternates: [] },
  { primary: "Brain", alternates: [] },
  { primary: "Burger", alternates: [] },
  { primary: "Burial", alternates: [] },
  { primary: "Cabin", alternates: [] },
  { primary: "Circle", alternates: [] },
  { primary: "Clever", alternates: [] },
  { primary: "Cliff", alternates: [] },
  { primary: "Clutch", alternates: [] },
  { primary: "Comply", alternates: [] },
  { primary: "Convey", alternates: [] },
  { primary: "Crowd", alternates: [] },
  { primary: "Dairy", alternates: [] },
  { primary: "Defy", alternates: [] },
  { primary: "Demon", alternates: ["Daemon"] },
  { primary: "Echo", alternates: [] },
  { primary: "Emoji", alternates: [] },
  { primary: "Erupt", alternates: [] },
  { primary: "Exert", alternates: [] },
  { primary: "Exile", alternates: [] },
  { primary: "Film", alternates: [] },
  { primary: "Filter", alternates: [] },
  { primary: "Flower", alternates: ["Flour"] },
  { primary: "Foggy", alternates: [] },
  { primary: "Forbid", alternates: [] },
  { primary: "Gender", alternates: [] },
  { primary: "Ghost", alternates: [] },
  { primary: "Giant", alternates: [] },
  { primary: "Greedy", alternates: [] },
  { primary: "Green", alternates: [] },
  { primary: "Grub", alternates: [] },
  { primary: "Hello", alternates: [] },
  { primary: "Hotel", alternates: [] },
  { primary: "House", alternates: [] },
  { primary: "Human", alternates: [] },
  { primary: "Hungry", alternates: [] },
  { primary: "Intent", alternates: [] },
  { primary: "Iron", alternates: [] },
  { primary: "Irony", alternates: [] },
  { primary: "Land", alternates: [] },
  { primary: "Length", alternates: [] },
  { primary: "Margin", alternates: [] },
  { primary: "Melt", alternates: [] },
  { primary: "Meow", alternates: [] },
  { primary: "Monk", alternates: [] },
  { primary: "Noble", alternates: ["Nobel"] },
  { primary: "Orange", alternates: [] },
  { primary: "Pasta", alternates: [] },
  { primary: "Pear", alternates: ["Pair"] },
  { primary: "Power", alternates: [] },
  { primary: "Prank", alternates: [] },
  { primary: "Pray", alternates: ["Prey"] },
  { primary: "Proof", alternates: [] },
  { primary: "Quack", alternates: [] },
  { primary: "Quill", alternates: [] },
  { primary: "Rally", alternates: [] },
  { primary: "Random", alternates: [] },
  { primary: "Reply", alternates: [] },
  { primary: "Robust", alternates: [] },
  { primary: "Rot", alternates: ["Wrought"] },
  { primary: "Shake", alternates: [] },
  { primary: "Shark", alternates: [] },
  { primary: "Sigh", alternates: ["Psi"] },
  { primary: "Sock", alternates: [] },
  { primary: "State", alternates: [] },
  { primary: "Stew", alternates: [] },
  { primary: "Still", alternates: [] },
  { primary: "Stumble", alternates: [] },
  { primary: "Trauma", alternates: [] },
  { primary: "Twist", alternates: [] },
  { primary: "Update", alternates: [] },
  { primary: "Vein", alternates: ["Vain"] },
  { primary: "Walk", alternates: [] },
  { primary: "Way", alternates: ["Weigh"] },
  { primary: "White", alternates: [] },
  { primary: "Workout", alternates: [] },
  { primary: "Wrist", alternates: [] },
];

export const moderateWordList: WordEntry[] = [
  { primary: "Abolish", alternates: [] },
  { primary: "Absence", alternates: [] },
  { primary: "Abstract", alternates: [] },
  { primary: "Agaric", alternates: [] },
  { primary: "Agnostic", alternates: [] },
  { primary: "Akin", alternates: [] },
  { primary: "Albeit", alternates: [] },
  { primary: "Alliance", alternates: [] },
  { primary: "Alphabet", alternates: [] },
  { primary: "Anatomical", alternates: [] },
  { primary: "Answer", alternates: [] },
  { primary: "Appetite", alternates: [] },
  { primary: "Armor", alternates: ["Armour"] },
  { primary: "Atone", alternates: [] },
  { primary: "Automatic", alternates: [] },
  { primary: "Await", alternates: [] },
  { primary: "Bamboo", alternates: [] },
  { primary: "Bayonet", alternates: [] },
  { primary: "Betray", alternates: [] },
  { primary: "Biography", alternates: [] },
  { primary: "Bizarre", alternates: [] },
  { primary: "Breakthrough", alternates: [] },
  { primary: "Broccoli", alternates: [] },
  { primary: "Catalog", alternates: ["Catalogue"] },
  { primary: "Center", alternates: ["Centre"] },
  { primary: "Chicken", alternates: [] },
  { primary: "Chronic", alternates: [] },
  { primary: "Church", alternates: [] },
  { primary: "Congratulate", alternates: [] },
  { primary: "Cooking", alternates: [] },
  { primary: "Curious", alternates: [] },
  { primary: "Damage", alternates: [] },
  { primary: "Debris", alternates: [] },
  { primary: "Diesel", alternates: [] },
  { primary: "Dilate", alternates: [] },
  { primary: "Dolphin", alternates: [] },
  { primary: "Enact", alternates: [] },
  { primary: "Excellent", alternates: [] },
  { primary: "Familiar", alternates: [] },
  { primary: "Firefighter", alternates: [] },
  { primary: "Flavor", alternates: ["Flavour"] },
  { primary: "Formidable", alternates: [] },
  { primary: "Frolic", alternates: [] },
  { primary: "Furious", alternates: [] },
  { primary: "Gallant", alternates: [] },
  { primary: "Gradual", alternates: [] },
  { primary: "Guideline", alternates: [] },
  { primary: "Harbor", alternates: ["Harbour"] },
  { primary: "Heresy", alternates: [] },
  { primary: "Immobilize", alternates: ["Immobilise"] },
  { primary: "Integrity", alternates: [] },
  { primary: "Ionize", alternates: ["Ionise"] },
  { primary: "Lactose", alternates: [] },
  { primary: "Lather", alternates: [] },
  { primary: "Leafy", alternates: [] },
  { primary: "Liable", alternates: [] },
  { primary: "Lightning", alternates: [] },
  { primary: "Magnificent", alternates: [] },
  { primary: "Meditate", alternates: [] },
  { primary: "Normal", alternates: [] },
  { primary: "Oasis", alternates: [] },
  { primary: "Obesity", alternates: [] },
  { primary: "Offender", alternates: [] },
  { primary: "Overdue", alternates: ["Overdo"] },
  { primary: "Paradox", alternates: [] },
  { primary: "Password", alternates: [] },
  { primary: "Pigeon", alternates: ["Pidgin"] },
  { primary: "Plethora", alternates: [] },
  { primary: "Powder", alternates: [] },
  { primary: "Probably", alternates: [] },
  { primary: "Pulsar", alternates: [] },
  { primary: "Pumpkin", alternates: [] },
  { primary: "Pursuit", alternates: [] },
  { primary: "Recipient", alternates: [] },
  { primary: "Refrain", alternates: [] },
  { primary: "Refugee", alternates: [] },
  { primary: "Remarkable", alternates: [] },
  { primary: "Rye", alternates: ["Wry"] },
  { primary: "Scrutiny", alternates: [] },
  { primary: "Secret", alternates: [] },
  { primary: "Seldom", alternates: [] },
  { primary: "Semicircle", alternates: [] },
  { primary: "Sigma", alternates: [] },
  { primary: "Sleigh", alternates: ["Slay"] },
  { primary: "Sniffle", alternates: [] },
  { primary: "Special", alternates: [] },
  { primary: "Spooky", alternates: [] },
  { primary: "Strategic", alternates: [] },
  { primary: "Subsidy", alternates: [] },
  { primary: "Swamp", alternates: [] },
  { primary: "Syntax", alternates: [] },
  { primary: "Tangerine", alternates: [] },
  { primary: "Telepathy", alternates: [] },
  { primary: "Thesis", alternates: [] },
  { primary: "Tremendous", alternates: [] },
  { primary: "Twenty", alternates: [] },
  { primary: "Uncomfortable", alternates: [] },
  { primary: "Vague", alternates: [] },
  { primary: "Villain", alternates: [] },
  { primary: "Voluntary", alternates: [] },
  { primary: "Walnut", alternates: [] },
  { primary: "Warrior", alternates: [] },
  { primary: "Window", alternates: [] },
  { primary: "Zombie", alternates: [] },
];

export const advancedWordList: WordEntry[] = [
  { primary: "Abditive", alternates: [] },
  { primary: "Abdomen", alternates: [] },
  { primary: "Abhorrent", alternates: [] },
  { primary: "Abscond", alternates: [] },
  { primary: "Accomplishment", alternates: [] },
  { primary: "Accommodate", alternates: [] },
  { primary: "Accumulation", alternates: [] },
  { primary: "Adolescent", alternates: [] },
  { primary: "Adversity", alternates: [] },
  { primary: "Aegis", alternates: [] },
  { primary: "Aerodynamic", alternates: [] },
  { primary: "Agriculture", alternates: [] },
  { primary: "Apostrophe", alternates: [] },
  { primary: "Articulate", alternates: [] },
  { primary: "Aspiration", alternates: [] },
  { primary: "Assumption", alternates: [] },
  { primary: "Asunder", alternates: [] },
  { primary: "Asthma", alternates: [] },
  { primary: "Atmospheric", alternates: [] },
  { primary: "Beneficiary", alternates: [] },
  { primary: "Benevolence", alternates: [] },
  { primary: "Blizzard", alternates: [] },
  { primary: "Bronchitis", alternates: [] },
  { primary: "Brusque", alternates: [] },
  { primary: "Calibration", alternates: [] },
  { primary: "Candlelight", alternates: [] },
  { primary: "Caustic", alternates: [] },
  { primary: "Champagne", alternates: [] },
  { primary: "Charisma", alternates: [] },
  { primary: "Chlorophyll", alternates: [] },
  { primary: "Christmas", alternates: [] },
  { primary: "Cognitive", alternates: [] },
  { primary: "Colonel", alternates: ["Kernel"] },
  { primary: "Combustible", alternates: [] },
  { primary: "Commodity", alternates: [] },
  { primary: "Concentration", alternates: [] },
  { primary: "Consumption", alternates: [] },
  { primary: "Contour", alternates: [] },
  { primary: "Controversial", alternates: [] },
  { primary: "Cuisine", alternates: [] },
  { primary: "Dauntless", alternates: [] },
  { primary: "Deployment", alternates: [] },
  { primary: "Derogatory", alternates: [] },
  { primary: "Detrimental", alternates: [] },
  { primary: "Diplomatic", alternates: [] },
  { primary: "Disappointment", alternates: [] },
  { primary: "Disconsolate", alternates: [] },
  { primary: "Division", alternates: [] },
  { primary: "Doctrine", alternates: [] },
  { primary: "Elaborate", alternates: [] },
  { primary: "Embarrassment", alternates: [] },
  { primary: "Embassy", alternates: [] },
  { primary: "Enchantment", alternates: [] },
  { primary: "Encore", alternates: [] },
  { primary: "Endeavor", alternates: ["Endeavour"] },
  { primary: "Epiphany", alternates: [] },
  { primary: "Epsilon", alternates: [] },
  { primary: "Erratic", alternates: [] },
  { primary: "Euphoria", alternates: [] },
  { primary: "Exaggerate", alternates: [] },
  { primary: "Excalibur", alternates: [] },
  { primary: "Exorcism", alternates: [] },
  { primary: "Expenditure", alternates: [] },
  { primary: "Exponential", alternates: [] },
  { primary: "Extravagant", alternates: [] },
  { primary: "Fantasy", alternates: [] },
  { primary: "Favorable", alternates: ["Favourable"] },
  { primary: "Featherweight", alternates: [] },
  { primary: "Fictitious", alternates: [] },
  { primary: "Fjord", alternates: [] },
  { primary: "Flamboyant", alternates: [] },
  { primary: "Fluorescent", alternates: [] },
  { primary: "Forthcoming", alternates: [] },
  { primary: "Frostbite", alternates: [] },
  { primary: "Fruition", alternates: [] },
  { primary: "Gastronomic", alternates: [] },
  { primary: "Gazebo", alternates: [] },
  { primary: "Gibberish", alternates: [] },
  { primary: "Glacier", alternates: [] },
  { primary: "Gratitude", alternates: [] },
  { primary: "Gravestone", alternates: [] },
  { primary: "Hailstone", alternates: [] },
  { primary: "Heritage", alternates: [] },
  { primary: "Hexagonal", alternates: [] },
  { primary: "Hibernation", alternates: [] },
  { primary: "Hornswoggle", alternates: [] },
  { primary: "Hourglass", alternates: [] },
  { primary: "Humanitarian", alternates: [] },
  { primary: "Hypothesis", alternates: [] },
  { primary: "Ideological", alternates: [] },
  { primary: "Idiom", alternates: [] },
  { primary: "Imminent", alternates: [] },
  { primary: "Imprisonment", alternates: [] },
  { primary: "Independence", alternates: [] },
  { primary: "Indifference", alternates: [] },
  { primary: "Inhabitant", alternates: [] },
  { primary: "Intermediate", alternates: [] },
  { primary: "Intermission", alternates: [] },
  { primary: "Jaded", alternates: [] },
  { primary: "Juxtaposition", alternates: [] },
  { primary: "Kangaroo", alternates: [] },
  { primary: "Legendary", alternates: [] },
  { primary: "Limousine", alternates: [] },
  { primary: "Livery", alternates: [] },
  { primary: "Mathematician", alternates: [] },
  { primary: "Melancholy", alternates: [] },
  { primary: "Metabolism", alternates: [] },
  { primary: "Methodology", alternates: [] },
  { primary: "Microorganism", alternates: [] },
  { primary: "Misconception", alternates: [] },
  { primary: "Multiplication", alternates: [] },
  { primary: "Myopic", alternates: [] },
  { primary: "Nebulous", alternates: [] },
  { primary: "Necromancer", alternates: [] },
  { primary: "Negotiation", alternates: [] },
  { primary: "Neighboring", alternates: ["Neighbouring"] },
  { primary: "Nonplussed", alternates: [] },
  { primary: "Notorious", alternates: [] },
  { primary: "Obituary", alternates: [] },
  { primary: "Oblivious", alternates: [] },
  { primary: "Opaque", alternates: [] },
  { primary: "Optimism", alternates: [] },
  { primary: "Palatine", alternates: [] },
  { primary: "Pantograph", alternates: [] },
  { primary: "Parallel", alternates: [] },
  { primary: "Participation", alternates: [] },
  { primary: "Passionate", alternates: [] },
  { primary: "Peppermint", alternates: [] },
  { primary: "Periodically", alternates: [] },
  { primary: "Personnel", alternates: [] },
  { primary: "Pestilence", alternates: [] },
  { primary: "Photographer", alternates: [] },
  { primary: "Pomegranate", alternates: [] },
  { primary: "Portfolio", alternates: [] },
  { primary: "Practitioner", alternates: [] },
  { primary: "Predominantly", alternates: [] },
  { primary: "Problematic", alternates: [] },
  { primary: "Proclamation", alternates: [] },
  { primary: "Procrastinate", alternates: [] },
  { primary: "Pronunciation", alternates: [] },
  { primary: "Propaganda", alternates: [] },
  { primary: "Protocol", alternates: [] },
  { primary: "Pygmy", alternates: [] },
  { primary: "Ravenous", alternates: [] },
  { primary: "Recession", alternates: [] },
  { primary: "Reincarnation", alternates: [] },
  { primary: "Reliability", alternates: [] },
  { primary: "Residential", alternates: [] },
  { primary: "Resilience", alternates: [] },
  { primary: "Resurrection", alternates: [] },
  { primary: "Revelation", alternates: [] },
  { primary: "Rhythm", alternates: [] },
  { primary: "Ricochet", alternates: [] },
  { primary: "Sabotage", alternates: [] },
  { primary: "Sachet", alternates: ["Sashay"] },
  { primary: "Sapphire", alternates: [] },
  { primary: "Scholarship", alternates: [] },
  { primary: "Sentimental", alternates: [] },
  { primary: "Separation", alternates: [] },
  { primary: "Shareholder", alternates: [] },
  { primary: "Significance", alternates: [] },
  { primary: "Skeleton", alternates: [] },
  { primary: "Solidarity", alternates: [] },
  { primary: "Spokesperson", alternates: [] },
  { primary: "Steadfast", alternates: [] },
  { primary: "Stereotype", alternates: [] },
  { primary: "Supposedly", alternates: [] },
  { primary: "Surrogate", alternates: [] },
  { primary: "Surveillance", alternates: [] },
  { primary: "Susceptible", alternates: [] },
  { primary: "Syllable", alternates: [] },
  { primary: "Symmetrical", alternates: [] },
  { primary: "Systematic", alternates: [] },
  { primary: "Technological", alternates: [] },
  { primary: "Thesaurus", alternates: [] },
  { primary: "Transaction", alternates: [] },
  { primary: "Translucent", alternates: [] },
  { primary: "Transparency", alternates: [] },
  { primary: "Transportation", alternates: [] },
  { primary: "Unprecedented", alternates: [] },
  { primary: "Validity", alternates: [] },
  { primary: "Venerate", alternates: [] },
  { primary: "Violation", alternates: [] },
  { primary: "Vulnerability", alternates: [] },
  { primary: "Wednesday", alternates: [] },
  { primary: "Wholeheartedly", alternates: [] },
  { primary: "Worthwhile", alternates: [] },
];

export const expertWordList: WordEntry[] = [
  { primary: "Abacaxi", alternates: [] },
  { primary: "Abasia", alternates: [] },
  { primary: "Acculturate", alternates: [] },
  { primary: "Aforementioned", alternates: [] },
  { primary: "Aggrandize", alternates: ["Aggrandise"] },
  { primary: "Agoraphobia", alternates: [] },
  { primary: "Agoraphobic", alternates: [] },
  { primary: "Ambidextrous", alternates: [] },
  { primary: "Ambiguous", alternates: [] },
  { primary: "Anaphylactic", alternates: [] },
  { primary: "Anemone", alternates: [] },
  { primary: "Apocryphal", alternates: [] },
  { primary: "Apothecary", alternates: [] },
  { primary: "Asphyxiation", alternates: [] },
  { primary: "Astigmatism", alternates: [] },
  { primary: "Ataraxy", alternates: [] },
  { primary: "Attorney", alternates: [] },
  { primary: "Bandeau", alternates: [] },
  { primary: "Belvedere", alternates: [] },
  { primary: "Betwixt", alternates: [] },
  { primary: "Bodacious", alternates: [] },
  { primary: "Brucellosis", alternates: [] },
  { primary: "Bucolic", alternates: [] },
  { primary: "Cacophony", alternates: [] },
  { primary: "Calamitous", alternates: [] },
  { primary: "Calumny", alternates: [] },
  { primary: "Capoeira", alternates: [] },
  { primary: "Capricious", alternates: [] },
  { primary: "Captious", alternates: [] },
  { primary: "Cerulean", alternates: [] },
  { primary: "Chauffeur", alternates: [] },
  { primary: "Chronological", alternates: [] },
  { primary: "Cinematographer", alternates: [] },
  { primary: "Clandestine", alternates: [] },
  { primary: "Coalescence", alternates: [] },
  { primary: "Codicil", alternates: [] },
  { primary: "Colloquialism", alternates: [] },
  { primary: "Comeuppance", alternates: [] },
  { primary: "Commodore", alternates: [] },
  { primary: "Compunction", alternates: [] },
  { primary: "Consanguine", alternates: [] },
  { primary: "Consummate", alternates: [] },
  { primary: "Correspondence", alternates: [] },
  { primary: "Counterintuitive", alternates: [] },
  { primary: "Culvert", alternates: [] },
  { primary: "Cyrillic", alternates: [] },
  { primary: "Defenestration", alternates: [] },
  { primary: "Deleterious", alternates: [] },
  { primary: "Depilatory", alternates: [] },
  { primary: "Diminution", alternates: [] },
  { primary: "Discombobulate", alternates: [] },
  { primary: "Dodecahedron", alternates: [] },
  { primary: "Eloquent", alternates: [] },
  { primary: "Elysian", alternates: ["Elision"] },
  { primary: "Epitome", alternates: [] },
  { primary: "Extraterrestrial", alternates: [] },
  { primary: "Facsimile", alternates: [] },
  { primary: "Fastidious", alternates: [] },
  { primary: "Fissiparous", alternates: [] },
  { primary: "Flummox", alternates: [] },
  { primary: "Fuchsia", alternates: [] },
  { primary: "Garrulous", alternates: [] },
  { primary: "Gentrification", alternates: [] },
  { primary: "Glaucomatous", alternates: [] },
  { primary: "Glockenspiel", alternates: [] },
  { primary: "Gobbledygook", alternates: ["Gobbledegook"] },
  { primary: "Grandiloquent", alternates: [] },
  { primary: "Handkerchief", alternates: [] },
  { primary: "Harpsichord", alternates: [] },
  { primary: "Hemoglobin", alternates: ["Haemoglobin"] },
  { primary: "Heterozygous", alternates: [] },
  { primary: "Hierarchy", alternates: [] },
  { primary: "Homeopathy", alternates: ["Homoeopathy"] },
  { primary: "Homogeneous", alternates: [] },
  { primary: "Hypermetropia", alternates: [] },
  { primary: "Iconoclast", alternates: [] },
  { primary: "Incandescent", alternates: [] },
  { primary: "Inchoate", alternates: [] },
  { primary: "Incoagulable", alternates: [] },
  { primary: "Indefatigable", alternates: [] },
  { primary: "Ingenious", alternates: [] },
  { primary: "Irascible", alternates: [] },
  { primary: "Isometropia", alternates: [] },
  { primary: "Isthmus", alternates: [] },
  { primary: "Kaleidoscope", alternates: [] },
  { primary: "Latitudinarianism", alternates: [] },
  { primary: "Legislation", alternates: [] },
  { primary: "Lexicography", alternates: [] },
  { primary: "Liaison", alternates: [] },
  { primary: "Loquacious", alternates: [] },
  { primary: "Lymphangiography", alternates: [] },
  { primary: "Macabre", alternates: [] },
  { primary: "Magniloquent", alternates: [] },
  { primary: "Malapropism", alternates: [] },
  { primary: "Martyrdom", alternates: [] },
  { primary: "Mellifluous", alternates: [] },
  { primary: "Menagerie", alternates: [] },
  { primary: "Meretricious", alternates: [] },
  { primary: "Microminiaturization", alternates: [] },
  { primary: "Milieu", alternates: [] },
  { primary: "Miniscule", alternates: ["Minuscule"] },
  { primary: "Miscellaneous", alternates: [] },
  { primary: "Monochromatic", alternates: [] },
  { primary: "Monosyllabic", alternates: [] },
  { primary: "Multidimensionality", alternates: [] },
  { primary: "Municipal", alternates: [] },
  { primary: "Myriad", alternates: [] },
  { primary: "Narcissistic", alternates: [] },
  { primary: "Nauseous", alternates: [] },
  { primary: "Neuroplasticity", alternates: [] },
  { primary: "Nocturne", alternates: ["Nocturn"] },
  { primary: "Nomenclature", alternates: [] },
  { primary: "Nutritious", alternates: [] },
  { primary: "Obfuscation", alternates: [] },
  { primary: "Paradigm", alternates: [] },
  { primary: "Parliamentary", alternates: [] },
  { primary: "Paroxysm", alternates: [] },
  { primary: "Pecuniary", alternates: [] },
  { primary: "Pernicious", alternates: [] },
  { primary: "Pessimistic", alternates: [] },
  { primary: "Phantasmagoria", alternates: [] },
  { primary: "Pharaoh", alternates: ["Farrow"] },
  { primary: "Phenomenon", alternates: [] },
  { primary: "Phlegm", alternates: [] },
  { primary: "Photogeochemistry", alternates: [] },
  { primary: "Pirouette", alternates: [] },
  { primary: "Pneumatic", alternates: [] },
  { primary: "Polemic", alternates: [] },
  { primary: "Polychromatic", alternates: [] },
  { primary: "Polydactyly", alternates: [] },
  { primary: "Predecessor", alternates: [] },
  { primary: "Prestigious", alternates: [] },
  { primary: "Psychological", alternates: [] },
  { primary: "Puerile", alternates: [] },
  { primary: "Pugnacious", alternates: [] },
  { primary: "Querimony", alternates: [] },
  { primary: "Quixotry", alternates: [] },
  { primary: "Rambunctious", alternates: [] },
  { primary: "Rehabilitation", alternates: [] },
  { primary: "Reminiscence", alternates: [] },
  { primary: "Rendezvous", alternates: [] },
  { primary: "Sagacious", alternates: [] },
  { primary: "Sanguine", alternates: [] },
  { primary: "Sarcophagus", alternates: [] },
  { primary: "Semaphore", alternates: [] },
  { primary: "Sententiously", alternates: [] },
  { primary: "Sequacious", alternates: [] },
  { primary: "Sequoia", alternates: [] },
  { primary: "Silhouette", alternates: [] },
  { primary: "Simultaneous", alternates: [] },
  { primary: "Sovereignty", alternates: [] },
  { primary: "Subpoena", alternates: [] },
  { primary: "Subterranean", alternates: [] },
  { primary: "Supersede", alternates: ["Supercede"] },
  { primary: "Syllepsis", alternates: [] },
  { primary: "Symbiosis", alternates: [] },
  { primary: "Syzygy", alternates: [] },
  { primary: "Tempestuous", alternates: [] },
  { primary: "Tetraphobia", alternates: [] },
  { primary: "Therapeutic", alternates: [] },
  { primary: "Triphosphate", alternates: [] },
  { primary: "Ubiquitous", alternates: [] },
  { primary: "Uncharacteristic", alternates: [] },
  { primary: "Unintelligible", alternates: [] },
  { primary: "Verbatim", alternates: [] },
  { primary: "Vexatious", alternates: [] },
  { primary: "Vignette", alternates: [] },
  { primary: "Xenogeneic", alternates: [] },
  { primary: "Zephyr", alternates: [] },
  { primary: "Zygote", alternates: [] },
];

export const geniusWordList: WordEntry[] = [
  { primary: "Abdominothoracic", alternates: [] },
  { primary: "Absquatulate", alternates: [] },
  { primary: "Acetaminophen", alternates: [] },
  { primary: "Achromatophil", alternates: [] },
  { primary: "Achromatophilia", alternates: [] },
  { primary: "Acquiesce", alternates: [] },
  { primary: "Allotransplantation", alternates: [] },
  { primary: "Anachronistic", alternates: [] },
  { primary: "Aneurysmorrhaphy", alternates: [] },
  { primary: "Antediluvian", alternates: [] },
  { primary: "Arthroereisis", alternates: [] },
  { primary: "Ascosporogenous", alternates: [] },
  { primary: "Baccalaureate", alternates: [] },
  { primary: "Batrachophobia", alternates: [] },
  { primary: "Borborygmus", alternates: [] },
  { primary: "Bougainvillea", alternates: [] },
  { primary: "Bourgeoisie", alternates: [] },
  { primary: "Buckminsterfullerene", alternates: [] },
  { primary: "Bureaucracy", alternates: [] },
  { primary: "Chronopsychophysiology", alternates: [] },
  { primary: "Clinicoechocardiographic", alternates: [] },
  { primary: "Compartmentalization", alternates: ["Compartmentalisation"] },
  { primary: "Countermajoritarianism", alternates: [] },
  { primary: "Craniosynostosis", alternates: [] },
  { primary: "Cryptoendolithic", alternates: [] },
  { primary: "Dendrochronology", alternates: [] },
  { primary: "Deoxyribonucleic", alternates: [] },
  { primary: "Dichotomization", alternates: ["Dichotomisation"] },
  { primary: "Electrotelethermometer", alternates: [] },
  { primary: "Entrepreneur", alternates: [] },
  { primary: "Ethnopsychopharmacology", alternates: [] },
  { primary: "Flibbertigibbet", alternates: [] },
  { primary: "Fossiliferous", alternates: [] },
  { primary: "Frontoethmoidectomy", alternates: [] },
  { primary: "Geitonogamy", alternates: [] },
  { primary: "Glyceraldehyde", alternates: [] },
  { primary: "Goniosynechialysis", alternates: [] },
  { primary: "Gubernatorial", alternates: [] },
  { primary: "Hemispherectomy", alternates: [] },
  { primary: "Hieroglyphics", alternates: [] },
  { primary: "Hydrochlorofluorocarbon", alternates: [] },
  { primary: "Hypercholesterolemia", alternates: [] },
  { primary: "Hypoparathyroidism", alternates: [] },
  { primary: "Incomprehensibility", alternates: [] },
  { primary: "Infinitesimal", alternates: [] },
  { primary: "Infundibulum", alternates: [] },
  { primary: "Institutionalization", alternates: ["Institutionalisation"] },
  { primary: "Jurisprudence", alternates: [] },
  { primary: "Labyrinthine", alternates: [] },
  { primary: "Lepidopterology", alternates: [] },
  { primary: "Machiavellian", alternates: [] },
  { primary: "Mechanotransduction", alternates: [] },
  { primary: "Methemoglobinemia", alternates: [] },
  { primary: "Metonymic", alternates: [] },
  { primary: "Neuroimmunomodulation", alternates: [] },
  { primary: "Neuropsychological", alternates: [] },
  { primary: "Oligonucleotide", alternates: [] },
  { primary: "Orthogeosyncline", alternates: [] },
  { primary: "Panproctocolectomy", alternates: [] },
  { primary: "Parallelogrammatic", alternates: [] },
  { primary: "Paraphernalia", alternates: [] },
  { primary: "Perspicacious", alternates: [] },
  { primary: "Plenipotentiary", alternates: [] },
  { primary: "Portmanteau", alternates: [] },
  { primary: "Prestidigitation", alternates: [] },
  { primary: "Prognostication", alternates: [] },
  { primary: "Pseudoparallelodromous", alternates: [] },
  { primary: "Psychopharmacotherapy", alternates: [] },
  { primary: "Psychotomimetic", alternates: [] },
  { primary: "Pulchritudinous", alternates: [] },
  { primary: "Pusillanimous", alternates: [] },
  { primary: "Quasiautobiographical", alternates: [] },
  { primary: "Quasquicentennial", alternates: [] },
  { primary: "Quindecasyllabic", alternates: [] },
  { primary: "Quoddamodotative", alternates: [] },
  { primary: "Radioallergosorbent", alternates: [] },
  { primary: "Rhinorrhagia", alternates: [] },
  { primary: "Serendipity", alternates: [] },
  { primary: "Sesquipedalian", alternates: [] },
  { primary: "Spectrophotometer", alternates: [] },
  { primary: "Subcompartmentalization", alternates: ["Subcompartmentalisation"] },
  { primary: "Subdermatoglyphic", alternates: [] },
  { primary: "Supererogatory", alternates: [] },
  { primary: "Superferromagnetism", alternates: [] },
  { primary: "Susurration", alternates: [] },
  { primary: "Temporomandibular", alternates: [] },
  { primary: "Thalassophobia", alternates: [] },
  { primary: "Thermochromatography", alternates: [] },
  { primary: "Tintinnabulation", alternates: [] },
  { primary: "Transinstitutionalization", alternates: ["Transinstitutionalisation"] },
  { primary: "Utilitarianism", alternates: [] },
  { primary: "Verisimilitude", alternates: [] },
  { primary: "Worcestershire", alternates: [] },
  { primary: "Xiphiplastron", alternates: [] },
  { primary: "Xylotypographic", alternates: [] },
];

export const wordList: WordEntry[] = [
  { primary: "Acetylglucocoroglaucigenin", alternates: [] },
  { primary: "Acrocephalopolydactylousdysplasia", alternates: [] },
  { primary: "Adrenocorticotropin", alternates: ["Adrenocorticotrophin"] },
  { primary: "Anthropomorphization", alternates: ["Anthropomorphisation"] },
  { primary: "Antidisestablishmentarianism", alternates: [] },
  { primary: "Antixerophthalmic", alternates: [] },
  { primary: "Bourgeoisification", alternates: [] },
  { primary: "Bromochlorodifluoromethane", alternates: [] },
  { primary: "Canaliculodacryocystorhinostomy", alternates: [] },
  { primary: "Chargoggagoggmanchauggagoggchaubunagungamaugg", alternates: [] },
  { primary: "Cholangiocholecystocholedochectomy", alternates: [] },
  { primary: "Cholangiopancreatography", alternates: [] },
  { primary: "Chondromyxohemangioendotheliosarcoma", alternates: [] },
  { primary: "Convolvulaceous", alternates: [] },
  { primary: "Corticopontocerebellar", alternates: [] },
  { primary: "Corynebacteriumpseudotuberculosis", alternates: [] },
  { primary: "Counterimmunoelectrophoresis", alternates: [] },
  { primary: "Dehydrothiotoluidine", alternates: [] },
  { primary: "Dermatofibrosarcomaprotuberans", alternates: [] },
  { primary: "Dextrodeorsumversion", alternates: [] },
  { primary: "Dichlorodiphenyltrichloroethane", alternates: [] },
  { primary: "Diisopropylfluorophosphate", alternates: [] },
  { primary: "Eellogofusciouhipoppokunurious", alternates: [] },
  { primary: "Encephalocraniocutaneouslipomatosis", alternates: [] },
  { primary: "Erythrocytapheresis", alternates: [] },
  { primary: "Ferriprotoporphyrin", alternates: [] },
  { primary: "Floccinaucinihilipilification", alternates: [] },
  { primary: "Fluorotetraferriphlogopite", alternates: [] },
  { primary: "Gegenstandstheorie", alternates: [] },
  { primary: "Hematospectrophotometrically", alternates: ["Haematospectrophotometrically"] },
  { primary: "Hexakosioihexekontahexaphobia", alternates: [] },
  { primary: "Hippopotomonstrosesquipedaliophobia", alternates: ["Hippopotomonstrosesquippedaliophobia"] },
  { primary: "Honorificabilitudinity", alternates: ["Honourificabilitudinity"] },
  { primary: "Hypothalamicpituitaryadrenocortical", alternates: [] },
  { primary: "Immunoelectrochemiluminescence", alternates: [] },
  { primary: "Inositolphosphorylceramide", alternates: [] },
  { primary: "Laparohysterosalpingooophorectomy", alternates: [] },
  { primary: "Laryngotracheobronchitis", alternates: [] },
  { primary: "Loncastuximabtesirine", alternates: [] },
  { primary: "Lymphangioleiomyomatosis", alternates: [] },
  { primary: "Micropachycephalosaurus", alternates: [] },
  { primary: "Neohesperidindihydrochalcone", alternates: [] },
  { primary: "Nonanonacontanonactanonaliagon", alternates: [] },
  { primary: "Nucleotidylexotransferase", alternates: [] },
  { primary: "Orotatephosphoribosyltransferase", alternates: [] },
  { primary: "Otorhinolaryngological", alternates: [] },
  { primary: "Photoplethysmography", alternates: [] },
  { primary: "Pneumoencephalography", alternates: [] },
  { primary: "Pneumonoultramicroscopicsilicovolcanoconiosis", alternates: [] },
  { primary: "Polyphiloprogenitive", alternates: [] },
  { primary: "Pseudopseudohypoparathyroidism", alternates: [] },
  { primary: "Pseudorhombicuboctahedron", alternates: [] },
  { primary: "Psychoneuroendocrinological", alternates: [] },
  { primary: "Psychophysicotherapeutics", alternates: [] },
  { primary: "Pyrrolizidinealkaloidosis", alternates: [] },
  { primary: "Ribulosebisphosphatecarboxylaseoxygenase", alternates: [] },
  { primary: "Sclerectoiridectomy", alternates: [] },
  { primary: "Spectrophotofluorometry", alternates: [] },
  { primary: "Sphenopalatineganglioneuralgia", alternates: [] },
  { primary: "Sphygmomanometer", alternates: [] },
  { primary: "Stereoelectroencephalography", alternates: [] },
  { primary: "Supercalifragilisticexpialidocious", alternates: [] },
  { primary: "Thyroparathyroidectomy", alternates: [] },
  { primary: "Tonsillopharyngitis", alternates: [] },
  { primary: "Uvulopalatopharyngoplasty", alternates: [] },
  { primary: "Ventriculocisternostomy", alternates: [] },
];

export const CHARG_WORD = "Chargoggagoggmanchauggagoggchaubunagungamaugg";

export const nightmareWordList: WordEntry[] = [
  { primary: "Taumatawhakatangihangakoauauotamateaturipukakapikimaungahoronukupokaiwhenuakitanatahu", alternates: [] },
  { primary: "Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch", alternates: [] },
  { primary: "Methionylthreonylthreonylarginylisoleucine", alternates: [] },
  { primary: "Formaldehydesulphoxylatehydroxymethyltransferase", alternates: ["Formaldehydesulfoxylatehydroxymethyltransferase"] },
  { primary: "Electroencephalographically", alternates: [] },
  { primary: "Spectrophotofluorometrically", alternates: [] },
  { primary: "Psychoneuroimmunoendocrinology", alternates: [] },
  { primary: "Radioimmunoelectrophoretically", alternates: [] },
  { primary: "Immunohistopathologically", alternates: [] },
  { primary: "Microspectrophotofluorometrically", alternates: [] },
  { primary: "Magnetohydrodynamical", alternates: [] },
  { primary: "Cholecystoduodenostomies", alternates: [] },
  { primary: "Transubstantiationalistically", alternates: [] },
  { primary: "Sesquipedalianistically", alternates: [] },
  { primary: "Pathologicophysiological", alternates: [] },
  { primary: "Counterrevolutionariness", alternates: [] },
  { primary: "Unconstitutionality", alternates: [] },
  { primary: "Hyperbetalipoproteinemia", alternates: ["Hyperbetalipoproteinaemia"] },
  { primary: "Dihydroxyphenylalanine", alternates: [] },
  { primary: "Electrodynamometrically", alternates: [] },
  { primary: "Methionylthreonylthreonylarginylisoleucylprolylphenylalanylvalylseryltyrosylleucine", alternates: [] },
  { primary: "Formaldehydesulphoxylatehydroxymethyltransferaseactivity", alternates: ["Formaldehydesulfoxylatehydroxymethyltransferaseactivity"] },
  { primary: "Immunoelectrophoreticallycharacterizablemacroglobulinemia", alternates: [] },
  { primary: "Electroencephalographicallyindistinguishable", alternates: [] },
  { primary: "Microspectrophotofluorometricallyquantifiable", alternates: [] },
  { primary: "Psychoneuroimmunoendocrinologicallycomplex", alternates: [] },
  { primary: "Magnetohydrodynamicallyreconfigurable", alternates: [] },
  { primary: "Hypercholesterolemiatherapeuticallyresistant", alternates: ["Hypercholesterolaemiatherapeuticallyresistant"] },
  { primary: "Counterrevolutionarilyinstitutionalized", alternates: [] },
  { primary: "Pathologicophysiologicallymultifactorial", alternates: [] },
  { primary: "Immunohistopathologicallynonreactive", alternates: [] },
  { primary: "Radioimmunoelectrophoreticallystandardized", alternates: [] },
  { primary: "Ophthalmoneuroendocrinologicallyintegrated", alternates: [] },
  { primary: "Neuropsychoimmunopharmacologicallyactive", alternates: [] },
  { primary: "Spectrophotofluorometricallyintercalibrated", alternates: [] },
  { primary: "Transubstantiationalisticallymisinterpreted", alternates: [] },
  { primary: "Electrodynamometricallyovercompensated", alternates: [] },
  { primary: "Cholecystoduodenostomicallyreconstructed", alternates: [] },
  { primary: "Dihydroxyphenylalaninedecarboxylaseinhibitor", alternates: [] },
  { primary: "Hyperbetalipoproteinemicallypredisposed", alternates: ["Hyperbetalipoproteinaemicallypredisposed"] },
  { primary: "Unconstitutionalityofconscientiousobjectors", alternates: [] },
];

export const nightmarePlusWordList: WordEntry[] = [
  {
    primary: "Lopadotemachoselachogaleokranioleipsanodrimhypotrimmatosilphioparaomelitokatakechymenokichlepikossyphophattoperisteralektryonoptekephalliokigklopeleiolagoiosiraiobaphetraganopterygon",
    alternates: [],
  },
  {
    primary: "Methionylthreonylthreonylglutaminylarginyltyrosylglutamylserylleucylphenylalanylalanylglutaminylleucyllysylglutamylglycylalanylphenylalanylvalylprolylglycylisoleucylglutamylglutaminylserylleucyllysylisoleucylaspartylthreonylleucylisoleucylglutamylalanylglycylalanylaspartylalanylleucylglutamylleucylglycylisoleucylprolylphenylalanylserylaspartylprolylleucylalanylaspartylglycylprolylthreonylisoleucylglutaminylasparaginylalanylthreonylleucylarginylalanylphenylalanylalanylalanylglycylvalylthreonylprolylalanylglutaminylcysteinylphenylalanylglutamylmethionylleucylalanylleucylisoleucylarginylglutaminyllysylhistidylprolylthreonylisoleucylprolylisoleucylglycylleucylleucylmethionyltyrosylalanylasparaginylleucylvalylphenylalanylasparaginyllysylglycylisoleucylaspartylglutamylphenylalanyltyrosylalanylglutaminylcysteinylglutamyllysylvalylglycylvalylaspartylserylvalylleucylvalylalanylaspartylvalylprolylvalylglutaminylglutamylserylalanylprolylphenylalanylarginylglutaminylalanylalanylleucylarginylhistidylasparaginylvalylalanylprolylisoleucylphenylalanylisoleucylcysteinylprolylprolylaspartylalanylaspartylaspartylaspartylleucylleucylarginylglutaminylisoleucylalanylseryltyrosylglycylarginylglycyltyrosylthreonyltyrosylleucylleucylserylarginylalanylglycylvalylthreonylglycylalanylglutamylasparaginylarginylalanylalanylleucylprolylleucylasparaginylhistidylleucylvalylalanyllysylleucyllysylglutamyltyrosylasparaginylalanylalanylprolylprolylleucylglutaminylglycylphenylalanylglycylisoleucylserylalanylprolylaspartylglutaminylvalyllysylalanylalanylisoleucylaspartylalanylglycylalanylalanylglycylalanylisoleucylserylglycylserylalanylisoleucylvalyllysylisoleucylisoleucylglutamylglutaminylhistidylasparaginylisoleucylglutamylprolylglutamyllysylmethionylleucylalanylalanylleucyllysylvalylphenylalanylvalylglutaminylprolylmethionyllysylalanylalanylthreonylarginylserine",
    alternates: [],
  },
];

// Internal shuffled pool to avoid immediate repeats; refilled when exhausted.
let _shuffledPool: WordEntry[] = [];
let _shuffledIdx = 0;
let _impossibleShuffledPool: WordEntry[] = [];
let _impossibleShuffledIdx = 0;
let _nightmarePlusShuffledPool: WordEntry[] = [];
let _nightmarePlusShuffledIdx = 0;
let _beginnerShuffledPool: WordEntry[] = [];
let _beginnerShuffledIdx = 0;
let _noviceShuffledPool: WordEntry[] = [];
let _noviceShuffledIdx = 0;
let _moderateShuffledPool: WordEntry[] = [];
let _moderateShuffledIdx = 0;
let _advancedShuffledPool: WordEntry[] = [];
let _advancedShuffledIdx = 0;
let _expertShuffledPool: WordEntry[] = [];
let _expertShuffledIdx = 0;
let _geniusShuffledPool: WordEntry[] = [];
let _geniusShuffledIdx = 0;

function _shuffleArray<T>(arr: T[]) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function _isHomophonesEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ALLOW_HOMOPHONES_KEY) === "true";
}

function _prepareWordForHomophoneSetting(word: WordEntry): WordEntry {
  if (!_isHomophonesEnabled()) {
    return {
      primary: word.primary,
      alternates: [],
    };
  }

  if (word.alternates.length === 0) {
    return {
      primary: word.primary,
      alternates: [],
    };
  }

  const homophoneSpellings = Array.from(new Set([word.primary, ...word.alternates]));
  const chosenIndex = Math.floor(Math.random() * homophoneSpellings.length);
  const chosenHomophone = homophoneSpellings[chosenIndex];

  return {
    primary: chosenHomophone,
    alternates: homophoneSpellings.filter((_, index) => index !== chosenIndex),
  };
}

function _ensurePool(chargMode?: boolean) {
  const basePool = chargMode ? wordList : wordList.filter(w => w.primary !== CHARG_WORD);
  if (!_shuffledPool.length || _shuffledIdx >= _shuffledPool.length) {
    _shuffledPool = _shuffleArray(basePool);
    _shuffledIdx = 0;
  }
}

function _ensureImpossiblePool() {
  if (!_impossibleShuffledPool.length || _impossibleShuffledIdx >= _impossibleShuffledPool.length) {
    _impossibleShuffledPool = _shuffleArray(nightmareWordList);
    _impossibleShuffledIdx = 0;
  }
}

function _ensureNightmarePlusPool() {
  if (!_nightmarePlusShuffledPool.length || _nightmarePlusShuffledIdx >= _nightmarePlusShuffledPool.length) {
    _nightmarePlusShuffledPool = _shuffleArray(nightmarePlusWordList);
    _nightmarePlusShuffledIdx = 0;
  }
}

function _ensureBeginnerPool() {
  if (!_beginnerShuffledPool.length || _beginnerShuffledIdx >= _beginnerShuffledPool.length) {
    _beginnerShuffledPool = _shuffleArray(beginnerWordList);
    _beginnerShuffledIdx = 0;
  }
}

function _ensureNovicePool() {
  if (!_noviceShuffledPool.length || _noviceShuffledIdx >= _noviceShuffledPool.length) {
    _noviceShuffledPool = _shuffleArray(noviceWordList);
    _noviceShuffledIdx = 0;
  }
}

function _ensureModeratePool() {
  if (!_moderateShuffledPool.length || _moderateShuffledIdx >= _moderateShuffledPool.length) {
    _moderateShuffledPool = _shuffleArray(moderateWordList);
    _moderateShuffledIdx = 0;
  }
}

function _ensureAdvancedPool() {
  if (!_advancedShuffledPool.length || _advancedShuffledIdx >= _advancedShuffledPool.length) {
    _advancedShuffledPool = _shuffleArray(advancedWordList);
    _advancedShuffledIdx = 0;
  }
}

function _ensureExpertPool() {
  if (!_expertShuffledPool.length || _expertShuffledIdx >= _expertShuffledPool.length) {
    _expertShuffledPool = _shuffleArray(expertWordList);
    _expertShuffledIdx = 0;
  }
}

function _ensureGeniusPool() {
  if (!_geniusShuffledPool.length || _geniusShuffledIdx >= _geniusShuffledPool.length) {
    _geniusShuffledPool = _shuffleArray(geniusWordList);
    _geniusShuffledIdx = 0;
  }
}

export function getRandomWord(exclude?: string, chargMode?: boolean): WordEntry {
  // If chargMode is on, we still want a rare chance for the CHARG_WORD (1/50).
  if (chargMode) {
    if (Math.random() < 1 / 45) {
      const charg = wordList.find(w => w.primary === CHARG_WORD);
      if (charg) {
        const preparedCharg = _prepareWordForHomophoneSetting(charg);
        if (!exclude || preparedCharg.primary !== exclude) return preparedCharg;
      }
      // if excluded, fall through to normal selection
    }
  }

  _ensurePool(chargMode);

  // Pull from shuffled pool (no repeats until exhausted). If the next word equals
  // `exclude`, advance to the next one (but avoid infinite loops).
  const poolLength = _shuffledPool.length;
  if (poolLength === 0) throw new Error("No words available in pool");

  let attempts = 0;
  while (attempts < poolLength) {
    const candidate = _prepareWordForHomophoneSetting(_shuffledPool[_shuffledIdx]);
    _shuffledIdx = (_shuffledIdx + 1) % poolLength;
    attempts += 1;
    if (!exclude || candidate.primary !== exclude) return candidate;
  }

  // If all words are the excluded one (unlikely), return the first anyway.
  return _prepareWordForHomophoneSetting(_shuffledPool[0]);
}

export function getRandomImpossibleWord(exclude?: string): WordEntry {
  _ensureImpossiblePool();

  const poolLength = _impossibleShuffledPool.length;
  if (poolLength === 0) throw new Error("No impossible words available in pool");

  let attempts = 0;
  while (attempts < poolLength) {
    const candidate = _prepareWordForHomophoneSetting(_impossibleShuffledPool[_impossibleShuffledIdx]);
    _impossibleShuffledIdx = (_impossibleShuffledIdx + 1) % poolLength;
    attempts += 1;
    if (!exclude || candidate.primary !== exclude) return candidate;
  }

  return _prepareWordForHomophoneSetting(_impossibleShuffledPool[0]);
}

export function getRandomNightmarePlusWord(exclude?: string): WordEntry {
  _ensureNightmarePlusPool();

  const poolLength = _nightmarePlusShuffledPool.length;
  if (poolLength === 0) throw new Error("No nightmare+ words available in pool");

  let attempts = 0;
  while (attempts < poolLength) {
    const candidate = _prepareWordForHomophoneSetting(_nightmarePlusShuffledPool[_nightmarePlusShuffledIdx]);
    _nightmarePlusShuffledIdx = (_nightmarePlusShuffledIdx + 1) % poolLength;
    attempts += 1;
    if (!exclude || candidate.primary !== exclude) return candidate;
  }

  return _prepareWordForHomophoneSetting(_nightmarePlusShuffledPool[0]);
}

export function getRandomBeginnerWord(exclude?: string): WordEntry {
  _ensureBeginnerPool();

  const poolLength = _beginnerShuffledPool.length;
  if (poolLength === 0) throw new Error("No beginner words available in pool");

  let attempts = 0;
  while (attempts < poolLength) {
    const candidate = _prepareWordForHomophoneSetting(_beginnerShuffledPool[_beginnerShuffledIdx]);
    _beginnerShuffledIdx = (_beginnerShuffledIdx + 1) % poolLength;
    attempts += 1;
    if (!exclude || candidate.primary !== exclude) return candidate;
  }

  return _prepareWordForHomophoneSetting(_beginnerShuffledPool[0]);
}

export function getRandomNoviceWord(exclude?: string): WordEntry {
  _ensureNovicePool();

  const poolLength = _noviceShuffledPool.length;
  if (poolLength === 0) throw new Error("No novice words available in pool");

  let attempts = 0;
  while (attempts < poolLength) {
    const candidate = _prepareWordForHomophoneSetting(_noviceShuffledPool[_noviceShuffledIdx]);
    _noviceShuffledIdx = (_noviceShuffledIdx + 1) % poolLength;
    attempts += 1;
    if (!exclude || candidate.primary !== exclude) return candidate;
  }

  return _prepareWordForHomophoneSetting(_noviceShuffledPool[0]);
}

export function getRandomModerateWord(exclude?: string): WordEntry {
  _ensureModeratePool();

  const poolLength = _moderateShuffledPool.length;
  if (poolLength === 0) throw new Error("No moderate words available in pool");

  let attempts = 0;
  while (attempts < poolLength) {
    const candidate = _prepareWordForHomophoneSetting(_moderateShuffledPool[_moderateShuffledIdx]);
    _moderateShuffledIdx = (_moderateShuffledIdx + 1) % poolLength;
    attempts += 1;
    if (!exclude || candidate.primary !== exclude) return candidate;
  }

  return _prepareWordForHomophoneSetting(_moderateShuffledPool[0]);
}

export function getRandomAdvancedWord(exclude?: string): WordEntry {
  _ensureAdvancedPool();

  const poolLength = _advancedShuffledPool.length;
  if (poolLength === 0) throw new Error("No advanced words available in pool");

  let attempts = 0;
  while (attempts < poolLength) {
    const candidate = _prepareWordForHomophoneSetting(_advancedShuffledPool[_advancedShuffledIdx]);
    _advancedShuffledIdx = (_advancedShuffledIdx + 1) % poolLength;
    attempts += 1;
    if (!exclude || candidate.primary !== exclude) return candidate;
  }

  return _prepareWordForHomophoneSetting(_advancedShuffledPool[0]);
}

export function getRandomExpertWord(exclude?: string): WordEntry {
  _ensureExpertPool();

  const poolLength = _expertShuffledPool.length;
  if (poolLength === 0) throw new Error("No expert words available in pool");

  let attempts = 0;
  while (attempts < poolLength) {
    const candidate = _prepareWordForHomophoneSetting(_expertShuffledPool[_expertShuffledIdx]);
    _expertShuffledIdx = (_expertShuffledIdx + 1) % poolLength;
    attempts += 1;
    if (!exclude || candidate.primary !== exclude) return candidate;
  }

  return _prepareWordForHomophoneSetting(_expertShuffledPool[0]);
}

export function getRandomGeniusWord(exclude?: string): WordEntry {
  _ensureGeniusPool();

  const poolLength = _geniusShuffledPool.length;
  if (poolLength === 0) throw new Error("No genius words available in pool");

  let attempts = 0;
  while (attempts < poolLength) {
    const candidate = _prepareWordForHomophoneSetting(_geniusShuffledPool[_geniusShuffledIdx]);
    _geniusShuffledIdx = (_geniusShuffledIdx + 1) % poolLength;
    attempts += 1;
    if (!exclude || candidate.primary !== exclude) return candidate;
  }

  return _prepareWordForHomophoneSetting(_geniusShuffledPool[0]);
}

function hasAcceptedCase(input: string): boolean {
  if (!input) return false;

  // All-caps inputs are invalid for words with 2+ letters.
  if (input.length > 1 && input === input.toUpperCase()) return false;

  const allLower = input === input.toLowerCase();
  const firstUpperRestLower =
    input[0] === input[0].toUpperCase() && input.slice(1) === input.slice(1).toLowerCase();

  return allLower || firstUpperRestLower;
}

function getActiveSpellingModifiers(): string[] {
  return Array.from(TRANSFORMING_FUNBOX_MODIFIERS).filter((modifierId) => isFunboxModifierActive(modifierId));
}

export function resolveWordForActiveModifiers(word: WordEntry): ResolvedWordEntry {
  const activeModifiers = getActiveSpellingModifiers();
  const expectedSpellings = [word.primary, ...word.alternates].map((candidate) =>
    applySpellingFunboxModifiers(candidate, activeModifiers)
  );

  const uniqueExpectedSpellings = Array.from(new Set(expectedSpellings));
  const requiresExactCase = activeModifiers.some((modifier) => CASE_SENSITIVE_FUNBOX_MODIFIERS.has(modifier));

  return {
    primary: uniqueExpectedSpellings[0] ?? "",
    alternates: uniqueExpectedSpellings.slice(1),
    requiresExactCase,
  };
}

export function liveFeedbackCharMatches(char: string, pos: number, word: WordEntry): boolean {
  if (!char) return false;

  const resolved = resolveWordForActiveModifiers(word);
  if (resolved.requiresExactCase) {
    if (pos < resolved.primary.length && resolved.primary[pos] === char) return true;
    return resolved.alternates.some((alt) => pos < alt.length && alt[pos] === char);
  }

  const lower = char.toLowerCase();
  if (pos < resolved.primary.length && resolved.primary[pos].toLowerCase() === lower) return true;
  return resolved.alternates.some((alt) => pos < alt.length && alt[pos].toLowerCase() === lower);
}

export function liveFeedbackContainsChar(char: string, word: WordEntry): boolean {
  if (!char) return false;

  const resolved = resolveWordForActiveModifiers(word);
  if (resolved.requiresExactCase) {
    if (resolved.primary.includes(char)) return true;
    return resolved.alternates.some((alt) => alt.includes(char));
  }

  const lower = char.toLowerCase();
  if (resolved.primary.toLowerCase().includes(lower)) return true;
  return resolved.alternates.some((alt) => alt.toLowerCase().includes(lower));
}

export function isCorrectSpelling(input: string, word: WordEntry): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;

  const resolved = resolveWordForActiveModifiers(word);
  const expectedSpellings = [resolved.primary, ...resolved.alternates];

  if (expectedSpellings.some((candidate) => candidate === trimmed)) {
    return true;
  }

  if (resolved.requiresExactCase) {
    return false;
  }

  if (!hasAcceptedCase(trimmed)) return false;

  const loweredInput = trimmed.toLowerCase();
  return expectedSpellings.some((candidate) => candidate.toLowerCase() === loweredInput);
}
