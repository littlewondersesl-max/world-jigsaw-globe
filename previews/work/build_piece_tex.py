# World land-colour texture for puzzle-piece faces + globe country fill (equirect 4096x2048).
# Base: Natural Earth I shaded relief w/ land cover (public domain); South America/Brazil: our look-3 textures (WorldCover/Mapzen/Blue Marble) so pieces match the globe.
import numpy as np
from PIL import Image,ImageFilter,ImageEnhance
W,H=4096,2048
ne=Image.open('ne1/ne1_4k.jpg').convert('RGB')
ne=ImageEnhance.Color(ne).enhance(1.0);ne=Image.fromarray((255*(np.asarray(ne)/255.)**2.1).astype(np.uint8));ne=ImageEnhance.Color(ne).enhance(.8);a=np.asarray(ne).astype(np.float32);l=(a.mean(2,keepdims=True)/255)**2;ne=Image.fromarray((a*(1-(1-np.array([.9,1.,.85]))*(1-l))+l*40*(a.mean(2,keepdims=True)>150)).clip(0,255).astype(np.uint8))
out=np.asarray(ne).astype(np.float32)
def paste(img,mask,bb):  # bb lon0,lat0,lon1,lat1
    x0=int((bb[0]+180)/360*W);x1=int((bb[2]+180)/360*W);y0=int((90-bb[3])/180*H);y1=int((90-bb[1])/180*H)
    c=np.asarray(Image.open(img).convert('RGB').resize((x1-x0,y1-y0),Image.LANCZOS)).astype(np.float32)
    m=np.asarray(Image.open(mask).convert('L').resize((x1-x0,y1-y0),Image.BILINEAR).filter(ImageFilter.GaussianBlur(1))).astype(np.float32)[...,None]/255
    out[y0:y1,x0:x1]=out[y0:y1,x0:x1]*(1-m)+c*m
paste('../south-america/c3.jpg','../south-america/mask.png',(-82,-56,-34,13))
import json;bb=json.load(open('../brazil/shape.json'))['bbox'];paste('../brazil/c3.jpg','../brazil/mask.png',(bb[0],bb[2],bb[1],bb[3]))
Image.fromarray(out.clip(0,255).astype(np.uint8)).save('../../pieces_world.jpg',quality=86)
