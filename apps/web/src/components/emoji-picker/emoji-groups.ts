export interface EmojiGroup {
  label: string;
  emoji: string[];
}

export const EMOJI_GROUPS: EmojiGroup[] = [
  {
    label: "Food & drink",
    emoji: ["🍕", "🍔", "🍜", "🍣", "🍱", "🍦", "☕", "🧃", "🍷", "🧁"],
  },
  {
    label: "Transport",
    emoji: ["🚗", "🚌", "🚆", "✈️", "🛵", "🚲", "⛽", "🛻", "🚕", "🚐"],
  },
  {
    label: "Home & bills",
    emoji: ["🏠", "💡", "📱", "🌊", "🔑", "🛒", "🛋️", "🧹", "🔧", "🏗️"],
  },
  {
    label: "Shopping",
    emoji: ["👕", "👟", "👜", "💄", "🛍️", "💍", "⌚", "📦", "🎁", "🧴"],
  },
  {
    label: "Health",
    emoji: ["💊", "🏥", "🩺", "🦷", "🏃", "🧘", "🌿", "👓", "💉", "🧬"],
  },
  {
    label: "Fun",
    emoji: ["🎬", "🎮", "🎵", "🎭", "📚", "🎳", "🎨", "🎤", "🎲", "🎯"],
  },
  {
    label: "Money & work",
    emoji: ["💼", "💰", "🏦", "💳", "📈", "🧾", "📊", "💵", "🪙", "🏧"],
  },
  {
    label: "Travel & goals",
    emoji: ["🌍", "🏖️", "🏔️", "🗺️", "⛱️", "🎒", "🏕️", "🌅", "🗼", "🎡"],
  },
];
