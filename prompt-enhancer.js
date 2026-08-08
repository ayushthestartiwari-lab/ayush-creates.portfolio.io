const enhancerBtn = document.getElementById("enhancer-btn");
const enhancerInput = document.getElementById("enhancer-input");
const enhancerOutput = document.getElementById("enhancer-output");
const enhancerResult = document.getElementById("enhancer-result");
const enhancerCopy = document.getElementById("enhancer-copy");

if (
  enhancerBtn &&
  enhancerInput &&
  enhancerOutput &&
  enhancerResult &&
  enhancerCopy
) {
  enhancerBtn.addEventListener("click", async () => {
    const prompt = enhancerInput.value.trim();

    if (!prompt) {
      enhancerResult.textContent = "Please enter a prompt first.";
      enhancerOutput.hidden = false;
      return;
    }

    enhancerBtn.disabled = true;
    enhancerBtn.textContent = "Enhancing...";

    try {
      const res = await fetch("/api/prompt-enhancer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Request failed with status ${res.status}`);
      }

      enhancerResult.textContent = data.enhanced;
      enhancerOutput.hidden = false;
    } catch (err) {
      console.error("Prompt enhancer error:", err);

      enhancerResult.textContent =
        err.message || "Something went wrong. Please try again.";

      enhancerOutput.hidden = false;
    } finally {
      enhancerBtn.disabled = false;
      enhancerBtn.textContent = "Enhance Prompt →";
    }
  });

  enhancerCopy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(enhancerResult.textContent);
      enhancerCopy.textContent = "Copied!";

      setTimeout(() => {
        enhancerCopy.textContent = "Copy";
      }, 1500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  });
}
