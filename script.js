const WORD_POOL = [
    "serendipity", "ephemeral", "luminescence", "eloquent", "ineffable",
    "mellifluous", "ubiquitous", "resilience", "petrichor", "sonder",
    "ethereal", "perspicacious", "quintessential", "labyrinthine",
    "magnanimous", "voracious", "tenacious", "whimsical",
    "incandescent", "meticulous"
];

const generateButton = document.getElementById("generate-btn");
const wordDisplay = document.getElementById("word-display");
const dateLabel = document.getElementById("date-label");

function getDaysSinceEpoch() {
    const now = new Date();

    const todayUTC = Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
    );

    const epochUTC = Date.UTC(1970, 0, 1);
    const millisecondsPerDay = 24 * 60 * 60 * 1000;

    return Math.floor((todayUTC - epochUTC) / millisecondsPerDay);
}

function getTodaysWord() {
    return WORD_POOL[getDaysSinceEpoch() % WORD_POOL.length];
}

function formatToday() {
    return new Intl.DateTimeFormat("en-US", {
        timeZone: "UTC",
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    }).format(new Date());
}

async function fetchDefinition(word) {
    const apiUrl =
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
        throw new Error(`Dictionary API returned ${response.status}`);
    }

    const data = await response.json();

    /*
     * API parsing:
     * data[0] -> first entry
     * data[0].meanings[0] -> first meaning / part of speech
     * definitions[0].definition -> actual definition text
     * Optional chaining (?.) safely handles missing properties.
     */
    const meaning = data[0]?.meanings?.[0];
    const definition = meaning?.definitions?.[0]?.definition;

    if (!definition) {
        throw new Error("No definition was returned.");
    }

    const phonetics = data[0]?.phonetics ?? [];
    const phoneticWithAudio = phonetics.find(item => item.audio);

    return {
        definition,
        partOfSpeech: meaning?.partOfSpeech ?? "",
        phonetic: phonetics.find(item => item.text)?.text ?? data[0]?.phonetic ?? "",
        audioUrl: phoneticWithAudio?.audio ?? ""
    };
}

function createTextElement(tag, className, text) {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    return element;
}

function speakWord(word) {
    if (!("speechSynthesis" in window)) return;

    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    utterance.rate = 0.82;
    speechSynthesis.speak(utterance);
}

function showWord(word, result) {
    wordDisplay.innerHTML = "";
    dateLabel.textContent = formatToday();

    const wordHeading = createTextElement("h2", "word", word);
    const phoneticRow = document.createElement("div");
    phoneticRow.className = "phonetic-row";

    if (result.phonetic) {
        phoneticRow.append(
            createTextElement("span", "phonetic", result.phonetic)
        );
    }

    const audioButton = document.createElement("button");
    audioButton.type = "button";
    audioButton.className = "audio-button";
    audioButton.setAttribute("aria-label", `Pronounce ${word}`);
    audioButton.textContent = "🔊";

    audioButton.addEventListener("click", () => {
        if (result.audioUrl) {
            const audio = new Audio(result.audioUrl);
            audio.play().catch(() => speakWord(word));
        } else {
            speakWord(word);
        }
    });

    phoneticRow.append(audioButton);

    const partOfSpeech = createTextElement(
        "p",
        "part-of-speech",
        result.partOfSpeech
    );

    const definition = createTextElement(
        "p",
        "definition",
        result.definition
    );

    wordDisplay.append(
        wordHeading,
        phoneticRow,
        ...(result.partOfSpeech ? [partOfSpeech] : []),
        definition
    );
}

async function generateWord() {
    const word = getTodaysWord();

    dateLabel.textContent = formatToday();
    wordDisplay.innerHTML = "";

    const loading = createTextElement(
        "p",
        "placeholder",
        "Loading definition..."
    );

    wordDisplay.append(
        dateLabel.cloneNode(true),
        loading
    );

    generateButton.disabled = true;

    try {
        const result = await fetchDefinition(word);
        showWord(word, result);
    } catch (error) {
        console.error("Failed to fetch definition:", error);

        wordDisplay.innerHTML = "";
        wordDisplay.append(
            dateLabel.cloneNode(true),
            createTextElement(
                "p",
                "error",
                "We couldn't load today's definition. Check your connection and try again."
            )
        );
    } finally {
        generateButton.disabled = false;
    }
}

dateLabel.textContent = formatToday();
generateButton.addEventListener("click", generateWord);
