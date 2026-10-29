import json,re,sys
d=json.load(open('lines.json'))
WK={'monday':1,'tuesday':2,'wednesday':3,'thursday':4,'friday':5,'saturday':6,'sunday':0}
def hhmm(s):
    h,m=s.split(':');return int(h)+int(m)/60
def words(s):
    s=s.strip()
    allof=' and ' in s
    ws=[w.strip() for w in re.split(r',\s*|\s+or\s+|\s+and\s+',s) if w.strip()]
    ws=[w for w in ws if w]
    return ws,allof
def rx(ws):
    return '|'.join(re.escape(w).replace('\\ ',' ').replace('\\-','-') for w in ws)
def has(ws,allof):
    if allof:return '&&'.join(f'x.has(/\\b{rx([w])}/i)' for w in ws)
    return f'x.has(/\\b(?:{rx(ws)})/i)'
def N(s):return int(s)
def atom(s):
    s0=s.strip().rstrip('.');l=s0.lower()
    if l=='any':return 'true'
    if l=='the day is monday':return 'x.dow===1'
    if l=="task was today's frog":return 'x.t&&x.t.dragon'
    if l=='no task due today and 0 overdue':return 'x.nt===0&&x.over===0'
    m=re.fullmatch(r'(\d+) or more emails',l)
    if m:return f'x.emails>={m.group(1)}'
    if l.startswith('task was') or l.startswith('task title is') or 'ticks within' in l or l=='3 or more tasks still open today':return 'false'
    m=re.fullmatch(r'title has (.+)',s0,re.I)
    if m:
        ws,a=words(m.group(1));return has(ws,a)
    m=re.fullmatch(r'frog title has (.+)',s0,re.I)
    if m:
        ws,a=words(m.group(1));return has(ws,a)
    m=re.fullmatch(r'\{n\} is (\d+) to (\d+)',s0)
    if m:return f'x.n>={m.group(1)}&&x.n<={m.group(2)}'
    m=re.fullmatch(r'\{n\} is (\d+) or more',s0)
    if m:return f'x.n>={m.group(1)}'
    m=re.fullmatch(r'(\d+) or more email tasks(?: today)?(?: \(.*\))?',s0)
    if m:return f'x.emails>={m.group(1)}'
    m=re.fullmatch(r'3 or more email tasks ticked today',s0)
    if m:return 'false'
    m=re.fullmatch(r'exactly 1 email task today',l)
    if m:return 'x.emails===1'
    m=re.fullmatch(r'(\d+) or more (?:overdue tasks)',l)
    if m:return f'x.over>={m.group(1)}'
    if l=='1 or more overdue tasks':return 'x.over>=1'
    m=re.fullmatch(r'no overdue tasks, \{n\} is 1 or more',s0,re.I)
    if m:return 'x.over===0&&x.n>=1'
    m=re.fullmatch(r'app opened (before|after) (\d\d:\d\d)(?: with tasks still open|, 1 or more overdue)?',l)
    if m:
        t=hhmm(m.group(2));e=f'x.hr<{t}' if m.group(1)=='before' else f'x.hr>={t}'
        if 'tasks still open' in l:e+='&&x.n>0'
        if 'overdue' in l:e+='&&x.over>=1'
        return e
    if l=='second or later open of the day':return 'x.opens>=2'
    if l=='first open of the day':return 'x.opens<=1'
    if l=='a timed task exists before 10:00':return 'x.ft!=null&&x.ft<10'
    m=re.fullmatch(r'a task carried over (\d+) or more days exists.*',l)
    if m:return f'x.oldest>={m.group(1)}'
    if l=='a frog is chosen for today':return '!!x.drg'
    m=re.fullmatch(r'day is (\w+)',l)
    if m and m.group(1) in WK:return f'x.dow===({WK[m.group(1)]})'
    if l.startswith('day is saturday or sunday'):
        e='(x.dow===0||x.dow===6)'
        if '{n}' in s0:e+='&&x.n>=1'
        return e
    if l=='saturday or sunday':return '(x.dow===0||x.dow===6)'
    if l=='monday to friday':return '(x.dow>=1&&x.dow<=5)'
    if l=='monday to friday, no medical task in the next 60 days':return '(x.dow>=1&&x.dow<=5)&&x.noMed'
    m=re.fullmatch(r'tomorrow has (\d+) or more tasks',l)
    if m:return f'x.tmr>={m.group(1)}'
    if l=='no tasks today and 0 overdue':return 'x.nt===0&&x.over===0'
    if l=='ideas list has 1 or more items':return 'x.ideas>=1'
    m=re.fullmatch(r'day had (\d+) or more tasks',l)
    if m:return f'x.nt>={m.group(1)}'
    if l=='day had exactly 1 task':return 'x.nt===1'
    m=re.fullmatch(r'last task ticked (before|after) (\d\d:\d\d)',l)
    if m:
        t=hhmm(m.group(2));return f'x.hr<{t}' if m.group(1)=='before' else f'x.hr>={t}'
    if l=="today's frog was completed":return 'x.dragonDone'
    if l=='at least one overdue task was cleared today':return 'x.cleared'
    if l=='0 overdue tasks at the end':return 'x.over===0'
    m=re.fullmatch(r'(\d+) or more tasks added in this session',l)
    if m:return f'x.sa>={m.group(1)}'
    if l=='exactly 1 task added in this session':return 'x.sa===1'
    if l=='a task is being postponed or rescheduled':return "x.kind==='postpone'"
    if l=='2 or more tasks postponed or deleted in this session':return 'x.sp>=2'
    if l=='tomorrow has 1 or more tasks':return 'x.tmr>=1'
    m=re.fullmatch(r'time is 00:00 to 04:00',l)
    if m:return 'x.hr<4'
    if l=='a task tomorrow is timed before 08:00':return 'x.tmrEarly'
    if l=="all of today's tasks are done":return 'x.nt>0&&x.n===0'
    if l=='task has a day that is not today':return 'x.t&&x.t.hasDate'
    if l=='task has a time':return 'x.t&&x.t.timed'
    if l=='quick add parsed both a day and a time':return 'x.t&&x.t.hasDate&&x.t.timed'
    if l=='quick add found no date':return 'x.t&&!x.t.hasDate'
    if l=='task has a reminder':return 'false'
    m=re.fullmatch(r'added to today, \{n\} is (\d+) or more',s0,re.I)
    if m:return f'x.t&&x.t.today&&x.n>={m.group(1)}'
    if l=='due within 60 minutes of being added':return 'x.t&&x.t.timed&&x.t.today&&x.t.hh*60-x.hr*60<=60&&x.t.hh*60-x.hr*60>=0'
    if l=='no category chosen':return 'false'
    m=re.fullmatch(r'added after (\d\d:\d\d)',l)
    if m:return f"x.kind==='add'&&x.hr>={hhmm(m.group(1))}"
    if l=='two timed tasks share a start time':return 'x.dupTime'
    if 'no task has lunch or break' in l:return 'x.noLunch'
    m=re.fullmatch(r'(\d+) or more categories used',l)
    if m:return f'x.catsUsed>={m.group(1)}'
    if l=='no frog chosen':return '!x.drg'
    if l.startswith('6 or more were created on the same day'):return 'x.sameDay>=6'
    if l=='timed durations sum to 10 hours or more':return 'x.durSum>=600'
    m=re.fullmatch(r'frog picked (before|after) (\d\d:\d\d)',l)
    if m:
        t=hhmm(m.group(2));return f'x.hr<{t}' if m.group(1)=='before' else f'x.hr>={t}'
    if l=='frog was moved 2 or more times, or is older than 7 days':return 'x.t&&(x.t.moves>=2||x.t.age>7)'
    # overdue states
    m=re.fullmatch(r'overdue by (\d+) or more days',l)
    if m:return f'x.t&&x.t.od>={m.group(1)}'
    if l=='overdue by 1 or more days':return 'x.t&&x.t.od>=1'
    m=re.fullmatch(r'overdue (\d+) or more days',l)
    if m:return f'x.t&&x.t.od>={m.group(1)}'
    m=re.fullmatch(r'overdue (\d+) to (\d+) days',l)
    if m:return f'x.t&&x.t.od>={m.group(1)}&&x.t.od<={m.group(2)}'
    if l=='overdue exactly 1 day':return 'x.t&&x.t.od===1'
    if l=='overdue today, task has a time':return 'x.t&&x.t.today&&x.t.timed&&x.hr>x.t.hh'
    if l=='overdue by less than 6 hours':return 'x.t&&x.t.today&&x.t.timed&&x.hr>x.t.hh&&x.hr-x.t.hh<6'
    if l=='first overdue task of the day':return 'x.opens<=1&&x.over>=1'
    m=re.fullmatch(r'category is (\w+)',l)
    if m:return f"x.t&&x.t.cat==='{m.group(1)}'"
    if l=='category is work, overdue by 1 or more days':return "x.t&&x.t.cat==='work'&&x.t.od>=1"
    # postponed
    m=re.fullmatch(r'moved for the 1st time',l)
    if m:return 'x.t&&x.t.moves===1'
    if l=='moved for the 1st or 2nd time':return 'x.t&&x.t.moves>=1&&x.t.moves<=2'
    m=re.fullmatch(r'moved (\d+) or more times',l)
    if m:return f'x.t&&x.t.moves>={m.group(1)}'
    if l=='new date is tomorrow':return 'x.ndDiff===1'
    m=re.fullmatch(r'new date is (\d+) or more days away',l)
    if m:return f'x.ndDiff>={m.group(1)}'
    if l=='new date is saturday or sunday':return '(x.ndDow===0||x.ndDow===6)'
    if l.startswith('moved to later the same day'):return 'x.ndDiff===0&&x.hr>=18'
    m=re.fullmatch(r'new day already has (\d+) or more tasks',l)
    if m:return f'x.ndCount>={m.group(1)}'
    if l.startswith('task has a person or booking'):return 'x.has(/\\b(?:call|meeting|with|appointment)/i)'
    # events
    if l=='task added':return "x.kind==='add'"
    if l=='task added with a date':return "x.kind==='add'&&x.t&&x.t.hasDate"
    if l=='task added with day and time':return "x.kind==='add'&&x.t&&x.t.hasDate&&x.t.timed"
    if l in ('the appointment is today','appointment is today'):return 'x.t&&x.t.today'
    if l=='the appointment is tomorrow':return 'x.t&&x.t.dd===1'
    m=re.fullmatch(r'(\d) hours? before the appointment',l)
    if m:
        n=int(m.group(1));return f'x.t&&x.t.today&&x.t.timed&&x.t.hh-x.hr>{n-1}&&x.t.hh-x.hr<={n}'
    if re.fullmatch(r'(appointment|call|email|paperwork|home|exercise|social) task ticked',l) or l=='task ticked' or l.startswith('ticked') or 'ticked' in l and 'frog' not in l and 'title' not in l and not l.startswith('task'):
        return "x.kind==='tick'"
    if l in('task ticked','task was ticked'):return "x.kind==='tick'"
    if re.fullmatch(r'(appointment|call|email|paperwork|home|exercise|social|frog) task postponed',l) or l=='frog postponed':return "x.kind==='postpone'"
    if re.fullmatch(r'(call|email|paperwork|home|exercise|social) task (is )?overdue',l):return 'x.t&&x.t.od>=1'
    m=re.fullmatch(r'email task overdue (\d+) to (\d+) days',l)
    if m:return f'x.t&&x.t.od>={m.group(1)}&&x.t.od<={m.group(2)}'
    m=re.fullmatch(r'email task overdue (\d+) or more days',l)
    if m:return f'x.t&&x.t.od>={m.group(1)}'
    if re.fullmatch(r"(call|email|paperwork|home|exercise|social|gym) task is today's frog",l):return 'x.t&&x.t.dragon'
    if re.fullmatch(r'(call|gym|social) task (is )?today',l):return 'x.t&&x.t.today'
    if l=='exactly 1 email task today':return 'x.emails===1'
    m=re.fullmatch(r'(\d+) or more call tasks today',l)
    if m:return f'x.calls>={m.group(1)}'
    m=re.fullmatch(r'(\d+) or more home tasks today',l)
    if m:return f'x.homeToday>={m.group(1)}'
    m=re.fullmatch(r'(\d+) or more social tasks in the next 7 days',l)
    if m:return f'x.social7>={m.group(1)}'
    m=re.fullmatch(r'(call|exercise|social|home) task (?:timed )?(before|after) (\d\d:\d\d)(?: on a friday)?',l)
    if m:
        t=hhmm(m.group(3));e=f'x.t&&x.t.timed&&x.t.hh<{t}' if m.group(2)=='before' else f'x.t&&x.t.timed&&x.t.hh>={t}'
        if 'friday' in l:e+='&&x.t.dow===5'
        return e
    if l=='timed call within the next 2 hours':return 'x.t&&x.t.today&&x.t.timed&&x.t.hh>=x.hr&&x.t.hh-x.hr<=2'
    if l in('call task today',):return 'x.t&&x.t.today'
    if re.fullmatch(r'(paperwork|home|social) task on saturday or sunday',l) or l=='home task on saturday or sunday' or l=='exercise task on saturday or sunday':return 'x.t&&(x.t.dow===0||x.t.dow===6)'
    m=re.fullmatch(r'paperwork task due in (\d+) to (\d+) days',l)
    if m:return f'x.t&&x.t.dd>={m.group(1)}&&x.t.dd<={m.group(2)}'
    m=re.fullmatch(r'(paperwork|home|exercise) task (?:ticked or added|added) after (\d\d:\d\d)',l)
    if m:return f"(x.kind==='add')&&x.hr>={hhmm(m.group(2))}"
    m=re.fullmatch(r'(home|paperwork) task ticked or added after (\d\d:\d\d)',l)
    if m:return f"(x.kind==='add')&&x.hr>={hhmm(m.group(2))}"
    if l=='exercise task added after 21:00':return "x.kind==='add'&&x.hr>=21"
    if l=='email task ticked after 22:00':return 'false'
    if l=='all home tasks today ticked' or l=='social task deleted' or l.startswith('3 or more exercise') or l.startswith('exercise ticked on'):return 'false'
    if l=='email task with a title of 4 words or fewer, added':return "x.kind==='add'&&x.t&&x.t.words<=4"
    if l=='exercise task ticked, duration 60 minutes or more':return 'false'
    # frog moment
    if l=='a task is chosen as the frog for a future day':return 'x.t&&x.t.dd>=1&&x.kind==="dragon"'
    if l=='frog is today':return 'x.t&&x.t.dragon'
    if l=='frog is today, app opened before 12:00':return 'x.t&&x.t.dragon&&x.hr<12'
    if l=='frog is today, app opened before 10:00':return 'x.t&&x.t.dragon&&x.hr<10'
    if l=='frog open, app opened after 13:00':return 'x.t&&x.t.dragon&&x.hr>=13'
    if l=='frog open, app opened after 18:00':return 'x.t&&x.t.dragon&&x.hr>=18'
    if l=='frog has a due date':return 'x.t&&true'
    if l=='frog created 3 or more days ago and still open':return 'x.t&&x.t.age>=3'
    if l=='frog is today and not yet started':return 'x.t&&x.t.dragon'
    if l=='frog ticked' or l=='frog ticked after 21:00':return "x.kind==='tick'"
    if l=='frog set after 22:00':return 'x.hr>=22'
    if l=='same task chosen as the frog on 2 or more different days':return 'false'
    m=re.fullmatch(r'frog moved (\d+) or more times',l)
    if m:return f'x.t&&x.t.moves>={m.group(1)}'
    if l=='frog title has plan, strategy, project, finish or sort out':
        return 'x.has(/\\b(?:plan|strategy|project|finish|sort out)/i)'
    if l in('paperwork task ticked',):return "x.kind==='tick'"
    return None
