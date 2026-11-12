// A small script that lives inside every wireframe and prototype file.
// When the page that shows the prototype asks ("dp-export"), it measures every screen (boxes, colours, text) and sends the
// result back, so the screens can be copied into Figma as shapes and text. It changes nothing on the page.
export const EXPORT_JS = String.raw`
(function(){
function col(s){var m=/rgba?\(([^)]+)\)/.exec(s||'');if(!m)return null;var p=m[1].split(',').map(parseFloat);var a=p.length>3?p[3]:1;if(!(a>0))return null;function h(n){return ('0'+Math.round(n).toString(16)).slice(-2)}return {hex:'#'+h(p[0])+h(p[1])+h(p[2]),a:a}}
function fam(s){var f=(s||'').split(',')[0].replace(/["']/g,'').trim();return (!f||/system-ui|-apple-system|sans-serif|BlinkMacSystemFont|Segoe UI|Roboto|Helvetica|Arial/i.test(f))?'Inter':f}
function nameOf(c){var k=(typeof c.className==='string'&&c.className)?c.className.split(' ')[0]:'';return k||c.tagName.toLowerCase()}
function exportAll(){
  var screens=[].slice.call(document.querySelectorAll('.screen'));
  var active=screens.filter(function(s){return s.classList.contains('active')})[0];
  var bar=document.querySelector('.proto-bar,.menu');var top0=bar?bar.getBoundingClientRect().height:0;
  var labels={};[].forEach.call(document.querySelectorAll('#jump option'),function(o){labels[o.value]={name:o.textContent,group:(o.parentNode&&o.parentNode.tagName==='OPTGROUP')?o.parentNode.label:''}});
  var bodyBg=col(getComputedStyle(document.body).backgroundColor);
  var result=[];
  screens.forEach(function(sec){
    screens.forEach(function(s){s.classList.toggle('active',s===sec)});
    window.scrollTo(0,0);
    var W=document.documentElement.clientWidth,H=Math.max(document.documentElement.scrollHeight,window.innerHeight);
    var fixedShift=H-window.innerHeight,nodes=[];
    function box(c,cs,x,y,w,h){
      var bg=col(cs.backgroundColor),img=cs.backgroundImage&&cs.backgroundImage!=='none';
      var bw=[parseFloat(cs.borderTopWidth),parseFloat(cs.borderRightWidth),parseFloat(cs.borderBottomWidth),parseFloat(cs.borderLeftWidth)];
      var bc=[col(cs.borderTopColor),col(cs.borderRightColor),col(cs.borderBottomColor),col(cs.borderLeftColor)];
      var st=[cs.borderTopStyle,cs.borderRightStyle,cs.borderBottomStyle,cs.borderLeftStyle];
      var rad=parseFloat(cs.borderTopLeftRadius)||0;if(/%/.test(cs.borderTopLeftRadius))rad=Math.min(w,h)*rad/100;rad=Math.min(rad,Math.min(w,h)/2);
      var uni=bw[0]>0&&bw[0]===bw[1]&&bw[1]===bw[2]&&bw[2]===bw[3]&&bc[0]&&st[0]!=='none';
      if(bg||img||uni)nodes.push({t:'rect',n:nameOf(c),x:x,y:y,w:w,h:h,r:rad,fill:bg?bg.hex:(img?'#e8e8ee':null),fo:bg?bg.a:1,stroke:uni?bc[0].hex:null,sw:uni?bw[0]:0});
      if(!uni){
        var sides=[[0,x,y,w,bw[0]],[1,x+w-bw[1],y,bw[1],h],[2,x,y+h-bw[2],w,bw[2]],[3,x,y,bw[3],h]];
        sides.forEach(function(s){var i=s[0];if(bw[i]>0&&bc[i]&&st[i]!=='none')nodes.push({t:'rect',n:'line',x:s[1],y:s[2],w:s[3],h:s[4],r:0,fill:bc[i].hex,fo:bc[i].a,stroke:null,sw:0})});
      }
    }
    function put(txt,left,top,h,cs,sh){
      if(cs.textTransform==='uppercase')txt=txt.toUpperCase();
      var f=col(cs.color)||{hex:'#000000',a:1};
      nodes.push({t:'text',x:left+window.scrollX,y:top+window.scrollY+sh-top0,h:h,text:txt,size:parseFloat(cs.fontSize),weight:cs.fontWeight,family:fam(cs.fontFamily),fill:f.hex,fo:f.a});
    }
    function textOf(c,cs,sh){
      var tag=c.tagName;
      if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'){
        var v='';if(tag==='SELECT'){v=c.selectedOptions&&c.selectedOptions[0]?c.selectedOptions[0].text:''}
        else{v=c.value||c.placeholder||'';if(c.type==='date'&&/^\d{4}-\d\d-\d\d$/.test(v)){var d=v.split('-');v=d[2]+'/'+d[1]+'/'+d[0]}}
        if(v){var r=c.getBoundingClientRect(),pl=parseFloat(cs.paddingLeft)||0,pt=parseFloat(cs.paddingTop)||0,lh=parseFloat(cs.lineHeight)||parseFloat(cs.fontSize)*1.4;
          put(v,r.left+pl+(parseFloat(cs.borderLeftWidth)||0),tag==='TEXTAREA'?r.top+pt:r.top+(r.height-lh)/2,lh,cs,sh)}
        return;
      }
      for(var i=0;i<c.childNodes.length;i++){
        var n=c.childNodes[i];if(n.nodeType!==3||!/\S/.test(n.nodeValue))continue;
        var re=/\S+/g,m,ws=[];
        while((m=re.exec(n.nodeValue))){var rg=document.createRange();rg.setStart(n,m.index);rg.setEnd(n,m.index+m[0].length);var rs=rg.getClientRects();if(rs.length)ws.push({w:m[0],r:rs[0]})}
        var ls=[];ws.forEach(function(o){var l=ls[ls.length-1];if(l&&Math.abs(l.top-o.r.top)<4){l.text+=' '+o.w}else ls.push({text:o.w,top:o.r.top,left:o.r.left,h:o.r.height})});
        ls.forEach(function(l){put(l.text,l.left,l.top,l.h,cs,sh)});
      }
    }
    function walk(el,shift){
      for(var i=0;i<el.children.length;i++){
        var c=el.children[i];if(/^(SCRIPT|STYLE|LINK|META)$/.test(c.tagName))continue;
        var cs=getComputedStyle(c);if(cs.display==='none'||cs.visibility==='hidden')continue;
        var r=c.getBoundingClientRect();if(r.width<1||r.height<1)continue;
        var sh=shift;if(cs.position==='fixed')sh=(r.bottom>=window.innerHeight-1)?fixedShift:0;
        box(c,cs,r.left+window.scrollX,r.top+window.scrollY+sh-top0,r.width,r.height);
        textOf(c,cs,sh);walk(c,sh);
      }
    }
    walk(sec,0);
    var id=sec.id.replace('screen-','');var lab=labels[id]||{name:id,group:''};
    result.push({id:id,name:lab.name,group:lab.group,width:W,height:H-top0,nodes:nodes});
  });
  screens.forEach(function(s){s.classList.toggle('active',s===active)});
  return {screens:result,bg:bodyBg?bodyBg.hex:'#ffffff'};
}
window.addEventListener('message',function(e){
  if(!e.data||e.data.type!=='dp-export')return;
  var res;try{var r=exportAll();res={type:'dp-export-result',ok:true,screens:r.screens,bg:r.bg}}catch(err){res={type:'dp-export-result',ok:false,error:String(err)}}
  if(e.source)e.source.postMessage(res,'*');
});
})();
`;
