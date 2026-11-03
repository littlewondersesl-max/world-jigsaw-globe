import osmium,json
L0,L1,B0,B1=-43.80,-42.95,-23.10,-22.75
RC={'motorway':0,'trunk':0,'primary':1,'secondary':1,'tertiary':2,'residential':3,'unclassified':3,'living_street':3,'service':4}
out={'roads':[],'coast':[],'areas':[]}
def inb(c):return any(L0<x<L1 and B0<y<B1 for x,y in c)
class H(osmium.SimpleHandler):
  def way(s,w):
    t=w.tags
    try:c=[(n.lon,n.lat) for n in w.nodes]
    except Exception:return
    if len(c)<2 or not inb(c):return
    h=t.get('highway')
    if h in RC and t.get('tunnel')!='yes':out['roads'].append([RC[h],[[round(x,5),round(y,5)] for x,y in c],1 if t.get('bridge')=='yes' else 0])
    if t.get('natural')=='coastline':out['coast'].append([[round(x,5),round(y,5)] for x,y in c])
  def area(s,a):
    t=a.tags;k=None
    n=t.get('natural');l=t.get('landuse')
    if n in('water','beach','wood','bare_rock','sand','scrub','wetland') :k=n
    elif l in('residential','commercial','industrial','forest','grass','retail','meadow'):k=l
    elif t.get('leisure') in ('park','golf_course','pitch'):k=t.get('leisure')
    elif t.get('aeroway')=='aerodrome':k='airport'
    if not k:return
    for o in a.outer_rings():
      c=[(n.lon,n.lat) for n in o]
      if len(c)>3 and inb(c):out['areas'].append([k,[[round(x,5),round(y,5)] for x,y in c],[[[round(n.lon,5),round(n.lat,5)] for n in i] for i in a.inner_rings(o)]])
H().apply_file('rio.pbf',locations=True)
print({k:len(v) for k,v in out.items()})
json.dump(out,open('osm.json','w'))
