# PetSquare app guide

The floating chat is a small, automated application guide, available once in the
root layout across pages. It uses reviewed answers in `src/lib/support/guide.ts`;
no AI service, API key, database migration or external chat provider is required.

It covers product search, comparison, shortlists versus account-saved items,
country filters, maps, offers, reporting, sign-in, pet profiles, business listings,
language and theme controls. Suggested questions and localized page links help
visitors take the next step. “Tell me more” follows the previous help topic.

Each chat allows six questions of up to 240 characters. Start new chat clears the
conversation and resets the limit. Closing preserves the conversation while the
app remains mounted; a full reload clears it. Questions are processed in the
browser and are not sent to an AI provider or stored by the guide.

Answers are currently in English, with links following the selected app locale.
The guide cannot inspect accounts, submit reports, change listings, place orders,
offer treatment advice or automatically hand a conversation to a human. Unsupported
questions return useful app topics. A separate WhatsApp support button remains
available even after the guide's question limit; conversations are not forwarded.

The button uses the number previously configured in the widget: +43 678 1288256.
Override it in `.env.local` and deployment settings with
`NEXT_PUBLIC_SUPPORT_WHATSAPP=436781288256` (international digits, no leading zero).
Set it to an empty value to hide WhatsApp. Add an optional HTTPS help/contact page
using `NEXT_PUBLIC_SUPPORT_URL=https://your-site.example/help`. These are public
contact settings; rebuild the app after changing them. No support response time
or agent availability is promised.

```sh
npm run test:guide
npm run build
npm run start -- --port 3100
# In another terminal, with Chrome installed:
npm run test:guide:browser
```

Browser checks cover helpful answers, follow-up context, localized links, the
question limit, reset, mobile bounds, keyboard focus and navigation. Set `TEST_URL`
to test another page or port and `TEST_BROWSER` to use a different installed browser
channel. Keep help text aligned with the actual UI when adding or changing features.
