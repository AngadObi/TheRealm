// Sir Reg's voice. Each scenario has a face (n1..n10) and a pool of lines. A line only fires when its scenario is true.
// Placeholders: {n} open tasks, {task} task title, {days} days overdue, {moves} times moved.
const LINES={
  briefing:{face:1,lines:[
    "{n} tasks. I have seen worse sieges.",
    "You rose. That was the hard part. The rest is {n} tasks.",
    "{n} tasks today. The dragon has not been told.",
    "The day is {n} tasks long. I have packed lunch.",
    "{n} open tasks. We march at your convenience.",
    "Another day, another {n} tasks. The kingdom endures.",
    "{n} tasks. None of them are on fire, which is pleasant.",
    "Good morrow, my lord. {n} tasks await, with varying enthusiasm."]},
  one:{face:1,lines:[
    "One task. Do it, and the day is yours.",
    "A single task. I have seen braver lists, but none shorter.",
    "One task today. The rest of the day is yours to waste."]},
  empty:{face:3,lines:[
    "Nothing today. I checked twice, and then behind the tapestry.",
    "An empty scroll. Suspicious, or restful. I cannot tell.",
    "No tasks. The kingdom is quiet. Enjoy it before it notices.",
    "A clear day. Add something, or do not. I am a knight, not a manager.",
    "Nothing planned. The dragon is on holiday."]},
  allDone:{face:3,lines:[
    "Nothing overdue and nothing open. This is the sort of thing bards embellish.",
    "The scroll is clear. Go outside. Be seen.",
    "All done. I would say I am proud, but I only supervised.",
    "Every task ticked. I will tell the bards. They will not care.",
    "Cleared. You may now do nothing without guilt."]},
  overloaded:{face:4,lines:[
    "{n} tasks. This is not a list. This is a siege.",
    "{n} open tasks. I have sharpened what I can.",
    "That is a lot of tasks. May I suggest cowardice, in moderation?",
    "{n} tasks. Even the dragon would postpone some."]},
  overdue:{face:2,lines:[
    "{task} was due {days} days ago. It has taken this well.",
    "{task} is {days} days late. We are now in the part of the story where it gets worse.",
    "Overdue by {days} days: {task}. I will not say I told you so. I have it written down."]},
  dread:{face:7,lines:[
    "{task}. Ah. Brace yourself, my lord.",
    "{task} today. I will wait outside with the horse.",
    "{task}. Nobody has ever enjoyed it. Be the first.",
    "{task} is on the scroll. I have never seen a knight look so calm about it. It is unnerving."]},
  postponed:{face:8,lines:[
    "{task} has been moved {moves} times. I have started a tally on my shield.",
    "{moves} postponements of {task}. It is practically a tenant.",
    "{task} again. It is patient. You are not."]},
  late:{face:1,lines:[
    "It is late. Even the dragon sleeps. You are using a phone.",
    "The candles are low. The tasks can wait. Probably.",
    "Go to bed, my lord. The kingdom will still be here."]},
  muted:{face:5,lines:["{n} tasks today."]},
  // events: shown for a few seconds after something happens
  promoted:{face:4,lines:[
    "{task} has been moved seven times. It is now an Elder Dragon. I did warn you.",
    "Seven postponements. {task} has grown scales. We call it an Elder Dragon now.",
    "{task} is promoted to Elder Dragon. It earned it, one tomorrow at a time."]},
  quests:{face:1,lines:["{n} campaigns. Bold of you.","{n} campaigns on the map. I have packed for none of them.","{n} quests. Pick one and march."]},
  questsNone:{face:5,lines:["No campaigns. A quiet kingdom is a safe kingdom.","Nothing on the map. Start something, or enjoy the peace."]},
  ideas:{face:5,lines:["Ideas are free. Starting them is the expensive part.","{n} ideas, gathering dust with dignity.","An idea is a quest that has not yet noticed you."]},
  ideasNone:{face:5,lines:["No ideas. Rest, or add one while the mood is on you."]},
  dragonsNone:{face:5,lines:["No dragons named. Even the cowardly need a hobby.","The dragons are unnamed. They are not impressed."]},
  dragonsOne:{face:8,lines:["One dragon. One chance. I will sharpen something.","One dragon named. That is brave, or foolish. Often both."]},
  questsOne:{face:1,lines:["One campaign. Focus is a kind of courage.","One quest on the map. Pick it and march."]},
  dragonsSome:{face:8,lines:["{n} dragons on the hunt. I will sharpen something.","{n} dragons named. That is brave, or foolish. Often both."]},
  elderHas:{face:8,lines:["Waiting since {since}. It is patient. You are not.","This one has been here a week. It has made itself at home."]},
  wyrmHas:{face:7,lines:["The month is long. The Wyrm is longer.","A Great Wyrm. Start with its tail."]},
  ancientHas:{face:2,lines:["Nobody has looked at this in a year. Bring a torch.","An Ancient Wyrm. Ancient things do not hurry, and nor should you."]},
  rolled:{face:3,lines:["The dice have spoken. I only report.","Fate has chosen. I would have picked easier.","A card drawn. It was always going to be this one."]},
  questDone:{face:6,lines:["A quest complete. That is rare. I will tell the bards.","Campaign finished. You may sit down."]},
  ideaPromoted:{face:3,lines:["An idea becomes a quest. The bold ones always do.","Promoted. It is no longer free."]},
  added:{face:5,lines:[
    "Written down. Some people feel that is the same as doing it.",
    "Noted. Added to the pile.",
    "One more for the scroll.",
    "Another task. Bold.",
    "Logged. I will pretend I did not see the date."]},
  done:{face:3,lines:[
    "Well done. {n} to go.",
    "Ticked. Nicely done.",
    "One more down. You are doing well.",
    "That is the way. Next when you are ready.",
    "Good work. The kingdom is a little safer.",
    "Done. Steady progress, my lord.",
    "Excellent. {n} left, and you are clearly capable."]},
  dragonSlain:{face:6,lines:[
    "The dragon is slain. Magnificent, my lord.",
    "You did the hard one. I am proud of you.",
    "Dragon down. The bards will hear of this.",
    "Slain. That took courage. The rest of the day is easier now."]},
  longOverdue:{face:6,lines:[
    "Finally done, and what a relief. Well done for facing it.",
    "Done after {days} days. It is gone now, and that is what counts."]},
  quick:{face:6,lines:[
    "Quick work. Excellent.",
    "Added and done in a minute. Efficient, my lord."]},
  postpone:{face:8,lines:[
    "Moved to tomorrow. A bold new lie, but a fresh one.",
    "Tomorrow, then. Tomorrow is very crowded.",
    "Postponed. {moves} times now."]},
  dragonPicked:{face:8,lines:[
    "A brave choice. I would have picked the easier dread.",
    "The dragon is chosen. It has been informed.",
    "You pick the hardest one first. Disturbing, and admirable."]},
  dropped:{face:5,lines:["Dropped. A noble retreat.","Struck from the scroll. It will not be missed.","Gone. I did not like it either."]},
  placed:{face:5,lines:["Placed on the road.","Scheduled. The road is slightly more crowded.","On the road. Do not be late."]},
  saved:{face:3,lines:["The plan is sealed. Go and do it.","Council adjourned. Nobody is surprised.","Plan saved. I will hold you to it, gently."]}
};
const RECENT=[];
function pickLine(key,vars){
  const pool=LINES[key]||LINES.briefing;
  let opts=pool.lines.map((t,i)=>key+':'+i).filter(id=>!RECENT.includes(id));
  if(!opts.length){opts=pool.lines.map((t,i)=>key+':'+i);}
  const id=opts[Math.floor(Math.random()*opts.length)];
  RECENT.push(id); if(RECENT.length>14) RECENT.shift();
  const idx=+id.split(':')[1];
  let text=pool.lines[idx].replace(/\{(\w+)\}/g,(m,k)=>vars&&vars[k]!=null?vars[k]:'');
  text=text.charAt(0).toUpperCase()+text.slice(1);
  return {face:pool.face,text:text};
}
