const form = document.querySelector('#question-form');
const question = document.querySelector('#question');
const messages = document.querySelector('#messages');
const send = document.querySelector('#send');
const clear = document.querySelector('#clear');
const error = document.querySelector('#error');
const suggestions = [...document.querySelectorAll('[data-question]')];
const welcome = document.querySelector('#welcome');
let busy = false;


function addMessage(speaker, text, className) {
  const article = document.createElement('article');
  article.className = `message ${className}`;
  const label = document.createElement('div');
  label.className = 'speaker';
  label.textContent = speaker;
  const body = document.createElement('p');
  body.className = 'body';
  body.textContent = text;
  article.append(label, body);
  messages.append(article);
  messages.scrollTop = messages.scrollHeight;
  return article;
}

async function ask() {
  const text = question.value.trim();
  if (busy || !text || !form.reportValidity()) return;
  busy = true;
  error.hidden = true;
  welcome.hidden = true;
  send.disabled = true;
  send.textContent = 'Asking…';
  question.disabled = true;
  clear.disabled = true;
  suggestions.forEach(function disableSuggestion(button) {
    button.disabled = true;
  });
  addMessage('You', text, 'user');
  const pending = addMessage('Café Linden', 'Checking our café information…', 'pending');
  messages.setAttribute('aria-busy', 'true');
  try {
    const response = await fetch('/ask', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: text }), signal: AbortSignal.timeout(180_000),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'We could not answer your question. Please try again.');
    if (typeof result.answer !== 'string' || !Array.isArray(result.toolsUsed)) {
      throw new Error('The café returned an unexpected response. Please try again.');
    }
    pending.remove();
    const answer = addMessage('Café Linden', result.answer, 'assistant');
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = 'Tools used';
    const toolNames = document.createElement('p');
    toolNames.textContent = result.toolsUsed.length ? result.toolsUsed.join(' · ') : 'No tools used';
    details.append(summary, toolNames);
    answer.append(details);
    question.value = '';
  } catch (cause) {
    pending.remove();
    error.textContent = cause instanceof Error && cause.name === 'TimeoutError'
      ? 'This is taking longer than expected. Your question is still below. Please try again.'
      : cause instanceof TypeError ? 'Could not reach the café. Check your connection and try again.'
      : cause instanceof Error ? cause.message : 'Something went wrong. Please try again.';
    error.hidden = false;
  } finally {
    busy = false;
    messages.setAttribute('aria-busy', 'false');
    send.disabled = false;
    send.textContent = 'Send ↗';
    question.disabled = false;
    clear.disabled = false;
    clear.hidden = false;
    suggestions.forEach(function enableSuggestion(button) {
      button.disabled = false;
    });
    question.focus();
    messages.scrollTop = messages.scrollHeight;
  }
}

form.addEventListener('submit', function submitQuestion(event) {
  event.preventDefault();
  void ask();
});
question.addEventListener('keydown', function handleQuestionKey(event) {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    form.requestSubmit();
  }
});
suggestions.forEach(function registerSuggestion(button) {
  button.addEventListener('click', function askSuggestedQuestion() {
    question.value = button.dataset.question;
    void ask();
  });
});
clear.addEventListener('click', function clearConversation() {
  if (busy) return;
  messages.querySelectorAll('.message').forEach(function removeMessage(message) {
    message.remove();
  });
  welcome.hidden = false;
  clear.hidden = true;
  error.hidden = true;
  question.focus();
});
