// Rebuilt once per simulation tick. Buckets and query buffers are reused.
export class SpatialGrid {
  constructor(size=96){this.size=size;this.cells=new Map();this.pool=[];this.results=[];}
  rebuild(entities){
    for(const bucket of this.cells.values()){bucket.length=0;this.pool.push(bucket);}
    this.cells.clear();
    for(const e of entities){
      if(e.hp<=0)continue;
      const key=`${Math.floor(e.x/this.size)},${Math.floor(e.y/this.size)}`;
      let bucket=this.cells.get(key);
      if(!bucket){bucket=this.pool.pop()||[];this.cells.set(key,bucket);}
      bucket.push(e);
    }
  }
  query(left,top,right,bottom){
    const out=this.results;out.length=0;
    for(let x=Math.floor(left/this.size);x<=Math.floor(right/this.size);x++)
      for(let y=Math.floor(top/this.size);y<=Math.floor(bottom/this.size);y++){
        const bucket=this.cells.get(`${x},${y}`);
        if(bucket)for(const e of bucket)out.push(e);
      }
    return out;
  }
}
export function compact(array,keep){let n=0;for(let i=0;i<array.length;i++)if(keep(array[i]))array[n++]=array[i];array.length=n;}
