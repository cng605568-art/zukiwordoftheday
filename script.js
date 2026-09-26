const WORD_POOL=[
  {word:"incomprehensible",partOfSpeech:"adjective",phonetic:"/ˌɪnkɒmprɪˈhɛnsəbəl/",definition:"impossible to understand or grasp fully"},
  {word:"extraordinary",partOfSpeech:"adjective",phonetic:"/ɪkˈstrɔːrdəneri/",definition:"very unusual, remarkable, or far beyond what is ordinary"},
  {word:"magnificent",partOfSpeech:"adjective",phonetic:"/mæɡˈnɪfɪsənt/",definition:"extremely beautiful, impressive, or grand"},
  {word:"unforgettable",partOfSpeech:"adjective",phonetic:"/ˌʌnfərˈɡɛtəbəl/",definition:"so memorable that it cannot easily be forgotten"},
  {word:"compassionate",partOfSpeech:"adjective",phonetic:"/kəmˈpæʃənət/",definition:"showing deep concern for the suffering or difficulties of others"},
  {word:"conscientious",partOfSpeech:"adjective",phonetic:"/ˌkɒnʃiˈɛnʃəs/",definition:"careful, responsible, and guided by a strong sense of duty"},
  {word:"magnanimous",partOfSpeech:"adjective",phonetic:"/mæɡˈnænɪməs/",definition:"generous and forgiving, especially toward a rival or someone with less power"},
  {word:"meticulous",partOfSpeech:"adjective",phonetic:"/məˈtɪkjələs/",definition:"extremely careful about details and accuracy"},
  {word:"perspicacious",partOfSpeech:"adjective",phonetic:"/ˌpɜːrspɪˈkeɪʃəs/",definition:"having a sharp ability to notice and understand things quickly"},
  {word:"quintessential",partOfSpeech:"adjective",phonetic:"/ˌkwɪntɪˈsɛnʃəl/",definition:"representing the most typical or perfect example of something"},
  {word:"labyrinthine",partOfSpeech:"adjective",phonetic:"/ˌlæbəˈrɪnθaɪn/",definition:"extremely complicated, intricate, or difficult to follow"},
  {word:"multifaceted",partOfSpeech:"adjective",phonetic:"/ˌmʌltɪˈfæsɪtɪd/",definition:"having many different aspects, features, or dimensions"},
  {word:"unprecedented",partOfSpeech:"adjective",phonetic:"/ʌnˈprɛsɪdentɪd/",definition:"never having happened, existed, or been known before"},
  {word:"indescribable",partOfSpeech:"adjective",phonetic:"/ˌɪndɪˈskraɪbəbəl/",definition:"too remarkable, intense, or unusual to be adequately described in words"},
  {word:"transcendent",partOfSpeech:"adjective",phonetic:"/trænˈsɛndənt/",definition:"going beyond ordinary physical experience or limits"},
  {word:"iridescent",partOfSpeech:"adjective",phonetic:"/ˌɪrɪˈdɛsənt/",definition:"showing changing colors that appear to shift with the light or angle"},
  {word:"effervescent",partOfSpeech:"adjective",phonetic:"/ˌɛfərˈvɛsənt/",definition:"lively, enthusiastic, and full of energy or excitement"},
  {word:"sophisticated",partOfSpeech:"adjective",phonetic:"/səˈfɪstɪkeɪtɪd/",definition:"highly developed, refined, complex, or knowledgeable"},
  {word:"unparalleled",partOfSpeech:"adjective",phonetic:"/ʌnˈpærəleld/",definition:"having no equal or match in quality, extent, or significance"}
];

const generateButton=document.getElementById("generate-btn");
const wordDisplay=document.getElementById("word-display");
const dateLabel=document.getElementById("date-label");

function getDaysSinceEpoch(){
  const n=new Date();
  const today=Date.UTC(n.getUTCFullYear(),n.getUTCMonth(),n.getUTCDate());
  const epoch=Date.UTC(1970,0,1);
  return Math.floor((today-epoch)/86400000);
}
function getTodaysEntry(){return WORD_POOL[getDaysSinceEpoch()%WORD_POOL.length];}
function formatToday(){return new Intl.DateTimeFormat("en-US",{timeZone:"UTC",weekday:"long",month:"long",day:"numeric",year:"numeric"}).format(new Date());}
function el(tag,cls,text){const x=document.createElement(tag);x.className=cls;x.textContent=text;return x;}

async function fetchDictionaryEntry(word){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),5000);
  try{
    const response=await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,{signal:controller.signal,headers:{Accept:"application/json"}});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const data=await response.json();
    const entry=data?.[0],meaning=entry?.meanings?.[0],definition=meaning?.definitions?.[0]?.definition;
    if(!definition)throw new Error("No definition returned");
    return {word,partOfSpeech:meaning?.partOfSpeech||"",phonetic:entry?.phonetics?.find(x=>x.text)?.text||entry?.phonetic||"",definition,audioUrl:entry?.phonetics?.find(x=>x.audio)?.audio||""};
  }finally{clearTimeout(timeout);}
}

