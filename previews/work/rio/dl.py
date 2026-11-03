import math,os,concurrent.futures as cf,urllib.request
z=13;L0,L1,B0,B1=-43.80,-42.95,-23.10,-22.75
tx=lambda lo:int((lo+180)/360*2**z)
ty=lambda la:int((1-math.log(math.tan(math.radians(la))+1/math.cos(math.radians(la)))/math.pi)/2*2**z)
J=[(x,y) for x in range(tx(L0),tx(L1)+1) for y in range(ty(B1),ty(B0)+1)]
print(len(J))
def g(j):
  x,y=j;f=f't13/{x}_{y}.png'
  if not os.path.exists(f):urllib.request.urlretrieve(f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',f)
list(cf.ThreadPoolExecutor(16).map(g,J))
