import { test } from 'node:test';
import assert from 'node:assert/strict';
import { guideReply, MAX_QUESTIONS } from '../src/lib/support/guide.ts';
import { supportContacts } from '../src/lib/support/contact.ts';

test('greets visitors and explains what the guide can do', () => {
  for (const question of ['hello', 'how can you help', 'How can you help?', 'I need help']) {
    const answer = guideReply(question);
    assert.equal(answer.topic, 'help'); assert.match(answer.text, /compare prices/);
    assert.ok(answer.suggestions.length);
  }
});
test('answers specific app questions with real paths and prioritizes intent', () => {
  for (const [question, topic, path] of [
    ['How do I compare prices?', 'compare', '/pet-data'],
    ['Where are my saved deals?', 'saved', '/dashboard/saved'],
    ['Report a wrong vendor location', 'report', '/vendors'],
    ['List my business', 'business', '/vendors/list-your-business'],
    ['No products showing', 'empty', '/pet-data'],
    ['Change my country', 'country', '/pet-data#product-filters'],
    ['Where are nearby groomers?', 'map', '/vendors?view=map'],
    ['How do vendor discounts work?', 'offers', '/deals'],
  ]) {
    const answer = guideReply(question);
    assert.equal(answer.topic, topic); assert.ok(answer.links.some(link => link.path === path));
  }
});
test('short follow-ups use context, not the generic fallback', () => {
  const first = guideReply('Compare products');
  const second = guideReply('Tell me more', first.topic, 1);
  assert.equal(second.topic, 'compare'); assert.match(second.text, /pack sizes/);
  assert.notEqual(first.text, second.text);
});
test('keeps conversation bounded and redirects unsupported questions', () => {
  assert.equal(guideReply('Hi', '', MAX_QUESTIONS).topic, 'limit');
  assert.match(guideReply('x'.repeat(241)).text, /240 characters/);
  const unrelated = guideReply('Write a novel about space');
  assert.equal(unrelated.topic, 'help'); assert.equal(unrelated.links.length, 0);
  assert.doesNotMatch(unrelated.text, /WhatsApp|connect you/);
  assert.equal(guideReply('My dog is sick, what medication dose?').topic, 'health');
});

test('offers separate support contact without claiming a human handoff', () => {
  assert.equal(guideReply('Can I talk to a human on WhatsApp?').topic, 'support');
  const links = supportContacts('+43 678 1288256', 'https://example.com/help');
  assert.equal(links.whatsapp, 'https://wa.me/436781288256');
  assert.equal(links.help, 'https://example.com/help');
  assert.deepEqual(supportContacts('', 'javascript:alert(1)'), { whatsapp: '', help: '' });
});
