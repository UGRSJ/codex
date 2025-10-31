import { words } from "./words.js";

const listEl = document.getElementById("word-list");
const template = document.getElementById("word-card-template");

const MEMORY_STEPS = 5;
const storageKey = "jp-wordbook-progress";

function loadProgress() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (error) {
    console.error("학습 진도 불러오기 실패", error);
    return {};
  }
}

function saveProgress(progress) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(progress));
  } catch (error) {
    console.error("학습 진도 저장 실패", error);
  }
}

const progress = loadProgress();

function speakJapanese(text) {
  if (!("speechSynthesis" in window)) {
    alert("이 브라우저에서는 음성 재생을 지원하지 않습니다.");
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = 0.95;
  utterance.pitch = 1.1;

  const japaneseVoices = speechSynthesis
    .getVoices()
    .filter((voice) => voice.lang.startsWith("ja"));

  if (japaneseVoices.length > 0) {
    utterance.voice = japaneseVoices[0];
  }

  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

function createMemoryCheckboxes(wordId, checkedCount = 0) {
  const fragment = document.createDocumentFragment();
  for (let step = 1; step <= MEMORY_STEPS; step += 1) {
    const label = document.createElement("label");
    label.className = "memory-step";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = `${wordId}-memory-${step}`;
    checkbox.checked = step <= checkedCount;

    checkbox.addEventListener("change", () => {
      const newCheckedCount = checkbox.checked ? step : step - 1;
      progress[wordId] = newCheckedCount;
      saveProgress(progress);
      const checkboxes = label.parentElement?.querySelectorAll("input[type='checkbox']");
      if (checkboxes) {
        checkboxes.forEach((box, index) => {
          box.checked = index < newCheckedCount;
        });
      }
    });

    label.append(checkbox);
    fragment.append(label);
  }
  return fragment;
}

function renderWords() {
  listEl.innerHTML = "";

  words.forEach((item) => {
    const node = template.content.firstElementChild.cloneNode(true);

    const wordText = node.querySelector("[data-role='speak-word']");
    const wordPron = node.querySelector("[data-role='word-pron']");
    const meaning = node.querySelector("[data-role='meaning']");
    const memory = node.querySelector("[data-role='memory']");
    const toggle = node.querySelector("[data-role='toggle-example']");
    const exampleBox = node.querySelector("[data-role='example']");
    const exampleJp = node.querySelector("[data-role='example-jp']");
    const examplePron = node.querySelector("[data-role='example-pron']");
    const audioButton = node.querySelector("[data-role='audio-button']");

    wordText.textContent = item.word;
    wordPron.textContent = item.wordPronunciation;
    meaning.textContent = item.meaning;
    exampleJp.textContent = item.example;
    examplePron.textContent = item.examplePronunciation;

    const memorized = progress[item.id] ?? 0;
    memory.append(createMemoryCheckboxes(item.id, memorized));

    const speakHandler = () => speakJapanese(item.word);
    wordText.addEventListener("click", speakHandler);
    wordText.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        speakHandler();
        event.preventDefault();
      }
    });
    audioButton.addEventListener("click", speakHandler);

    toggle.addEventListener("click", () => {
      const isHidden = exampleBox.hasAttribute("hidden");
      if (isHidden) {
        exampleBox.removeAttribute("hidden");
        toggle.setAttribute("aria-expanded", "true");
        toggle.textContent = "예문 숨기기";
        speakJapanese(item.example);
      } else {
        exampleBox.setAttribute("hidden", "");
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "예문 보기";
      }
    });

    listEl.appendChild(node);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderWords, { once: true });
} else {
  renderWords();
}

window.addEventListener("beforeunload", () => {
  speechSynthesis.cancel();
});
