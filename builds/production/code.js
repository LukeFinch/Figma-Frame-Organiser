!function(e){var t={};function n(r){if(t[r])return t[r].exports;var o=t[r]={i:r,l:!1,exports:{}};return e[r].call(o.exports,o,o.exports,n),o.l=!0,o.exports}n.m=e,n.c=t,n.d=function(e,t,r){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)n.d(r,o,function(t){return e[t]}.bind(null,o));return r},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=11)}({11:function(e,t,n){"use strict";n.r(t);const r=[],o=(e,t)=>{figma.ui.postMessage({action:e,data:t})},i=(e,t)=>{r.push({type:e,callback:t})};figma.ui.onmessage=e=>{for(let t of r)e.action===t.type&&t.callback(e.data)};var a,l=null;figma.showUI(__html__);let u=figma.currentPage.selection.filter(e=>"FRAME"==e.type||"COMPONENT"==e.type);function c(e,t){a++;let n=f(e);null===l&&(l=e.reduce((function(e,t){return e.x<t.x?e:t})));let r=l.x,o=e.filter(e=>e.y+e.height/2<=n.y+n.height||e==n).sort((e,t)=>e.x-t.x);o.forEach((e,o)=>{e.setPluginData("row",a.toString()),e.setPluginData("index",o.toString()),e.y=n.y,e.x=r,r+=e.width+t.horizontal});const i=o.reduce((function(e,t){return e.height>t.height?e:t})),u=e.filter(e=>o.indexOf(e)<0);if(u.length>0){const e=f(u);let n=i.y+i.height-e.y;console.log(n),u.forEach(e=>{e.y+=n+t.vertical}),c(u,t)}else[...figma.currentPage.selection].sort((function(e,t){return e.y===t.y?t.x-e.x:e.y<t.y?1:-1})).forEach((e,t)=>{figma.currentPage.insertChild(t,e)}),figma.notify("Woof")}function f(e){return e.reduce((function(e,t){return e.y<t.y?e:t}))}o("updateSelectionCount",u.length),figma.on("selectionchange",()=>{const e=figma.currentPage.selection.filter(e=>"FRAME"==e.type);o("updateSelectionCount",e.length)}),i("organise",e=>{l=null,a=0;const t=figma.currentPage.selection.filter(e=>"SLICE"!==e.type);console.log(t),c(t,e)}),i("makeTestNodes",e=>{let t=[];for(var n=0;n<e;n++){let e=figma.createFrame();t.push(e),e.x=Math.round(6e3*Math.random()),e.y=Math.round(6e3*Math.random()),e.resize(360+Math.round(1e3*Math.random()),640+Math.round(1e3*Math.random()));let n=Math.random();e.fills=[{type:"SOLID",color:{r:n,g:n,b:1}}]}figma.currentPage.selection=t,figma.viewport.scrollAndZoomIntoView(t)})}});