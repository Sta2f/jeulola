"""Extract user-approved illustrated Lola sprites from the generated reference atlas.
Keeps source art unchanged; removes only connected neutral checkerboard pixels.
Usage: python scripts/chicken-lola-assets.py <source.png>
"""
from pathlib import Path
from collections import deque
import sys
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
root=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1])
atlas=Image.open(source).convert('RGB')
out=root/'public/assets/chicken/lola'
out.mkdir(parents=True,exist_ok=True)
names=[*[f'walk-down-{i}' for i in range(4)],*[f'walk-up-{i}' for i in range(4)],*[f'walk-right-{i}' for i in range(4)],'idle-down','run-right','surprised','victory']
preview=Image.new('RGB',(1024,1024),'#8cba57')
for n,name in enumerate(names):
 col,row=n%4,n//4
 top,bottom=[(0,310),(315,615),(618,907),(908,1254)][row]
 im=atlas.crop((round(col*atlas.width/4),top,round((col+1)*atlas.width/4),bottom))
 a=np.asarray(im).astype(np.int16); h,w=a.shape[:2]
 neutral=(a.max(2)-a.min(2)<31)&(a.min(2)>98)
 visited=np.zeros((h,w),bool); background=np.zeros((h,w),bool)
 for yy in range(h):
  for xx in range(w):
   if visited[yy,xx] or not neutral[yy,xx]:continue
   q=deque([(xx,yy)]); visited[yy,xx]=True; component=[]; edge=False
   while q:
    x,y=q.popleft();component.append((x,y));edge|=x==0 or y==0 or x==w-1 or y==h-1
    for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
     if 0<=nx<w and 0<=ny<h and not visited[ny,nx] and neutral[ny,nx]:visited[ny,nx]=True;q.append((nx,ny))
   vals=np.array([a[y,x,0] for x,y in component])
   checker=len(component)>160 and np.percentile(vals,90)-np.percentile(vals,10)>36
   if edge:
    for x,y in component:background[y,x]=True
 alpha=Image.fromarray(np.where(background,0,255).astype('uint8')).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(.35))
 rgba=im.convert('RGBA');rgba.putalpha(alpha)
 bounds=alpha.point(lambda v:255 if v>100 else 0).getbbox()
 crop=rgba.crop(bounds)
 ratio=min(238/crop.height,236/crop.width)
 crop=crop.resize((round(crop.width*ratio),round(crop.height*ratio)),Image.Resampling.LANCZOS)
 normalized=Image.new('RGBA',(256,256));normalized.alpha_composite(crop,((256-crop.width)//2,246-crop.height))
 normalized.save(out/(name+'.png'),optimize=True)
 preview.paste(normalized,(col*256,row*256),normalized)
 print(name,bounds,'=>',crop.size)
preview.save(root/'output/imagegen/lola-alpha-check.png')

