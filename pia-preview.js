(() => {
  const states = [
    {id:'idle',label:'维修区待命',row:0,frames:6,description:'暂时没有任务，和小赛车一起等候。'},
    {id:'running-right',label:'向右开车',row:1,frames:8,description:'向右移动的小赛车。'},
    {id:'running-left',label:'向左开车',row:2,frames:8,description:'向左移动的小赛车。'},
    {id:'waving',label:'向你挥手',row:3,frames:4,description:'向看台，也向你打个招呼。'},
    {id:'jumping',label:'跳跃庆祝',row:4,frames:5,description:'一个跳跃动作，不代表 Agent 任务已经完成。'},
    {id:'failed',label:'失误沮丧',row:5,frames:8,description:'任务遇到错误，赛车手也有失落的时候。'},
    {id:'waiting',label:'等待指令',row:6,frames:6,description:'等待你的批准、回答或下一条指令。'},
    {id:'running',label:'专注驾驶',row:7,frames:6,description:'专注操控，对应 Agent 正在处理任务。'},
    {id:'review',label:'赛后检查',row:8,frames:6,description:'检查前轮，对应检查已完成的内容。'}
  ];
  window.startPiaPreview = function(host) {
    const sprite=host.querySelector('.pia-sprite');
    if(!sprite)return ()=>{};
    const name=host.querySelector('#pia-state-name');
    const desc=host.querySelector('#pia-state-desc');
    const play=host.querySelector('#pia-play');
    const direction=host.querySelector('#pia-direction');
    const directionName=host.querySelector('#pia-direction-name');
    const error=host.querySelector('#pia-error');
    const buttons=[...host.querySelectorAll('[data-pia-state]')];
    let selected=states[0],frame=0,look=null,ready=false,alive=true;
    let playing=!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function paint(){
      const row=look===null?selected.row:9+Math.floor(look/8);
      const column=look===null?frame:look%8;
      sprite.style.backgroundPosition=(column/7*100)+'% '+(row/10*100)+'%';
    }
    function updatePlay(){
      play.textContent=playing?'暂停动画':'播放动画';
      play.setAttribute('aria-pressed',String(playing));
    }
    function select(id){
      selected=states.find(s=>s.id===id)||states[0];frame=0;look=null;
      name.textContent=selected.label;desc.textContent=selected.description;
      sprite.setAttribute('aria-label','Pia：'+selected.label+'；点击挥手');
      buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.piaState===selected.id)));
      directionName.textContent='拖动滑块，让 Pia 看向不同方向';
      paint();
    }
    function click(e){
      const button=e.target.closest('[data-pia-state]');
      if(button){select(button.dataset.piaState);return;}
      if(e.target.closest('#pia-play')){playing=!playing;updatePlay();return;}
      if(e.target.closest('.pia-sprite'))select('waving');
    }
    function input(e){
      if(e.target!==direction)return;
      look=Math.max(0,Math.min(15,Number(direction.value)||0));
      name.textContent='观察方向';
      desc.textContent='这位小赛车手正在看向 '+(look*22.5)+'°。选择任意动作可返回动画。';
      directionName.textContent=(look*22.5)+'° / '+(look+1)+' of 16';
      sprite.setAttribute('aria-label','Pia 观察方向 '+(look*22.5)+' 度；点击挥手');
      buttons.forEach(b=>b.setAttribute('aria-pressed','false'));paint();
    }
    host.addEventListener('click',click);host.addEventListener('input',input);
    select('idle');updatePlay();
    const image=new Image();
    image.onload=()=>{if(alive){ready=true;error.hidden=true;}};
    image.onerror=()=>{if(alive){sprite.hidden=true;error.hidden=false;error.textContent='动画暂时未能加载，可以通过下方链接查看 Petdex 展示页。';}};
    image.src='assets/pia/spritesheet.webp';
    const timer=setInterval(()=>{
      if(!alive||!ready||!playing||look!==null||document.hidden)return;
      frame=(frame+1)%selected.frames;paint();
    },125);
    return ()=>{alive=false;clearInterval(timer);image.onload=null;image.onerror=null;host.removeEventListener('click',click);host.removeEventListener('input',input);};
  };
})();
