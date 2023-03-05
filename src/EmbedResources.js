let logStyling = getLogStyling();
let popupStyling = getPopupStyling();
const ATTRS = getAttrs();
const allTags = getPermissions();
export {logStyling, popupStyling, ATTRS, allTags};

function getAttrs() {
  return {
    html: `accept,action,align,alt,autocapitalize,autocomplete,autopictureinpicture,autoplay,background,bgcolor,border,capture,cellpadding,cellspacing,checked,cite,class,clear,color,cols,colspan,controls,controlslist,coords,crossorigin,datetime,decoding,default,dir,disabled,disablepictureinpicture,disableremoteplayback,download,draggable,enctype,enterkeyhint,face,for,headers,height,hidden,high,href,hreflang,id,inputmode,integrity,ismap,kind,label,lang,list,loading,loop,low,max,maxlength,media,method,min,minlength,multiple,muted,name,nonce,noshade,novalidate,nowrap,open,optimum,pattern,placeholder,playsinline,poster,preload,pubdate,radiogroup,readonly,rel,required,rev,reversed,role,rows,rowspan,spellcheck,scope,selected,shape,size,sizes,span,srclang,start,src,srcset,step,style,summary,tabindex,target,title,translate,type,usemap,valign,value,width,xmlns,slot`
      .split(`,`),
    svg:`accent-height,accumulate,additive,alignment-baseline,ascent,attributename,attributetype,azimuth,basefrequency,baseline-shift,begin,bias,by,class,clip,clippathunits,clip-path,clip-rule,color,color-interpolation,color-interpolation-filters,color-profile,color-rendering,cx,cy,d,dx,dy,diffuseconstant,direction,display,divisor,dur,edgemode,elevation,end,fill,fill-opacity,fill-rule,filter,filterunits,flood-color,flood-opacity,font-family,font-size,font-size-adjust,font-stretch,font-style,font-variant,font-weight,fx,fy,g1,g2,glyph-name,glyphref,gradientunits,gradienttransform,height,href,id,image-rendering,in,in2,k,k1,k2,k3,k4,kerning,keypoints,keysplines,keytimes,lang,lengthadjust,letter-spacing,kernelmatrix,kernelunitlength,lighting-color,local,marker-end,marker-mid,marker-start,markerheight,markerunits,markerwidth,maskcontentunits,maskunits,max,mask,media,method,mode,min,name,numoctaves,offset,operator,opacity,order,orient,orientation,origin,overflow,paint-order,path,pathlength,patterncontentunits,patterntransform,patternunits,points,preservealpha,preserveaspectratio,primitiveunits,r,rx,ry,radius,refx,refy,repeatcount,repeatdur,restart,result,rotate,scale,seed,shape-rendering,specularconstant,specularexponent,spreadmethod,startoffset,stddeviation,stitchtiles,stop-color,stop-opacity,stroke-dasharray,stroke-dashoffset,stroke-linecap,stroke-linejoin,stroke-miterlimit,stroke-opacity,stroke,stroke-width,style,surfacescale,systemlanguage,tabindex,targetx,targety,transform,text-anchor,text-decoration,text-rendering,textlength,type,u1,u2,unicode,values,viewbox,visibility,version,vert-adv-y,vert-origin-x,vert-origin-y,width,word-spacing,wrap,writing-mode,xchannelselector,ychannelselector,x,x1,x2,xmlns,y,y1,y2,z,zoomandpan`
      .split(`,`),
  };
}

function getPermissions() {
  return {a:true,area:false,audio:false,br:true,base:false,body:false,button:true,canvas:false,dl:true,data:false,datalist:true,div:true,embed:false,fieldset:true,font:false,form:false,hr:true,head:false,output:true,iframe:false,frameset:false,img:true,input:true,li:true,label:true,legend:true,link:false,map:false,media:false,meta:false,meter:true,ol:true,object:false,optgroup:true,option:true,p:true,param:true,picture:false,pre:true,progress:false,quote:true,script:false,select:true,source:false,span:true,style:true,caption:true,td:true,col:true,table:true,tr:true,template:false,textarea:true,time:true,title:true,track:true,details:false,ul:true,video:false,del:true,ins:true,slot:false,blockquote:true,svg:true,dialog:false,summary:true,main:true,address:true,colgroup:true,tbody:true,tfoot:true,th:true,dd:true,dt:true,figcaption:true,figure:true,i:true,b:true,code:true,h1:true,h2:true,h3:true,h4:true,abbr:true,bdo:true,dfn:true,em:true,kbd:true,mark:true,q:true,rb:true,rp:true,rt:true,ruby:true,s:true,strike:true,samp:true,small:true,strong:true,sup:true,sub:true,u:true,var:true,wbr:true,nobr:false,tt:true,noscript:true,comment:false};
}

