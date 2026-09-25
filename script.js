const WORD_POOL=["serendipity","ephemeral","luminescence","eloquent","ineffable","mellifluous","ubiquitous","resilience","petrichor","sonder","ethereal","perspicacious","quintessential","labyrinthine","magnanimous","voracious","tenacious","whimsical","incandescent","meticulous"];
const generateButton=document.getElementById("generate-btn"),wordDisplay=document.getElementById("word-display"),dateLabel=document.getElementById("date-label");

function getDaysSinceEpoch(){const n=new Date(),today=Date.UTC(n.getUTCFullYear(),n.getUTCMonth(),n.getUTCDate()),epoch=Date.UTC(1970,0,1);return Math.floor((today-epoch)/86400000)}
function getTodaysWord(){return WORD_POOL[getDaysSinceEpoch()%WORD_POOL.length]}
function formatToday(){return new Intl.DateTimeFormat("en-US",{timeZone:"UTC",weekday:"long",month:"long",day:"numeric",year:"numeric"}).format(new Date())}
function el(tag,cls,text){const x=document.createElement(tag);x.className=cls;x.textContent=text;return x}

async function fetchJson(url){
 const c=new AbortController(),t=setTimeout(()=>c.abort(),9000);
 try{const r=await fetch(url,{signal:c.signal,headers:{Accept:"application/json"}});if(!r.ok)throw new Error("HTTP "+r.status);return await r.json()}finally{clearTimeout(t)}
}

async function fetchDefinition(word){
 const direct=`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
 let data;
 try{
   data=await fetchJson(direct);
 }catch(e){
   console.warn("Direct Dictionary API request failed; using Vercel proxy.",e);
   data=await fetchJson(`/api/definition?word=${encodeURIComponent(word)}`);
 }
 /*
  * API parsing:
  * data[0] = first dictionary entry
  * data[0].meanings[0] = first meaning/part of speech
  * meanings[0].definitions[0].definition = actual definition text
  * Optional chaining safely handles missing nested properties.
  */
 const entry=data[0],meaning=entry?.meanings?.[0],definition=meaning?.definitions?.[0]?.definition;
 if(!definition)throw new Error("No definition returned");
 const phonetics=entry?.phonetics??[],audioItem=phonetics.find(x=>x.audio);
 return {definition,partOfSpeech:meaning?.partOfSpeech??"",phonetic:phonetics.find(x=>x.text)?.text??entry?.phonetic??"",audioUrl:audioItem?.audio??""};
}

function speakWord(word){if(!("speechSynthesis"in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(word);u.lang="en-US";u.rate=.82;speechSynthesis.speak(u)}

function showWord(word,r){
 wordDisplay.innerHTML="";dateLabel.textContent=formatToday();
 const h=el("h2","word",word),row=document.createElement("div");row.className="phonetic-row";
 if(r.phonetic)row.append(el("span","phonetic",r.phonetic));
 const b=document.createElement("button");b.type="button";b.className="audio-button";b.textContent="🔊";b.setAttribute("aria-label","Pronounce "+word);
 b.onclick=async()=>{if(!r.audioUrl)return speakWord(word);try{await new Audio(r.audioUrl).play()}catch{ speakWord(word)}};
 row.append(b);
 wordDisplay.append(h,row,...(r.partOfSpeech?[el("p","part-of-speech",r.partOfSpeech)]:[]),el("p","definition",r.definition));
}

async function generateWord(){
 const word=getTodaysWord();generateButton.disabled=true;wordDisplay.innerHTML="";dateLabel.textContent=formatToday();
 wordDisplay.append(dateLabel.cloneNode(true),el("p","placeholder","Loading definition..."));
 try{showWord(word,await fetchDefinition(word))}
 catch(e){console.error(e);wordDisplay.innerHTML="";wordDisplay.append(dateLabel.cloneNode(true),el("p","error","We couldn't load today's definition. Please check your connection and try again."))}
 finally{generateButton.disabled=false}
}
dateLabel.textContent=formatToday();generateButton.addEventListener("click",generateWord);