function speakWord(word){
  if("speechSynthesis" in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(word);u.lang="en-US";u.rate=.82;speechSynthesis.speak(u);}
}

function showWord(entry){
  wordDisplay.innerHTML="";
  dateLabel.textContent=formatToday();
  const h=el("h2","word",entry.word),row=document.createElement("div");
  row.className="phonetic-row";
  if(entry.phonetic)row.append(el("span","phonetic",entry.phonetic));
  const b=document.createElement("button");
  b.type="button";b.className="audio-button";b.textContent="🔊";b.setAttribute("aria-label",`Pronounce ${entry.word}`);
  b.onclick=async()=>{if(!entry.audioUrl)return speakWord(entry.word);try{await new Audio(entry.audioUrl).play();}catch{ speakWord(entry.word); }};
  row.append(b);
  wordDisplay.append(h,row,el("p","part-of-speech",entry.partOfSpeech),el("p","definition",entry.definition));
}

async function generateWord(){
  const local=getTodaysEntry();
  generateButton.disabled=true;
  wordDisplay.innerHTML="";
  dateLabel.textContent=formatToday();
  wordDisplay.append(dateLabel.cloneNode(true),el("p","placeholder","Loading definition..."));
  try{
    const online=await fetchDictionaryEntry(local.word);
    showWord(online);
  }catch(error){
    console.warn("Dictionary API unavailable; using built-in definition.",error);
    showWord(local);
  }finally{generateButton.disabled=false;}
}

dateLabel.textContent=formatToday();
generateButton.addEventListener("click",generateWord);


// Draggable + pinch-to-zoom sprite with a little wobbly motion.
(() => {
  const sprite = document.getElementById("zuki-sprite");
  if (!sprite) return;

  const pointers = new Map();
  let mode = "idle";
  let startX = 0, startY = 0;
  let originX = 0, originY = 0;
  let startDistance = 0, startScale = 1;
  let lastX = 0, lastY = 0, lastTime = 0;
  let wobble = 0;
  let wobbleVelocity = 0;
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  function centerOfTwo(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function render() {
    sprite.style.setProperty("--sprite-x", `${offsetX}px`);
    sprite.style.setProperty("--sprite-y", `${offsetY}px`);
    sprite.style.setProperty("--sprite-scale", scale.toFixed(3));
    sprite.style.setProperty("--sprite-wobble", `${wobble.toFixed(2)}deg`);
  }

  function animateWobble() {
    // Spring back toward a relaxed angle after dragging.
    wobbleVelocity += (-wobble * 0.16);
    wobbleVelocity *= 0.82;
    wobble += wobbleVelocity;
    if (Math.abs(wobble) > 0.01 || Math.abs(wobbleVelocity) > 0.01) render();
    requestAnimationFrame(animateWobble);
  }
  animateWobble();

  function beginDrag(point) {
    mode = "drag";
    startX = point.x;
    startY = point.y;
    originX = offsetX;
    originY = offsetY;
    lastX = point.x;
    lastY = point.y;
    lastTime = performance.now();
    sprite.classList.add("dragging");
  }

  function beginPinch() {
    const [a, b] = [...pointers.values()];
    startDistance = distance(a, b);
    startScale = scale;
    const center = centerOfTwo(a, b);
    startX = center.x;
    startY = center.y;
    originX = offsetX;
    originY = offsetY;
    mode = "pinch";
  }

  sprite.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    sprite.setPointerCapture?.(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size === 1) {
      beginDrag({ x: event.clientX, y: event.clientY });
    } else if (pointers.size === 2) {
      beginPinch();
    }
  });

  sprite.addEventListener("pointermove", (event) => {
    if (!pointers.has(event.pointerId)) return;
    event.preventDefault();
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size >= 2) {
      if (mode !== "pinch") beginPinch();
      const [a, b] = [...pointers.values()];
      const center = centerOfTwo(a, b);
      const ratio = startDistance ? distance(a, b) / startDistance : 1;
      scale = clamp(startScale * ratio, 0.45, 3.2);
      offsetX = originX + (center.x - startX);
      offsetY = originY + (center.y - startY);
      wobble = clamp((a.x - b.x) * 0.015, -7, 7);
      render();
      return;
    }

    if (pointers.size === 1 && mode === "drag") {
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      offsetX = originX + dx;
      offsetY = originY + dy;

      const now = performance.now();
      const dt = Math.max(8, now - lastTime);
      const vx = (event.clientX - lastX) / dt;
      wobbleVelocity += clamp(vx * 1.9, -2.8, 2.8);
      wobble = clamp(wobble + vx * 0.7, -10, 10);
      lastX = event.clientX;
      lastY = event.clientY;
      lastTime = now;
      render();
    }
  });

  function endPointer(event) {
    pointers.delete(event.pointerId);
    try { sprite.releasePointerCapture?.(event.pointerId); } catch {}

    if (pointers.size === 0) {
      mode = "idle";
      sprite.classList.remove("dragging");
    } else if (pointers.size === 1) {
      const [remaining] = pointers.values();
      beginDrag(remaining);
    }
  }

  sprite.addEventListener("pointerup", endPointer);
  sprite.addEventListener("pointercancel", endPointer);
})();
