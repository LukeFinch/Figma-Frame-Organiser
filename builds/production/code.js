!function(e){var t={};function n(r){if(t[r])return t[r].exports;var o=t[r]={i:r,l:!1,exports:{}};return e[r].call(o.exports,o,o.exports,n),o.l=!0,o.exports}n.m=e,n.c=t,n.d=function(e,t,r){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)n.d(r,o,function(t){return e[t]}.bind(null,o));return r},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=17)}({17:function(e,t,n){"use strict";n.r(t);const r=[],o=(e,t)=>{figma.ui.postMessage({action:e,data:t})},i=(e,t)=>{r.push({type:e,callback:t})};figma.ui.onmessage=e=>{for(let t of r)e.action===t.type&&t.callback(e.data)};var a,l=null,c=[];figma.showUI(__html__),figma.ui.resize(400,400);let u=figma.currentPage.selection.filter(e=>"SLICE"!==e.type);function f(e,t,n){let r=[];e.sort((e,t)=>e.x-t.x),null===l&&(l=e.reduce((function(e,t){return e.x<t.x?e:t})));let i=l.x,u=s(e),g=e.filter(e=>e.y<=u.y+u.height/2).sort((e,t)=>e.x-t.x);g.forEach((e,n)=>{e.y=u.y,e.x=i,i+=e.width+t.horizontal,e.height>u.height&&(u=e),r.push({id:e.id,width:e.width,height:e.height,row:a,column:n})});const h=g.reduce((function(e,t){return e.height>t.height?e:t}));c.push(r);const d=e.filter(e=>g.indexOf(e)<0);if(d.length>0){const e=s(d);let r=h.y+h.height-e.y;d.forEach(e=>{e.y+=r+t.vertical}),a++,f(d,t,n)}else!function(e){console.log("Reverse?",e);const t=Math.min(...c.flat().map(e=>figma.currentPage.children.findIndex(t=>t.id==e.id))),n=c.flat().map(e=>figma.getNodeById(e.id));n.reduce((function(e,t){return e.x<t.x?e:t})).x,n.reduce((function(e,t){return e.y<t.y?e:t})).y;n.sort((function(e,t){return e.y===t.y?t.x-e.x:e.y<t.y?1:-1})),e&&n.reverse();let r=n[0].parent;n.forEach((e,n)=>{r.insertChild((t>=0?t:0)+n,e)});var i=[];c.forEach((e,t)=>{let n=[];e.forEach(e=>{n.push(e)}),i.push({row:t,columns:n})}),o("setLayout",i),figma.viewport.scrollAndZoomIntoView(n)}(n)}function s(e){return e.reduce((function(e,t){return e.y<t.y?e:t}))}function g(e){try{"true"==e.getPluginData("highlighted")&&"DROP_SHADOW"==e.effects[e.effects.length-1].type&&(e.effects=[...e.effects.slice(0,-1)]),e.setPluginData("highlighted","false")}catch(e){}}u.reduce((e,t)=>(e.add(t.parent),e),new Set).size>1?(figma.notify("Organiser only works on items with the same parent"),o("warnTooManyParents",!0)):o("warnTooManyParents",!1),o("updateSelectionCount",u.length),o("viewport",figma.viewport.bounds),figma.clientStorage.getAsync("spacing").then(e=>o("spacingPrefs",e),e=>console.error(e)),figma.on("selectionchange",()=>{const e=figma.currentPage.selection.filter(e=>"SLICE"!==e.type);e.reduce((e,t)=>(e.add(t.parent),e),new Set).size>1?o("warnTooManyParents",!0):o("warnTooManyParents",!1),o("updateSelectionCount",e.length)}),i("resizeUI",e=>{figma.ui.resize(e[0],e[1])}),i("zoomTo",e=>{let t=[figma.getNodeById(e)];figma.viewport.scrollAndZoomIntoView(t),figma.viewport.zoom*=.8}),i("organise",e=>{const t=e.spacing;figma.clientStorage.setAsync("spacing",t),c=[],l=null,a=0;f(figma.currentPage.selection.filter(e=>"SLICE"!==e.type),t,e.sort)}),i("newLayout",e=>{console.log("Layout change from UI");let t=(e=JSON.parse(e)).layout;t=t.filter(e=>e.columns.length>0);let n=e.spacing;var r=[];let o=figma.getNodeById(t[0].columns[0].id);var i=o.y;console.log(o),t.forEach(e=>{console.log(e);const t=e.columns.reduce((function(e,t){return e.height>t.height?e:t}));console.log(t);var a=o.x;e.columns.forEach(e=>{let t=figma.getNodeById(e.id);r.push(t),t.y=i,t.x=a,a+=t.width+n.horizontal}),i+=t.height+n.vertical});r.reduce((function(e,t){return e.x<t.x?e:t})).x,r.reduce((function(e,t){return e.y<t.y?e:t})).y;figma.viewport.scrollAndZoomIntoView(r)}),i("makeTestNodes",e=>{let t=[];for(var n=0;n<e;n++){let e=figma.createFrame();t.push(e),e.x=Math.round(6e3*Math.random()),e.y=Math.round(6e3*Math.random()),e.resize(360+Math.round(1e3*Math.random()),640+Math.round(1e3*Math.random()));let n=Math.random();e.fills=[{type:"SOLID",color:{r:n,g:n,b:1}}]}figma.currentPage.selection=t,figma.viewport.scrollAndZoomIntoView(t)}),i("unhighlight",e=>{figma.currentPage.findAll(e=>"true"===e.getPluginData("highlighted")).forEach(e=>g(e))}),i("highlight",e=>{let t=figma.getNodeById(e);var n;figma.currentPage.findAll(e=>"true"===e.getPluginData("highlighted")).forEach(e=>g(e)),(n=t).effects=[...n.effects,{type:"DROP_SHADOW",color:{r:1,g:105/255,b:180/255,a:1},offset:{x:0,y:0},radius:.05*n.width,spread:.05*n.width,visible:!0,blendMode:"NORMAL"}],n.setPluginData("highlighted","true")})}});