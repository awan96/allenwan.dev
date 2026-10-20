// src/app/(site)/about/interests.ts
// The About page's interest badges, and the links between them that make
// them a graph. Pointing at a badge reads it out in the panel above the
// grid and lights up the badges it links to; clicking one pins it there,
// and pointing at another only overrides it until the pointer leaves.
//
// To add one: an id, a label, a line or two, and an icon; then link it to
// its neighbours in LINKS. Each pair goes in once, in either order, and a
// link runs both ways. LINKS only takes ids from INTERESTS, so a typo
// there won't compile.
//
// An icon is a sprite name. A bare name is a site sprite (siteSprites.ts,
// "Site sprites" in /sprite-editor, where each badge's is interest_<id>);
// "library/name" reaches another of the editor's libraries, as in
// "game-icons/dice". Draw them 12×12, like the project cards' icons. No
// icon, or a name that isn't there, draws a "?".
//
// A link is optional: a tidbit under the line, as { href, label }. An
// outside address opens in a new tab; a path on the site ("/game") opens
// here. Visitors reach it by pinning the badge.
//
// The heads (head: true) come first and the finer ones follow, in one run:
// a rough grouping, so a row can hold both. The grid runs 8 across on a
// wide screen, then 6, 4 and 3, with a short last row centred.
//
// TODO(Allen): the icons are first drafts to redraw.

export type Interest = {
  id: string;
  label: string;
  /** A broad interest: the heads come first, the finer ones after. */
  head?: boolean;
  description: string;
  icon?: string;
  link?: { href: string; label: string };
};

export const INTERESTS = [
  // The heads: the broad interests, first
  { id: "video-games", label: "Video games", head: true, icon: "interest_video_games", description: "I used to play a ton of CS:GO, Valorant, and TFT. I also love roguelikes like Slay the Spire and The Binding of Isaac." },
  { id: "game-design", label: "Game design", head: true, icon: "interest_game_design", description: "I've always been fascinated by game design: its art as well as technical problem solving, allowing one to express two sides of oneself at once. I have a lot of game ideas!" },
  { id: "programming", label: "Programming", head: true, icon: "interest_programming", description: "I'm one of those people who actually love programming for the creative and problem-solving process, which is why I love building end-to-end products." },
  { id: "board-games", label: "Board games", head: true, icon: "interest_board_games", description: "Big fan of board games. I'd love to play more, but I currently don't have people to play with!" },
  { id: "anime-manga", label: "Anime/Manga", head: true, icon: "interest_anime_manga", description: "Some of my favorites: Frieren, Clannad: After Story, Steins;Gate, Attack on Titan, and Gintama." },
  { id: "music", label: "Music", head: true, icon: "interest_music", description: "I mainly listen to a small subset of Japanese artists: Yorushika, Dustcell, Zutomayo, and more." },
  { id: "food", label: "Food", head: true, icon: "interest_food", description: "I'm food motivated. Check out my Beli.", link: { href: "https://beliapp.co/app/awani", label: "@awani on Beli" } },
  { id: "travel", label: "Travel", head: true, icon: "interest_travel", description: "I've visited a few countries in my life. I go to Japan too often. I'm looking forward to my China trip soon, and I can't wait to visit Italy." },
  // The finer ones, after
  { id: "pixel-art", label: "Pixel art", icon: "interest_pixel_art", description: "Incidentally, through building a sprite editor to make pixel art for this website's game, I've gotten to practice pixel art a bit.", link: { href: "/projects/sprite-editor", label: "The sprite editor I built" } },
  { id: "chess", label: "Chess", icon: "interest_chess", description: "I love playing chess puzzles or a quick game, with a friend or against the computer. I play the London as white and the Dutch Defense as black." },
  { id: "japanese", label: "Japanese", icon: "interest_japanese", description: "I'm learning Japanese. I grinded Bunpro for a year straight, and I'm finally taking lessons and learning properly." },
  { id: "trumpet", label: "Trumpet", icon: "interest_trumpet", description: "I used to play the trumpet: state orchestra in high school and for fun in college. I haven't played in a while, but it's still part of my identity." },
  { id: "music-production", label: "Music production", icon: "interest_music_production", description: "I have some beginner experience with music production on Ableton, but it's something I'd love to practice more if I had more time." },
  { id: "ramen", label: "Ramen", icon: "interest_ramen", description: "I want to try every ramen shop in Japan. I also make my own ramen at home sometimes. Frankly, mine tastes better than what you can get in restaurants here." },
  { id: "cooking", label: "Cooking", icon: "interest_cooking", description: "I love making all sorts of food. I make a fire-glazed short rib, and my lasagna goes pretty hard. Every once in a while, I spend three days making ramen." },
  { id: "coffee", label: "Coffee", icon: "interest_coffee", description: "My home cafe keeps growing, and I love trying new cafes. I like coffee that tastes like strawberries and jasmine tea." },
  { id: "china", label: "China", icon: "interest_china", description: "I'm Chinese, but I was briefly born in Canada, before moving to the Bay Area." },
  { id: "hiking", label: "Hiking", icon: "interest_hiking", description: "My favorite part of hiking is burning enough calories to go crazy after. Purisima Creek is my favorite trail in the Bay Area." },
  { id: "gym", label: "Gym", icon: "interest_gym", description: "I take advantage of the free office gym." },
  { id: "pickleball", label: "Pickleball", icon: "interest_pickleball", description: "As is customary in the Bay Area, I sometimes play pickleball with my friends." },
  { id: "photography", label: "Photos", icon: "interest_photography", description: "I take photos occasionally, mostly when I travel, and mostly of food.", link: { href: "https://www.instagram.com/awanniic/", label: "Instagram" } },
  { id: "ucsd", label: "UCSD", icon: "interest_ucsd", description: "I graduated from UCSD with a BS in Computer Science." },
] as const satisfies readonly Interest[];

export type InterestId = (typeof INTERESTS)[number]["id"];

// Heads with heads, then each head with its finer ones, then the finer ones
// with each other.
export const LINKS: readonly (readonly [InterestId, InterestId])[] = [
  // Between the heads
  ["video-games", "game-design"],
  ["video-games", "board-games"],
  ["video-games", "anime-manga"],
  ["game-design", "programming"],
  ["game-design", "board-games"],
  ["anime-manga", "music"],
  ["food", "travel"],
  // Each head and its finer ones
  ["video-games", "pixel-art"],
  ["video-games", "chess"],
  ["game-design", "pixel-art"],
  ["programming", "pixel-art"],
  ["programming", "ucsd"],
  ["board-games", "chess"],
  ["anime-manga", "japanese"],
  ["music", "japanese"],
  ["music", "trumpet"],
  ["music", "music-production"],
  ["food", "ramen"],
  ["food", "cooking"],
  ["food", "coffee"],
  ["food", "hiking"],
  ["food", "photography"],
  ["travel", "japanese"],
  ["travel", "china"],
  ["travel", "ramen"],
  ["travel", "photography"],
  ["travel", "ucsd"],
  // Among the finer ones
  ["ramen", "cooking"],
  ["ramen", "photography"],
  ["cooking", "coffee"],
  ["trumpet", "music-production"],
  ["hiking", "gym"],
  ["hiking", "pickleball"],
  ["gym", "pickleball"],
];

/** The interests one links to, either way round, in the grid's order. */
export function relatedTo(id: string): string[] {
  const linked = new Set<string>();
  for (const [a, b] of LINKS) {
    if (a === id) linked.add(b);
    if (b === id) linked.add(a);
  }
  return INTERESTS.filter((i) => linked.has(i.id)).map((i) => i.id);
}
