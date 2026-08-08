const enhancerBtn = document.getElementById('enhancer-btn');
const enhancerInput = document.getElementById('enhancer-input');
const enhancerOutput = document.getElementById('enhancer-output');
const enhancerResult = document.getElementById('enhancer-result');
const enhancerCopy = document.getElementById('enhancer-copy');

enhancerBtn.addEventListener('click', async () => {
  const prompt = enhancerInput.value.trim();
  if (!prompt) return;

  enhancerBtn.disabled = true;
  enhancerBtn.textContent = 'Enhancing...';

  try {
    const res = await fetch('/api/prompt-enhancer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong');

    enhancerResult.textContent = data.enhanced;
    enhancerOutput.hidden = false;
  } catch (err) {
    enhancerResult.textContent = 'Sorry, something went wrong. Please try again.';
    enhancerOutput.hidden = false;
  } finally {
    enhancerBtn.disabled = false;
    enhancerBtn.textContent = 'Enhance Prompt →';
  }
});

enhancerCopy.addEventListener('click', () => {
  navigator.clipboard.writeText(enhancerResult.textContent);
  enhancerCopy.textContent = 'Copied!';
  setTimeout(() => (enhancerCopy.textContent = 'Copy'), 1500);
});
