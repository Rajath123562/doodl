/**
 * DOODL Curated Word Engine & Dictionary Manifest
 * High-quality, safe, drawable, licensed/original words.
 */

import { normalizeGuess, isCloseGuess } from '../shared/rules';
import type { WordPackId, WordCandidate } from '../shared/game-types';

export const WORD_BANKS: Record<Exclude<WordPackId, 'custom'>, string[]> = {
  everyday: [
    'Pizza', 'Bicycle', 'Teapot', 'Guitar', 'Umbrella', 'Backpack', 'Toaster',
    'Toothbrush', 'Candle', 'Mirror', 'Pillow', 'Flashlight', 'Ladder', 'Sunglasses',
    'Alarm Clock', 'Hammer', 'Scissors', 'Envelope', 'Key', 'Book', 'Camera',
    'Headphones', 'Wristwatch', 'Notebook', 'Paintbrush', 'Coffee Cup', 'Spoon',
    'Wooden Chair', 'Dining Table', 'Window', 'Doorbell', 'Desk Lamp', 'Blanket',
    'Water Bottle', 'Wallet', 'Suitcase', 'Violin', 'Drum Set', 'Whistle', 'Bell',
    'Glasses', 'Sneakers', 'Hat', 'Sweater', 'Microphone', 'Radio', 'Television',
    'Refrigerator', 'Oven', 'Blender', 'Broom', 'Bucket', 'Soap', 'Towel'
  ],
  animals: [
    'Cat', 'Giraffe', 'Octopus', 'Elephant', 'Penguin', 'Kangaroo', 'Dolphin',
    'Owl', 'Butterfly', 'Squirrel', 'Chameleon', 'Hedgehog', 'Panda', 'Zebra',
    'Flamingo', 'Crocodile', 'Koala', 'Rabbit', 'Fox', 'Brown Bear', 'Tiger',
    'Lion', 'Blue Whale', 'Sea Turtle', 'Jellyfish', 'Parrot', 'Peacock', 'Bald Eagle',
    'Hamster', 'Sloth', 'Monkey', 'Tree Frog', 'Honey Bee', 'Ladybug', 'Spider',
    'Seahorse', 'Starfish', 'Crab', 'Lobster', 'Camel', 'Hippo', 'Rhino',
    'Wolf', 'Deer', 'Otter', 'Beaver', 'Bat', 'Pelican', 'Swan', 'Duck'
  ],
  food: [
    'Pancake', 'Ice Cream', 'Taco', 'Sushi', 'Watermelon', 'Popcorn', 'Sandwich',
    'Cupcake', 'Hamburger', 'Pretzel', 'Donut', 'Spaghetti', 'Strawberry', 'Croissant',
    'Avocado', 'Cheese', 'Banana', 'Pineapple', 'Chocolate Cookie', 'Blueberry Muffin',
    'Cherry', 'Grapes', 'Red Apple', 'Orange', 'Hot Dog', 'Green Salad', 'Bowl of Soup',
    'Apple Pie', 'Waffle', 'Burrito', 'Ramen Noodles', 'Birthday Cake', 'Lollipop',
    'French Fries', 'Roast Chicken', 'Peanut Butter', 'Watermelon Slice', 'Mango',
    'Peach', 'Fried Egg', 'Bacon', 'Bagel', 'Dumpling', 'Corn on the Cob'
  ],
  places: [
    'Castle', 'Lighthouse', 'Desert Island', 'Pyramid', 'Igloo', 'Volcano', 'Hospital',
    'Public Library', 'Windmill', 'Airport Runway', 'Sports Stadium', 'Campfire',
    'Suspension Bridge', 'Skyscraper', 'Playground', 'Art Museum', 'Train Station',
    'Red Barn', 'Sandy Beach', 'Deep Forest', 'Dark Cave', 'Waterfall', 'Hot Desert',
    'Snowy Mountain', 'Amusement Park', 'Space Station', 'Circus Tent', 'Harbor Dock',
    'Supermarket', 'Movie Theater', 'Schoolhouse', 'Police Station', 'Firehouse'
  ],
  objects: [
    'Telescope', 'Microscope', 'Toy Robot', 'Yellow Submarine', 'Space Rocket',
    'Golden Compass', 'Ship Anchor', 'Parachute', 'Knight Sword', 'Shield',
    'Royal Crown', 'Gold Trophy', 'Magnifying Glass', 'World Globe', 'Hourglass',
    'Horseshoe Magnet', 'Boombox', 'Typewriter', 'Doctor Stethoscope', 'Binoculars',
    'Surfboard', 'Skateboard', 'Hoverboard', 'Yo-Yo', 'Boomerang', 'Dartboard',
    'Metal Safe', 'Jigsaw Puzzle', 'Flying Kite', 'Camping Lantern', 'Anchor'
  ],
  nature: [
    'Rainbow', 'Sunflower', 'Snowflake', 'Lightning Bolt', 'Cactus', 'Floating Iceberg',
    'Palm Tree', 'Waterfall', 'Tornado', 'Passing Comet', 'Wild Mushroom', 'Moon Crater',
    'Full Moon', 'Shooting Star', 'Coral Reef', 'Mountain Glacier', 'Northern Lights',
    'Sandcastle', 'Deep Canyon', 'Hot Geyser', 'Autumn Leaf', 'Pine Cone',
    'Sea Shell', 'Raindrop', 'Ocean Wave', 'Solar Eclipse', 'Thundercloud', 'Dandelion'
  ],
  sports: [
    'Basketball', 'Bowling Ball', 'Soccer Ball', 'Bow and Arrow', 'Snow Skis',
    'Skateboard Ramp', 'Surfboard', 'Tennis Racket', 'Boxing Gloves', 'Golf Club',
    'Volleyball Net', 'Baseball Bat', 'Badminton Racket', 'Fencing Foil', 'Scuba Mask',
    'Rock Climbing Wall', 'Curling Stone', 'Karate Belt', 'Rugby Ball', 'Ice Skates',
    'Cricket Bat', 'Heavy Barbells', 'Ping Pong Paddle', 'Rowing Canoe', 'Bicycle Helmet'
  ],
  science: [
    'Atom Model', 'DNA Helix', 'Glass Beaker', 'Test Tube Rack', 'Horseshoe Magnet',
    'Planet Saturn', 'Solar Flare', 'Black Hole', 'Light Prism', 'Car Battery',
    'Electric Lightbulb', 'Microchip Circuit', 'Dinosaur Skeleton', 'Falling Meteor',
    'Space Telescope', 'Mercury Thermometer', 'Orbiting Satellite', 'Solar Panel Array',
    'Petri Dish', 'Rocket Booster', 'Mechanical Robot Arm', 'Laser Beam', 'Space Rover'
  ]
};

