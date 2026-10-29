import os,re,shutil,json
from PIL import Image
d=os.path.dirname(os.path.abspath(__file__));out=os.path.join(d,'site')
shutil.rmtree(out,ignore_errors=True);os.makedirs(out+'/knight')
for f in os.listdir(d+'/knight'):shutil.copy(d+'/knight/'+f,out+'/knight/'+f)
import time
shutil.copy(d+'/site-src/sync.js',out+'/sync.js')
open(out+'/sw.js','w').write(open(d+'/site-src/sw.js').read().replace('__VERSION__',str(int(time.time()))))
frag=open(d+'/dist/fragment.html',encoding='utf-8').read()
frag=re.sub(r'<title>.*?</title>\n','',frag,1)
frag=frag.replace('<script>\n','<script src="firebase-config.js"></script>\n<script src="sync.js"></script>\n<script>\n',1)
head='''<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,interactive-widget=resizes-content">
<title>The Realm</title>
<meta name="theme-color" content="#070504">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="The Realm">
<link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="icon-192.png"><link rel="apple-touch-icon" href="icon-192.png">
<style>html,body{margin:0;height:100%;background:#070504}</style>
'''
tail='''<script>if('serviceWorker' in navigator){var had=!!navigator.serviceWorker.controller,rl=false;navigator.serviceWorker.addEventListener('controllerchange',function(){if(had&&!rl){rl=true;location.reload();}});addEventListener('load',function(){navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(function(r){r.update();}).catch(function(){});});}</script>
</body></html>'''
open(out+'/index.html','w',encoding='utf-8').write(head+frag+'</body>'.replace('</body>','')+tail)
open(out+'/manifest.webmanifest','w').write(json.dumps({"name":"The Realm","short_name":"The Realm","description":"A task manager for one knight and his lord.","start_url":"./","scope":"./","display":"standalone","orientation":"portrait","background_color":"#070504","theme_color":"#070504","icons":[{"src":"icon-192.png","sizes":"192x192","type":"image/png","purpose":"any"},{"src":"icon-512.png","sizes":"512x512","type":"image/png","purpose":"any"},{"src":"icon-512-maskable.png","sizes":"512x512","type":"image/png","purpose":"maskable"}]},indent=1))
shutil.copy(d+'/site-src/firebase-config.js',out+'/firebase-config.js')
src=Image.open(d+'/knight/n1.png').convert('RGBA')
def icon(size,pad):
    bg=Image.new('RGBA',(size,size),(7,5,4,255));k=int(size*(1-2*pad));im=src.resize((k,k),Image.LANCZOS)
    bg.alpha_composite(im,((size-k)//2,(size-k)//2));return bg.convert('RGB')
icon(192,.04).save(out+'/icon-192.png');icon(512,.04).save(out+'/icon-512.png');icon(512,.16).save(out+'/icon-512-maskable.png')
print(os.listdir(out))