function getLogStyling() {
  return [
    "#logBox{min-width:0px;max-width:0px;min-height:0px;max-height:0px;,width:0;height:0;z-index:-1;border:none;padding:0px;overflow:hidden;transition:all 0.3s ease;position:fixed;}",
    "#logBox.visible{background-color:rgb(255, 255, 224);z-index:1;position:static;border:1px dotted rgb(153, 153, 153);max-width:90vw;min-width:30vw;min-height:10vh;max-height:90vh;overflow:auto;width:50vw;height:20vh;margin:1rem 0px;padding:0px 8px 19px;resize:both;}",
    "#logBox .legend{text-align:center;position:absolute;margin-top:-1em;width:inherit;max-width:inherit;}",
    "#logBox .legend div{text-align:center;display:inline-block;max-width:inherit;height:1.2rem;background-color:rgb(119, 119, 119);padding:2px 10px;color:rgb(255, 255, 255);box-shadow:rgb(119 119 119) 2px 1px 10px;border-radius:4px;}",
    "#logBox .legend div:before{content:'JQL Logging';}",
    "#logBox #jql_logger{marginTop:0.7rem;lineHeight:1.4em;font-family:consolas,monospace;whiteSpace:pre-wrap;maxWidth:inherit;}"
  ]
}

function getPopupStyling() {
  const svgImg = `url('data:image/svg+xml\\3butf8,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22iso-8859-1%22%3F%3E%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%20version%3D%221.1%22%20id%3D%22Layer_1%22%20x%3D%220px%22%20y%3D%220px%22%20viewBox%3D%220%200%20128%20128%22%20style%3D%22enable-background%3Anew%200%200%20128%20128%3B%22%20xml%3Aspace%3D%22preserve%22%3E%3Crect%20x%3D%22-368%22%20y%3D%226%22%20style%3D%22display%3Anone%3Bfill%3A%23E0E0E0%3B%22%20width%3D%22866%22%20height%3D%221018%22%2F%3E%3Ccircle%20style%3D%22fill%3A%23FFFFFF%3B%22%20cx%3D%2264%22%20cy%3D%2264%22%20r%3D%2248%22%2F%3E%3Ccircle%20style%3D%22fill%3A%238CCFB9%3B%22%20cx%3D%2264%22%20cy%3D%2264%22%20r%3D%2239%22%2F%3E%3Ccircle%20style%3D%22fill%3Anone%3Bstroke%3A%23444B54%3Bstroke-width%3A6%3Bstroke-miterlimit%3A10%3B%22%20cx%3D%2264%22%20cy%3D%2264%22%20r%3D%2248%22%2F%3E%3Cpolyline%20style%3D%22fill%3Anone%3Bstroke%3A%23FFFFFF%3Bstroke-width%3A6%3Bstroke-linecap%3Around%3Bstroke-miterlimit%3A10%3B%22%20points%3D%2242%2C69%2055.55%2C81%20%20%2086%2C46%20%22%2F%3E%3C%2Fsvg%3E')`;
  return [
    ".popupContainer{top:50%;left:50%;transform:translate(-50%, -50%);position:absolute;max-width:40vw;max-height:40vh;opacity:0;border:1px solid transparent;display:flex;flex-direction:row-reverse;}",
    ".popupContainer.active{z-index:10;opacity:1;resize:vertical;}",
    "body.popupActive{overflow:hidden;transition:all 0.6s linear 0s;}",
    ".between{position:absolute;z-index:-1;overflow:hidden;background-color:white;width:0px;height:0px;opacity:0;}",
    ".between.active{height:100%;width:100%;z-index:9;opacity:0.7;transition:opacity 0.4s ease-in 0s;}",
    ".popupBox{min-width:150px;max-width:inherit;max-height:inherit;background-color:white;box-shadow:rgb(119, 119, 119) 3px 2px 12px;border-radius:6px;overflow:auto;font:12px / 15px Verdana, Arial, sans-serif;min-height:1.5rem;z-index:10;padding:0.4rem;}",
    "[data-modalcontent]{padding:0.5rem;min-height:1rem;vertical-align:middle;}",
    "@media screen and (width < 1200px){.popupContainer{max-width:75vw;max-height:40vh;}}",
    "@media screen and (width < 640px){.popupContainer{max-width:90vw;max-height:60vh;}}",
    "#modalWarning{color:red;background-color:rgb(255, 255, 240);font-weight:bold;border:3px solid red;padding:1rem;margin:0px auto 0.5em;text-align:center;opacity:0;max-height:0px;position:absolute;box-shadow:rgb(153, 153, 153) 2px 2px 8px;transition:all 0.5s ease 0s;top:50%;left:50%;transform:translate(-50%, -50%);}",
    "#modalWarning.active:after{content:'Requires action first!';}",
    "#modalWarning.active{opacity:1;max-height:100%;max-width:100%;height:auto;z-index:12;}",
    `.closeHandleIcon{opacity:0;z-index:-1;cursor:pointer;width:32px;height:32px;background:${svgImg} no-repeat;}`,
    ".closeHandleIcon.active{z-index:12;opacity:1;position:absolute;margin-right:-16px;margin-top:-16px;};"
  ];
}