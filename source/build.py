import os
d=os.path.dirname(os.path.abspath(__file__))
r=lambda p:open(os.path.join(d,p),encoding='utf-8').read()
css=r('style.css')
js=r('js/icons.js')+'\n'+r('js/lines.js')+'\n'+r('js/library.js')+'\n'+r('js/parse.js')+'\n'+r('js/app.js')+'\n'+r('js/camp.js')+'\n'+r('js/ritual.js')+'\n'+r('js/oath.js')+'\n'+r('js/ext.js')
frag=f'''<title>The Realm</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap">
<style>
{css}
</style>
<div class="app" id="app"></div>
<script>
{js}
</script>
'''
os.makedirs(os.path.join(d,'dist'),exist_ok=True)
open(os.path.join(d,'dist/fragment.html'),'w',encoding='utf-8').write(frag)
open(os.path.join(d,'dist/test.html'),'w',encoding='utf-8').write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0">'+frag.replace('src="knight/','src="../knight/').replace("'knight/'","'../knight/'")+'</body></html>')
print(len(frag))
