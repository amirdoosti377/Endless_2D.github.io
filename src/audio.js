export class AudioFX {
  constructor(){this.enabled=false;this.context=null;this.active=0;this.last={};}
  toggle(){
    try{this.context??=new(window.AudioContext||window.webkitAudioContext)();this.context.resume().catch(()=>{});this.enabled=!this.enabled;}catch{this.enabled=false;}
    return this.enabled;
  }
  play(type,size=16){
    if(!this.enabled||this.context?.state!=='running')return;
    const ctx=this.context,t=ctx.currentTime;
    const pitches={shoot:540,kill:size>20?95:170,hurt:70,level:740,heal:620,hazard:260,boss:90,bossDefeated:880,dead:110};
    if(!pitches[type]||t-(this.last[type]??-10)<(type==='shoot'?.065:type==='kill'?.045:.12)||this.active>=12)return;
    this.last[type]=t;
    const tone=(frequency,duration,volume,wave='sine',ratio=.4)=>{
      if(this.active>=12)return;
      const o=ctx.createOscillator(),g=ctx.createGain();this.active++;
      o.type=wave;o.frequency.setValueAtTime(frequency,t);o.frequency.exponentialRampToValueAtTime(frequency*ratio,t+duration);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.008);g.gain.exponentialRampToValueAtTime(.001,t+duration);
      o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+duration+.02);o.onended=()=>{this.active--;o.disconnect();g.disconnect();};
    };
    const f=pitches[type]*(.93+Math.random()*.14);
    tone(f,type==='dead'?.5:.18,type==='shoot'?.017:.045,type==='hurt'?'triangle':'sine',['level','heal','bossDefeated'].includes(type)?1.6:.4);
    if(['kill','hurt','boss','dead'].includes(type)){
      tone(f*.51,.25,.035,'triangle');
      if(this.active>=12)return;
      const length=.17,buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*length),ctx.sampleRate),data=buffer.getChannelData(0);
      for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);
      const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();this.active++;
      source.buffer=buffer;filter.type='lowpass';filter.frequency.value=type==='hurt'?650:1900;
      gain.gain.setValueAtTime(.07,t);gain.gain.exponentialRampToValueAtTime(.001,t+length);
      source.connect(filter);filter.connect(gain);gain.connect(ctx.destination);source.start(t);source.onended=()=>{this.active--;source.disconnect();filter.disconnect();gain.disconnect();};
    }
  }
}