def comp(s):
    s=s.strip()
    r=atom(s)
    if r:return r
    m=re.fullmatch(r'(.*?),\s*(task ticked|task added|appointment is today|ticked|overdue|with paperwork|the task is today|and the task is today)',s)
    pre=None
    parts=[]
    m=re.fullmatch(r'(.+?),\s*(?:and )?(task ticked|task added|appointment is today|the task is today|overdue|with paperwork|ticked)',s,re.I)
    if m:parts=[m.group(1),m.group(2)]
    else:parts=re.split(r',\s*and\s+|\s+and\s+(?=\{n\}|no |\d|the )|,\s+',s)
    if len(parts)<2:return None
    out=[]
    for p in parts:
        pl=p.strip().lower()
        if pl=='overdue':c="x.t&&x.t.od>=1"
        elif pl=='the task is today':c='x.t&&x.t.today'
        elif pl=='with paperwork':c='true'
        elif pl in('task ticked','ticked'):c="x.kind==='tick'"
        elif pl=='task added':c="x.kind==='add'"
        elif pl=='appointment is today':c='x.t&&x.t.today'
        else:c=atom(p) or comp(p) if p!=s else None
        if not c:return None
        out.append('('+c+')')
    return '&&'.join(out)

DEFAULT={'briefing':1,'empty':3,'allDone':3,'overdue':2,'postponed':8,'late':1,'added':5,'overloaded':4,'frogPicked':8,'frog':8,'doctor':7,'emails':5,'calls':5,'paper':1,'chores':5,'exercise':3,'social':5,'done':3}
def facefor(m,t):
    l=t.lower();f=DEFAULT.get(m,5)
    happy=r"peace|enjoy|rest\b|free\b|holiday|treasure|rare|miracle|celebrat|ale\b|nap\b|sun\b|cake|dance|party|birthday|wedding|drinks|cheers|toast|proud|bards|victory|well done|splendid|glorious|go outside|be seen|every task|scroll is clear|garden|sunshine|lovely|delight"
    sus=r"suspicious|do not trust|checked twice|behind the tapestry|doubt|a trap|too quiet|what are you|were you|what have you|where is the catch"
    flus=r"blush|embarrass|furniture|finally|ancient|archaeolog|fossil"
    sad=r"\bweep|sigh|tear|mourn|grave|\bcry|tragic|alas|woe|lament"
    if m=='empty':
        if re.search(sus,l):return 10
        if re.search(happy,l):return 6
        return 3
    if m=='allDone':
        return 6 if re.search(happy+r"|every|clear|done|finished|slain|conquer",l) else 3
    if m=='overdue':
        if re.search(flus,l):return 9
        if re.search(sad,l):return 7
        return 2
    if m=='overloaded':
        return 4
    if m in('postponed','frog','frogPicked'):
        if re.search(sus,l):return 10
        if re.search(flus,l):return 9
        if re.search(happy,l):return 6
        return 8
    if m=='added':
        if re.search(sus,l):return 10
        if re.search(happy,l):return 6
        return 5
    if m=='late':return 1
    if m in('doctor',):
        return 7 if re.search(sad+r"|dentist|drill|needle|pain|dread|prepare|brace",l) else 5
    if m=='social':
        return 6 if re.search(happy,l) else 5
    if m=='exercise':
        return 6 if re.search(r"smug|proud|stronger|endorphin|glory|well done|victory",l) else (3 if re.search(r"regret|knights of old|dawn",l) else 5)
    if m in('emails','calls','paper','chores'):
        if re.search(sus,l):return 10
        if re.search(sad,l):return 7
        if re.search(happy,l):return 6
        return f
    if m=='briefing':
        if re.search(happy,l):return 6
        if re.search(sus,l):return 10
        return 1
    return f
fix=lambda t:re.sub(r'\bfrogs\b','dragons',re.sub(r'\bFrogs\b','Dragons',re.sub(r'\bfrog\b','dragon',re.sub(r'\bFrog\b','Dragon',t))))
out={};bad=[];tot=0
FACEMAP={'social':None}
for m,rows in d.items():
    if m=='social':rows=rows[:20]
    lst=[]
    for n,line,cond in rows:
        c=comp(cond);tot+=1
        if c is None:bad.append((m,cond));c='false'
        lst.append((fix(line),c,facefor(m,fix(line))))
    out[m]=lst
js='const LIB={\n'+',\n'.join(f'  {m}:['+',\n    '.join('['+json.dumps(t,ensure_ascii=False)+',x=>!!('+c+'),'+str(fc)+']' for t,c,fc in lst)+']' for m,lst in out.items())+'\n};\n'
open('app/js/library.js','w',encoding='utf-8').write(js)
print(tot,'lines; uncompiled:',len(bad))
for b in bad:print(b)
