(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const small = matchMedia('(max-width: 850px)');
  const toggle = document.querySelector('.motion-toggle');
  const story = document.querySelector('.material-story');
  const art = document.querySelector('.hero-art');
  const stageButtons = [...document.querySelectorAll('[data-material-step]')];
  const rim = document.querySelector('#profile-rim');
  const sides = document.querySelector('#profile-sides');
  const hole = document.createElementNS('http://www.w3.org/2000/svg','path');
  hole.setAttribute('fill','#263f51');
  sides.after(hole);
  const highlight = document.querySelector('#profile-highlight');
  const graphic = document.querySelector('.material-graphic');
  const svgNS = 'http://www.w3.org/2000/svg';
  const count = 80;
  const sidePaths = Array.from({length:count}, () => {
    const path = document.createElementNS(svgNS,'path');
    path.classList.add('profile-side');
    sides.appendChild(path);
    return path;
  });
  let playing = !reduced.matches, explicitlyChosen = false;
  let current = 0, target = 0, frame = 0, lastFrame = 0, lastStage = -1;
  let visible = false, startedAt = null, automatic = true;
  const clamp = value => Math.max(0, Math.min(1,value));
  const ease = value => value*value*(3-2*value);
  const stageText = [
    '가공을 기다리는 한 장의 소재.<br>다음 형태를 위한 출발점입니다.',
    '부드러운 곡선으로 이어지는 원형.<br>스테인리스 강관의 기본 형상입니다.',
    '직선과 모서리로 완성되는 각형.<br>쓰임에 따라 소재의 형태도 달라집니다.'
  ];
  function setStage(progress) {
    const index = progress < .27 ? 0 : progress < .73 ? 1 : 2;
    if (index === lastStage) return;
    lastStage = index;
    stageButtons.forEach((button,i) => {
      button.classList.toggle('active',i===index);
      button.setAttribute('aria-pressed',String(i===index));
    });
    document.querySelector('.material-copy').innerHTML = stageText[index];
    document.querySelector('#material-shape-label').textContent = ['01 / MATERIAL','02 / ROUND PIPE','03 / SQUARE PIPE'][index];
    graphic.dataset.stage = String(index);
  }
  function draw(progress) {
    const roundness = ease(clamp(progress*2));
    const squareness = ease(clamp((progress-.5)*2));
    const exponent = 2+7*squareness;
    const radiusX = 174-8*roundness;
    const radiusY = 13+135*roundness;
    const holeScale = .03+.74*roundness;
    const depth = 48+45*roundness;
    const outer=[],inner=[];
    for(let i=0;i<count;i++) {
      const t=i/count*Math.PI*2;
      const x=Math.sign(Math.cos(t))*Math.pow(Math.abs(Math.cos(t)),2/exponent)*radiusX;
      const y=Math.sign(Math.sin(t))*Math.pow(Math.abs(Math.sin(t)),2/exponent)*radiusY;
      outer.push([300+x+y*.18,338+y*.77]);
      inner.push([300+x*holeScale+y*.18*holeScale,338+y*.77*holeScale]);
    }
    const pair=point=>point.map(value=>value.toFixed(2)).join(' ');
    const polygon=points=>'M'+points.map(pair).join('L')+'Z';
    const innerReverse=[...inner].reverse();
    hole.setAttribute('d',polygon(inner));
    rim.setAttribute('d',polygon(outer)+polygon(innerReverse));
    highlight.setAttribute('d','M'+outer.slice(37,73).map(pair).join('L'));
    outer.forEach((point,index) => {
      const next=outer[(index+1)%count];
      sidePaths[index].setAttribute('d',polygon([point,next,[next[0]+depth,next[1]-depth*.9],[point[0]+depth,point[1]-depth*.9]]));
      const light=.5+.5*Math.cos(index/count*Math.PI*2-.7);
      const shade=Math.round(55+light*145);
      const color=`rgb(${shade-8} ${shade+3} ${Math.min(255,shade+15)})`;
      sidePaths[index].setAttribute('fill',color);
      sidePaths[index].setAttribute('stroke',color);
      sidePaths[index].setAttribute('stroke-width','.7');
    });
    document.querySelector('.material-progress span').style.transform=`scaleX(${progress})`;
    story.dataset.progress=progress.toFixed(3);
    setStage(progress);
  }
  function requestFrame() { if (!frame) frame=requestAnimationFrame(tick); }
  function tick(now) {
    frame=0;
    if(document.hidden) return;
    const dt=Math.min(40,now-(lastFrame||now));
    lastFrame=now;
    if (visible && playing && small.matches && automatic) {
      startedAt ??= now;
      const elapsed=(now-startedAt)/1000;
      target=clamp((elapsed-1.5)/9);
      if (elapsed>=11) automatic=false;
    }
    const difference=target-current;
    if (playing && visible) current+=difference*(1-Math.exp(-dt/150));
    else if (!playing) current=target;
    if (Math.abs(target-current)<.0005) current=target;
    draw(current);
    if (visible && playing && (Math.abs(target-current)>.0005 || (small.matches&&automatic))) requestFrame();
  }
  function updateScroll() {
    const available=document.documentElement.scrollHeight-innerHeight;
    document.querySelector('.scroll-progress').style.transform=`scaleX(${clamp(scrollY/Math.max(1,available))})`;
    document.querySelector('.site-header').classList.toggle('scrolled',scrollY>15);
    if (!small.matches && visible && playing) {
      const bounds=story.getBoundingClientRect();
      target=clamp((90-bounds.top)/Math.max(1,story.offsetHeight-innerHeight+90));
      requestFrame();
    }
  }
  function setMotion() {
    root.dataset.motion=playing?'playing':'paused';
    toggle.setAttribute('aria-pressed',String(!playing));
    toggle.setAttribute('aria-label',playing?'모션 일시정지':'모션 재생');
    toggle.querySelector('.motion-toggle-icon').textContent=playing?'Ⅱ':'▷';
    toggle.querySelector('.motion-toggle-label').textContent=playing?'모션 정지':'모션 재생';
    document.getAnimations().forEach(animation => {
      if (!playing && animation.effect?.target?.closest?.('.quality-image')) animation.finish();
      else if (!playing && animation.playState === 'running') animation.pause();
      else if (playing && animation.playState === 'paused') animation.play();
    });
    if (!playing) { automatic=false; target=current; draw(current); }
    else { if(small.matches){automatic=true;startedAt=performance.now()-current*9000-1500;} updateScroll();requestFrame(); }
  }
  toggle.addEventListener('click',()=>{explicitlyChosen=true;playing=!playing;setMotion();});
  reduced.addEventListener('change',()=>{if(!explicitlyChosen){playing=!reduced.matches;setMotion();}});
  stageButtons.forEach((button,index)=>button.addEventListener('click',()=>{
    automatic=false;
    target=index/2;
    if(!playing) { current=target;draw(current); }
    else requestFrame();
  }));
  small.addEventListener('change',()=>{automatic=true;startedAt=null;updateScroll();requestFrame();});
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries=>entries.forEach(entry=>{
      visible=entry.isIntersecting;
      if(visible) {updateScroll();requestFrame();}
      else lastFrame=0;
    }),{rootMargin:'60px'}).observe(story);
    new IntersectionObserver(entries=>entries.forEach(entry=>art.classList.toggle('out-of-view',!entry.isIntersecting))).observe(art);
  } else {visible=true;requestFrame();}
  addEventListener('scroll',updateScroll,{passive:true});
  addEventListener('resize',updateScroll,{passive:true});
  document.addEventListener('visibilitychange',()=>{lastFrame=0;if(!document.hidden)requestFrame();});

  const lineSpans=document.querySelectorAll('.title-line>span');
  if(playing) lineSpans.forEach((span,index)=>span.animate([{transform:'translateY(105%)'},{transform:'translateY(0)'}],{duration:1100,delay:index*160,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'}));
  const photo=document.querySelector('.quality-image');
  for(let i=0;i<4;i++) {const slice=document.createElement('span');slice.className='image-slice';slice.setAttribute('aria-hidden','true');photo.appendChild(slice);}
  const revealObserver='IntersectionObserver' in window ? new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(!entry.isIntersecting) return;
    const element=entry.target;
    if(playing && element===photo) {
      photo.classList.add('slice-playing');
      const animations=[...photo.querySelectorAll('.image-slice')].map((slice,index)=>slice.animate([{transform:`translateY(${index%2?-65:65}px) scale(.95)`,opacity:0},{transform:'translateY(0) scale(1)',opacity:1}],{duration:1050,delay:index*110,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'}));
      Promise.all(animations.map(animation=>animation.finished)).then(()=>{photo.classList.remove('slice-playing');animations.forEach(animation=>animation.cancel());}).catch(()=>photo.classList.remove('slice-playing'));
    } else if(playing) element.classList.add('motion-reveal');
    revealObserver.unobserve(element);
  }),{threshold:.22}):null;
  document.querySelectorAll('.about h2,.section-heading h2,.history h2,.contact h2,.quality-image').forEach(element=>revealObserver?.observe(element));

  const wordmark=document.querySelector('.footer-wordmark');
  [...wordmark.childNodes].filter(node=>node.nodeType===3).forEach(node=>{
    const fragment=document.createDocumentFragment();
    [...node.textContent].forEach(letter=>{const span=document.createElement('span');span.className='letter';span.textContent=letter;fragment.appendChild(span);});
    node.replaceWith(fragment);
  });
  wordmark.addEventListener('pointermove',event=>{
    if(!playing||event.pointerType==='touch')return;
    wordmark.querySelectorAll('.letter').forEach(letter=>{
      const rect=letter.getBoundingClientRect();
      const distance=Math.abs(event.clientX-(rect.left+rect.width/2));
      letter.style.setProperty('--letter-lift',String(-Math.max(0,1-distance/160)*18));
    });
  });
  wordmark.addEventListener('pointerleave',()=>wordmark.querySelectorAll('.letter').forEach(letter=>letter.style.setProperty('--letter-lift','0')));
  setMotion();
  draw(0);
  root.classList.add('motion-ready');
  updateScroll();
})();
