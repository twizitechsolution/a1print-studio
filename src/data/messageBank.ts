// Curated Message Bank for Birthday, Anniversary, and Romantic Gifts
export const BIRTHDAY_MESSAGES = [
  "Happy Birthday to the one who holds my heart forever! ❤️",
  "May your special day be as beautiful and extraordinary as you are ✨",
  "Wishing you a day filled with laughter, love, and sweet memories! 🎉",
  "You make every single moment brighter. Happy Birthday my love! 🎂",
  "To the world you may be one person, but to me you are the world ❤️",
  "Cheering for another year of creating wonderful memories together!",
  "Happy Birthday! May your day be blessed with joy and happiness ✨",
  "Forever grateful for your love, your smile, and your beautiful soul ❤️",
  "Sending you endless love and warm hugs on your special birthday 🎁",
  "Another year older, another year wiser, and a million times more loved!",
  "Happy Birthday! You deserve all the happiness in the universe 🌟",
  "To my favorite person on Earth: May all your birthday wishes come true! ❤️",
  "Happy Birthday! Thank you for being my anchor and my best friend 💕",
  "Every day with you is a gift, but today is the most special of all ✨",
  "Wishing you a magical birthday filled with sweetness and love 🎉",
];

export function getRandomBirthdayMessage(currentMsg?: string): string {
  const filtered = BIRTHDAY_MESSAGES.filter((msg) => msg !== currentMsg);
  const randomIndex = Math.floor(Math.random() * filtered.length);
  return filtered[randomIndex] || BIRTHDAY_MESSAGES[0];
}
