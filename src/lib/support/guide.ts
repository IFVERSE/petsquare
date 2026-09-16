export const MAX_QUESTIONS = 6;
export const MAX_MESSAGE_LENGTH = 240;
export type GuideReply = { text: string; topic: string; links: { label: string; path: string }[]; suggestions: string[] };
type Topic = { match: RegExp; text: string; more: string; links: GuideReply['links']; suggestions: string[] };
const topics: Record<string, Topic> = {
  empty: { match: /\b(empty|blank|no results|no products|not loading|nothing showing|nothing shows|cannot find|cant find|can't find|not working|unavailable|stuck|broken)\b/i,
    text: 'Try Reset filters, choose All countries, and turn off price or stock filters. On Live products, select Refresh products. If a source is unavailable, your last loaded results stay visible. You can also browse vendor websites directly.',
    more: 'Check your connection and reload the page once. Unknown-market products only appear under All countries. Refresh reads the latest saved products; it does not run a new scrape. If the list is still empty, try Deals or Vendors while new results are collected.',
    links: [{ label: 'Open product finder', path: '/pet-data' }, { label: 'Browse vendors', path: '/vendors' }], suggestions: ['Choose my country', 'Find pet offers'] },
  compare: { match: /\b(compar(?:e|ing|ison)|unit price|per kilo|per kg|pack size|value for money)\b/i,
    text: 'Open Live products and tap Compare on up to three cards. Select Compare details to see prices, pack sizes, retailer information and unit prices where available. Choose a currency before sorting products by price.',
    more: 'Remove a selected product to add a different one. Check that pack sizes and currencies are comparable. Unit prices are calculated only when the retailer supplies a usable pack size; delivery costs are not included.',
    links: [{ label: 'Compare products', path: '/pet-data' }], suggestions: ['Save a product', 'Choose my country'] },
  saved: { match: /\b(sav(?:e|ed|ing)|shortlist|favourites?|favorites?|heart|bookmark)\b/i,
    text: 'On Live products, tap a product’s heart, then open Shortlist. This list is saved in your current browser without signing in. Saved vendors and deals are separate: sign in and open Saved in your dashboard.',
    more: 'A product missing from current results can appear as a saved snapshot—check its retailer before buying. Clearing browser storage removes the product shortlist, and it will not follow you to another device. Tap the heart again to remove an item.',
    links: [{ label: 'My product shortlist', path: '/pet-data' }, { label: 'Account saved items', path: '/dashboard/saved' }], suggestions: ['Compare products', 'Help signing in'] },
  country: { match: /\b(country|countries|location filter|personaliz(?:e|ation)|personalis(?:e|ation)|region|local products)\b/i,
    text: 'Choose your country in the homepage country selector or Retailer country on Live products. PetSquare remembers it in this browser and uses it to filter listings. Country means the retailer’s market, so confirm delivery coverage on their website.',
    more: 'Choose All countries to include products with an unknown market. On Live products you can also select a pet, product category, currency and maximum price. If a combination returns nothing, select Reset filters.',
    links: [{ label: 'Set product filters', path: '/pet-data#product-filters' }], suggestions: ['No products showing', 'Add my pet'] },
  map: { match: /\b(map|directions|near me|nearby|location|where are|vets?|veterinarians?|groomers?|grooming|boarding|training|walkers?|vendors?)\b/i,
    text: 'Open Vendors, choose a country and category, then switch to Map. Only supplied coordinates appear on the map. Open a vendor profile for its website and contact information; check availability directly with the business.',
    more: 'If map tiles do not load, use the map’s retry control or switch back to List. A missing pin means the listing has no usable coordinates—it does not mean the business is closed.',
    links: [{ label: 'Explore vendor map', path: '/vendors?view=map' }], suggestions: ['Choose my country', 'Report incorrect information'] },
  report: { match: /\b(report|incorrect|wrong|closed business|fake|misleading)\b/i,
    text: 'Open the relevant vendor profile and choose Report Vendor. Select the reason and submit the report, signing in if requested. I can explain the steps, but I cannot submit or check a report for you.',
    more: 'Use the vendor’s own website to confirm details before acting on a listing. Reporting information does not immediately change it; reports are reviewed by the site’s moderation team.',
    links: [{ label: 'Find the vendor', path: '/vendors' }], suggestions: ['Find pet offers', 'Help signing in'] },
  account: { match: /\b(sign ?in|sign ?up|log ?in|login|account|password|register)\b/i,
    text: 'Use Sign in in the navigation bar. New here? Choose the sign-up option. If sign-in fails, check the email address, password and any confirmation email, then try again. I cannot view your account or reset credentials.',
    more: 'You can browse products without an account. Product shortlists stay in your browser, while saved vendors, saved deals and pet profiles use your account. Only enter your password on the sign-in form, not in this chat.',
    links: [{ label: 'Sign in', path: '/auth/sign-in' }, { label: 'Create an account', path: '/auth/sign-up' }], suggestions: ['Save a product', 'Add my pet'] },
  pet: { match: /\b(my pet|pet profile|add.*pet|pet dashboard|pet owner)\b/i,
    text: 'Sign in, open your dashboard and choose My Pets. Add your pet’s details there. For a quick product search, use the Dogs, Cats, Birds, Fish or Small pets filters on Live products.',
    more: 'Pet labels help narrow the listings. Always check the retailer’s size, age and product details for your own pet. Country and price filters can help narrow your choices further.',
    links: [{ label: 'Manage pet profiles', path: '/dashboard/pets' }, { label: 'Browse pet products', path: '/pet-data' }], suggestions: ['Choose my country', 'Compare products'] },
  business: { match: /\b(list.*business|for vendors|vendor dashboard|my business|become.*vendor|sell|seller|publish)\b/i,
    text: 'Open For Vendors, then List Your Business. Sign in and follow the listing form. If you already manage a business, use the Business dashboard for its profile and products. I cannot publish or approve a listing from this chat.',
    more: 'Use the business’s real website and contact details, then review the form before submitting. You can return to the Business dashboard after signing in to manage available options.',
    links: [{ label: 'List your business', path: '/vendors/list-your-business' }, { label: 'Business dashboard', path: '/dashboard/business' }], suggestions: ['Help signing in', 'Report incorrect information'] },
  offers: { match: /\b(deals?|offers?|discounts?|sales?|coupons?|timers?|countdown|expired)\b/i,
    text: 'Open Deals for product discounts and recently spotted website offers. A countdown uses a supplied deadline; other timers may be unconfirmed. Select Check offer or Check retailer to confirm the final price, conditions and availability.',
    more: '“Up to” is the retailer’s advertised maximum, not a guaranteed saving on every item. If an offer has expired or differs at checkout, use the retailer’s current information. PetSquare does not take payment or apply coupons for you.',
    links: [{ label: 'Explore deals', path: '/deals' }], suggestions: ['Compare products', 'Report incorrect information'] },
  products: { match: /\b(products?|search|find|shop|buy|food|toys?|prices?|budgets?|filters?)\b/i,
    text: 'Open Live products. Search a product or brand, select your pet and country, then narrow by category. Choose a currency to set a maximum price or sort by price. Check retailer opens the seller’s website to continue shopping.',
    more: 'Use Price reductions only for listed discounts, or Checked in the last 48 hours for recent checks. Tap a heart to save a product and Compare to review up to three picks. Share search copies a link to your filters.',
    links: [{ label: 'Find products', path: '/pet-data' }], suggestions: ['Compare products', 'Save a product', 'No products showing'] },
  language: { match: /\b(language|translate|translation|english|german|french)\b/i,
    text: 'Use the language selector in the top navigation to choose an app language. This short guide currently answers in English; its page links follow your selected app language.',
    more: 'The language setting changes the app language, not your country filter. Choose your retailer country separately when looking for local listings.',
    links: [], suggestions: ['Choose my country', 'Find products'] },
  theme: { match: /\b(theme|dark mode|light mode|appearance)\b/i,
    text: 'Use Theme in the top navigation to choose the appearance you prefer. Your browser remembers the selection.', more: 'If the appearance seems unchanged, reload the page and try the Theme control again.', links: [], suggestions: ['How can you help?'] },
};
const welcome: GuideReply = { text: 'Hi! I’m the PetSquare app guide. I can help you find products, compare prices, save favourites, choose a country or solve simple navigation problems. What would you like to do?', topic: 'help', links: [], suggestions: ['Find products', 'Compare products', 'No products showing', 'Help signing in'] };
export function welcomeReply(): GuideReply { return { ...welcome }; }
export function guideReply(input: string, previousTopic = '', questions = 0): GuideReply {
  if (questions >= MAX_QUESTIONS) return { text: 'That’s our six-question guide. Use the page links above, or choose Start new chat for another short guide.', topic: 'limit', links: [], suggestions: [] };
  if (input.length > MAX_MESSAGE_LENGTH) return { text: 'Please keep your question to 240 characters so I can help with one thing at a time.', topic: 'help', links: [], suggestions: welcome.suggestions };
  const query = input.toLowerCase().replace(/[’]/g, "'").replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim();
  if (/\b(whatsapp|human|contact|customer support|customer service|support team|talk to someone|agent|more support)\b/.test(query)) return { text: 'I’m the automated app guide. For help beyond these short answers, use the support links below to open a separate conversation. Your messages here are not forwarded, and I cannot check support availability or promise a response time.', topic: 'support', links: [], suggestions: ['How can you help?', 'Help signing in'] };
  if (/\b(emergency|poison|bleeding|sick|dose|dosage|medication|diagnos|pain|injur)\w*\b/.test(query)) return { text: 'I’m an application guide and cannot assess symptoms or recommend treatment. Please contact a veterinarian for health advice. I can help you find veterinary listings.', topic: 'health', links: [{ label: 'Find veterinary services', path: '/vendors' }], suggestions: ['Find nearby vendors'] };
  if (/^(thanks?|thank you|cheers|bye|goodbye)( so much)?$/.test(query)) return { text: 'You’re welcome! Use the links above whenever you’re ready. I’m here for another quick app question if you need one.', topic: 'help', links: [], suggestions: ['Find products', 'Choose my country'] };
  if (/^(hi|hello|hey|help|help me|please help|i need help|hello there|hi there|how can you help|how can you help me|how can u help|what can you do|what do you do|how does this work|how does petsquare work|who are you)$/.test(query)) return welcomeReply();
  if (/^(more|tell me more|yes|how|how do i do that|what next|next|steps|explain|show me|please explain|still stuck|that didn t work)$/.test(query) && Object.hasOwn(topics, previousTopic)) {
    const topic = topics[previousTopic];
    return { text: topic.more, topic: previousTopic, links: topic.links, suggestions: topic.suggestions };
  }
  const order = ['empty', 'report', 'business', 'compare', 'saved', 'country', 'language', 'theme', 'pet', 'account', 'offers', 'map', 'products'];
  const found = order.map(id => [id, topics[id]] as const).find(([, topic]) => topic.match.test(query));
  if (found) { const [id, topic] = found; return { text: topic.text, topic: id, links: topic.links, suggestions: ['Tell me more', ...topic.suggestions].slice(0, 3) }; }
  return { text: 'I can help with using PetSquare, but I don’t have a guide for that question. Try one of these topics, or ask about products, saved items, country filters, deals or signing in.', topic: 'help', links: [], suggestions: welcome.suggestions };
}