/**
 * Selects count (default 3) distinct candidate words from the requested pack.
 */
export function selectCandidateWords(
  packId: WordPackId,
  count = 3,
  customWords: string[] = []
): WordCandidate[] {
  let pool: string[];

  if (packId === 'custom' && customWords && customWords.length > 0) {
    pool = customWords;
  } else {
    pool = WORD_BANKS[packId as Exclude<WordPackId, 'custom'>] || WORD_BANKS.everyday;
  }

  // Shuffle and pick
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  // If pool has fewer than count, pad from everyday
  if (selected.length < count) {
    for (const fallback of WORD_BANKS.everyday) {
      if (!selected.includes(fallback)) {
        selected.push(fallback);
        if (selected.length >= count) break;
      }
    }
  }

  return selected.map((word, i) => ({
    id: `cand_${i + 1}_${Date.now()}`,
    word,
  }));
}

/**
 * Evaluates a submitted guess against the secret word.
 */
export function checkGuess(secretWord: string, guess: string): 'CORRECT' | 'CLOSE' | 'WRONG' {
  const normSecret = normalizeGuess(secretWord);
  const normGuess = normalizeGuess(guess);

  if (!normSecret || !normGuess) return 'WRONG';
  if (normSecret === normGuess) return 'CORRECT';
  if (isCloseGuess(normSecret, normGuess)) return 'CLOSE';
  return 'WRONG';
}

/**
 * Generates hints for a word by revealing up to 2 letters at 1/3 and 2/3 time marks.
 */
export function getHintIndices(word: string, hintLevel: number): number[] {
  if (hintLevel <= 0) return [];
  const chars = Array.from(word);
  const letterIndices: number[] = [];

  chars.forEach((c, i) => {
    if (/[a-zA-Z0-9]/.test(c)) {
      letterIndices.push(i);
    }
  });

  if (letterIndices.length <= 3) {
    // Only 1 hint for very short words
    return hintLevel >= 1 ? [letterIndices[1] ?? letterIndices[0]] : [];
  }

  // Deterministic positions based on word length
  const first = letterIndices[Math.floor(letterIndices.length * 0.33)];
  if (hintLevel === 1) return [first];

  const second = letterIndices[Math.floor(letterIndices.length * 0.67)];
  return [first, second];
}
