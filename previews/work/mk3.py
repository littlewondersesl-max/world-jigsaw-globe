import json
t=open('work/tpl.html').read()
CJ=json.load(open('work/cities.json'));BR=CJ['br']
SA=CJ['sa']
cfg={'brazil':dict(TITLE='Brazil HD preview',DS='.12',SEGX='1400',SEGY='1440',TREES='90000',SHOW='null',CITIES=BR,LINKS='<a href="../south-america/">South America</a><a href="../globe-reveal/">Globe reveal</a><a href="old.html?look=3">previous version</a>',
  SHOTS=[['rio',-43.23,-22.92,.8,1.1],['spz',-46.63,-23.56,.18,.9],['rioz',-43.3,-22.88,.2,.9],['recife',-34.92,-8.07,.5,1.0],['sp',-46.63,-23.56,.6,1.1],['west',-73.2,-7.5,.6,.9],['south',-53.3,-33.5,.6,.9],['manaus',-60,-3.1,.7,.9]]),
 'south-america':dict(TITLE='South America HD preview',DS='.12',SEGX='1000',SEGY='1540',TREES='110000',SHOW='null',CITIES=SA,LINKS='<a href="../brazil/">Brazil close-up</a><a href="../globe-reveal/">Globe reveal</a><a href="old.html">previous version</a>',
  SHOTS=[['plata',-57.3,-35.0,1.3,1.0],['horn',-68.5,-54.8,1.2,1.0],['andes',-69.4,-15.8,1.2,.8],['rio',-43.23,-22.92,.8,1.1],['poa',-51.5,-31.0,.9,1.0],['ba',-58.4,-34.6,.5,1.0]])}
import copy
sc=dict(cfg['brazil']);sc.update(TITLE='Brazil showcase – Rio de Janeiro craftsman pass',SHOW=json.dumps(dict(lo=-43.25,la=-22.9,r=.11,ru=.011)),LINKS='<a href="../brazil/">Brazil (untouched)</a><a href="../globe-reveal/">Globe reveal</a>',
 SHOTS=[['rio',-43.23,-22.92,.8,1.1],['rioz',-43.25,-22.92,-.2,.9],['riozz',-43.2,-22.94,-.09,.8],['spz',-46.63,-23.56,-.2,.9],['spzz',-46.63,-23.56,-.09,.8],['ctl',-48.3,-25.3,-.2,.9]])
import os;os.makedirs('brazil-showcase',exist_ok=True);pass  # brazil-showcase now hand-built (v1.html kept)
for d,c in cfg.items():
  s=t
  for k,v in c.items():s=s.replace('%'+k+'%',v if isinstance(v,str) else json.dumps(v,ensure_ascii=False))
  if d=='brazil-showcase':s=s.replace('<head>','<head><base href="../brazil/">',1)
  open(d+'/index.html','w').write(s)
