const WORD_POOL=[
  {word:"serendipity",partOfSpeech:"noun",phonetic:"/ˌserənˈdipitē/",definition:"the occurrence of events by chance in a happy or beneficial way"},
  {word:"ephemeral",partOfSpeech:"adjective",phonetic:"/əˈfem(ə)rəl/",definition:"lasting for a very short time"},
  {word:"luminescence",partOfSpeech:"noun",phonetic:"/ˌlo͞oməˈnes(ə)ns/",definition:"the emission of light by a substance that has not been heated"},
  {word:"eloquent",partOfSpeech:"adjective",phonetic:"/ˈeləkwənt/",definition:"fluent or persuasive in speaking or writing"},
  {word:"ineffable",partOfSpeech:"adjective",phonetic:"/inəˈfəb(ə)l/",definition:"too great or beautiful to be expressed in words"},
  {word:"mellifluous",partOfSpeech:"adjective",phonetic:"/məˈliflo͞oəs/",definition:"pleasantly smooth and musical to hear"},
  {word:"ubiquitous",partOfSpeech:"adjective",phonetic:"/yo͞oˈbikwədəs/",definition:"present, appearing, or found everywhere"},
  {word:"resilience",partOfSpeech:"noun",phonetic:"/rəˈzilēəns/",definition:"the capacity to recover quickly from difficulties"},
  {word:"petrichor",partOfSpeech:"noun",phonetic:"/ˈpetrīˌkôr/",definition:"the pleasant earthy smell after rain"},
  {word:"sonder",partOfSpeech:"noun",phonetic:"/ˈsändər/",definition:"the realization that each passerby has a life as vivid and complex as one's own"},
  {word:"ethereal",partOfSpeech:"adjective",phonetic:"/əˈTHirēəl/",definition:"extremely delicate and light in a way that seems not of this world"},
  {word:"perspicacious",partOfSpeech:"adjective",phonetic:"/ˌpərspəˈkāSHəs/",definition:"having a ready insight into things"},
  {word:"quintessential",partOfSpeech:"adjective",phonetic:"/ˌkwin(t)əˈsen(t)SHəl/",definition:"representing the most perfect or typical example of something"},
  {word:"labyrinthine",partOfSpeech:"adjective",phonetic:"/ˌlabəˈrinTHēn/",definition:"complicated and difficult to follow"},
  {word:"magnanimous",partOfSpeech:"adjective",phonetic:"/maɡˈnanəməs/",definition:"generous or forgiving, especially toward a rival or less powerful person"},
  {word:"voracious",partOfSpeech:"adjective",phonetic:"/vəˈrāSHəs/",definition:"wanting or devouring great quantities of something"},
  {word:"tenacious",partOfSpeech:"adjective",phonetic:"/təˈnāSHəs/",definition:"persistent and determined"},
  {word:"whimsical",partOfSpeech:"adjective",phonetic:"/ˈ(h)wimzikəl/",definition:"playfully quaint or fanciful, especially in an appealing way"},
  {word:"incandescent",partOfSpeech:"adjective",phonetic:"/ˌinkənˈdes(ə)nt/",definition:"emitting light as a result of being heated"},
  {word:"meticulous",partOfSpeech:"adjective",phonetic:"/məˈtikyələs/",definition:"showing great attention to detail; very careful and precise"}
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
