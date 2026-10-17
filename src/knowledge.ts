export const cafeKnowledge = [
  { id: 'coffee', text: 'Café Linden serves espresso for 30 SEK, filter coffee for 35 SEK, and cappuccino for 45 SEK.' },
  { id: 'milk', text: 'Café Linden offers oat milk at no extra charge. Coffee made with oat milk is vegan.' },
  { id: 'pastries', text: 'Café Linden sells cinnamon buns for 40 SEK. The cinnamon buns contain wheat, milk, and butter and are not vegan.' },
  { id: 'lunch', text: 'Café Linden serves a vegan hummus sandwich for 85 SEK and vegetarian tomato soup for 95 SEK. Lunch is served from 11:00 to 14:00.' },
  { id: 'gluten', text: 'Café Linden has a gluten-free chocolate cake for 50 SEK. It contains eggs and milk. The kitchen handles wheat, so cross-contact is possible.' },
] as const;

export function getCafeInfo(): string {
  return 'Café Linden is a fictional café at Examplegatan 12, Stockholm. Opening hours: Monday to Friday 08:00–17:00, Saturday 09:00–15:00, closed Sunday. Email: hello@cafe-linden.example. Contact the café by email for reservation enquiries.';
}
