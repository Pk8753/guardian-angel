import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ADJECTIVES = [
  'Silent', 'Swift', 'Solar', 'Lunar', 'Silver', 'Amber', 'Brave', 'Stalwart',
  'Serene', 'Alert', 'Gentle', 'Wired', 'Cosmic', 'Vibrant', 'Noble', 'Clever',
  'Radiant', 'Kind', 'Quiet', 'Patient', 'Ancient', 'Golden', 'Emerald', 'Sapphire'
];

const ANIMALS = [
  'Falcon', 'Otter', 'Hawk', 'Sequoia', 'Willow', 'Dolphin', 'Eagle', 'Gazelle',
  'Cheetah', 'Pine', 'Orchid', 'Fox', 'Wolf', 'Cedar', 'Panda', 'Lion', 'Lynx',
  'Owl', 'Bear', 'Tiger', 'Raven', 'Robin', 'Swallow', 'Badger'
];

export function generatePseudonym(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${adj}-${animal}-${num}`;
}

