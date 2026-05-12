
export type GameCategory = 'numbers' | 'letters' | 'hijaiyah';

export type ActivityType = 'identify' | 'trace' | 'count';

export interface Progress {
  playerName: string;
  stats: {
    [key in GameCategory]: {
      stars: number;
      level: number;
      bestStreak: number;
    };
  };
  unlockedLevel: number;
}

export const INITIAL_PROGRESS: Progress = {
  playerName: '',
  stats: {
    numbers: { stars: 0, level: 1, bestStreak: 0 },
    letters: { stars: 0, level: 1, bestStreak: 0 },
    hijaiyah: { stars: 0, level: 1, bestStreak: 0 },
  },
  unlockedLevel: 1,
};

export const HIJAIYAH = [
  { char: 'ا', name: 'Alif' }, { char: 'ب', name: 'Ba' }, { char: 'ت', name: 'Ta' },
  { char: 'ث', name: 'Tsa' }, { char: 'ج', name: 'Jim' }, { char: 'ح', name: 'Ha' },
  { char: 'خ', name: 'Kho' }, { char: 'د', name: 'Dal' }, { char: 'ذ', name: 'Dzal' },
  { char: 'ر', name: 'Ro' }, { char: 'ز', name: 'Zai' }, { char: 'س', name: 'Sin' },
  { char: 'ش', name: 'Syin' }, { char: 'ص', name: 'Shod' }, { char: 'ض', name: 'Dhod' },
  { char: 'ط', name: 'Tho' }, { char: 'ظ', name: 'Zho' }, { char: 'ع', name: 'Ain' },
  { char: 'غ', name: 'Ghoin' }, { char: 'ف', name: 'Fa' }, { char: 'ق', name: 'Qof' },
  { char: 'ك', name: 'Kaf' }, { char: 'ل', name: 'Lam' }, { char: 'م', name: 'Mim' },
  { char: 'ن', name: 'Nun' }, { char: 'و', name: 'Wawu' }, { char: 'هـ', name: 'Ha' },
  { char: 'لا', name: 'Lam alif' }, { char: 'ء', name: 'Hamzah' }, { char: 'ي', name: 'Ya' }
];

export const NUMBERS = [
  { val: 1, label: 'Satu' }, { val: 2, label: 'Dua' }, { val: 3, label: 'Tiga' },
  { val: 4, label: 'Empat' }, { val: 5, label: 'Lima' }, { val: 6, label: 'Enam' },
  { val: 7, label: 'Tujuh' }, { val: 8, label: 'Delapan' }, { val: 9, label: 'Sembilan' },
  { val: 10, label: 'Sepuluh' }
];

export const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').map(l => ({ char: l, name: l }));
