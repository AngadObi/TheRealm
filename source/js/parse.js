// Quick add: "dentist fri 3pm", "call Lena tomorrow 14:30 for 45m", "pay rent 5 nov".
const WD={mon:1,tue:2,wed:3,thu:4,fri:5,sat:6,sun:0};
const MONTHS={jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
const HINTS=[
  [/\b(dentist|doctor|dr\.?|arzt|physio|therapy|run|gym|workout|swim|yoga|pharmacy|checkup)\b/i,'Health'],
  [/\b(flight|hotel|train|trip|passport|visa|packing|airport|luggage|holiday|vacation|itinerary|airbnb|ticket)\b/i,'Travel'],
  [/\b(rent|pay|bill|tax|insurance|bank|transfer|invoice)\b/i,'Personal'],
  [/\b(buy|groceries|shopping|order|pick up)\b/i,'Shopping'],
  [/\b(water|clean|laundry|recycling|trash|fix|vacuum|dishes|ferns|plants)\b/i,'Home'],
  [/\b(dinner|drinks|party|birthday|visit|friends)\b/i,'Social']
];
function pad2(n){return String(n).padStart(2,'0');}
function parseQuick(text,ctx){
  // ctx: {today:'YYYY-MM-DD', cats:[{id,name}], kw:{word:catId}}
  let t=' '+text.replace(/\s+/g,' ')+' ';
  const out={title:'',date:null,time:null,dur:null,cat:null};
  const take=(re,fn)=>{const m=t.match(re);if(m){fn(m);t=t.replace(re,' ');return true;}return false;};
  // repeats: "daily", "every day", "weekdays", "every monday", "weekly", "monthly"
  out.rep='';
  if(take(/\s(?:every\s?day|daily|jeden\stag)\b/i,()=>{out.rep='daily';})){}
  else if(take(/\s(?:every\s(?:weekday|work\s?day)s?|weekdays)\b/i,()=>{out.rep='weekdays';})){}
  else if(take(/\s(?:monthly|every\smonth)\b/i,()=>{out.rep='monthly';})){}
  else if(take(/\severy\s(?=(?:mon|tue|wed|thu|fri|sat|sun))/i,()=>{out.rep='weekly';})){}
  else if(take(/\s(?:weekly|every\sweek)\b/i,()=>{out.rep='weekly';})){}
  // durations: "for an hour", "half an hour", "1.5h", "90 min", "an hour and a half", "for 2 hours"
  take(/\s(?:for\s)?(?:an?\s|one\s|1\s)?hour\s(?:and\s(?:a\s)?half|and\s(?:30|thirty)\s?min\w*)\b/i,()=>{out.dur=90;});
  if(!out.dur) take(/\s(?:for\s)?half\s(?:an?\s)?(?:hour|h)\b/i,()=>{out.dur=30;});
  if(!out.dur) take(/\s(?:for\s)?(?:an?|one)\s(?:hour|stunde)\b/i,()=>{out.dur=60;});
  if(!out.dur) take(/\s(?:for\s)?(?:a\scouple\sof|two|zwei)\s(?:hours|stunden)\b/i,()=>{out.dur=120;});
  if(!out.dur) take(/\s(?:for\s)?three\shours\b/i,()=>{out.dur=180;});
  if(!out.dur) take(/\sfor\s(\d+(?:[.,]\d+)?)\s?(h|hr|hrs|hours?|stunden?|m|min|mins|minutes?)\b/i,m=>{const v=parseFloat(m[1].replace(',','.'));out.dur=/^(h|s)/i.test(m[2])?Math.round(v*60):Math.round(v);});
  if(!out.dur) take(/\s(\d+(?:[.,]\d+)?)\s?(h|hr|hrs|hours?|stunden?|min|mins|minutes?)\b/i,m=>{const v=parseFloat(m[1].replace(',','.'));out.dur=/^(h|s)/i.test(m[2])?Math.round(v*60):Math.round(v);});
  // dates first so "5 nov" is not read as a time
  const base=new Date(ctx.today+'T12:00:00');
  const iso=d=>d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate());
  const plus=n=>{const d=new Date(base);d.setDate(d.getDate()+n);return iso(d);};
  take(/\s(today|tonight|heute)\b/i,()=>{out.date=ctx.today;});
  if(!out.date) take(/\s(tomorrow|tmrw|tmr|morgen)\b/i,()=>{out.date=plus(1);});
  if(!out.date) take(/\sin\s(\d{1,2})\s?(days?|d)\b/i,m=>{out.date=plus(+m[1]);});
  if(!out.date) take(/\snext\sweek\b/i,()=>{out.date=plus(7);});
  if(!out.date) take(/\s(?:on\s|next\s)?(monday|mon|tuesday|tues|tue|wednesday|wed|thursday|thurs|thur|thu|friday|fri|saturday|sat|sunday|sun)\b/i,m=>{const w=WD[m[1].toLowerCase().slice(0,3)];let d=(w-base.getDay()+7)%7;if(d===0)d=7;out.date=plus(d);});
  if(!out.date) take(/\s(\d{1,2})(?:st|nd|rd|th)?\s?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/i,m=>{out.date=mk(base,MONTHS[m[2].toLowerCase()],+m[1]);});
  if(!out.date) take(/\s(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s(\d{1,2})(?:st|nd|rd|th)?\b/i,m=>{out.date=mk(base,MONTHS[m[1].toLowerCase()],+m[2]);});
  if(!out.date) take(/\s(\d{1,2})\.(\d{1,2})\.?(?=\s)/,m=>{out.date=mk(base,+m[2]-1,+m[1]);});
  // times
  if(!take(/\s(?:at\s|um\s)?(\d{1,2}):(\d{2})\s?(am|pm)?(?=\s|$)/i,m=>{out.time=hm(+m[1],+m[2],m[3]);}))
  if(!take(/\s(?:at\s)?(\d{1,2})\s?(am|pm)\b/i,m=>{out.time=hm(+m[1],0,m[2]);}))
  take(/\sat\s(\d{1,2})(?=\s|$)/i,m=>{out.time=hm(+m[1],0,null);});
  if(out.time&&!out.date){/* time only: leave date to caller */}
  let title=t.replace(/\s+/g,' ').trim();
  out.title=title?title.charAt(0).toUpperCase()+title.slice(1):'';
  // category
  const low=text.toLowerCase();
  for(const c of ctx.cats){const re=new RegExp('\\b'+c.name.toLowerCase().replace(/[^a-z0-9]/g,'')+'\\b','i');if(re.test(low)){out.cat=c.id;break;}}
  if(!out.cat){const votes={};for(const w of low.split(/[^a-zäöüß0-9]+/)){if(w.length>3&&ctx.kw[w])votes[ctx.kw[w]]=(votes[ctx.kw[w]]||0)+1;}
    const best=Object.entries(votes).sort((a,b)=>b[1]-a[1])[0];if(best&&ctx.cats.some(c=>c.id===best[0]))out.cat=best[0];}
  if(!out.cat){for(const [re,name] of HINTS){if(re.test(low)){const c=ctx.cats.find(c=>c.name.toLowerCase()===name.toLowerCase());if(c){out.cat=c.id;break;}}}}
  if(!out.dur){const lw=low;if(/\b(gym|workout|swim|yoga|dentist|doctor|arzt|physio|meeting|workshop|dinner|lunch|haircut)\b/.test(lw))out.guess=60;else if(/\b(run|jog|visit)\b/.test(lw))out.guess=45;else if(/\b(call|email|mail|pay|book|order)\b/.test(lw))out.guess=15;}
  return out;
}
function hm(h,m,ap){if(ap){ap=ap.toLowerCase();if(ap==='pm'&&h<12)h+=12;if(ap==='am'&&h===12)h=0;}if(h>23||m>59)return null;return pad2(h)+':'+pad2(m);}
function mk(base,mon,day){let y=base.getFullYear();let d=new Date(y,mon,day,12);if(d<new Date(base.getFullYear(),base.getMonth(),base.getDate(),0))d=new Date(y+1,mon,day,12);return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate());}
