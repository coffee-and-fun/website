const btn = document.getElementById("transcribe");
const input = document.getElementById("audioInput");
const alertMessage = document.getElementById("messageAI");

// Replace div with a textarea for animated typing
const transcriptArea = document.createElement("textarea");
transcriptArea.id = "transcriptArea";
transcriptArea.className = "textarea textarea-bordered w-full mt-4";
transcriptArea.rows = 12;
transcriptArea.placeholder = "Transcription will appear here...";
transcriptArea.readOnly = true;
const oldDiv = document.getElementById("transcript");
oldDiv.replaceWith(transcriptArea);

async function waitForModel(maxWait = 600000, interval = 5000) {
  const start = Date.now();

  while (Date.now() - start < maxWait) {
    const status = await LanguageModel.availability({
      expectedInputs: [{ type: "audio" }],
    });

    console.log("Model status:", status);

    if (status === "available") return "available";
    if (status === "unavailable") return "unavailable";

    let message = `⏳ Waiting for model… (${status})`;

    if (status === "downloadable") {
      message +=
        "\n🧠 Downloading model in the background. This may take a few minutes.";
    }

    if (status === "maybe_available") {
      message += "\n🌀 Model is being initialized. Hold tight!";
    }

    transcriptArea.value = message;
    await new Promise((res) => setTimeout(res, interval));
  }

  return "timeout";
}

async function init() {
  if (!window.LanguageModel) {
    alertMessage.innerText =
      "❌ LanguageModel API is not available in this browser.";
    btn.disabled = true;
    transcriptArea.disabled = true;
    return;
  }

  const status = await waitForModel();
  console.log("Final model status:", status);

  if (status === "available") {
    alertMessage.innerText =
      "✅ Model is ready! Load an MP3 to transcribe.";
    btn.disabled = false;
    transcriptArea.disabled = false;
  } else if (status === "timeout") {
    alertMessage.innerText = `⚠️ Model is taking too long.\nTry restarting Chrome Canary and checking flags.`;
    btn.disabled = true;
    transcriptArea.disabled = true;
  } else {
    alertMessage.innerText = `❌ Model not ready: ${status}.\nCheck your Chrome version and participation in the early preview.`;
    btn.disabled = true;
    transcriptArea.disabled = true;
  }
}

async function typeWriter(text, speed = 15) {
  for (let i = 0; i < text.length; i++) {
    transcriptArea.value += text[i];
    transcriptArea.scrollTop = transcriptArea.scrollHeight;
    await new Promise((r) => setTimeout(r, speed));
  }
}

btn.addEventListener("click", async () => {
  const file = input.files[0];
  if (!file) return alert("Select an MP3 file first!");

  transcriptArea.placeholder = "📤 Transcribing...\n";
  btn.disabled = true;

  try {
    const blob = new Blob([file]);
    const arrayBuffer = await blob.arrayBuffer();

    const params = await LanguageModel.params();
    const session = await LanguageModel.create({
      expectedInputs: [{ type: "audio" }],
      temperature: 0.1,
      topK: params.defaultTopK,
    });

    const stream = session.promptStreaming([
      {
        role: "user",
        content: [
          {
            type: "text",
            value:
              "Please transcribe the entire audio file word-for-word. Include all spoken words clearly, do not summarize or skip any parts. This is important for accuracy. Even listen for skips or pauses in speech.",
          },
          { type: "audio", value: arrayBuffer },
        ],
      },
    ]);

    for await (const chunk of stream) {
      await typeWriter(chunk);
    }
  } catch (err) {
    console.log("❌ Transcription error:", err);
    alertMessage.innerText =
      "❌ Error: " + (err.message || "Unknown issue");
  } finally {
    btn.disabled = false;
  }
});

window.addEventListener("DOMContentLoaded", init);
