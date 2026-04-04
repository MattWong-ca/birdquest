export type Rarity = 'Common' | 'Uncommon' | 'Rare';

export interface Bird {
  name: string;
  rarity: Rarity;
}

const CANNES_BIRDS: Bird[] = [
  { name: 'House Sparrow', rarity: 'Common' },
  { name: 'European Robin', rarity: 'Common' },
  { name: 'Common Blackbird', rarity: 'Common' },
  { name: 'Yellow-legged Gull', rarity: 'Common' },
  { name: 'Barn Swallow', rarity: 'Common' },
  { name: 'Common Swift', rarity: 'Common' },
  { name: 'Great Tit', rarity: 'Common' },
  { name: 'Blue Tit', rarity: 'Common' },
  { name: 'Common Chaffinch', rarity: 'Common' },
  { name: 'European Greenfinch', rarity: 'Common' },
  { name: 'European Goldfinch', rarity: 'Common' },
  { name: 'Rock Pigeon', rarity: 'Common' },
  { name: 'Eurasian Collared Dove', rarity: 'Common' },
  { name: 'Common Magpie', rarity: 'Common' },
  { name: 'Eurasian Jackdaw', rarity: 'Common' },
  { name: 'Sardinian Warbler', rarity: 'Common' },
  { name: 'Common Nightingale', rarity: 'Uncommon' },
  { name: 'Hoopoe', rarity: 'Uncommon' },
  { name: 'Eurasian Bee-eater', rarity: 'Uncommon' },
  { name: 'Eurasian Blackcap', rarity: 'Common' },
  { name: 'Common Kestrel', rarity: 'Uncommon' },
  { name: 'Peregrine Falcon', rarity: 'Rare' },
  { name: 'Eurasian Sparrowhawk', rarity: 'Uncommon' },
  { name: 'Common Buzzard', rarity: 'Uncommon' },
  { name: 'Short-toed Snake Eagle', rarity: 'Rare' },
  { name: 'Little Egret', rarity: 'Uncommon' },
  { name: 'Grey Heron', rarity: 'Uncommon' },
  { name: 'Great Cormorant', rarity: 'Common' },
  { name: 'Mallard', rarity: 'Common' },
  { name: 'Eurasian Coot', rarity: 'Common' },
  { name: 'Common Kingfisher', rarity: 'Rare' },
  { name: 'Grey Wagtail', rarity: 'Uncommon' },
  { name: 'White Wagtail', rarity: 'Common' },
  { name: 'Crested Lark', rarity: 'Uncommon' },
  { name: 'Common Stonechat', rarity: 'Uncommon' },
  { name: 'Northern Wheatear', rarity: 'Uncommon' },
  { name: "Cetti's Warbler", rarity: 'Uncommon' },
  { name: 'Great Reed Warbler', rarity: 'Uncommon' },
  { name: 'House Martin', rarity: 'Common' },
  { name: 'Eurasian Jay', rarity: 'Common' },
  { name: 'Song Thrush', rarity: 'Common' },
  { name: 'Spotted Flycatcher', rarity: 'Uncommon' },
  { name: 'Booted Eagle', rarity: 'Rare' },
  { name: 'Black Redstart', rarity: 'Common' },
  { name: 'Common Whitethroat', rarity: 'Uncommon' },
  { name: 'Subalpine Warbler', rarity: 'Uncommon' },
  { name: 'Rock Sparrow', rarity: 'Uncommon' },
  { name: 'Eurasian Scops Owl', rarity: 'Rare' },
  { name: 'European Turtle Dove', rarity: 'Rare' },
  { name: "Western Bonelli's Warbler", rarity: 'Rare' },
];

export function findBird(name: string): Bird | undefined {
  return CANNES_BIRDS.find(b => b.name.toLowerCase() === name.toLowerCase());
}
