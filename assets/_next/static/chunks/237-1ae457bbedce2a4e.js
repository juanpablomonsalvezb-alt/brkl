"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[237],{13852:(e,t,i)=>{i.d(t,{$V:()=>W,$n:()=>L,C$:()=>G,CL:()=>eC,D2:()=>g,FJ:()=>d,GI:()=>eI,Hf:()=>A,IC:()=>J,Jk:()=>f,KR:()=>U,Ks:()=>s,LM:()=>o,OR:()=>eR,Pv:()=>Y,Ru:()=>M,S5:()=>z,U4:()=>m,Ul:()=>ei,Vi:()=>c,WE:()=>eO,WG:()=>E,Yz:()=>ex,Zp:()=>eD,_$:()=>_,_G:()=>ea,dc:()=>n,hu:()=>eB,n_:()=>eH,pD:()=>eN,rN:()=>X,st:()=>K,tq:()=>et,vG:()=>eL,yb:()=>eM,zN:()=>eV});var a=i(45820),r=i(47207).Ay,n={VIDEO:"video",THUMBNAIL:"thumbnail",STORYBOARD:"storyboard",DRM:"drm"},s={NOT_AN_ERROR:0,NETWORK_OFFLINE:2000002,NETWORK_UNKNOWN_ERROR:2e6,NETWORK_NO_STATUS:2000001,NETWORK_INVALID_URL:24e5,NETWORK_NOT_FOUND:2404e3,NETWORK_NOT_READY:2412e3,NETWORK_GENERIC_SERVER_FAIL:25e5,NETWORK_TOKEN_MISSING:2403201,NETWORK_TOKEN_MALFORMED:2412202,NETWORK_TOKEN_EXPIRED:2403210,NETWORK_TOKEN_AUD_MISSING:2403221,NETWORK_TOKEN_AUD_MISMATCH:2403222,NETWORK_TOKEN_SUB_MISMATCH:2403232,ENCRYPTED_ERROR:5e6,ENCRYPTED_UNSUPPORTED_KEY_SYSTEM:5000001,ENCRYPTED_GENERATE_REQUEST_FAILED:5000002,ENCRYPTED_UPDATE_LICENSE_FAILED:5000003,ENCRYPTED_UPDATE_SERVER_CERT_FAILED:5000004,ENCRYPTED_CDM_ERROR:5000005,ENCRYPTED_OUTPUT_RESTRICTED:5000006,ENCRYPTED_MISSING_TOKEN:5000002},o=e=>e===n.VIDEO?"playback":e,l=class e extends Error{constructor(t,i=e.MEDIA_ERR_CUSTOM,a,r){var n;super(t),this.name="MediaError",this.code=i,this.context=r,this.fatal=null!=a?a:i>=e.MEDIA_ERR_NETWORK&&i<=e.MEDIA_ERR_ENCRYPTED,this.message||(this.message=null!=(n=e.defaultMessages[this.code])?n:"")}};l.MEDIA_ERR_ABORTED=1,l.MEDIA_ERR_NETWORK=2,l.MEDIA_ERR_DECODE=3,l.MEDIA_ERR_SRC_NOT_SUPPORTED=4,l.MEDIA_ERR_ENCRYPTED=5,l.MEDIA_ERR_CUSTOM=100,l.defaultMessages={1:"You aborted the media playback",2:"A network error caused the media download to fail.",3:"A media error caused playback to be aborted. The media could be corrupt or your browser does not support this format.",4:"An unsupported error occurred. The server or network failed, or your browser does not support this format.",5:"The media is encrypted and there are no keys to decrypt it."};var d=l,u=(e,t)=>null!=t&&e in t,h={ANY:"any",MUTED:"muted"},m={ON_DEMAND:"on-demand",LIVE:"live",UNKNOWN:"unknown"},c={MSE:"mse",NATIVE:"native"},p={HEADER:"header",QUERY:"query",NONE:"none"},E=Object.values(p),v={M3U8:"application/vnd.apple.mpegurl",MP4:"video/mp4"},b={HLS:v.M3U8},g=(Object.keys(b),[...Object.values(v)],{upTo720p:"720p",upTo1080p:"1080p",upTo1440p:"1440p",upTo2160p:"2160p"}),f={noLessThan480p:"480p",noLessThan540p:"540p",noLessThan720p:"720p",noLessThan1080p:"1080p",noLessThan1440p:"1440p",noLessThan2160p:"2160p"},A={DESCENDING:"desc"},T={code:"en"},y=(e,t,i,a,r=e)=>{r.addEventListener(t,i,a),e.addEventListener("teardown",()=>{r.removeEventListener(t,i)},{once:!0})},_=e=>{let t=e.indexOf("?");return t<0?[e]:[e.slice(0,t),e.slice(t)]},k=e=>{let{type:t}=e;if(t){let e=t.toUpperCase();return u(e,b)?b[e]:t}return R(e)},I=e=>"VOD"===e?m.ON_DEMAND:m.LIVE,S=e=>"EVENT"===e?1/0:"VOD"===e?NaN:0,R=e=>{let{src:t}=e;if(!t)return"";let i="";try{i=new URL(t).pathname}catch{console.error("invalid url")}let a=i.lastIndexOf(".");if(a<0)return C(e)?v.M3U8:"";let r=i.slice(a+1).toUpperCase();return u(r,v)?v[r]:""},w="mux.com",C=({src:e,customDomain:t=w})=>{let i;try{i=new URL(`${e}`)}catch{return!1}let a="https:"===i.protocol,r=i.hostname===`stream.${t}`.toLowerCase(),n=i.pathname.split("/"),s=2===n.length,o=!(null!=n&&n[1].includes("."));return a&&r&&s&&o},L=e=>{let t=(null!=e?e:"").split(".")[1];if(t)try{let e=t.replace(/-/g,"+").replace(/_/g,"/"),i=decodeURIComponent(atob(e).split("").map(function(e){return"%"+("00"+e.charCodeAt(0).toString(16)).slice(-2)}).join(""));return JSON.parse(i)}catch{return}};function M(e,t=!0){var i;return new D(t&&null!=(i=null==T?void 0:T[e])?i:e,t?T.code:"en")}var D=class{constructor(e,t=(e=>null!=(e=T)?e:"en")()){this.message=e,this.locale=t}format(e){return this.message.replace(/\{(\w+)\}/g,(t,i)=>{var a;return null!=(a=e[i])?a:""})}toString(){return this.message}},O=Object.values(h),N=e=>"boolean"==typeof e||"string"==typeof e&&O.includes(e),x=(e,t)=>{if(!t)return;let i=e.muted,a=()=>e.muted=i;switch(t){case h.ANY:e.play().catch(()=>{e.muted=!0,e.play().catch(a)});break;case h.MUTED:e.muted=!0,e.play().catch(a);break;default:e.play().catch(()=>{})}},P=e=>"time"in e?e.time:e.startTime;function U(e,t,i,a,r,n){let s=document.createElement("track");return s.kind=t,s.label=i,a&&(s.srclang=a),r&&(s.id=r),n&&(s.default=!0),s.track.mode=["subtitles","captions"].includes(t)?"disabled":"hidden",s.setAttribute("data-removeondestroy",""),e.append(s),s.track}function W(e,t){let i=Array.prototype.find.call(e.querySelectorAll("track"),e=>e.track===t);null==i||i.remove()}function B(e,t,i){var a;return null==(a=Array.from(e.querySelectorAll("track")).find(e=>e.track.label===t&&e.track.kind===i))?void 0:a.track}async function H(e,t,i,a){let r=B(e,i,a);return r||((r=U(e,a,i)).mode="hidden",await new Promise(e=>setTimeout(()=>e(void 0),0))),"hidden"!==r.mode&&(r.mode="hidden"),[...t].sort((e,t)=>P(t)-P(e)).forEach(t=>{var i,n;let s=t.value,o=P(t);if("endTime"in t&&null!=t.endTime)null==r||r.addCue(new VTTCue(o,t.endTime,"chapters"===a?s:JSON.stringify(null!=s?s:null)));else{let t=Array.prototype.findIndex.call(null==r?void 0:r.cues,e=>e.startTime>=o),l=null==(i=null==r?void 0:r.cues)?void 0:i[t],d=l?l.startTime:Number.isFinite(e.duration)?e.duration:Number.MAX_SAFE_INTEGER,u=null==(n=null==r?void 0:r.cues)?void 0:n[t-1];u&&(u.endTime=o),null==r||r.addCue(new VTTCue(o,d,"chapters"===a?s:JSON.stringify(null!=s?s:null)))}}),e.textTracks.dispatchEvent(new Event("change",{bubbles:!0,composed:!0})),r}var V="cuepoints",$=Object.freeze({label:V});async function K(e,t,i=$){return H(e,t,i.label,"metadata")}var F=e=>({time:e.startTime,value:JSON.parse(e.text)});function Y(e,t={label:V}){let i=B(e,t.label,"metadata");return null!=i&&i.cues?Array.from(i.cues,e=>F(e)):[]}function G(e,t={label:V}){var i,a;let r=B(e,t.label,"metadata");if(!(null!=(i=null==r?void 0:r.activeCues)&&i.length))return;if(1===r.activeCues.length)return F(r.activeCues[0]);let{currentTime:n}=e;return F(Array.prototype.find.call(null!=(a=r.activeCues)?a:[],({startTime:e,endTime:t})=>e<=n&&t>n)||r.activeCues[0])}async function q(e,t=$){return new Promise(i=>{y(e,"loadstart",async()=>{let a=await K(e,[],t);y(e,"cuechange",()=>{let t=G(e);if(t){let i=new CustomEvent("cuepointchange",{composed:!0,bubbles:!0,detail:t});e.dispatchEvent(i)}},{},a),i(a)})})}var j="chapters",Z=Object.freeze({label:j}),Q=e=>({startTime:e.startTime,endTime:e.endTime,value:e.text});async function z(e,t,i=Z){return H(e,t,i.label,"chapters")}function X(e,t={label:j}){var i;let a=B(e,t.label,"chapters");return null!=(i=null==a?void 0:a.cues)&&i.length?Array.from(a.cues,e=>Q(e)):[]}function J(e,t={label:j}){var i,a;let r=B(e,t.label,"chapters");if(!(null!=(i=null==r?void 0:r.activeCues)&&i.length))return;if(1===r.activeCues.length)return Q(r.activeCues[0]);let{currentTime:n}=e;return Q(Array.prototype.find.call(null!=(a=r.activeCues)?a:[],({startTime:e,endTime:t})=>e<=n&&t>n)||r.activeCues[0])}async function ee(e,t=Z){return new Promise(i=>{y(e,"loadstart",async()=>{let a=await z(e,[],t);y(e,"cuechange",()=>{let t=J(e);if(t){let i=new CustomEvent("chapterchange",{composed:!0,bubbles:!0,detail:t});e.dispatchEvent(i)}},{},a),i(a)})})}function et(e,t){if(t){let i=t.playingDate;if(null!=i)return new Date(i.getTime()-1e3*e.currentTime)}return"function"==typeof e.getStartDate?e.getStartDate():new Date(NaN)}function ei(e,t){return t&&t.playingDate?t.playingDate:new Date("function"==typeof e.getStartDate?e.getStartDate().getTime()+1e3*e.currentTime:NaN)}var ea={VIDEO:"v",THUMBNAIL:"t",STORYBOARD:"s",DRM:"d"},er=(e,t,i,a,r=!1,l=!(e=>null==(e=globalThis.navigator)?void 0:e.onLine)())=>{var h,c;if(l){let i=M("Your device appears to be offline",r),a=d.MEDIA_ERR_NETWORK,n=new d(i,a,!1,void 0);return n.errorCategory=t,n.muxCode=s.NETWORK_OFFLINE,n.data=e,n}let p="status"in e?e.status:e.code,E=Date.now(),v=d.MEDIA_ERR_NETWORK;if(200===p)return;let b=o(t),g=((e,t)=>{var i,a;let r=o(e),n=`${r}Token`;return null!=(i=t.tokens)&&i[r]?null==(a=t.tokens)?void 0:a[r]:u(n,t)?t[n]:void 0})(t,i),f=(e=>e===n.VIDEO?ea.VIDEO:e===n.DRM?ea.DRM:void 0)(t),[A]=_(null!=(h=i.playbackId)?h:"");if(!p||!A)return;let T=L(g);if(g&&!T){let i=new d(M("The {tokenNamePrefix}-token provided is invalid or malformed.",r).format({tokenNamePrefix:b}),v,!0,M("Compact JWT string: {token}",r).format({token:g}));return i.errorCategory=t,i.muxCode=s.NETWORK_TOKEN_MALFORMED,i.data=e,i}if(p>=500){let e=new d("",v,null==a||a);return e.errorCategory=t,e.muxCode=s.NETWORK_UNKNOWN_ERROR,e}if(403===p)if(T){if((({exp:e},t=Date.now())=>!e||1e3*e<t)(T,E)){let i={timeStyle:"medium",dateStyle:"medium"},a=new d(M("The video’s secured {tokenNamePrefix}-token has expired.",r).format({tokenNamePrefix:b}),v,!0,M("Expired at: {expiredDate}. Current time: {currentDate}.",r).format({expiredDate:new Intl.DateTimeFormat("en",i).format(null!=(c=T.exp)?c:0),currentDate:new Intl.DateTimeFormat("en",i).format(E)}));return a.errorCategory=t,a.muxCode=s.NETWORK_TOKEN_EXPIRED,a.data=e,a}if((({sub:e},t)=>e!==t)(T,A)){let i=new d(M("The video’s playback ID does not match the one encoded in the {tokenNamePrefix}-token.",r).format({tokenNamePrefix:b}),v,!0,M("Specified playback ID: {playbackId} and the playback ID encoded in the {tokenNamePrefix}-token: {tokenPlaybackId}",r).format({tokenNamePrefix:b,playbackId:A,tokenPlaybackId:T.sub}));return i.errorCategory=t,i.muxCode=s.NETWORK_TOKEN_SUB_MISMATCH,i.data=e,i}if((({aud:e},t)=>!e)(T,0)){let i=new d(M("The {tokenNamePrefix}-token is formatted with incorrect information.",r).format({tokenNamePrefix:b}),v,!0,M("The {tokenNamePrefix}-token has no aud value. aud value should be {expectedAud}.",r).format({tokenNamePrefix:b,expectedAud:f}));return i.errorCategory=t,i.muxCode=s.NETWORK_TOKEN_AUD_MISSING,i.data=e,i}if((({aud:e},t)=>e!==t)(T,f)){let i=new d(M("The {tokenNamePrefix}-token is formatted with incorrect information.",r).format({tokenNamePrefix:b}),v,!0,M("The {tokenNamePrefix}-token has an incorrect aud value: {aud}. aud value should be {expectedAud}.",r).format({tokenNamePrefix:b,expectedAud:f,aud:T.aud}));return i.errorCategory=t,i.muxCode=s.NETWORK_TOKEN_AUD_MISMATCH,i.data=e,i}}else{let i=new d(M("Authorization error trying to access this {category} URL. If this is a signed URL, you might need to provide a {tokenNamePrefix}-token.",r).format({tokenNamePrefix:b,category:t}),v,null==a||a,M("Specified playback ID: {playbackId}",r).format({playbackId:A}));return i.errorCategory=t,i.muxCode=s.NETWORK_TOKEN_MISSING,i.data=e,i}if(412===p){let n=new d(M("This playback-id may belong to a live stream that is not currently active or an asset that is not ready.",r),v,null==a||a,M("Specified playback ID: {playbackId}",r).format({playbackId:A}));return n.errorCategory=t,n.muxCode=s.NETWORK_NOT_READY,n.streamType=i.streamType===m.LIVE?"live":i.streamType===m.ON_DEMAND?"on-demand":"unknown",n.data=e,n}if(404===p){let i=new d(M("This URL or playback-id does not exist. You may have used an Asset ID or an ID from a different resource.",r),v,null==a||a,M("Specified playback ID: {playbackId}",r).format({playbackId:A}));return i.errorCategory=t,i.muxCode=s.NETWORK_NOT_FOUND,i.data=e,i}if(400===p){let i=new d(M("The URL or playback-id was invalid. You may have used an invalid value as a playback-id."),v,null==a||a,M("Specified playback ID: {playbackId}",r).format({playbackId:A}));return i.errorCategory=t,i.muxCode=s.NETWORK_INVALID_URL,i.data=e,i}let y=new d("",v,null==a||a);return y.errorCategory=t,y.muxCode=s.NETWORK_UNKNOWN_ERROR,y.data=e,y},en=r.DefaultConfig.capLevelController,es={"720p":921600,"1080p":2073600,"1440p":4194304,"2160p":8294400},eo=class e extends en{constructor(e){super(e)}static setMaxAutoResolution(t,i){i?e.maxAutoResolution.set(t,i):e.maxAutoResolution.delete(t)}getMaxAutoResolution(){var t;let i=this.hls;return null!=(t=e.maxAutoResolution.get(i))?t:void 0}get levels(){var e;return null!=(e=this.hls.levels)?e:[]}getValidLevels(e){return this.levels.filter((t,i)=>this.isLevelAllowed(t)&&i<=e)}getMaxLevelCapped(e){let t=this.getValidLevels(e),i=this.getMaxAutoResolution();if(!i)return super.getMaxLevel(e);let a=es[i.toLowerCase().trim()];if(!a)return super.getMaxLevel(e);let r=t.filter(e=>e.width*e.height<=a),n=r.findIndex(e=>e.width*e.height===a);if(-1!==n){let e=r[n];return t.findIndex(t=>t===e)}if(0===r.length)return 0;let s=r[r.length-1];return t.findIndex(e=>e===s)}getMaxLevel(t){if(void 0!==this.getMaxAutoResolution())return this.getMaxLevelCapped(t);let i=super.getMaxLevel(t),a=this.getValidLevels(t);if(!a[i])return i;let r=Math.min(a[i].width,a[i].height),n=e.minMaxResolution;return r>=n?i:en.getMaxLevelByMediaSize(a,16/9*n,n)}};eo.minMaxResolution=720,eo.maxAutoResolution=new WeakMap;var el,ed,eu,eh,em,ec,ep={FAIRPLAY:"fairplay",PLAYREADY:"playready",WIDEVINE:"widevine"},eE=/([A-Z0-9-]+)="?(.*?)"?(?:,|$)/g,ev=async(e,t)=>{if(t===v.MP4)return{streamType:m.ON_DEMAND,targetLiveWindow:NaN,liveEdgeStartOffset:void 0,sessionData:void 0};if(t===v.M3U8){let t=await fetch(e);if(!t.ok)return Promise.reject(t);let i=await t.text(),a=await fetch(i.split(`
`).find((e,t,i)=>t&&i[t-1].startsWith("#EXT-X-STREAM-INF"))).then(e=>200!==e.status?Promise.reject(e):e.text());return{...(e=>{let t=e.split(`
`).filter(e=>e.startsWith("#EXT-X-SESSION-DATA"));if(!t.length)return{};let i={};for(let e of t){let t=Object.fromEntries([...e.matchAll(eE)].map(([,e,t])=>[e,t])),a=t["DATA-ID"];a&&(i[a]={...t})}return{sessionData:i}})(i),...(e=>{var t,i,a;let r=e.split(`
`),n=null==(i=(null!=(t=r.find(e=>e.startsWith("#EXT-X-PLAYLIST-TYPE")))?t:"").split(":")[1])?void 0:i.trim(),s=I(n),o=S(n),l;if(s===m.LIVE){let e=r.find(e=>e.startsWith("#EXT-X-PART-INF"));if(e)l=2*e.split(":")[1].split("=")[1];else{let e=r.find(e=>e.startsWith("#EXT-X-TARGETDURATION")),t=null==(a=null==e?void 0:e.split(":"))?void 0:a[1];l=(null!=t?t:6)*3}}return{streamType:s,targetLiveWindow:o,liveEdgeStartOffset:l}})(a)}}return console.error(`Media type ${t} is an unrecognized or unsupported type for src ${e}.`),{streamType:void 0,targetLiveWindow:void 0,liveEdgeStartOffset:void 0,sessionData:void 0}},eb=async(e,t,i=k({src:e}))=>{var a,r,n,s;let{streamType:o,targetLiveWindow:l,liveEdgeStartOffset:d,sessionData:u}=await ev(e,i),h=null==u?void 0:u["com.apple.hls.chapters"];(null!=h&&h.URI||null!=h&&h.VALUE.toLocaleLowerCase().startsWith("http"))&&eg(null!=(a=h.URI)?a:h.VALUE,t),(null!=(r=ey.get(t))?r:{}).liveEdgeStartOffset=d,(null!=(n=ey.get(t))?n:{}).targetLiveWindow=l,t.dispatchEvent(new CustomEvent("targetlivewindowchange",{composed:!0,bubbles:!0})),(null!=(s=ey.get(t))?s:{}).streamType=o,t.dispatchEvent(new CustomEvent("streamtypechange",{composed:!0,bubbles:!0}))},eg=async(e,t)=>{var i,a;try{let r=await fetch(e);if(!r.ok)throw Error(`Failed to fetch Mux metadata: ${r.status} ${r.statusText}`);let n=await r.json(),s={};if(!(null!=(i=null==n?void 0:n[0])&&i.metadata))return;for(let e of n[0].metadata)e.key&&e.value&&(s[e.key]=e.value);(null!=(a=ey.get(t))?a:{}).metadata=s;let o=new CustomEvent("muxmetadata");t.dispatchEvent(o)}catch(e){console.error(e)}},ef=null!=(ed=null==(el=null==globalThis?void 0:globalThis.navigator)?void 0:el.userAgent)?ed:"",eA=null!=(em=null==(eh=null==(eu=null==globalThis?void 0:globalThis.navigator)?void 0:eu.userAgentData)?void 0:eh.platform)?em:"",eT=ef.toLowerCase().includes("android")||["x11","android"].some(e=>eA.toLowerCase().includes(e)),ey=new WeakMap,e_="mux.com",ek=null==(ec=r.isSupported)?void 0:ec.call(r),eI=()=>{if("undefined"!=typeof window)return a.A.utils.now()},eS=a.A.utils.generateUUID,eR=({playbackId:e,customDomain:t=e_,maxResolution:i,minResolution:a,renditionOrder:r,programStartTime:n,programEndTime:s,assetStartTime:o,assetEndTime:l,playbackToken:d,tokens:{playback:u=d}={},extraSourceParams:h={}}={})=>{if(!e)return;let[m,c=""]=_(e),p=new URL(`https://stream.${t}/${m}.m3u8${c}`);return u||p.searchParams.has("token")?(p.searchParams.forEach((e,t)=>{"token"!=t&&p.searchParams.delete(t)}),u&&p.searchParams.set("token",u)):(i&&p.searchParams.set("max_resolution",i),a&&(p.searchParams.set("min_resolution",a),i&&+i.slice(0,-1)<+a.slice(0,-1)&&console.error("minResolution must be <= maxResolution","minResolution",a,"maxResolution",i)),r&&p.searchParams.set("rendition_order",r),n&&p.searchParams.set("program_start_time",`${n}`),s&&p.searchParams.set("program_end_time",`${s}`),o&&p.searchParams.set("asset_start_time",`${o}`),l&&p.searchParams.set("asset_end_time",`${l}`),Object.entries(h).forEach(([e,t])=>{null!=t&&p.searchParams.set(e,t)})),p.toString()},ew=e=>{if(!e)return;let[t]=e.split("?");return t||void 0},eC=e=>{if(!e||!e.startsWith("https://stream."))return;let[t]=new URL(e).pathname.slice(1).split(/\.m3u8|\//);return t||void 0},eL=e=>{var t;return null==(t=ey.get(e))?void 0:t.error},eM=e=>{var t;return null==(t=ey.get(e))?void 0:t.metadata},eD=e=>{var t,i;return null!=(i=null==(t=ey.get(e))?void 0:t.streamType)?i:m.UNKNOWN},eO=e=>{var t,i;return null!=(i=null==(t=ey.get(e))?void 0:t.targetLiveWindow)?i:NaN},eN=e=>{var t,i;return null!=(i=null==(t=ey.get(e))?void 0:t.seekable)?i:e.seekable},ex=e=>{var t;let i=null==(t=ey.get(e))?void 0:t.liveEdgeStartOffset;if("number"!=typeof i)return NaN;let a=eN(e);return a.length?a.end(a.length-1)-i:NaN},eP=.034,eU=(e,t,i=eP)=>e>t||((e,t,i=eP)=>Math.abs(e-t)<=i)(e,t,i),eW=(e,t)=>{var i,a,r;if(!t||!e.buffered.length)return;if(e.readyState>2)return!1;let n=t.currentLevel>=0?null==(a=null==(i=t.levels)?void 0:i[t.currentLevel])?void 0:a.details:null==(r=t.levels.find(e=>!!e.details))?void 0:r.details;if(!n||n.live)return;let{fragments:s}=n;if(!(null!=s&&s.length))return;if(e.currentTime<e.duration-(n.targetduration+.5))return!1;let o=s[s.length-1];if(e.currentTime<=o.start)return!1;let l=o.start+o.duration/2,d=e.buffered.start(e.buffered.length-1),u=e.buffered.end(e.buffered.length-1);return l>d&&l<u},eB=(e,t)=>e.ended||e.loop?e.ended:!!(t&&eW(e,t))||((e,t=eP)=>e.paused&&eU(e.currentTime,e.duration,t))(e),eH=(e,t,i)=>{eV(t,i,e);let{metadata:a={}}=e,{view_session_id:n=eS()}=a,s=(e=>{var t,i,a;return null!=(t=null==e?void 0:e.metadata)&&t.video_id?e.metadata.video_id:eQ(e)&&null!=(a=null!=(i=ew(e.playbackId))?i:eC(e.src))?a:e.src})(e);a.view_session_id=n,a.video_id=s,e.metadata=a,e.drmTypeCb=e=>{var i;null==(i=t.mux)||i.emit("hb",{view_drm_type:e})},ey.set(t,{retryCount:0});let o=eK(e,t),l=(({preload:e,src:t},i,a)=>{let r=e=>{null!=e&&["","none","metadata","auto"].includes(e)?i.setAttribute("preload",e):i.removeAttribute("preload")};if(!a)return r(e),r;let n=!1,s=!1,o=a.config.maxBufferLength,l=a.config.maxBufferSize,d=e=>{r(e);let t=null!=e?e:i.preload;s||"none"===t||("metadata"===t?(a.config.maxBufferLength=1,a.config.maxBufferSize=1):(a.config.maxBufferLength=o,a.config.maxBufferSize=l),u())},u=()=>{!n&&t&&(n=!0,a.loadSource(t))};return y(i,"play",()=>{s=!0,a.config.maxBufferLength=o,a.config.maxBufferSize=l,u()},{once:!0}),d(e),d})(e,t,o);null!=e&&e.muxDataKeepSession&&null!=t&&t.mux&&!t.mux.deleted?o&&t.mux.addHLSJS({hlsjs:o,Hls:o?r:void 0}):ez(e,t,o),eX(e,t,o),q(t),ee(t);let d=((e,t,i)=>{let{autoplay:a}=e,n=!1,s=!1,o=N(a)?a:!!a,l=()=>{n||y(t,"playing",()=>{n=!0},{once:!0})};if(l(),y(t,"loadstart",()=>{n=!1,l(),x(t,o)},{once:!0}),y(t,"loadstart",()=>{i||(s=e.streamType&&e.streamType!==m.UNKNOWN?e.streamType===m.LIVE:!Number.isFinite(t.duration)),x(t,o)},{once:!0}),i&&i.once(r.Events.LEVEL_LOADED,(t,i)=>{var a;s=e.streamType&&e.streamType!==m.UNKNOWN?e.streamType===m.LIVE:null!=(a=i.details.live)&&a}),!o){let a=()=>{!s||Number.isFinite(e.startTime)||(null!=i&&i.liveSyncPosition?t.currentTime=i.liveSyncPosition:Number.isFinite(t.seekable.end(0))&&(t.currentTime=t.seekable.end(0)))};i&&y(t,"play",()=>{"metadata"===t.preload?i.once(r.Events.LEVEL_UPDATED,a):a()},{once:!0})}return e=>{n||x(t,o=N(e)?e:!!e)}})(e,t,o);return{engine:o,setAutoplay:d,setPreload:l}},eV=(e,t,i)=>{let a=null==t?void 0:t.engine;null!=e&&e.mux&&!e.mux.deleted&&(null!=i&&i.muxDataKeepSession?a&&e.mux.removeHLSJS():(e.mux.destroy(),delete e.mux)),a&&(a.detachMedia(),a.destroy()),e&&(e.hasAttribute("src")&&(e.removeAttribute("src"),e.load()),e.removeEventListener("error",e0),e.removeEventListener("error",e2),e.removeEventListener("durationchange",eJ),ey.delete(e),e.dispatchEvent(new Event("teardown")))};function e$(e,t){var i;let a=k(e);if(a!==v.M3U8)return!0;let r=!a||null==(i=t.canPlayType(a))||i,{preferPlayback:n}=e,s=n===c.MSE,o=n===c.NATIVE,l=ek&&(s||eT||!(/^((?!chrome|android).)*safari/i.test(ef)&&t.canPlayType("application/vnd.apple.mpegurl")));return r&&(o||!l)}var eK=(e,t)=>{let{debug:i,streamType:a,startTime:n=-1,metadata:s,preferCmcd:o,_hlsConfig:l={},maxAutoResolution:d}=e,u=k(e)===v.M3U8,h=e$(e,t);if(u&&!h&&ek){let u=eF(a),h=eY(e),m=[p.QUERY,p.HEADER].includes(o)?{useHeaders:o===p.HEADER,sessionId:null==s?void 0:s.view_session_id,contentId:null==s?void 0:s.video_id}:void 0,c=null==l.capLevelToPlayerSize?{capLevelController:eo}:{},E=new r({debug:i,startPosition:n,cmcd:m,xhrSetup:(e,t)=>{var i,a;if(o&&o!==p.QUERY)return;let r=new URL(t);if(!r.searchParams.has("CMCD"))return;let n=(null!=(a=null==(i=r.searchParams.get("CMCD"))?void 0:i.split(","))?a:[]).filter(e=>e.startsWith("sid")||e.startsWith("cid")).join(",");r.searchParams.set("CMCD",n),e.open("GET",r)},...c,backBufferLength:30,renderTextTracksNatively:!1,liveDurationInfinity:!0,capLevelToPlayerSize:!0,capLevelOnFPSDrop:!0,...u,...h,...l});return c.capLevelController===eo&&void 0!==d&&eo.setMaxAutoResolution(E,d),E.on(r.Events.MANIFEST_PARSED,async function(e,i){var a,r;let n=null==(a=i.sessionData)?void 0:a["com.apple.hls.chapters"];(null!=n&&n.URI||null!=n&&n.VALUE.toLocaleLowerCase().startsWith("http"))&&eg(null!=(r=null==n?void 0:n.URI)?r:null==n?void 0:n.VALUE,t)}),E}},eF=e=>e===m.LIVE?{backBufferLength:8}:{},eY=e=>{let{tokens:{drm:t}={},playbackId:i,drmTypeCb:a}=e,r=ew(i);return t&&r?{emeEnabled:!0,drmSystems:{"com.apple.fps":{licenseUrl:ej(e,"fairplay"),serverCertificateUrl:eZ(e,"fairplay")},"com.widevine.alpha":{licenseUrl:ej(e,"widevine")},"com.microsoft.playready":{licenseUrl:ej(e,"playready")}},requestMediaKeySystemAccessFunc:(e,t)=>("com.widevine.alpha"===e&&(t=[...t.map(e=>{var t;let i=null==(t=e.videoCapabilities)?void 0:t.map(e=>({...e,robustness:"HW_SECURE_ALL"}));return{...e,videoCapabilities:i}}),...t]),navigator.requestMediaKeySystemAccess(e,t).then(t=>{let i=(e=>e.includes("fps")?ep.FAIRPLAY:e.includes("playready")?ep.PLAYREADY:e.includes("widevine")?ep.WIDEVINE:void 0)(e);return null==a||a(i),t}))}:{}},eG=async e=>{let t=await fetch(e);return 200!==t.status?Promise.reject(t):await t.arrayBuffer()},eq=async(e,t)=>{let i=await fetch(t,{method:"POST",headers:{"Content-type":"application/octet-stream"},body:e});return 200!==i.status?Promise.reject(i):new Uint8Array(await i.arrayBuffer())},ej=({playbackId:e,tokens:{drm:t}={},customDomain:i=e_},a)=>{let r=ew(e);return`https://license.${i.toLocaleLowerCase().endsWith(e_)?i:e_}/license/${a}/${r}?token=${t}`},eZ=({playbackId:e,tokens:{drm:t}={},customDomain:i=e_},a)=>{let r=ew(e);return`https://license.${i.toLocaleLowerCase().endsWith(e_)?i:e_}/appcert/${a}/${r}?token=${t}`},eQ=({playbackId:e,src:t,customDomain:i})=>{if(e)return!0;if("string"!=typeof t)return!1;let a=new URL(t,null==window?void 0:window.location.href).hostname.toLocaleLowerCase();return a.includes(e_)||!!i&&a.includes(i.toLocaleLowerCase())},ez=(e,t,i)=>{var n;let{envKey:s,disableTracking:o,muxDataSDK:l=a.A,muxDataSDKOptions:d={}}=e,u=eQ(e);if(!o&&(s||u)){let{playerInitTime:a,playerSoftwareName:o,playerSoftwareVersion:u,beaconCollectionDomain:h,debug:m,disableCookies:c}=e,p={...e.metadata,video_title:(null==(n=null==e?void 0:e.metadata)?void 0:n.video_title)||void 0};l.monitor(t,{debug:m,beaconCollectionDomain:h,hlsjs:i,Hls:i?r:void 0,automaticErrorTracking:!1,errorTranslator:t=>"string"!=typeof t.player_error_code&&("function"==typeof e.errorTranslator?e.errorTranslator(t):t),disableCookies:c,...d,data:{...s?{env_key:s}:{},player_software_name:o,player_software:o,player_software_version:u,player_init_time:a,...p}})}},eX=(e,t,i)=>{var a,o;let l=e$(e,t),{src:u,customDomain:h=e_}=e,c=()=>{t.ended||e.disablePseudoEnded||!eB(t,i)||(eW(t,i)?t.currentTime=t.buffered.end(t.buffered.length-1):t.dispatchEvent(new Event("ended")))},p,E,v=()=>{let e=eN(t),i,a;e.length>0&&(i=e.start(0),a=e.end(0)),(E!==a||p!==i)&&t.dispatchEvent(new CustomEvent("seekablechange",{composed:!0})),p=i,E=a};if(y(t,"durationchange",v),t&&l){let i=k(e);if("string"==typeof u){if(u.endsWith(".mp4")&&u.includes(h)){let e=eC(u);eg(new URL(`https://stream.${h}/${e}/metadata.json`).toString(),t)}let r=()=>{if(eD(t)!==m.LIVE||Number.isFinite(t.duration))return;let e=setInterval(v,1e3);t.addEventListener("teardown",()=>{clearInterval(e)},{once:!0}),y(t,"durationchange",()=>{Number.isFinite(t.duration)&&clearInterval(e)})},l=async()=>eb(u,t,i).then(r).catch(i=>{if(i instanceof Response){let a=er(i,n.VIDEO,e);if(a)return void e1(t,a)}});if("none"===t.preload){let e=()=>{l(),t.removeEventListener("loadedmetadata",i)},i=()=>{l(),t.removeEventListener("play",e)};y(t,"play",e,{once:!0}),y(t,"loadedmetadata",i,{once:!0})}else l();null!=(a=e.tokens)&&a.drm?((e,t)=>{let i=async i=>{let a=await navigator.requestMediaKeySystemAccess("com.apple.fps",[{initDataTypes:[i],videoCapabilities:[{contentType:"application/vnd.apple.mpegurl",robustness:""}],distinctiveIdentifier:"not-allowed",persistentState:"not-allowed",sessionTypes:["temporary"]}]).then(t=>{var i;return null==(i=e.drmTypeCb)||i.call(e,ep.FAIRPLAY),t}).catch(()=>{let e=new d(M("Cannot play DRM-protected content with current security configuration on this browser. Try playing in another browser."),d.MEDIA_ERR_ENCRYPTED,!0);e.errorCategory=n.DRM,e.muxCode=s.ENCRYPTED_UNSUPPORTED_KEY_SYSTEM,e1(t,e)});if(!a)return;let r=await a.createMediaKeys();try{let t=await eG(eZ(e,"fairplay")).catch(t=>{if(t instanceof Response){let i=er(t,n.DRM,e);return console.error("mediaError",null==i?void 0:i.message,null==i?void 0:i.context),i?Promise.reject(i):Promise.reject(Error("Unexpected error in app cert request"))}return Promise.reject(t)});await r.setServerCertificate(t).catch(()=>{let e=M("Your server certificate failed when attempting to set it. This may be an issue with a no longer valid certificate."),t=new d(e,d.MEDIA_ERR_ENCRYPTED,!0);return t.errorCategory=n.DRM,t.muxCode=s.ENCRYPTED_UPDATE_SERVER_CERT_FAILED,Promise.reject(t)})}catch(e){e1(t,e);return}await t.setMediaKeys(r)},a=async(i,a)=>{let r=t.mediaKeys.createSession(),o=()=>{r.keyStatuses.forEach(e=>(e=>{let i;"internal-error"===e?((i=new d(M("The DRM Content Decryption Module system had an internal failure. Try reloading the page, upading your browser, or playing in another browser."),d.MEDIA_ERR_ENCRYPTED,!0)).errorCategory=n.DRM,i.muxCode=s.ENCRYPTED_CDM_ERROR):("output-restricted"===e||"output-downscaled"===e)&&((i=new d(M("DRM playback is being attempted in an environment that is not sufficiently secure. User may see black screen."),d.MEDIA_ERR_ENCRYPTED,!1)).errorCategory=n.DRM,i.muxCode=s.ENCRYPTED_OUTPUT_RESTRICTED),i&&e1(t,i)})(e))},l=async i=>{let a=i.message;try{let i=await eq(a,ej(e,"fairplay"));try{await r.update(i)}catch{let e=M("Failed to update DRM license. This may be an issue with the player or your protected content."),i=new d(e,d.MEDIA_ERR_ENCRYPTED,!0);i.errorCategory=n.DRM,i.muxCode=s.ENCRYPTED_UPDATE_LICENSE_FAILED,e1(t,i)}}catch(i){if(i instanceof Response){let a=er(i,n.DRM,e);if(console.error("mediaError",null==a?void 0:a.message,null==a?void 0:a.context),a)return void e1(t,a);console.error("Unexpected error in license key request",i);return}console.error(i)}};r.addEventListener("keystatuseschange",o),r.addEventListener("message",l),t.addEventListener("teardown",()=>{r.removeEventListener("keystatuseschange",o),r.removeEventListener("message",l),r.close()},{once:!0}),await r.generateRequest(i,a).catch(e=>{console.error("Failed to generate license request",e);let t=new d(M("Failed to generate a DRM license request. This may be an issue with the player or your protected content."),d.MEDIA_ERR_ENCRYPTED,!0);return t.errorCategory=n.DRM,t.muxCode=s.ENCRYPTED_GENERATE_REQUEST_FAILED,Promise.reject(t)})};y(t,"encrypted",async e=>{try{let r=e.initDataType;if("skd"!==r)return void console.error(`Received unexpected initialization data type "${r}"`);t.mediaKeys||await i(r);let n=e.initData;if(null==n)return void console.error(`Could not start encrypted playback due to missing initData in ${e.type} event`);await a(r,n)}catch(e){e1(t,e);return}})})(e,t):y(t,"encrypted",()=>{let e=new d(M("Attempting to play DRM-protected content without providing a DRM token."),d.MEDIA_ERR_ENCRYPTED,!0);e.errorCategory=n.DRM,e.muxCode=s.ENCRYPTED_MISSING_TOKEN,e1(t,e)},{once:!0}),t.setAttribute("src",u),e.startTime&&((null!=(o=ey.get(t))?o:{}).startTime=e.startTime,t.addEventListener("durationchange",eJ,{once:!0}))}else t.removeAttribute("src");t.addEventListener("error",e0),t.addEventListener("error",e2),t.addEventListener("emptied",()=>{t.querySelectorAll("track[data-removeondestroy]").forEach(e=>{e.remove()})},{once:!0}),y(t,"pause",c),y(t,"seeked",c),y(t,"play",()=>{t.ended||eU(t.currentTime,t.duration)&&(t.currentTime=t.seekable.length?t.seekable.start(0):0)})}else i&&u?(i.once(r.Events.LEVEL_LOADED,(e,a)=>{((e,t,i)=>{var a,r,n,s,o,l,d,u;let{streamType:h,targetLiveWindow:c,liveEdgeStartOffset:p,lowLatency:E}=(e=>{var t;let i=e.type,a=I(i),r=S(i),n,s=!!(null!=(t=e.partList)&&t.length);return a===m.LIVE&&(n=s?2*e.partTarget:3*e.targetduration),{streamType:a,targetLiveWindow:r,liveEdgeStartOffset:n,lowLatency:s}})(e);if(h===m.LIVE){E?(i.config.backBufferLength=null!=(a=i.userConfig.backBufferLength)?a:4,i.config.maxFragLookUpTolerance=null!=(r=i.userConfig.maxFragLookUpTolerance)?r:.001,i.config.abrBandWidthUpFactor=null!=(n=i.userConfig.abrBandWidthUpFactor)?n:i.config.abrBandWidthFactor):i.config.backBufferLength=null!=(s=i.userConfig.backBufferLength)?s:8;let e=Object.freeze({get length(){return t.seekable.length},start:e=>t.seekable.start(e),end(e){var a;return e>this.length||e<0||Number.isFinite(t.duration)?t.seekable.end(e):null!=(a=i.liveSyncPosition)?a:t.seekable.end(e)}});(null!=(o=ey.get(t))?o:{}).seekable=e}(null!=(l=ey.get(t))?l:{}).liveEdgeStartOffset=p,(null!=(d=ey.get(t))?d:{}).targetLiveWindow=c,t.dispatchEvent(new CustomEvent("targetlivewindowchange",{composed:!0,bubbles:!0})),(null!=(u=ey.get(t))?u:{}).streamType=h,t.dispatchEvent(new CustomEvent("streamtypechange",{composed:!0,bubbles:!0}))})(a.details,t,i),v(),eD(t)!==m.LIVE||Number.isFinite(t.duration)||(i.on(r.Events.LEVEL_UPDATED,v),y(t,"durationchange",()=>{Number.isFinite(t.duration)&&i.off(r.Events.LEVELS_UPDATED,v)}))}),i.on(r.Events.ERROR,(a,r)=>{var n,o;let l=e3(r,e);if(l.muxCode===s.NETWORK_NOT_READY){let e=null!=(n=ey.get(t))?n:{},a=null!=(o=e.retryCount)?o:0;if(a<6){let n=0===a?5e3:6e4,s=new d(`Retrying in ${n/1e3} seconds...`,l.code,l.fatal);Object.assign(s,l),e1(t,s),setTimeout(()=>{e.retryCount=a+1,"manifestLoadError"===r.details&&r.url&&i.loadSource(r.url)},n);return}{e.retryCount=0;let i=new d('Try again later or <a href="#" onclick="window.location.reload(); return false;" style="color: #4a90e2;">click here to retry</a>',l.code,l.fatal);Object.assign(i,l),e1(t,i);return}}e1(t,l)}),i.on(r.Events.MANIFEST_LOADED,()=>{let e=ey.get(t);e&&e.error&&(e.error=null,e.retryCount=0,t.dispatchEvent(new Event("emptied")),t.dispatchEvent(new Event("loadstart")))}),t.addEventListener("error",e2),y(t,"waiting",c),function(e,t){var i;if(!("videoTracks"in e))return;let a=new WeakMap;t.on(r.Events.MANIFEST_PARSED,function(t,i){s();let r=e.addVideoTrack("main");for(let[e,t]of(r.selected=!0,i.levels.entries())){let i=r.addRendition(t.url[0],t.width,t.height,t.videoCodec,t.bitrate);a.set(t,`${e}`),i.id=`${e}`}}),t.on(r.Events.AUDIO_TRACKS_UPDATED,function(t,i){for(let t of(n(),i.audioTracks)){let i=t.default?"main":"alternative",a=e.addAudioTrack(i,t.name,t.lang);a.id=`${t.id}`,t.default&&(a.enabled=!0)}}),e.audioTracks.addEventListener("change",()=>{var i;let a=+(null==(i=[...e.audioTracks].find(e=>e.enabled))?void 0:i.id),r=t.audioTracks.map(e=>e.id);a!=t.audioTrack&&r.includes(a)&&(t.audioTrack=a)}),t.on(r.Events.LEVELS_UPDATED,function(t,i){var r;let n=e.videoTracks[null!=(r=e.videoTracks.selectedIndex)?r:0];if(!n)return;let s=i.levels.map(e=>a.get(e));for(let t of e.videoRenditions)t.id&&!s.includes(t.id)&&n.removeRendition(t)}),null==(i=e.videoRenditions)||i.addEventListener("change",e=>{let i=e.target.selectedIndex;i!=t.nextLevel&&(t.nextLevel=i)});let n=()=>{for(let t of e.audioTracks)e.removeAudioTrack(t)},s=()=>{(()=>{for(let t of e.videoTracks)e.removeVideoTrack(t)})(),n()};t.once(r.Events.DESTROYING,s)}(e,i),function(e,t){t.on(r.Events.NON_NATIVE_TEXT_TRACKS_FOUND,(i,{tracks:a})=>{a.forEach(i=>{var a,r;let n=null!=(a=i.subtitleTrack)?a:i.closedCaptions,s=t.subtitleTracks.findIndex(({lang:e,name:t,type:a})=>e==(null==n?void 0:n.lang)&&t===i.label&&a.toLowerCase()===i.kind),o=(null!=(r=i._id)?r:i.default)?"default":`${i.kind}${s}`;U(e,i.kind,i.label,null==n?void 0:n.lang,o,i.default)})});let i=()=>{if(!t.subtitleTracks.length)return;let i=Array.from(e.textTracks).find(e=>e.id&&"showing"===e.mode&&["subtitles","captions"].includes(e.kind));if(!i)return;let a=t.subtitleTracks[t.subtitleTrack],r=a?a.default?"default":`${t.subtitleTracks[t.subtitleTrack].type.toLowerCase()}${t.subtitleTrack}`:void 0;if(t.subtitleTrack<0||(null==i?void 0:i.id)!==r){let e=t.subtitleTracks.findIndex(({lang:e,name:t,type:a,default:r})=>"default"===i.id&&r||e==i.language&&t===i.label&&a.toLowerCase()===i.kind);t.subtitleTrack=e}(null==i?void 0:i.id)===r&&i.cues&&Array.from(i.cues).forEach(e=>{i.addCue(e)})};e.textTracks.addEventListener("change",i),t.on(r.Events.CUES_PARSED,(t,{track:i,cues:a})=>{let r=e.textTracks.getTrackById(i);if(!r)return;let n="disabled"===r.mode;n&&(r.mode="hidden"),a.forEach(e=>{var t;null!=(t=r.cues)&&t.getCueById(e.id)||r.addCue(e)}),n&&(r.mode="disabled")}),t.once(r.Events.DESTROYING,()=>{e.textTracks.removeEventListener("change",i),e.querySelectorAll("track[data-removeondestroy]").forEach(e=>{e.remove()})});let a=()=>{Array.from(e.textTracks).forEach(t=>{var i,a;if(!["subtitles","caption"].includes(t.kind)&&("thumbnails"===t.label||"chapters"===t.kind)){if(!(null!=(i=t.cues)&&i.length)){let i="track";t.kind&&(i+=`[kind="${t.kind}"]`),t.label&&(i+=`[label="${t.label}"]`);let r=e.querySelector(i),n=null!=(a=null==r?void 0:r.getAttribute("src"))?a:"";null==r||r.removeAttribute("src"),setTimeout(()=>{null==r||r.setAttribute("src",n)},0)}"hidden"!==t.mode&&(t.mode="hidden")}})};t.once(r.Events.MANIFEST_LOADED,a),t.once(r.Events.MEDIA_ATTACHED,a)}(t,i),i.attachMedia(t)):console.error("It looks like the video you're trying to play will not work on this system! If possible, try upgrading to the newest versions of your browser or software.")};function eJ(e){var t;let i=e.target,a=null==(t=ey.get(i))?void 0:t.startTime;if(a&&function(e,t,i){t&&i>t&&(i=t);for(let t=0;t<e.length;t++)if(e.start(t)<=i&&e.end(t)>=i)return!0;return!1}(i.seekable,i.duration,a)){let e="auto"===i.preload;e&&(i.preload="none"),i.currentTime=a,e&&(i.preload="auto")}}async function e0(e){if(!e.isTrusted)return;e.stopImmediatePropagation();let t=e.target;if(!(null!=t&&t.error))return;let{message:i,code:a}=t.error,r=new d(i,a);if(t.src&&a===d.MEDIA_ERR_SRC_NOT_SUPPORTED&&t.readyState===HTMLMediaElement.HAVE_NOTHING)return void setTimeout(()=>{var e;let i=null!=(e=eL(t))?e:t.error;(null==i?void 0:i.code)===d.MEDIA_ERR_SRC_NOT_SUPPORTED&&e1(t,r)},500);if(t.src&&(a!==d.MEDIA_ERR_DECODE||void 0!==a))try{let{status:e}=await fetch(t.src);r.data={response:{code:e}}}catch{}e1(t,r)}function e1(e,t){var i;t.fatal&&((null!=(i=ey.get(e))?i:{}).error=t,e.dispatchEvent(new CustomEvent("error",{detail:t})))}function e2(e){var t,i;if(!(e instanceof CustomEvent)||!(e.detail instanceof d))return;let a=e.target,r=e.detail;r&&r.fatal&&((null!=(t=ey.get(a))?t:{}).error=r,null==(i=a.mux)||i.emit("error",{player_error_code:r.code,player_error_message:r.message,player_error_context:r.context}))}var e3=(e,t)=>{var i,a,o;e.fatal?console.error("getErrorFromHlsErrorData()",e):t.debug&&console.warn("getErrorFromHlsErrorData() (non-fatal)",e);let l={[r.ErrorTypes.NETWORK_ERROR]:d.MEDIA_ERR_NETWORK,[r.ErrorTypes.MEDIA_ERROR]:d.MEDIA_ERR_DECODE,[r.ErrorTypes.KEY_SYSTEM_ERROR]:d.MEDIA_ERR_ENCRYPTED},u,h=(e=>[r.ErrorDetails.KEY_SYSTEM_LICENSE_REQUEST_FAILED,r.ErrorDetails.KEY_SYSTEM_SERVER_CERTIFICATE_REQUEST_FAILED].includes(e.details)?d.MEDIA_ERR_NETWORK:l[e.type])(e);if(h===d.MEDIA_ERR_NETWORK&&e.response){let s=null!=(i=(e=>e.type===r.ErrorTypes.KEY_SYSTEM_ERROR?n.DRM:e.type===r.ErrorTypes.NETWORK_ERROR?n.VIDEO:void 0)(e))?i:n.VIDEO;u=null!=(a=er(e.response,s,t,e.fatal))?a:new d("",h,e.fatal)}else h===d.MEDIA_ERR_ENCRYPTED?e.details===r.ErrorDetails.KEY_SYSTEM_NO_CONFIGURED_LICENSE?((u=new d(M("Attempting to play DRM-protected content without providing a DRM token."),d.MEDIA_ERR_ENCRYPTED,e.fatal)).errorCategory=n.DRM,u.muxCode=s.ENCRYPTED_MISSING_TOKEN):e.details===r.ErrorDetails.KEY_SYSTEM_NO_ACCESS?((u=new d(M("Cannot play DRM-protected content with current security configuration on this browser. Try playing in another browser."),d.MEDIA_ERR_ENCRYPTED,e.fatal)).errorCategory=n.DRM,u.muxCode=s.ENCRYPTED_UNSUPPORTED_KEY_SYSTEM):e.details===r.ErrorDetails.KEY_SYSTEM_NO_SESSION?((u=new d(M("Failed to generate a DRM license request. This may be an issue with the player or your protected content."),d.MEDIA_ERR_ENCRYPTED,!0)).errorCategory=n.DRM,u.muxCode=s.ENCRYPTED_GENERATE_REQUEST_FAILED):e.details===r.ErrorDetails.KEY_SYSTEM_SESSION_UPDATE_FAILED?((u=new d(M("Failed to update DRM license. This may be an issue with the player or your protected content."),d.MEDIA_ERR_ENCRYPTED,e.fatal)).errorCategory=n.DRM,u.muxCode=s.ENCRYPTED_UPDATE_LICENSE_FAILED):e.details===r.ErrorDetails.KEY_SYSTEM_SERVER_CERTIFICATE_UPDATE_FAILED?((u=new d(M("Your server certificate failed when attempting to set it. This may be an issue with a no longer valid certificate."),d.MEDIA_ERR_ENCRYPTED,e.fatal)).errorCategory=n.DRM,u.muxCode=s.ENCRYPTED_UPDATE_SERVER_CERT_FAILED):e.details===r.ErrorDetails.KEY_SYSTEM_STATUS_INTERNAL_ERROR?((u=new d(M("The DRM Content Decryption Module system had an internal failure. Try reloading the page, upading your browser, or playing in another browser."),d.MEDIA_ERR_ENCRYPTED,e.fatal)).errorCategory=n.DRM,u.muxCode=s.ENCRYPTED_CDM_ERROR):e.details===r.ErrorDetails.KEY_SYSTEM_STATUS_OUTPUT_RESTRICTED?((u=new d(M("DRM playback is being attempted in an environment that is not sufficiently secure. User may see black screen."),d.MEDIA_ERR_ENCRYPTED,!1)).errorCategory=n.DRM,u.muxCode=s.ENCRYPTED_OUTPUT_RESTRICTED):((u=new d(e.error.message,d.MEDIA_ERR_ENCRYPTED,e.fatal)).errorCategory=n.DRM,u.muxCode=s.ENCRYPTED_ERROR):u=new d("",h,e.fatal);return u.context||(u.context=`${e.url?`url: ${e.url}
`:""}${e.response&&(e.response.code||e.response.text)?`response: ${e.response.code}, ${e.response.text}
`:""}${e.reason?`failure reason: ${e.reason}
`:""}${e.level?`level: ${e.level}
`:""}${e.parent?`parent stream controller: ${e.parent}
`:""}${e.buffer?`buffer length: ${e.buffer}
`:""}${e.error?`error: ${e.error}
`:""}${e.event?`event: ${e.event}
`:""}${e.err?`error message: ${null==(o=e.err)?void 0:o.message}
`:""}`),u.data=e,u}},15167:(e,t,i)=>{let a,r;i.d(t,{FJ:()=>b.FJ});var n,s,o,l,d,u,h,m,c,p,E,v,b=i(13852),g=i(89595),f=e=>{throw TypeError(e)},A=(e,t,i)=>t.has(e)||f("Cannot "+i),T=(e,t,i)=>(A(e,t,"read from private field"),i?i.call(e):t.get(e)),y=(e,t,i)=>t.has(e)?f("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,i),_=(e,t,i,a)=>(A(e,t,"write to private field"),a?a.call(e,i):t.set(e,i),i),k=(e,t,i)=>(A(e,t,"access private method"),i),I=(()=>{try{return"0.29.2"}catch{}return"UNKNOWN"})(),S=`
<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" part="logo" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2" viewBox="0 0 1600 500"><g fill="#fff"><path d="M994.287 93.486c-17.121 0-31-13.879-31-31 0-17.121 13.879-31 31-31 17.121 0 31 13.879 31 31 0 17.121-13.879 31-31 31m0-93.486c-34.509 0-62.484 27.976-62.484 62.486v187.511c0 68.943-56.09 125.033-125.032 125.033s-125.03-56.09-125.03-125.033V62.486C681.741 27.976 653.765 0 619.256 0s-62.484 27.976-62.484 62.486v187.511C556.772 387.85 668.921 500 806.771 500c137.851 0 250.001-112.15 250.001-250.003V62.486c0-34.51-27.976-62.486-62.485-62.486M1537.51 468.511c-17.121 0-31-13.879-31-31 0-17.121 13.879-31 31-31 17.121 0 31 13.879 31 31 0 17.121-13.879 31-31 31m-275.883-218.509-143.33 143.329c-24.402 24.402-24.402 63.966 0 88.368 24.402 24.402 63.967 24.402 88.369 0l143.33-143.329 143.328 143.329c24.402 24.4 63.967 24.402 88.369 0 24.403-24.402 24.403-63.966.001-88.368l-143.33-143.329.001-.004 143.329-143.329c24.402-24.402 24.402-63.965 0-88.367s-63.967-24.402-88.369 0L1349.996 161.63 1206.667 18.302c-24.402-24.401-63.967-24.402-88.369 0s-24.402 63.965 0 88.367l143.329 143.329v.004ZM437.511 468.521c-17.121 0-31-13.879-31-31 0-17.121 13.879-31 31-31 17.121 0 31 13.879 31 31 0 17.121-13.879 31-31 31M461.426 4.759C438.078-4.913 411.2.432 393.33 18.303L249.999 161.632 106.669 18.303C88.798.432 61.922-4.913 38.573 4.759 15.224 14.43-.001 37.214-.001 62.488v375.026c0 34.51 27.977 62.486 62.487 62.486 34.51 0 62.486-27.976 62.486-62.486V213.341l80.843 80.844c24.404 24.402 63.965 24.402 88.369 0l80.843-80.844v224.173c0 34.51 27.976 62.486 62.486 62.486s62.486-27.976 62.486-62.486V62.488c0-25.274-15.224-48.058-38.573-57.729" style="fill-rule:nonzero"/></g></svg>`,R={BEACON_COLLECTION_DOMAIN:"beacon-collection-domain",CUSTOM_DOMAIN:"custom-domain",DEBUG:"debug",DISABLE_TRACKING:"disable-tracking",DISABLE_COOKIES:"disable-cookies",DISABLE_PSEUDO_ENDED:"disable-pseudo-ended",DRM_TOKEN:"drm-token",PLAYBACK_TOKEN:"playback-token",ENV_KEY:"env-key",MAX_RESOLUTION:"max-resolution",MIN_RESOLUTION:"min-resolution",MAX_AUTO_RESOLUTION:"max-auto-resolution",RENDITION_ORDER:"rendition-order",PROGRAM_START_TIME:"program-start-time",PROGRAM_END_TIME:"program-end-time",ASSET_START_TIME:"asset-start-time",ASSET_END_TIME:"asset-end-time",METADATA_URL:"metadata-url",PLAYBACK_ID:"playback-id",PLAYER_SOFTWARE_NAME:"player-software-name",PLAYER_SOFTWARE_VERSION:"player-software-version",PLAYER_INIT_TIME:"player-init-time",PREFER_CMCD:"prefer-cmcd",PREFER_PLAYBACK:"prefer-playback",START_TIME:"start-time",STREAM_TYPE:"stream-type",TARGET_LIVE_WINDOW:"target-live-window",LIVE_EDGE_OFFSET:"live-edge-offset",TYPE:"type",LOGO:"logo"},w=Object.values(R),C="mux-video",L=class extends g.lB{constructor(){super(),y(this,E),y(this,n),y(this,s),y(this,o),y(this,l,{}),y(this,d,{}),y(this,u),y(this,h),y(this,m),y(this,c),y(this,p,""),_(this,o,(0,b.GI)()),this.nativeEl.addEventListener("muxmetadata",e=>{var t;let i=(0,b.yb)(this.nativeEl),a=null!=(t=this.metadata)?t:{};this.metadata={...i,...a},(null==i?void 0:i["com.mux.video.branding"])==="mux-free-plan"&&(_(this,p,"default"),this.updateLogo())})}static get NAME(){return C}static get VERSION(){return I}static get observedAttributes(){var e;return[...w,...null!=(e=g.lB.observedAttributes)?e:[]]}static getLogoHTML(e){return e&&"false"!==e?"default"===e?S:`<img part="logo" src="${e}" />`:""}static getTemplateHTML(e={}){var t;return`
      ${g.lB.getTemplateHTML(e)}
      <style>
        :host {
          position: relative;
        }
        slot[name="logo"] {
          display: flex;
          justify-content: end;
          position: absolute;
          top: 1rem;
          right: 1rem;
          opacity: 0;
          transition: opacity 0.25s ease-in-out;
          z-index: 1;
        }
        slot[name="logo"]:has([part="logo"]) {
          opacity: 1;
        }
        slot[name="logo"] [part="logo"] {
          width: 5rem;
          pointer-events: none;
          user-select: none;
        }
      </style>
      <slot name="logo">
        ${this.getLogoHTML(null!=(t=e[R.LOGO])?t:"")}
      </slot>
    `}get preferCmcd(){var e;return null!=(e=this.getAttribute(R.PREFER_CMCD))?e:void 0}set preferCmcd(e){e!==this.preferCmcd&&(e?b.WG.includes(e)?this.setAttribute(R.PREFER_CMCD,e):console.warn(`Invalid value for preferCmcd. Must be one of ${b.WG.join()}`):this.removeAttribute(R.PREFER_CMCD))}get playerInitTime(){return this.hasAttribute(R.PLAYER_INIT_TIME)?+this.getAttribute(R.PLAYER_INIT_TIME):T(this,o)}set playerInitTime(e){e!=this.playerInitTime&&(null==e?this.removeAttribute(R.PLAYER_INIT_TIME):this.setAttribute(R.PLAYER_INIT_TIME,`${+e}`))}get playerSoftwareName(){var e;return null!=(e=T(this,m))?e:C}set playerSoftwareName(e){_(this,m,e)}get playerSoftwareVersion(){var e;return null!=(e=T(this,h))?e:I}set playerSoftwareVersion(e){_(this,h,e)}get _hls(){var e;return null==(e=T(this,n))?void 0:e.engine}get mux(){var e;return null==(e=this.nativeEl)?void 0:e.mux}get error(){var e;return null!=(e=(0,b.vG)(this.nativeEl))?e:null}get errorTranslator(){return T(this,c)}set errorTranslator(e){_(this,c,e)}get src(){return this.getAttribute("src")}set src(e){e!==this.src&&(null==e?this.removeAttribute("src"):this.setAttribute("src",e))}get type(){var e;return null!=(e=this.getAttribute(R.TYPE))?e:void 0}set type(e){e!==this.type&&(e?this.setAttribute(R.TYPE,e):this.removeAttribute(R.TYPE))}get preload(){let e=this.getAttribute("preload");return""===e?"auto":["none","metadata","auto"].includes(e)?e:super.preload}set preload(e){e!=this.getAttribute("preload")&&(["","none","metadata","auto"].includes(e)?this.setAttribute("preload",e):this.removeAttribute("preload"))}get debug(){return null!=this.getAttribute(R.DEBUG)}set debug(e){e!==this.debug&&(e?this.setAttribute(R.DEBUG,""):this.removeAttribute(R.DEBUG))}get disableTracking(){return this.hasAttribute(R.DISABLE_TRACKING)}set disableTracking(e){e!==this.disableTracking&&this.toggleAttribute(R.DISABLE_TRACKING,!!e)}get disableCookies(){return this.hasAttribute(R.DISABLE_COOKIES)}set disableCookies(e){e!==this.disableCookies&&(e?this.setAttribute(R.DISABLE_COOKIES,""):this.removeAttribute(R.DISABLE_COOKIES))}get disablePseudoEnded(){return this.hasAttribute(R.DISABLE_PSEUDO_ENDED)}set disablePseudoEnded(e){e!==this.disablePseudoEnded&&(e?this.setAttribute(R.DISABLE_PSEUDO_ENDED,""):this.removeAttribute(R.DISABLE_PSEUDO_ENDED))}get startTime(){let e=this.getAttribute(R.START_TIME);if(null==e)return;let t=+e;return Number.isNaN(t)?void 0:t}set startTime(e){e!==this.startTime&&(null==e?this.removeAttribute(R.START_TIME):this.setAttribute(R.START_TIME,`${e}`))}get playbackId(){var e;return this.hasAttribute(R.PLAYBACK_ID)?this.getAttribute(R.PLAYBACK_ID):null!=(e=(0,b.CL)(this.src))?e:void 0}set playbackId(e){e!==this.playbackId&&(e?this.setAttribute(R.PLAYBACK_ID,e):this.removeAttribute(R.PLAYBACK_ID))}get maxResolution(){var e;return null!=(e=this.getAttribute(R.MAX_RESOLUTION))?e:void 0}set maxResolution(e){e!==this.maxResolution&&(e?this.setAttribute(R.MAX_RESOLUTION,e):this.removeAttribute(R.MAX_RESOLUTION))}get minResolution(){var e;return null!=(e=this.getAttribute(R.MIN_RESOLUTION))?e:void 0}set minResolution(e){e!==this.minResolution&&(e?this.setAttribute(R.MIN_RESOLUTION,e):this.removeAttribute(R.MIN_RESOLUTION))}get maxAutoResolution(){var e;return null!=(e=this.getAttribute(R.MAX_AUTO_RESOLUTION))?e:void 0}set maxAutoResolution(e){null==e?this.removeAttribute(R.MAX_AUTO_RESOLUTION):this.setAttribute(R.MAX_AUTO_RESOLUTION,e)}get renditionOrder(){var e;return null!=(e=this.getAttribute(R.RENDITION_ORDER))?e:void 0}set renditionOrder(e){e!==this.renditionOrder&&(e?this.setAttribute(R.RENDITION_ORDER,e):this.removeAttribute(R.RENDITION_ORDER))}get programStartTime(){let e=this.getAttribute(R.PROGRAM_START_TIME);if(null==e)return;let t=+e;return Number.isNaN(t)?void 0:t}set programStartTime(e){null==e?this.removeAttribute(R.PROGRAM_START_TIME):this.setAttribute(R.PROGRAM_START_TIME,`${e}`)}get programEndTime(){let e=this.getAttribute(R.PROGRAM_END_TIME);if(null==e)return;let t=+e;return Number.isNaN(t)?void 0:t}set programEndTime(e){null==e?this.removeAttribute(R.PROGRAM_END_TIME):this.setAttribute(R.PROGRAM_END_TIME,`${e}`)}get assetStartTime(){let e=this.getAttribute(R.ASSET_START_TIME);if(null==e)return;let t=+e;return Number.isNaN(t)?void 0:t}set assetStartTime(e){null==e?this.removeAttribute(R.ASSET_START_TIME):this.setAttribute(R.ASSET_START_TIME,`${e}`)}get assetEndTime(){let e=this.getAttribute(R.ASSET_END_TIME);if(null==e)return;let t=+e;return Number.isNaN(t)?void 0:t}set assetEndTime(e){null==e?this.removeAttribute(R.ASSET_END_TIME):this.setAttribute(R.ASSET_END_TIME,`${e}`)}get customDomain(){var e;return null!=(e=this.getAttribute(R.CUSTOM_DOMAIN))?e:void 0}set customDomain(e){e!==this.customDomain&&(e?this.setAttribute(R.CUSTOM_DOMAIN,e):this.removeAttribute(R.CUSTOM_DOMAIN))}get drmToken(){var e;return null!=(e=this.getAttribute(R.DRM_TOKEN))?e:void 0}set drmToken(e){e!==this.drmToken&&(e?this.setAttribute(R.DRM_TOKEN,e):this.removeAttribute(R.DRM_TOKEN))}get playbackToken(){var e,t,i,a;if(this.hasAttribute(R.PLAYBACK_TOKEN))return null!=(e=this.getAttribute(R.PLAYBACK_TOKEN))?e:void 0;if(this.hasAttribute(R.PLAYBACK_ID)){let[,e]=(0,b._$)(null!=(t=this.playbackId)?t:"");return null!=(i=new URLSearchParams(e).get("token"))?i:void 0}if(this.src)return null!=(a=new URLSearchParams(this.src).get("token"))?a:void 0}set playbackToken(e){e!==this.playbackToken&&(e?this.setAttribute(R.PLAYBACK_TOKEN,e):this.removeAttribute(R.PLAYBACK_TOKEN))}get tokens(){let e=this.getAttribute(R.PLAYBACK_TOKEN),t=this.getAttribute(R.DRM_TOKEN);return{...T(this,d),...null!=e?{playback:e}:{},...null!=t?{drm:t}:{}}}set tokens(e){_(this,d,null!=e?e:{})}get ended(){return(0,b.hu)(this.nativeEl,this._hls)}get envKey(){var e;return null!=(e=this.getAttribute(R.ENV_KEY))?e:void 0}set envKey(e){e!==this.envKey&&(e?this.setAttribute(R.ENV_KEY,e):this.removeAttribute(R.ENV_KEY))}get beaconCollectionDomain(){var e;return null!=(e=this.getAttribute(R.BEACON_COLLECTION_DOMAIN))?e:void 0}set beaconCollectionDomain(e){e!==this.beaconCollectionDomain&&(e?this.setAttribute(R.BEACON_COLLECTION_DOMAIN,e):this.removeAttribute(R.BEACON_COLLECTION_DOMAIN))}get streamType(){var e;return null!=(e=this.getAttribute(R.STREAM_TYPE))?e:(0,b.Zp)(this.nativeEl)}set streamType(e){e!==this.streamType&&(e?this.setAttribute(R.STREAM_TYPE,e):this.removeAttribute(R.STREAM_TYPE))}get targetLiveWindow(){return this.hasAttribute(R.TARGET_LIVE_WINDOW)?+this.getAttribute(R.TARGET_LIVE_WINDOW):(0,b.WE)(this.nativeEl)}set targetLiveWindow(e){e!=this.targetLiveWindow&&(null==e?this.removeAttribute(R.TARGET_LIVE_WINDOW):this.setAttribute(R.TARGET_LIVE_WINDOW,`${+e}`))}get liveEdgeStart(){var e,t;if(this.hasAttribute(R.LIVE_EDGE_OFFSET)){let{liveEdgeOffset:i}=this,a=null!=(e=this.nativeEl.seekable.end(0))?e:0;return Math.max(null!=(t=this.nativeEl.seekable.start(0))?t:0,a-i)}return(0,b.Yz)(this.nativeEl)}get liveEdgeOffset(){if(this.hasAttribute(R.LIVE_EDGE_OFFSET))return+this.getAttribute(R.LIVE_EDGE_OFFSET)}set liveEdgeOffset(e){e!=this.liveEdgeOffset&&(null==e?this.removeAttribute(R.LIVE_EDGE_OFFSET):this.setAttribute(R.LIVE_EDGE_OFFSET,`${+e}`))}get seekable(){return(0,b.pD)(this.nativeEl)}async addCuePoints(e){return(0,b.st)(this.nativeEl,e)}get activeCuePoint(){return(0,b.C$)(this.nativeEl)}get cuePoints(){return(0,b.Pv)(this.nativeEl)}async addChapters(e){return(0,b.S5)(this.nativeEl,e)}get activeChapter(){return(0,b.IC)(this.nativeEl)}get chapters(){return(0,b.rN)(this.nativeEl)}getStartDate(){return(0,b.tq)(this.nativeEl,this._hls)}get currentPdt(){return(0,b.Ul)(this.nativeEl,this._hls)}get preferPlayback(){let e=this.getAttribute(R.PREFER_PLAYBACK);if(e===b.Vi.MSE||e===b.Vi.NATIVE)return e}set preferPlayback(e){e!==this.preferPlayback&&(e===b.Vi.MSE||e===b.Vi.NATIVE?this.setAttribute(R.PREFER_PLAYBACK,e):this.removeAttribute(R.PREFER_PLAYBACK))}get metadata(){return{...this.getAttributeNames().filter(e=>e.startsWith("metadata-")&&![R.METADATA_URL].includes(e)).reduce((e,t)=>{let i=this.getAttribute(t);return null!=i&&(e[t.replace(/^metadata-/,"").replace(/-/g,"_")]=i),e},{}),...T(this,l)}}set metadata(e){_(this,l,null!=e?e:{}),this.mux&&this.mux.emit("hb",T(this,l))}get _hlsConfig(){return T(this,u)}set _hlsConfig(e){_(this,u,e)}get logo(){var e;return null!=(e=this.getAttribute(R.LOGO))?e:T(this,p)}set logo(e){e?this.setAttribute(R.LOGO,e):this.removeAttribute(R.LOGO)}load(){_(this,n,(0,b.n_)(this,this.nativeEl,T(this,n)))}unload(){(0,b.zN)(this.nativeEl,T(this,n),this),_(this,n,void 0)}attributeChangedCallback(e,t,i){var a,r;switch(g.lB.observedAttributes.includes(e)&&!["src","autoplay","preload"].includes(e)&&super.attributeChangedCallback(e,t,i),e){case R.PLAYER_SOFTWARE_NAME:this.playerSoftwareName=null!=i?i:void 0;break;case R.PLAYER_SOFTWARE_VERSION:this.playerSoftwareVersion=null!=i?i:void 0;break;case"src":{let e=!!t,a=!!i;!e&&a?k(this,E,v).call(this):e&&!a?this.unload():e&&a&&(this.unload(),k(this,E,v).call(this));break}case"autoplay":if(i===t)break;null==(a=T(this,n))||a.setAutoplay(this.autoplay);break;case"preload":if(i===t)break;null==(r=T(this,n))||r.setPreload(i);break;case R.PLAYBACK_ID:this.src=(0,b.OR)(this);break;case R.DEBUG:{let e=this.debug;this.mux&&console.info("Cannot toggle debug mode of mux data after initialization. Make sure you set all metadata to override before setting the src."),this._hls&&(this._hls.config.debug=e);break}case R.METADATA_URL:i&&fetch(i).then(e=>e.json()).then(e=>this.metadata=e).catch(()=>console.error(`Unable to load or parse metadata JSON from metadata-url ${i}!`));break;case R.STREAM_TYPE:(null==i||i!==t)&&this.dispatchEvent(new CustomEvent("streamtypechange",{composed:!0,bubbles:!0}));break;case R.TARGET_LIVE_WINDOW:(null==i||i!==t)&&this.dispatchEvent(new CustomEvent("targetlivewindowchange",{composed:!0,bubbles:!0,detail:this.targetLiveWindow}));break;case R.LOGO:(null==i||i!==t)&&this.updateLogo();break;case R.DISABLE_TRACKING:if(null==i||i!==t){let e=this.currentTime,t=this.paused;this.unload(),k(this,E,v).call(this).then(()=>{this.currentTime=e,t||this.play()})}break;case R.DISABLE_COOKIES:(null==i||i!==t)&&this.disableCookies&&document.cookie.split(";").forEach(e=>{e.trim().startsWith("muxData")&&(document.cookie=e.replace(/^ +/,"").replace(/=.*/,"=;expires="+new Date().toUTCString()+";path=/"))})}}updateLogo(){if(!this.shadowRoot)return;let e=this.shadowRoot.querySelector('slot[name="logo"]');e&&(e.innerHTML=this.constructor.getLogoHTML(T(this,p)||this.logo))}connectedCallback(){var e;null==(e=super.connectedCallback)||e.call(this),this.nativeEl&&this.src&&!T(this,n)&&k(this,E,v).call(this)}disconnectedCallback(){this.unload()}handleEvent(e){e.target===this.nativeEl&&this.dispatchEvent(new CustomEvent(e.type,{composed:!0,detail:e.detail}))}};n=new WeakMap,s=new WeakMap,o=new WeakMap,l=new WeakMap,d=new WeakMap,u=new WeakMap,h=new WeakMap,m=new WeakMap,c=new WeakMap,p=new WeakMap,E=new WeakSet,v=async function(){T(this,s)||(await _(this,s,Promise.resolve()),_(this,s,null),this.load())};var M=i(15278),D=i(1361),O=e=>{throw TypeError(e)},N=(e,t,i)=>t.has(e)||O("Cannot "+i),x=(e,t,i)=>(N(e,t,"read from private field"),i?i.call(e):t.get(e)),P=(e,t,i)=>t.has(e)?O("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,i),U=(e,t,i,a)=>(N(e,t,"write to private field"),a?a.call(e,i):t.set(e,i),i),W=class{addEventListener(){}removeEventListener(){}dispatchEvent(e){return!0}};if("undefined"==typeof DocumentFragment){class e extends W{}globalThis.DocumentFragment=e}var B,H=class extends W{},V=class{constructor(e,t={}){P(this,B),U(this,B,null==t?void 0:t.detail)}get detail(){return x(this,B)}initCustomEvent(){}};B=new WeakMap;var $={document:{createElement:function(e,t){return new H}},DocumentFragment,customElements:{get(e){},define(e,t,i){},getName:e=>null,upgrade(e){},whenDefined:e=>Promise.resolve(H)},CustomEvent:V,EventTarget:W,HTMLElement:H,HTMLVideoElement:class extends W{}},K="undefined"==typeof window||void 0===globalThis.customElements,F=K?$:globalThis;K?$.document:globalThis.document;var Y,G=class extends(0,M.J)((0,D.u6)(L)){constructor(){super(...arguments),P(this,Y)}get autoplay(){let e=this.getAttribute("autoplay");return null!==e&&(""===e||e)}set autoplay(e){e!==this.autoplay&&(e?this.setAttribute("autoplay","string"==typeof e?e:""):this.removeAttribute("autoplay"))}get muxCastCustomData(){return{mux:{playbackId:this.playbackId,minResolution:this.minResolution,maxResolution:this.maxResolution,renditionOrder:this.renditionOrder,customDomain:this.customDomain,tokens:{drm:this.drmToken},envKey:this.envKey,metadata:this.metadata,disableCookies:this.disableCookies,disableTracking:this.disableTracking,beaconCollectionDomain:this.beaconCollectionDomain,startTime:this.startTime,preferCmcd:this.preferCmcd}}}get castCustomData(){var e;return null!=(e=x(this,Y))?e:this.muxCastCustomData}set castCustomData(e){U(this,Y,e)}};Y=new WeakMap,F.customElements.get("mux-video")||(F.customElements.define("mux-video",G),F.MuxVideoElement=G);let q={MEDIA_PLAY_REQUEST:"mediaplayrequest",MEDIA_PAUSE_REQUEST:"mediapauserequest",MEDIA_MUTE_REQUEST:"mediamuterequest",MEDIA_UNMUTE_REQUEST:"mediaunmuterequest",MEDIA_LOOP_REQUEST:"medialooprequest",MEDIA_VOLUME_REQUEST:"mediavolumerequest",MEDIA_SEEK_REQUEST:"mediaseekrequest",MEDIA_AIRPLAY_REQUEST:"mediaairplayrequest",MEDIA_ENTER_FULLSCREEN_REQUEST:"mediaenterfullscreenrequest",MEDIA_EXIT_FULLSCREEN_REQUEST:"mediaexitfullscreenrequest",MEDIA_PREVIEW_REQUEST:"mediapreviewrequest",MEDIA_ENTER_PIP_REQUEST:"mediaenterpiprequest",MEDIA_EXIT_PIP_REQUEST:"mediaexitpiprequest",MEDIA_ENTER_CAST_REQUEST:"mediaentercastrequest",MEDIA_EXIT_CAST_REQUEST:"mediaexitcastrequest",MEDIA_SHOW_TEXT_TRACKS_REQUEST:"mediashowtexttracksrequest",MEDIA_HIDE_TEXT_TRACKS_REQUEST:"mediahidetexttracksrequest",MEDIA_SHOW_SUBTITLES_REQUEST:"mediashowsubtitlesrequest",MEDIA_DISABLE_SUBTITLES_REQUEST:"mediadisablesubtitlesrequest",MEDIA_TOGGLE_SUBTITLES_REQUEST:"mediatogglesubtitlesrequest",MEDIA_PLAYBACK_RATE_REQUEST:"mediaplaybackraterequest",MEDIA_RENDITION_REQUEST:"mediarenditionrequest",MEDIA_AUDIO_TRACK_REQUEST:"mediaaudiotrackrequest",MEDIA_SEEK_TO_LIVE_REQUEST:"mediaseektoliverequest",REGISTER_MEDIA_STATE_RECEIVER:"registermediastatereceiver",UNREGISTER_MEDIA_STATE_RECEIVER:"unregistermediastatereceiver"},j={MEDIA_CHROME_ATTRIBUTES:"mediachromeattributes",MEDIA_CONTROLLER:"mediacontroller"},Z={MEDIA_AIRPLAY_UNAVAILABLE:"mediaAirplayUnavailable",MEDIA_AUDIO_TRACK_ENABLED:"mediaAudioTrackEnabled",MEDIA_AUDIO_TRACK_LIST:"mediaAudioTrackList",MEDIA_AUDIO_TRACK_UNAVAILABLE:"mediaAudioTrackUnavailable",MEDIA_BUFFERED:"mediaBuffered",MEDIA_CAST_UNAVAILABLE:"mediaCastUnavailable",MEDIA_CHAPTERS_CUES:"mediaChaptersCues",MEDIA_CURRENT_TIME:"mediaCurrentTime",MEDIA_DURATION:"mediaDuration",MEDIA_ENDED:"mediaEnded",MEDIA_ERROR:"mediaError",MEDIA_ERROR_CODE:"mediaErrorCode",MEDIA_ERROR_MESSAGE:"mediaErrorMessage",MEDIA_FULLSCREEN_UNAVAILABLE:"mediaFullscreenUnavailable",MEDIA_HAS_PLAYED:"mediaHasPlayed",MEDIA_HEIGHT:"mediaHeight",MEDIA_IS_AIRPLAYING:"mediaIsAirplaying",MEDIA_IS_CASTING:"mediaIsCasting",MEDIA_IS_FULLSCREEN:"mediaIsFullscreen",MEDIA_IS_PIP:"mediaIsPip",MEDIA_LOADING:"mediaLoading",MEDIA_MUTED:"mediaMuted",MEDIA_LOOP:"mediaLoop",MEDIA_PAUSED:"mediaPaused",MEDIA_PIP_UNAVAILABLE:"mediaPipUnavailable",MEDIA_PLAYBACK_RATE:"mediaPlaybackRate",MEDIA_PREVIEW_CHAPTER:"mediaPreviewChapter",MEDIA_PREVIEW_COORDS:"mediaPreviewCoords",MEDIA_PREVIEW_IMAGE:"mediaPreviewImage",MEDIA_PREVIEW_TIME:"mediaPreviewTime",MEDIA_RENDITION_LIST:"mediaRenditionList",MEDIA_RENDITION_SELECTED:"mediaRenditionSelected",MEDIA_RENDITION_UNAVAILABLE:"mediaRenditionUnavailable",MEDIA_SEEKABLE:"mediaSeekable",MEDIA_STREAM_TYPE:"mediaStreamType",MEDIA_SUBTITLES_LIST:"mediaSubtitlesList",MEDIA_SUBTITLES_SHOWING:"mediaSubtitlesShowing",MEDIA_TARGET_LIVE_WINDOW:"mediaTargetLiveWindow",MEDIA_TIME_IS_LIVE:"mediaTimeIsLive",MEDIA_VOLUME:"mediaVolume",MEDIA_VOLUME_LEVEL:"mediaVolumeLevel",MEDIA_VOLUME_UNAVAILABLE:"mediaVolumeUnavailable",MEDIA_LANG:"mediaLang",MEDIA_WIDTH:"mediaWidth"},Q=Object.entries(Z),z=Q.reduce((e,[t,i])=>(e[t]=i.toLowerCase(),e),{}),X=Q.reduce((e,[t,i])=>(e[t]=i.toLowerCase(),e),{USER_INACTIVE_CHANGE:"userinactivechange",BREAKPOINTS_CHANGE:"breakpointchange",BREAKPOINTS_COMPUTED:"breakpointscomputed"});Object.entries(X).reduce((e,[t,i])=>{let a=z[t];return a&&(e[i]=a),e},{userinactivechange:"userinactive"});let J=Object.entries(z).reduce((e,[t,i])=>{let a=X[t];return a&&(e[i]=a),e},{userinactive:"userinactivechange"}),ee={SUBTITLES:"subtitles",CAPTIONS:"captions",CHAPTERS:"chapters",METADATA:"metadata"},et={DISABLED:"disabled",SHOWING:"showing"},ei={MOUSE:"mouse",PEN:"pen",TOUCH:"touch"},ea={UNAVAILABLE:"unavailable",UNSUPPORTED:"unsupported"},er={LIVE:"live",ON_DEMAND:"on-demand",UNKNOWN:"unknown"},en={FULLSCREEN:"fullscreen"};function es(e){if(e){let{id:t,width:i,height:a}=e;return[t,i,a].filter(e=>null!=e).join(":")}}function eo(e){if(e){let[t,i,a]=e.split(":");return{id:t,width:+i,height:+a}}}function el(e){if(e){let{id:t,kind:i,language:a,label:r}=e;return[t,i,a,r].filter(e=>null!=e).join(":")}}function ed(e){if(e){let[t,i,a,r]=e.split(":");return{id:t,kind:i,language:a,label:r}}}function eu(e){return"number"==typeof e&&!Number.isNaN(e)&&Number.isFinite(e)}function eh(e){return"string"==typeof e&&!isNaN(e)&&!isNaN(parseFloat(e))}let em=e=>new Promise(t=>setTimeout(t,e)),ec=[{singular:"hour",plural:"hours"},{singular:"minute",plural:"minutes"},{singular:"second",plural:"seconds"}],ep=e=>{if(!eu(e))return"";let t=Math.abs(e),i=t!==e,a=new Date(0,0,0,0,0,t,0),r=[a.getHours(),a.getMinutes(),a.getSeconds()].map((e,t)=>e&&((e,t)=>{let i=1===e?ec[t].singular:ec[t].plural;return`${e} ${i}`})(e,t)).filter(e=>e).join(", ");return`${r}${i?" remaining":""}`};function eE(e,t){let i=!1;e<0&&(i=!0,e=0-e);let a=Math.floor((e=e<0?0:e)%60),r=Math.floor(e/60%60),n=Math.floor(e/3600),s=Math.floor(t/60%60),o=Math.floor(t/3600);return(isNaN(e)||e===1/0)&&(n=r=a="0"),r=(((n=n>0||o>0?n+":":"")||s>=10)&&r<10?"0"+r:r)+":",(i?"-":"")+n+r+(a=a<10?"0"+a:a)}Object.freeze({length:0,start(e){let t=e>>>0;if(t>=this.length)throw new DOMException(`Failed to execute 'start' on 'TimeRanges': The index provided (${t}) is greater than or equal to the maximum bound (${this.length}).`);return 0},end(e){let t=e>>>0;if(t>=this.length)throw new DOMException(`Failed to execute 'end' on 'TimeRanges': The index provided (${t}) is greater than or equal to the maximum bound (${this.length}).`);return 0}});let ev={en:{"Start airplay":"Start airplay","Stop airplay":"Stop airplay",Audio:"Audio",Captions:"Captions","Enable captions":"Enable captions","Disable captions":"Disable captions","Start casting":"Start casting","Stop casting":"Stop casting","Enter fullscreen mode":"Enter fullscreen mode","Exit fullscreen mode":"Exit fullscreen mode",Mute:"Mute",Unmute:"Unmute",Loop:"Loop","Enter picture in picture mode":"Enter picture in picture mode","Exit picture in picture mode":"Exit picture in picture mode",Play:"Play",Pause:"Pause","Playback rate":"Playback rate","Playback rate {playbackRate}":"Playback rate {playbackRate}",Quality:"Quality","Seek backward":"Seek backward","Seek forward":"Seek forward",Settings:"Settings",Auto:"Auto","audio player":"audio player","video player":"video player",volume:"volume",seek:"seek","closed captions":"closed captions","current playback rate":"current playback rate","playback time":"playback time","media loading":"media loading",settings:"settings","audio tracks":"audio tracks",quality:"quality",play:"play",pause:"pause",mute:"mute",unmute:"unmute","chapter: {chapterName}":"chapter: {chapterName}",live:"live",Off:"Off","start airplay":"start airplay","stop airplay":"stop airplay","start casting":"start casting","stop casting":"stop casting","enter fullscreen mode":"enter fullscreen mode","exit fullscreen mode":"exit fullscreen mode","enter picture in picture mode":"enter picture in picture mode","exit picture in picture mode":"exit picture in picture mode","seek to live":"seek to live","playing live":"playing live","seek back {seekOffset} seconds":"seek back {seekOffset} seconds","seek forward {seekOffset} seconds":"seek forward {seekOffset} seconds","Network Error":"Network Error","Decode Error":"Decode Error","Source Not Supported":"Source Not Supported","Encryption Error":"Encryption Error","A network error caused the media download to fail.":"A network error caused the media download to fail.","A media error caused playback to be aborted. The media could be corrupt or your browser does not support this format.":"A media error caused playback to be aborted. The media could be corrupt or your browser does not support this format.","An unsupported error occurred. The server or network failed, or your browser does not support this format.":"An unsupported error occurred. The server or network failed, or your browser does not support this format.","The media is encrypted and there are no keys to decrypt it.":"The media is encrypted and there are no keys to decrypt it."}},eb=(null==(nK=globalThis.navigator)?void 0:nK.language)||"en",eg=(e,t={})=>(e=>{var t,i,a;let[r]=eb.split("-");return(null==(t=ev[eb])?void 0:t[e])||(null==(i=ev[r])?void 0:i[e])||(null==(a=ev.en)?void 0:a[e])||e})(e).replace(/\{(\w+)\}/g,(e,i)=>i in t?String(t[i]):`{${i}}`);class ef{addEventListener(){}removeEventListener(){}dispatchEvent(){return!0}}class eA extends ef{}class eT extends eA{constructor(){super(...arguments),this.role=null}}class ey{observe(){}unobserve(){}disconnect(){}}let e_={createElement:function(){return new ek.HTMLElement},createElementNS:function(){return new ek.HTMLElement},addEventListener(){},removeEventListener(){},dispatchEvent:e=>!1},ek={ResizeObserver:ey,document:e_,Node:eA,Element:eT,HTMLElement:class extends eT{constructor(){super(...arguments),this.innerHTML=""}get content(){return new ek.DocumentFragment}},DocumentFragment:class extends ef{},customElements:{get:function(){},define:function(){},whenDefined:function(){}},localStorage:{getItem:e=>null,setItem(e,t){},removeItem(e){}},CustomEvent:function(){},getComputedStyle:function(){},navigator:{languages:[],get userAgent(){return""}},matchMedia:e=>({matches:!1,media:e}),DOMParser:class{parseFromString(e,t){return{body:{textContent:e}}}}},eI="global"in globalThis&&(null==globalThis?void 0:globalThis.global)===globalThis||"undefined"==typeof window||void 0===window.customElements,eS=Object.keys(ek).every(e=>e in globalThis),eR=eI&&!eS?ek:globalThis,ew=eI&&!eS?e_:globalThis.document,eC=new WeakMap,eL=e=>{let t=eC.get(e);return t||eC.set(e,t=new Set),t},eM=new eR.ResizeObserver(e=>{for(let t of e)for(let e of eL(t.target))e(t)});function eD(e,t){eL(e).add(t),eM.observe(e)}function eO(e,t){let i=eL(e);i.delete(t),i.size||eM.unobserve(e)}function eN(e){let t={};for(let i of e)t[i.name]=i.value;return t}function ex(e){var t;return null!=(t=eP(e))?t:eH(e,"media-controller")}function eP(e){var t;let{MEDIA_CONTROLLER:i}=j,a=e.getAttribute(i);if(a)return null==(t=e$(e))?void 0:t.getElementById(a)}let eU=(e,t,i=".value")=>{let a=e.querySelector(i);a&&(a.textContent=t)},eW=(e,t)=>((e,t)=>{let i=`slot[name="${t}"]`,a=e.shadowRoot.querySelector(i);return a?a.children:[]})(e,t)[0],eB=(e,t)=>!!e&&!!t&&(null!=e&&!!e.contains(t)||eB(e,t.getRootNode().host)),eH=(e,t)=>{if(!e)return null;let i=e.closest(t);return i||eH(e.getRootNode().host,t)};function eV(e=document){var t;let i=null==e?void 0:e.activeElement;return i?null!=(t=eV(i.shadowRoot))?t:i:null}function e$(e){var t;let i=null==(t=null==e?void 0:e.getRootNode)?void 0:t.call(e);return i instanceof ShadowRoot||i instanceof Document?i:null}function eK(e,{depth:t=3,checkOpacity:i=!0,checkVisibilityCSS:a=!0}={}){if(e.checkVisibility)return e.checkVisibility({checkOpacity:i,checkVisibilityCSS:a});let r=e;for(;r&&t>0;){let e=getComputedStyle(r);if(i&&"0"===e.opacity||a&&"hidden"===e.visibility||"none"===e.display)return!1;r=r.parentElement,t--}return!0}function eF(e,t){let i=function(e,t){var i,a;let r;for(r of null!=(i=e.querySelectorAll("style:not([media])"))?i:[]){let e;try{e=null==(a=r.sheet)?void 0:a.cssRules}catch{continue}for(let i of null!=e?e:[])if(t(i.selectorText))return i}}(e,e=>e===t);return i||eY(e,t)}function eY(e,t){var i,a;let r=null!=(i=e.querySelectorAll("style:not([media])"))?i:[],n=null==r?void 0:r[r.length-1];return(null==n?void 0:n.sheet)?(null==n||n.sheet.insertRule(`${t}{}`,n.sheet.cssRules.length),null==(a=n.sheet.cssRules)?void 0:a[n.sheet.cssRules.length-1]):(console.warn("Media Chrome: No style sheet found on style tag of",e),{style:{setProperty:()=>{},removeProperty:()=>"",getPropertyValue:()=>""}})}function eG(e,t,i=NaN){let a=e.getAttribute(t);return null!=a?+a:i}function eq(e,t,i){let a=+i;if(null==i||Number.isNaN(a)){e.hasAttribute(t)&&e.removeAttribute(t);return}eG(e,t,void 0)!==a&&e.setAttribute(t,`${a}`)}function ej(e,t){return e.hasAttribute(t)}function eZ(e,t,i){if(null==i){e.hasAttribute(t)&&e.removeAttribute(t);return}ej(e,t)!=i&&e.toggleAttribute(t,i)}function eQ(e,t,i=null){var a;return null!=(a=e.getAttribute(t))?a:i}function ez(e,t,i){if(null==i){e.hasAttribute(t)&&e.removeAttribute(t);return}let a=`${i}`;eQ(e,t,void 0)!==a&&e.setAttribute(t,a)}var eX=(e,t,i)=>{if(!t.has(e))throw TypeError("Cannot "+i)},eJ=(e,t,i)=>(eX(e,t,"read from private field"),i?i.call(e):t.get(e)),e0=(e,t,i,a)=>(eX(e,t,"write to private field"),a?a.call(e,i):t.set(e,i),i);class e1 extends eR.HTMLElement{constructor(){if(super(),((e,t,i)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,i)})(this,nF,void 0),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);let e=eN(this.attributes);this.shadowRoot.innerHTML=this.constructor.getTemplateHTML(e)}}static get observedAttributes(){return[j.MEDIA_CONTROLLER,z.MEDIA_PAUSED]}attributeChangedCallback(e,t,i){var a,r,n,s,o;e===j.MEDIA_CONTROLLER&&(t&&(null==(r=null==(a=eJ(this,nF))?void 0:a.unassociateElement)||r.call(a,this),e0(this,nF,null)),i&&this.isConnected&&(e0(this,nF,null==(n=this.getRootNode())?void 0:n.getElementById(i)),null==(o=null==(s=eJ(this,nF))?void 0:s.associateElement)||o.call(s,this)))}connectedCallback(){var e,t,i,a;this.tabIndex=-1,this.setAttribute("aria-hidden","true"),e0(this,nF,function(e){var t;let i=e.getAttribute(j.MEDIA_CONTROLLER);return i?null==(t=e.getRootNode())?void 0:t.getElementById(i):eH(e,"media-controller")}(this)),this.getAttribute(j.MEDIA_CONTROLLER)&&(null==(t=null==(e=eJ(this,nF))?void 0:e.associateElement)||t.call(e,this)),null==(i=eJ(this,nF))||i.addEventListener("pointerdown",this),null==(a=eJ(this,nF))||a.addEventListener("click",this)}disconnectedCallback(){var e,t,i,a;this.getAttribute(j.MEDIA_CONTROLLER)&&(null==(t=null==(e=eJ(this,nF))?void 0:e.unassociateElement)||t.call(e,this)),null==(i=eJ(this,nF))||i.removeEventListener("pointerdown",this),null==(a=eJ(this,nF))||a.removeEventListener("click",this),e0(this,nF,null)}handleEvent(e){var t;let i=null==(t=e.composedPath())?void 0:t[0];if(["video","media-controller"].includes(null==i?void 0:i.localName)){if("pointerdown"===e.type)this._pointerType=e.pointerType;else if("click"===e.type){let{clientX:t,clientY:i}=e,{left:a,top:r,width:n,height:s}=this.getBoundingClientRect(),o=t-a,l=i-r;if(o<0||l<0||o>n||l>s||0===n&&0===s)return;let d=this._pointerType||"mouse";if(this._pointerType=void 0,d===ei.TOUCH)return void this.handleTap(e);if(d===ei.MOUSE||d===ei.PEN)return void this.handleMouseClick(e)}}}get mediaPaused(){return ej(this,z.MEDIA_PAUSED)}set mediaPaused(e){eZ(this,z.MEDIA_PAUSED,e)}handleTap(e){}handleMouseClick(e){let t=this.mediaPaused?q.MEDIA_PLAY_REQUEST:q.MEDIA_PAUSE_REQUEST;this.dispatchEvent(new eR.CustomEvent(t,{composed:!0,bubbles:!0}))}}nF=new WeakMap,e1.shadowRootOptions={mode:"open"},e1.getTemplateHTML=function(e){return`
    <style>
      :host {
        display: var(--media-control-display, var(--media-gesture-receiver-display, inline-block));
        box-sizing: border-box;
      }
    </style>
  `},eR.customElements.get("media-gesture-receiver")||eR.customElements.define("media-gesture-receiver",e1);var e2=(e,t,i)=>{if(!t.has(e))throw TypeError("Cannot "+i)},e3=(e,t,i)=>(e2(e,t,"read from private field"),i?i.call(e):t.get(e)),e4=(e,t,i)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,i)},e5=(e,t,i,a)=>(e2(e,t,"write to private field"),a?a.call(e,i):t.set(e,i),i),e9=(e,t,i)=>(e2(e,t,"access private method"),i);let e8={AUDIO:"audio",AUTOHIDE:"autohide",BREAKPOINTS:"breakpoints",GESTURES_DISABLED:"gesturesdisabled",KEYBOARD_CONTROL:"keyboardcontrol",NO_AUTOHIDE:"noautohide",USER_INACTIVE:"userinactive",AUTOHIDE_OVER_CONTROLS:"autohideovercontrols"},e6=Object.values(z);function e7(e,t){var i,a,r;if(!e.isConnected)return;let n=Object.fromEntries((null!=(i=e.getAttribute(e8.BREAKPOINTS))?i:"sm:384 md:576 lg:768 xl:960").split(/\s+/).map(e=>e.split(":"))),s=(a=n,r=t,Object.keys(a).filter(e=>r>=parseInt(a[e]))),o=!1;if(Object.keys(n).forEach(t=>{if(s.includes(t)){e.hasAttribute(`breakpoint${t}`)||(e.setAttribute(`breakpoint${t}`,""),o=!0);return}e.hasAttribute(`breakpoint${t}`)&&(e.removeAttribute(`breakpoint${t}`),o=!0)}),o){let t=new CustomEvent(X.BREAKPOINTS_CHANGE,{detail:s});e.dispatchEvent(t)}e.breakpointsComputed||(e.breakpointsComputed=!0,e.dispatchEvent(new CustomEvent(X.BREAKPOINTS_COMPUTED,{bubbles:!0,composed:!0})))}class te extends eR.HTMLElement{constructor(){if(super(),e4(this,nQ),e4(this,n0),e4(this,n2),e4(this,n4),e4(this,n9),e4(this,n6),e4(this,nY,0),e4(this,nG,null),e4(this,nq,null),e4(this,nj,void 0),this.breakpointsComputed=!1,e4(this,nZ,new MutationObserver(e9(this,nQ,nz).bind(this))),e4(this,nX,!1),e4(this,nJ,e=>{e3(this,nX)||(setTimeout(()=>{!function(e){e7(e.target,e.contentRect.width)}(e),e5(this,nX,!1)},0),e5(this,nX,!0))}),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);let e=eN(this.attributes),t=this.constructor.getTemplateHTML(e);this.shadowRoot.setHTMLUnsafe?this.shadowRoot.setHTMLUnsafe(t):this.shadowRoot.innerHTML=t}let e=this.querySelector(":scope > slot[slot=media]");e&&e.addEventListener("slotchange",()=>{if(!e.assignedElements({flatten:!0}).length){e3(this,nG)&&this.mediaUnsetCallback(e3(this,nG));return}this.handleMediaUpdated(this.media)})}static get observedAttributes(){return[e8.AUTOHIDE,e8.GESTURES_DISABLED].concat(e6).filter(e=>![z.MEDIA_RENDITION_LIST,z.MEDIA_AUDIO_TRACK_LIST,z.MEDIA_CHAPTERS_CUES,z.MEDIA_WIDTH,z.MEDIA_HEIGHT,z.MEDIA_ERROR,z.MEDIA_ERROR_MESSAGE].includes(e))}attributeChangedCallback(e,t,i){e.toLowerCase()==e8.AUTOHIDE&&(this.autohide=i)}get media(){let e=this.querySelector(":scope > [slot=media]");return(null==e?void 0:e.nodeName)=="SLOT"&&(e=e.assignedElements({flatten:!0})[0]),e}async handleMediaUpdated(e){e&&(e5(this,nG,e),e.localName.includes("-")&&await eR.customElements.whenDefined(e.localName),this.mediaSetCallback(e))}connectedCallback(){var e;e3(this,nZ).observe(this,{childList:!0,subtree:!0}),eD(this,e3(this,nJ));let t=null!=this.getAttribute(e8.AUDIO)?eg("audio player"):eg("video player");this.setAttribute("role","region"),this.setAttribute("aria-label",t),this.handleMediaUpdated(this.media),this.setAttribute(e8.USER_INACTIVE,""),e7(this,this.getBoundingClientRect().width),this.addEventListener("pointerdown",this),this.addEventListener("pointermove",this),this.addEventListener("pointerup",this),this.addEventListener("mouseleave",this),this.addEventListener("keyup",this),null==(e=eR.window)||e.addEventListener("mouseup",this)}disconnectedCallback(){var e;e3(this,nZ).disconnect(),eO(this,e3(this,nJ)),this.media&&this.mediaUnsetCallback(this.media),null==(e=eR.window)||e.removeEventListener("mouseup",this)}mediaSetCallback(e){}mediaUnsetCallback(e){e5(this,nG,null)}handleEvent(e){switch(e.type){case"pointerdown":e5(this,nY,e.timeStamp);break;case"pointermove":e9(this,n0,n1).call(this,e);break;case"pointerup":e9(this,n2,n3).call(this,e);break;case"mouseleave":e9(this,n4,n5).call(this);break;case"mouseup":this.removeAttribute(e8.KEYBOARD_CONTROL);break;case"keyup":e9(this,n6,n7).call(this),this.setAttribute(e8.KEYBOARD_CONTROL,"")}}set autohide(e){let t=Number(e);e5(this,nj,isNaN(t)?0:t)}get autohide(){return(void 0===e3(this,nj)?2:e3(this,nj)).toString()}get breakpoints(){return eQ(this,e8.BREAKPOINTS)}set breakpoints(e){ez(this,e8.BREAKPOINTS,e)}get audio(){return ej(this,e8.AUDIO)}set audio(e){eZ(this,e8.AUDIO,e)}get gesturesDisabled(){return ej(this,e8.GESTURES_DISABLED)}set gesturesDisabled(e){eZ(this,e8.GESTURES_DISABLED,e)}get keyboardControl(){return ej(this,e8.KEYBOARD_CONTROL)}set keyboardControl(e){eZ(this,e8.KEYBOARD_CONTROL,e)}get noAutohide(){return ej(this,e8.NO_AUTOHIDE)}set noAutohide(e){eZ(this,e8.NO_AUTOHIDE,e)}get autohideOverControls(){return ej(this,e8.AUTOHIDE_OVER_CONTROLS)}set autohideOverControls(e){eZ(this,e8.AUTOHIDE_OVER_CONTROLS,e)}get userInteractive(){return ej(this,e8.USER_INACTIVE)}set userInteractive(e){eZ(this,e8.USER_INACTIVE,e)}}nY=new WeakMap,nG=new WeakMap,nq=new WeakMap,nj=new WeakMap,nZ=new WeakMap,nQ=new WeakSet,nz=function(e){let t=this.media;for(let i of e)if("childList"===i.type){for(let e of i.removedNodes){if("media"!=e.slot||i.target!=this)continue;let a=i.previousSibling&&i.previousSibling.previousElementSibling;if(a&&t){let t="media"!==a.slot;for(;null!==(a=a.previousSibling);)"media"==a.slot&&(t=!1);t&&this.mediaUnsetCallback(e)}else this.mediaUnsetCallback(e)}if(t)for(let e of i.addedNodes)e===t&&this.handleMediaUpdated(t)}},nX=new WeakMap,nJ=new WeakMap,n0=new WeakSet,n1=function(e){if("mouse"!==e.pointerType&&e.timeStamp-e3(this,nY)<250)return;e9(this,n9,n8).call(this),clearTimeout(e3(this,nq));let t=this.hasAttribute(e8.AUTOHIDE_OVER_CONTROLS);([this,this.media].includes(e.target)||t)&&e9(this,n6,n7).call(this)},n2=new WeakSet,n3=function(e){if("touch"===e.pointerType){let t=!this.hasAttribute(e8.USER_INACTIVE);[this,this.media].includes(e.target)&&t?e9(this,n4,n5).call(this):e9(this,n6,n7).call(this)}else e.composedPath().some(e=>["media-play-button","media-fullscreen-button"].includes(null==e?void 0:e.localName))&&e9(this,n6,n7).call(this)},n4=new WeakSet,n5=function(){if(0>e3(this,nj)||this.hasAttribute(e8.USER_INACTIVE))return;this.setAttribute(e8.USER_INACTIVE,"");let e=new eR.CustomEvent(X.USER_INACTIVE_CHANGE,{composed:!0,bubbles:!0,detail:!0});this.dispatchEvent(e)},n9=new WeakSet,n8=function(){if(!this.hasAttribute(e8.USER_INACTIVE))return;this.removeAttribute(e8.USER_INACTIVE);let e=new eR.CustomEvent(X.USER_INACTIVE_CHANGE,{composed:!0,bubbles:!0,detail:!1});this.dispatchEvent(e)},n6=new WeakSet,n7=function(){e9(this,n9,n8).call(this),clearTimeout(e3(this,nq));let e=parseInt(this.autohide);e<0||e5(this,nq,setTimeout(()=>{e9(this,n4,n5).call(this)},1e3*e))},te.shadowRootOptions={mode:"open"},te.getTemplateHTML=function(e){return`
    <style>
      
      :host([${z.MEDIA_IS_FULLSCREEN}]) ::slotted([slot=media]) {
        outline: none;
      }

      :host {
        box-sizing: border-box;
        position: relative;
        display: inline-block;
        line-height: 0;
        background-color: var(--media-background-color, #000);
        overflow: hidden;
      }

      :host(:not([${e8.AUDIO}])) [part~=layer]:not([part~=media-layer]) {
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        display: flex;
        flex-flow: column nowrap;
        align-items: start;
        pointer-events: none;
        background: none;
      }

      slot[name=media] {
        display: var(--media-slot-display, contents);
      }

      
      :host([${e8.AUDIO}]) slot[name=media] {
        display: var(--media-slot-display, none);
      }

      
      :host([${e8.AUDIO}]) [part~=layer][part~=gesture-layer] {
        height: 0;
        display: block;
      }

      
      :host(:not([${e8.AUDIO}])[${e8.GESTURES_DISABLED}]) ::slotted([slot=gestures-chrome]),
          :host(:not([${e8.AUDIO}])[${e8.GESTURES_DISABLED}]) media-gesture-receiver[slot=gestures-chrome] {
        display: none;
      }

      
      ::slotted(:not([slot=media]):not([slot=poster]):not(media-loading-indicator):not([role=dialog]):not([hidden])) {
        pointer-events: auto;
      }

      :host(:not([${e8.AUDIO}])) *[part~=layer][part~=centered-layer] {
        align-items: center;
        justify-content: center;
      }

      :host(:not([${e8.AUDIO}])) ::slotted(media-gesture-receiver[slot=gestures-chrome]),
      :host(:not([${e8.AUDIO}])) media-gesture-receiver[slot=gestures-chrome] {
        align-self: stretch;
        flex-grow: 1;
      }

      slot[name=middle-chrome] {
        display: inline;
        flex-grow: 1;
        pointer-events: none;
        background: none;
      }

      
      ::slotted([slot=media]),
      ::slotted([slot=poster]) {
        width: 100%;
        height: 100%;
      }

      
      :host(:not([${e8.AUDIO}])) .spacer {
        flex-grow: 1;
      }

      
      :host(:-webkit-full-screen) {
        
        width: 100% !important;
        height: 100% !important;
      }

      
      ::slotted(:not([slot=media]):not([slot=poster]):not([${e8.NO_AUTOHIDE}]):not([hidden]):not([role=dialog])) {
        opacity: 1;
        transition: var(--media-control-transition-in, opacity 0.25s);
      }

      
      :host([${e8.USER_INACTIVE}]:not([${z.MEDIA_PAUSED}]):not([${z.MEDIA_IS_AIRPLAYING}]):not([${z.MEDIA_IS_CASTING}]):not([${e8.AUDIO}])) ::slotted(:not([slot=media]):not([slot=poster]):not([${e8.NO_AUTOHIDE}]):not([role=dialog])) {
        opacity: 0;
        transition: var(--media-control-transition-out, opacity 1s);
      }

      :host([${e8.USER_INACTIVE}]:not([${e8.NO_AUTOHIDE}]):not([${z.MEDIA_PAUSED}]):not([${z.MEDIA_IS_CASTING}]):not([${e8.AUDIO}])) ::slotted([slot=media]) {
        cursor: none;
      }

      :host([${e8.USER_INACTIVE}][${e8.AUTOHIDE_OVER_CONTROLS}]:not([${e8.NO_AUTOHIDE}]):not([${z.MEDIA_PAUSED}]):not([${z.MEDIA_IS_CASTING}]):not([${e8.AUDIO}])) * {
        --media-cursor: none;
        cursor: none;
      }


      ::slotted(media-control-bar)  {
        align-self: stretch;
      }

      
      :host(:not([${e8.AUDIO}])[${z.MEDIA_HAS_PLAYED}]) slot[name=poster] {
        display: none;
      }

      ::slotted([role=dialog]) {
        width: 100%;
        height: 100%;
        align-self: center;
      }

      ::slotted([role=menu]) {
        align-self: end;
      }
    </style>

    <slot name="media" part="layer media-layer"></slot>
    <slot name="poster" part="layer poster-layer"></slot>
    <slot name="gestures-chrome" part="layer gesture-layer">
      <media-gesture-receiver slot="gestures-chrome">
        <template shadowrootmode="${e1.shadowRootOptions.mode}">
          ${e1.getTemplateHTML({})}
        </template>
      </media-gesture-receiver>
    </slot>
    <span part="layer vertical-layer">
      <slot name="top-chrome" part="top chrome"></slot>
      <slot name="middle-chrome" part="middle chrome"></slot>
      <slot name="centered-chrome" part="layer centered-layer center centered chrome"></slot>
      
      <slot part="bottom chrome"></slot>
    </span>
    <slot name="dialog" part="layer dialog-layer"></slot>
  `},eR.customElements.get("media-container")||eR.customElements.define("media-container",te);var tt=(e,t,i)=>{if(!t.has(e))throw TypeError("Cannot "+i)},ti=(e,t,i)=>(tt(e,t,"read from private field"),i?i.call(e):t.get(e)),ta=(e,t,i)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,i)},tr=(e,t,i,a)=>(tt(e,t,"write to private field"),a?a.call(e,i):t.set(e,i),i);class tn{constructor(e,t,{defaultValue:i}={defaultValue:void 0}){ta(this,sr),ta(this,se,void 0),ta(this,st,void 0),ta(this,si,void 0),ta(this,sa,new Set),tr(this,se,e),tr(this,st,t),tr(this,si,new Set(i))}[Symbol.iterator](){return ti(this,sr,sn).values()}get length(){return ti(this,sr,sn).size}get value(){var e;return null!=(e=[...ti(this,sr,sn)].join(" "))?e:""}set value(e){var t;e!==this.value&&(tr(this,sa,new Set),this.add(...null!=(t=null==e?void 0:e.split(" "))?t:[]))}toString(){return this.value}item(e){return[...ti(this,sr,sn)][e]}values(){return ti(this,sr,sn).values()}forEach(e,t){ti(this,sr,sn).forEach(e,t)}add(...e){var t,i;e.forEach(e=>ti(this,sa).add(e)),(""!==this.value||(null==(t=ti(this,se))?void 0:t.hasAttribute(`${ti(this,st)}`)))&&(null==(i=ti(this,se))||i.setAttribute(`${ti(this,st)}`,`${this.value}`))}remove(...e){var t;e.forEach(e=>ti(this,sa).delete(e)),null==(t=ti(this,se))||t.setAttribute(`${ti(this,st)}`,`${this.value}`)}contains(e){return ti(this,sr,sn).has(e)}toggle(e,t){if(void 0!==t)if(t)return this.add(e),!0;else return this.remove(e),!1;return this.contains(e)?(this.remove(e),!1):(this.add(e),!0)}replace(e,t){return this.remove(e),this.add(t),e===t}}se=new WeakMap,st=new WeakMap,si=new WeakMap,sa=new WeakMap,sr=new WeakSet,sn=function(){return ti(this,sa).size?ti(this,sa):ti(this,si)};let ts=(e="")=>{let[t,i,a]=e.split(":"),r=a?decodeURIComponent(a):void 0;return{kind:"cc"===t?ee.CAPTIONS:ee.SUBTITLES,language:i,label:r}},to=(e="",t={})=>((e="")=>e.split(/\s+/))(e).map(e=>{let i=ts(e);return{...t,...i}}),tl=e=>e?Array.isArray(e)?e.map(e=>"string"==typeof e?ts(e):e):"string"==typeof e?to(e):[e]:[],td=({kind:e,label:t,language:i}={kind:"subtitles"})=>t?`${"captions"===e?"cc":"sb"}:${i}:${encodeURIComponent(t)}`:i,tu=(e=[])=>Array.prototype.map.call(e,td).join(" "),th=e=>{let t=Object.entries(e).map(([e,t])=>i=>i[e]===t);return e=>t.every(t=>t(e))},tm=(e,t=[],i=[])=>{let a=tl(i).map(th);Array.from(t).filter(e=>a.some(t=>t(e))).forEach(t=>{t.mode=e})},tc=(e,t=()=>!0)=>{if(!(null==e?void 0:e.textTracks))return[];let i="function"==typeof t?t:th(t);return Array.from(e.textTracks).filter(i)},tp=e=>{var t;return!!(null==(t=e.mediaSubtitlesShowing)?void 0:t.length)||e.hasAttribute(z.MEDIA_SUBTITLES_SHOWING)},tE="exitFullscreen"in ew?"exitFullscreen":"webkitExitFullscreen"in ew?"webkitExitFullscreen":"webkitCancelFullScreen"in ew?"webkitCancelFullScreen":void 0,tv="fullscreenElement"in ew?"fullscreenElement":"webkitFullscreenElement"in ew?"webkitFullscreenElement":void 0,tb="fullscreenEnabled"in ew?"fullscreenEnabled":"webkitFullscreenEnabled"in ew?"webkitFullscreenEnabled":void 0,tg=()=>{var e;return a||(a=null==(e=null==ew?void 0:ew.createElement)?void 0:e.call(ew,"video"))},tf=async(e=tg())=>{if(!e)return!1;let t=e.volume;e.volume=t/2+.1;let i=new AbortController,a=await Promise.race([tA(e,i.signal),tT(e,t)]);return i.abort(),a},tA=(e,t)=>new Promise(i=>{e.addEventListener("volumechange",()=>i(!0),{signal:t})}),tT=async(e,t)=>{for(let i=0;i<10;i++){if(e.volume===t)return!1;await em(10)}return e.volume!==t},ty=/.*Version\/.*Safari\/.*/.test(eR.navigator.userAgent),t_=(e=tg())=>(!eR.matchMedia("(display-mode: standalone)").matches||!ty)&&"function"==typeof(null==e?void 0:e.requestPictureInPicture),tk=(e=tg())=>(e=>{let{documentElement:t,media:i}=e;return!!(null==t?void 0:t[tb])||i&&"webkitSupportsFullscreen"in i})({documentElement:ew,media:e}),tI=tk(),tS=t_(),tR=!!eR.WebKitPlaybackTargetAvailabilityEvent,tw=!!eR.chrome,tC=e=>tc(e.media,e=>[ee.SUBTITLES,ee.CAPTIONS].includes(e.kind)).sort((e,t)=>e.kind>=t.kind?1:-1),tL=e=>tc(e.media,e=>e.mode===et.SHOWING&&[ee.SUBTITLES,ee.CAPTIONS].includes(e.kind)),tM=(e,t)=>{let i=tC(e),a=tL(e),r=!!a.length;if(i.length){if(!1===t||r&&!0!==t)tm(et.DISABLED,i,a);else if(!0===t||!r&&!1!==t){let t=i[0],{options:r}=e;if(!(null==r?void 0:r.noSubtitlesLangPref)){let e=globalThis.localStorage.getItem("media-chrome-pref-subtitles-lang"),a=e?[e,...globalThis.navigator.languages]:globalThis.navigator.languages,r=i.filter(e=>a.some(t=>e.language.toLowerCase().startsWith(t.split("-")[0]))).sort((e,t)=>a.findIndex(t=>e.language.toLowerCase().startsWith(t.split("-")[0]))-a.findIndex(e=>t.language.toLowerCase().startsWith(e.split("-")[0])));r[0]&&(t=r[0])}let{language:n,label:s,kind:o}=t;tm(et.DISABLED,i,a),tm(et.SHOWING,i,[{language:n,label:s,kind:o}])}}},tD=(e,t)=>e===t||null!=e&&null!=t&&typeof e==typeof t&&(!!("number"==typeof e&&Number.isNaN(e)&&Number.isNaN(t))||"object"==typeof e&&(Array.isArray(e)?tO(e,t):Object.entries(e).every(([e,i])=>e in t&&tD(i,t[e])))),tO=(e,t)=>{let i=Array.isArray(e),a=Array.isArray(t);return i===a&&(!i&&!a||e.length===t.length&&e.every((e,i)=>tD(e,t[i])))},tN=Object.values(er),tx=tf().then(e=>r=e),tP=async(...e)=>{await Promise.all(e.filter(e=>e).map(async e=>{if(!("localName"in e&&e instanceof eR.HTMLElement))return;let t=e.localName;if(!t.includes("-"))return;let i=eR.customElements.get(t);i&&e instanceof i||(await eR.customElements.whenDefined(t),eR.customElements.upgrade(e))}))},tU=new eR.DOMParser,tW={mediaError:{get(e,t){let{media:i}=e;if((null==t?void 0:t.type)!=="playing")return null==i?void 0:i.error},mediaEvents:["emptied","error","playing"]},mediaErrorCode:{get(e,t){var i;let{media:a}=e;if((null==t?void 0:t.type)!=="playing")return null==(i=null==a?void 0:a.error)?void 0:i.code},mediaEvents:["emptied","error","playing"]},mediaErrorMessage:{get(e,t){var i,a;let{media:r}=e;if((null==t?void 0:t.type)!=="playing")return null!=(a=null==(i=null==r?void 0:r.error)?void 0:i.message)?a:""},mediaEvents:["emptied","error","playing"]},mediaWidth:{get(e){var t;let{media:i}=e;return null!=(t=null==i?void 0:i.videoWidth)?t:0},mediaEvents:["resize"]},mediaHeight:{get(e){var t;let{media:i}=e;return null!=(t=null==i?void 0:i.videoHeight)?t:0},mediaEvents:["resize"]},mediaPaused:{get(e){var t;let{media:i}=e;return null==(t=null==i?void 0:i.paused)||t},set(e,t){var i;let{media:a}=t;a&&(e?a.pause():null==(i=a.play())||i.catch(()=>{}))},mediaEvents:["play","playing","pause","emptied"]},mediaHasPlayed:{get(e,t){let{media:i}=e;return!!i&&(t?"playing"===t.type:!i.paused)},mediaEvents:["playing","emptied"]},mediaEnded:{get(e){var t;let{media:i}=e;return null!=(t=null==i?void 0:i.ended)&&t},mediaEvents:["seeked","ended","emptied"]},mediaPlaybackRate:{get(e){var t;let{media:i}=e;return null!=(t=null==i?void 0:i.playbackRate)?t:1},set(e,t){let{media:i}=t;i&&Number.isFinite(+e)&&(i.playbackRate=+e)},mediaEvents:["ratechange","loadstart"]},mediaMuted:{get(e){var t;let{media:i}=e;return null!=(t=null==i?void 0:i.muted)&&t},set(e,t){let{media:i,options:{noMutedPref:a}={}}=t;if(i){i.muted=e;try{let t=null!==eR.localStorage.getItem("media-chrome-pref-muted"),r=i.hasAttribute("muted");if(a){t&&eR.localStorage.removeItem("media-chrome-pref-muted");return}if(r&&!t)return;eR.localStorage.setItem("media-chrome-pref-muted",e?"true":"false")}catch(e){console.debug("Error setting muted pref",e)}}},mediaEvents:["volumechange"],stateOwnersUpdateHandlers:[(e,t)=>{let{options:{noMutedPref:i}}=t,{media:a}=t;if(a&&!a.muted&&!i)try{let i="true"===eR.localStorage.getItem("media-chrome-pref-muted");tW.mediaMuted.set(i,t),e(i)}catch(e){console.debug("Error getting muted pref",e)}}]},mediaLoop:{get(e){let{media:t}=e;return null==t?void 0:t.loop},set(e,t){let{media:i}=t;i&&(i.loop=e)},mediaEvents:["medialooprequest"]},mediaVolume:{get(e){var t;let{media:i}=e;return null!=(t=null==i?void 0:i.volume)?t:1},set(e,t){let{media:i,options:{noVolumePref:a}={}}=t;if(i){try{null==e?eR.localStorage.removeItem("media-chrome-pref-volume"):i.hasAttribute("muted")||a||eR.localStorage.setItem("media-chrome-pref-volume",e.toString())}catch(e){console.debug("Error setting volume pref",e)}Number.isFinite(+e)&&(i.volume=+e)}},mediaEvents:["volumechange"],stateOwnersUpdateHandlers:[(e,t)=>{let{options:{noVolumePref:i}}=t;if(!i)try{let{media:i}=t;if(!i)return;let a=eR.localStorage.getItem("media-chrome-pref-volume");if(null==a)return;tW.mediaVolume.set(+a,t),e(+a)}catch(e){console.debug("Error getting volume pref",e)}}]},mediaVolumeLevel:{get(e){let{media:t}=e;return void 0===(null==t?void 0:t.volume)?"high":t.muted||0===t.volume?"off":t.volume<.5?"low":t.volume<.75?"medium":"high"},mediaEvents:["volumechange"]},mediaCurrentTime:{get(e){var t;let{media:i}=e;return null!=(t=null==i?void 0:i.currentTime)?t:0},set(e,t){let{media:i}=t;i&&eu(e)&&(i.currentTime=e)},mediaEvents:["timeupdate","loadedmetadata"]},mediaDuration:{get(e){let{media:t,options:{defaultDuration:i}={}}=e;return i&&(!t||!t.duration||Number.isNaN(t.duration)||!Number.isFinite(t.duration))?i:Number.isFinite(null==t?void 0:t.duration)?t.duration:NaN},mediaEvents:["durationchange","loadedmetadata","emptied"]},mediaLoading:{get(e){let{media:t}=e;return(null==t?void 0:t.readyState)<3},mediaEvents:["waiting","playing","emptied"]},mediaSeekable:{get(e){var t;let{media:i}=e;if(!(null==(t=null==i?void 0:i.seekable)?void 0:t.length))return;let a=i.seekable.start(0),r=i.seekable.end(i.seekable.length-1);if(a||r)return[Number(a.toFixed(3)),Number(r.toFixed(3))]},mediaEvents:["loadedmetadata","emptied","progress","seekablechange"]},mediaBuffered:{get(e){var t;let{media:i}=e,a=null!=(t=null==i?void 0:i.buffered)?t:[];return Array.from(a).map((e,t)=>[Number(a.start(t).toFixed(3)),Number(a.end(t).toFixed(3))])},mediaEvents:["progress","emptied"]},mediaStreamType:{get(e){let{media:t,options:{defaultStreamType:i}={}}=e,a=[er.LIVE,er.ON_DEMAND].includes(i)?i:void 0;if(!t)return a;let{streamType:r}=t;if(tN.includes(r))return r===er.UNKNOWN?a:r;let n=t.duration;return n===1/0?er.LIVE:Number.isFinite(n)?er.ON_DEMAND:a},mediaEvents:["emptied","durationchange","loadedmetadata","streamtypechange"]},mediaTargetLiveWindow:{get(e){let{media:t}=e;if(!t)return NaN;let{targetLiveWindow:i}=t,a=tW.mediaStreamType.get(e);return(null==i||Number.isNaN(i))&&a===er.LIVE?0:i},mediaEvents:["emptied","durationchange","loadedmetadata","streamtypechange","targetlivewindowchange"]},mediaTimeIsLive:{get(e){let{media:t,options:{liveEdgeOffset:i=10}={}}=e;if(!t)return!1;if("number"==typeof t.liveEdgeStart)return!Number.isNaN(t.liveEdgeStart)&&t.currentTime>=t.liveEdgeStart;if(tW.mediaStreamType.get(e)!==er.LIVE)return!1;let a=t.seekable;if(!a)return!0;if(!a.length)return!1;let r=a.end(a.length-1)-i;return t.currentTime>=r},mediaEvents:["playing","timeupdate","progress","waiting","emptied"]},mediaSubtitlesList:{get:e=>tC(e).map(({kind:e,label:t,language:i})=>({kind:e,label:t,language:i})),mediaEvents:["loadstart"],textTracksEvents:["addtrack","removetrack"]},mediaSubtitlesShowing:{get:e=>tL(e).map(({kind:e,label:t,language:i})=>({kind:e,label:t,language:i})),mediaEvents:["loadstart"],textTracksEvents:["addtrack","removetrack","change"],stateOwnersUpdateHandlers:[(e,t)=>{var i,a;let{media:r,options:n}=t;if(!r)return;let s=e=>{var i;n.defaultSubtitles&&(e&&![ee.CAPTIONS,ee.SUBTITLES].includes(null==(i=null==e?void 0:e.track)?void 0:i.kind)||tM(t,!0))};return r.addEventListener("loadstart",s),null==(i=r.textTracks)||i.addEventListener("addtrack",s),null==(a=r.textTracks)||a.addEventListener("removetrack",s),()=>{var e,t;r.removeEventListener("loadstart",s),null==(e=r.textTracks)||e.removeEventListener("addtrack",s),null==(t=r.textTracks)||t.removeEventListener("removetrack",s)}}]},mediaChaptersCues:{get(e){var t;let{media:i}=e;if(!i)return[];let[a]=tc(i,{kind:ee.CHAPTERS});return Array.from(null!=(t=null==a?void 0:a.cues)?t:[]).map(({text:e,startTime:t,endTime:i})=>({text:e&&tU.parseFromString(e,"text/html").body.textContent||e,startTime:t,endTime:i}))},mediaEvents:["loadstart","loadedmetadata"],textTracksEvents:["addtrack","removetrack","change"],stateOwnersUpdateHandlers:[(e,t)=>{var i;let{media:a}=t;if(!a)return;let r=a.querySelector('track[kind="chapters"][default][src]'),n=null==(i=a.shadowRoot)?void 0:i.querySelector(':is(video,audio) > track[kind="chapters"][default][src]');return null==r||r.addEventListener("load",e),null==n||n.addEventListener("load",e),()=>{null==r||r.removeEventListener("load",e),null==n||n.removeEventListener("load",e)}}]},mediaIsPip:{get(e){var t,i;let{media:a,documentElement:r}=e;if(!a||!r||!r.pictureInPictureElement)return!1;if(r.pictureInPictureElement===a)return!0;if(r.pictureInPictureElement instanceof HTMLMediaElement)return!!(null==(t=a.localName)?void 0:t.includes("-"))&&eB(a,r.pictureInPictureElement);if(r.pictureInPictureElement.localName.includes("-")){let e=r.pictureInPictureElement.shadowRoot;for(;null==e?void 0:e.pictureInPictureElement;){if(e.pictureInPictureElement===a)return!0;e=null==(i=e.pictureInPictureElement)?void 0:i.shadowRoot}}return!1},set(e,t){let{media:i}=t;if(i)if(e){if(!ew.pictureInPictureEnabled)return void console.warn("MediaChrome: Picture-in-picture is not enabled");if(!i.requestPictureInPicture)return void console.warn("MediaChrome: The current media does not support picture-in-picture");let e=()=>{console.warn("MediaChrome: The media is not ready for picture-in-picture. It must have a readyState > 0.")};i.requestPictureInPicture().catch(t=>{if(11===t.code){if(!i.src)return void console.warn("MediaChrome: The media is not ready for picture-in-picture. It must have a src set.");if(0===i.readyState&&"none"===i.preload){let t=()=>{i.removeEventListener("loadedmetadata",a),i.preload="none"},a=()=>{i.requestPictureInPicture().catch(e),t()};i.addEventListener("loadedmetadata",a),i.preload="metadata",setTimeout(()=>{0===i.readyState&&e(),t()},1e3)}else throw t}else throw t})}else ew.pictureInPictureElement&&ew.exitPictureInPicture()},mediaEvents:["enterpictureinpicture","leavepictureinpicture"]},mediaRenditionList:{get(e){var t;let{media:i}=e;return[...null!=(t=null==i?void 0:i.videoRenditions)?t:[]].map(e=>({...e}))},mediaEvents:["emptied","loadstart"],videoRenditionsEvents:["addrendition","removerendition"]},mediaRenditionSelected:{get(e){var t,i,a;let{media:r}=e;return null==(a=null==(i=null==r?void 0:r.videoRenditions)?void 0:i[null==(t=r.videoRenditions)?void 0:t.selectedIndex])?void 0:a.id},set(e,t){let{media:i}=t;if(!(null==i?void 0:i.videoRenditions))return void console.warn("MediaController: Rendition selection not supported by this media.");let a=Array.prototype.findIndex.call(i.videoRenditions,t=>t.id==e);i.videoRenditions.selectedIndex!=a&&(i.videoRenditions.selectedIndex=a)},mediaEvents:["emptied"],videoRenditionsEvents:["addrendition","removerendition","change"]},mediaAudioTrackList:{get(e){var t;let{media:i}=e;return[...null!=(t=null==i?void 0:i.audioTracks)?t:[]]},mediaEvents:["emptied","loadstart"],audioTracksEvents:["addtrack","removetrack"]},mediaAudioTrackEnabled:{get(e){var t,i;let{media:a}=e;return null==(i=[...null!=(t=null==a?void 0:a.audioTracks)?t:[]].find(e=>e.enabled))?void 0:i.id},set(e,t){let{media:i}=t;if(!(null==i?void 0:i.audioTracks))return void console.warn("MediaChrome: Audio track selection not supported by this media.");for(let t of i.audioTracks)t.enabled=e==t.id},mediaEvents:["emptied"],audioTracksEvents:["addtrack","removetrack","change"]},mediaIsFullscreen:{get:e=>(e=>{var t;let{media:i,documentElement:a,fullscreenElement:r=i}=e;if(!i||!a)return!1;let n=(e=>{let{documentElement:t,media:i}=e,a=null==t?void 0:t[tv];return!a&&"webkitDisplayingFullscreen"in i&&"webkitPresentationMode"in i&&i.webkitDisplayingFullscreen&&i.webkitPresentationMode===en.FULLSCREEN?i:a})(e);if(!n)return!1;if(n===r||n===i)return!0;if(n.localName.includes("-")){let e=n.shadowRoot;if(!(tv in e))return eB(n,r);for(;null==e?void 0:e[tv];){if(e[tv]===r)return!0;e=null==(t=e[tv])?void 0:t.shadowRoot}}return!1})(e),set(e,t,i){var a;e?((e=>{var t;let{media:i,fullscreenElement:a}=e;try{let e=a&&"requestFullscreen"in a?"requestFullscreen":a&&"webkitRequestFullScreen"in a?"webkitRequestFullScreen":void 0;if(e){let i=null==(t=a[e])?void 0:t.call(a);if(i instanceof Promise)return i.catch(()=>{})}else(null==i?void 0:i.webkitEnterFullscreen)?i.webkitEnterFullscreen():(null==i?void 0:i.requestFullscreen)&&i.requestFullscreen()}catch(e){console.error(e)}})(t),i.detail&&(null==(a=t.media)||a.focus())):(e=>{var t;let{documentElement:i}=e;if(tE){let e=null==(t=null==i?void 0:i[tE])?void 0:t.call(i);if(e instanceof Promise)return e.catch(()=>{})}})(t)},rootEvents:["fullscreenchange","webkitfullscreenchange"],mediaEvents:["webkitbeginfullscreen","webkitendfullscreen","webkitpresentationmodechanged"]},mediaIsCasting:{get(e){var t;let{media:i}=e;return!!(null==i?void 0:i.remote)&&(null==(t=i.remote)?void 0:t.state)!=="disconnected"&&!!i.remote.state},set(e,t){var i,a;let{media:r}=t;if(r&&(!e||(null==(i=r.remote)?void 0:i.state)==="disconnected")&&(e||(null==(a=r.remote)?void 0:a.state)==="connected")){if("function"!=typeof r.remote.prompt)return void console.warn("MediaChrome: Casting is not supported in this environment");r.remote.prompt().catch(()=>{})}},remoteEvents:["connect","connecting","disconnect"]},mediaIsAirplaying:{get:()=>!1,set(e,t){let{media:i}=t;if(i){if(!(i.webkitShowPlaybackTargetPicker&&eR.WebKitPlaybackTargetAvailabilityEvent))return void console.error("MediaChrome: received a request to select AirPlay but AirPlay is not supported in this environment");i.webkitShowPlaybackTargetPicker()}},mediaEvents:["webkitcurrentplaybacktargetiswirelesschanged"]},mediaFullscreenUnavailable:{get(e){let{media:t}=e;if(!tI||!tk(t))return ea.UNSUPPORTED}},mediaPipUnavailable:{get(e){let{media:t}=e;return tS&&t_(t)?(null==t?void 0:t.disablePictureInPicture)?ea.UNAVAILABLE:void 0:ea.UNSUPPORTED}},mediaVolumeUnavailable:{get(e){let{media:t}=e;if(!1===r||(null==t?void 0:t.volume)==void 0)return ea.UNSUPPORTED},stateOwnersUpdateHandlers:[e=>{null==r&&tx.then(t=>e(t?void 0:ea.UNSUPPORTED))}]},mediaCastUnavailable:{get(e,{availability:t="not-available"}={}){var i;let{media:a}=e;return tw&&(null==(i=null==a?void 0:a.remote)?void 0:i.state)?null!=t&&"available"!==t?ea.UNAVAILABLE:void 0:ea.UNSUPPORTED},stateOwnersUpdateHandlers:[(e,t)=>{var i;let{media:a}=t;if(a)return a.disableRemotePlayback||a.hasAttribute("disableremoteplayback")||null==(i=null==a?void 0:a.remote)||i.watchAvailability(t=>{e({availability:t?"available":"not-available"})}).catch(t=>{"NotSupportedError"===t.name?e({availability:null}):e({availability:"not-available"})}),()=>{var e;null==(e=null==a?void 0:a.remote)||e.cancelWatchAvailability().catch(()=>{})}}]},mediaAirplayUnavailable:{get:(e,t)=>tR?(null==t?void 0:t.availability)==="not-available"?ea.UNAVAILABLE:void 0:ea.UNSUPPORTED,mediaEvents:["webkitplaybacktargetavailabilitychanged"],stateOwnersUpdateHandlers:[(e,t)=>{var i;let{media:a}=t;if(a)return a.disableRemotePlayback||a.hasAttribute("disableremoteplayback")||null==(i=null==a?void 0:a.remote)||i.watchAvailability(t=>{e({availability:t?"available":"not-available"})}).catch(t=>{"NotSupportedError"===t.name?e({availability:null}):e({availability:"not-available"})}),()=>{var e;null==(e=null==a?void 0:a.remote)||e.cancelWatchAvailability().catch(()=>{})}}]},mediaRenditionUnavailable:{get(e){var t;let{media:i}=e;return(null==i?void 0:i.videoRenditions)?(null==(t=i.videoRenditions)?void 0:t.length)?void 0:ea.UNAVAILABLE:ea.UNSUPPORTED},mediaEvents:["emptied","loadstart"],videoRenditionsEvents:["addrendition","removerendition"]},mediaAudioTrackUnavailable:{get(e){var t,i;let{media:a}=e;return(null==a?void 0:a.audioTracks)?(null!=(i=null==(t=a.audioTracks)?void 0:t.length)?i:0)<=1?ea.UNAVAILABLE:void 0:ea.UNSUPPORTED},mediaEvents:["emptied","loadstart"],audioTracksEvents:["addtrack","removetrack"]},mediaLang:{get(e){let{options:{mediaLang:t}={}}=e;return null!=t?t:"en"}}},tB={[q.MEDIA_PREVIEW_REQUEST](e,t,{detail:i}){var a,r,n;let s,o,{media:l}=t,d=null!=i?i:void 0;if(l&&null!=d){let[e]=tc(l,{kind:ee.METADATA,label:"thumbnails"}),t=Array.prototype.find.call(null!=(a=null==e?void 0:e.cues)?a:[],(e,t,i)=>0===t?e.endTime>d:t===i.length-1?e.startTime<=d:e.startTime<=d&&e.endTime>d);if(t){let e=/'^(?:[a-z]+:)?\/\//i.test(t.text)||null==(r=null==l?void 0:l.querySelector('track[label="thumbnails"]'))?void 0:r.src,i=new URL(t.text,e);o=new URLSearchParams(i.hash).get("#xywh").split(",").map(e=>+e),s=i.href}}let u=e.mediaDuration.get(t),h=null==(n=e.mediaChaptersCues.get(t).find((e,t,i)=>t===i.length-1&&u===e.endTime?e.startTime<=d&&e.endTime>=d:e.startTime<=d&&e.endTime>d))?void 0:n.text;return null!=i&&null==h&&(h=""),{mediaPreviewTime:d,mediaPreviewImage:s,mediaPreviewCoords:o,mediaPreviewChapter:h}},[q.MEDIA_PAUSE_REQUEST](e,t){e.mediaPaused.set(!0,t)},[q.MEDIA_PLAY_REQUEST](e,t){var i,a,r,n;let s=e.mediaStreamType.get(t)===er.LIVE,o=!(null==(i=t.options)?void 0:i.noAutoSeekToLive),l=e.mediaTargetLiveWindow.get(t)>0;if(s&&o&&!l){let i=null==(a=e.mediaSeekable.get(t))?void 0:a[1];if(i){let a=null!=(n=null==(r=t.options)?void 0:r.seekToLiveOffset)?n:0;e.mediaCurrentTime.set(i-a,t)}}e.mediaPaused.set(!1,t)},[q.MEDIA_PLAYBACK_RATE_REQUEST](e,t,{detail:i}){e.mediaPlaybackRate.set(i,t)},[q.MEDIA_MUTE_REQUEST](e,t){e.mediaMuted.set(!0,t)},[q.MEDIA_UNMUTE_REQUEST](e,t){e.mediaVolume.get(t)||e.mediaVolume.set(.25,t),e.mediaMuted.set(!1,t)},[q.MEDIA_LOOP_REQUEST](e,t,{detail:i}){let a=!!i;return e.mediaLoop.set(a,t),{mediaLoop:a}},[q.MEDIA_VOLUME_REQUEST](e,t,{detail:i}){i&&e.mediaMuted.get(t)&&e.mediaMuted.set(!1,t),e.mediaVolume.set(i,t)},[q.MEDIA_SEEK_REQUEST](e,t,{detail:i}){e.mediaCurrentTime.set(i,t)},[q.MEDIA_SEEK_TO_LIVE_REQUEST](e,t){var i,a,r;let n=null==(i=e.mediaSeekable.get(t))?void 0:i[1];if(Number.isNaN(Number(n)))return;let s=null!=(r=null==(a=t.options)?void 0:a.seekToLiveOffset)?r:0;e.mediaCurrentTime.set(n-s,t)},[q.MEDIA_SHOW_SUBTITLES_REQUEST](e,t,{detail:i}){var a;let{options:r}=t,n=tC(t),s=tl(i),o=null==(a=s[0])?void 0:a.language;o&&!r.noSubtitlesLangPref&&eR.localStorage.setItem("media-chrome-pref-subtitles-lang",o),tm(et.SHOWING,n,s)},[q.MEDIA_DISABLE_SUBTITLES_REQUEST](e,t,{detail:i}){let a=tC(t);tm(et.DISABLED,a,null!=i?i:[])},[q.MEDIA_TOGGLE_SUBTITLES_REQUEST](e,t,{detail:i}){tM(t,i)},[q.MEDIA_RENDITION_REQUEST](e,t,{detail:i}){e.mediaRenditionSelected.set(i,t)},[q.MEDIA_AUDIO_TRACK_REQUEST](e,t,{detail:i}){e.mediaAudioTrackEnabled.set(i,t)},[q.MEDIA_ENTER_PIP_REQUEST](e,t){e.mediaIsFullscreen.get(t)&&e.mediaIsFullscreen.set(!1,t),e.mediaIsPip.set(!0,t)},[q.MEDIA_EXIT_PIP_REQUEST](e,t){e.mediaIsPip.set(!1,t)},[q.MEDIA_ENTER_FULLSCREEN_REQUEST](e,t,i){e.mediaIsPip.get(t)&&e.mediaIsPip.set(!1,t),e.mediaIsFullscreen.set(!0,t,i)},[q.MEDIA_EXIT_FULLSCREEN_REQUEST](e,t){e.mediaIsFullscreen.set(!1,t)},[q.MEDIA_ENTER_CAST_REQUEST](e,t){e.mediaIsFullscreen.get(t)&&e.mediaIsFullscreen.set(!1,t),e.mediaIsCasting.set(!0,t)},[q.MEDIA_EXIT_CAST_REQUEST](e,t){e.mediaIsCasting.set(!1,t)},[q.MEDIA_AIRPLAY_REQUEST](e,t){e.mediaIsAirplaying.set(!0,t)}};var tH=(e,t,i)=>{if(!t.has(e))throw TypeError("Cannot "+i)},tV=(e,t,i)=>(tH(e,t,"read from private field"),i?i.call(e):t.get(e)),t$=(e,t,i)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,i)},tK=(e,t,i,a)=>(tH(e,t,"write to private field"),a?a.call(e,i):t.set(e,i),i),tF=(e,t,i)=>(tH(e,t,"access private method"),i);let tY=["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Enter"," ","f","m","k","c","l","j",">","<","p"],tG={DEFAULT_SUBTITLES:"defaultsubtitles",DEFAULT_STREAM_TYPE:"defaultstreamtype",DEFAULT_DURATION:"defaultduration",FULLSCREEN_ELEMENT:"fullscreenelement",HOTKEYS:"hotkeys",KEYBOARD_BACKWARD_SEEK_OFFSET:"keyboardbackwardseekoffset",KEYBOARD_FORWARD_SEEK_OFFSET:"keyboardforwardseekoffset",KEYBOARD_DOWN_VOLUME_STEP:"keyboarddownvolumestep",KEYBOARD_UP_VOLUME_STEP:"keyboardupvolumestep",KEYS_USED:"keysused",LANG:"lang",LOOP:"loop",LIVE_EDGE_OFFSET:"liveedgeoffset",NO_AUTO_SEEK_TO_LIVE:"noautoseektolive",NO_DEFAULT_STORE:"nodefaultstore",NO_HOTKEYS:"nohotkeys",NO_MUTED_PREF:"nomutedpref",NO_SUBTITLES_LANG_PREF:"nosubtitleslangpref",NO_VOLUME_PREF:"novolumepref",SEEK_TO_LIVE_OFFSET:"seektoliveoffset"};class tq extends te{constructor(){super(),t$(this,sp),t$(this,sv),t$(this,sg),t$(this,sA),this.mediaStateReceivers=[],this.associatedElementSubscriptions=new Map,t$(this,ss,new tn(this,tG.HOTKEYS)),t$(this,so,void 0),t$(this,sl,void 0),t$(this,sd,null),t$(this,su,void 0),t$(this,sh,void 0),t$(this,sm,e=>{var t;null==(t=tV(this,sl))||t.dispatch(e)}),t$(this,sc,void 0),this.associateElement(this);let e={};tK(this,su,t=>{Object.entries(t).forEach(([t,i])=>{if(t in e&&e[t]===i)return;this.propagateMediaState(t,i);let a=t.toLowerCase(),r=new eR.CustomEvent(J[a],{composed:!0,detail:i});this.dispatchEvent(r)}),e=t}),this.hasAttribute(tG.NO_HOTKEYS)?this.disableHotkeys():this.enableHotkeys()}static get observedAttributes(){return super.observedAttributes.concat(tG.NO_HOTKEYS,tG.HOTKEYS,tG.DEFAULT_STREAM_TYPE,tG.DEFAULT_SUBTITLES,tG.DEFAULT_DURATION,tG.NO_MUTED_PREF,tG.NO_VOLUME_PREF,tG.LANG,tG.LOOP)}get mediaStore(){return tV(this,sl)}set mediaStore(e){var t,i;if(tV(this,sl)&&(null==(t=tV(this,sh))||t.call(this),tK(this,sh,void 0)),tK(this,sl,e),!tV(this,sl)&&!this.hasAttribute(tG.NO_DEFAULT_STORE))return void tF(this,sp,sE).call(this);tK(this,sh,null==(i=tV(this,sl))?void 0:i.subscribe(tV(this,su)))}get fullscreenElement(){var e;return null!=(e=tV(this,so))?e:this}set fullscreenElement(e){var t;this.hasAttribute(tG.FULLSCREEN_ELEMENT)&&this.removeAttribute(tG.FULLSCREEN_ELEMENT),tK(this,so,e),null==(t=tV(this,sl))||t.dispatch({type:"fullscreenelementchangerequest",detail:this.fullscreenElement})}get defaultSubtitles(){return ej(this,tG.DEFAULT_SUBTITLES)}set defaultSubtitles(e){eZ(this,tG.DEFAULT_SUBTITLES,e)}get defaultStreamType(){return eQ(this,tG.DEFAULT_STREAM_TYPE)}set defaultStreamType(e){ez(this,tG.DEFAULT_STREAM_TYPE,e)}get defaultDuration(){return eG(this,tG.DEFAULT_DURATION)}set defaultDuration(e){eq(this,tG.DEFAULT_DURATION,e)}get noHotkeys(){return ej(this,tG.NO_HOTKEYS)}set noHotkeys(e){eZ(this,tG.NO_HOTKEYS,e)}get keysUsed(){return eQ(this,tG.KEYS_USED)}set keysUsed(e){ez(this,tG.KEYS_USED,e)}get liveEdgeOffset(){return eG(this,tG.LIVE_EDGE_OFFSET)}set liveEdgeOffset(e){eq(this,tG.LIVE_EDGE_OFFSET,e)}get noAutoSeekToLive(){return ej(this,tG.NO_AUTO_SEEK_TO_LIVE)}set noAutoSeekToLive(e){eZ(this,tG.NO_AUTO_SEEK_TO_LIVE,e)}get noVolumePref(){return ej(this,tG.NO_VOLUME_PREF)}set noVolumePref(e){eZ(this,tG.NO_VOLUME_PREF,e)}get noMutedPref(){return ej(this,tG.NO_MUTED_PREF)}set noMutedPref(e){eZ(this,tG.NO_MUTED_PREF,e)}get noSubtitlesLangPref(){return ej(this,tG.NO_SUBTITLES_LANG_PREF)}set noSubtitlesLangPref(e){eZ(this,tG.NO_SUBTITLES_LANG_PREF,e)}get noDefaultStore(){return ej(this,tG.NO_DEFAULT_STORE)}set noDefaultStore(e){eZ(this,tG.NO_DEFAULT_STORE,e)}attributeChangedCallback(e,t,i){var a,r,n,s,o,l,d,u,h,m,c,p;if(super.attributeChangedCallback(e,t,i),e===tG.NO_HOTKEYS)i!==t&&""===i?(this.hasAttribute(tG.HOTKEYS)&&console.warn("Media Chrome: Both `hotkeys` and `nohotkeys` have been set. All hotkeys will be disabled."),this.disableHotkeys()):i!==t&&null===i&&this.enableHotkeys();else if(e===tG.HOTKEYS)tV(this,ss).value=i;else if(e===tG.DEFAULT_SUBTITLES&&i!==t)null==(a=tV(this,sl))||a.dispatch({type:"optionschangerequest",detail:{defaultSubtitles:this.hasAttribute(tG.DEFAULT_SUBTITLES)}});else if(e===tG.DEFAULT_STREAM_TYPE)null==(n=tV(this,sl))||n.dispatch({type:"optionschangerequest",detail:{defaultStreamType:null!=(r=this.getAttribute(tG.DEFAULT_STREAM_TYPE))?r:void 0}});else if(e===tG.LIVE_EDGE_OFFSET)null==(s=tV(this,sl))||s.dispatch({type:"optionschangerequest",detail:{liveEdgeOffset:this.hasAttribute(tG.LIVE_EDGE_OFFSET)?+this.getAttribute(tG.LIVE_EDGE_OFFSET):void 0,seekToLiveOffset:this.hasAttribute(tG.SEEK_TO_LIVE_OFFSET)?void 0:+this.getAttribute(tG.LIVE_EDGE_OFFSET)}});else if(e===tG.SEEK_TO_LIVE_OFFSET)null==(o=tV(this,sl))||o.dispatch({type:"optionschangerequest",detail:{seekToLiveOffset:this.hasAttribute(tG.SEEK_TO_LIVE_OFFSET)?+this.getAttribute(tG.SEEK_TO_LIVE_OFFSET):void 0}});else if(e===tG.NO_AUTO_SEEK_TO_LIVE)null==(l=tV(this,sl))||l.dispatch({type:"optionschangerequest",detail:{noAutoSeekToLive:this.hasAttribute(tG.NO_AUTO_SEEK_TO_LIVE)}});else if(e===tG.FULLSCREEN_ELEMENT){let e=i?null==(d=this.getRootNode())?void 0:d.getElementById(i):void 0;tK(this,so,e),null==(u=tV(this,sl))||u.dispatch({type:"fullscreenelementchangerequest",detail:this.fullscreenElement})}else e===tG.LANG&&i!==t?(eb=i,null==(h=tV(this,sl))||h.dispatch({type:"optionschangerequest",detail:{mediaLang:i}})):e===tG.LOOP&&i!==t?null==(m=tV(this,sl))||m.dispatch({type:q.MEDIA_LOOP_REQUEST,detail:null!=i}):e===tG.NO_VOLUME_PREF&&i!==t?null==(c=tV(this,sl))||c.dispatch({type:"optionschangerequest",detail:{noVolumePref:this.hasAttribute(tG.NO_VOLUME_PREF)}}):e===tG.NO_MUTED_PREF&&i!==t&&(null==(p=tV(this,sl))||p.dispatch({type:"optionschangerequest",detail:{noMutedPref:this.hasAttribute(tG.NO_MUTED_PREF)}}))}connectedCallback(){var e,t;tV(this,sl)||this.hasAttribute(tG.NO_DEFAULT_STORE)||tF(this,sp,sE).call(this),null==(e=tV(this,sl))||e.dispatch({type:"documentelementchangerequest",detail:ew}),super.connectedCallback(),tV(this,sl)&&!tV(this,sh)&&tK(this,sh,null==(t=tV(this,sl))?void 0:t.subscribe(tV(this,su))),void 0!==tV(this,sc)&&tV(this,sl)&&this.media&&setTimeout(()=>{var e,t,i;(null==(t=null==(e=this.media)?void 0:e.textTracks)?void 0:t.length)&&(null==(i=tV(this,sl))||i.dispatch({type:q.MEDIA_TOGGLE_SUBTITLES_REQUEST,detail:tV(this,sc)}))},0),this.hasAttribute(tG.NO_HOTKEYS)?this.disableHotkeys():this.enableHotkeys()}disconnectedCallback(){var e,t,i,a,r;if(null==(e=super.disconnectedCallback)||e.call(this),tV(this,sl)){let e=tV(this,sl).getState();tK(this,sc,!!(null==(t=e.mediaSubtitlesShowing)?void 0:t.length)),null==(i=tV(this,sl))||i.dispatch({type:"documentelementchangerequest",detail:void 0}),null==(a=tV(this,sl))||a.dispatch({type:q.MEDIA_TOGGLE_SUBTITLES_REQUEST,detail:!1})}tV(this,sh)&&(null==(r=tV(this,sh))||r.call(this),tK(this,sh,void 0))}mediaSetCallback(e){var t;super.mediaSetCallback(e),null==(t=tV(this,sl))||t.dispatch({type:"mediaelementchangerequest",detail:e}),e.hasAttribute("tabindex")||(e.tabIndex=-1)}mediaUnsetCallback(e){var t;super.mediaUnsetCallback(e),null==(t=tV(this,sl))||t.dispatch({type:"mediaelementchangerequest",detail:void 0})}propagateMediaState(e,t){t2(this.mediaStateReceivers,e,t)}associateElement(e){if(!e)return;let{associatedElementSubscriptions:t}=this;if(t.has(e))return;let i=t3(e,this.registerMediaStateReceiver.bind(this),this.unregisterMediaStateReceiver.bind(this));Object.values(q).forEach(t=>{e.addEventListener(t,tV(this,sm))}),t.set(e,i)}unassociateElement(e){if(!e)return;let{associatedElementSubscriptions:t}=this;t.has(e)&&(t.get(e)(),t.delete(e),Object.values(q).forEach(t=>{e.removeEventListener(t,tV(this,sm))}))}registerMediaStateReceiver(e){if(!e)return;let t=this.mediaStateReceivers;!(t.indexOf(e)>-1)&&(t.push(e),tV(this,sl)&&Object.entries(tV(this,sl).getState()).forEach(([t,i])=>{t2([e],t,i)}))}unregisterMediaStateReceiver(e){let t=this.mediaStateReceivers,i=t.indexOf(e);i<0||t.splice(i,1)}enableHotkeys(){this.addEventListener("keydown",tF(this,sg,sf))}disableHotkeys(){this.removeEventListener("keydown",tF(this,sg,sf)),this.removeEventListener("keyup",tF(this,sv,sb))}get hotkeys(){return eQ(this,tG.HOTKEYS)}set hotkeys(e){ez(this,tG.HOTKEYS,e)}keyboardShortcutHandler(e){var t,i,a,r,n,s,o,l,d;let u,h,m,c=e.target;if(!((null!=(a=null!=(i=null==(t=c.getAttribute(tG.KEYS_USED))?void 0:t.split(" "))?i:null==c?void 0:c.keysUsed)?a:[]).map(e=>"Space"===e?" ":e).filter(Boolean).includes(e.key)||tV(this,ss).contains(`no${e.key.toLowerCase()}`)||" "===e.key&&tV(this,ss).contains("nospace"))&&!(e.shiftKey&&("/"===e.key||"?"===e.key)&&tV(this,ss).contains("noshift+/")))switch(e.key){case" ":case"k":u=tV(this,sl).getState().mediaPaused?q.MEDIA_PLAY_REQUEST:q.MEDIA_PAUSE_REQUEST,this.dispatchEvent(new eR.CustomEvent(u,{composed:!0,bubbles:!0}));break;case"m":u="off"===this.mediaStore.getState().mediaVolumeLevel?q.MEDIA_UNMUTE_REQUEST:q.MEDIA_MUTE_REQUEST,this.dispatchEvent(new eR.CustomEvent(u,{composed:!0,bubbles:!0}));break;case"f":u=this.mediaStore.getState().mediaIsFullscreen?q.MEDIA_EXIT_FULLSCREEN_REQUEST:q.MEDIA_ENTER_FULLSCREEN_REQUEST,this.dispatchEvent(new eR.CustomEvent(u,{composed:!0,bubbles:!0}));break;case"c":this.dispatchEvent(new eR.CustomEvent(q.MEDIA_TOGGLE_SUBTITLES_REQUEST,{composed:!0,bubbles:!0}));break;case"ArrowLeft":case"j":{let e=this.hasAttribute(tG.KEYBOARD_BACKWARD_SEEK_OFFSET)?+this.getAttribute(tG.KEYBOARD_BACKWARD_SEEK_OFFSET):10;h=Math.max((null!=(r=this.mediaStore.getState().mediaCurrentTime)?r:0)-e,0),m=new eR.CustomEvent(q.MEDIA_SEEK_REQUEST,{composed:!0,bubbles:!0,detail:h}),this.dispatchEvent(m);break}case"ArrowRight":case"l":{let e=this.hasAttribute(tG.KEYBOARD_FORWARD_SEEK_OFFSET)?+this.getAttribute(tG.KEYBOARD_FORWARD_SEEK_OFFSET):10;h=Math.max((null!=(n=this.mediaStore.getState().mediaCurrentTime)?n:0)+e,0),m=new eR.CustomEvent(q.MEDIA_SEEK_REQUEST,{composed:!0,bubbles:!0,detail:h}),this.dispatchEvent(m);break}case"ArrowUp":{let e=this.hasAttribute(tG.KEYBOARD_UP_VOLUME_STEP)?+this.getAttribute(tG.KEYBOARD_UP_VOLUME_STEP):.025;h=Math.min((null!=(s=this.mediaStore.getState().mediaVolume)?s:1)+e,1),m=new eR.CustomEvent(q.MEDIA_VOLUME_REQUEST,{composed:!0,bubbles:!0,detail:h}),this.dispatchEvent(m);break}case"ArrowDown":{let e=this.hasAttribute(tG.KEYBOARD_DOWN_VOLUME_STEP)?+this.getAttribute(tG.KEYBOARD_DOWN_VOLUME_STEP):.025;h=Math.max((null!=(o=this.mediaStore.getState().mediaVolume)?o:1)-e,0),m=new eR.CustomEvent(q.MEDIA_VOLUME_REQUEST,{composed:!0,bubbles:!0,detail:h}),this.dispatchEvent(m);break}case"<":h=Math.max((null!=(l=this.mediaStore.getState().mediaPlaybackRate)?l:1)-.25,.25).toFixed(2),m=new eR.CustomEvent(q.MEDIA_PLAYBACK_RATE_REQUEST,{composed:!0,bubbles:!0,detail:h}),this.dispatchEvent(m);break;case">":h=Math.min((null!=(d=this.mediaStore.getState().mediaPlaybackRate)?d:1)+.25,2).toFixed(2),m=new eR.CustomEvent(q.MEDIA_PLAYBACK_RATE_REQUEST,{composed:!0,bubbles:!0,detail:h}),this.dispatchEvent(m);break;case"/":case"?":e.shiftKey&&tF(this,sA,sT).call(this);break;case"p":u=this.mediaStore.getState().mediaIsPip?q.MEDIA_EXIT_PIP_REQUEST:q.MEDIA_ENTER_PIP_REQUEST,m=new eR.CustomEvent(u,{composed:!0,bubbles:!0}),this.dispatchEvent(m)}}}ss=new WeakMap,so=new WeakMap,sl=new WeakMap,sd=new WeakMap,su=new WeakMap,sh=new WeakMap,sm=new WeakMap,sc=new WeakMap,sp=new WeakSet,sE=function(){var e;this.mediaStore=(({media:e,fullscreenElement:t,documentElement:i,stateMediator:a=tW,requestMap:r=tB,options:n={},monitorStateOwnersOnlyWithSubscriptions:s=!0})=>{let o,l=[],d={options:{...n}},u=Object.freeze({mediaPreviewTime:void 0,mediaPreviewImage:void 0,mediaPreviewCoords:void 0,mediaPreviewChapter:void 0}),h=e=>{void 0!=e&&(tD(e,u)||(u=Object.freeze({...u,...e}),l.forEach(e=>e(u))))},m=()=>{h(Object.entries(a).reduce((e,[t,{get:i}])=>(e[t]=i(d),e),{}))},c={},p=async(e,t)=>{var i,r,n,u,p,E,v,b,g,f,A,T,y,_,k,I;let S=!!o;if(o={...d,...null!=o?o:{},...e},S)return;await tP(...Object.values(e));let R=l.length>0&&0===t&&s,w=d.media!==o.media,C=(null==(i=d.media)?void 0:i.textTracks)!==(null==(r=o.media)?void 0:r.textTracks),L=(null==(n=d.media)?void 0:n.videoRenditions)!==(null==(u=o.media)?void 0:u.videoRenditions),M=(null==(p=d.media)?void 0:p.audioTracks)!==(null==(E=o.media)?void 0:E.audioTracks),D=(null==(v=d.media)?void 0:v.remote)!==(null==(b=o.media)?void 0:b.remote),O=d.documentElement!==o.documentElement,N=!!d.media&&(w||R),x=!!(null==(g=d.media)?void 0:g.textTracks)&&(C||R),P=!!(null==(f=d.media)?void 0:f.videoRenditions)&&(L||R),U=!!(null==(A=d.media)?void 0:A.audioTracks)&&(M||R),W=!!(null==(T=d.media)?void 0:T.remote)&&(D||R),B=!!d.documentElement&&(O||R),H=N||x||P||U||W||B,V=0===l.length&&1===t&&s,$=!!o.media&&(w||V),K=!!(null==(y=o.media)?void 0:y.textTracks)&&(C||V),F=!!(null==(_=o.media)?void 0:_.videoRenditions)&&(L||V),Y=!!(null==(k=o.media)?void 0:k.audioTracks)&&(M||V),G=!!(null==(I=o.media)?void 0:I.remote)&&(D||V),q=!!o.documentElement&&(O||V),j=$||K||F||Y||G||q;if(!(H||j)){Object.entries(o).forEach(([e,t])=>{d[e]=t}),m(),o=void 0;return}Object.entries(a).forEach(([e,{get:t,mediaEvents:i=[],textTracksEvents:a=[],videoRenditionsEvents:r=[],audioTracksEvents:n=[],remoteEvents:s=[],rootEvents:l=[],stateOwnersUpdateHandlers:u=[]}])=>{let m;c[e]||(c[e]={});let p=i=>{h({[e]:t(d,i)})};m=c[e].mediaEvents,i.forEach(t=>{m&&N&&(d.media.removeEventListener(t,m),c[e].mediaEvents=void 0),$&&(o.media.addEventListener(t,p),c[e].mediaEvents=p)}),m=c[e].textTracksEvents,a.forEach(t=>{var i,a;m&&x&&(null==(i=d.media.textTracks)||i.removeEventListener(t,m),c[e].textTracksEvents=void 0),K&&(null==(a=o.media.textTracks)||a.addEventListener(t,p),c[e].textTracksEvents=p)}),m=c[e].videoRenditionsEvents,r.forEach(t=>{var i,a;m&&P&&(null==(i=d.media.videoRenditions)||i.removeEventListener(t,m),c[e].videoRenditionsEvents=void 0),F&&(null==(a=o.media.videoRenditions)||a.addEventListener(t,p),c[e].videoRenditionsEvents=p)}),m=c[e].audioTracksEvents,n.forEach(t=>{var i,a;m&&U&&(null==(i=d.media.audioTracks)||i.removeEventListener(t,m),c[e].audioTracksEvents=void 0),Y&&(null==(a=o.media.audioTracks)||a.addEventListener(t,p),c[e].audioTracksEvents=p)}),m=c[e].remoteEvents,s.forEach(t=>{var i,a;m&&W&&(null==(i=d.media.remote)||i.removeEventListener(t,m),c[e].remoteEvents=void 0),G&&(null==(a=o.media.remote)||a.addEventListener(t,p),c[e].remoteEvents=p)}),m=c[e].rootEvents,l.forEach(t=>{m&&B&&(d.documentElement.removeEventListener(t,m),c[e].rootEvents=void 0),q&&(o.documentElement.addEventListener(t,p),c[e].rootEvents=p)});let E=c[e].stateOwnersUpdateHandlers;if(E&&H&&(Array.isArray(E)?E:[E]).forEach(e=>{"function"==typeof e&&e()}),j){let t=u.map(e=>e(p,o)).filter(e=>"function"==typeof e);c[e].stateOwnersUpdateHandlers=1===t.length?t[0]:t}else H&&(c[e].stateOwnersUpdateHandlers=void 0)}),Object.entries(o).forEach(([e,t])=>{d[e]=t}),m(),o=void 0};return p({media:e,fullscreenElement:t,documentElement:i,options:n}),{dispatch(e){let{type:t,detail:i}=e;if(r[t]&&null==u.mediaErrorCode)return void h(r[t](a,d,e));"mediaelementchangerequest"===t?p({media:i}):"fullscreenelementchangerequest"===t?p({fullscreenElement:i}):"documentelementchangerequest"===t?p({documentElement:i}):"optionschangerequest"===t&&(Object.entries(null!=i?i:{}).forEach(([e,t])=>{d.options[e]=t}),m())},getState:()=>u,subscribe:e=>(p({},l.length+1),l.push(e),e(u),()=>{let t=l.indexOf(e);t>=0&&(p({},l.length-1),l.splice(t,1))})}})({media:this.media,fullscreenElement:this.fullscreenElement,options:{defaultSubtitles:this.hasAttribute(tG.DEFAULT_SUBTITLES),defaultDuration:this.hasAttribute(tG.DEFAULT_DURATION)?+this.getAttribute(tG.DEFAULT_DURATION):void 0,defaultStreamType:null!=(e=this.getAttribute(tG.DEFAULT_STREAM_TYPE))?e:void 0,liveEdgeOffset:this.hasAttribute(tG.LIVE_EDGE_OFFSET)?+this.getAttribute(tG.LIVE_EDGE_OFFSET):void 0,seekToLiveOffset:this.hasAttribute(tG.SEEK_TO_LIVE_OFFSET)?+this.getAttribute(tG.SEEK_TO_LIVE_OFFSET):this.hasAttribute(tG.LIVE_EDGE_OFFSET)?+this.getAttribute(tG.LIVE_EDGE_OFFSET):void 0,noAutoSeekToLive:this.hasAttribute(tG.NO_AUTO_SEEK_TO_LIVE),noVolumePref:this.hasAttribute(tG.NO_VOLUME_PREF),noMutedPref:this.hasAttribute(tG.NO_MUTED_PREF),noSubtitlesLangPref:this.hasAttribute(tG.NO_SUBTITLES_LANG_PREF)}})},sv=new WeakSet,sb=function(e){let{key:t,shiftKey:i}=e;if(!(i&&("/"===t||"?"===t)||tY.includes(t)))return void this.removeEventListener("keyup",tF(this,sv,sb));this.keyboardShortcutHandler(e)},sg=new WeakSet,sf=function(e){var t;let{metaKey:i,altKey:a,key:r,shiftKey:n}=e,s=n&&("/"===r||"?"===r);if(s&&(null==(t=tV(this,sd))?void 0:t.open)||i||a||!s&&!tY.includes(r))return void this.removeEventListener("keyup",tF(this,sv,sb));let o=e.target,l=o instanceof HTMLElement&&("media-volume-range"===o.tagName.toLowerCase()||"media-time-range"===o.tagName.toLowerCase());![" ","ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(r)||tV(this,ss).contains(`no${r.toLowerCase()}`)||" "===r&&tV(this,ss).contains("nospace")||l||e.preventDefault(),this.addEventListener("keyup",tF(this,sv,sb),{once:!0})},sA=new WeakSet,sT=function(){tV(this,sd)||(tK(this,sd,ew.createElement("media-keyboard-shortcuts-dialog")),this.appendChild(tV(this,sd))),tV(this,sd).open=!0};let tj=Object.values(z),tZ=Object.values(Z),tQ=e=>{var t,i,a,r;let{observedAttributes:n}=e.constructor;!n&&(null==(t=e.nodeName)?void 0:t.includes("-"))&&(eR.customElements.upgrade(e),{observedAttributes:n}=e.constructor);let s=null==(r=null==(a=null==(i=null==e?void 0:e.getAttribute)?void 0:i.call(e,j.MEDIA_CHROME_ATTRIBUTES))?void 0:a.split)?void 0:r.call(a,/\s+/);return Array.isArray(n||s)?(n||s).filter(e=>tj.includes(e)):[]},tz=e=>(e=>{var t,i;return(null==(t=e.nodeName)?void 0:t.includes("-"))&&eR.customElements.get(null==(i=e.nodeName)?void 0:i.toLowerCase())&&!(e instanceof eR.customElements.get(e.nodeName.toLowerCase()))&&eR.customElements.upgrade(e),tZ.some(t=>t in e)})(e)||!!tQ(e).length,tX=e=>{var t;return null==(t=null==e?void 0:e.join)?void 0:t.call(e,":")},tJ={[z.MEDIA_SUBTITLES_LIST]:tu,[z.MEDIA_SUBTITLES_SHOWING]:tu,[z.MEDIA_SEEKABLE]:tX,[z.MEDIA_BUFFERED]:e=>null==e?void 0:e.map(tX).join(" "),[z.MEDIA_PREVIEW_COORDS]:e=>null==e?void 0:e.join(" "),[z.MEDIA_RENDITION_LIST]:function(e){return null==e?void 0:e.map(es).join(" ")},[z.MEDIA_AUDIO_TRACK_LIST]:function(e){return null==e?void 0:e.map(el).join(" ")}},t0=async(e,t,i)=>{var a,r;if(e.isConnected||await em(0),"boolean"==typeof i||null==i)return eZ(e,t,i);if("number"==typeof i)return eq(e,t,i);if("string"==typeof i)return ez(e,t,i);if(Array.isArray(i)&&!i.length)return e.removeAttribute(t);let n=null!=(r=null==(a=tJ[t])?void 0:a.call(tJ,i))?r:i;return e.setAttribute(t,n)},t1=(e,t)=>{if((e=>{var t;return!!(null==(t=e.closest)?void 0:t.call(e,'*[slot="media"]'))})(e))return;let i=(e,t)=>{var i,a;tz(e)&&t(e);let{children:r=[]}=null!=e?e:{};[...r,...null!=(a=null==(i=null==e?void 0:e.shadowRoot)?void 0:i.children)?a:[]].forEach(e=>t1(e,t))},a=null==e?void 0:e.nodeName.toLowerCase();if(a.includes("-")&&!tz(e))return void eR.customElements.whenDefined(a).then(()=>{i(e,t)});i(e,t)},t2=(e,t,i)=>{e.forEach(e=>{if(t in e){e[t]=i;return}let a=tQ(e),r=t.toLowerCase();a.includes(r)&&t0(e,r,i)})},t3=(e,t,i)=>{t1(e,t);let a=e=>{var i;t(null!=(i=null==e?void 0:e.composedPath()[0])?i:e.target)},r=e=>{var t;i(null!=(t=null==e?void 0:e.composedPath()[0])?t:e.target)};e.addEventListener(q.REGISTER_MEDIA_STATE_RECEIVER,a),e.addEventListener(q.UNREGISTER_MEDIA_STATE_RECEIVER,r);let n=[],s=e=>{let a=e.target;"media"!==a.name&&(n.forEach(e=>t1(e,i)),(n=[...a.assignedElements({flatten:!0})]).forEach(e=>t1(e,t)))};e.addEventListener("slotchange",s);let o=new MutationObserver(e=>{e.forEach(e=>{let{addedNodes:a=[],removedNodes:r=[],type:n,target:s,attributeName:o}=e;"childList"===n?(Array.prototype.forEach.call(a,e=>t1(e,t)),Array.prototype.forEach.call(r,e=>t1(e,i))):"attributes"===n&&o===j.MEDIA_CHROME_ATTRIBUTES&&(tz(s)?t(s):i(s))})});return o.observe(e,{childList:!0,attributes:!0,subtree:!0}),()=>{t1(e,i),e.removeEventListener("slotchange",s),o.disconnect(),e.removeEventListener(q.REGISTER_MEDIA_STATE_RECEIVER,a),e.removeEventListener(q.UNREGISTER_MEDIA_STATE_RECEIVER,r)}};eR.customElements.get("media-controller")||eR.customElements.define("media-controller",tq);let t4={PLACEMENT:"placement",BOUNDS:"bounds"};class t5 extends eR.HTMLElement{constructor(){if(super(),this.updateXOffset=()=>{var e;if(!eK(this,{checkOpacity:!1,checkVisibilityCSS:!1}))return;let t=this.placement;if("left"===t||"right"===t)return void this.style.removeProperty("--media-tooltip-offset-x");let i=getComputedStyle(this),a=null!=(e=eH(this,"#"+this.bounds))?e:ex(this);if(!a)return;let{x:r,width:n}=a.getBoundingClientRect(),{x:s,width:o}=this.getBoundingClientRect(),l=i.getPropertyValue("--media-tooltip-offset-x"),d=l?parseFloat(l.replace("px","")):0,u=i.getPropertyValue("--media-tooltip-container-margin"),h=u?parseFloat(u.replace("px","")):0,m=s-r+d-h,c=s+o-(r+n)+d+h;return m<0?void this.style.setProperty("--media-tooltip-offset-x",`${m}px`):c>0?void this.style.setProperty("--media-tooltip-offset-x",`${c}px`):void this.style.removeProperty("--media-tooltip-offset-x")},!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);let e=eN(this.attributes);this.shadowRoot.innerHTML=this.constructor.getTemplateHTML(e)}if(this.arrowEl=this.shadowRoot.querySelector("#arrow"),Object.prototype.hasOwnProperty.call(this,"placement")){let e=this.placement;delete this.placement,this.placement=e}}static get observedAttributes(){return[t4.PLACEMENT,t4.BOUNDS]}get placement(){return eQ(this,t4.PLACEMENT)}set placement(e){ez(this,t4.PLACEMENT,e)}get bounds(){return eQ(this,t4.BOUNDS)}set bounds(e){ez(this,t4.BOUNDS,e)}}t5.shadowRootOptions={mode:"open"},t5.getTemplateHTML=function(e){return`
    <style>
      :host {
        --_tooltip-background-color: var(--media-tooltip-background-color, var(--media-secondary-color, rgba(20, 20, 30, .7)));
        --_tooltip-background: var(--media-tooltip-background, var(--_tooltip-background-color));
        --_tooltip-arrow-half-width: calc(var(--media-tooltip-arrow-width, 12px) / 2);
        --_tooltip-arrow-height: var(--media-tooltip-arrow-height, 5px);
        --_tooltip-arrow-background: var(--media-tooltip-arrow-color, var(--_tooltip-background-color));
        position: relative;
        pointer-events: none;
        display: var(--media-tooltip-display, inline-flex);
        justify-content: center;
        align-items: center;
        box-sizing: border-box;
        z-index: var(--media-tooltip-z-index, 1);
        background: var(--_tooltip-background);
        color: var(--media-text-color, var(--media-primary-color, rgb(238 238 238)));
        font: var(--media-font,
          var(--media-font-weight, 400)
          var(--media-font-size, 13px) /
          var(--media-text-content-height, var(--media-control-height, 18px))
          var(--media-font-family, helvetica neue, segoe ui, roboto, arial, sans-serif));
        padding: var(--media-tooltip-padding, .35em .7em);
        border: var(--media-tooltip-border, none);
        border-radius: var(--media-tooltip-border-radius, 5px);
        filter: var(--media-tooltip-filter, drop-shadow(0 0 4px rgba(0, 0, 0, .2)));
        white-space: var(--media-tooltip-white-space, nowrap);
      }

      :host([hidden]) {
        display: none;
      }

      img, svg {
        display: inline-block;
      }

      #arrow {
        position: absolute;
        width: 0px;
        height: 0px;
        border-style: solid;
        display: var(--media-tooltip-arrow-display, block);
      }

      :host(:not([placement])),
      :host([placement="top"]) {
        position: absolute;
        bottom: calc(100% + var(--media-tooltip-distance, 12px));
        left: 50%;
        transform: translate(calc(-50% - var(--media-tooltip-offset-x, 0px)), 0);
      }
      :host(:not([placement])) #arrow,
      :host([placement="top"]) #arrow {
        top: 100%;
        left: 50%;
        border-width: var(--_tooltip-arrow-height) var(--_tooltip-arrow-half-width) 0 var(--_tooltip-arrow-half-width);
        border-color: var(--_tooltip-arrow-background) transparent transparent transparent;
        transform: translate(calc(-50% + var(--media-tooltip-offset-x, 0px)), 0);
      }

      :host([placement="right"]) {
        position: absolute;
        left: calc(100% + var(--media-tooltip-distance, 12px));
        top: 50%;
        transform: translate(0, -50%);
      }
      :host([placement="right"]) #arrow {
        top: 50%;
        right: 100%;
        border-width: var(--_tooltip-arrow-half-width) var(--_tooltip-arrow-height) var(--_tooltip-arrow-half-width) 0;
        border-color: transparent var(--_tooltip-arrow-background) transparent transparent;
        transform: translate(0, -50%);
      }

      :host([placement="bottom"]) {
        position: absolute;
        top: calc(100% + var(--media-tooltip-distance, 12px));
        left: 50%;
        transform: translate(calc(-50% - var(--media-tooltip-offset-x, 0px)), 0);
      }
      :host([placement="bottom"]) #arrow {
        bottom: 100%;
        left: 50%;
        border-width: 0 var(--_tooltip-arrow-half-width) var(--_tooltip-arrow-height) var(--_tooltip-arrow-half-width);
        border-color: transparent transparent var(--_tooltip-arrow-background) transparent;
        transform: translate(calc(-50% + var(--media-tooltip-offset-x, 0px)), 0);
      }

      :host([placement="left"]) {
        position: absolute;
        right: calc(100% + var(--media-tooltip-distance, 12px));
        top: 50%;
        transform: translate(0, -50%);
      }
      :host([placement="left"]) #arrow {
        top: 50%;
        left: 100%;
        border-width: var(--_tooltip-arrow-half-width) 0 var(--_tooltip-arrow-half-width) var(--_tooltip-arrow-height);
        border-color: transparent transparent transparent var(--_tooltip-arrow-background);
        transform: translate(0, -50%);
      }
      
      :host([placement="none"]) #arrow {
        display: none;
      }
    </style>
    <slot></slot>
    <div id="arrow"></div>
  `},eR.customElements.get("media-tooltip")||eR.customElements.define("media-tooltip",t5);var t9=(e,t,i)=>{if(!t.has(e))throw TypeError("Cannot "+i)},t8=(e,t,i)=>(t9(e,t,"read from private field"),i?i.call(e):t.get(e)),t6=(e,t,i)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,i)},t7=(e,t,i,a)=>(t9(e,t,"write to private field"),a?a.call(e,i):t.set(e,i),i);let ie={TOOLTIP_PLACEMENT:"tooltipplacement",DISABLED:"disabled",NO_TOOLTIP:"notooltip"};class it extends eR.HTMLElement{constructor(){if(super(),t6(this,sR),t6(this,sy,void 0),this.preventClick=!1,this.tooltipEl=null,t6(this,s_,e=>{this.preventClick||this.handleClick(e),setTimeout(t8(this,sk),0)}),t6(this,sk,()=>{var e,t;null==(t=null==(e=this.tooltipEl)?void 0:e.updateXOffset)||t.call(e)}),t6(this,sI,e=>{let{key:t}=e;if(!this.keysUsed.includes(t))return void this.removeEventListener("keyup",t8(this,sI));this.preventClick||this.handleClick(e)}),t6(this,sS,e=>{let{metaKey:t,altKey:i,key:a}=e;if(t||i||!this.keysUsed.includes(a))return void this.removeEventListener("keyup",t8(this,sI));this.addEventListener("keyup",t8(this,sI),{once:!0})}),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);let e=eN(this.attributes),t=this.constructor.getTemplateHTML(e);this.shadowRoot.setHTMLUnsafe?this.shadowRoot.setHTMLUnsafe(t):this.shadowRoot.innerHTML=t}this.tooltipEl=this.shadowRoot.querySelector("media-tooltip")}static get observedAttributes(){return["disabled",ie.TOOLTIP_PLACEMENT,j.MEDIA_CONTROLLER,z.MEDIA_LANG]}enable(){this.addEventListener("click",t8(this,s_)),this.addEventListener("keydown",t8(this,sS)),this.tabIndex=0}disable(){this.removeEventListener("click",t8(this,s_)),this.removeEventListener("keydown",t8(this,sS)),this.removeEventListener("keyup",t8(this,sI)),this.tabIndex=-1}attributeChangedCallback(e,t,i){var a,r,n,s,o;e===j.MEDIA_CONTROLLER?(t&&(null==(r=null==(a=t8(this,sy))?void 0:a.unassociateElement)||r.call(a,this),t7(this,sy,null)),i&&this.isConnected&&(t7(this,sy,null==(n=this.getRootNode())?void 0:n.getElementById(i)),null==(o=null==(s=t8(this,sy))?void 0:s.associateElement)||o.call(s,this))):"disabled"===e&&i!==t?null==i?this.enable():this.disable():e===ie.TOOLTIP_PLACEMENT&&this.tooltipEl&&i!==t?this.tooltipEl.placement=i:e===z.MEDIA_LANG&&(this.shadowRoot.querySelector('slot[name="tooltip-content"]').innerHTML=this.constructor.getTooltipContentHTML()),t8(this,sk).call(this)}connectedCallback(){var e,t,i;let{style:a}=eF(this.shadowRoot,":host");a.setProperty("display",`var(--media-control-display, var(--${this.localName}-display, inline-flex))`),this.hasAttribute("disabled")?this.disable():this.enable(),this.setAttribute("role","button");let r=this.getAttribute(j.MEDIA_CONTROLLER);r&&(t7(this,sy,null==(e=this.getRootNode())?void 0:e.getElementById(r)),null==(i=null==(t=t8(this,sy))?void 0:t.associateElement)||i.call(t,this)),eR.customElements.whenDefined("media-tooltip").then(()=>{var e,t;return(e=sR,t=sw,t9(this,e,"access private method"),t).call(this)})}disconnectedCallback(){var e,t;this.disable(),null==(t=null==(e=t8(this,sy))?void 0:e.unassociateElement)||t.call(e,this),t7(this,sy,null),this.removeEventListener("mouseenter",t8(this,sk)),this.removeEventListener("focus",t8(this,sk)),this.removeEventListener("click",t8(this,s_))}get keysUsed(){return["Enter"," "]}get tooltipPlacement(){return eQ(this,ie.TOOLTIP_PLACEMENT)}set tooltipPlacement(e){ez(this,ie.TOOLTIP_PLACEMENT,e)}get mediaController(){return eQ(this,j.MEDIA_CONTROLLER)}set mediaController(e){ez(this,j.MEDIA_CONTROLLER,e)}get disabled(){return ej(this,ie.DISABLED)}set disabled(e){eZ(this,ie.DISABLED,e)}get noTooltip(){return ej(this,ie.NO_TOOLTIP)}set noTooltip(e){eZ(this,ie.NO_TOOLTIP,e)}handleClick(e){}}sy=new WeakMap,s_=new WeakMap,sk=new WeakMap,sI=new WeakMap,sS=new WeakMap,sR=new WeakSet,sw=function(){this.addEventListener("mouseenter",t8(this,sk)),this.addEventListener("focus",t8(this,sk)),this.addEventListener("click",t8(this,s_));let e=this.tooltipPlacement;e&&this.tooltipEl&&(this.tooltipEl.placement=e)},it.shadowRootOptions={mode:"open"},it.getTemplateHTML=function(e,t={}){return`
    <style>
      :host {
        position: relative;
        font: var(--media-font,
          var(--media-font-weight, bold)
          var(--media-font-size, 14px) /
          var(--media-text-content-height, var(--media-control-height, 24px))
          var(--media-font-family, helvetica neue, segoe ui, roboto, arial, sans-serif));
        color: var(--media-text-color, var(--media-primary-color, rgb(238 238 238)));
        background: var(--media-control-background, var(--media-secondary-color, rgb(20 20 30 / .7)));
        padding: var(--media-button-padding, var(--media-control-padding, 10px));
        justify-content: var(--media-button-justify-content, center);
        display: inline-flex;
        align-items: center;
        vertical-align: middle;
        box-sizing: border-box;
        transition: background .15s linear;
        pointer-events: auto;
        cursor: var(--media-cursor, pointer);
        -webkit-tap-highlight-color: transparent;
      }

      
      :host(:focus-visible) {
        box-shadow: var(--media-focus-box-shadow, inset 0 0 0 2px rgb(27 127 204 / .9));
        outline: 0;
      }
      
      :host(:where(:focus)) {
        box-shadow: none;
        outline: 0;
      }

      :host(:hover) {
        background: var(--media-control-hover-background, rgba(50 50 70 / .7));
      }

      svg, img, ::slotted(svg), ::slotted(img) {
        width: var(--media-button-icon-width);
        height: var(--media-button-icon-height, var(--media-control-height, 24px));
        transform: var(--media-button-icon-transform);
        transition: var(--media-button-icon-transition);
        fill: var(--media-icon-color, var(--media-primary-color, rgb(238 238 238)));
        vertical-align: middle;
        max-width: 100%;
        max-height: 100%;
        min-width: 100%;
      }

      media-tooltip {
        
        max-width: 0;
        overflow-x: clip;
        opacity: 0;
        transition: opacity .3s, max-width 0s 9s;
      }

      :host(:hover) media-tooltip,
      :host(:focus-visible) media-tooltip {
        max-width: 100vw;
        opacity: 1;
        transition: opacity .3s;
      }

      :host([notooltip]) slot[name="tooltip"] {
        display: none;
      }
    </style>

    ${this.getSlotTemplateHTML(e,t)}

    <slot name="tooltip">
      <media-tooltip part="tooltip" aria-hidden="true">
        <template shadowrootmode="${t5.shadowRootOptions.mode}">
          ${t5.getTemplateHTML({})}
        </template>
        <slot name="tooltip-content">
          ${this.getTooltipContentHTML(e)}
        </slot>
      </media-tooltip>
    </slot>
  `},it.getSlotTemplateHTML=function(e,t){return`
    <slot></slot>
  `},it.getTooltipContentHTML=function(){return""},eR.customElements.get("media-chrome-button")||eR.customElements.define("media-chrome-button",it);let ii=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M22.13 3H3.87a.87.87 0 0 0-.87.87v13.26a.87.87 0 0 0 .87.87h3.4L9 16H5V5h16v11h-4l1.72 2h3.4a.87.87 0 0 0 .87-.87V3.87a.87.87 0 0 0-.86-.87Zm-8.75 11.44a.5.5 0 0 0-.76 0l-4.91 5.73a.5.5 0 0 0 .38.83h9.82a.501.501 0 0 0 .38-.83l-4.91-5.73Z"/>
</svg>
`,ia=e=>{let t=e.mediaIsAirplaying?eg("stop airplay"):eg("start airplay");e.setAttribute("aria-label",t)};class ir extends it{static get observedAttributes(){return[...super.observedAttributes,z.MEDIA_IS_AIRPLAYING,z.MEDIA_AIRPLAY_UNAVAILABLE]}connectedCallback(){super.connectedCallback(),ia(this)}attributeChangedCallback(e,t,i){super.attributeChangedCallback(e,t,i),e===z.MEDIA_IS_AIRPLAYING&&ia(this)}get mediaIsAirplaying(){return ej(this,z.MEDIA_IS_AIRPLAYING)}set mediaIsAirplaying(e){eZ(this,z.MEDIA_IS_AIRPLAYING,e)}get mediaAirplayUnavailable(){return eQ(this,z.MEDIA_AIRPLAY_UNAVAILABLE)}set mediaAirplayUnavailable(e){ez(this,z.MEDIA_AIRPLAY_UNAVAILABLE,e)}handleClick(){let e=new eR.CustomEvent(q.MEDIA_AIRPLAY_REQUEST,{composed:!0,bubbles:!0});this.dispatchEvent(e)}}ir.getSlotTemplateHTML=function(e){return`
    <style>
      :host([${z.MEDIA_IS_AIRPLAYING}]) slot[name=icon] slot:not([name=exit]) {
        display: none !important;
      }

      
      :host(:not([${z.MEDIA_IS_AIRPLAYING}])) slot[name=icon] slot:not([name=enter]) {
        display: none !important;
      }

      :host([${z.MEDIA_IS_AIRPLAYING}]) slot[name=tooltip-enter],
      :host(:not([${z.MEDIA_IS_AIRPLAYING}])) slot[name=tooltip-exit] {
        display: none;
      }
    </style>

    <slot name="icon">
      <slot name="enter">${ii}</slot>
      <slot name="exit">${ii}</slot>
    </slot>
  `},ir.getTooltipContentHTML=function(){return`
    <slot name="tooltip-enter">${eg("start airplay")}</slot>
    <slot name="tooltip-exit">${eg("stop airplay")}</slot>
  `},eR.customElements.get("media-airplay-button")||eR.customElements.define("media-airplay-button",ir);let is=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M22.83 5.68a2.58 2.58 0 0 0-2.3-2.5c-3.62-.24-11.44-.24-15.06 0a2.58 2.58 0 0 0-2.3 2.5c-.23 4.21-.23 8.43 0 12.64a2.58 2.58 0 0 0 2.3 2.5c3.62.24 11.44.24 15.06 0a2.58 2.58 0 0 0 2.3-2.5c.23-4.21.23-8.43 0-12.64Zm-11.39 9.45a3.07 3.07 0 0 1-1.91.57 3.06 3.06 0 0 1-2.34-1 3.75 3.75 0 0 1-.92-2.67 3.92 3.92 0 0 1 .92-2.77 3.18 3.18 0 0 1 2.43-1 2.94 2.94 0 0 1 2.13.78c.364.359.62.813.74 1.31l-1.43.35a1.49 1.49 0 0 0-1.51-1.17 1.61 1.61 0 0 0-1.29.58 2.79 2.79 0 0 0-.5 1.89 3 3 0 0 0 .49 1.93 1.61 1.61 0 0 0 1.27.58 1.48 1.48 0 0 0 1-.37 2.1 2.1 0 0 0 .59-1.14l1.4.44a3.23 3.23 0 0 1-1.07 1.69Zm7.22 0a3.07 3.07 0 0 1-1.91.57 3.06 3.06 0 0 1-2.34-1 3.75 3.75 0 0 1-.92-2.67 3.88 3.88 0 0 1 .93-2.77 3.14 3.14 0 0 1 2.42-1 3 3 0 0 1 2.16.82 2.8 2.8 0 0 1 .73 1.31l-1.43.35a1.49 1.49 0 0 0-1.51-1.21 1.61 1.61 0 0 0-1.29.58A2.79 2.79 0 0 0 15 12a3 3 0 0 0 .49 1.93 1.61 1.61 0 0 0 1.27.58 1.44 1.44 0 0 0 1-.37 2.1 2.1 0 0 0 .6-1.15l1.4.44a3.17 3.17 0 0 1-1.1 1.7Z"/>
</svg>`,io=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M17.73 14.09a1.4 1.4 0 0 1-1 .37 1.579 1.579 0 0 1-1.27-.58A3 3 0 0 1 15 12a2.8 2.8 0 0 1 .5-1.85 1.63 1.63 0 0 1 1.29-.57 1.47 1.47 0 0 1 1.51 1.2l1.43-.34A2.89 2.89 0 0 0 19 9.07a3 3 0 0 0-2.14-.78 3.14 3.14 0 0 0-2.42 1 3.91 3.91 0 0 0-.93 2.78 3.74 3.74 0 0 0 .92 2.66 3.07 3.07 0 0 0 2.34 1 3.07 3.07 0 0 0 1.91-.57 3.17 3.17 0 0 0 1.07-1.74l-1.4-.45c-.083.43-.3.822-.62 1.12Zm-7.22 0a1.43 1.43 0 0 1-1 .37 1.58 1.58 0 0 1-1.27-.58A3 3 0 0 1 7.76 12a2.8 2.8 0 0 1 .5-1.85 1.63 1.63 0 0 1 1.29-.57 1.47 1.47 0 0 1 1.51 1.2l1.43-.34a2.81 2.81 0 0 0-.74-1.32 2.94 2.94 0 0 0-2.13-.78 3.18 3.18 0 0 0-2.43 1 4 4 0 0 0-.92 2.78 3.74 3.74 0 0 0 .92 2.66 3.07 3.07 0 0 0 2.34 1 3.07 3.07 0 0 0 1.91-.57 3.23 3.23 0 0 0 1.07-1.74l-1.4-.45a2.06 2.06 0 0 1-.6 1.07Zm12.32-8.41a2.59 2.59 0 0 0-2.3-2.51C18.72 3.05 15.86 3 13 3c-2.86 0-5.72.05-7.53.17a2.59 2.59 0 0 0-2.3 2.51c-.23 4.207-.23 8.423 0 12.63a2.57 2.57 0 0 0 2.3 2.5c1.81.13 4.67.19 7.53.19 2.86 0 5.72-.06 7.53-.19a2.57 2.57 0 0 0 2.3-2.5c.23-4.207.23-8.423 0-12.63Zm-1.49 12.53a1.11 1.11 0 0 1-.91 1.11c-1.67.11-4.45.18-7.43.18-2.98 0-5.76-.07-7.43-.18a1.11 1.11 0 0 1-.91-1.11c-.21-4.14-.21-8.29 0-12.43a1.11 1.11 0 0 1 .91-1.11C7.24 4.56 10 4.49 13 4.49s5.76.07 7.43.18a1.11 1.11 0 0 1 .91 1.11c.21 4.14.21 8.29 0 12.43Z"/>
</svg>`,il=e=>{e.setAttribute("aria-checked",tp(e).toString())};class id extends it{static get observedAttributes(){return[...super.observedAttributes,z.MEDIA_SUBTITLES_LIST,z.MEDIA_SUBTITLES_SHOWING]}connectedCallback(){super.connectedCallback(),this.setAttribute("role","switch"),this.setAttribute("aria-label",eg("closed captions")),il(this)}attributeChangedCallback(e,t,i){super.attributeChangedCallback(e,t,i),e===z.MEDIA_SUBTITLES_SHOWING&&il(this)}get mediaSubtitlesList(){return iu(this,z.MEDIA_SUBTITLES_LIST)}set mediaSubtitlesList(e){ih(this,z.MEDIA_SUBTITLES_LIST,e)}get mediaSubtitlesShowing(){return iu(this,z.MEDIA_SUBTITLES_SHOWING)}set mediaSubtitlesShowing(e){ih(this,z.MEDIA_SUBTITLES_SHOWING,e)}handleClick(){this.dispatchEvent(new eR.CustomEvent(q.MEDIA_TOGGLE_SUBTITLES_REQUEST,{composed:!0,bubbles:!0}))}}id.getSlotTemplateHTML=function(e){return`
    <style>
      :host([aria-checked="true"]) slot[name=off] {
        display: none !important;
      }

      
      :host(:not([aria-checked="true"])) slot[name=on] {
        display: none !important;
      }

      :host([aria-checked="true"]) slot[name=tooltip-enable],
      :host(:not([aria-checked="true"])) slot[name=tooltip-disable] {
        display: none;
      }
    </style>

    <slot name="icon">
      <slot name="on">${is}</slot>
      <slot name="off">${io}</slot>
    </slot>
  `},id.getTooltipContentHTML=function(){return`
    <slot name="tooltip-enable">${eg("Enable captions")}</slot>
    <slot name="tooltip-disable">${eg("Disable captions")}</slot>
  `};let iu=(e,t)=>{let i=e.getAttribute(t);return i?to(i):[]},ih=(e,t,i)=>{if(!(null==i?void 0:i.length))return void e.removeAttribute(t);let a=tu(i);e.getAttribute(t)!==a&&e.setAttribute(t,a)};eR.customElements.get("media-captions-button")||eR.customElements.define("media-captions-button",id);let im=e=>{let t=e.mediaIsCasting?eg("stop casting"):eg("start casting");e.setAttribute("aria-label",t)};class ic extends it{static get observedAttributes(){return[...super.observedAttributes,z.MEDIA_IS_CASTING,z.MEDIA_CAST_UNAVAILABLE]}connectedCallback(){super.connectedCallback(),im(this)}attributeChangedCallback(e,t,i){super.attributeChangedCallback(e,t,i),e===z.MEDIA_IS_CASTING&&im(this)}get mediaIsCasting(){return ej(this,z.MEDIA_IS_CASTING)}set mediaIsCasting(e){eZ(this,z.MEDIA_IS_CASTING,e)}get mediaCastUnavailable(){return eQ(this,z.MEDIA_CAST_UNAVAILABLE)}set mediaCastUnavailable(e){ez(this,z.MEDIA_CAST_UNAVAILABLE,e)}handleClick(){let e=this.mediaIsCasting?q.MEDIA_EXIT_CAST_REQUEST:q.MEDIA_ENTER_CAST_REQUEST;this.dispatchEvent(new eR.CustomEvent(e,{composed:!0,bubbles:!0}))}}ic.getSlotTemplateHTML=function(e){return`
    <style>
      :host([${z.MEDIA_IS_CASTING}]) slot[name=icon] slot:not([name=exit]) {
        display: none !important;
      }

      
      :host(:not([${z.MEDIA_IS_CASTING}])) slot[name=icon] slot:not([name=enter]) {
        display: none !important;
      }

      :host([${z.MEDIA_IS_CASTING}]) slot[name=tooltip-enter],
      :host(:not([${z.MEDIA_IS_CASTING}])) slot[name=tooltip-exit] {
        display: none;
      }
    </style>

    <slot name="icon">
      <slot name="enter"><svg aria-hidden="true" viewBox="0 0 24 24"><g><path class="cast_caf_icon_arch0" d="M1,18 L1,21 L4,21 C4,19.3 2.66,18 1,18 L1,18 Z"/><path class="cast_caf_icon_arch1" d="M1,14 L1,16 C3.76,16 6,18.2 6,21 L8,21 C8,17.13 4.87,14 1,14 L1,14 Z"/><path class="cast_caf_icon_arch2" d="M1,10 L1,12 C5.97,12 10,16.0 10,21 L12,21 C12,14.92 7.07,10 1,10 L1,10 Z"/><path class="cast_caf_icon_box" d="M21,3 L3,3 C1.9,3 1,3.9 1,5 L1,8 L3,8 L3,5 L21,5 L21,19 L14,19 L14,21 L21,21 C22.1,21 23,20.1 23,19 L23,5 C23,3.9 22.1,3 21,3 L21,3 Z"/></g></svg></slot>
      <slot name="exit"><svg aria-hidden="true" viewBox="0 0 24 24"><g><path class="cast_caf_icon_arch0" d="M1,18 L1,21 L4,21 C4,19.3 2.66,18 1,18 L1,18 Z"/><path class="cast_caf_icon_arch1" d="M1,14 L1,16 C3.76,16 6,18.2 6,21 L8,21 C8,17.13 4.87,14 1,14 L1,14 Z"/><path class="cast_caf_icon_arch2" d="M1,10 L1,12 C5.97,12 10,16.0 10,21 L12,21 C12,14.92 7.07,10 1,10 L1,10 Z"/><path class="cast_caf_icon_box" d="M21,3 L3,3 C1.9,3 1,3.9 1,5 L1,8 L3,8 L3,5 L21,5 L21,19 L14,19 L14,21 L21,21 C22.1,21 23,20.1 23,19 L23,5 C23,3.9 22.1,3 21,3 L21,3 Z"/><path class="cast_caf_icon_boxfill" d="M5,7 L5,8.63 C8,8.6 13.37,14 13.37,17 L19,17 L19,7 Z"/></g></svg></slot>
    </slot>
  `},ic.getTooltipContentHTML=function(){return`
    <slot name="tooltip-enter">${eg("Start casting")}</slot>
    <slot name="tooltip-exit">${eg("Stop casting")}</slot>
  `},eR.customElements.get("media-cast-button")||eR.customElements.define("media-cast-button",ic);var ip=(e,t,i)=>{if(!t.has(e))throw TypeError("Cannot "+i)},iE=(e,t,i)=>(ip(e,t,"read from private field"),i?i.call(e):t.get(e)),iv=(e,t,i)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,i)},ib=(e,t,i,a)=>(ip(e,t,"write to private field"),a?a.call(e,i):t.set(e,i),i),ig=(e,t,i)=>(ip(e,t,"access private method"),i);let iA={OPEN:"open",ANCHOR:"anchor"};class iT extends eR.HTMLElement{constructor(){super(),iv(this,sD),iv(this,sN),iv(this,sP),iv(this,sW),iv(this,sH),iv(this,s$),iv(this,sC,!1),iv(this,sL,null),iv(this,sM,null),this.addEventListener("invoke",this),this.addEventListener("focusout",this),this.addEventListener("keydown",this)}static get observedAttributes(){return[iA.OPEN,iA.ANCHOR]}get open(){return ej(this,iA.OPEN)}set open(e){eZ(this,iA.OPEN,e)}handleEvent(e){switch(e.type){case"invoke":ig(this,sW,sB).call(this,e);break;case"focusout":ig(this,sH,sV).call(this,e);break;case"keydown":ig(this,s$,sK).call(this,e)}}connectedCallback(){ig(this,sD,sO).call(this),this.role||(this.role="dialog")}attributeChangedCallback(e,t,i){ig(this,sD,sO).call(this),e===iA.OPEN&&i!==t&&(this.open?ig(this,sN,sx).call(this):ig(this,sP,sU).call(this))}focus(){ib(this,sL,eV());let e=!this.dispatchEvent(new Event("focus",{composed:!0,cancelable:!0})),t=!this.dispatchEvent(new Event("focusin",{composed:!0,bubbles:!0,cancelable:!0}));if(e||t)return;let i=this.querySelector('[autofocus], [tabindex]:not([tabindex="-1"]), [role="menu"]');null==i||i.focus()}get keysUsed(){return["Escape","Tab"]}}sC=new WeakMap,sL=new WeakMap,sM=new WeakMap,sD=new WeakSet,sO=function(){if(!iE(this,sC)&&(ib(this,sC,!0),!this.shadowRoot)){this.attachShadow(this.constructor.shadowRootOptions);let e=eN(this.attributes);this.shadowRoot.innerHTML=this.constructor.getTemplateHTML(e),queueMicrotask(()=>{let{style:e}=eF(this.shadowRoot,":host");e.setProperty("transition","display .15s, visibility .15s, opacity .15s ease-in, transform .15s ease-in")})}},sN=new WeakSet,sx=function(){var e;null==(e=iE(this,sM))||e.setAttribute("aria-expanded","true"),this.dispatchEvent(new Event("open",{composed:!0,bubbles:!0})),this.addEventListener("transitionend",()=>this.focus(),{once:!0})},sP=new WeakSet,sU=function(){var e;null==(e=iE(this,sM))||e.setAttribute("aria-expanded","false"),this.dispatchEvent(new Event("close",{composed:!0,bubbles:!0}))},sW=new WeakSet,sB=function(e){ib(this,sM,e.relatedTarget),eB(this,e.relatedTarget)||(this.open=!this.open)},sH=new WeakSet,sV=function(e){var t;!eB(this,e.relatedTarget)&&(null==(t=iE(this,sL))||t.focus(),iE(this,sM)&&iE(this,sM)!==e.relatedTarget&&this.open&&(this.open=!1))},s$=new WeakSet,sK=function(e){var t,i,a,r,n;let{key:s,ctrlKey:o,altKey:l,metaKey:d}=e;o||l||d||this.keysUsed.includes(s)&&(e.preventDefault(),e.stopPropagation(),"Tab"===s?(e.shiftKey?null==(i=null==(t=this.previousElementSibling)?void 0:t.focus)||i.call(t):null==(r=null==(a=this.nextElementSibling)?void 0:a.focus)||r.call(a),this.blur()):"Escape"===s&&(null==(n=iE(this,sL))||n.focus(),this.open=!1))},iT.shadowRootOptions={mode:"open"},iT.getTemplateHTML=function(e){return`
    <style>
      :host {
        font: var(--media-font,
          var(--media-font-weight, normal)
          var(--media-font-size, 14px) /
          var(--media-text-content-height, var(--media-control-height, 24px))
          var(--media-font-family, helvetica neue, segoe ui, roboto, arial, sans-serif));
        color: var(--media-text-color, var(--media-primary-color, rgb(238 238 238)));
        display: var(--media-dialog-display, inline-flex);
        justify-content: center;
        align-items: center;
        
        transition-behavior: allow-discrete;
        visibility: hidden;
        opacity: 0;
        transform: translateY(2px) scale(.99);
        pointer-events: none;
      }

      :host([open]) {
        transition: display .2s, visibility 0s, opacity .2s ease-out, transform .15s ease-out;
        visibility: visible;
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }

      #content {
        display: flex;
        position: relative;
        box-sizing: border-box;
        width: min(320px, 100%);
        word-wrap: break-word;
        max-height: 100%;
        overflow: auto;
        text-align: center;
        line-height: 1.4;
      }
    </style>
    ${this.getSlotTemplateHTML(e)}
  `},iT.getSlotTemplateHTML=function(e){return`
    <slot id="content"></slot>
  `},eR.customElements.get("media-chrome-dialog")||eR.customElements.define("media-chrome-dialog",iT);var iy=(e,t,i)=>{if(!t.has(e))throw TypeError("Cannot "+i)},i_=(e,t,i)=>(iy(e,t,"read from private field"),i?i.call(e):t.get(e)),ik=(e,t,i)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,i)},iI=(e,t,i,a)=>(iy(e,t,"write to private field"),a?a.call(e,i):t.set(e,i),i),iS=(e,t,i)=>(iy(e,t,"access private method"),i);class iR extends eR.HTMLElement{constructor(){if(super(),ik(this,sJ),ik(this,s1),ik(this,s3),ik(this,s5),ik(this,s8),ik(this,s7),ik(this,ot),ik(this,oa),ik(this,sF,void 0),ik(this,sY,void 0),ik(this,sG,void 0),ik(this,sq,void 0),ik(this,sj,{}),ik(this,sZ,[]),ik(this,sQ,()=>{if(this.range.matches(":focus-visible")){let{style:e}=eF(this.shadowRoot,":host");e.setProperty("--_focus-visible-box-shadow","var(--_focus-box-shadow)")}}),ik(this,sz,()=>{let{style:e}=eF(this.shadowRoot,":host");e.removeProperty("--_focus-visible-box-shadow")}),ik(this,sX,()=>{let e=this.shadowRoot.querySelector("#segments-clipping");e&&e.parentNode.append(e)}),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);let e=eN(this.attributes),t=this.constructor.getTemplateHTML(e);this.shadowRoot.setHTMLUnsafe?this.shadowRoot.setHTMLUnsafe(t):this.shadowRoot.innerHTML=t}this.container=this.shadowRoot.querySelector("#container"),iI(this,sG,this.shadowRoot.querySelector("#startpoint")),iI(this,sq,this.shadowRoot.querySelector("#endpoint")),this.range=this.shadowRoot.querySelector("#range"),this.appearance=this.shadowRoot.querySelector("#appearance")}static get observedAttributes(){return["disabled","aria-disabled",j.MEDIA_CONTROLLER]}attributeChangedCallback(e,t,i){var a,r,n,s,o;e===j.MEDIA_CONTROLLER?(t&&(null==(r=null==(a=i_(this,sF))?void 0:a.unassociateElement)||r.call(a,this),iI(this,sF,null)),i&&this.isConnected&&(iI(this,sF,null==(n=this.getRootNode())?void 0:n.getElementById(i)),null==(o=null==(s=i_(this,sF))?void 0:s.associateElement)||o.call(s,this))):("disabled"===e||"aria-disabled"===e&&t!==i)&&(null==i?(this.range.removeAttribute(e),iS(this,s1,s2).call(this)):(this.range.setAttribute(e,i),iS(this,s3,s4).call(this)))}connectedCallback(){var e,t,i;let{style:a}=eF(this.shadowRoot,":host");a.setProperty("display",`var(--media-control-display, var(--${this.localName}-display, inline-flex))`),i_(this,sj).pointer=eF(this.shadowRoot,"#pointer"),i_(this,sj).progress=eF(this.shadowRoot,"#progress"),i_(this,sj).thumb=eF(this.shadowRoot,'#thumb, ::slotted([slot="thumb"])'),i_(this,sj).activeSegment=eF(this.shadowRoot,"#segments-clipping rect:nth-child(0)");let r=this.getAttribute(j.MEDIA_CONTROLLER);r&&(iI(this,sF,null==(e=this.getRootNode())?void 0:e.getElementById(r)),null==(i=null==(t=i_(this,sF))?void 0:t.associateElement)||i.call(t,this)),this.updateBar(),this.shadowRoot.addEventListener("focusin",i_(this,sQ)),this.shadowRoot.addEventListener("focusout",i_(this,sz)),iS(this,s1,s2).call(this),eD(this.container,i_(this,sX))}disconnectedCallback(){var e,t;iS(this,s3,s4).call(this),null==(t=null==(e=i_(this,sF))?void 0:e.unassociateElement)||t.call(e,this),iI(this,sF,null),this.shadowRoot.removeEventListener("focusin",i_(this,sQ)),this.shadowRoot.removeEventListener("focusout",i_(this,sz)),eO(this.container,i_(this,sX))}updatePointerBar(e){var t;null==(t=i_(this,sj).pointer)||t.style.setProperty("width",`${100*this.getPointerRatio(e)}%`)}updateBar(){var e,t;let i=100*this.range.valueAsNumber;null==(e=i_(this,sj).progress)||e.style.setProperty("width",`${i}%`),null==(t=i_(this,sj).thumb)||t.style.setProperty("left",`${i}%`)}updateSegments(e){let t=this.shadowRoot.querySelector("#segments-clipping");if(t.textContent="",this.container.classList.toggle("segments",!!(null==e?void 0:e.length)),!(null==e?void 0:e.length))return;let i=[...new Set([+this.range.min,...e.flatMap(e=>[e.start,e.end]),+this.range.max])];iI(this,sZ,[...i]);let a=i.pop();for(let[e,r]of i.entries()){let[n,s]=[0===e,e===i.length-1],o=n?"calc(var(--segments-gap) / -1)":`${100*r}%`,l=s?a:i[e+1],d=`calc(${(l-r)*100}%${n||s?"":" - var(--segments-gap)"})`,u=ew.createElementNS("http://www.w3.org/2000/svg","rect"),h=eY(this.shadowRoot,`#segments-clipping rect:nth-child(${e+1})`);h.style.setProperty("x",o),h.style.setProperty("width",d),t.append(u)}}getPointerRatio(e){return function(e,t,i,a){let r=a.x-i.x,n=a.y-i.y,s=r*r+n*n;return 0===s?0:Math.max(0,Math.min(1,((e-i.x)*r+(t-i.y)*n)/s))}(e.clientX,e.clientY,i_(this,sG).getBoundingClientRect(),i_(this,sq).getBoundingClientRect())}get dragging(){return this.hasAttribute("dragging")}handleEvent(e){switch(e.type){case"pointermove":iS(this,oa,or).call(this,e);break;case"input":this.updateBar();break;case"pointerenter":iS(this,s8,s6).call(this,e);break;case"pointerdown":iS(this,s5,s9).call(this,e);break;case"pointerup":iS(this,s7,oe).call(this);break;case"pointerleave":iS(this,ot,oi).call(this)}}get keysUsed(){return["ArrowUp","ArrowRight","ArrowDown","ArrowLeft"]}}sF=new WeakMap,sY=new WeakMap,sG=new WeakMap,sq=new WeakMap,sj=new WeakMap,sZ=new WeakMap,sQ=new WeakMap,sz=new WeakMap,sX=new WeakMap,sJ=new WeakSet,s0=function(e){let t=i_(this,sj).activeSegment;if(!t)return;let i=this.getPointerRatio(e),a=i_(this,sZ).findIndex((e,t,a)=>{let r=a[t+1];return null!=r&&i>=e&&i<=r}),r=`#segments-clipping rect:nth-child(${a+1})`;t.selectorText==r&&t.style.transform||(t.selectorText=r,t.style.setProperty("transform","var(--media-range-segment-hover-transform, scaleY(2))"))},s1=new WeakSet,s2=function(){this.hasAttribute("disabled")||(this.addEventListener("input",this),this.addEventListener("pointerdown",this),this.addEventListener("pointerenter",this))},s3=new WeakSet,s4=function(){var e,t;this.removeEventListener("input",this),this.removeEventListener("pointerdown",this),this.removeEventListener("pointerenter",this),null==(e=eR.window)||e.removeEventListener("pointerup",this),null==(t=eR.window)||t.removeEventListener("pointermove",this)},s5=new WeakSet,s9=function(e){var t;iI(this,sY,e.composedPath().includes(this.range)),null==(t=eR.window)||t.addEventListener("pointerup",this)},s8=new WeakSet,s6=function(e){var t;"mouse"!==e.pointerType&&iS(this,s5,s9).call(this,e),this.addEventListener("pointerleave",this),null==(t=eR.window)||t.addEventListener("pointermove",this)},s7=new WeakSet,oe=function(){var e;null==(e=eR.window)||e.removeEventListener("pointerup",this),this.toggleAttribute("dragging",!1),this.range.disabled=this.hasAttribute("disabled")},ot=new WeakSet,oi=function(){var e,t;this.removeEventListener("pointerleave",this),null==(e=eR.window)||e.removeEventListener("pointermove",this),this.toggleAttribute("dragging",!1),this.range.disabled=this.hasAttribute("disabled"),null==(t=i_(this,sj).activeSegment)||t.style.removeProperty("transform")},oa=new WeakSet,or=function(e){("pen"!==e.pointerType||0!==e.buttons)&&(this.toggleAttribute("dragging",1===e.buttons||"mouse"!==e.pointerType),this.updatePointerBar(e),iS(this,sJ,s0).call(this,e),this.dragging&&("mouse"!==e.pointerType||!i_(this,sY))&&(this.range.disabled=!0,this.range.valueAsNumber=this.getPointerRatio(e),this.range.dispatchEvent(new Event("input",{bubbles:!0,composed:!0}))))},iR.shadowRootOptions={mode:"open"},iR.getTemplateHTML=function(e){return`
    <style>
      :host {
        --_focus-box-shadow: var(--media-focus-box-shadow, inset 0 0 0 2px rgb(27 127 204 / .9));
        --_media-range-padding: var(--media-range-padding, var(--media-control-padding, 10px));

        box-shadow: var(--_focus-visible-box-shadow, none);
        background: var(--media-control-background, var(--media-secondary-color, rgb(20 20 30 / .7)));
        height: calc(var(--media-control-height, 24px) + 2 * var(--_media-range-padding));
        display: inline-flex;
        align-items: center;
        
        vertical-align: middle;
        box-sizing: border-box;
        position: relative;
        width: 100px;
        transition: background .15s linear;
        cursor: var(--media-cursor, pointer);
        pointer-events: auto;
        touch-action: none; 
      }

      
      input[type=range]:focus {
        outline: 0;
      }
      input[type=range]:focus::-webkit-slider-runnable-track {
        outline: 0;
      }

      :host(:hover) {
        background: var(--media-control-hover-background, rgb(50 50 70 / .7));
      }

      #leftgap {
        padding-left: var(--media-range-padding-left, var(--_media-range-padding));
      }

      #rightgap {
        padding-right: var(--media-range-padding-right, var(--_media-range-padding));
      }

      #startpoint,
      #endpoint {
        position: absolute;
      }

      #endpoint {
        right: 0;
      }

      #container {
        
        width: var(--media-range-track-width, 100%);
        transform: translate(var(--media-range-track-translate-x, 0px), var(--media-range-track-translate-y, 0px));
        position: relative;
        height: 100%;
        display: flex;
        align-items: center;
        min-width: 40px;
      }

      #range {
        
        display: var(--media-time-range-hover-display, block);
        bottom: var(--media-time-range-hover-bottom, -7px);
        height: var(--media-time-range-hover-height, max(100% + 7px, 25px));
        width: 100%;
        position: absolute;
        cursor: var(--media-cursor, pointer);

        -webkit-appearance: none; 
        -webkit-tap-highlight-color: transparent;
        background: transparent; 
        margin: 0;
        z-index: 1;
      }

      @media (hover: hover) {
        #range {
          bottom: var(--media-time-range-hover-bottom, -5px);
          height: var(--media-time-range-hover-height, max(100% + 5px, 20px));
        }
      }

      
      
      #range::-webkit-slider-thumb {
        -webkit-appearance: none;
        background: transparent;
        width: .1px;
        height: .1px;
      }

      
      #range::-moz-range-thumb {
        background: transparent;
        border: transparent;
        width: .1px;
        height: .1px;
      }

      #appearance {
        height: var(--media-range-track-height, 4px);
        display: flex;
        flex-direction: column;
        justify-content: center;
        width: 100%;
        position: absolute;
        
        will-change: transform;
      }

      #track {
        background: var(--media-range-track-background, rgb(255 255 255 / .2));
        border-radius: var(--media-range-track-border-radius, 1px);
        border: var(--media-range-track-border, none);
        outline: var(--media-range-track-outline);
        outline-offset: var(--media-range-track-outline-offset);
        backdrop-filter: var(--media-range-track-backdrop-filter);
        -webkit-backdrop-filter: var(--media-range-track-backdrop-filter);
        box-shadow: var(--media-range-track-box-shadow, none);
        position: absolute;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }

      #progress,
      #pointer {
        position: absolute;
        height: 100%;
        will-change: width;
      }

      #progress {
        background: var(--media-range-bar-color, var(--media-primary-color, rgb(238 238 238)));
        transition: var(--media-range-track-transition);
      }

      #pointer {
        background: var(--media-range-track-pointer-background);
        border-right: var(--media-range-track-pointer-border-right);
        transition: visibility .25s, opacity .25s;
        visibility: hidden;
        opacity: 0;
      }

      @media (hover: hover) {
        :host(:hover) #pointer {
          transition: visibility .5s, opacity .5s;
          visibility: visible;
          opacity: 1;
        }
      }

      #thumb,
      ::slotted([slot=thumb]) {
        width: var(--media-range-thumb-width, 10px);
        height: var(--media-range-thumb-height, 10px);
        transition: var(--media-range-thumb-transition);
        transform: var(--media-range-thumb-transform, none);
        opacity: var(--media-range-thumb-opacity, 1);
        translate: -50%;
        position: absolute;
        left: 0;
        cursor: var(--media-cursor, pointer);
      }

      #thumb {
        border-radius: var(--media-range-thumb-border-radius, 10px);
        background: var(--media-range-thumb-background, var(--media-primary-color, rgb(238 238 238)));
        box-shadow: var(--media-range-thumb-box-shadow, 1px 1px 1px transparent);
        border: var(--media-range-thumb-border, none);
      }

      :host([disabled]) #thumb {
        background-color: #777;
      }

      .segments #appearance {
        height: var(--media-range-segment-hover-height, 7px);
      }

      #track {
        clip-path: url(#segments-clipping);
      }

      #segments {
        --segments-gap: var(--media-range-segments-gap, 2px);
        position: absolute;
        width: 100%;
        height: 100%;
      }

      #segments-clipping {
        transform: translateX(calc(var(--segments-gap) / 2));
      }

      #segments-clipping:empty {
        display: none;
      }

      #segments-clipping rect {
        height: var(--media-range-track-height, 4px);
        y: calc((var(--media-range-segment-hover-height, 7px) - var(--media-range-track-height, 4px)) / 2);
        transition: var(--media-range-segment-transition, transform .1s ease-in-out);
        transform: var(--media-range-segment-transform, scaleY(1));
        transform-origin: center;
      }
    </style>
    <div id="leftgap"></div>
    <div id="container">
      <div id="startpoint"></div>
      <div id="endpoint"></div>
      <div id="appearance">
        <div id="track" part="track">
          <div id="pointer"></div>
          <div id="progress" part="progress"></div>
        </div>
        <slot name="thumb">
          <div id="thumb" part="thumb"></div>
        </slot>
        <svg id="segments"><clipPath id="segments-clipping"></clipPath></svg>
      </div>
      <input id="range" type="range" min="0" max="1" step="any" value="0">

      ${this.getContainerTemplateHTML(e)}
    </div>
    <div id="rightgap"></div>
  `},iR.getContainerTemplateHTML=function(e){return""},eR.customElements.get("media-chrome-range")||eR.customElements.define("media-chrome-range",iR);var iw=(e,t,i)=>{if(!t.has(e))throw TypeError("Cannot "+i)},iC=(e,t,i)=>(iw(e,t,"read from private field"),i?i.call(e):t.get(e)),iL=(e,t,i,a)=>(iw(e,t,"write to private field"),a?a.call(e,i):t.set(e,i),i);class iM extends eR.HTMLElement{constructor(){if(super(),((e,t,i)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,i)})(this,on,void 0),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);let e=eN(this.attributes);this.shadowRoot.innerHTML=this.constructor.getTemplateHTML(e)}}static get observedAttributes(){return[j.MEDIA_CONTROLLER]}attributeChangedCallback(e,t,i){var a,r,n,s,o;e===j.MEDIA_CONTROLLER&&(t&&(null==(r=null==(a=iC(this,on))?void 0:a.unassociateElement)||r.call(a,this),iL(this,on,null)),i&&this.isConnected&&(iL(this,on,null==(n=this.getRootNode())?void 0:n.getElementById(i)),null==(o=null==(s=iC(this,on))?void 0:s.associateElement)||o.call(s,this)))}connectedCallback(){var e,t,i;let a=this.getAttribute(j.MEDIA_CONTROLLER);a&&(iL(this,on,null==(e=this.getRootNode())?void 0:e.getElementById(a)),null==(i=null==(t=iC(this,on))?void 0:t.associateElement)||i.call(t,this))}disconnectedCallback(){var e,t;null==(t=null==(e=iC(this,on))?void 0:e.unassociateElement)||t.call(e,this),iL(this,on,null)}}on=new WeakMap,iM.shadowRootOptions={mode:"open"},iM.getTemplateHTML=function(e){return`
    <style>
      :host {
        
        box-sizing: border-box;
        display: var(--media-control-display, var(--media-control-bar-display, inline-flex));
        color: var(--media-text-color, var(--media-primary-color, rgb(238 238 238)));
        --media-loading-indicator-icon-height: 44px;
      }

      ::slotted(media-time-range),
      ::slotted(media-volume-range) {
        min-height: 100%;
      }

      ::slotted(media-time-range),
      ::slotted(media-clip-selector) {
        flex-grow: 1;
      }

      ::slotted([role="menu"]) {
        position: absolute;
      }
    </style>

    <slot></slot>
  `},eR.customElements.get("media-control-bar")||eR.customElements.define("media-control-bar",iM);var iD=(e,t,i)=>{if(!t.has(e))throw TypeError("Cannot "+i)},iO=(e,t,i)=>(iD(e,t,"read from private field"),i?i.call(e):t.get(e)),iN=(e,t,i,a)=>(iD(e,t,"write to private field"),a?a.call(e,i):t.set(e,i),i);class ix extends eR.HTMLElement{constructor(){if(super(),((e,t,i)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,i)})(this,os,void 0),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);let e=eN(this.attributes);this.shadowRoot.innerHTML=this.constructor.getTemplateHTML(e)}}static get observedAttributes(){return[j.MEDIA_CONTROLLER]}attributeChangedCallback(e,t,i){var a,r,n,s,o;e===j.MEDIA_CONTROLLER&&(t&&(null==(r=null==(a=iO(this,os))?void 0:a.unassociateElement)||r.call(a,this),iN(this,os,null)),i&&this.isConnected&&(iN(this,os,null==(n=this.getRootNode())?void 0:n.getElementById(i)),null==(o=null==(s=iO(this,os))?void 0:s.associateElement)||o.call(s,this)))}connectedCallback(){var e,t,i;let{style:a}=eF(this.shadowRoot,":host");a.setProperty("display",`var(--media-control-display, var(--${this.localName}-display, inline-flex))`);let r=this.getAttribute(j.MEDIA_CONTROLLER);r&&(iN(this,os,null==(e=this.getRootNode())?void 0:e.getElementById(r)),null==(i=null==(t=iO(this,os))?void 0:t.associateElement)||i.call(t,this))}disconnectedCallback(){var e,t;null==(t=null==(e=iO(this,os))?void 0:e.unassociateElement)||t.call(e,this),iN(this,os,null)}}os=new WeakMap,ix.shadowRootOptions={mode:"open"},ix.getTemplateHTML=function(e,t={}){return`
    <style>
      :host {
        font: var(--media-font,
          var(--media-font-weight, normal)
          var(--media-font-size, 14px) /
          var(--media-text-content-height, var(--media-control-height, 24px))
          var(--media-font-family, helvetica neue, segoe ui, roboto, arial, sans-serif));
        color: var(--media-text-color, var(--media-primary-color, rgb(238 238 238)));
        background: var(--media-text-background, var(--media-control-background, var(--media-secondary-color, rgb(20 20 30 / .7))));
        padding: var(--media-control-padding, 10px);
        display: inline-flex;
        justify-content: center;
        align-items: center;
        vertical-align: middle;
        box-sizing: border-box;
        text-align: center;
        pointer-events: auto;
      }

      
      :host(:focus-visible) {
        box-shadow: inset 0 0 0 2px rgb(27 127 204 / .9);
        outline: 0;
      }

      
      :host(:where(:focus)) {
        box-shadow: none;
        outline: 0;
      }
    </style>

    ${this.getSlotTemplateHTML(e,t)}
  `},ix.getSlotTemplateHTML=function(e,t){return`
    <slot></slot>
  `},eR.customElements.get("media-text-display")||eR.customElements.define("media-text-display",ix);var iP=(e,t,i)=>{if(!t.has(e))throw TypeError("Cannot "+i)},iU=(e,t,i)=>(iP(e,t,"read from private field"),i?i.call(e):t.get(e));class iW extends ix{constructor(){var e;super(),((e,t,i)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,i)})(this,oo,void 0),((e,t,i,a)=>(iP(e,t,"write to private field"),a?a.call(e,i):t.set(e,i)))(this,oo,this.shadowRoot.querySelector("slot")),iU(this,oo).textContent=eE(null!=(e=this.mediaDuration)?e:0)}static get observedAttributes(){return[...super.observedAttributes,z.MEDIA_DURATION]}attributeChangedCallback(e,t,i){e===z.MEDIA_DURATION&&(iU(this,oo).textContent=eE(+i)),super.attributeChangedCallback(e,t,i)}get mediaDuration(){return eG(this,z.MEDIA_DURATION)}set mediaDuration(e){eq(this,z.MEDIA_DURATION,e)}}oo=new WeakMap,iW.getSlotTemplateHTML=function(e,t){return`
    <slot>${eE(t.mediaDuration)}</slot>
  `},eR.customElements.get("media-duration-display")||eR.customElements.define("media-duration-display",iW);let iB={2:eg("Network Error"),3:eg("Decode Error"),4:eg("Source Not Supported"),5:eg("Encryption Error")},iH={2:eg("A network error caused the media download to fail."),3:eg("A media error caused playback to be aborted. The media could be corrupt or your browser does not support this format."),4:eg("An unsupported error occurred. The server or network failed, or your browser does not support this format."),5:eg("The media is encrypted and there are no keys to decrypt it.")},iV=e=>{var t,i;return 1===e.code?null:{title:null!=(t=iB[e.code])?t:`Error ${e.code}`,message:null!=(i=iH[e.code])?i:e.message}};var i$=(e,t,i)=>{if(!t.has(e))throw TypeError("Cannot "+i)};function iK(e){var t;let{title:i,message:a}=null!=(t=iV(e))?t:{},r="";return i&&(r+=`<slot name="error-${e.code}-title"><h3>${i}</h3></slot>`),a&&(r+=`<slot name="error-${e.code}-message"><p>${a}</p></slot>`),r}let iF=[z.MEDIA_ERROR_CODE,z.MEDIA_ERROR_MESSAGE];class iY extends iT{constructor(){super(...arguments),((e,t,i)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,i)})(this,ol,null)}static get observedAttributes(){return[...super.observedAttributes,...iF]}formatErrorMessage(e){return this.constructor.formatErrorMessage(e)}attributeChangedCallback(e,t,i){var a;if(super.attributeChangedCallback(e,t,i),!iF.includes(e))return;let r=null!=(a=this.mediaError)?a:{code:this.mediaErrorCode,message:this.mediaErrorMessage};this.open=r.code&&null!==iV(r),this.open&&(this.shadowRoot.querySelector("slot").name=`error-${this.mediaErrorCode}`,this.shadowRoot.querySelector("#content").innerHTML=this.formatErrorMessage(r))}get mediaError(){var e,t;return i$(this,e=ol,"read from private field"),t?t.call(this):e.get(this)}set mediaError(e){var t,i;i$(this,t=ol,"write to private field"),i?i.call(this,e):t.set(this,e)}get mediaErrorCode(){return eG(this,"mediaerrorcode")}set mediaErrorCode(e){eq(this,"mediaerrorcode",e)}get mediaErrorMessage(){return eQ(this,"mediaerrormessage")}set mediaErrorMessage(e){ez(this,"mediaerrormessage",e)}}ol=new WeakMap,iY.getSlotTemplateHTML=function(e){return`
    <style>
      :host {
        background: rgb(20 20 30 / .8);
      }

      #content {
        display: block;
        padding: 1.2em 1.5em;
      }

      h3,
      p {
        margin-block: 0 .3em;
      }
    </style>
    <slot name="error-${e.mediaerrorcode}" id="content">
      ${iK({code:+e.mediaerrorcode,message:e.mediaerrormessage})}
    </slot>
  `},iY.formatErrorMessage=iK,eR.customElements.get("media-error-dialog")||eR.customElements.define("media-error-dialog",iY);var iG=(e,t,i)=>{if(!t.has(e))throw TypeError("Cannot read from private field");return i?i.call(e):t.get(e)},iq=(e,t,i)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,i)};class ij extends iT{constructor(){super(...arguments),iq(this,od,e=>{var t;if(!this.open)return;let i=null==(t=this.shadowRoot)?void 0:t.querySelector("#content");if(!i)return;let a=e.composedPath(),r=a[0]===this||a.includes(this),n=a.includes(i);r&&!n&&(this.open=!1)}),iq(this,ou,e=>{if(!this.open)return;let t=e.shiftKey&&("/"===e.key||"?"===e.key);"Escape"!==e.key&&!t||e.ctrlKey||e.altKey||e.metaKey||(this.open=!1,e.preventDefault(),e.stopPropagation())})}connectedCallback(){super.connectedCallback(),this.open&&(this.addEventListener("click",iG(this,od)),document.addEventListener("keydown",iG(this,ou)))}disconnectedCallback(){this.removeEventListener("click",iG(this,od)),document.removeEventListener("keydown",iG(this,ou))}attributeChangedCallback(e,t,i){super.attributeChangedCallback(e,t,i),"open"===e&&(this.open?(this.addEventListener("click",iG(this,od)),document.addEventListener("keydown",iG(this,ou))):(this.removeEventListener("click",iG(this,od)),document.removeEventListener("keydown",iG(this,ou))))}}od=new WeakMap,ou=new WeakMap,ij.getSlotTemplateHTML=function(e){return`
    <style>
      :host {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 9999;
        background: rgb(20 20 30 / .8);
        backdrop-filter: blur(10px);
      }

      #content {
        display: block;
        width: clamp(400px, 40vw, 700px);
        max-width: 90vw;
        text-align: left;
      }

      h2 {
        margin: 0 0 1.5rem 0;
        font-size: 1.5rem;
        font-weight: 500;
        text-align: center;
      }

      .shortcuts-table {
        width: 100%;
        border-collapse: collapse;
      }

      .shortcuts-table tr {
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .shortcuts-table tr:last-child {
        border-bottom: none;
      }

      .shortcuts-table td {
        padding: 0.75rem 0.5rem;
      }

      .shortcuts-table td:first-child {
        text-align: right;
        padding-right: 1rem;
        width: 40%;
        min-width: 120px;
      }

      .shortcuts-table td:last-child {
        padding-left: 1rem;
      }

      .key {
        display: inline-block;
        background: rgba(255, 255, 255, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        padding: 0.25rem 0.5rem;
        font-family: 'Courier New', monospace;
        font-size: 0.9rem;
        font-weight: 500;
        min-width: 1.5rem;
        text-align: center;
        margin: 0 0.2rem;
      }

      .description {
        color: rgba(255, 255, 255, 0.9);
        font-size: 0.95rem;
      }

      .key-combo {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.3rem;
      }

      .key-separator {
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.9rem;
      }
    </style>
    <slot id="content">
      ${function(){let e=[{keys:["Space","k"],description:"Toggle Playback"},{keys:["m"],description:"Toggle mute"},{keys:["f"],description:"Toggle fullscreen"},{keys:["c"],description:"Toggle captions or subtitles, if available"},{keys:["p"],description:"Toggle Picture in Picture"},{keys:["←","j"],description:"Seek back 10s"},{keys:["→","l"],description:"Seek forward 10s"},{keys:["↑"],description:"Turn volume up"},{keys:["↓"],description:"Turn volume down"},{keys:["< (SHIFT+,)"],description:"Decrease playback rate"},{keys:["> (SHIFT+.)"],description:"Increase playback rate"}].map(({keys:e,description:t})=>{let i=e.map((e,t)=>t>0?`<span class="key-separator">or</span><span class="key">${e}</span>`:`<span class="key">${e}</span>`).join("");return`
      <tr>
        <td>
          <div class="key-combo">${i}</div>
        </td>
        <td class="description">${t}</td>
      </tr>
    `}).join("");return`
    <h2>Keyboard Shortcuts</h2>
    <table class="shortcuts-table">${e}</table>
  `}()}
    </slot>
  `},eR.customElements.get("media-keyboard-shortcuts-dialog")||eR.customElements.define("media-keyboard-shortcuts-dialog",ij);var iZ=(e,t,i)=>{if(!t.has(e))throw TypeError("Cannot "+i)};let iQ=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M16 3v2.5h3.5V9H22V3h-6ZM4 9h2.5V5.5H10V3H4v6Zm15.5 9.5H16V21h6v-6h-2.5v3.5ZM6.5 15H4v6h6v-2.5H6.5V15Z"/>
</svg>`,iz=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M18.5 6.5V3H16v6h6V6.5h-3.5ZM16 21h2.5v-3.5H22V15h-6v6ZM4 17.5h3.5V21H10v-6H4v2.5Zm3.5-11H4V9h6V3H7.5v3.5Z"/>
</svg>`,iX=e=>{let t=e.mediaIsFullscreen?eg("exit fullscreen mode"):eg("enter fullscreen mode");e.setAttribute("aria-label",t)};class iJ extends it{constructor(){super(...arguments),((e,t,i)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,i)})(this,oh,null)}static get observedAttributes(){return[...super.observedAttributes,z.MEDIA_IS_FULLSCREEN,z.MEDIA_FULLSCREEN_UNAVAILABLE]}connectedCallback(){super.connectedCallback(),iX(this)}attributeChangedCallback(e,t,i){super.attributeChangedCallback(e,t,i),e===z.MEDIA_IS_FULLSCREEN&&iX(this)}get mediaFullscreenUnavailable(){return eQ(this,z.MEDIA_FULLSCREEN_UNAVAILABLE)}set mediaFullscreenUnavailable(e){ez(this,z.MEDIA_FULLSCREEN_UNAVAILABLE,e)}get mediaIsFullscreen(){return ej(this,z.MEDIA_IS_FULLSCREEN)}set mediaIsFullscreen(e){eZ(this,z.MEDIA_IS_FULLSCREEN,e)}handleClick(e){var t,i,a,r;iZ(this,t=oh,"write to private field"),i?i.call(this,e):t.set(this,e);let n=(iZ(this,a=oh,"read from private field"),(r?r.call(this):a.get(this))instanceof PointerEvent),s=this.mediaIsFullscreen?new eR.CustomEvent(q.MEDIA_EXIT_FULLSCREEN_REQUEST,{composed:!0,bubbles:!0}):new eR.CustomEvent(q.MEDIA_ENTER_FULLSCREEN_REQUEST,{composed:!0,bubbles:!0,detail:n});this.dispatchEvent(s)}}oh=new WeakMap,iJ.getSlotTemplateHTML=function(e){return`
    <style>
      :host([${z.MEDIA_IS_FULLSCREEN}]) slot[name=icon] slot:not([name=exit]) {
        display: none !important;
      }

      
      :host(:not([${z.MEDIA_IS_FULLSCREEN}])) slot[name=icon] slot:not([name=enter]) {
        display: none !important;
      }

      :host([${z.MEDIA_IS_FULLSCREEN}]) slot[name=tooltip-enter],
      :host(:not([${z.MEDIA_IS_FULLSCREEN}])) slot[name=tooltip-exit] {
        display: none;
      }
    </style>

    <slot name="icon">
      <slot name="enter">${iQ}</slot>
      <slot name="exit">${iz}</slot>
    </slot>
  `},iJ.getTooltipContentHTML=function(){return`
    <slot name="tooltip-enter">${eg("Enter fullscreen mode")}</slot>
    <slot name="tooltip-exit">${eg("Exit fullscreen mode")}</slot>
  `},eR.customElements.get("media-fullscreen-button")||eR.customElements.define("media-fullscreen-button",iJ);let{MEDIA_TIME_IS_LIVE:i0,MEDIA_PAUSED:i1}=z,{MEDIA_SEEK_TO_LIVE_REQUEST:i2,MEDIA_PLAY_REQUEST:i3}=q,i4=e=>{var t;let i=e.mediaPaused||!e.mediaTimeIsLive,a=i?eg("seek to live"):eg("playing live");e.setAttribute("aria-label",a);let r=null==(t=e.shadowRoot)?void 0:t.querySelector('slot[name="text"]');r&&(r.textContent=eg("live")),i?e.removeAttribute("aria-disabled"):e.setAttribute("aria-disabled","true")};class i5 extends it{static get observedAttributes(){return[...super.observedAttributes,i0,i1]}connectedCallback(){super.connectedCallback(),i4(this)}attributeChangedCallback(e,t,i){super.attributeChangedCallback(e,t,i),i4(this)}get mediaPaused(){return ej(this,z.MEDIA_PAUSED)}set mediaPaused(e){eZ(this,z.MEDIA_PAUSED,e)}get mediaTimeIsLive(){return ej(this,z.MEDIA_TIME_IS_LIVE)}set mediaTimeIsLive(e){eZ(this,z.MEDIA_TIME_IS_LIVE,e)}handleClick(){(this.mediaPaused||!this.mediaTimeIsLive)&&(this.dispatchEvent(new eR.CustomEvent(i2,{composed:!0,bubbles:!0})),this.hasAttribute(i1)&&this.dispatchEvent(new eR.CustomEvent(i3,{composed:!0,bubbles:!0})))}}i5.getSlotTemplateHTML=function(e){return`
    <style>
      :host { --media-tooltip-display: none; }
      
      slot[name=indicator] > *,
      :host ::slotted([slot=indicator]) {
        
        min-width: auto;
        fill: var(--media-live-button-icon-color, rgb(140, 140, 140));
        color: var(--media-live-button-icon-color, rgb(140, 140, 140));
      }

      :host([${i0}]:not([${i1}])) slot[name=indicator] > *,
      :host([${i0}]:not([${i1}])) ::slotted([slot=indicator]) {
        fill: var(--media-live-button-indicator-color, rgb(255, 0, 0));
        color: var(--media-live-button-indicator-color, rgb(255, 0, 0));
      }

      :host([${i0}]:not([${i1}])) {
        cursor: var(--media-cursor, not-allowed);
      }

      slot[name=text]{
        text-transform: uppercase;
      }

    </style>

    <slot name="indicator"><svg viewBox="0 0 6 12"><circle cx="3" cy="6" r="2"></circle></svg></slot>
    
    <slot name="spacer">&nbsp;</slot><slot name="text">${eg("live")}</slot>
  `},eR.customElements.get("media-live-button")||eR.customElements.define("media-live-button",i5);var i9=(e,t,i)=>{if(!t.has(e))throw TypeError("Cannot "+i)},i8=(e,t,i)=>(i9(e,t,"read from private field"),i?i.call(e):t.get(e)),i6=(e,t,i)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,i)},i7=(e,t,i,a)=>(i9(e,t,"write to private field"),a?a.call(e,i):t.set(e,i),i);let ae={LOADING_DELAY:"loadingdelay",NO_AUTOHIDE:"noautohide"},at=`
<svg aria-hidden="true" viewBox="0 0 100 100">
  <path d="M73,50c0-12.7-10.3-23-23-23S27,37.3,27,50 M30.9,50c0-10.5,8.5-19.1,19.1-19.1S69.1,39.5,69.1,50">
    <animateTransform
       attributeName="transform"
       attributeType="XML"
       type="rotate"
       dur="1s"
       from="0 50 50"
       to="360 50 50"
       repeatCount="indefinite" />
  </path>
</svg>
`;class ai extends eR.HTMLElement{constructor(){if(super(),i6(this,om,void 0),i6(this,oc,500),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);let e=eN(this.attributes);this.shadowRoot.innerHTML=this.constructor.getTemplateHTML(e)}}static get observedAttributes(){return[j.MEDIA_CONTROLLER,z.MEDIA_PAUSED,z.MEDIA_LOADING,ae.LOADING_DELAY]}attributeChangedCallback(e,t,i){var a,r,n,s,o;e===ae.LOADING_DELAY&&t!==i?this.loadingDelay=Number(i):e===j.MEDIA_CONTROLLER&&(t&&(null==(r=null==(a=i8(this,om))?void 0:a.unassociateElement)||r.call(a,this),i7(this,om,null)),i&&this.isConnected&&(i7(this,om,null==(n=this.getRootNode())?void 0:n.getElementById(i)),null==(o=null==(s=i8(this,om))?void 0:s.associateElement)||o.call(s,this)))}connectedCallback(){var e,t,i;let a=this.getAttribute(j.MEDIA_CONTROLLER);a&&(i7(this,om,null==(e=this.getRootNode())?void 0:e.getElementById(a)),null==(i=null==(t=i8(this,om))?void 0:t.associateElement)||i.call(t,this))}disconnectedCallback(){var e,t;null==(t=null==(e=i8(this,om))?void 0:e.unassociateElement)||t.call(e,this),i7(this,om,null)}get loadingDelay(){return i8(this,oc)}set loadingDelay(e){i7(this,oc,e);let{style:t}=eF(this.shadowRoot,":host");t.setProperty("--_loading-indicator-delay",`var(--media-loading-indicator-transition-delay, ${e}ms)`)}get mediaPaused(){return ej(this,z.MEDIA_PAUSED)}set mediaPaused(e){eZ(this,z.MEDIA_PAUSED,e)}get mediaLoading(){return ej(this,z.MEDIA_LOADING)}set mediaLoading(e){eZ(this,z.MEDIA_LOADING,e)}get mediaController(){return eQ(this,j.MEDIA_CONTROLLER)}set mediaController(e){ez(this,j.MEDIA_CONTROLLER,e)}get noAutohide(){return ej(this,ae.NO_AUTOHIDE)}set noAutohide(e){eZ(this,ae.NO_AUTOHIDE,e)}}om=new WeakMap,oc=new WeakMap,ai.shadowRootOptions={mode:"open"},ai.getTemplateHTML=function(e){return`
    <style>
      :host {
        display: var(--media-control-display, var(--media-loading-indicator-display, inline-block));
        vertical-align: middle;
        box-sizing: border-box;
        --_loading-indicator-delay: var(--media-loading-indicator-transition-delay, 500ms);
      }

      #status {
        color: rgba(0,0,0,0);
        width: 0px;
        height: 0px;
      }

      :host slot[name=icon] > *,
      :host ::slotted([slot=icon]) {
        opacity: var(--media-loading-indicator-opacity, 0);
        transition: opacity 0.15s;
      }

      :host([${z.MEDIA_LOADING}]:not([${z.MEDIA_PAUSED}])) slot[name=icon] > *,
      :host([${z.MEDIA_LOADING}]:not([${z.MEDIA_PAUSED}])) ::slotted([slot=icon]) {
        opacity: var(--media-loading-indicator-opacity, 1);
        transition: opacity 0.15s var(--_loading-indicator-delay);
      }

      :host #status {
        visibility: var(--media-loading-indicator-opacity, hidden);
        transition: visibility 0.15s;
      }

      :host([${z.MEDIA_LOADING}]:not([${z.MEDIA_PAUSED}])) #status {
        visibility: var(--media-loading-indicator-opacity, visible);
        transition: visibility 0.15s var(--_loading-indicator-delay);
      }

      svg, img, ::slotted(svg), ::slotted(img) {
        width: var(--media-loading-indicator-icon-width);
        height: var(--media-loading-indicator-icon-height, 100px);
        fill: var(--media-icon-color, var(--media-primary-color, rgb(238 238 238)));
        vertical-align: middle;
      }
    </style>

    <slot name="icon">${at}</slot>
    <div id="status" role="status" aria-live="polite">${eg("media loading")}</div>
  `},eR.customElements.get("media-loading-indicator")||eR.customElements.define("media-loading-indicator",ai);let aa=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M16.5 12A4.5 4.5 0 0 0 14 8v2.18l2.45 2.45a4.22 4.22 0 0 0 .05-.63Zm2.5 0a6.84 6.84 0 0 1-.54 2.64L20 16.15A8.8 8.8 0 0 0 21 12a9 9 0 0 0-7-8.77v2.06A7 7 0 0 1 19 12ZM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25A6.92 6.92 0 0 1 14 18.7v2.06A9 9 0 0 0 17.69 19l2 2.05L21 19.73l-9-9L4.27 3ZM12 4 9.91 6.09 12 8.18V4Z"/>
</svg>`,ar=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M3 9v6h4l5 5V4L7 9H3Zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.47 4.47 0 0 0 2.5-4Z"/>
</svg>`,an=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M3 9v6h4l5 5V4L7 9H3Zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.47 4.47 0 0 0 2.5-4ZM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06a9 9 0 0 0 0-17.54Z"/>
</svg>`,as=e=>{let t="off"===e.mediaVolumeLevel?eg("unmute"):eg("mute");e.setAttribute("aria-label",t)};class ao extends it{static get observedAttributes(){return[...super.observedAttributes,z.MEDIA_VOLUME_LEVEL]}connectedCallback(){super.connectedCallback(),as(this)}attributeChangedCallback(e,t,i){super.attributeChangedCallback(e,t,i),e===z.MEDIA_VOLUME_LEVEL&&as(this)}get mediaVolumeLevel(){return eQ(this,z.MEDIA_VOLUME_LEVEL)}set mediaVolumeLevel(e){ez(this,z.MEDIA_VOLUME_LEVEL,e)}handleClick(){let e="off"===this.mediaVolumeLevel?q.MEDIA_UNMUTE_REQUEST:q.MEDIA_MUTE_REQUEST;this.dispatchEvent(new eR.CustomEvent(e,{composed:!0,bubbles:!0}))}}ao.getSlotTemplateHTML=function(e){return`
    <style>
      :host(:not([${z.MEDIA_VOLUME_LEVEL}])) slot[name=icon] slot:not([name=high]),
      :host([${z.MEDIA_VOLUME_LEVEL}=high]) slot[name=icon] slot:not([name=high]) {
        display: none !important;
      }

      :host([${z.MEDIA_VOLUME_LEVEL}=off]) slot[name=icon] slot:not([name=off]) {
        display: none !important;
      }

      :host([${z.MEDIA_VOLUME_LEVEL}=low]) slot[name=icon] slot:not([name=low]) {
        display: none !important;
      }

      :host([${z.MEDIA_VOLUME_LEVEL}=medium]) slot[name=icon] slot:not([name=medium]) {
        display: none !important;
      }

      :host(:not([${z.MEDIA_VOLUME_LEVEL}=off])) slot[name=tooltip-unmute],
      :host([${z.MEDIA_VOLUME_LEVEL}=off]) slot[name=tooltip-mute] {
        display: none;
      }
    </style>

    <slot name="icon">
      <slot name="off">${aa}</slot>
      <slot name="low">${ar}</slot>
      <slot name="medium">${ar}</slot>
      <slot name="high">${an}</slot>
    </slot>
  `},ao.getTooltipContentHTML=function(){return`
    <slot name="tooltip-mute">${eg("Mute")}</slot>
    <slot name="tooltip-unmute">${eg("Unmute")}</slot>
  `},eR.customElements.get("media-mute-button")||eR.customElements.define("media-mute-button",ao);let al=`<svg aria-hidden="true" viewBox="0 0 28 24">
  <path d="M24 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h20a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1Zm-1 16H5V5h18v14Zm-3-8h-7v5h7v-5Z"/>
</svg>`,ad=e=>{let t=e.mediaIsPip?eg("exit picture in picture mode"):eg("enter picture in picture mode");e.setAttribute("aria-label",t)};class au extends it{static get observedAttributes(){return[...super.observedAttributes,z.MEDIA_IS_PIP,z.MEDIA_PIP_UNAVAILABLE]}connectedCallback(){super.connectedCallback(),ad(this)}attributeChangedCallback(e,t,i){super.attributeChangedCallback(e,t,i),e===z.MEDIA_IS_PIP&&ad(this)}get mediaPipUnavailable(){return eQ(this,z.MEDIA_PIP_UNAVAILABLE)}set mediaPipUnavailable(e){ez(this,z.MEDIA_PIP_UNAVAILABLE,e)}get mediaIsPip(){return ej(this,z.MEDIA_IS_PIP)}set mediaIsPip(e){eZ(this,z.MEDIA_IS_PIP,e)}handleClick(){let e=this.mediaIsPip?q.MEDIA_EXIT_PIP_REQUEST:q.MEDIA_ENTER_PIP_REQUEST;this.dispatchEvent(new eR.CustomEvent(e,{composed:!0,bubbles:!0}))}}au.getSlotTemplateHTML=function(e){return`
    <style>
      :host([${z.MEDIA_IS_PIP}]) slot[name=icon] slot:not([name=exit]) {
        display: none !important;
      }

      :host(:not([${z.MEDIA_IS_PIP}])) slot[name=icon] slot:not([name=enter]) {
        display: none !important;
      }

      :host([${z.MEDIA_IS_PIP}]) slot[name=tooltip-enter],
      :host(:not([${z.MEDIA_IS_PIP}])) slot[name=tooltip-exit] {
        display: none;
      }
    </style>

    <slot name="icon">
      <slot name="enter">${al}</slot>
      <slot name="exit">${al}</slot>
    </slot>
  `},au.getTooltipContentHTML=function(){return`
    <slot name="tooltip-enter">${eg("Enter picture in picture mode")}</slot>
    <slot name="tooltip-exit">${eg("Exit picture in picture mode")}</slot>
  `},eR.customElements.get("media-pip-button")||eR.customElements.define("media-pip-button",au);var ah=(e,t,i)=>{if(!t.has(e))throw TypeError("Cannot read from private field");return i?i.call(e):t.get(e)};let am={RATES:"rates"},ac=[1,1.2,1.5,1.7,2];class ap extends it{constructor(){var e;super(),((e,t,i)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,i)})(this,op,new tn(this,am.RATES,{defaultValue:ac})),this.container=this.shadowRoot.querySelector('slot[name="icon"]'),this.container.innerHTML=`${null!=(e=this.mediaPlaybackRate)?e:1}x`}static get observedAttributes(){return[...super.observedAttributes,z.MEDIA_PLAYBACK_RATE,am.RATES]}attributeChangedCallback(e,t,i){if(super.attributeChangedCallback(e,t,i),e===am.RATES&&(ah(this,op).value=i),e===z.MEDIA_PLAYBACK_RATE){let e=i?+i:NaN,t=Number.isNaN(e)?1:e;this.container.innerHTML=`${t}x`,this.setAttribute("aria-label",eg("Playback rate {playbackRate}",{playbackRate:t}))}}get rates(){return ah(this,op)}set rates(e){e?Array.isArray(e)?ah(this,op).value=e.join(" "):"string"==typeof e&&(ah(this,op).value=e):ah(this,op).value=""}get mediaPlaybackRate(){return eG(this,z.MEDIA_PLAYBACK_RATE,1)}set mediaPlaybackRate(e){eq(this,z.MEDIA_PLAYBACK_RATE,e)}handleClick(){var e,t;let i=Array.from(ah(this,op).values(),e=>+e).sort((e,t)=>e-t),a=null!=(t=null!=(e=i.find(e=>e>this.mediaPlaybackRate))?e:i[0])?t:1,r=new eR.CustomEvent(q.MEDIA_PLAYBACK_RATE_REQUEST,{composed:!0,bubbles:!0,detail:a});this.dispatchEvent(r)}}op=new WeakMap,ap.getSlotTemplateHTML=function(e){return`
    <style>
      :host {
        min-width: 5ch;
        padding: var(--media-button-padding, var(--media-control-padding, 10px 5px));
      }
    </style>
    <slot name="icon">${e.mediaplaybackrate||1}x</slot>
  `},ap.getTooltipContentHTML=function(){return eg("Playback rate")},eR.customElements.get("media-playback-rate-button")||eR.customElements.define("media-playback-rate-button",ap);let aE=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="m6 21 15-9L6 3v18Z"/>
</svg>`,av=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M6 20h4V4H6v16Zm8-16v16h4V4h-4Z"/>
</svg>`,ab=e=>{let t=e.mediaPaused?eg("play"):eg("pause");e.setAttribute("aria-label",t)};class ag extends it{static get observedAttributes(){return[...super.observedAttributes,z.MEDIA_PAUSED,z.MEDIA_ENDED]}connectedCallback(){super.connectedCallback(),ab(this)}attributeChangedCallback(e,t,i){super.attributeChangedCallback(e,t,i),(e===z.MEDIA_PAUSED||e===z.MEDIA_LANG)&&ab(this)}get mediaPaused(){return ej(this,z.MEDIA_PAUSED)}set mediaPaused(e){eZ(this,z.MEDIA_PAUSED,e)}handleClick(){let e=this.mediaPaused?q.MEDIA_PLAY_REQUEST:q.MEDIA_PAUSE_REQUEST;this.dispatchEvent(new eR.CustomEvent(e,{composed:!0,bubbles:!0}))}}ag.getSlotTemplateHTML=function(e){return`
    <style>
      :host([${z.MEDIA_PAUSED}]) slot[name=pause],
      :host(:not([${z.MEDIA_PAUSED}])) slot[name=play] {
        display: none !important;
      }

      :host([${z.MEDIA_PAUSED}]) slot[name=tooltip-pause],
      :host(:not([${z.MEDIA_PAUSED}])) slot[name=tooltip-play] {
        display: none;
      }
    </style>

    <slot name="icon">
      <slot name="play">${aE}</slot>
      <slot name="pause">${av}</slot>
    </slot>
  `},ag.getTooltipContentHTML=function(){return`
    <slot name="tooltip-play">${eg("Play")}</slot>
    <slot name="tooltip-pause">${eg("Pause")}</slot>
  `},eR.customElements.get("media-play-button")||eR.customElements.define("media-play-button",ag);let af={PLACEHOLDER_SRC:"placeholdersrc",SRC:"src"};class aA extends eR.HTMLElement{static get observedAttributes(){return[af.PLACEHOLDER_SRC,af.SRC]}constructor(){if(super(),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);let e=eN(this.attributes);this.shadowRoot.innerHTML=this.constructor.getTemplateHTML(e)}this.image=this.shadowRoot.querySelector("#image")}attributeChangedCallback(e,t,i){if(e===af.SRC&&(null==i?this.image.removeAttribute(af.SRC):this.image.setAttribute(af.SRC,i)),e===af.PLACEHOLDER_SRC)if(null==i)this.image.style.removeProperty("background-image");else{var a;a=this.image,a.style["background-image"]=`url('${i}')`}}get placeholderSrc(){return eQ(this,af.PLACEHOLDER_SRC)}set placeholderSrc(e){ez(this,af.SRC,e)}get src(){return eQ(this,af.SRC)}set src(e){ez(this,af.SRC,e)}}aA.shadowRootOptions={mode:"open"},aA.getTemplateHTML=function(e){return`
    <style>
      :host {
        pointer-events: none;
        display: var(--media-poster-image-display, inline-block);
        box-sizing: border-box;
      }

      img {
        max-width: 100%;
        max-height: 100%;
        min-width: 100%;
        min-height: 100%;
        background-repeat: no-repeat;
        background-position: var(--media-poster-image-background-position, var(--media-object-position, center));
        background-size: var(--media-poster-image-background-size, var(--media-object-fit, contain));
        object-fit: var(--media-object-fit, contain);
        object-position: var(--media-object-position, center);
      }
    </style>

    <img part="poster img" aria-hidden="true" id="image"/>
  `},eR.customElements.get("media-poster-image")||eR.customElements.define("media-poster-image",aA);var aT=(e,t,i)=>{if(!t.has(e))throw TypeError("Cannot "+i)};class ay extends ix{constructor(){super(),((e,t,i)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,i)})(this,oE,void 0),((e,t,i,a)=>(aT(e,t,"write to private field"),a?a.call(e,i):t.set(e,i)))(this,oE,this.shadowRoot.querySelector("slot"))}static get observedAttributes(){return[...super.observedAttributes,z.MEDIA_PREVIEW_CHAPTER,z.MEDIA_LANG]}attributeChangedCallback(e,t,i){if(super.attributeChangedCallback(e,t,i),(e===z.MEDIA_PREVIEW_CHAPTER||e===z.MEDIA_LANG)&&i!==t&&null!=i){var a,r;if((aT(this,a=oE,"read from private field"),r?r.call(this):a.get(this)).textContent=i,""!==i){let e=eg("chapter: {chapterName}",{chapterName:i});this.setAttribute("aria-valuetext",e)}else this.removeAttribute("aria-valuetext")}}get mediaPreviewChapter(){return eQ(this,z.MEDIA_PREVIEW_CHAPTER)}set mediaPreviewChapter(e){ez(this,z.MEDIA_PREVIEW_CHAPTER,e)}}oE=new WeakMap,eR.customElements.get("media-preview-chapter-display")||eR.customElements.define("media-preview-chapter-display",ay);var a_=(e,t,i)=>{if(!t.has(e))throw TypeError("Cannot "+i)},ak=(e,t,i)=>(a_(e,t,"read from private field"),i?i.call(e):t.get(e)),aI=(e,t,i,a)=>(a_(e,t,"write to private field"),a?a.call(e,i):t.set(e,i),i);class aS extends eR.HTMLElement{constructor(){if(super(),((e,t,i)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,i)})(this,ov,void 0),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);let e=eN(this.attributes);this.shadowRoot.innerHTML=this.constructor.getTemplateHTML(e)}}static get observedAttributes(){return[j.MEDIA_CONTROLLER,z.MEDIA_PREVIEW_IMAGE,z.MEDIA_PREVIEW_COORDS]}connectedCallback(){var e,t,i;let a=this.getAttribute(j.MEDIA_CONTROLLER);a&&(aI(this,ov,null==(e=this.getRootNode())?void 0:e.getElementById(a)),null==(i=null==(t=ak(this,ov))?void 0:t.associateElement)||i.call(t,this))}disconnectedCallback(){var e,t;null==(t=null==(e=ak(this,ov))?void 0:e.unassociateElement)||t.call(e,this),aI(this,ov,null)}attributeChangedCallback(e,t,i){var a,r,n,s,o;[z.MEDIA_PREVIEW_IMAGE,z.MEDIA_PREVIEW_COORDS].includes(e)&&this.update(),e===j.MEDIA_CONTROLLER&&(t&&(null==(r=null==(a=ak(this,ov))?void 0:a.unassociateElement)||r.call(a,this),aI(this,ov,null)),i&&this.isConnected&&(aI(this,ov,null==(n=this.getRootNode())?void 0:n.getElementById(i)),null==(o=null==(s=ak(this,ov))?void 0:s.associateElement)||o.call(s,this)))}get mediaPreviewImage(){return eQ(this,z.MEDIA_PREVIEW_IMAGE)}set mediaPreviewImage(e){ez(this,z.MEDIA_PREVIEW_IMAGE,e)}get mediaPreviewCoords(){let e=this.getAttribute(z.MEDIA_PREVIEW_COORDS);if(e)return e.split(/\s+/).map(e=>+e)}set mediaPreviewCoords(e){if(!e)return void this.removeAttribute(z.MEDIA_PREVIEW_COORDS);this.setAttribute(z.MEDIA_PREVIEW_COORDS,e.join(" "))}update(){let e=this.mediaPreviewCoords,t=this.mediaPreviewImage;if(!(e&&t))return;let[i,a,r,n]=e,s=t.split("#")[0],{maxWidth:o,maxHeight:l,minWidth:d,minHeight:u}=getComputedStyle(this),h=Math.min(parseInt(o)/r,parseInt(l)/n),m=Math.max(parseInt(d)/r,parseInt(u)/n),c=h<1,p=c?h:m>1?m:1,{style:E}=eF(this.shadowRoot,":host"),v=eF(this.shadowRoot,"img").style,b=this.shadowRoot.querySelector("img"),g=c?"min":"max";E.setProperty(`${g}-width`,"initial","important"),E.setProperty(`${g}-height`,"initial","important"),E.width=`${r*p}px`,E.height=`${n*p}px`;let f=()=>{v.width=`${this.imgWidth*p}px`,v.height=`${this.imgHeight*p}px`,v.display="block"};b.src!==s&&(b.onload=()=>{this.imgWidth=b.naturalWidth,this.imgHeight=b.naturalHeight,f()},b.src=s,f()),f(),v.transform=`translate(-${i*p}px, -${a*p}px)`}}ov=new WeakMap,aS.shadowRootOptions={mode:"open"},aS.getTemplateHTML=function(e){return`
    <style>
      :host {
        box-sizing: border-box;
        display: var(--media-control-display, var(--media-preview-thumbnail-display, inline-block));
        overflow: hidden;
      }

      img {
        display: none;
        position: relative;
      }
    </style>
    <img crossorigin loading="eager" decoding="async">
  `},eR.customElements.get("media-preview-thumbnail")||eR.customElements.define("media-preview-thumbnail",aS);var aR=(e,t,i)=>{if(!t.has(e))throw TypeError("Cannot "+i)},aw=(e,t,i)=>(aR(e,t,"read from private field"),i?i.call(e):t.get(e));class aC extends ix{constructor(){super(),((e,t,i)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,i)})(this,ob,void 0),((e,t,i,a)=>(aR(e,t,"write to private field"),a?a.call(e,i):t.set(e,i)))(this,ob,this.shadowRoot.querySelector("slot")),aw(this,ob).textContent=eE(0)}static get observedAttributes(){return[...super.observedAttributes,z.MEDIA_PREVIEW_TIME]}attributeChangedCallback(e,t,i){super.attributeChangedCallback(e,t,i),e===z.MEDIA_PREVIEW_TIME&&null!=i&&(aw(this,ob).textContent=eE(parseFloat(i)))}get mediaPreviewTime(){return eG(this,z.MEDIA_PREVIEW_TIME)}set mediaPreviewTime(e){eq(this,z.MEDIA_PREVIEW_TIME,e)}}ob=new WeakMap,eR.customElements.get("media-preview-time-display")||eR.customElements.define("media-preview-time-display",aC);let aL={SEEK_OFFSET:"seekoffset"};class aM extends it{static get observedAttributes(){return[...super.observedAttributes,z.MEDIA_CURRENT_TIME,aL.SEEK_OFFSET]}connectedCallback(){super.connectedCallback(),this.seekOffset=eG(this,aL.SEEK_OFFSET,30)}attributeChangedCallback(e,t,i){super.attributeChangedCallback(e,t,i),e===aL.SEEK_OFFSET&&(this.seekOffset=eG(this,aL.SEEK_OFFSET,30))}get seekOffset(){return eG(this,aL.SEEK_OFFSET,30)}set seekOffset(e){eq(this,aL.SEEK_OFFSET,e),this.setAttribute("aria-label",eg("seek back {seekOffset} seconds",{seekOffset:this.seekOffset})),eU(eW(this,"icon"),this.seekOffset)}get mediaCurrentTime(){return eG(this,z.MEDIA_CURRENT_TIME,0)}set mediaCurrentTime(e){eq(this,z.MEDIA_CURRENT_TIME,e)}handleClick(){let e=Math.max(this.mediaCurrentTime-this.seekOffset,0),t=new eR.CustomEvent(q.MEDIA_SEEK_REQUEST,{composed:!0,bubbles:!0,detail:e});this.dispatchEvent(t)}}aM.getSlotTemplateHTML=function(e,t){let i;return`
    <slot name="icon">${i=t.seekOffset,`
  <svg aria-hidden="true" viewBox="0 0 20 24">
    <defs>
      <style>.text{font-size:8px;font-family:Arial-BoldMT, Arial;font-weight:700;}</style>
    </defs>
    <text class="text value" transform="translate(2.18 19.87)">${i}</text>
    <path d="M10 6V3L4.37 7 10 10.94V8a5.54 5.54 0 0 1 1.9 10.48v2.12A7.5 7.5 0 0 0 10 6Z"/>
  </svg>`}</slot>
  `},aM.getTooltipContentHTML=function(){return eg("Seek backward")},eR.customElements.get("media-seek-backward-button")||eR.customElements.define("media-seek-backward-button",aM);let aD={SEEK_OFFSET:"seekoffset"};class aO extends it{static get observedAttributes(){return[...super.observedAttributes,z.MEDIA_CURRENT_TIME,aD.SEEK_OFFSET]}connectedCallback(){super.connectedCallback(),this.seekOffset=eG(this,aD.SEEK_OFFSET,30)}attributeChangedCallback(e,t,i){super.attributeChangedCallback(e,t,i),e===aD.SEEK_OFFSET&&(this.seekOffset=eG(this,aD.SEEK_OFFSET,30))}get seekOffset(){return eG(this,aD.SEEK_OFFSET,30)}set seekOffset(e){eq(this,aD.SEEK_OFFSET,e),this.setAttribute("aria-label",eg("seek forward {seekOffset} seconds",{seekOffset:this.seekOffset})),eU(eW(this,"icon"),this.seekOffset)}get mediaCurrentTime(){return eG(this,z.MEDIA_CURRENT_TIME,0)}set mediaCurrentTime(e){eq(this,z.MEDIA_CURRENT_TIME,e)}handleClick(){let e=this.mediaCurrentTime+this.seekOffset,t=new eR.CustomEvent(q.MEDIA_SEEK_REQUEST,{composed:!0,bubbles:!0,detail:e});this.dispatchEvent(t)}}aO.getSlotTemplateHTML=function(e,t){let i;return`
    <slot name="icon">${i=t.seekOffset,`
  <svg aria-hidden="true" viewBox="0 0 20 24">
    <defs>
      <style>.text{font-size:8px;font-family:Arial-BoldMT, Arial;font-weight:700;}</style>
    </defs>
    <text class="text value" transform="translate(8.9 19.87)">${i}</text>
    <path d="M10 6V3l5.61 4L10 10.94V8a5.54 5.54 0 0 0-1.9 10.48v2.12A7.5 7.5 0 0 1 10 6Z"/>
  </svg>`}</slot>
  `},aO.getTooltipContentHTML=function(){return eg("Seek forward")},eR.customElements.get("media-seek-forward-button")||eR.customElements.define("media-seek-forward-button",aO);var aN=(e,t,i)=>{if(!t.has(e))throw TypeError("Cannot "+i)},ax=(e,t,i)=>(aN(e,t,"read from private field"),i?i.call(e):t.get(e));let aP={REMAINING:"remaining",SHOW_DURATION:"showduration",NO_TOGGLE:"notoggle"},aU=[...Object.values(aP),z.MEDIA_CURRENT_TIME,z.MEDIA_DURATION,z.MEDIA_SEEKABLE],aW=["Enter"," "],aB="&nbsp;/&nbsp;",aH=(e,{timesSep:t=aB}={})=>{var i,a;let r=null!=(i=e.mediaCurrentTime)?i:0,[,n]=null!=(a=e.mediaSeekable)?a:[],s=0;Number.isFinite(e.mediaDuration)?s=e.mediaDuration:Number.isFinite(n)&&(s=n);let o=e.remaining?eE(0-(s-r)):eE(r);return e.showDuration?`${o}${t}${eE(s)}`:o};class aV extends ix{constructor(){super(),((e,t,i)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,i)})(this,og,void 0),((e,t,i,a)=>(aN(e,t,"write to private field"),a?a.call(e,i):t.set(e,i)))(this,og,this.shadowRoot.querySelector("slot")),ax(this,og).innerHTML=`${aH(this)}`}static get observedAttributes(){return[...super.observedAttributes,...aU,"disabled"]}connectedCallback(){let{style:e}=eF(this.shadowRoot,":host(:hover:not([notoggle]))");e.setProperty("cursor","var(--media-cursor, pointer)"),e.setProperty("background","var(--media-control-hover-background, rgba(50 50 70 / .7))"),this.hasAttribute("disabled")||this.enable(),this.setAttribute("role","progressbar"),this.setAttribute("aria-label",eg("playback time"));let t=e=>{let{key:i}=e;if(!aW.includes(i))return void this.removeEventListener("keyup",t);this.toggleTimeDisplay()};this.addEventListener("keydown",e=>{let{metaKey:i,altKey:a,key:r}=e;if(i||a||!aW.includes(r))return void this.removeEventListener("keyup",t);this.addEventListener("keyup",t)}),this.addEventListener("click",this.toggleTimeDisplay),super.connectedCallback()}toggleTimeDisplay(){this.noToggle||(this.hasAttribute("remaining")?this.removeAttribute("remaining"):this.setAttribute("remaining",""))}disconnectedCallback(){this.disable(),super.disconnectedCallback()}attributeChangedCallback(e,t,i){aU.includes(e)?this.update():"disabled"===e&&i!==t&&(null==i?this.enable():this.disable()),super.attributeChangedCallback(e,t,i)}enable(){this.tabIndex=0}disable(){this.tabIndex=-1}get remaining(){return ej(this,aP.REMAINING)}set remaining(e){eZ(this,aP.REMAINING,e)}get showDuration(){return ej(this,aP.SHOW_DURATION)}set showDuration(e){eZ(this,aP.SHOW_DURATION,e)}get noToggle(){return ej(this,aP.NO_TOGGLE)}set noToggle(e){eZ(this,aP.NO_TOGGLE,e)}get mediaDuration(){return eG(this,z.MEDIA_DURATION)}set mediaDuration(e){eq(this,z.MEDIA_DURATION,e)}get mediaCurrentTime(){return eG(this,z.MEDIA_CURRENT_TIME)}set mediaCurrentTime(e){eq(this,z.MEDIA_CURRENT_TIME,e)}get mediaSeekable(){let e=this.getAttribute(z.MEDIA_SEEKABLE);if(e)return e.split(":").map(e=>+e)}set mediaSeekable(e){if(null==e)return void this.removeAttribute(z.MEDIA_SEEKABLE);this.setAttribute(z.MEDIA_SEEKABLE,e.join(":"))}update(){let e=aH(this);(e=>{var t;let i=e.mediaCurrentTime,[,a]=null!=(t=e.mediaSeekable)?t:[],r=null;if(Number.isFinite(e.mediaDuration)?r=e.mediaDuration:Number.isFinite(a)&&(r=a),null==i||null===r)return e.setAttribute("aria-valuetext","video not loaded, unknown time.");let n=e.remaining?ep(0-(r-i)):ep(i);if(!e.showDuration)return e.setAttribute("aria-valuetext",n);let s=ep(r),o=`${n} of ${s}`;e.setAttribute("aria-valuetext",o)})(this),e!==ax(this,og).innerHTML&&(ax(this,og).innerHTML=e)}}og=new WeakMap,aV.getSlotTemplateHTML=function(e,t){return`
    <slot>${aH(t)}</slot>
  `},eR.customElements.get("media-time-display")||eR.customElements.define("media-time-display",aV);var a$=(e,t,i)=>{if(!t.has(e))throw TypeError("Cannot "+i)},aK=(e,t,i)=>(a$(e,t,"read from private field"),i?i.call(e):t.get(e)),aF=(e,t,i)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,i)},aY=(e,t,i,a)=>(a$(e,t,"write to private field"),a?a.call(e,i):t.set(e,i),i);class aG{constructor(e,t,i){aF(this,of,void 0),aF(this,oA,void 0),aF(this,oT,void 0),aF(this,oy,void 0),aF(this,o_,void 0),aF(this,ok,void 0),aF(this,oI,void 0),aF(this,oS,void 0),aF(this,oR,0),aF(this,ow,(e=performance.now())=>{aY(this,oR,requestAnimationFrame(aK(this,ow))),aY(this,oy,performance.now()-aK(this,oT));let t=1e3/this.fps;if(aK(this,oy)>t){aY(this,oT,e-aK(this,oy)%t);let i=1e3/((e-aK(this,oA))/++((e,t,i,a)=>({set _(value){aY(e,t,value,i)},get _(){return aK(e,t,a)}}))(this,o_)._),a=(e-aK(this,ok))/1e3/this.duration,r=aK(this,oI)+a*this.playbackRate;r-aK(this,of).valueAsNumber>0?aY(this,oS,this.playbackRate/this.duration/i):(aY(this,oS,.995*aK(this,oS)),r=aK(this,of).valueAsNumber+aK(this,oS)),this.callback(r)}}),aY(this,of,e),this.callback=t,this.fps=i}start(){0===aK(this,oR)&&(aY(this,oT,performance.now()),aY(this,oA,aK(this,oT)),aY(this,o_,0),aK(this,ow).call(this))}stop(){0!==aK(this,oR)&&(cancelAnimationFrame(aK(this,oR)),aY(this,oR,0))}update({start:e,duration:t,playbackRate:i}){let a=e-aK(this,of).valueAsNumber,r=Math.abs(t-this.duration);(a>0||a<-.03||r>=.5)&&this.callback(e),aY(this,oI,e),aY(this,ok,performance.now()),this.duration=t,this.playbackRate=i}}of=new WeakMap,oA=new WeakMap,oT=new WeakMap,oy=new WeakMap,o_=new WeakMap,ok=new WeakMap,oI=new WeakMap,oS=new WeakMap,oR=new WeakMap,ow=new WeakMap;var aq=(e,t,i)=>{if(!t.has(e))throw TypeError("Cannot "+i)},aj=(e,t,i)=>(aq(e,t,"read from private field"),i?i.call(e):t.get(e)),aZ=(e,t,i)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,i)},aQ=(e,t,i,a)=>(aq(e,t,"write to private field"),a?a.call(e,i):t.set(e,i),i),az=(e,t,i)=>(aq(e,t,"access private method"),i);let aX=(e,t=e.mediaCurrentTime)=>{let i=Number.isFinite(e.mediaSeekableStart)?e.mediaSeekableStart:0,a=Number.isFinite(e.mediaDuration)?e.mediaDuration:e.mediaSeekableEnd;return Number.isNaN(a)?0:Math.max(0,Math.min((t-i)/(a-i),1))},aJ=(e,t=e.range.valueAsNumber)=>{let i=Number.isFinite(e.mediaSeekableStart)?e.mediaSeekableStart:0,a=Number.isFinite(e.mediaDuration)?e.mediaDuration:e.mediaSeekableEnd;return Number.isNaN(a)?0:t*(a-i)+i};class a0 extends iR{constructor(){super(),aZ(this,oB),aZ(this,oV),aZ(this,oF),aZ(this,oG),aZ(this,oj),aZ(this,oQ),aZ(this,oX),aZ(this,o0),aZ(this,oC,void 0),aZ(this,oL,void 0),aZ(this,oM,void 0),aZ(this,oD,void 0),aZ(this,oO,void 0),aZ(this,oN,void 0),aZ(this,ox,void 0),aZ(this,oP,void 0),aZ(this,oU,void 0),aZ(this,oW,void 0),aZ(this,oK,e=>{!this.dragging&&(eu(e)&&(this.range.valueAsNumber=e),aj(this,oW)||this.updateBar())}),this.shadowRoot.querySelector("#track").insertAdjacentHTML("afterbegin",'<div id="buffered" part="buffered"></div>'),aQ(this,oM,this.shadowRoot.querySelectorAll('[part~="box"]')),aQ(this,oO,this.shadowRoot.querySelector('[part~="preview-box"]')),aQ(this,oN,this.shadowRoot.querySelector('[part~="current-box"]'));let e=getComputedStyle(this);aQ(this,ox,parseInt(e.getPropertyValue("--media-box-padding-left"))),aQ(this,oP,parseInt(e.getPropertyValue("--media-box-padding-right"))),aQ(this,oL,new aG(this.range,aj(this,oK),60))}static get observedAttributes(){return[...super.observedAttributes,z.MEDIA_PAUSED,z.MEDIA_DURATION,z.MEDIA_SEEKABLE,z.MEDIA_CURRENT_TIME,z.MEDIA_PREVIEW_IMAGE,z.MEDIA_PREVIEW_TIME,z.MEDIA_PREVIEW_CHAPTER,z.MEDIA_BUFFERED,z.MEDIA_PLAYBACK_RATE,z.MEDIA_LOADING,z.MEDIA_ENDED]}connectedCallback(){var e;super.connectedCallback(),this.range.setAttribute("aria-label",eg("seek")),az(this,oB,oH).call(this),aQ(this,oC,this.getRootNode()),null==(e=aj(this,oC))||e.addEventListener("transitionstart",this)}disconnectedCallback(){var e;super.disconnectedCallback(),az(this,oB,oH).call(this),null==(e=aj(this,oC))||e.removeEventListener("transitionstart",this),aQ(this,oC,null)}attributeChangedCallback(e,t,i){super.attributeChangedCallback(e,t,i),t!=i&&(e===z.MEDIA_CURRENT_TIME||e===z.MEDIA_PAUSED||e===z.MEDIA_ENDED||e===z.MEDIA_LOADING||e===z.MEDIA_DURATION||e===z.MEDIA_SEEKABLE?(aj(this,oL).update({start:aX(this),duration:this.mediaSeekableEnd-this.mediaSeekableStart,playbackRate:this.mediaPlaybackRate}),az(this,oB,oH).call(this),(e=>{let t=e.range,i=ep(+aJ(e)),a=ep(+e.mediaSeekableEnd),r=i&&a?`${i} of ${a}`:"video not loaded, unknown time.";t.setAttribute("aria-valuetext",r)})(this)):e===z.MEDIA_BUFFERED&&this.updateBufferedBar(),(e===z.MEDIA_DURATION||e===z.MEDIA_SEEKABLE)&&(this.mediaChaptersCues=aj(this,oU),this.updateBar()))}get mediaChaptersCues(){return aj(this,oU)}set mediaChaptersCues(e){var t;aQ(this,oU,e),this.updateSegments(null==(t=aj(this,oU))?void 0:t.map(e=>({start:aX(this,e.startTime),end:aX(this,e.endTime)})))}get mediaPaused(){return ej(this,z.MEDIA_PAUSED)}set mediaPaused(e){eZ(this,z.MEDIA_PAUSED,e)}get mediaLoading(){return ej(this,z.MEDIA_LOADING)}set mediaLoading(e){eZ(this,z.MEDIA_LOADING,e)}get mediaDuration(){return eG(this,z.MEDIA_DURATION)}set mediaDuration(e){eq(this,z.MEDIA_DURATION,e)}get mediaCurrentTime(){return eG(this,z.MEDIA_CURRENT_TIME)}set mediaCurrentTime(e){eq(this,z.MEDIA_CURRENT_TIME,e)}get mediaPlaybackRate(){return eG(this,z.MEDIA_PLAYBACK_RATE,1)}set mediaPlaybackRate(e){eq(this,z.MEDIA_PLAYBACK_RATE,e)}get mediaBuffered(){let e=this.getAttribute(z.MEDIA_BUFFERED);return e?e.split(" ").map(e=>e.split(":").map(e=>+e)):[]}set mediaBuffered(e){if(!e)return void this.removeAttribute(z.MEDIA_BUFFERED);let t=e.map(e=>e.join(":")).join(" ");this.setAttribute(z.MEDIA_BUFFERED,t)}get mediaSeekable(){let e=this.getAttribute(z.MEDIA_SEEKABLE);if(e)return e.split(":").map(e=>+e)}set mediaSeekable(e){if(null==e)return void this.removeAttribute(z.MEDIA_SEEKABLE);this.setAttribute(z.MEDIA_SEEKABLE,e.join(":"))}get mediaSeekableEnd(){var e;let[,t=this.mediaDuration]=null!=(e=this.mediaSeekable)?e:[];return t}get mediaSeekableStart(){var e;let[t=0]=null!=(e=this.mediaSeekable)?e:[];return t}get mediaPreviewImage(){return eQ(this,z.MEDIA_PREVIEW_IMAGE)}set mediaPreviewImage(e){ez(this,z.MEDIA_PREVIEW_IMAGE,e)}get mediaPreviewTime(){return eG(this,z.MEDIA_PREVIEW_TIME)}set mediaPreviewTime(e){eq(this,z.MEDIA_PREVIEW_TIME,e)}get mediaEnded(){return ej(this,z.MEDIA_ENDED)}set mediaEnded(e){eZ(this,z.MEDIA_ENDED,e)}updateBar(){super.updateBar(),this.updateBufferedBar(),this.updateCurrentBox()}updateBufferedBar(){var e;let t,i=this.mediaBuffered;if(!i.length)return;if(this.mediaEnded)t=1;else{let a=this.mediaCurrentTime,[,r=this.mediaSeekableStart]=null!=(e=i.find(([e,t])=>e<=a&&a<=t))?e:[];t=aX(this,r)}let{style:a}=eF(this.shadowRoot,"#buffered");a.setProperty("width",`${100*t}%`)}updateCurrentBox(){if(!this.shadowRoot.querySelector('slot[name="current"]').assignedElements().length)return;let e=eF(this.shadowRoot,"#current-rail"),t=eF(this.shadowRoot,'[part~="current-box"]'),i=az(this,oF,oY).call(this,aj(this,oN)),a=az(this,oG,oq).call(this,i,this.range.valueAsNumber),r=az(this,oj,oZ).call(this,i,this.range.valueAsNumber);e.style.transform=`translateX(${a})`,e.style.setProperty("--_range-width",`${i.range.width}`),t.style.setProperty("--_box-shift",`${r}`),t.style.setProperty("--_box-width",`${i.box.width}px`),t.style.setProperty("visibility","initial")}handleEvent(e){switch(super.handleEvent(e),e.type){case"input":az(this,o0,o1).call(this);break;case"pointermove":az(this,oQ,oz).call(this,e);break;case"pointerup":aj(this,oW)&&aQ(this,oW,!1);break;case"pointerdown":aQ(this,oW,!0);break;case"pointerleave":az(this,oX,oJ).call(this,null);break;case"transitionstart":eB(e.target,this)&&setTimeout(()=>az(this,oB,oH).call(this),0)}}}oC=new WeakMap,oL=new WeakMap,oM=new WeakMap,oD=new WeakMap,oO=new WeakMap,oN=new WeakMap,ox=new WeakMap,oP=new WeakMap,oU=new WeakMap,oW=new WeakMap,oB=new WeakSet,oH=function(){az(this,oV,o$).call(this)?aj(this,oL).start():aj(this,oL).stop()},oV=new WeakSet,o$=function(){return this.isConnected&&!this.mediaPaused&&!this.mediaLoading&&!this.mediaEnded&&this.mediaSeekableEnd>0&&eK(this)},oK=new WeakMap,oF=new WeakSet,oY=function(e){var t;let i=(null!=(t=this.getAttribute("bounds")?eH(this,`#${this.getAttribute("bounds")}`):this.parentElement)?t:this).getBoundingClientRect(),a=this.range.getBoundingClientRect(),r=e.offsetWidth,n=-(a.left-i.left-r/2),s=i.right-a.left-r/2;return{box:{width:r,min:n,max:s},bounds:i,range:a}},oG=new WeakSet,oq=function(e,t){let i=`${100*t}%`,{width:a,min:r,max:n}=e.box;if(!a)return i;if(!Number.isNaN(r)){let e=`calc(1 / var(--_range-width) * 100 * ${r}% + var(--media-box-padding-left))`;i=`max(${e}, ${i})`}if(!Number.isNaN(n)){let e=`calc(1 / var(--_range-width) * 100 * ${n}% - var(--media-box-padding-right))`;i=`min(${i}, ${e})`}return i},oj=new WeakSet,oZ=function(e,t){let{width:i,min:a,max:r}=e.box,n=t*e.range.width;if(n<a+aj(this,ox)){let t=e.range.left-e.bounds.left-aj(this,ox);return`${n-i/2+t}px`}if(n>r-aj(this,oP)){let t=e.bounds.right-e.range.right-aj(this,oP);return`${n+i/2-t-e.range.width}px`}return 0},oQ=new WeakSet,oz=function(e){let t=[...aj(this,oM)].some(t=>e.composedPath().includes(t));if(!this.dragging&&(t||!e.composedPath().includes(this)))return void az(this,oX,oJ).call(this,null);let i=this.mediaSeekableEnd;if(!i)return;let a=eF(this.shadowRoot,"#preview-rail"),r=eF(this.shadowRoot,'[part~="preview-box"]'),n=az(this,oF,oY).call(this,aj(this,oO)),s=(e.clientX-n.range.left)/n.range.width;s=Math.max(0,Math.min(1,s));let o=az(this,oG,oq).call(this,n,s),l=az(this,oj,oZ).call(this,n,s);a.style.transform=`translateX(${o})`,a.style.setProperty("--_range-width",`${n.range.width}`),r.style.setProperty("--_box-shift",`${l}`),r.style.setProperty("--_box-width",`${n.box.width}px`),1>Math.abs(Math.round(aj(this,oD))-Math.round(s*i))&&s>.01&&s<.99||(aQ(this,oD,s*i),az(this,oX,oJ).call(this,aj(this,oD)))},oX=new WeakSet,oJ=function(e){this.dispatchEvent(new eR.CustomEvent(q.MEDIA_PREVIEW_REQUEST,{composed:!0,bubbles:!0,detail:e}))},o0=new WeakSet,o1=function(){aj(this,oL).stop();let e=aJ(this);this.dispatchEvent(new eR.CustomEvent(q.MEDIA_SEEK_REQUEST,{composed:!0,bubbles:!0,detail:e}))},a0.shadowRootOptions={mode:"open"},a0.getContainerTemplateHTML=function(e){return`
    <style>
      :host {
        --media-box-border-radius: 4px;
        --media-box-padding-left: 10px;
        --media-box-padding-right: 10px;
        --media-preview-border-radius: var(--media-box-border-radius);
        --media-box-arrow-offset: var(--media-box-border-radius);
        --_control-background: var(--media-control-background, var(--media-secondary-color, rgb(20 20 30 / .7)));
        --_preview-background: var(--media-preview-background, var(--_control-background));

        
        contain: layout;
      }

      #buffered {
        background: var(--media-time-range-buffered-color, rgb(255 255 255 / .4));
        position: absolute;
        height: 100%;
        will-change: width;
      }

      #preview-rail,
      #current-rail {
        width: 100%;
        position: absolute;
        left: 0;
        bottom: 100%;
        pointer-events: none;
        will-change: transform;
      }

      [part~="box"] {
        width: min-content;
        
        position: absolute;
        bottom: 100%;
        flex-direction: column;
        align-items: center;
        transform: translateX(-50%);
      }

      [part~="current-box"] {
        display: var(--media-current-box-display, var(--media-box-display, flex));
        margin: var(--media-current-box-margin, var(--media-box-margin, 0 0 5px));
        visibility: hidden;
      }

      [part~="preview-box"] {
        display: var(--media-preview-box-display, var(--media-box-display, flex));
        margin: var(--media-preview-box-margin, var(--media-box-margin, 0 0 5px));
        transition-property: var(--media-preview-transition-property, visibility, opacity);
        transition-duration: var(--media-preview-transition-duration-out, .25s);
        transition-delay: var(--media-preview-transition-delay-out, 0s);
        visibility: hidden;
        opacity: 0;
      }

      :host(:is([${z.MEDIA_PREVIEW_IMAGE}], [${z.MEDIA_PREVIEW_TIME}])[dragging]) [part~="preview-box"] {
        transition-duration: var(--media-preview-transition-duration-in, .5s);
        transition-delay: var(--media-preview-transition-delay-in, .25s);
        visibility: visible;
        opacity: 1;
      }

      @media (hover: hover) {
        :host(:is([${z.MEDIA_PREVIEW_IMAGE}], [${z.MEDIA_PREVIEW_TIME}]):hover) [part~="preview-box"] {
          transition-duration: var(--media-preview-transition-duration-in, .5s);
          transition-delay: var(--media-preview-transition-delay-in, .25s);
          visibility: visible;
          opacity: 1;
        }
      }

      media-preview-thumbnail,
      ::slotted(media-preview-thumbnail) {
        visibility: hidden;
        
        transition: visibility 0s .25s;
        transition-delay: calc(var(--media-preview-transition-delay-out, 0s) + var(--media-preview-transition-duration-out, .25s));
        background: var(--media-preview-thumbnail-background, var(--_preview-background));
        box-shadow: var(--media-preview-thumbnail-box-shadow, 0 0 4px rgb(0 0 0 / .2));
        max-width: var(--media-preview-thumbnail-max-width, 180px);
        max-height: var(--media-preview-thumbnail-max-height, 160px);
        min-width: var(--media-preview-thumbnail-min-width, 120px);
        min-height: var(--media-preview-thumbnail-min-height, 80px);
        border: var(--media-preview-thumbnail-border);
        border-radius: var(--media-preview-thumbnail-border-radius,
          var(--media-preview-border-radius) var(--media-preview-border-radius) 0 0);
      }

      :host([${z.MEDIA_PREVIEW_IMAGE}][dragging]) media-preview-thumbnail,
      :host([${z.MEDIA_PREVIEW_IMAGE}][dragging]) ::slotted(media-preview-thumbnail) {
        transition-delay: var(--media-preview-transition-delay-in, .25s);
        visibility: visible;
      }

      @media (hover: hover) {
        :host([${z.MEDIA_PREVIEW_IMAGE}]:hover) media-preview-thumbnail,
        :host([${z.MEDIA_PREVIEW_IMAGE}]:hover) ::slotted(media-preview-thumbnail) {
          transition-delay: var(--media-preview-transition-delay-in, .25s);
          visibility: visible;
        }

        :host([${z.MEDIA_PREVIEW_TIME}]:hover) {
          --media-time-range-hover-display: block;
        }
      }

      media-preview-chapter-display,
      ::slotted(media-preview-chapter-display) {
        font-size: var(--media-font-size, 13px);
        line-height: 17px;
        min-width: 0;
        visibility: hidden;
        
        transition: min-width 0s, border-radius 0s, margin 0s, padding 0s, visibility 0s;
        transition-delay: calc(var(--media-preview-transition-delay-out, 0s) + var(--media-preview-transition-duration-out, .25s));
        background: var(--media-preview-chapter-background, var(--_preview-background));
        border-radius: var(--media-preview-chapter-border-radius,
          var(--media-preview-border-radius) var(--media-preview-border-radius)
          var(--media-preview-border-radius) var(--media-preview-border-radius));
        padding: var(--media-preview-chapter-padding, 3.5px 9px);
        margin: var(--media-preview-chapter-margin, 0 0 5px);
        text-shadow: var(--media-preview-chapter-text-shadow, 0 0 4px rgb(0 0 0 / .75));
      }

      :host([${z.MEDIA_PREVIEW_IMAGE}]) media-preview-chapter-display,
      :host([${z.MEDIA_PREVIEW_IMAGE}]) ::slotted(media-preview-chapter-display) {
        transition-delay: var(--media-preview-transition-delay-in, .25s);
        border-radius: var(--media-preview-chapter-border-radius, 0);
        padding: var(--media-preview-chapter-padding, 3.5px 9px 0);
        margin: var(--media-preview-chapter-margin, 0);
        min-width: 100%;
      }

      media-preview-chapter-display[${z.MEDIA_PREVIEW_CHAPTER}],
      ::slotted(media-preview-chapter-display[${z.MEDIA_PREVIEW_CHAPTER}]) {
        visibility: visible;
      }

      media-preview-chapter-display:not([aria-valuetext]),
      ::slotted(media-preview-chapter-display:not([aria-valuetext])) {
        display: none;
      }

      media-preview-time-display,
      ::slotted(media-preview-time-display),
      media-time-display,
      ::slotted(media-time-display) {
        font-size: var(--media-font-size, 13px);
        line-height: 17px;
        min-width: 0;
        
        transition: min-width 0s, border-radius 0s;
        transition-delay: calc(var(--media-preview-transition-delay-out, 0s) + var(--media-preview-transition-duration-out, .25s));
        background: var(--media-preview-time-background, var(--_preview-background));
        border-radius: var(--media-preview-time-border-radius,
          var(--media-preview-border-radius) var(--media-preview-border-radius)
          var(--media-preview-border-radius) var(--media-preview-border-radius));
        padding: var(--media-preview-time-padding, 3.5px 9px);
        margin: var(--media-preview-time-margin, 0);
        text-shadow: var(--media-preview-time-text-shadow, 0 0 4px rgb(0 0 0 / .75));
        transform: translateX(min(
          max(calc(50% - var(--_box-width) / 2),
          calc(var(--_box-shift, 0))),
          calc(var(--_box-width) / 2 - 50%)
        ));
      }

      :host([${z.MEDIA_PREVIEW_IMAGE}]) media-preview-time-display,
      :host([${z.MEDIA_PREVIEW_IMAGE}]) ::slotted(media-preview-time-display) {
        transition-delay: var(--media-preview-transition-delay-in, .25s);
        border-radius: var(--media-preview-time-border-radius,
          0 0 var(--media-preview-border-radius) var(--media-preview-border-radius));
        min-width: 100%;
      }

      :host([${z.MEDIA_PREVIEW_TIME}]:hover) {
        --media-time-range-hover-display: block;
      }

      [part~="arrow"],
      ::slotted([part~="arrow"]) {
        display: var(--media-box-arrow-display, inline-block);
        transform: translateX(min(
          max(calc(50% - var(--_box-width) / 2 + var(--media-box-arrow-offset)),
          calc(var(--_box-shift, 0))),
          calc(var(--_box-width) / 2 - 50% - var(--media-box-arrow-offset))
        ));
        
        border-color: transparent;
        border-top-color: var(--media-box-arrow-background, var(--_control-background));
        border-width: var(--media-box-arrow-border-width,
          var(--media-box-arrow-height, 5px) var(--media-box-arrow-width, 6px) 0);
        border-style: solid;
        justify-content: center;
        height: 0;
      }
    </style>
    <div id="preview-rail">
      <slot name="preview" part="box preview-box">
        <media-preview-thumbnail>
          <template shadowrootmode="${aS.shadowRootOptions.mode}">
            ${aS.getTemplateHTML({})}
          </template>
        </media-preview-thumbnail>
        <media-preview-chapter-display></media-preview-chapter-display>
        <media-preview-time-display></media-preview-time-display>
        <slot name="preview-arrow"><div part="arrow"></div></slot>
      </slot>
    </div>
    <div id="current-rail">
      <slot name="current" part="box current-box">
        
      </slot>
    </div>
  `},eR.customElements.get("media-time-range")||eR.customElements.define("media-time-range",a0);class a1 extends iR{static get observedAttributes(){return[...super.observedAttributes,z.MEDIA_VOLUME,z.MEDIA_MUTED,z.MEDIA_VOLUME_UNAVAILABLE]}constructor(){super(),this.range.addEventListener("input",()=>{let e=this.range.value,t=new eR.CustomEvent(q.MEDIA_VOLUME_REQUEST,{composed:!0,bubbles:!0,detail:e});this.dispatchEvent(t)})}connectedCallback(){super.connectedCallback(),this.range.setAttribute("aria-label",eg("volume"))}attributeChangedCallback(e,t,i){if(super.attributeChangedCallback(e,t,i),e===z.MEDIA_VOLUME||e===z.MEDIA_MUTED){let e;this.range.valueAsNumber=this.mediaMuted?0:this.mediaVolume,this.range.setAttribute("aria-valuetext",(e=this.range.valueAsNumber,`${Math.round(100*e)}%`)),this.updateBar()}}get mediaVolume(){return eG(this,z.MEDIA_VOLUME,1)}set mediaVolume(e){eq(this,z.MEDIA_VOLUME,e)}get mediaMuted(){return ej(this,z.MEDIA_MUTED)}set mediaMuted(e){eZ(this,z.MEDIA_MUTED,e)}get mediaVolumeUnavailable(){return eQ(this,z.MEDIA_VOLUME_UNAVAILABLE)}set mediaVolumeUnavailable(e){ez(this,z.MEDIA_VOLUME_UNAVAILABLE,e)}}eR.customElements.get("media-volume-range")||eR.customElements.define("media-volume-range",a1);class a2 extends it{constructor(){super(...arguments),this.container=null}static get observedAttributes(){return[...super.observedAttributes,z.MEDIA_LOOP]}connectedCallback(){var e;super.connectedCallback(),this.container=(null==(e=this.shadowRoot)?void 0:e.querySelector("#icon"))||null,this.container&&(this.container.textContent=eg("Loop"))}attributeChangedCallback(e,t,i){super.attributeChangedCallback(e,t,i),e===z.MEDIA_LOOP&&this.container&&this.setAttribute("aria-checked",this.mediaLoop?"true":"false")}get mediaLoop(){return ej(this,z.MEDIA_LOOP)}set mediaLoop(e){eZ(this,z.MEDIA_LOOP,e)}handleClick(){let e=!this.mediaLoop,t=new eR.CustomEvent(q.MEDIA_LOOP_REQUEST,{composed:!0,bubbles:!0,detail:e});this.dispatchEvent(t)}}a2.getSlotTemplateHTML=function(e){return`
      <style>
        :host {
          min-width: 4ch;
          padding: var(--media-button-padding, var(--media-control-padding, 10px 5px));
          width: 100%;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 1rem;
          font-weight: var(--media-button-font-weight, normal);
        }

        #checked-indicator {
          display: none;
        }

        :host([${z.MEDIA_LOOP}]) #checked-indicator {
          display: block;
        }
      </style>
      
      <span id="icon">
     </span>

      <div id="checked-indicator">
        <svg aria-hidden="true" viewBox="0 1 24 24" part="checked-indicator indicator">
          <path d="m10 15.17 9.193-9.191 1.414 1.414-10.606 10.606-6.364-6.364 1.414-1.414 4.95 4.95Z"/>
        </svg>
      </div>
    `},a2.getTooltipContentHTML=function(){return eg("Loop")},eR.customElements.get("media-loop-button")||eR.customElements.define("media-loop-button",a2);var a3=(e,t,i)=>{if(!t.has(e))throw TypeError("Cannot "+i)},a4=(e,t,i)=>(a3(e,t,"read from private field"),i?i.call(e):t.get(e)),a5=(e,t,i)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,i)},a9=(e,t,i,a)=>(a3(e,t,"write to private field"),a?a.call(e,i):t.set(e,i),i);let a8={processCallback(e,t,i){if(i){for(let[e,a]of t)if(e in i){let t=i[e];"boolean"==typeof t&&a instanceof rn&&"boolean"==typeof a.element[a.attributeName]?a.booleanValue=t:"function"==typeof t&&a instanceof rn?a.element[a.attributeName]=t:a.value=t}}}};class a6 extends eR.DocumentFragment{constructor(e,t,i=a8){var a;super(),a5(this,o2,void 0),a5(this,o3,void 0),this.append(e.content.cloneNode(!0)),a9(this,o2,a7(this)),a9(this,o3,i),null==(a=i.createCallback)||a.call(i,this,a4(this,o2),t),i.processCallback(this,a4(this,o2),t)}update(e){a4(this,o3).processCallback(this,a4(this,o2),e)}}o2=new WeakMap,o3=new WeakMap;let a7=(e,t=[])=>{let i,a;for(let r of e.attributes||[])if(r.value.includes("{{")){let n=new rr;for([i,a]of rt(r.value))if(i){let i=new rn(e,r.name,r.namespaceURI);n.append(i),t.push([a,i])}else n.append(a);r.value=n.toString()}for(let r of e.childNodes)if(1!==r.nodeType||r instanceof HTMLTemplateElement){let n=r.data;if(1===r.nodeType||n.includes("{{")){let s=[];if(n)for([i,a]of rt(n))if(i){let i=new rs(e);s.push(i),t.push([a,i])}else s.push(new Text(a));else if(r instanceof HTMLTemplateElement){let i=new ro(e,r);s.push(i),t.push([i.expression,i])}r.replaceWith(...s.flatMap(e=>e.replacementNodes||[e]))}}else a7(r,t);return t},re={},rt=e=>{let t="",i=0,a=re[e],r=0,n;if(a)return a;for(a=[];n=e[r];r++)"{"===n&&"{"===e[r+1]&&"\\"!==e[r-1]&&e[r+2]&&1==++i?(t&&a.push([0,t]),t="",r++):"}"!==n||"}"!==e[r+1]||"\\"===e[r-1]||--i?t+=n||"":(a.push([1,t.trim()]),t="",r++);return t&&a.push([0,(i>0?"{{":"")+t]),re[e]=a};class ri{get value(){return""}set value(e){}toString(){return this.value}}let ra=new WeakMap;class rr{constructor(){a5(this,o4,[])}[Symbol.iterator](){return a4(this,o4).values()}get length(){return a4(this,o4).length}item(e){return a4(this,o4)[e]}append(...e){for(let t of e)t instanceof rn&&ra.set(t,this),a4(this,o4).push(t)}toString(){return a4(this,o4).join("")}}o4=new WeakMap;class rn extends ri{constructor(e,t,i){super(),a5(this,o7),a5(this,o5,""),a5(this,o9,void 0),a5(this,o8,void 0),a5(this,o6,void 0),a9(this,o9,e),a9(this,o8,t),a9(this,o6,i)}get attributeName(){return a4(this,o8)}get attributeNamespace(){return a4(this,o6)}get element(){return a4(this,o9)}get value(){return a4(this,o5)}set value(e){a4(this,o5)!==e&&(a9(this,o5,e),a4(this,o7,le)&&1!==a4(this,o7,le).length?a4(this,o9).setAttributeNS(a4(this,o6),a4(this,o8),a4(this,o7,le).toString()):null==e?a4(this,o9).removeAttributeNS(a4(this,o6),a4(this,o8)):a4(this,o9).setAttributeNS(a4(this,o6),a4(this,o8),e))}get booleanValue(){return a4(this,o9).hasAttributeNS(a4(this,o6),a4(this,o8))}set booleanValue(e){if(a4(this,o7,le)&&1!==a4(this,o7,le).length)throw new DOMException("Value is not fully templatized");this.value=e?"":null}}o5=new WeakMap,o9=new WeakMap,o8=new WeakMap,o6=new WeakMap,o7=new WeakSet,le=function(){return ra.get(this)};class rs extends ri{constructor(e,t){super(),a5(this,lt,void 0),a5(this,li,void 0),a9(this,lt,e),a9(this,li,t?[...t]:[new Text])}get replacementNodes(){return a4(this,li)}get parentNode(){return a4(this,lt)}get nextSibling(){return a4(this,li)[a4(this,li).length-1].nextSibling}get previousSibling(){return a4(this,li)[0].previousSibling}get value(){return a4(this,li).map(e=>e.textContent).join("")}set value(e){this.replace(e)}replace(...e){let t=e.flat().flatMap(e=>null==e?[new Text]:e.forEach?[...e]:11===e.nodeType?[...e.childNodes]:e.nodeType?[e]:[new Text(e)]);t.length||t.push(new Text),a9(this,li,function(e,t,i,a=null){let r=0,n,s,o,l=i.length,d=t.length;for(;r<l&&r<d&&t[r]==i[r];)r++;for(;r<l&&r<d&&i[l-1]==t[d-1];)a=i[--d,--l];if(r==d)for(;r<l;)e.insertBefore(i[r++],a);if(r==l)for(;r<d;)e.removeChild(t[r++]);else{for(n=t[r];r<l;)o=i[r++],s=n?n.nextSibling:a,n==o?n=s:r<l&&i[r]==s?(e.replaceChild(o,n),n=s):e.insertBefore(o,n);for(;n!=a;)s=n.nextSibling,e.removeChild(n),n=s}return i}(a4(this,li)[0].parentNode,a4(this,li),t,this.nextSibling))}}lt=new WeakMap,li=new WeakMap;class ro extends rs{constructor(e,t){let i=t.getAttribute("directive")||t.getAttribute("type"),a=t.getAttribute("expression")||t.getAttribute(i)||"";a.startsWith("{{")&&(a=a.trim().slice(2,-2).trim()),super(e),this.expression=a,this.template=t,this.directive=i}}let rl={string:e=>String(e)};class rd{constructor(e){this.template=e,this.state=void 0}}let ru=new WeakMap,rh=new WeakMap,rm={partial:(e,t)=>{t[e.expression]=new rd(e.template)},if:(e,t)=>{var i;if(rv(e.expression,t))if(ru.get(e)!==e.template){ru.set(e,e.template);let i=new a6(e.template,t,rp);e.replace(i),rh.set(e,i)}else null==(i=rh.get(e))||i.update(t);else e.replace(""),ru.delete(e),rh.delete(e)}},rc=Object.keys(rm),rp={processCallback(e,t,i){var a,r;if(i)for(let[e,n]of t){if(n instanceof ro){if(!n.directive){let e=rc.find(e=>n.template.hasAttribute(e));e&&(n.directive=e,n.expression=n.template.getAttribute(e))}null==(a=rm[n.directive])||a.call(rm,n,i);continue}let t=rv(e,i);if(t instanceof rd){ru.get(n)!==t.template?(ru.set(n,t.template),n.value=t=new a6(t.template,t.state,rp),rh.set(n,t)):null==(r=rh.get(n))||r.update(t.state);continue}t?(n instanceof rn&&n.attributeName.startsWith("aria-")&&(t=String(t)),n instanceof rn?"boolean"==typeof t?n.booleanValue=t:"function"==typeof t?n.element[n.attributeName]=t:n.value=t:(n.value=t,ru.delete(n),rh.delete(n))):n instanceof rn?n.value=void 0:(n.value=void 0,ru.delete(n),rh.delete(n))}}},rE={"!":e=>!e,"!!":e=>!!e,"==":(e,t)=>e==t,"!=":(e,t)=>e!=t,">":(e,t)=>e>t,">=":(e,t)=>e>=t,"<":(e,t)=>e<t,"<=":(e,t)=>e<=t,"??":(e,t)=>null!=e?e:t,"|":(e,t)=>{var i;return null==(i=rl[t])?void 0:i.call(rl,e)}};function rv(e,t={}){var i,a,r,n,s,o,l;let d=(function(e,t){let i,a,r,n=[];for(;e;){for(let n in r=null,i=e.length,t)(a=t[n].exec(e))&&a.index<i&&(r={token:a[0],type:n,matches:a.slice(1)},i=a.index);i&&n.push({token:e.substr(0,i),type:void 0}),r&&n.push(r),e=e.substr(i+(r?r.token.length:0))}return n})(e,{boolean:/true|false/,number:/-?\d+\.?\d*/,string:/(["'])((?:\\.|[^\\])*?)\1/,operator:/[!=><][=!]?|\?\?|\|/,ws:/\s+/,param:/[$a-z_][$\w]*/i}).filter(({type:e})=>"ws"!==e);if(0===d.length||d.some(({type:e})=>!e))return rb(e);if((null==(i=d[0])?void 0:i.token)===">"){let i=t[null==(a=d[1])?void 0:a.token];if(!i)return rb(e);let o={...t};i.state=o;let l=d.slice(2);for(let e=0;e<l.length;e+=3){let i=null==(r=l[e])?void 0:r.token,a=null==(n=l[e+1])?void 0:n.token,d=null==(s=l[e+2])?void 0:s.token;i&&"="===a&&(o[i]=rf(d,t))}return i}if(1===d.length)return rg(d[0])?rf(d[0].token,t):rb(e);if(2===d.length){let i=rE[null==(o=d[0])?void 0:o.token];return i&&rg(d[1])?i(rf(d[1].token,t)):rb(e)}if(3===d.length){let i=null==(l=d[1])?void 0:l.token,a=rE[i];if(!a||!rg(d[0])||!rg(d[2]))return rb(e);let r=rf(d[0].token,t);return a(r,"|"===i?d[2].token:rf(d[2].token,t))}}function rb(e){return console.warn(`Warning: invalid expression \`${e}\``),!1}function rg({type:e}){return["number","boolean","string","param"].includes(e)}function rf(e,t){let i=e[0],a=e.slice(-1);return"true"===e||"false"===e?"true"===e:i===a&&["'",'"'].includes(i)?e.slice(1,-1):eh(e)?parseFloat(e):t[e]}var rA=(e,t,i)=>{if(!t.has(e))throw TypeError("Cannot "+i)},rT=(e,t,i)=>(rA(e,t,"read from private field"),i?i.call(e):t.get(e)),ry=(e,t,i)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,i)},r_=(e,t,i,a)=>(rA(e,t,"write to private field"),a?a.call(e,i):t.set(e,i),i),rk=(e,t,i)=>(rA(e,t,"access private method"),i);let rI={mediatargetlivewindow:"targetlivewindow",mediastreamtype:"streamtype"},rS=ew.createElement("template");rS.innerHTML=`
  <style>
    :host {
      display: inline-block;
      line-height: 0;
    }

    media-controller {
      width: 100%;
      height: 100%;
    }

    media-captions-button:not([mediasubtitleslist]),
    media-captions-menu:not([mediasubtitleslist]),
    media-captions-menu-button:not([mediasubtitleslist]),
    media-audio-track-menu[mediaaudiotrackunavailable],
    media-audio-track-menu-button[mediaaudiotrackunavailable],
    media-rendition-menu[mediarenditionunavailable],
    media-rendition-menu-button[mediarenditionunavailable],
    media-volume-range[mediavolumeunavailable],
    media-airplay-button[mediaairplayunavailable],
    media-fullscreen-button[mediafullscreenunavailable],
    media-cast-button[mediacastunavailable],
    media-pip-button[mediapipunavailable] {
      display: none;
    }
  </style>
`;class rR extends eR.HTMLElement{constructor(){super(),ry(this,ls),ry(this,ll),ry(this,la,void 0),ry(this,lr,void 0),ry(this,ln,void 0),this.shadowRoot?this.renderRoot=this.shadowRoot:(this.renderRoot=this.attachShadow({mode:"open"}),this.createRenderer());let e=new MutationObserver(e=>{var t;(!this.mediaController||(null==(t=this.mediaController)?void 0:t.breakpointsComputed))&&e.some(e=>{let t=e.target;return t===this||"media-controller"===t.localName&&!!(rI[e.attributeName]||e.attributeName.startsWith("breakpoint"))})&&this.render()});e.observe(this,{attributes:!0}),e.observe(this.renderRoot,{attributes:!0,subtree:!0}),this.addEventListener(X.BREAKPOINTS_COMPUTED,this.render),rk(this,ls,lo).call(this,"template")}get mediaController(){return this.renderRoot.querySelector("media-controller")}get template(){var e;return null!=(e=rT(this,la))?e:this.constructor.template}set template(e){if(null===e)return void this.removeAttribute("template");"string"==typeof e?this.setAttribute("template",e):e instanceof HTMLTemplateElement&&(r_(this,la,e),r_(this,ln,null),this.createRenderer())}get props(){var e,t,i;let a=[...Array.from(null!=(t=null==(e=this.mediaController)?void 0:e.attributes)?t:[]).filter(({name:e})=>rI[e]||e.startsWith("breakpoint")),...Array.from(this.attributes)],r={};for(let e of a){let t=null!=(i=rI[e.name])?i:e.name.replace(/[-_]([a-z])/g,(e,t)=>t.toUpperCase()),{value:a}=e;null!=a?(eh(a)&&(a=parseFloat(a)),r[t]=""===a||a):r[t]=!1}return r}attributeChangedCallback(e,t,i){"template"===e&&t!=i&&rk(this,ll,ld).call(this)}connectedCallback(){rk(this,ll,ld).call(this)}createRenderer(){this.template instanceof HTMLTemplateElement&&this.template!==rT(this,lr)&&(r_(this,lr,this.template),this.renderer=new a6(this.template,this.props,this.constructor.processor),this.renderRoot.textContent="",this.renderRoot.append(rS.content.cloneNode(!0),this.renderer))}render(){var e;null==(e=this.renderer)||e.update(this.props)}}async function rw(e){let t=await fetch(e);if(200!==t.status)throw Error(`Failed to load resource: the server responded with a status of ${t.status}`);return t.text()}function rC(e){return e.split("-")[0]}la=new WeakMap,lr=new WeakMap,ln=new WeakMap,ls=new WeakSet,lo=function(e){if(Object.prototype.hasOwnProperty.call(this,e)){let t=this[e];delete this[e],this[e]=t}},ll=new WeakSet,ld=function(){var e;let t=this.getAttribute("template");if(!t||t===rT(this,ln))return;let i=this.getRootNode(),a=null==(e=null==i?void 0:i.getElementById)?void 0:e.call(i,t);if(a){r_(this,ln,t),r_(this,la,a),this.createRenderer();return}(function(e){if(!/^(\/|\.\/|https?:\/\/)/.test(e))return!1;let t=/^https?:\/\//.test(e)?void 0:location.origin;try{new URL(e,t)}catch(e){return!1}return!0})(t)&&(r_(this,ln,t),rw(t).then(e=>{let t=ew.createElement("template");t.innerHTML=e,r_(this,la,t),this.createRenderer()}).catch(console.error))},rR.observedAttributes=["template"],rR.processor=rp,eR.customElements.get("media-theme")||eR.customElements.define("media-theme",rR);class rL extends Event{constructor({action:e="auto",relatedTarget:t,...i}){super("invoke",i),this.action=e,this.relatedTarget=t}}class rM extends Event{constructor({newState:e,oldState:t,...i}){super("toggle",i),this.newState=e,this.oldState=t}}var rD=(e,t,i)=>{if(!t.has(e))throw TypeError("Cannot "+i)},rO=(e,t,i)=>(rD(e,t,"read from private field"),i?i.call(e):t.get(e)),rN=(e,t,i)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,i)},rx=(e,t,i,a)=>(rD(e,t,"write to private field"),a?a.call(e,i):t.set(e,i),i),rP=(e,t,i)=>(rD(e,t,"access private method"),i);function rU({type:e,text:t,value:i,checked:a}){let r=ew.createElement("media-chrome-menu-item");r.type=null!=e?e:"",r.part.add("menu-item"),e&&r.part.add(e),r.value=i,r.checked=a;let n=ew.createElement("span");return n.textContent=t,r.append(n),r}function rW(e,t){let i=e.querySelector(`:scope > [slot="${t}"]`);if((null==i?void 0:i.nodeName)=="SLOT"&&(i=i.assignedElements({flatten:!0})[0]),i)return i.cloneNode(!0);let a=e.shadowRoot.querySelector(`[name="${t}"] > svg`);return a?a.cloneNode(!0):""}let rB={STYLE:"style",HIDDEN:"hidden",DISABLED:"disabled",ANCHOR:"anchor"};class rH extends eR.HTMLElement{constructor(){if(super(),rN(this,lb),rN(this,lf),rN(this,ly),rN(this,lk),rN(this,lS),rN(this,lw),rN(this,lD),rN(this,lN),rN(this,lP),rN(this,lW),rN(this,lH),rN(this,l$),rN(this,lF),rN(this,lG),rN(this,lj),rN(this,lQ),rN(this,lX),rN(this,l0),rN(this,lu,null),rN(this,lh,null),rN(this,lm,null),rN(this,lc,new Set),rN(this,lp,void 0),rN(this,lE,!1),rN(this,lv,null),rN(this,lT,()=>{let e=rO(this,lc),t=new Set(this.items);for(let i of e)t.has(i)||this.dispatchEvent(new CustomEvent("removemenuitem",{detail:i}));for(let i of t)e.has(i)||this.dispatchEvent(new CustomEvent("addmenuitem",{detail:i}));rx(this,lc,t)}),rN(this,lL,()=>{rP(this,lD,lO).call(this),rP(this,lN,lx).call(this,!1)}),rN(this,lM,()=>{rP(this,lD,lO).call(this)}),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);let e=eN(this.attributes);this.shadowRoot.innerHTML=this.constructor.getTemplateHTML(e)}this.container=this.shadowRoot.querySelector("#container"),this.defaultSlot=this.shadowRoot.querySelector("slot:not([name])"),this.shadowRoot.addEventListener("slotchange",this),rx(this,lp,new MutationObserver(rO(this,lT))),rO(this,lp).observe(this.defaultSlot,{childList:!0})}static get observedAttributes(){return[rB.DISABLED,rB.HIDDEN,rB.STYLE,rB.ANCHOR,j.MEDIA_CONTROLLER]}static formatMenuItemText(e,t){return e}enable(){this.addEventListener("click",this),this.addEventListener("focusout",this),this.addEventListener("keydown",this),this.addEventListener("invoke",this),this.addEventListener("toggle",this)}disable(){this.removeEventListener("click",this),this.removeEventListener("focusout",this),this.removeEventListener("keyup",this),this.removeEventListener("invoke",this),this.removeEventListener("toggle",this)}handleEvent(e){switch(e.type){case"slotchange":rP(this,lb,lg).call(this,e);break;case"invoke":rP(this,lk,lI).call(this,e);break;case"click":rP(this,lP,lU).call(this,e);break;case"toggle":rP(this,lH,lV).call(this,e);break;case"focusout":rP(this,lF,lY).call(this,e);break;case"keydown":rP(this,lG,lq).call(this,e)}}connectedCallback(){var e,t;rx(this,lv,eY(this.shadowRoot,":host")),rP(this,ly,l_).call(this),this.hasAttribute("disabled")||this.enable(),this.role||(this.role="menu"),rx(this,lu,eP(this)),null==(t=null==(e=rO(this,lu))?void 0:e.associateElement)||t.call(e,this),this.hidden||(eD(r$(this),rO(this,lL)),eD(this,rO(this,lM))),rP(this,lf,lA).call(this)}disconnectedCallback(){var e,t;eO(r$(this),rO(this,lL)),eO(this,rO(this,lM)),this.disable(),null==(t=null==(e=rO(this,lu))?void 0:e.unassociateElement)||t.call(e,this),rx(this,lu,null)}attributeChangedCallback(e,t,i){var a,r,n,s;e===rB.HIDDEN&&i!==t?(rO(this,lE)||rx(this,lE,!0),this.hidden?rP(this,lw,lC).call(this):rP(this,lS,lR).call(this),this.dispatchEvent(new rM({oldState:this.hidden?"open":"closed",newState:this.hidden?"closed":"open",bubbles:!0}))):e===j.MEDIA_CONTROLLER?(t&&(null==(r=null==(a=rO(this,lu))?void 0:a.unassociateElement)||r.call(a,this),rx(this,lu,null)),i&&this.isConnected&&(rx(this,lu,eP(this)),null==(s=null==(n=rO(this,lu))?void 0:n.associateElement)||s.call(n,this))):e===rB.DISABLED&&i!==t?null==i?this.enable():this.disable():e===rB.STYLE&&i!==t&&rP(this,ly,l_).call(this)}formatMenuItemText(e,t){return this.constructor.formatMenuItemText(e,t)}get anchor(){return this.getAttribute("anchor")}set anchor(e){this.setAttribute("anchor",`${e}`)}get anchorElement(){var e;return this.anchor?null==(e=e$(this))?void 0:e.querySelector(`#${this.anchor}`):null}get items(){return this.defaultSlot.assignedElements({flatten:!0}).filter(rV)}get radioGroupItems(){return this.items.filter(e=>"menuitemradio"===e.role)}get checkedItems(){return this.items.filter(e=>e.checked)}get value(){var e,t;return null!=(t=null==(e=this.checkedItems[0])?void 0:e.value)?t:""}set value(e){let t=this.items.find(t=>t.value===e);t&&rP(this,l0,l1).call(this,t)}focus(){if(rx(this,lh,eV()),this.items.length){rP(this,lX,lJ).call(this,this.items[0]),this.items[0].focus();return}let e=this.querySelector('[autofocus], [tabindex]:not([tabindex="-1"]), [role="menu"]');null==e||e.focus()}handleSelect(e){var t;let i=rP(this,lj,lZ).call(this,e);i&&(rP(this,l0,l1).call(this,i,"checkbox"===i.type),rO(this,lm)&&!this.hidden&&(null==(t=rO(this,lh))||t.focus(),this.hidden=!0))}get keysUsed(){return["Enter","Escape","Tab"," ","ArrowDown","ArrowUp","Home","End"]}handleMove(e){var t,i;let{key:a}=e,r=this.items,n=null!=(i=null!=(t=rP(this,lj,lZ).call(this,e))?t:rP(this,lQ,lz).call(this))?i:r[0],s=Math.max(0,r.indexOf(n));"ArrowDown"===a?s++:"ArrowUp"===a?s--:"Home"===e.key?s=0:"End"===e.key&&(s=r.length-1),s<0&&(s=r.length-1),s>r.length-1&&(s=0),rP(this,lX,lJ).call(this,r[s]),r[s].focus()}}function rV(e){return["menuitem","menuitemradio","menuitemcheckbox"].includes(null==e?void 0:e.role)}function r$(e){var t;return null!=(t=e.getAttribute("bounds")?eH(e,`#${e.getAttribute("bounds")}`):ex(e)||e.parentElement)?t:e}lu=new WeakMap,lh=new WeakMap,lm=new WeakMap,lc=new WeakMap,lp=new WeakMap,lE=new WeakMap,lv=new WeakMap,lb=new WeakSet,lg=function(e){let t=e.target;for(let e of t.assignedNodes({flatten:!0}))3===e.nodeType&&""===e.textContent.trim()&&e.remove();["header","title"].includes(t.name)&&rP(this,lf,lA).call(this),t.name||rO(this,lT).call(this)},lf=new WeakSet,lA=function(){let e=this.shadowRoot.querySelector('slot[name="header"]');e.hidden=0===this.shadowRoot.querySelector('slot[name="title"]').assignedNodes().length&&0===e.assignedNodes().length},lT=new WeakMap,ly=new WeakSet,l_=function(){var e;let t=this.shadowRoot.querySelector("#layout-row"),i=null==(e=getComputedStyle(this).getPropertyValue("--media-menu-layout"))?void 0:e.trim();t.setAttribute("media","row"===i?"":"width:0")},lk=new WeakSet,lI=function(e){rx(this,lm,e.relatedTarget),eB(this,e.relatedTarget)||(this.hidden=!this.hidden)},lS=new WeakSet,lR=function(){var e;null==(e=rO(this,lm))||e.setAttribute("aria-expanded","true"),this.addEventListener("transitionend",()=>this.focus(),{once:!0}),eD(r$(this),rO(this,lL)),eD(this,rO(this,lM))},lw=new WeakSet,lC=function(){var e;null==(e=rO(this,lm))||e.setAttribute("aria-expanded","false"),eO(r$(this),rO(this,lL)),eO(this,rO(this,lM))},lL=new WeakMap,lM=new WeakMap,lD=new WeakSet,lO=function(e){if(this.hasAttribute("mediacontroller")&&!this.anchor||this.hidden||!this.anchorElement)return;let{x:t,y:i}=function({anchor:e,floating:t,placement:i}){let{x:a,y:r}=function({anchor:e,floating:t},i){let a,r="x"==(["top","bottom"].includes(rC(i))?"y":"x")?"y":"x",n="y"===r?"height":"width",s=rC(i),o=e.x+e.width/2-t.width/2,l=e.y+e.height/2-t.height/2,d=e[n]/2-t[n]/2;switch(s){case"top":a={x:o,y:e.y-t.height};break;case"bottom":a={x:o,y:e.y+e.height};break;case"right":a={x:e.x+e.width,y:l};break;case"left":a={x:e.x-t.width,y:l};break;default:a={x:e.x,y:e.y}}switch(i.split("-")[1]){case"start":a[r]-=d;break;case"end":a[r]+=d}return a}(function({anchor:e,floating:t}){return{anchor:function(e,t){var i;let a=e.getBoundingClientRect(),r=null!=(i=null==t?void 0:t.getBoundingClientRect())?i:{x:0,y:0};return{x:a.x-r.x,y:a.y-r.y,width:a.width,height:a.height}}(e,t.offsetParent),floating:{x:0,y:0,width:t.offsetWidth,height:t.offsetHeight}}}({anchor:e,floating:t}),i);return{x:a,y:r}}({anchor:this.anchorElement,floating:this,placement:"top-start"});null!=e||(e=this.offsetWidth);let a=r$(this).getBoundingClientRect(),r=a.width-t-e,n=a.height-i-this.offsetHeight,{style:s}=rO(this,lv);s.setProperty("position","absolute"),s.setProperty("right",`${Math.max(0,r)}px`),s.setProperty("--_menu-bottom",`${n}px`);let o=getComputedStyle(this),l=s.getPropertyValue("--_menu-bottom")===o.bottom?n:parseFloat(o.bottom),d=a.height-l-parseFloat(o.marginBottom);this.style.setProperty("--_menu-max-height",`${d}px`)},lN=new WeakSet,lx=function(e){let t=this.querySelector('[role="menuitem"][aria-haspopup][aria-expanded="true"]'),i=null==t?void 0:t.querySelector('[role="menu"]'),{style:a}=rO(this,lv);if(e||a.setProperty("--media-menu-transition-in","none"),i){let e=i.offsetHeight,a=Math.max(i.offsetWidth,t.offsetWidth);this.style.setProperty("min-width",`${a}px`),this.style.setProperty("min-height",`${e}px`),rP(this,lD,lO).call(this,a)}else this.style.removeProperty("min-width"),this.style.removeProperty("min-height"),rP(this,lD,lO).call(this);a.removeProperty("--media-menu-transition-in")},lP=new WeakSet,lU=function(e){var t;if(e.stopPropagation(),e.composedPath().includes(rO(this,lW,lB))){null==(t=rO(this,lh))||t.focus(),this.hidden=!0;return}let i=rP(this,lj,lZ).call(this,e);!i||i.hasAttribute("disabled")||(rP(this,lX,lJ).call(this,i),this.handleSelect(e))},lW=new WeakSet,lB=function(){var e;return null==(e=this.shadowRoot.querySelector('slot[name="header"]').assignedElements({flatten:!0}))?void 0:e.find(e=>e.matches('button[part~="back"]'))},lH=new WeakSet,lV=function(e){if(e.target===this)return;rP(this,l$,lK).call(this);let t=Array.from(this.querySelectorAll('[role="menuitem"][aria-haspopup]'));for(let i of t)i.invokeTargetElement!=e.target&&("open"!=e.newState||"true"!=i.getAttribute("aria-expanded")||i.invokeTargetElement.hidden||i.invokeTargetElement.dispatchEvent(new rL({relatedTarget:i})));for(let e of t)e.setAttribute("aria-expanded",`${!e.submenuElement.hidden}`);rP(this,lN,lx).call(this,!0)},l$=new WeakSet,lK=function(){let e=this.querySelector('[role="menuitem"] > [role="menu"]:not([hidden])');this.container.classList.toggle("has-expanded",!!e)},lF=new WeakSet,lY=function(e){var t;eB(this,e.relatedTarget)||(rO(this,lE)&&(null==(t=rO(this,lh))||t.focus()),rO(this,lm)&&rO(this,lm)!==e.relatedTarget&&!this.hidden&&(this.hidden=!0))},lG=new WeakSet,lq=function(e){var t,i,a,r,n;let{key:s,ctrlKey:o,altKey:l,metaKey:d}=e;if(!o&&!l&&!d&&this.keysUsed.includes(s))if(e.preventDefault(),e.stopPropagation(),"Tab"===s){if(rO(this,lE)){this.hidden=!0;return}e.shiftKey?null==(i=null==(t=this.previousElementSibling)?void 0:t.focus)||i.call(t):null==(r=null==(a=this.nextElementSibling)?void 0:a.focus)||r.call(a),this.blur()}else"Escape"===s?(null==(n=rO(this,lh))||n.focus(),rO(this,lE)&&(this.hidden=!0)):"Enter"===s||" "===s?this.handleSelect(e):this.handleMove(e)},lj=new WeakSet,lZ=function(e){return e.composedPath().find(e=>["menuitemradio","menuitemcheckbox"].includes(e.role))},lQ=new WeakSet,lz=function(){return this.items.find(e=>0===e.tabIndex)},lX=new WeakSet,lJ=function(e){for(let t of this.items)t.tabIndex=t===e?0:-1},l0=new WeakSet,l1=function(e,t){let i=[...this.checkedItems];"radio"===e.type&&this.radioGroupItems.forEach(e=>e.checked=!1),t?e.checked=!e.checked:e.checked=!0,this.checkedItems.some((e,t)=>e!=i[t])&&this.dispatchEvent(new Event("change",{bubbles:!0,composed:!0}))},rH.shadowRootOptions={mode:"open"},rH.getTemplateHTML=function(e){return`
    <style>
      :host {
        font: var(--media-font,
          var(--media-font-weight, normal)
          var(--media-font-size, 14px) /
          var(--media-text-content-height, var(--media-control-height, 24px))
          var(--media-font-family, helvetica neue, segoe ui, roboto, arial, sans-serif));
        color: var(--media-text-color, var(--media-primary-color, rgb(238 238 238)));
        --_menu-bg: rgb(20 20 30 / .8);
        background: var(--media-menu-background, var(--media-control-background, var(--media-secondary-color, var(--_menu-bg))));
        border-radius: var(--media-menu-border-radius);
        border: var(--media-menu-border, none);
        display: var(--media-menu-display, inline-flex) !important;
        
        transition: var(--media-menu-transition-in,
          visibility 0s,
          opacity .2s ease-out,
          transform .15s ease-out,
          left .2s ease-in-out,
          min-width .2s ease-in-out,
          min-height .2s ease-in-out
        ) !important;
        
        visibility: var(--media-menu-visibility, visible);
        opacity: var(--media-menu-opacity, 1);
        max-height: var(--media-menu-max-height, var(--_menu-max-height, 300px));
        transform: var(--media-menu-transform-in, translateY(0) scale(1));
        flex-direction: column;
        
        min-height: 0;
        position: relative;
        bottom: var(--_menu-bottom);
        box-sizing: border-box;
      } 

      @-moz-document url-prefix() {
        :host{
          --_menu-bg: rgb(20 20 30);
        }
      }

      :host([hidden]) {
        transition: var(--media-menu-transition-out,
          visibility .15s ease-in,
          opacity .15s ease-in,
          transform .15s ease-in
        ) !important;
        visibility: var(--media-menu-hidden-visibility, hidden);
        opacity: var(--media-menu-hidden-opacity, 0);
        max-height: var(--media-menu-hidden-max-height,
          var(--media-menu-max-height, var(--_menu-max-height, 300px)));
        transform: var(--media-menu-transform-out, translateY(2px) scale(.99));
        pointer-events: none;
      }

      :host([slot="submenu"]) {
        background: none;
        width: 100%;
        min-height: 100%;
        position: absolute;
        bottom: 0;
        right: -100%;
      }

      #container {
        display: flex;
        flex-direction: column;
        min-height: 0;
        transition: transform .2s ease-out;
        transform: translate(0, 0);
      }

      #container.has-expanded {
        transition: transform .2s ease-in;
        transform: translate(-100%, 0);
      }

      button {
        background: none;
        color: inherit;
        border: none;
        padding: 0;
        font: inherit;
        outline: inherit;
        display: inline-flex;
        align-items: center;
      }

      slot[name="header"][hidden] {
        display: none;
      }

      slot[name="header"] > *,
      slot[name="header"]::slotted(*) {
        padding: .4em .7em;
        border-bottom: 1px solid rgb(255 255 255 / .25);
        cursor: var(--media-cursor, default);
      }

      slot[name="header"] > button[part~="back"],
      slot[name="header"]::slotted(button[part~="back"]) {
        cursor: var(--media-cursor, pointer);
      }

      svg[part~="back"] {
        height: var(--media-menu-icon-height, var(--media-control-height, 24px));
        fill: var(--media-icon-color, var(--media-primary-color, rgb(238 238 238)));
        display: block;
        margin-right: .5ch;
      }

      slot:not([name]) {
        gap: var(--media-menu-gap);
        flex-direction: var(--media-menu-flex-direction, column);
        overflow: var(--media-menu-overflow, hidden auto);
        display: flex;
        min-height: 0;
      }

      :host([role="menu"]) slot:not([name]) {
        padding-block: .4em;
      }

      slot:not([name])::slotted([role="menu"]) {
        background: none;
      }

      media-chrome-menu-item > span {
        margin-right: .5ch;
        max-width: var(--media-menu-item-max-width);
        text-overflow: ellipsis;
        overflow: hidden;
      }
    </style>
    <style id="layout-row" media="width:0">

      slot[name="header"] > *,
      slot[name="header"]::slotted(*) {
        padding: .4em .5em;
      }

      slot:not([name]) {
        gap: var(--media-menu-gap, .25em);
        flex-direction: var(--media-menu-flex-direction, row);
        padding-inline: .5em;
      }

      media-chrome-menu-item {
        padding: .3em .5em;
      }

      media-chrome-menu-item[aria-checked="true"] {
        background: var(--media-menu-item-checked-background, rgb(255 255 255 / .2));
      }

      
      media-chrome-menu-item::part(checked-indicator) {
        display: var(--media-menu-item-checked-indicator-display, none);
      }
    </style>
    <div id="container" part="container">
      <slot name="header" hidden>
        <button part="back button" aria-label="Back to previous menu">
          <slot name="back-icon">
            <svg aria-hidden="true" viewBox="0 0 20 24" part="back indicator">
              <path d="m11.88 17.585.742-.669-4.2-4.665 4.2-4.666-.743-.669-4.803 5.335 4.803 5.334Z"/>
            </svg>
          </slot>
          <slot name="title"></slot>
        </button>
      </slot>
      <slot></slot>
    </div>
    <slot name="checked-indicator" hidden></slot>
  `},eR.customElements.get("media-chrome-menu")||eR.customElements.define("media-chrome-menu",rH);var rK=(e,t,i)=>{if(!t.has(e))throw TypeError("Cannot "+i)},rF=(e,t,i)=>(rK(e,t,"read from private field"),i?i.call(e):t.get(e)),rY=(e,t,i)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,i)},rG=(e,t,i,a)=>(rK(e,t,"write to private field"),a?a.call(e,i):t.set(e,i),i),rq=(e,t,i)=>(rK(e,t,"access private method"),i);let rj={TYPE:"type",VALUE:"value",CHECKED:"checked",DISABLED:"disabled"};class rZ extends eR.HTMLElement{constructor(){if(super(),rY(this,l4),rY(this,l9),rY(this,l6),rY(this,dt),rY(this,da),rY(this,dn),rY(this,l2,!1),rY(this,l3,void 0),rY(this,de,()=>{var e,t;this.submenuElement.items&&this.setAttribute("submenusize",`${this.submenuElement.items.length}`);let i=this.shadowRoot.querySelector('slot[name="description"]'),a=null==(e=this.submenuElement.checkedItems)?void 0:e[0],r=null!=(t=null==a?void 0:a.dataset.description)?t:null==a?void 0:a.text,n=ew.createElement("span");n.textContent=null!=r?r:"",i.replaceChildren(n)}),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);let e=eN(this.attributes);this.shadowRoot.innerHTML=this.constructor.getTemplateHTML(e)}this.shadowRoot.addEventListener("slotchange",this)}static get observedAttributes(){return[rj.TYPE,rj.DISABLED,rj.CHECKED,rj.VALUE]}enable(){this.hasAttribute("tabindex")||this.setAttribute("tabindex","-1"),rQ(this)&&!this.hasAttribute("aria-checked")&&this.setAttribute("aria-checked","false"),this.addEventListener("click",this),this.addEventListener("keydown",this)}disable(){this.removeAttribute("tabindex"),this.removeEventListener("click",this),this.removeEventListener("keydown",this),this.removeEventListener("keyup",this)}handleEvent(e){switch(e.type){case"slotchange":rq(this,l4,l5).call(this,e);break;case"click":this.handleClick(e);break;case"keydown":rq(this,da,dr).call(this,e);break;case"keyup":rq(this,dt,di).call(this,e)}}attributeChangedCallback(e,t,i){e===rj.CHECKED&&rQ(this)&&!rF(this,l2)?this.setAttribute("aria-checked",null!=i?"true":"false"):e===rj.TYPE&&i!==t?this.role="menuitem"+i:e===rj.DISABLED&&i!==t&&(null==i?this.enable():this.disable())}connectedCallback(){this.hasAttribute(rj.DISABLED)||this.enable(),this.role="menuitem"+this.type,rG(this,l3,function e(t,i){if(!t)return null;let{host:a}=t.getRootNode();return!i&&a?e(t,a):(null==i?void 0:i.items)?i:e(i,null==i?void 0:i.parentNode)}(this,this.parentNode)),rq(this,dn,ds).call(this),this.submenuElement&&rq(this,l9,l8).call(this)}disconnectedCallback(){this.disable(),rq(this,dn,ds).call(this),rG(this,l3,null)}get invokeTarget(){return this.getAttribute("invoketarget")}set invokeTarget(e){this.setAttribute("invoketarget",`${e}`)}get invokeTargetElement(){var e;return this.invokeTarget?null==(e=e$(this))?void 0:e.querySelector(`#${this.invokeTarget}`):this.submenuElement}get submenuElement(){return this.shadowRoot.querySelector('slot[name="submenu"]').assignedElements({flatten:!0})[0]}get type(){var e;return null!=(e=this.getAttribute(rj.TYPE))?e:""}set type(e){this.setAttribute(rj.TYPE,`${e}`)}get value(){var e;return null!=(e=this.getAttribute(rj.VALUE))?e:this.text}set value(e){this.setAttribute(rj.VALUE,e)}get text(){var e;return(null!=(e=this.textContent)?e:"").trim()}get checked(){if(rQ(this))return"true"===this.getAttribute("aria-checked")}set checked(e){rQ(this)&&(rG(this,l2,!0),this.setAttribute("aria-checked",e?"true":"false"),e?this.part.add("checked"):this.part.remove("checked"))}handleClick(e){!rQ(this)&&this.invokeTargetElement&&eB(this,e.target)&&this.invokeTargetElement.dispatchEvent(new rL({relatedTarget:this}))}get keysUsed(){return["Enter"," "]}}function rQ(e){return"radio"===e.type||"checkbox"===e.type}l2=new WeakMap,l3=new WeakMap,l4=new WeakSet,l5=function(e){let t=e.target;if(!(null==t?void 0:t.name))for(let e of t.assignedNodes({flatten:!0}))e instanceof Text&&""===e.textContent.trim()&&e.remove();"submenu"===t.name&&(this.submenuElement?rq(this,l9,l8).call(this):rq(this,l6,l7).call(this))},l9=new WeakSet,l8=async function(){this.setAttribute("aria-haspopup","menu"),this.setAttribute("aria-expanded",`${!this.submenuElement.hidden}`),this.submenuElement.addEventListener("change",rF(this,de)),this.submenuElement.addEventListener("addmenuitem",rF(this,de)),this.submenuElement.addEventListener("removemenuitem",rF(this,de)),rF(this,de).call(this)},l6=new WeakSet,l7=function(){this.removeAttribute("aria-haspopup"),this.removeAttribute("aria-expanded"),this.submenuElement.removeEventListener("change",rF(this,de)),this.submenuElement.removeEventListener("addmenuitem",rF(this,de)),this.submenuElement.removeEventListener("removemenuitem",rF(this,de)),rF(this,de).call(this)},de=new WeakMap,dt=new WeakSet,di=function(e){let{key:t}=e;if(!this.keysUsed.includes(t))return void this.removeEventListener("keyup",rq(this,dt,di));this.handleClick(e)},da=new WeakSet,dr=function(e){let{metaKey:t,altKey:i,key:a}=e;if(t||i||!this.keysUsed.includes(a))return void this.removeEventListener("keyup",rq(this,dt,di));this.addEventListener("keyup",rq(this,dt,di),{once:!0})},dn=new WeakSet,ds=function(){var e;let t=null==(e=rF(this,l3))?void 0:e.radioGroupItems;if(!t)return;let i=t.filter(e=>"true"===e.getAttribute("aria-checked")).pop();for(let e of(i||(i=t[0]),t))e.setAttribute("aria-checked","false");null==i||i.setAttribute("aria-checked","true")},rZ.shadowRootOptions={mode:"open"},rZ.getTemplateHTML=function(e){return`
    <style>
      :host {
        transition: var(--media-menu-item-transition,
          background .15s linear,
          opacity .2s ease-in-out
        );
        outline: var(--media-menu-item-outline, 0);
        outline-offset: var(--media-menu-item-outline-offset, -1px);
        cursor: var(--media-cursor, pointer);
        display: flex;
        align-items: center;
        align-self: stretch;
        justify-self: stretch;
        white-space: nowrap;
        white-space-collapse: collapse;
        text-wrap: nowrap;
        padding: .4em .8em .4em 1em;
      }

      :host(:focus-visible) {
        box-shadow: var(--media-menu-item-focus-shadow, inset 0 0 0 2px rgb(27 127 204 / .9));
        outline: var(--media-menu-item-hover-outline, 0);
        outline-offset: var(--media-menu-item-hover-outline-offset,  var(--media-menu-item-outline-offset, -1px));
      }

      :host(:hover) {
        cursor: var(--media-cursor, pointer);
        background: var(--media-menu-item-hover-background, rgb(92 92 102 / .5));
        outline: var(--media-menu-item-hover-outline);
        outline-offset: var(--media-menu-item-hover-outline-offset,  var(--media-menu-item-outline-offset, -1px));
      }

      :host([aria-checked="true"]) {
        background: var(--media-menu-item-checked-background);
      }

      :host([hidden]) {
        display: none;
      }

      :host([disabled]) {
        pointer-events: none;
        color: rgba(255, 255, 255, .3);
      }

      slot:not([name]) {
        width: 100%;
      }

      slot:not([name="submenu"]) {
        display: inline-flex;
        align-items: center;
        transition: inherit;
        opacity: var(--media-menu-item-opacity, 1);
      }

      slot[name="description"] {
        justify-content: end;
      }

      slot[name="description"] > span {
        display: inline-block;
        margin-inline: 1em .2em;
        max-width: var(--media-menu-item-description-max-width, 100px);
        text-overflow: ellipsis;
        overflow: hidden;
        font-size: .8em;
        font-weight: 400;
        text-align: right;
        position: relative;
        top: .04em;
      }

      slot[name="checked-indicator"] {
        display: none;
      }

      :host(:is([role="menuitemradio"],[role="menuitemcheckbox"])) slot[name="checked-indicator"] {
        display: var(--media-menu-item-checked-indicator-display, inline-block);
      }

      
      svg, img, ::slotted(svg), ::slotted(img) {
        height: var(--media-menu-item-icon-height, var(--media-control-height, 24px));
        fill: var(--media-icon-color, var(--media-primary-color, rgb(238 238 238)));
        display: block;
      }

      
      [part~="indicator"],
      ::slotted([part~="indicator"]) {
        fill: var(--media-menu-item-indicator-fill,
          var(--media-icon-color, var(--media-primary-color, rgb(238 238 238))));
        height: var(--media-menu-item-indicator-height, 1.25em);
        margin-right: .5ch;
      }

      [part~="checked-indicator"] {
        visibility: hidden;
      }

      :host([aria-checked="true"]) [part~="checked-indicator"] {
        visibility: visible;
      }
    </style>
    <slot name="checked-indicator">
      <svg aria-hidden="true" viewBox="0 1 24 24" part="checked-indicator indicator">
        <path d="m10 15.17 9.193-9.191 1.414 1.414-10.606 10.606-6.364-6.364 1.414-1.414 4.95 4.95Z"/>
      </svg>
    </slot>
    <slot name="prefix"></slot>
    <slot></slot>
    <slot name="description"></slot>
    <slot name="suffix">
      ${this.getSuffixSlotInnerHTML(e)}
    </slot>
    <slot name="submenu"></slot>
  `},rZ.getSuffixSlotInnerHTML=function(e){return""},eR.customElements.get("media-chrome-menu-item")||eR.customElements.define("media-chrome-menu-item",rZ);class rz extends rH{get anchorElement(){return"auto"!==this.anchor?super.anchorElement:ex(this).querySelector("media-settings-menu-button")}}rz.getTemplateHTML=function(e){return`
    ${rH.getTemplateHTML(e)}
    <style>
      :host {
        --_menu-bg: rgb(20 20 30 / .8);
        background: var(--media-settings-menu-background,
            var(--media-menu-background,
              var(--media-control-background,
                var(--media-secondary-color, var(--_menu-bg)))));
        min-width: var(--media-settings-menu-min-width, 170px);
        border-radius: 2px 2px 0 0;
        overflow: hidden;
      }

      @-moz-document url-prefix() {
        :host{
          --_menu-bg: rgb(20 20 30);
        }
      }

      :host([role="menu"]) {
        
        justify-content: end;
      }

      slot:not([name]) {
        justify-content: var(--media-settings-menu-justify-content);
        flex-direction: var(--media-settings-menu-flex-direction, column);
        overflow: visible;
      }

      #container.has-expanded {
        --media-settings-menu-item-opacity: 0;
      }
    </style>
  `},eR.customElements.get("media-settings-menu")||eR.customElements.define("media-settings-menu",rz);class rX extends rZ{}rX.shadowRootOptions={mode:"open"},rX.getTemplateHTML=function(e){return`
    ${rZ.getTemplateHTML.call(this,e)}
    <style>
      slot:not([name="submenu"]) {
        opacity: var(--media-settings-menu-item-opacity, var(--media-menu-item-opacity));
      }

      :host([aria-expanded="true"]:hover) {
        background: transparent;
      }
    </style>
  `},rX.getSuffixSlotInnerHTML=function(e){return`
    <svg aria-hidden="true" viewBox="0 0 20 24">
      <path d="m8.12 17.585-.742-.669 4.2-4.665-4.2-4.666.743-.669 4.803 5.335-4.803 5.334Z"/>
    </svg>
  `},eR.customElements.get("media-settings-menu-item")||eR.customElements.define("media-settings-menu-item",rX);class rJ extends it{connectedCallback(){super.connectedCallback(),this.invokeTargetElement&&this.setAttribute("aria-haspopup","menu")}get invokeTarget(){return this.getAttribute("invoketarget")}set invokeTarget(e){this.setAttribute("invoketarget",`${e}`)}get invokeTargetElement(){var e;return this.invokeTarget?null==(e=e$(this))?void 0:e.querySelector(`#${this.invokeTarget}`):null}handleClick(){var e;null==(e=this.invokeTargetElement)||e.dispatchEvent(new rL({relatedTarget:this}))}}eR.customElements.get("media-chrome-menu-button")||eR.customElements.define("media-chrome-menu-button",rJ);class r0 extends rJ{static get observedAttributes(){return[...super.observedAttributes,"target"]}connectedCallback(){super.connectedCallback(),this.setAttribute("aria-label",eg("settings"))}get invokeTargetElement(){return void 0!=this.invokeTarget?super.invokeTargetElement:ex(this).querySelector("media-settings-menu")}}r0.getSlotTemplateHTML=function(){return`
    <style>
      :host([aria-expanded="true"]) slot[name=tooltip] {
        display: none;
      }
    </style>
    <slot name="icon">
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M4.5 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm7.5 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm7.5 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
      </svg>
    </slot>
  `},r0.getTooltipContentHTML=function(){return eg("Settings")},eR.customElements.get("media-settings-menu-button")||eR.customElements.define("media-settings-menu-button",r0);var r1=(e,t,i)=>{if(!t.has(e))throw TypeError("Cannot "+i)},r2=(e,t,i)=>(r1(e,t,"read from private field"),i?i.call(e):t.get(e)),r3=(e,t,i)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,i)},r4=(e,t,i,a)=>(r1(e,t,"write to private field"),a?a.call(e,i):t.set(e,i),i),r5=(e,t,i)=>(r1(e,t,"access private method"),i);class r9 extends rH{constructor(){super(...arguments),r3(this,du),r3(this,dm),r3(this,dl,[]),r3(this,dd,void 0)}static get observedAttributes(){return[...super.observedAttributes,z.MEDIA_AUDIO_TRACK_LIST,z.MEDIA_AUDIO_TRACK_ENABLED,z.MEDIA_AUDIO_TRACK_UNAVAILABLE]}attributeChangedCallback(e,t,i){if(super.attributeChangedCallback(e,t,i),e===z.MEDIA_AUDIO_TRACK_ENABLED&&t!==i)this.value=i;else if(e===z.MEDIA_AUDIO_TRACK_LIST&&t!==i){var a;r4(this,dl,null==(a=null!=i?i:"")?void 0:a.split(/\s+/).map(ed)),r5(this,du,dh).call(this)}}connectedCallback(){super.connectedCallback(),this.addEventListener("change",r5(this,dm,dc))}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("change",r5(this,dm,dc))}get anchorElement(){var e;return"auto"!==this.anchor?super.anchorElement:null==(e=ex(this))?void 0:e.querySelector("media-audio-track-menu-button")}get mediaAudioTrackList(){return r2(this,dl)}set mediaAudioTrackList(e){r4(this,dl,e),r5(this,du,dh).call(this)}get mediaAudioTrackEnabled(){var e;return null!=(e=eQ(this,z.MEDIA_AUDIO_TRACK_ENABLED))?e:""}set mediaAudioTrackEnabled(e){ez(this,z.MEDIA_AUDIO_TRACK_ENABLED,e)}}dl=new WeakMap,dd=new WeakMap,du=new WeakSet,dh=function(){if(r2(this,dd)===JSON.stringify(this.mediaAudioTrackList))return;r4(this,dd,JSON.stringify(this.mediaAudioTrackList));let e=this.mediaAudioTrackList;for(let t of(this.defaultSlot.textContent="",e.sort((e,t)=>e.id.localeCompare(t.id,void 0,{numeric:!0})),e)){let e=rU({type:"radio",text:this.formatMenuItemText(t.label,t),value:`${t.id}`,checked:t.enabled});e.prepend(rW(this,"checked-indicator")),this.defaultSlot.append(e)}},dm=new WeakSet,dc=function(){if(null==this.value)return;let e=new eR.CustomEvent(q.MEDIA_AUDIO_TRACK_REQUEST,{composed:!0,bubbles:!0,detail:this.value});this.dispatchEvent(e)},eR.customElements.get("media-audio-track-menu")||eR.customElements.define("media-audio-track-menu",r9);let r8=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M11 17H9.5V7H11v10Zm-3-3H6.5v-4H8v4Zm6-5h-1.5v6H14V9Zm3 7h-1.5V8H17v8Z"/>
  <path d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10Zm-2 0a8 8 0 1 0-16 0 8 8 0 0 0 16 0Z"/>
</svg>`,r6=e=>{let t=eg("Audio");e.setAttribute("aria-label",t)};class r7 extends rJ{static get observedAttributes(){return[...super.observedAttributes,z.MEDIA_AUDIO_TRACK_ENABLED,z.MEDIA_AUDIO_TRACK_UNAVAILABLE]}connectedCallback(){super.connectedCallback(),r6(this)}attributeChangedCallback(e,t,i){super.attributeChangedCallback(e,t,i),e===z.MEDIA_LANG&&r6(this)}get invokeTargetElement(){var e;return void 0!=this.invokeTarget?super.invokeTargetElement:null==(e=ex(this))?void 0:e.querySelector("media-audio-track-menu")}get mediaAudioTrackEnabled(){var e;return null!=(e=eQ(this,z.MEDIA_AUDIO_TRACK_ENABLED))?e:""}set mediaAudioTrackEnabled(e){ez(this,z.MEDIA_AUDIO_TRACK_ENABLED,e)}}r7.getSlotTemplateHTML=function(){return`
    <style>
      :host([aria-expanded="true"]) slot[name=tooltip] {
        display: none;
      }
    </style>
    <slot name="icon">${r8}</slot>
  `},r7.getTooltipContentHTML=function(){return eg("Audio")},eR.customElements.get("media-audio-track-menu-button")||eR.customElements.define("media-audio-track-menu-button",r7);var ne=(e,t,i)=>{if(!t.has(e))throw TypeError("Cannot "+i)},nt=(e,t,i)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,i)},ni=(e,t,i)=>(ne(e,t,"access private method"),i);let na=`
  <svg aria-hidden="true" viewBox="0 0 26 24" part="captions-indicator indicator">
    <path d="M22.83 5.68a2.58 2.58 0 0 0-2.3-2.5c-3.62-.24-11.44-.24-15.06 0a2.58 2.58 0 0 0-2.3 2.5c-.23 4.21-.23 8.43 0 12.64a2.58 2.58 0 0 0 2.3 2.5c3.62.24 11.44.24 15.06 0a2.58 2.58 0 0 0 2.3-2.5c.23-4.21.23-8.43 0-12.64Zm-11.39 9.45a3.07 3.07 0 0 1-1.91.57 3.06 3.06 0 0 1-2.34-1 3.75 3.75 0 0 1-.92-2.67 3.92 3.92 0 0 1 .92-2.77 3.18 3.18 0 0 1 2.43-1 2.94 2.94 0 0 1 2.13.78c.364.359.62.813.74 1.31l-1.43.35a1.49 1.49 0 0 0-1.51-1.17 1.61 1.61 0 0 0-1.29.58 2.79 2.79 0 0 0-.5 1.89 3 3 0 0 0 .49 1.93 1.61 1.61 0 0 0 1.27.58 1.48 1.48 0 0 0 1-.37 2.1 2.1 0 0 0 .59-1.14l1.4.44a3.23 3.23 0 0 1-1.07 1.69Zm7.22 0a3.07 3.07 0 0 1-1.91.57 3.06 3.06 0 0 1-2.34-1 3.75 3.75 0 0 1-.92-2.67 3.88 3.88 0 0 1 .93-2.77 3.14 3.14 0 0 1 2.42-1 3 3 0 0 1 2.16.82 2.8 2.8 0 0 1 .73 1.31l-1.43.35a1.49 1.49 0 0 0-1.51-1.21 1.61 1.61 0 0 0-1.29.58A2.79 2.79 0 0 0 15 12a3 3 0 0 0 .49 1.93 1.61 1.61 0 0 0 1.27.58 1.44 1.44 0 0 0 1-.37 2.1 2.1 0 0 0 .6-1.15l1.4.44a3.17 3.17 0 0 1-1.1 1.7Z"/>
  </svg>`;class nr extends rH{constructor(){super(...arguments),nt(this,dE),nt(this,db),nt(this,dp,void 0)}static get observedAttributes(){return[...super.observedAttributes,z.MEDIA_SUBTITLES_LIST,z.MEDIA_SUBTITLES_SHOWING]}attributeChangedCallback(e,t,i){super.attributeChangedCallback(e,t,i),e===z.MEDIA_SUBTITLES_LIST&&t!==i?ni(this,dE,dv).call(this):e===z.MEDIA_SUBTITLES_SHOWING&&t!==i&&(this.value=i||"",ni(this,dE,dv).call(this))}connectedCallback(){super.connectedCallback(),this.addEventListener("change",ni(this,db,dg))}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("change",ni(this,db,dg))}get anchorElement(){return"auto"!==this.anchor?super.anchorElement:ex(this).querySelector("media-captions-menu-button")}get mediaSubtitlesList(){return nn(this,z.MEDIA_SUBTITLES_LIST)}set mediaSubtitlesList(e){ns(this,z.MEDIA_SUBTITLES_LIST,e)}get mediaSubtitlesShowing(){return nn(this,z.MEDIA_SUBTITLES_SHOWING)}set mediaSubtitlesShowing(e){ns(this,z.MEDIA_SUBTITLES_SHOWING,e)}}dp=new WeakMap,dE=new WeakSet,dv=function(){var e,t,i,a,r,n;let s=(ne(this,t=dp,"read from private field"),(i?i.call(this):t.get(this))!==JSON.stringify(this.mediaSubtitlesList)),o=this.value!==this.getAttribute(z.MEDIA_SUBTITLES_SHOWING);if(!s&&!o)return;a=dp,r=JSON.stringify(this.mediaSubtitlesList),ne(this,a,"write to private field"),n?n.call(this,r):a.set(this,r),this.defaultSlot.textContent="";let l=!this.value,d=rU({type:"radio",text:this.formatMenuItemText(eg("Off")),value:"off",checked:l});for(let t of(d.prepend(rW(this,"checked-indicator")),this.defaultSlot.append(d),this.mediaSubtitlesList)){let i=rU({type:"radio",text:this.formatMenuItemText(t.label,t),value:td(t),checked:this.value==td(t)});i.prepend(rW(this,"checked-indicator")),"captions"===(null!=(e=t.kind)?e:"subs")&&i.append(rW(this,"captions-indicator")),this.defaultSlot.append(i)}},db=new WeakSet,dg=function(){let e=this.mediaSubtitlesShowing,t=this.getAttribute(z.MEDIA_SUBTITLES_SHOWING),i=this.value!==t;if((null==e?void 0:e.length)&&i&&this.dispatchEvent(new eR.CustomEvent(q.MEDIA_DISABLE_SUBTITLES_REQUEST,{composed:!0,bubbles:!0,detail:e})),!this.value||!i)return;let a=new eR.CustomEvent(q.MEDIA_SHOW_SUBTITLES_REQUEST,{composed:!0,bubbles:!0,detail:this.value});this.dispatchEvent(a)},nr.getTemplateHTML=function(e){return`
    ${rH.getTemplateHTML(e)}
    <slot name="captions-indicator" hidden>${na}</slot>
  `};let nn=(e,t)=>{let i=e.getAttribute(t);return i?to(i):[]},ns=(e,t,i)=>{if(!(null==i?void 0:i.length))return void e.removeAttribute(t);let a=tu(i);e.getAttribute(t)!==a&&e.setAttribute(t,a)};eR.customElements.get("media-captions-menu")||eR.customElements.define("media-captions-menu",nr);let no=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M22.83 5.68a2.58 2.58 0 0 0-2.3-2.5c-3.62-.24-11.44-.24-15.06 0a2.58 2.58 0 0 0-2.3 2.5c-.23 4.21-.23 8.43 0 12.64a2.58 2.58 0 0 0 2.3 2.5c3.62.24 11.44.24 15.06 0a2.58 2.58 0 0 0 2.3-2.5c.23-4.21.23-8.43 0-12.64Zm-11.39 9.45a3.07 3.07 0 0 1-1.91.57 3.06 3.06 0 0 1-2.34-1 3.75 3.75 0 0 1-.92-2.67 3.92 3.92 0 0 1 .92-2.77 3.18 3.18 0 0 1 2.43-1 2.94 2.94 0 0 1 2.13.78c.364.359.62.813.74 1.31l-1.43.35a1.49 1.49 0 0 0-1.51-1.17 1.61 1.61 0 0 0-1.29.58 2.79 2.79 0 0 0-.5 1.89 3 3 0 0 0 .49 1.93 1.61 1.61 0 0 0 1.27.58 1.48 1.48 0 0 0 1-.37 2.1 2.1 0 0 0 .59-1.14l1.4.44a3.23 3.23 0 0 1-1.07 1.69Zm7.22 0a3.07 3.07 0 0 1-1.91.57 3.06 3.06 0 0 1-2.34-1 3.75 3.75 0 0 1-.92-2.67 3.88 3.88 0 0 1 .93-2.77 3.14 3.14 0 0 1 2.42-1 3 3 0 0 1 2.16.82 2.8 2.8 0 0 1 .73 1.31l-1.43.35a1.49 1.49 0 0 0-1.51-1.21 1.61 1.61 0 0 0-1.29.58A2.79 2.79 0 0 0 15 12a3 3 0 0 0 .49 1.93 1.61 1.61 0 0 0 1.27.58 1.44 1.44 0 0 0 1-.37 2.1 2.1 0 0 0 .6-1.15l1.4.44a3.17 3.17 0 0 1-1.1 1.7Z"/>
</svg>`,nl=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M17.73 14.09a1.4 1.4 0 0 1-1 .37 1.579 1.579 0 0 1-1.27-.58A3 3 0 0 1 15 12a2.8 2.8 0 0 1 .5-1.85 1.63 1.63 0 0 1 1.29-.57 1.47 1.47 0 0 1 1.51 1.2l1.43-.34A2.89 2.89 0 0 0 19 9.07a3 3 0 0 0-2.14-.78 3.14 3.14 0 0 0-2.42 1 3.91 3.91 0 0 0-.93 2.78 3.74 3.74 0 0 0 .92 2.66 3.07 3.07 0 0 0 2.34 1 3.07 3.07 0 0 0 1.91-.57 3.17 3.17 0 0 0 1.07-1.74l-1.4-.45c-.083.43-.3.822-.62 1.12Zm-7.22 0a1.43 1.43 0 0 1-1 .37 1.58 1.58 0 0 1-1.27-.58A3 3 0 0 1 7.76 12a2.8 2.8 0 0 1 .5-1.85 1.63 1.63 0 0 1 1.29-.57 1.47 1.47 0 0 1 1.51 1.2l1.43-.34a2.81 2.81 0 0 0-.74-1.32 2.94 2.94 0 0 0-2.13-.78 3.18 3.18 0 0 0-2.43 1 4 4 0 0 0-.92 2.78 3.74 3.74 0 0 0 .92 2.66 3.07 3.07 0 0 0 2.34 1 3.07 3.07 0 0 0 1.91-.57 3.23 3.23 0 0 0 1.07-1.74l-1.4-.45a2.06 2.06 0 0 1-.6 1.07Zm12.32-8.41a2.59 2.59 0 0 0-2.3-2.51C18.72 3.05 15.86 3 13 3c-2.86 0-5.72.05-7.53.17a2.59 2.59 0 0 0-2.3 2.51c-.23 4.207-.23 8.423 0 12.63a2.57 2.57 0 0 0 2.3 2.5c1.81.13 4.67.19 7.53.19 2.86 0 5.72-.06 7.53-.19a2.57 2.57 0 0 0 2.3-2.5c.23-4.207.23-8.423 0-12.63Zm-1.49 12.53a1.11 1.11 0 0 1-.91 1.11c-1.67.11-4.45.18-7.43.18-2.98 0-5.76-.07-7.43-.18a1.11 1.11 0 0 1-.91-1.11c-.21-4.14-.21-8.29 0-12.43a1.11 1.11 0 0 1 .91-1.11C7.24 4.56 10 4.49 13 4.49s5.76.07 7.43.18a1.11 1.11 0 0 1 .91 1.11c.21 4.14.21 8.29 0 12.43Z"/>
</svg>`,nd=e=>{e.setAttribute("data-captions-enabled",tp(e).toString())},nu=e=>{e.setAttribute("aria-label",eg("closed captions"))};class nh extends rJ{static get observedAttributes(){return[...super.observedAttributes,z.MEDIA_SUBTITLES_LIST,z.MEDIA_SUBTITLES_SHOWING,z.MEDIA_LANG]}connectedCallback(){super.connectedCallback(),nu(this),nd(this)}attributeChangedCallback(e,t,i){super.attributeChangedCallback(e,t,i),e===z.MEDIA_SUBTITLES_SHOWING?nd(this):e===z.MEDIA_LANG&&nu(this)}get invokeTargetElement(){var e;return void 0!=this.invokeTarget?super.invokeTargetElement:null==(e=ex(this))?void 0:e.querySelector("media-captions-menu")}get mediaSubtitlesList(){return nm(this,z.MEDIA_SUBTITLES_LIST)}set mediaSubtitlesList(e){nc(this,z.MEDIA_SUBTITLES_LIST,e)}get mediaSubtitlesShowing(){return nm(this,z.MEDIA_SUBTITLES_SHOWING)}set mediaSubtitlesShowing(e){nc(this,z.MEDIA_SUBTITLES_SHOWING,e)}}nh.getSlotTemplateHTML=function(){return`
    <style>
      :host([data-captions-enabled="true"]) slot[name=off] {
        display: none !important;
      }

      
      :host(:not([data-captions-enabled="true"])) slot[name=on] {
        display: none !important;
      }

      :host([aria-expanded="true"]) slot[name=tooltip] {
        display: none;
      }
    </style>

    <slot name="icon">
      <slot name="on">${no}</slot>
      <slot name="off">${nl}</slot>
    </slot>
  `},nh.getTooltipContentHTML=function(){return eg("Captions")};let nm=(e,t)=>{let i=e.getAttribute(t);return i?to(i):[]},nc=(e,t,i)=>{if(!(null==i?void 0:i.length))return void e.removeAttribute(t);let a=tu(i);e.getAttribute(t)!==a&&e.setAttribute(t,a)};eR.customElements.get("media-captions-menu-button")||eR.customElements.define("media-captions-menu-button",nh);var np=(e,t,i)=>{if(!t.has(e))throw TypeError("Cannot "+i)},nE=(e,t,i)=>(np(e,t,"read from private field"),i?i.call(e):t.get(e)),nv=(e,t,i)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,i)},nb=(e,t,i)=>(np(e,t,"access private method"),i);let ng={RATES:"rates"};class nf extends rH{constructor(){super(),nv(this,dA),nv(this,dy),nv(this,df,new tn(this,ng.RATES,{defaultValue:ac})),nb(this,dA,dT).call(this)}static get observedAttributes(){return[...super.observedAttributes,z.MEDIA_PLAYBACK_RATE,ng.RATES]}attributeChangedCallback(e,t,i){super.attributeChangedCallback(e,t,i),e===z.MEDIA_PLAYBACK_RATE&&t!=i?(this.value=i,nb(this,dA,dT).call(this)):e===ng.RATES&&t!=i&&(nE(this,df).value=i,nb(this,dA,dT).call(this))}connectedCallback(){super.connectedCallback(),this.addEventListener("change",nb(this,dy,d_))}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("change",nb(this,dy,d_))}get anchorElement(){return"auto"!==this.anchor?super.anchorElement:ex(this).querySelector("media-playback-rate-menu-button")}get rates(){return nE(this,df)}set rates(e){e?Array.isArray(e)?nE(this,df).value=e.join(" "):"string"==typeof e&&(nE(this,df).value=e):nE(this,df).value="",nb(this,dA,dT).call(this)}get mediaPlaybackRate(){return eG(this,z.MEDIA_PLAYBACK_RATE,1)}set mediaPlaybackRate(e){eq(this,z.MEDIA_PLAYBACK_RATE,e)}}df=new WeakMap,dA=new WeakSet,dT=function(){this.defaultSlot.textContent="";let e=this.mediaPlaybackRate,t=new Set(Array.from(nE(this,df)).map(e=>Number(e)));for(let i of(e>0&&!t.has(e)&&t.add(e),Array.from(t).sort((e,t)=>e-t))){let t=rU({type:"radio",text:this.formatMenuItemText(`${i}x`,i),value:i.toString(),checked:e===i});t.prepend(rW(this,"checked-indicator")),this.defaultSlot.append(t)}},dy=new WeakSet,d_=function(){if(!this.value)return;let e=new eR.CustomEvent(q.MEDIA_PLAYBACK_RATE_REQUEST,{composed:!0,bubbles:!0,detail:this.value});this.dispatchEvent(e)},eR.customElements.get("media-playback-rate-menu")||eR.customElements.define("media-playback-rate-menu",nf);class nA extends rJ{static get observedAttributes(){return[...super.observedAttributes,z.MEDIA_PLAYBACK_RATE]}constructor(){var e;super(),this.container=this.shadowRoot.querySelector('slot[name="icon"]'),this.container.innerHTML=`${null!=(e=this.mediaPlaybackRate)?e:1}x`}attributeChangedCallback(e,t,i){if(super.attributeChangedCallback(e,t,i),e===z.MEDIA_PLAYBACK_RATE){let e=i?+i:NaN,t=Number.isNaN(e)?1:e;this.container.innerHTML=`${t}x`,this.setAttribute("aria-label",eg("Playback rate {playbackRate}",{playbackRate:t}))}}get invokeTargetElement(){return void 0!=this.invokeTarget?super.invokeTargetElement:ex(this).querySelector("media-playback-rate-menu")}get mediaPlaybackRate(){return eG(this,z.MEDIA_PLAYBACK_RATE,1)}set mediaPlaybackRate(e){eq(this,z.MEDIA_PLAYBACK_RATE,e)}}nA.getSlotTemplateHTML=function(e){return`
    <style>
      :host {
        min-width: 5ch;
        padding: var(--media-button-padding, var(--media-control-padding, 10px 5px));
      }
      
      :host([aria-expanded="true"]) slot {
        display: block;
      }

      :host([aria-expanded="true"]) slot[name=tooltip] {
        display: none;
      }
    </style>
    <slot name="icon">${e.mediaplaybackrate||1}x</slot>
  `},nA.getTooltipContentHTML=function(){return eg("Playback rate")},eR.customElements.get("media-playback-rate-menu-button")||eR.customElements.define("media-playback-rate-menu-button",nA);var nT=(e,t,i)=>{if(!t.has(e))throw TypeError("Cannot "+i)},ny=(e,t,i)=>(nT(e,t,"read from private field"),i?i.call(e):t.get(e)),n_=(e,t,i)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,i)},nk=(e,t,i,a)=>(nT(e,t,"write to private field"),a?a.call(e,i):t.set(e,i),i),nI=(e,t,i)=>(nT(e,t,"access private method"),i);class nS extends rH{constructor(){super(...arguments),n_(this,dS),n_(this,dw),n_(this,dk,[]),n_(this,dI,{})}static get observedAttributes(){return[...super.observedAttributes,z.MEDIA_RENDITION_LIST,z.MEDIA_RENDITION_SELECTED,z.MEDIA_RENDITION_UNAVAILABLE,z.MEDIA_HEIGHT]}static formatMenuItemText(e,t){return super.formatMenuItemText(e,t)}static formatRendition(e,{showBitrate:t=!1}={}){let i=`${Math.min(e.width,e.height)}p`;if(t&&e.bitrate){let t=e.bitrate/1e6,a=`${t.toFixed(+(t<1))} Mbps`;return`${i} (${a})`}return this.formatMenuItemText(i,e)}static compareRendition(e,t){var i,a;return t.height===e.height?(null!=(i=t.bitrate)?i:0)-(null!=(a=e.bitrate)?a:0):t.height-e.height}attributeChangedCallback(e,t,i){if(super.attributeChangedCallback(e,t,i),e===z.MEDIA_RENDITION_SELECTED&&t!==i)this.value=null!=i?i:"auto",nI(this,dS,dR).call(this);else if(e===z.MEDIA_RENDITION_LIST&&t!==i)nk(this,dk,null==i?void 0:i.split(/\s+/).map(eo)),nI(this,dS,dR).call(this);else e===z.MEDIA_HEIGHT&&t!==i&&nI(this,dS,dR).call(this)}connectedCallback(){super.connectedCallback(),this.addEventListener("change",nI(this,dw,dC))}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("change",nI(this,dw,dC))}get anchorElement(){return"auto"!==this.anchor?super.anchorElement:ex(this).querySelector("media-rendition-menu-button")}get mediaRenditionList(){return ny(this,dk)}set mediaRenditionList(e){nk(this,dk,e),nI(this,dS,dR).call(this)}get mediaRenditionSelected(){return eQ(this,z.MEDIA_RENDITION_SELECTED)}set mediaRenditionSelected(e){ez(this,z.MEDIA_RENDITION_SELECTED,e)}get mediaHeight(){return eG(this,z.MEDIA_HEIGHT)}set mediaHeight(e){eq(this,z.MEDIA_HEIGHT,e)}compareRendition(e,t){return this.constructor.compareRendition(e,t)}formatMenuItemText(e,t){return this.constructor.formatMenuItemText(e,t)}formatRendition(e,t){return this.constructor.formatRendition(e,t)}showRenditionBitrate(e){return this.mediaRenditionList.some(t=>t!==e&&t.height===e.height&&t.bitrate!==e.bitrate)}}dk=new WeakMap,dI=new WeakMap,dS=new WeakSet,dR=function(){if(ny(this,dI).mediaRenditionList===JSON.stringify(this.mediaRenditionList)&&ny(this,dI).mediaHeight===this.mediaHeight)return;ny(this,dI).mediaRenditionList=JSON.stringify(this.mediaRenditionList),ny(this,dI).mediaHeight=this.mediaHeight;let e=this.mediaRenditionList.sort(this.compareRendition.bind(this)),t=e.find(e=>e.id===this.mediaRenditionSelected);for(let i of e)i.selected=i===t;this.defaultSlot.textContent="";let i=!this.mediaRenditionSelected;for(let t of e){let e=rU({type:"radio",text:this.formatRendition(t,{showBitrate:this.showRenditionBitrate(t)}),value:`${t.id}`,checked:t.selected&&!i});e.prepend(rW(this,"checked-indicator")),this.defaultSlot.append(e)}let a=t&&this.showRenditionBitrate(t),r=i?t?this.formatMenuItemText(`${eg("Auto")} \u2022 ${this.formatRendition(t,{showBitrate:a})}`,t):this.formatMenuItemText(`${eg("Auto")} (${this.mediaHeight}p)`):this.formatMenuItemText(eg("Auto")),n=rU({type:"radio",text:r,value:"auto",checked:i});n.dataset.description=r,n.prepend(rW(this,"checked-indicator")),this.defaultSlot.append(n)},dw=new WeakSet,dC=function(){if(null==this.value)return;let e=new eR.CustomEvent(q.MEDIA_RENDITION_REQUEST,{composed:!0,bubbles:!0,detail:this.value});this.dispatchEvent(e)},eR.customElements.get("media-rendition-menu")||eR.customElements.define("media-rendition-menu",nS);let nR=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M13.5 2.5h2v6h-2v-2h-11v-2h11v-2Zm4 2h4v2h-4v-2Zm-12 4h2v6h-2v-2h-3v-2h3v-2Zm4 2h12v2h-12v-2Zm1 4h2v6h-2v-2h-8v-2h8v-2Zm4 2h7v2h-7v-2Z" />
</svg>`;class nw extends rJ{static get observedAttributes(){return[...super.observedAttributes,z.MEDIA_RENDITION_SELECTED,z.MEDIA_RENDITION_UNAVAILABLE,z.MEDIA_HEIGHT]}connectedCallback(){super.connectedCallback(),this.setAttribute("aria-label",eg("quality"))}get invokeTargetElement(){return void 0!=this.invokeTarget?super.invokeTargetElement:ex(this).querySelector("media-rendition-menu")}get mediaRenditionSelected(){return eQ(this,z.MEDIA_RENDITION_SELECTED)}set mediaRenditionSelected(e){ez(this,z.MEDIA_RENDITION_SELECTED,e)}get mediaHeight(){return eG(this,z.MEDIA_HEIGHT)}set mediaHeight(e){eq(this,z.MEDIA_HEIGHT,e)}}nw.getSlotTemplateHTML=function(){return`
    <style>
      :host([aria-expanded="true"]) slot[name=tooltip] {
        display: none;
      }
    </style>
    <slot name="icon">${nR}</slot>
  `},nw.getTooltipContentHTML=function(){return eg("Quality")},eR.customElements.get("media-rendition-menu-button")||eR.customElements.define("media-rendition-menu-button",nw);var nC=(e,t,i)=>{if(!t.has(e))throw TypeError("Cannot "+i)},nL=(e,t,i)=>(nC(e,t,"read from private field"),i?i.call(e):t.get(e)),nM=(e,t,i)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,i)},nD=(e,t,i,a)=>(nC(e,t,"write to private field"),a?a.call(e,i):t.set(e,i),i),nO=(e,t,i)=>(nC(e,t,"access private method"),i);class nN extends rH{constructor(){super(),nM(this,dM),nM(this,dO),nM(this,dx),nM(this,dU),nM(this,dH),nM(this,dL,!1),nM(this,dB,e=>{let t=e.target,i=(null==t?void 0:t.nodeName)==="VIDEO",a=nO(this,dU,dW).call(this,t);(i||a)&&(nL(this,dL)?nO(this,dO,dN).call(this):nO(this,dH,dV).call(this,e))}),nM(this,d$,e=>{let t=e.target,i=this.contains(t),a=2===e.button,r=(null==t?void 0:t.nodeName)==="VIDEO",n=nO(this,dU,dW).call(this,t);!i&&(a&&(r||n)||nO(this,dO,dN).call(this))}),nM(this,dK,e=>{"Escape"===e.key&&nO(this,dO,dN).call(this)}),nM(this,dF,e=>{var t,i;let a=e.target;if(null==(t=a.matches)?void 0:t.call(a,'button[invoke="copy"]')){let e=null==(i=a.closest("media-context-menu-item"))?void 0:i.querySelector('input[slot="copy"]');e&&navigator.clipboard.writeText(e.value)}nO(this,dO,dN).call(this)}),this.setAttribute("noautohide",""),nO(this,dM,dD).call(this)}connectedCallback(){super.connectedCallback(),ex(this).addEventListener("contextmenu",nL(this,dB)),this.addEventListener("click",nL(this,dF))}disconnectedCallback(){super.disconnectedCallback(),ex(this).removeEventListener("contextmenu",nL(this,dB)),this.removeEventListener("click",nL(this,dF)),document.removeEventListener("mousedown",nL(this,d$)),document.removeEventListener("keydown",nL(this,dK))}}dL=new WeakMap,dM=new WeakSet,dD=function(){this.hidden=!nL(this,dL)},dO=new WeakSet,dN=function(){nD(this,dL,!1),nO(this,dM,dD).call(this)},dx=new WeakSet,dP=function(){document.querySelectorAll("media-context-menu").forEach(e=>{e!==this&&nO(e,dO,dN).call(e)})},dU=new WeakSet,dW=function(e){return!!e&&(!!e.hasAttribute("slot")&&"media"===e.getAttribute("slot")||!!(e.nodeName.includes("-")&&e.tagName.includes("-"))&&(e.hasAttribute("src")||e.hasAttribute("poster")||e.hasAttribute("preload")||e.hasAttribute("playsinline")))},dB=new WeakMap,dH=new WeakSet,dV=function(e){e.preventDefault(),nO(this,dx,dP).call(this),nD(this,dL,!0),this.style.position="fixed",this.style.left=`${e.clientX}px`,this.style.top=`${e.clientY}px`,nO(this,dM,dD).call(this),document.addEventListener("mousedown",nL(this,d$),{once:!0}),document.addEventListener("keydown",nL(this,dK),{once:!0})},d$=new WeakMap,dK=new WeakMap,dF=new WeakMap,nN.getTemplateHTML=function(e){return`
      ${rH.getTemplateHTML(e)}
      <style>
        :host {
          --_menu-bg: rgb(20 20 30 / .8);
          background: var(--media-settings-menu-background,
            var(--media-menu-background,
              var(--media-control-background,
                var(--media-secondary-color, var(--_menu-bg)))));
          min-width: var(--media-settings-menu-min-width, 170px);
          border-radius: 2px;
          overflow: hidden;
        }
      </style>
    `},eR.customElements.get("media-context-menu")||eR.customElements.define("media-context-menu",nN);class nx extends rZ{}nx.shadowRootOptions={mode:"open"},nx.getTemplateHTML=function(e){return`
    ${rZ.getTemplateHTML.call(this,e)}
    <style>
        ::slotted(*) {
            color: var(--media-text-color, white);
            text-decoration: none;
            border: none;
            background: none;
            cursor: pointer;
            padding: 0;
            min-height: var(--media-control-height, 24px);
        }
    </style>
  `},eR.customElements.get("media-context-menu-item")||eR.customElements.define("media-context-menu-item",nx);var nP=e=>{throw TypeError(e)},nU=(e,t,i)=>t.has(e)||nP("Cannot "+i),nW=(e,t,i)=>(nU(e,t,"read from private field"),i?i.call(e):t.get(e)),nB=(e,t,i)=>t.has(e)?nP("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,i),nH=(e,t,i,a)=>(nU(e,t,"write to private field"),a?a.call(e,i):t.set(e,i),i),nV=(e,t,i)=>(nU(e,t,"access private method"),i),n$=class{addEventListener(){}removeEventListener(){}dispatchEvent(e){return!0}};if("undefined"==typeof DocumentFragment){class e extends n${}globalThis.DocumentFragment=e}var nK,nF,nY,nG,nq,nj,nZ,nQ,nz,nX,nJ,n0,n1,n2,n3,n4,n5,n9,n8,n6,n7,se,st,si,sa,sr,sn,ss,so,sl,sd,su,sh,sm,sc,sp,sE,sv,sb,sg,sf,sA,sT,sy,s_,sk,sI,sS,sR,sw,sC,sL,sM,sD,sO,sN,sx,sP,sU,sW,sB,sH,sV,s$,sK,sF,sY,sG,sq,sj,sZ,sQ,sz,sX,sJ,s0,s1,s2,s3,s4,s5,s9,s8,s6,s7,oe,ot,oi,oa,or,on,os,oo,ol,od,ou,oh,om,oc,op,oE,ov,ob,og,of,oA,oT,oy,o_,ok,oI,oS,oR,ow,oC,oL,oM,oD,oO,oN,ox,oP,oU,oW,oB,oH,oV,o$,oK,oF,oY,oG,oq,oj,oZ,oQ,oz,oX,oJ,o0,o1,o2,o3,o4,o5,o9,o8,o6,o7,le,lt,li,la,lr,ln,ls,lo,ll,ld,lu,lh,lm,lc,lp,lE,lv,lb,lg,lf,lA,lT,ly,l_,lk,lI,lS,lR,lw,lC,lL,lM,lD,lO,lN,lx,lP,lU,lW,lB,lH,lV,l$,lK,lF,lY,lG,lq,lj,lZ,lQ,lz,lX,lJ,l0,l1,l2,l3,l4,l5,l9,l8,l6,l7,de,dt,di,da,dr,dn,ds,dl,dd,du,dh,dm,dc,dp,dE,dv,db,dg,df,dA,dT,dy,d_,dk,dI,dS,dR,dw,dC,dL,dM,dD,dO,dN,dx,dP,dU,dW,dB,dH,dV,d$,dK,dF,dY,dG=class extends n${},dq=class{constructor(e,t={}){nB(this,dY),nH(this,dY,null==t?void 0:t.detail)}get detail(){return nW(this,dY)}initCustomEvent(){}};dY=new WeakMap;var dj={document:{createElement:function(e,t){return new dG}},DocumentFragment,customElements:{get(e){},define(e,t,i){},getName:e=>null,upgrade(e){},whenDefined:e=>Promise.resolve(dG)},CustomEvent:dq,EventTarget:n$,HTMLElement:dG,HTMLVideoElement:class extends n${}},dZ="undefined"==typeof window||void 0===globalThis.customElements,dQ=dZ?dj:globalThis,dz=dZ?dj.document:globalThis.document;function dX(e){return e.replace(/([a-z])([A-Z])/g,"$1-$2").toLowerCase()}function dJ(e){return e.replace(/[-_]([a-z])/g,(e,t)=>t.toUpperCase())}function d0(e){if(null==e)return;let t=+e;return Number.isNaN(t)?void 0:t}function d1(e){let t=(function(e){let t={};for(let i in e)null!=e[i]&&(t[i]=e[i]);return new URLSearchParams(t)})(e).toString();return t?"?"+t:""}var d2,d3,d4,d5=(e,t)=>!!e&&!!t&&(!!e.contains(t)||d5(e,t.getRootNode().host)),d9="mux.com",d8=(()=>{try{return"3.10.2"}catch{}return"UNKNOWN"})(),d6=e=>{if(e){if([b.U4.LIVE,b.U4.ON_DEMAND].includes(e))return e;if(null!=e&&e.includes("live"))return b.U4.LIVE}},d7={crossorigin:"crossOrigin",playsinline:"playsInline"},ue=class{constructor(e,t){nB(this,d2),nB(this,d3),nB(this,d4,[]),nH(this,d2,e),nH(this,d3,t)}[Symbol.iterator](){return nW(this,d4).values()}get length(){return nW(this,d4).length}get value(){var e;return null!=(e=nW(this,d4).join(" "))?e:""}set value(e){var t;e!==this.value&&(nH(this,d4,[]),this.add(...null!=(t=null==e?void 0:e.split(" "))?t:[]))}toString(){return this.value}item(e){return nW(this,d4)[e]}values(){return nW(this,d4).values()}keys(){return nW(this,d4).keys()}forEach(e){nW(this,d4).forEach(e)}add(...e){var t,i;e.forEach(e=>{this.contains(e)||nW(this,d4).push(e)}),(""!==this.value||null!=(t=nW(this,d2))&&t.hasAttribute(`${nW(this,d3)}`))&&null!=(i=nW(this,d2))&&i.setAttribute(`${nW(this,d3)}`,`${this.value}`)}remove(...e){var t;e.forEach(e=>{nW(this,d4).splice(nW(this,d4).indexOf(e),1)}),null==(t=nW(this,d2))||t.setAttribute(`${nW(this,d3)}`,`${this.value}`)}contains(e){return nW(this,d4).includes(e)}toggle(e,t){return void 0!==t?t?(this.add(e),!0):(this.remove(e),!1):this.contains(e)?(this.remove(e),!1):(this.add(e),!0)}replace(e,t){this.remove(e),this.add(t)}};d2=new WeakMap,d3=new WeakMap,d4=new WeakMap;var ut=`[mux-player ${d8}]`;function ui(...e){console.warn(ut,...e)}function ua(...e){console.error(ut,...e)}function ur(e){var t;let i=null!=(t=e.message)?t:"";e.context&&(i+=` ${e.context}`),e.file&&(i+=` ${(0,b.Ru)("Read more: ")}
https://github.com/muxinc/elements/blob/main/errors/${e.file}`),ui(i)}var un={AUTOPLAY:"autoplay",CROSSORIGIN:"crossorigin",LOOP:"loop",MUTED:"muted",PLAYSINLINE:"playsinline",PRELOAD:"preload"},us={VOLUME:"volume",PLAYBACKRATE:"playbackrate",MUTED:"muted"},uo=Object.freeze({length:0,start(e){let t=e>>>0;if(t>=this.length)throw new DOMException(`Failed to execute 'start' on 'TimeRanges': The index provided (${t}) is greater than or equal to the maximum bound (${this.length}).`);return 0},end(e){let t=e>>>0;if(t>=this.length)throw new DOMException(`Failed to execute 'end' on 'TimeRanges': The index provided (${t}) is greater than or equal to the maximum bound (${this.length}).`);return 0}}),ul=[...Object.values(un).filter(e=>un.PLAYSINLINE!==e),...Object.values(us)];function ud(e,t){return e.media?e.media.getAttribute(t):e.getAttribute(t)}var uu=class extends dQ.HTMLElement{static get observedAttributes(){return ul}constructor(){super()}attributeChangedCallback(e,t,i){var a,r;switch(e){case us.MUTED:this.media&&(this.media.muted=null!=i,this.media.defaultMuted=null!=i);return;case us.VOLUME:{let e=null!=(a=d0(i))?a:1;this.media&&(this.media.volume=e);return}case us.PLAYBACKRATE:{let e=null!=(r=d0(i))?r:1;this.media&&(this.media.playbackRate=e,this.media.defaultPlaybackRate=e);return}}}play(){var e,t;return null!=(t=null==(e=this.media)?void 0:e.play())?t:Promise.reject()}pause(){var e;null==(e=this.media)||e.pause()}load(){var e;null==(e=this.media)||e.load()}get media(){var e;return null==(e=this.shadowRoot)?void 0:e.querySelector("mux-video")}get audioTracks(){return this.media.audioTracks}get videoTracks(){return this.media.videoTracks}get audioRenditions(){return this.media.audioRenditions}get videoRenditions(){return this.media.videoRenditions}get paused(){var e,t;return null==(t=null==(e=this.media)?void 0:e.paused)||t}get duration(){var e,t;return null!=(t=null==(e=this.media)?void 0:e.duration)?t:NaN}get ended(){var e,t;return null!=(t=null==(e=this.media)?void 0:e.ended)&&t}get buffered(){var e,t;return null!=(t=null==(e=this.media)?void 0:e.buffered)?t:uo}get seekable(){var e,t;return null!=(t=null==(e=this.media)?void 0:e.seekable)?t:uo}get readyState(){var e,t;return null!=(t=null==(e=this.media)?void 0:e.readyState)?t:0}get videoWidth(){var e,t;return null!=(t=null==(e=this.media)?void 0:e.videoWidth)?t:0}get videoHeight(){var e,t;return null!=(t=null==(e=this.media)?void 0:e.videoHeight)?t:0}get currentSrc(){var e,t;return null!=(t=null==(e=this.media)?void 0:e.currentSrc)?t:""}get currentTime(){var e,t;return null!=(t=null==(e=this.media)?void 0:e.currentTime)?t:0}set currentTime(e){this.media&&(this.media.currentTime=Number(e))}get volume(){var e,t;return null!=(t=null==(e=this.media)?void 0:e.volume)?t:1}set volume(e){this.media&&(this.media.volume=Number(e))}get playbackRate(){var e,t;return null!=(t=null==(e=this.media)?void 0:e.playbackRate)?t:1}set playbackRate(e){this.media&&(this.media.playbackRate=Number(e))}get defaultPlaybackRate(){var e;return null!=(e=d0(this.getAttribute(us.PLAYBACKRATE)))?e:1}set defaultPlaybackRate(e){null!=e?this.setAttribute(us.PLAYBACKRATE,`${e}`):this.removeAttribute(us.PLAYBACKRATE)}get crossOrigin(){return ud(this,un.CROSSORIGIN)}set crossOrigin(e){this.setAttribute(un.CROSSORIGIN,`${e}`)}get autoplay(){return null!=ud(this,un.AUTOPLAY)}set autoplay(e){e?this.setAttribute(un.AUTOPLAY,"string"==typeof e?e:""):this.removeAttribute(un.AUTOPLAY)}get loop(){return null!=ud(this,un.LOOP)}set loop(e){e?this.setAttribute(un.LOOP,""):this.removeAttribute(un.LOOP)}get muted(){var e,t;return null!=(t=null==(e=this.media)?void 0:e.muted)&&t}set muted(e){this.media&&(this.media.muted=!!e)}get defaultMuted(){return null!=ud(this,un.MUTED)}set defaultMuted(e){e?this.setAttribute(un.MUTED,""):this.removeAttribute(un.MUTED)}get playsInline(){return null!=ud(this,un.PLAYSINLINE)}set playsInline(e){ua("playsInline is set to true by default and is not currently supported as a setter.")}get preload(){return this.media?this.media.preload:this.getAttribute("preload")}set preload(e){["","none","metadata","auto"].includes(e)?this.setAttribute(un.PRELOAD,e):this.removeAttribute(un.PRELOAD)}},uh=`:host {
  --media-control-display: var(--controls);
  --media-loading-indicator-display: var(--loading-indicator);
  --media-dialog-display: var(--dialog);
  --media-play-button-display: var(--play-button);
  --media-live-button-display: var(--live-button);
  --media-seek-backward-button-display: var(--seek-backward-button);
  --media-seek-forward-button-display: var(--seek-forward-button);
  --media-mute-button-display: var(--mute-button);
  --media-captions-button-display: var(--captions-button);
  --media-captions-menu-button-display: var(--captions-menu-button, var(--media-captions-button-display));
  --media-rendition-menu-button-display: var(--rendition-menu-button);
  --media-audio-track-menu-button-display: var(--audio-track-menu-button);
  --media-airplay-button-display: var(--airplay-button);
  --media-pip-button-display: var(--pip-button);
  --media-fullscreen-button-display: var(--fullscreen-button);
  --media-cast-button-display: var(--cast-button, var(--_cast-button-drm-display));
  --media-playback-rate-button-display: var(--playback-rate-button);
  --media-playback-rate-menu-button-display: var(--playback-rate-menu-button);
  --media-volume-range-display: var(--volume-range);
  --media-time-range-display: var(--time-range);
  --media-time-display-display: var(--time-display);
  --media-duration-display-display: var(--duration-display);
  --media-title-display-display: var(--title-display);

  display: inline-block;
  line-height: 0;
  width: 100%;
}

a {
  color: #fff;
  font-size: 0.9em;
  text-decoration: underline;
}

media-theme {
  display: inline-block;
  line-height: 0;
  width: 100%;
  height: 100%;
  direction: ltr;
}

media-poster-image {
  display: inline-block;
  line-height: 0;
  width: 100%;
  height: 100%;
}

media-poster-image:not([src]):not([placeholdersrc]) {
  display: none;
}

::part(top),
[part~='top'] {
  --media-control-display: var(--controls, var(--top-controls));
  --media-play-button-display: var(--play-button, var(--top-play-button));
  --media-live-button-display: var(--live-button, var(--top-live-button));
  --media-seek-backward-button-display: var(--seek-backward-button, var(--top-seek-backward-button));
  --media-seek-forward-button-display: var(--seek-forward-button, var(--top-seek-forward-button));
  --media-mute-button-display: var(--mute-button, var(--top-mute-button));
  --media-captions-button-display: var(--captions-button, var(--top-captions-button));
  --media-captions-menu-button-display: var(
    --captions-menu-button,
    var(--media-captions-button-display, var(--top-captions-menu-button))
  );
  --media-rendition-menu-button-display: var(--rendition-menu-button, var(--top-rendition-menu-button));
  --media-audio-track-menu-button-display: var(--audio-track-menu-button, var(--top-audio-track-menu-button));
  --media-airplay-button-display: var(--airplay-button, var(--top-airplay-button));
  --media-pip-button-display: var(--pip-button, var(--top-pip-button));
  --media-fullscreen-button-display: var(--fullscreen-button, var(--top-fullscreen-button));
  --media-cast-button-display: var(--cast-button, var(--top-cast-button, var(--_cast-button-drm-display)));
  --media-playback-rate-button-display: var(--playback-rate-button, var(--top-playback-rate-button));
  --media-playback-rate-menu-button-display: var(
    --captions-menu-button,
    var(--media-playback-rate-button-display, var(--top-playback-rate-menu-button))
  );
  --media-volume-range-display: var(--volume-range, var(--top-volume-range));
  --media-time-range-display: var(--time-range, var(--top-time-range));
  --media-time-display-display: var(--time-display, var(--top-time-display));
  --media-duration-display-display: var(--duration-display, var(--top-duration-display));
  --media-title-display-display: var(--title-display, var(--top-title-display));
}

::part(center),
[part~='center'] {
  --media-control-display: var(--controls, var(--center-controls));
  --media-play-button-display: var(--play-button, var(--center-play-button));
  --media-live-button-display: var(--live-button, var(--center-live-button));
  --media-seek-backward-button-display: var(--seek-backward-button, var(--center-seek-backward-button));
  --media-seek-forward-button-display: var(--seek-forward-button, var(--center-seek-forward-button));
  --media-mute-button-display: var(--mute-button, var(--center-mute-button));
  --media-captions-button-display: var(--captions-button, var(--center-captions-button));
  --media-captions-menu-button-display: var(
    --captions-menu-button,
    var(--media-captions-button-display, var(--center-captions-menu-button))
  );
  --media-rendition-menu-button-display: var(--rendition-menu-button, var(--center-rendition-menu-button));
  --media-audio-track-menu-button-display: var(--audio-track-menu-button, var(--center-audio-track-menu-button));
  --media-airplay-button-display: var(--airplay-button, var(--center-airplay-button));
  --media-pip-button-display: var(--pip-button, var(--center-pip-button));
  --media-fullscreen-button-display: var(--fullscreen-button, var(--center-fullscreen-button));
  --media-cast-button-display: var(--cast-button, var(--center-cast-button, var(--_cast-button-drm-display)));
  --media-playback-rate-button-display: var(--playback-rate-button, var(--center-playback-rate-button));
  --media-playback-rate-menu-button-display: var(
    --playback-rate-menu-button,
    var(--media-playback-rate-button-display, var(--center-playback-rate-menu-button))
  );
  --media-volume-range-display: var(--volume-range, var(--center-volume-range));
  --media-time-range-display: var(--time-range, var(--center-time-range));
  --media-time-display-display: var(--time-display, var(--center-time-display));
  --media-duration-display-display: var(--duration-display, var(--center-duration-display));
}

::part(bottom),
[part~='bottom'] {
  --media-control-display: var(--controls, var(--bottom-controls));
  --media-play-button-display: var(--play-button, var(--bottom-play-button));
  --media-live-button-display: var(--live-button, var(--bottom-live-button));
  --media-seek-backward-button-display: var(--seek-backward-button, var(--bottom-seek-backward-button));
  --media-seek-forward-button-display: var(--seek-forward-button, var(--bottom-seek-forward-button));
  --media-mute-button-display: var(--mute-button, var(--bottom-mute-button));
  --media-captions-button-display: var(--captions-button, var(--bottom-captions-button));
  --media-captions-menu-button-display: var(
    --captions-menu-button,
    var(--media-captions-button-display, var(--bottom-captions-menu-button))
  );
  --media-rendition-menu-button-display: var(--rendition-menu-button, var(--bottom-rendition-menu-button));
  --media-audio-track-menu-button-display: var(--audio-track-menu-button, var(--bottom-audio-track-menu-button));
  --media-airplay-button-display: var(--airplay-button, var(--bottom-airplay-button));
  --media-pip-button-display: var(--pip-button, var(--bottom-pip-button));
  --media-fullscreen-button-display: var(--fullscreen-button, var(--bottom-fullscreen-button));
  --media-cast-button-display: var(--cast-button, var(--bottom-cast-button, var(--_cast-button-drm-display)));
  --media-playback-rate-button-display: var(--playback-rate-button, var(--bottom-playback-rate-button));
  --media-playback-rate-menu-button-display: var(
    --playback-rate-menu-button,
    var(--media-playback-rate-button-display, var(--bottom-playback-rate-menu-button))
  );
  --media-volume-range-display: var(--volume-range, var(--bottom-volume-range));
  --media-time-range-display: var(--time-range, var(--bottom-time-range));
  --media-time-display-display: var(--time-display, var(--bottom-time-display));
  --media-duration-display-display: var(--duration-display, var(--bottom-duration-display));
  --media-title-display-display: var(--title-display, var(--bottom-title-display));
}

:host([no-tooltips]) {
  --media-tooltip-display: none;
}
`,um=new WeakMap,uc=class e{constructor(e,t){this.element=e,this.type=t,this.element.addEventListener(this.type,this);let i=um.get(this.element);i&&i.set(this.type,this)}set(e){if("function"==typeof e)this.handleEvent=e.bind(this.element);else if("object"==typeof e&&"function"==typeof e.handleEvent)this.handleEvent=e.handleEvent.bind(e);else{this.element.removeEventListener(this.type,this);let e=um.get(this.element);e&&e.delete(this.type)}}static for(t){um.has(t.element)||um.set(t.element,new Map);let i=t.attributeName.slice(2),a=um.get(t.element);return a&&a.has(i)?a.get(i):new e(t.element,i)}},up=new Map,uE=new WeakMap,uv=new WeakMap,ub=class{constructor(e,t,i){this.strings=e,this.values=t,this.processor=i,this.stringsKey=this.strings.join("\x01")}get template(){if(up.has(this.stringsKey))return up.get(this.stringsKey);{let e=dz.createElement("template"),t=this.strings.length-1;return e.innerHTML=this.strings.reduce((e,i,a)=>e+i+(a<t?`{{ ${a} }}`:""),""),up.set(this.stringsKey,e),e}}renderInto(e){var t;let i=this.template;if(uE.get(e)!==i){uE.set(e,i);let t=new a6(i,this.values,this.processor);uv.set(e,t),e instanceof rs?e.replace(...t.children):e.appendChild(t);return}let a=uv.get(e);null==(t=null==a?void 0:a.update)||t.call(a,this.values)}},ug={processCallback(e,t,i){var a;if(i)for(let[e,r]of t)e in i&&function(e,t){(function(e,t){if(e instanceof rn&&t instanceof Element){let i=e.element;return i[e.attributeName]!==t&&(e.element.removeAttributeNS(e.attributeNamespace,e.attributeName),i[e.attributeName]=t),!0}return!1})(e,t)||function(e,t){if("boolean"==typeof t&&e instanceof rn){let i=e.attributeNamespace;return t!==e.element.hasAttributeNS(i,e.attributeName)&&(e.booleanValue=t),!0}return!1}(e,t)||e instanceof rn&&e.attributeName.startsWith("on")&&(uc.for(e).set(t),e.element.removeAttributeNS(e.attributeNamespace,e.attributeName),1)||!1===t&&e instanceof rs&&(e.replace(""),1)||t instanceof ub&&e instanceof rs&&(t.renderInto(e),1)||t instanceof DocumentFragment&&e instanceof rs&&(t.childNodes.length&&e.replace(...t.childNodes),1)||function(e,t){if(e instanceof rn){let i=e.attributeNamespace,a=e.element.getAttributeNS(i,e.attributeName);return String(t)!==a&&(e.value=String(t))}e.value=String(t)}(e,t)}(r,null!=(a=i[e])?a:"")}};function uf(e,...t){return new ub(e,t,ug)}var uA=Object.values({TOP:"top",CENTER:"center",BOTTOM:"bottom",LAYER:"layer",MEDIA_LAYER:"media-layer",POSTER_LAYER:"poster-layer",VERTICAL_LAYER:"vertical-layer",CENTERED_LAYER:"centered-layer",GESTURE_LAYER:"gesture-layer",CONTROLLER_LAYER:"controller",BUTTON:"button",RANGE:"range",THUMB:"thumb",DISPLAY:"display",CONTROL_BAR:"control-bar",MENU_BUTTON:"menu-button",MENU:"menu",MENU_ITEM:"menu-item",OPTION:"option",POSTER:"poster",LIVE:"live",PLAY:"play",PRE_PLAY:"pre-play",SEEK_BACKWARD:"seek-backward",SEEK_FORWARD:"seek-forward",MUTE:"mute",CAPTIONS:"captions",AIRPLAY:"airplay",PIP:"pip",FULLSCREEN:"fullscreen",CAST:"cast",PLAYBACK_RATE:"playback-rate",VOLUME:"volume",TIME:"time",TITLE:"title",AUDIO_TRACK:"audio-track",RENDITION:"rendition"}).join(", "),uT=e=>e.charAt(0).toUpperCase()+e.slice(1),uy=(e,t)=>{let i=(e=>{if(e.muxCode){if(e.muxCode===b.Ks.NETWORK_TOKEN_EXPIRED)return"403-expired-token.md";if(e.muxCode===b.Ks.NETWORK_TOKEN_MALFORMED)return"403-malformatted-token.md";if([b.Ks.NETWORK_TOKEN_AUD_MISMATCH,b.Ks.NETWORK_TOKEN_AUD_MISSING].includes(e.muxCode))return"403-incorrect-aud-value.md";if(e.muxCode===b.Ks.NETWORK_TOKEN_SUB_MISMATCH)return"403-playback-id-mismatch.md";if(e.muxCode===b.Ks.NETWORK_TOKEN_MISSING)return"missing-signed-tokens.md";if(e.muxCode===b.Ks.NETWORK_NOT_FOUND)return"404-not-found.md";if(e.muxCode===b.Ks.NETWORK_NOT_READY)return"412-not-playable.md"}if(e.code){if(e.code===b.FJ.MEDIA_ERR_NETWORK)return"";if(e.code===b.FJ.MEDIA_ERR_DECODE)return"media-decode-error.md";if(e.code===b.FJ.MEDIA_ERR_SRC_NOT_SUPPORTED)return"media-src-not-supported.md"}return""})(e);return{message:e.message,context:e.context,file:i}},u_=`<template id="media-theme-gerwig">
  <style>
    @keyframes pre-play-hide {
      0% {
        transform: scale(1);
        opacity: 1;
      }

      30% {
        transform: scale(0.7);
      }

      100% {
        transform: scale(1.5);
        opacity: 0;
      }
    }

    :host {
      --_primary-color: var(--media-primary-color, #fff);
      --_secondary-color: var(--media-secondary-color, transparent);
      --_accent-color: var(--media-accent-color, #fa50b5);
      --_text-color: var(--media-text-color, #000);

      --media-icon-color: var(--_primary-color);
      --media-control-background: var(--_secondary-color);
      --media-control-hover-background: var(--_accent-color);
      --media-time-buffered-color: rgba(255, 255, 255, 0.4);
      --media-preview-time-text-shadow: none;
      --media-control-height: 14px;
      --media-control-padding: 6px;
      --media-tooltip-container-margin: 6px;
      --media-tooltip-distance: 18px;

      color: var(--_primary-color);
      display: inline-block;
      width: 100%;
      height: 100%;
    }

    :host([audio]) {
      --_secondary-color: var(--media-secondary-color, black);
      --media-preview-time-text-shadow: none;
    }

    :host([audio]) ::slotted([slot='media']) {
      height: 0px;
    }

    :host([audio]) media-loading-indicator {
      display: none;
    }

    :host([audio]) media-controller {
      background: transparent;
    }

    :host([audio]) media-controller::part(vertical-layer) {
      background: transparent;
    }

    :host([audio]) media-control-bar {
      width: 100%;
      background-color: var(--media-control-background);
    }

    /*
     * 0.433s is the transition duration for VTT Regions.
     * Borrowed here, so the captions don't move too fast.
     */
    media-controller {
      --media-webkit-text-track-transform: translateY(0) scale(0.98);
      --media-webkit-text-track-transition: transform 0.433s ease-out 0.3s;
    }
    media-controller:is([mediapaused], :not([userinactive])) {
      --media-webkit-text-track-transform: translateY(-50px) scale(0.98);
      --media-webkit-text-track-transition: transform 0.15s ease;
    }

    /*
     * CSS specific to iOS devices.
     * See: https://stackoverflow.com/questions/30102792/css-media-query-to-target-only-ios-devices/60220757#60220757
     */
    @supports (-webkit-touch-callout: none) {
      /* Disable subtitle adjusting for iOS Safari */
      media-controller[mediaisfullscreen] {
        --media-webkit-text-track-transform: unset;
        --media-webkit-text-track-transition: unset;
      }
    }

    media-time-range {
      --media-box-padding-left: 6px;
      --media-box-padding-right: 6px;
      --media-range-bar-color: var(--_accent-color);
      --media-time-range-buffered-color: var(--_primary-color);
      --media-range-track-color: transparent;
      --media-range-track-background: rgba(255, 255, 255, 0.4);
      --media-range-thumb-background: radial-gradient(
        circle,
        #000 0%,
        #000 25%,
        var(--_accent-color) 25%,
        var(--_accent-color)
      );
      --media-range-thumb-width: 12px;
      --media-range-thumb-height: 12px;
      --media-range-thumb-transform: scale(0);
      --media-range-thumb-transition: transform 0.3s;
      --media-range-thumb-opacity: 1;
      --media-preview-background: var(--_primary-color);
      --media-box-arrow-background: var(--_primary-color);
      --media-preview-thumbnail-border: 5px solid var(--_primary-color);
      --media-preview-border-radius: 5px;
      --media-text-color: var(--_text-color);
      --media-control-hover-background: transparent;
      --media-preview-chapter-text-shadow: none;
      color: var(--_accent-color);
      padding: 0 6px;
    }

    :host([audio]) media-time-range {
      --media-preview-time-padding: 1.5px 6px;
      --media-preview-box-margin: 0 0 -5px;
    }

    media-time-range:hover {
      --media-range-thumb-transform: scale(1);
    }

    media-preview-thumbnail {
      border-bottom-width: 0;
    }

    [part~='menu'] {
      border-radius: 2px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      bottom: 50px;
      padding: 2.5px 10px;
    }

    [part~='menu']::part(indicator) {
      fill: var(--_accent-color);
    }

    [part~='menu']::part(menu-item) {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      padding: 6px 10px;
      min-height: 34px;
    }

    [part~='menu']::part(checked) {
      font-weight: 700;
    }

    media-captions-menu,
    media-rendition-menu,
    media-audio-track-menu,
    media-playback-rate-menu {
      position: absolute; /* ensure they don't take up space in DOM on load */
      --media-menu-background: var(--_primary-color);
      --media-menu-item-checked-background: transparent;
      --media-text-color: var(--_text-color);
      --media-menu-item-hover-background: transparent;
      --media-menu-item-hover-outline: var(--_accent-color) solid 1px;
    }

    media-rendition-menu {
      min-width: 140px;
    }

    /* The icon is a circle so make it 16px high instead of 14px for more balance. */
    media-audio-track-menu-button {
      --media-control-padding: 5px;
      --media-control-height: 16px;
    }

    media-playback-rate-menu-button {
      --media-control-padding: 6px 3px;
      min-width: 4.4ch;
    }

    media-playback-rate-menu {
      --media-menu-flex-direction: row;
      --media-menu-item-checked-background: var(--_accent-color);
      --media-menu-item-checked-indicator-display: none;
      margin-right: 6px;
      padding: 0;
      --media-menu-gap: 0.25em;
    }

    media-playback-rate-menu[part~='menu']::part(menu-item) {
      padding: 6px 6px 6px 8px;
    }

    media-playback-rate-menu[part~='menu']::part(checked) {
      color: #fff;
    }

    :host(:not([audio])) media-time-range {
      /* Adding px is required here for calc() */
      --media-range-padding: 0px;
      background: transparent;
      z-index: 10;
      height: 10px;
      bottom: -3px;
      width: 100%;
    }

    media-control-bar :is([role='button'], [role='switch'], button) {
      line-height: 0;
    }

    media-control-bar :is([part*='button'], [part*='range'], [part*='display']) {
      border-radius: 3px;
    }

    .spacer {
      flex-grow: 1;
      background-color: var(--media-control-background, rgba(20, 20, 30, 0.7));
    }

    media-control-bar[slot~='top-chrome'] {
      min-height: 42px;
      pointer-events: none;
    }

    media-control-bar {
      --gradient-steps:
        hsl(0 0% 0% / 0) 0%, hsl(0 0% 0% / 0.013) 8.1%, hsl(0 0% 0% / 0.049) 15.5%, hsl(0 0% 0% / 0.104) 22.5%,
        hsl(0 0% 0% / 0.175) 29%, hsl(0 0% 0% / 0.259) 35.3%, hsl(0 0% 0% / 0.352) 41.2%, hsl(0 0% 0% / 0.45) 47.1%,
        hsl(0 0% 0% / 0.55) 52.9%, hsl(0 0% 0% / 0.648) 58.8%, hsl(0 0% 0% / 0.741) 64.7%, hsl(0 0% 0% / 0.825) 71%,
        hsl(0 0% 0% / 0.896) 77.5%, hsl(0 0% 0% / 0.951) 84.5%, hsl(0 0% 0% / 0.987) 91.9%, hsl(0 0% 0%) 100%;
    }

    :host([title]) media-control-bar[slot='top-chrome']::before,
    :host([videotitle]) media-control-bar[slot='top-chrome']::before {
      content: '';
      position: absolute;
      width: 100%;
      padding-bottom: min(100px, 25%);
      background: linear-gradient(to top, var(--gradient-steps));
      opacity: 0.8;
      pointer-events: none;
    }

    :host(:not([audio])) media-control-bar[part~='bottom']::before {
      content: '';
      position: absolute;
      width: 100%;
      bottom: 0;
      left: 0;
      padding-bottom: min(100px, 25%);
      background: linear-gradient(to bottom, var(--gradient-steps));
      opacity: 0.8;
      z-index: 1;
      pointer-events: none;
    }

    media-control-bar[part~='bottom'] > * {
      z-index: 20;
    }

    media-control-bar[part~='bottom'] {
      padding: 6px 6px;
    }

    media-control-bar[slot~='top-chrome'] > * {
      --media-control-background: transparent;
      --media-control-hover-background: transparent;
      position: relative;
    }

    media-controller::part(vertical-layer) {
      transition: background-color 1s;
    }

    media-controller:is([mediapaused], :not([userinactive]))::part(vertical-layer) {
      background-color: var(--controls-backdrop-color, var(--controls, transparent));
      transition: background-color 0.25s;
    }

    .center-controls {
      --media-button-icon-width: 100%;
      --media-button-icon-height: auto;
      --media-tooltip-display: none;
      pointer-events: none;
      width: 100%;
      display: flex;
      flex-flow: row;
      align-items: center;
      justify-content: center;
      paint-order: stroke;
      stroke: rgba(102, 102, 102, 1);
      stroke-width: 0.3px;
      text-shadow:
        0 0 2px rgb(0 0 0 / 0.25),
        0 0 6px rgb(0 0 0 / 0.25);
    }

    .center-controls media-play-button {
      --media-control-background: transparent;
      --media-control-hover-background: transparent;
      --media-control-padding: 0;
      width: 40px;
      filter: drop-shadow(0 0 2px rgb(0 0 0 / 0.25)) drop-shadow(0 0 6px rgb(0 0 0 / 0.25));
    }

    [breakpointsm] .center-controls media-play-button {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      transition: background 0.4s;
      padding: 24px;
      --media-control-background: #000;
      --media-control-hover-background: var(--_accent-color);
    }

    .center-controls media-seek-backward-button,
    .center-controls media-seek-forward-button {
      --media-control-background: transparent;
      --media-control-hover-background: transparent;
      padding: 0;
      margin: 0 20px;
      width: max(33px, min(8%, 40px));
      text-shadow:
        0 0 2px rgb(0 0 0 / 0.25),
        0 0 6px rgb(0 0 0 / 0.25);
    }

    [breakpointsm]:not([audio]) .center-controls.pre-playback {
      display: grid;
      align-items: initial;
      justify-content: initial;
      height: 100%;
      overflow: hidden;
    }

    [breakpointsm]:not([audio]) .center-controls.pre-playback media-play-button {
      place-self: var(--_pre-playback-place, center);
      grid-area: 1 / 1;
      margin: 16px;
    }

    /* Show and hide controls or pre-playback state */

    [breakpointsm]:is([mediahasplayed], :not([mediapaused])):not([audio])
      .center-controls.pre-playback
      media-play-button {
      /* Using \`forwards\` would lead to a laggy UI after the animation got in the end state */
      animation: 0.3s linear pre-play-hide;
      opacity: 0;
      pointer-events: none;
    }

    .autoplay-unmute {
      --media-control-hover-background: transparent;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 0 2px rgb(0 0 0 / 0.25)) drop-shadow(0 0 6px rgb(0 0 0 / 0.25));
    }

    .autoplay-unmute-btn {
      --media-control-height: 16px;
      border-radius: 8px;
      background: #000;
      color: var(--_primary-color);
      display: flex;
      align-items: center;
      padding: 8px 16px;
      font-size: 18px;
      font-weight: 500;
      cursor: pointer;
    }

    .autoplay-unmute-btn:hover {
      background: var(--_accent-color);
    }

    [breakpointsm] .autoplay-unmute-btn {
      --media-control-height: 30px;
      padding: 14px 24px;
      font-size: 26px;
    }

    .autoplay-unmute-btn svg {
      margin: 0 6px 0 0;
    }

    [breakpointsm] .autoplay-unmute-btn svg {
      margin: 0 10px 0 0;
    }

    media-controller:not([audio]):not([mediahasplayed]) *:is(media-control-bar, media-time-range) {
      display: none;
    }

    media-error-dialog:not([mediaerrorcode]) {
      opacity: 0;
    }

    media-loading-indicator {
      --media-loading-icon-width: 100%;
      --media-button-icon-height: auto;
      display: var(--media-control-display, var(--media-loading-indicator-display, flex));
      pointer-events: none;
      position: absolute;
      width: min(15%, 150px);
      flex-flow: row;
      align-items: center;
      justify-content: center;
    }

    /* Intentionally don't target the div for transition but the children
     of the div. Prevents messing with media-chrome's autohide feature. */
    media-loading-indicator + div * {
      transition: opacity 0.15s;
      opacity: 1;
    }

    media-loading-indicator[medialoading]:not([mediapaused]) ~ div > * {
      opacity: 0;
      transition-delay: 400ms;
    }

    media-volume-range {
      width: min(100%, 100px);
      --media-range-padding-left: 10px;
      --media-range-padding-right: 10px;
      --media-range-thumb-width: 12px;
      --media-range-thumb-height: 12px;
      --media-range-thumb-background: radial-gradient(
        circle,
        #000 0%,
        #000 25%,
        var(--_primary-color) 25%,
        var(--_primary-color)
      );
      --media-control-hover-background: none;
    }

    media-time-display {
      white-space: nowrap;
    }

    /* Generic style for explicitly disabled controls */
    media-control-bar[part~='bottom'] [disabled],
    media-control-bar[part~='bottom'] [aria-disabled='true'] {
      opacity: 60%;
      cursor: not-allowed;
    }

    media-text-display {
      --media-font-size: 16px;
      --media-control-padding: 14px;
      font-weight: 500;
    }

    media-play-button.animated *:is(g, path) {
      transition: all 0.3s;
    }

    media-play-button.animated[mediapaused] .pause-icon-pt1 {
      opacity: 0;
    }

    media-play-button.animated[mediapaused] .pause-icon-pt2 {
      transform-origin: center center;
      transform: scaleY(0);
    }

    media-play-button.animated[mediapaused] .play-icon {
      clip-path: inset(0 0 0 0);
    }

    media-play-button.animated:not([mediapaused]) .play-icon {
      clip-path: inset(0 0 0 100%);
    }

    media-seek-forward-button,
    media-seek-backward-button {
      --media-font-weight: 400;
    }

    .mute-icon {
      display: inline-block;
    }

    .mute-icon :is(path, g) {
      transition: opacity 0.5s;
    }

    .muted {
      opacity: 0;
    }

    media-mute-button[mediavolumelevel='low'] :is(.volume-medium, .volume-high),
    media-mute-button[mediavolumelevel='medium'] :is(.volume-high) {
      opacity: 0;
    }

    media-mute-button[mediavolumelevel='off'] .unmuted {
      opacity: 0;
    }

    media-mute-button[mediavolumelevel='off'] .muted {
      opacity: 1;
    }

    /**
     * Our defaults for these buttons are to hide them at small sizes
     * users can override this with CSS
     */
    media-controller:not([breakpointsm]):not([audio]) {
      --bottom-play-button: none;
      --bottom-seek-backward-button: none;
      --bottom-seek-forward-button: none;
      --bottom-time-display: none;
      --bottom-playback-rate-menu-button: none;
      --bottom-pip-button: none;
    }

    [part='mux-badge'] {
      position: absolute;
      bottom: 10px;
      right: 10px;
      z-index: 2;
      opacity: 0.6;
      transition:
        opacity 0.2s ease-in-out,
        bottom 0.2s ease-in-out;
    }

    [part='mux-badge']:hover {
      opacity: 1;
    }

    [part='mux-badge'] a {
      font-size: 14px;
      font-family: var(--_font-family);
      color: var(--_primary-color);
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    [part='mux-badge'] .mux-badge-text {
      transition: opacity 0.5s ease-in-out;
      opacity: 0;
    }

    [part='mux-badge'] .mux-badge-logo {
      width: 40px;
      height: auto;
      display: inline-block;
    }

    [part='mux-badge'] .mux-badge-logo svg {
      width: 100%;
      height: 100%;
      fill: white;
    }

    media-controller:not([userinactive]):not([mediahasplayed]) [part='mux-badge'],
    media-controller:not([userinactive]) [part='mux-badge'],
    media-controller[mediahasplayed][mediapaused] [part='mux-badge'] {
      transition: bottom 0.1s ease-in-out;
    }

    media-controller[userinactive]:not([mediapaused]) [part='mux-badge'] {
      transition: bottom 0.2s ease-in-out 0.62s;
    }

    media-controller:not([userinactive]) [part='mux-badge'] .mux-badge-text,
    media-controller[mediahasplayed][mediapaused] [part='mux-badge'] .mux-badge-text {
      opacity: 1;
    }

    media-controller[userinactive]:not([mediapaused]) [part='mux-badge'] .mux-badge-text {
      opacity: 0;
    }

    media-controller[userinactive]:not([mediapaused]) [part='mux-badge'] {
      bottom: 10px;
    }

    media-controller:not([userinactive]):not([mediahasplayed]) [part='mux-badge'] {
      bottom: 10px;
    }

    media-controller:not([userinactive])[mediahasplayed] [part='mux-badge'],
    media-controller[mediahasplayed][mediapaused] [part='mux-badge'] {
      bottom: calc(28px + var(--media-control-height, 0px) + var(--media-control-padding, 0px) * 2);
    }
  </style>

  <template partial="TitleDisplay">
    <template if="videotitle">
      <template if="videotitle != true">
        <media-text-display part="top title display" class="title-display">{{videotitle}}</media-text-display>
      </template>
    </template>
    <template if="!videotitle">
      <template if="title">
        <media-text-display part="top title display" class="title-display">{{title}}</media-text-display>
      </template>
    </template>
  </template>

  <template partial="PlayButton">
    <media-play-button
      part="{{section ?? 'bottom'}} play button"
      disabled="{{disabled}}"
      aria-disabled="{{disabled}}"
      class="animated"
    >
      <svg aria-hidden="true" viewBox="0 0 18 14" slot="icon">
        <g class="play-icon">
          <path
            d="M15.5987 6.2911L3.45577 0.110898C2.83667 -0.204202 2.06287 0.189698 2.06287 0.819798V13.1802C2.06287 13.8103 2.83667 14.2042 3.45577 13.8891L15.5987 7.7089C16.2178 7.3938 16.2178 6.6061 15.5987 6.2911Z"
          />
        </g>
        <g class="pause-icon">
          <path
            class="pause-icon-pt1"
            d="M5.90709 0H2.96889C2.46857 0 2.06299 0.405585 2.06299 0.9059V13.0941C2.06299 13.5944 2.46857 14 2.96889 14H5.90709C6.4074 14 6.81299 13.5944 6.81299 13.0941V0.9059C6.81299 0.405585 6.4074 0 5.90709 0Z"
          />
          <path
            class="pause-icon-pt2"
            d="M15.1571 0H12.2189C11.7186 0 11.313 0.405585 11.313 0.9059V13.0941C11.313 13.5944 11.7186 14 12.2189 14H15.1571C15.6574 14 16.063 13.5944 16.063 13.0941V0.9059C16.063 0.405585 15.6574 0 15.1571 0Z"
          />
        </g>
      </svg>
    </media-play-button>
  </template>

  <template partial="PrePlayButton">
    <media-play-button
      part="{{section ?? 'center'}} play button pre-play"
      disabled="{{disabled}}"
      aria-disabled="{{disabled}}"
    >
      <svg aria-hidden="true" viewBox="0 0 18 14" slot="icon" style="transform: translate(3px, 0)">
        <path
          d="M15.5987 6.2911L3.45577 0.110898C2.83667 -0.204202 2.06287 0.189698 2.06287 0.819798V13.1802C2.06287 13.8103 2.83667 14.2042 3.45577 13.8891L15.5987 7.7089C16.2178 7.3938 16.2178 6.6061 15.5987 6.2911Z"
        />
      </svg>
    </media-play-button>
  </template>

  <template partial="SeekBackwardButton">
    <media-seek-backward-button
      seekoffset="{{backwardseekoffset}}"
      part="{{section ?? 'bottom'}} seek-backward button"
      disabled="{{disabled}}"
      aria-disabled="{{disabled}}"
    >
      <svg viewBox="0 0 22 14" aria-hidden="true" slot="icon">
        <path
          d="M3.65 2.07888L0.0864 6.7279C-0.0288 6.87812 -0.0288 7.12188 0.0864 7.2721L3.65 11.9211C3.7792 12.0896 4 11.9703 4 11.7321V2.26787C4 2.02968 3.7792 1.9104 3.65 2.07888Z"
        />
        <text transform="translate(6 12)" style="font-size: 14px; font-family: 'ArialMT', 'Arial'">
          {{backwardseekoffset}}
        </text>
      </svg>
    </media-seek-backward-button>
  </template>

  <template partial="SeekForwardButton">
    <media-seek-forward-button
      seekoffset="{{forwardseekoffset}}"
      part="{{section ?? 'bottom'}} seek-forward button"
      disabled="{{disabled}}"
      aria-disabled="{{disabled}}"
    >
      <svg viewBox="0 0 22 14" aria-hidden="true" slot="icon">
        <g>
          <text transform="translate(-1 12)" style="font-size: 14px; font-family: 'ArialMT', 'Arial'">
            {{forwardseekoffset}}
          </text>
          <path
            d="M18.35 11.9211L21.9136 7.2721C22.0288 7.12188 22.0288 6.87812 21.9136 6.7279L18.35 2.07888C18.2208 1.91041 18 2.02968 18 2.26787V11.7321C18 11.9703 18.2208 12.0896 18.35 11.9211Z"
          />
        </g>
      </svg>
    </media-seek-forward-button>
  </template>

  <template partial="MuteButton">
    <media-mute-button part="bottom mute button" disabled="{{disabled}}" aria-disabled="{{disabled}}">
      <svg viewBox="0 0 18 14" slot="icon" class="mute-icon" aria-hidden="true">
        <g class="unmuted">
          <path
            d="M6.76786 1.21233L3.98606 3.98924H1.19937C0.593146 3.98924 0.101743 4.51375 0.101743 5.1607V6.96412L0 6.99998L0.101743 7.03583V8.83926C0.101743 9.48633 0.593146 10.0108 1.19937 10.0108H3.98606L6.76773 12.7877C7.23561 13.2547 8 12.9007 8 12.2171V1.78301C8 1.09925 7.23574 0.745258 6.76786 1.21233Z"
          />
          <path
            class="volume-low"
            d="M10 3.54781C10.7452 4.55141 11.1393 5.74511 11.1393 6.99991C11.1393 8.25471 10.7453 9.44791 10 10.4515L10.7988 11.0496C11.6734 9.87201 12.1356 8.47161 12.1356 6.99991C12.1356 5.52821 11.6735 4.12731 10.7988 2.94971L10 3.54781Z"
          />
          <path
            class="volume-medium"
            d="M12.3778 2.40086C13.2709 3.76756 13.7428 5.35806 13.7428 7.00026C13.7428 8.64246 13.2709 10.233 12.3778 11.5992L13.2106 12.1484C14.2107 10.6185 14.739 8.83796 14.739 7.00016C14.739 5.16236 14.2107 3.38236 13.2106 1.85156L12.3778 2.40086Z"
          />
          <path
            class="volume-high"
            d="M15.5981 0.75L14.7478 1.2719C15.7937 2.9919 16.3468 4.9723 16.3468 7C16.3468 9.0277 15.7937 11.0082 14.7478 12.7281L15.5981 13.25C16.7398 11.3722 17.343 9.211 17.343 7C17.343 4.789 16.7398 2.6268 15.5981 0.75Z"
          />
        </g>
        <g class="muted">
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M4.39976 4.98924H1.19937C1.19429 4.98924 1.17777 4.98961 1.15296 5.01609C1.1271 5.04369 1.10174 5.09245 1.10174 5.1607V8.83926C1.10174 8.90761 1.12714 8.95641 1.15299 8.984C1.17779 9.01047 1.1943 9.01084 1.19937 9.01084H4.39977L7 11.6066V2.39357L4.39976 4.98924ZM7.47434 1.92006C7.4743 1.9201 7.47439 1.92002 7.47434 1.92006V1.92006ZM6.76773 12.7877L3.98606 10.0108H1.19937C0.593146 10.0108 0.101743 9.48633 0.101743 8.83926V7.03583L0 6.99998L0.101743 6.96412V5.1607C0.101743 4.51375 0.593146 3.98924 1.19937 3.98924H3.98606L6.76786 1.21233C7.23574 0.745258 8 1.09925 8 1.78301V12.2171C8 12.9007 7.23561 13.2547 6.76773 12.7877Z"
          />
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M15.2677 9.30323C15.463 9.49849 15.7796 9.49849 15.9749 9.30323C16.1701 9.10796 16.1701 8.79138 15.9749 8.59612L14.2071 6.82841L15.9749 5.06066C16.1702 4.8654 16.1702 4.54882 15.9749 4.35355C15.7796 4.15829 15.4631 4.15829 15.2678 4.35355L13.5 6.1213L11.7322 4.35348C11.537 4.15822 11.2204 4.15822 11.0251 4.35348C10.8298 4.54874 10.8298 4.86532 11.0251 5.06058L12.7929 6.82841L11.0251 8.59619C10.8299 8.79146 10.8299 9.10804 11.0251 9.3033C11.2204 9.49856 11.537 9.49856 11.7323 9.3033L13.5 7.53552L15.2677 9.30323Z"
          />
        </g>
      </svg>
    </media-mute-button>
  </template>

  <template partial="PipButton">
    <media-pip-button part="bottom pip button" disabled="{{disabled}}" aria-disabled="{{disabled}}">
      <svg viewBox="0 0 18 14" aria-hidden="true" slot="icon">
        <path
          d="M15.9891 0H2.011C0.9004 0 0 0.9003 0 2.0109V11.989C0 13.0996 0.9004 14 2.011 14H15.9891C17.0997 14 18 13.0997 18 11.9891V2.0109C18 0.9003 17.0997 0 15.9891 0ZM17 11.9891C17 12.5465 16.5465 13 15.9891 13H2.011C1.4536 13 1.0001 12.5465 1.0001 11.9891V2.0109C1.0001 1.4535 1.4536 0.9999 2.011 0.9999H15.9891C16.5465 0.9999 17 1.4535 17 2.0109V11.9891Z"
        />
        <path
          d="M15.356 5.67822H8.19523C8.03253 5.67822 7.90063 5.81012 7.90063 5.97282V11.3836C7.90063 11.5463 8.03253 11.6782 8.19523 11.6782H15.356C15.5187 11.6782 15.6506 11.5463 15.6506 11.3836V5.97282C15.6506 5.81012 15.5187 5.67822 15.356 5.67822Z"
        />
      </svg>
    </media-pip-button>
  </template>

  <template partial="CaptionsMenu">
    <media-captions-menu-button part="bottom captions button">
      <svg aria-hidden="true" viewBox="0 0 18 14" slot="on">
        <path
          d="M15.989 0H2.011C0.9004 0 0 0.9003 0 2.0109V11.9891C0 13.0997 0.9004 14 2.011 14H15.989C17.0997 14 18 13.0997 18 11.9891V2.0109C18 0.9003 17.0997 0 15.989 0ZM4.2292 8.7639C4.5954 9.1902 5.0935 9.4031 5.7233 9.4031C6.1852 9.4031 6.5544 9.301 6.8302 9.0969C7.1061 8.8933 7.2863 8.614 7.3702 8.26H8.4322C8.3062 8.884 8.0093 9.3733 7.5411 9.7273C7.0733 10.0813 6.4703 10.2581 5.732 10.2581C5.108 10.2581 4.5699 10.1219 4.1168 9.8489C3.6637 9.5759 3.3141 9.1946 3.0685 8.7058C2.8224 8.2165 2.6994 7.6511 2.6994 7.009C2.6994 6.3611 2.8224 5.7927 3.0685 5.3034C3.3141 4.8146 3.6637 4.4323 4.1168 4.1559C4.5699 3.88 5.108 3.7418 5.732 3.7418C6.4703 3.7418 7.0733 3.922 7.5411 4.2818C8.0094 4.6422 8.3062 5.1461 8.4322 5.794H7.3702C7.2862 5.4283 7.106 5.1368 6.8302 4.921C6.5544 4.7052 6.1852 4.5968 5.7233 4.5968C5.0934 4.5968 4.5954 4.8116 4.2292 5.2404C3.8635 5.6696 3.6804 6.259 3.6804 7.009C3.6804 7.7531 3.8635 8.3381 4.2292 8.7639ZM11.0974 8.7639C11.4636 9.1902 11.9617 9.4031 12.5915 9.4031C13.0534 9.4031 13.4226 9.301 13.6984 9.0969C13.9743 8.8933 14.1545 8.614 14.2384 8.26H15.3004C15.1744 8.884 14.8775 9.3733 14.4093 9.7273C13.9415 10.0813 13.3385 10.2581 12.6002 10.2581C11.9762 10.2581 11.4381 10.1219 10.985 9.8489C10.5319 9.5759 10.1823 9.1946 9.9367 8.7058C9.6906 8.2165 9.5676 7.6511 9.5676 7.009C9.5676 6.3611 9.6906 5.7927 9.9367 5.3034C10.1823 4.8146 10.5319 4.4323 10.985 4.1559C11.4381 3.88 11.9762 3.7418 12.6002 3.7418C13.3385 3.7418 13.9415 3.922 14.4093 4.2818C14.8776 4.6422 15.1744 5.1461 15.3004 5.794H14.2384C14.1544 5.4283 13.9742 5.1368 13.6984 4.921C13.4226 4.7052 13.0534 4.5968 12.5915 4.5968C11.9616 4.5968 11.4636 4.8116 11.0974 5.2404C10.7317 5.6696 10.5486 6.259 10.5486 7.009C10.5486 7.7531 10.7317 8.3381 11.0974 8.7639Z"
        />
      </svg>
      <svg aria-hidden="true" viewBox="0 0 18 14" slot="off">
        <path
          d="M5.73219 10.258C5.10819 10.258 4.57009 10.1218 4.11699 9.8488C3.66389 9.5758 3.31429 9.1945 3.06869 8.7057C2.82259 8.2164 2.69958 7.651 2.69958 7.0089C2.69958 6.361 2.82259 5.7926 3.06869 5.3033C3.31429 4.8145 3.66389 4.4322 4.11699 4.1558C4.57009 3.8799 5.10819 3.7417 5.73219 3.7417C6.47049 3.7417 7.07348 3.9219 7.54128 4.2817C8.00958 4.6421 8.30638 5.146 8.43238 5.7939H7.37039C7.28639 5.4282 7.10618 5.1367 6.83039 4.9209C6.55459 4.7051 6.18538 4.5967 5.72348 4.5967C5.09358 4.5967 4.59559 4.8115 4.22939 5.2403C3.86369 5.6695 3.68058 6.2589 3.68058 7.0089C3.68058 7.753 3.86369 8.338 4.22939 8.7638C4.59559 9.1901 5.09368 9.403 5.72348 9.403C6.18538 9.403 6.55459 9.3009 6.83039 9.0968C7.10629 8.8932 7.28649 8.6139 7.37039 8.2599H8.43238C8.30638 8.8839 8.00948 9.3732 7.54128 9.7272C7.07348 10.0812 6.47049 10.258 5.73219 10.258Z"
        />
        <path
          d="M12.6003 10.258C11.9763 10.258 11.4382 10.1218 10.9851 9.8488C10.532 9.5758 10.1824 9.1945 9.93685 8.7057C9.69075 8.2164 9.56775 7.651 9.56775 7.0089C9.56775 6.361 9.69075 5.7926 9.93685 5.3033C10.1824 4.8145 10.532 4.4322 10.9851 4.1558C11.4382 3.8799 11.9763 3.7417 12.6003 3.7417C13.3386 3.7417 13.9416 3.9219 14.4094 4.2817C14.8777 4.6421 15.1745 5.146 15.3005 5.7939H14.2385C14.1545 5.4282 13.9743 5.1367 13.6985 4.9209C13.4227 4.7051 13.0535 4.5967 12.5916 4.5967C11.9617 4.5967 11.4637 4.8115 11.0975 5.2403C10.7318 5.6695 10.5487 6.2589 10.5487 7.0089C10.5487 7.753 10.7318 8.338 11.0975 8.7638C11.4637 9.1901 11.9618 9.403 12.5916 9.403C13.0535 9.403 13.4227 9.3009 13.6985 9.0968C13.9744 8.8932 14.1546 8.6139 14.2385 8.2599H15.3005C15.1745 8.8839 14.8776 9.3732 14.4094 9.7272C13.9416 10.0812 13.3386 10.258 12.6003 10.258Z"
        />
        <path
          d="M15.9891 1C16.5465 1 17 1.4535 17 2.011V11.9891C17 12.5465 16.5465 13 15.9891 13H2.0109C1.4535 13 1 12.5465 1 11.9891V2.0109C1 1.4535 1.4535 0.9999 2.0109 0.9999L15.9891 1ZM15.9891 0H2.0109C0.9003 0 0 0.9003 0 2.0109V11.9891C0 13.0997 0.9003 14 2.0109 14H15.9891C17.0997 14 18 13.0997 18 11.9891V2.0109C18 0.9003 17.0997 0 15.9891 0Z"
        />
      </svg>
    </media-captions-menu-button>
    <media-captions-menu
      hidden
      anchor="auto"
      part="bottom captions menu"
      disabled="{{disabled}}"
      aria-disabled="{{disabled}}"
      exportparts="menu-item"
    >
      <div slot="checked-indicator">
        <style>
          .indicator {
            position: relative;
            top: 1px;
            width: 0.9em;
            height: auto;
            fill: var(--_accent-color);
            margin-right: 5px;
          }

          [aria-checked='false'] .indicator {
            display: none;
          }
        </style>
        <svg viewBox="0 0 14 18" class="indicator">
          <path
            d="M12.252 3.48c-.115.033-.301.161-.425.291-.059.063-1.407 1.815-2.995 3.894s-2.897 3.79-2.908 3.802c-.013.014-.661-.616-1.672-1.624-.908-.905-1.702-1.681-1.765-1.723-.401-.27-.783-.211-1.176.183a1.285 1.285 0 0 0-.261.342.582.582 0 0 0-.082.35c0 .165.01.205.08.35.075.153.213.296 2.182 2.271 1.156 1.159 2.17 2.159 2.253 2.222.189.143.338.196.539.194.203-.003.412-.104.618-.299.205-.193 6.7-8.693 6.804-8.903a.716.716 0 0 0 .085-.345c.01-.179.005-.203-.062-.339-.124-.252-.45-.531-.746-.639a.784.784 0 0 0-.469-.027"
            fill-rule="evenodd"
          />
        </svg></div
    ></media-captions-menu>
  </template>

  <template partial="AirplayButton">
    <media-airplay-button part="bottom airplay button" disabled="{{disabled}}" aria-disabled="{{disabled}}">
      <svg viewBox="0 0 18 14" aria-hidden="true" slot="icon">
        <path
          d="M16.1383 0H1.8618C0.8335 0 0 0.8335 0 1.8617V10.1382C0 11.1664 0.8335 12 1.8618 12H3.076C3.1204 11.9433 3.1503 11.8785 3.2012 11.826L4.004 11H1.8618C1.3866 11 1 10.6134 1 10.1382V1.8617C1 1.3865 1.3866 0.9999 1.8618 0.9999H16.1383C16.6135 0.9999 17.0001 1.3865 17.0001 1.8617V10.1382C17.0001 10.6134 16.6135 11 16.1383 11H13.9961L14.7989 11.826C14.8499 11.8785 14.8798 11.9432 14.9241 12H16.1383C17.1665 12 18.0001 11.1664 18.0001 10.1382V1.8617C18 0.8335 17.1665 0 16.1383 0Z"
        />
        <path
          d="M9.55061 8.21903C9.39981 8.06383 9.20001 7.98633 9.00011 7.98633C8.80021 7.98633 8.60031 8.06383 8.44951 8.21903L4.09771 12.697C3.62471 13.1838 3.96961 13.9998 4.64831 13.9998H13.3518C14.0304 13.9998 14.3754 13.1838 13.9023 12.697L9.55061 8.21903Z"
        />
      </svg>
    </media-airplay-button>
  </template>

  <template partial="FullscreenButton">
    <media-fullscreen-button part="bottom fullscreen button" disabled="{{disabled}}" aria-disabled="{{disabled}}">
      <svg viewBox="0 0 18 14" aria-hidden="true" slot="enter">
        <path
          d="M1.00745 4.39539L1.01445 1.98789C1.01605 1.43049 1.47085 0.978289 2.02835 0.979989L6.39375 0.992589L6.39665 -0.007411L2.03125 -0.020011C0.920646 -0.023211 0.0176463 0.874489 0.0144463 1.98509L0.00744629 4.39539H1.00745Z"
        />
        <path
          d="M17.0144 2.03431L17.0076 4.39541H18.0076L18.0144 2.03721C18.0176 0.926712 17.1199 0.0237125 16.0093 0.0205125L11.6439 0.0078125L11.641 1.00781L16.0064 1.02041C16.5638 1.02201 17.016 1.47681 17.0144 2.03431Z"
        />
        <path
          d="M16.9925 9.60498L16.9855 12.0124C16.9839 12.5698 16.5291 13.022 15.9717 13.0204L11.6063 13.0078L11.6034 14.0078L15.9688 14.0204C17.0794 14.0236 17.9823 13.1259 17.9855 12.0153L17.9925 9.60498H16.9925Z"
        />
        <path
          d="M0.985626 11.9661L0.992426 9.60498H-0.0074737L-0.0142737 11.9632C-0.0174737 13.0738 0.880226 13.9767 1.99083 13.98L6.35623 13.9926L6.35913 12.9926L1.99373 12.98C1.43633 12.9784 0.983926 12.5236 0.985626 11.9661Z"
        />
      </svg>
      <svg viewBox="0 0 18 14" aria-hidden="true" slot="exit">
        <path
          d="M5.39655 -0.0200195L5.38955 2.38748C5.38795 2.94488 4.93315 3.39708 4.37565 3.39538L0.0103463 3.38278L0.00744629 4.38278L4.37285 4.39538C5.48345 4.39858 6.38635 3.50088 6.38965 2.39028L6.39665 -0.0200195H5.39655Z"
        />
        <path
          d="M12.6411 2.36891L12.6479 0.0078125H11.6479L11.6411 2.36601C11.6379 3.47651 12.5356 4.37951 13.6462 4.38271L18.0116 4.39531L18.0145 3.39531L13.6491 3.38271C13.0917 3.38111 12.6395 2.92641 12.6411 2.36891Z"
        />
        <path
          d="M12.6034 14.0204L12.6104 11.613C12.612 11.0556 13.0668 10.6034 13.6242 10.605L17.9896 10.6176L17.9925 9.61759L13.6271 9.60499C12.5165 9.60179 11.6136 10.4995 11.6104 11.6101L11.6034 14.0204H12.6034Z"
        />
        <path
          d="M5.359 11.6315L5.3522 13.9926H6.3522L6.359 11.6344C6.3622 10.5238 5.4645 9.62088 4.3539 9.61758L-0.0115043 9.60498L-0.0144043 10.605L4.351 10.6176C4.9084 10.6192 5.3607 11.074 5.359 11.6315Z"
        />
      </svg>
    </media-fullscreen-button>
  </template>

  <template partial="CastButton">
    <media-cast-button part="bottom cast button" disabled="{{disabled}}" aria-disabled="{{disabled}}">
      <svg viewBox="0 0 18 14" aria-hidden="true" slot="enter">
        <path
          d="M16.0072 0H2.0291C0.9185 0 0.0181 0.9003 0.0181 2.011V5.5009C0.357 5.5016 0.6895 5.5275 1.0181 5.5669V2.011C1.0181 1.4536 1.4716 1 2.029 1H16.0072C16.5646 1 17.0181 1.4536 17.0181 2.011V11.9891C17.0181 12.5465 16.5646 13 16.0072 13H8.4358C8.4746 13.3286 8.4999 13.6611 8.4999 13.9999H16.0071C17.1177 13.9999 18.018 13.0996 18.018 11.989V2.011C18.0181 0.9003 17.1178 0 16.0072 0ZM0 6.4999V7.4999C3.584 7.4999 6.5 10.4159 6.5 13.9999H7.5C7.5 9.8642 4.1357 6.4999 0 6.4999ZM0 8.7499V9.7499C2.3433 9.7499 4.25 11.6566 4.25 13.9999H5.25C5.25 11.1049 2.895 8.7499 0 8.7499ZM0.0181 11V14H3.0181C3.0181 12.3431 1.675 11 0.0181 11Z"
        />
      </svg>
      <svg viewBox="0 0 18 14" aria-hidden="true" slot="exit">
        <path
          d="M15.9891 0H2.01103C0.900434 0 3.35947e-05 0.9003 3.35947e-05 2.011V5.5009C0.338934 5.5016 0.671434 5.5275 1.00003 5.5669V2.011C1.00003 1.4536 1.45353 1 2.01093 1H15.9891C16.5465 1 17 1.4536 17 2.011V11.9891C17 12.5465 16.5465 13 15.9891 13H8.41773C8.45653 13.3286 8.48183 13.6611 8.48183 13.9999H15.989C17.0996 13.9999 17.9999 13.0996 17.9999 11.989V2.011C18 0.9003 17.0997 0 15.9891 0ZM-0.0180664 6.4999V7.4999C3.56593 7.4999 6.48193 10.4159 6.48193 13.9999H7.48193C7.48193 9.8642 4.11763 6.4999 -0.0180664 6.4999ZM-0.0180664 8.7499V9.7499C2.32523 9.7499 4.23193 11.6566 4.23193 13.9999H5.23193C5.23193 11.1049 2.87693 8.7499 -0.0180664 8.7499ZM3.35947e-05 11V14H3.00003C3.00003 12.3431 1.65693 11 3.35947e-05 11Z"
        />
        <path d="M2.15002 5.634C5.18352 6.4207 7.57252 8.8151 8.35282 11.8499H15.8501V2.1499H2.15002V5.634Z" />
      </svg>
    </media-cast-button>
  </template>

  <template partial="LiveButton">
    <media-live-button part="{{section ?? 'top'}} live button" disabled="{{disabled}}" aria-disabled="{{disabled}}">
      <span slot="text">Live</span>
    </media-live-button>
  </template>

  <template partial="PlaybackRateMenu">
    <media-playback-rate-menu-button part="bottom playback-rate button"></media-playback-rate-menu-button>
    <media-playback-rate-menu
      hidden
      anchor="auto"
      rates="{{playbackrates}}"
      exportparts="menu-item"
      part="bottom playback-rate menu"
      disabled="{{disabled}}"
      aria-disabled="{{disabled}}"
    ></media-playback-rate-menu>
  </template>

  <template partial="VolumeRange">
    <media-volume-range
      part="bottom volume range"
      disabled="{{disabled}}"
      aria-disabled="{{disabled}}"
    ></media-volume-range>
  </template>

  <template partial="TimeDisplay">
    <media-time-display
      remaining="{{defaultshowremainingtime}}"
      showduration="{{!hideduration}}"
      part="bottom time display"
      disabled="{{disabled}}"
      aria-disabled="{{disabled}}"
    ></media-time-display>
  </template>

  <template partial="TimeRange">
    <media-time-range part="bottom time range" disabled="{{disabled}}" aria-disabled="{{disabled}}" exportparts="thumb">
      <media-preview-thumbnail slot="preview"></media-preview-thumbnail>
      <media-preview-chapter-display slot="preview"></media-preview-chapter-display>
      <media-preview-time-display slot="preview"></media-preview-time-display>
      <div slot="preview" part="arrow"></div>
    </media-time-range>
  </template>

  <template partial="AudioTrackMenu">
    <media-audio-track-menu-button part="bottom audio-track button">
      <svg aria-hidden="true" slot="icon" viewBox="0 0 18 16">
        <path d="M9 15A7 7 0 1 1 9 1a7 7 0 0 1 0 14Zm0 1A8 8 0 1 0 9 0a8 8 0 0 0 0 16Z" />
        <path
          d="M5.2 6.3a.5.5 0 0 1 .5.5v2.4a.5.5 0 1 1-1 0V6.8a.5.5 0 0 1 .5-.5Zm2.4-2.4a.5.5 0 0 1 .5.5v7.2a.5.5 0 0 1-1 0V4.4a.5.5 0 0 1 .5-.5ZM10 5.5a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.4-.8a.5.5 0 0 1 .5.5v5.6a.5.5 0 0 1-1 0V5.2a.5.5 0 0 1 .5-.5Z"
        />
      </svg>
    </media-audio-track-menu-button>
    <media-audio-track-menu
      hidden
      anchor="auto"
      part="bottom audio-track menu"
      disabled="{{disabled}}"
      aria-disabled="{{disabled}}"
      exportparts="menu-item"
    >
      <div slot="checked-indicator">
        <style>
          .indicator {
            position: relative;
            top: 1px;
            width: 0.9em;
            height: auto;
            fill: var(--_accent-color);
            margin-right: 5px;
          }

          [aria-checked='false'] .indicator {
            display: none;
          }
        </style>
        <svg viewBox="0 0 14 18" class="indicator">
          <path
            d="M12.252 3.48c-.115.033-.301.161-.425.291-.059.063-1.407 1.815-2.995 3.894s-2.897 3.79-2.908 3.802c-.013.014-.661-.616-1.672-1.624-.908-.905-1.702-1.681-1.765-1.723-.401-.27-.783-.211-1.176.183a1.285 1.285 0 0 0-.261.342.582.582 0 0 0-.082.35c0 .165.01.205.08.35.075.153.213.296 2.182 2.271 1.156 1.159 2.17 2.159 2.253 2.222.189.143.338.196.539.194.203-.003.412-.104.618-.299.205-.193 6.7-8.693 6.804-8.903a.716.716 0 0 0 .085-.345c.01-.179.005-.203-.062-.339-.124-.252-.45-.531-.746-.639a.784.784 0 0 0-.469-.027"
            fill-rule="evenodd"
          />
        </svg>
      </div>
    </media-audio-track-menu>
  </template>

  <template partial="RenditionMenu">
    <media-rendition-menu-button part="bottom rendition button">
      <svg aria-hidden="true" slot="icon" viewBox="0 0 18 14">
        <path
          d="M2.25 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM9 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm6.75 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
        />
      </svg>
    </media-rendition-menu-button>
    <media-rendition-menu
      hidden
      anchor="auto"
      part="bottom rendition menu"
      disabled="{{disabled}}"
      aria-disabled="{{disabled}}"
    >
      <div slot="checked-indicator">
        <style>
          .indicator {
            position: relative;
            top: 1px;
            width: 0.9em;
            height: auto;
            fill: var(--_accent-color);
            margin-right: 5px;
          }

          [aria-checked='false'] .indicator {
            opacity: 0;
          }
        </style>
        <svg viewBox="0 0 14 18" class="indicator">
          <path
            d="M12.252 3.48c-.115.033-.301.161-.425.291-.059.063-1.407 1.815-2.995 3.894s-2.897 3.79-2.908 3.802c-.013.014-.661-.616-1.672-1.624-.908-.905-1.702-1.681-1.765-1.723-.401-.27-.783-.211-1.176.183a1.285 1.285 0 0 0-.261.342.582.582 0 0 0-.082.35c0 .165.01.205.08.35.075.153.213.296 2.182 2.271 1.156 1.159 2.17 2.159 2.253 2.222.189.143.338.196.539.194.203-.003.412-.104.618-.299.205-.193 6.7-8.693 6.804-8.903a.716.716 0 0 0 .085-.345c.01-.179.005-.203-.062-.339-.124-.252-.45-.531-.746-.639a.784.784 0 0 0-.469-.027"
            fill-rule="evenodd"
          />
        </svg>
      </div>
    </media-rendition-menu>
  </template>

  <template partial="MuxBadge">
    <div part="mux-badge">
      <a href="https://www.mux.com/player" target="_blank">
        <span class="mux-badge-text">Powered by</span>
        <div class="mux-badge-logo">
          <svg
            viewBox="0 0 1600 500"
            style="fill-rule: evenodd; clip-rule: evenodd; stroke-linejoin: round; stroke-miterlimit: 2"
          >
            <g>
              <path
                d="M994.287,93.486c-17.121,-0 -31,-13.879 -31,-31c0,-17.121 13.879,-31 31,-31c17.121,-0 31,13.879 31,31c0,17.121 -13.879,31 -31,31m0,-93.486c-34.509,-0 -62.484,27.976 -62.484,62.486l0,187.511c0,68.943 -56.09,125.033 -125.032,125.033c-68.942,-0 -125.03,-56.09 -125.03,-125.033l0,-187.511c0,-34.51 -27.976,-62.486 -62.485,-62.486c-34.509,-0 -62.484,27.976 -62.484,62.486l0,187.511c0,137.853 112.149,250.003 249.999,250.003c137.851,-0 250.001,-112.15 250.001,-250.003l0,-187.511c0,-34.51 -27.976,-62.486 -62.485,-62.486"
                style="fill-rule: nonzero"
              ></path>
              <path
                d="M1537.51,468.511c-17.121,-0 -31,-13.879 -31,-31c0,-17.121 13.879,-31 31,-31c17.121,-0 31,13.879 31,31c0,17.121 -13.879,31 -31,31m-275.883,-218.509l-143.33,143.329c-24.402,24.402 -24.402,63.966 0,88.368c24.402,24.402 63.967,24.402 88.369,-0l143.33,-143.329l143.328,143.329c24.402,24.4 63.967,24.402 88.369,-0c24.403,-24.402 24.403,-63.966 0.001,-88.368l-143.33,-143.329l0.001,-0.004l143.329,-143.329c24.402,-24.402 24.402,-63.965 0,-88.367c-24.402,-24.402 -63.967,-24.402 -88.369,-0l-143.329,143.328l-143.329,-143.328c-24.402,-24.401 -63.967,-24.402 -88.369,-0c-24.402,24.402 -24.402,63.965 0,88.367l143.329,143.329l0,0.004Z"
                style="fill-rule: nonzero"
              ></path>
              <path
                d="M437.511,468.521c-17.121,-0 -31,-13.879 -31,-31c0,-17.121 13.879,-31 31,-31c17.121,-0 31,13.879 31,31c0,17.121 -13.879,31 -31,31m23.915,-463.762c-23.348,-9.672 -50.226,-4.327 -68.096,13.544l-143.331,143.329l-143.33,-143.329c-17.871,-17.871 -44.747,-23.216 -68.096,-13.544c-23.349,9.671 -38.574,32.455 -38.574,57.729l0,375.026c0,34.51 27.977,62.486 62.487,62.486c34.51,-0 62.486,-27.976 62.486,-62.486l0,-224.173l80.843,80.844c24.404,24.402 63.965,24.402 88.369,-0l80.843,-80.844l0,224.173c0,34.51 27.976,62.486 62.486,62.486c34.51,-0 62.486,-27.976 62.486,-62.486l0,-375.026c0,-25.274 -15.224,-48.058 -38.573,-57.729"
                style="fill-rule: nonzero"
              ></path>
            </g>
          </svg>
        </div>
      </a>
    </div>
  </template>

  <media-controller
    part="controller"
    defaultstreamtype="{{defaultstreamtype ?? 'on-demand'}}"
    breakpoints="sm:470"
    gesturesdisabled="{{disabled}}"
    hotkeys="{{hotkeys}}"
    nohotkeys="{{nohotkeys}}"
    novolumepref="{{novolumepref}}"
    audio="{{audio}}"
    noautoseektolive="{{noautoseektolive}}"
    defaultsubtitles="{{defaultsubtitles}}"
    defaultduration="{{defaultduration ?? false}}"
    keyboardforwardseekoffset="{{forwardseekoffset}}"
    keyboardbackwardseekoffset="{{backwardseekoffset}}"
    exportparts="layer, media-layer, poster-layer, vertical-layer, centered-layer, gesture-layer"
    style="--_pre-playback-place:{{preplaybackplace ?? 'center'}}"
  >
    <slot name="media" slot="media"></slot>
    <slot name="poster" slot="poster"></slot>

    <media-loading-indicator slot="centered-chrome" noautohide></media-loading-indicator>

    <template if="!audio">
      <media-error-dialog slot="dialog" noautohide></media-error-dialog>
      <!-- Pre-playback UI -->
      <!-- same for both on-demand and live -->
      <div slot="centered-chrome" class="center-controls pre-playback">
        <template if="!breakpointsm">{{>PlayButton section="center"}}</template>
        <template if="breakpointsm">{{>PrePlayButton section="center"}}</template>
      </div>

      <!-- Mux Badge -->
      <template if="proudlydisplaymuxbadge"> {{>MuxBadge}} </template>

      <!-- Autoplay centered unmute button -->
      <!--
        todo: figure out how show this with available state variables
        needs to show when:
        - autoplay is enabled
        - playback has been successful
        - audio is muted
        - in place / instead of the pre-plaback play button
        - not to show again after user has interacted with this button
          - OR user has interacted with the mute button in the control bar
      -->
      <!--
        There should be a >MuteButton to the left of the "Unmute" text, but a templating bug
        makes it appear even if commented out in the markup, add it back when code is un-commented
      -->
      <!-- <div slot="centered-chrome" class="autoplay-unmute">
        <div role="button" class="autoplay-unmute-btn">Unmute</div>
      </div> -->

      <template if="streamtype == 'on-demand'">
        <template if="breakpointsm">
          <media-control-bar part="control-bar top" slot="top-chrome">{{>TitleDisplay}} </media-control-bar>
        </template>
        {{>TimeRange}}
        <media-control-bar part="control-bar bottom">
          {{>PlayButton}} {{>SeekBackwardButton}} {{>SeekForwardButton}} {{>TimeDisplay}} {{>MuteButton}}
          {{>VolumeRange}}
          <div class="spacer"></div>
          {{>RenditionMenu}} {{>PlaybackRateMenu}} {{>AudioTrackMenu}} {{>CaptionsMenu}} {{>AirplayButton}}
          {{>CastButton}} {{>PipButton}} {{>FullscreenButton}}
        </media-control-bar>
      </template>

      <template if="streamtype == 'live'">
        <media-control-bar part="control-bar top" slot="top-chrome">
          {{>LiveButton}}
          <template if="breakpointsm"> {{>TitleDisplay}} </template>
        </media-control-bar>
        <template if="targetlivewindow > 0">{{>TimeRange}}</template>
        <media-control-bar part="control-bar bottom">
          {{>PlayButton}}
          <template if="targetlivewindow > 0">{{>SeekBackwardButton}} {{>SeekForwardButton}}</template>
          {{>MuteButton}} {{>VolumeRange}}
          <div class="spacer"></div>
          {{>RenditionMenu}} {{>AudioTrackMenu}} {{>CaptionsMenu}} {{>AirplayButton}} {{>CastButton}} {{>PipButton}}
          {{>FullscreenButton}}
        </media-control-bar>
      </template>
    </template>

    <template if="audio">
      <template if="streamtype == 'on-demand'">
        <template if="title">
          <media-control-bar part="control-bar top">{{>TitleDisplay}}</media-control-bar>
        </template>
        <media-control-bar part="control-bar bottom">
          {{>PlayButton}}
          <template if="breakpointsm"> {{>SeekBackwardButton}} {{>SeekForwardButton}} </template>
          {{>MuteButton}}
          <template if="breakpointsm">{{>VolumeRange}}</template>
          {{>TimeDisplay}} {{>TimeRange}}
          <template if="breakpointsm">{{>PlaybackRateMenu}}</template>
          {{>AirplayButton}} {{>CastButton}}
        </media-control-bar>
      </template>

      <template if="streamtype == 'live'">
        <template if="title">
          <media-control-bar part="control-bar top">{{>TitleDisplay}}</media-control-bar>
        </template>
        <media-control-bar part="control-bar bottom">
          {{>PlayButton}} {{>LiveButton section="bottom"}} {{>MuteButton}}
          <template if="breakpointsm">
            {{>VolumeRange}}
            <template if="targetlivewindow > 0"> {{>SeekBackwardButton}} {{>SeekForwardButton}} </template>
          </template>
          <template if="targetlivewindow > 0"> {{>TimeDisplay}} {{>TimeRange}} </template>
          <template if="!targetlivewindow"><div class="spacer"></div></template>
          {{>AirplayButton}} {{>CastButton}}
        </media-control-bar>
      </template>
    </template>

    <slot></slot>
  </media-controller>
</template>
`,uk=dz.createElement("template");"innerHTML"in uk&&(uk.innerHTML=u_);var uI,uS,uR=class extends rR{};uR.template=null==(uS=null==(uI=uk.content)?void 0:uI.children)?void 0:uS[0],dQ.customElements.get("media-theme-gerwig")||dQ.customElements.define("media-theme-gerwig",uR);var uw={SRC:"src",POSTER:"poster"},uC={STYLE:"style",DEFAULT_HIDDEN_CAPTIONS:"default-hidden-captions",PRIMARY_COLOR:"primary-color",SECONDARY_COLOR:"secondary-color",ACCENT_COLOR:"accent-color",FORWARD_SEEK_OFFSET:"forward-seek-offset",BACKWARD_SEEK_OFFSET:"backward-seek-offset",PLAYBACK_TOKEN:"playback-token",THUMBNAIL_TOKEN:"thumbnail-token",STORYBOARD_TOKEN:"storyboard-token",FULLSCREEN_ELEMENT:"fullscreen-element",DRM_TOKEN:"drm-token",STORYBOARD_SRC:"storyboard-src",THUMBNAIL_TIME:"thumbnail-time",AUDIO:"audio",NOHOTKEYS:"nohotkeys",HOTKEYS:"hotkeys",PLAYBACK_RATES:"playbackrates",DEFAULT_SHOW_REMAINING_TIME:"default-show-remaining-time",DEFAULT_DURATION:"default-duration",TITLE:"title",VIDEO_TITLE:"video-title",PLACEHOLDER:"placeholder",THEME:"theme",DEFAULT_STREAM_TYPE:"default-stream-type",TARGET_LIVE_WINDOW:"target-live-window",EXTRA_SOURCE_PARAMS:"extra-source-params",NO_VOLUME_PREF:"no-volume-pref",NO_MUTED_PREF:"no-muted-pref",CAST_RECEIVER:"cast-receiver",NO_TOOLTIPS:"no-tooltips",PROUDLY_DISPLAY_MUX_BADGE:"proudly-display-mux-badge",DISABLE_PSEUDO_ENDED:"disable-pseudo-ended"},uL=["audio","backwardseekoffset","defaultduration","defaultshowremainingtime","defaultsubtitles","noautoseektolive","disabled","exportparts","forwardseekoffset","hideduration","hotkeys","nohotkeys","playbackrates","defaultstreamtype","streamtype","style","targetlivewindow","template","title","videotitle","novolumepref","nomutedpref","proudlydisplaymuxbadge"],uM=iY.formatErrorMessage;function uD(e){let t=e.videoTitle?{video_title:e.videoTitle}:{};return e.getAttributeNames().filter(e=>e.startsWith("metadata-")).reduce((t,i)=>{let a=e.getAttribute(i);return null!==a&&(t[i.replace(/^metadata-/,"").replace(/-/g,"_")]=a),t},t)}iY.formatErrorMessage=e=>{var t,i;if(e instanceof b.FJ){let a=((e,t=!1)=>({title:((e,t=!1)=>{var i,a;if(e.muxCode){let r=uT(null!=(i=e.errorCategory)?i:"video"),n=(0,b.LM)(null!=(a=e.errorCategory)?a:b.dc.VIDEO);if(e.muxCode===b.Ks.NETWORK_OFFLINE)return(0,b.Ru)("Your device appears to be offline",t);if(e.muxCode===b.Ks.NETWORK_TOKEN_EXPIRED)return(0,b.Ru)("{category} URL has expired",t).format({category:r});if([b.Ks.NETWORK_TOKEN_SUB_MISMATCH,b.Ks.NETWORK_TOKEN_AUD_MISMATCH,b.Ks.NETWORK_TOKEN_AUD_MISSING,b.Ks.NETWORK_TOKEN_MALFORMED].includes(e.muxCode))return(0,b.Ru)("{category} URL is formatted incorrectly",t).format({category:r});if(e.muxCode===b.Ks.NETWORK_TOKEN_MISSING)return(0,b.Ru)("Invalid {categoryName} URL",t).format({categoryName:n});if(e.muxCode===b.Ks.NETWORK_NOT_FOUND)return(0,b.Ru)("{category} does not exist",t).format({category:r});if(e.muxCode===b.Ks.NETWORK_NOT_READY){let i="live"===e.streamType?"Live stream":"Video";return(0,b.Ru)("{mediaType} is not currently available",t).format({mediaType:i})}}if(e.code){if(e.code===b.FJ.MEDIA_ERR_NETWORK)return(0,b.Ru)("Network Error",t);if(e.code===b.FJ.MEDIA_ERR_DECODE)return(0,b.Ru)("Media Error",t);if(e.code===b.FJ.MEDIA_ERR_SRC_NOT_SUPPORTED)return(0,b.Ru)("Source Not Supported",t)}return(0,b.Ru)("Error",t)})(e,t).toString(),message:((e,t=!1)=>{var i,a;if(e.muxCode){let r=uT(null!=(i=e.errorCategory)?i:"video"),n=(0,b.LM)(null!=(a=e.errorCategory)?a:b.dc.VIDEO);return e.muxCode===b.Ks.NETWORK_OFFLINE?(0,b.Ru)("Check your internet connection and try reloading this video.",t):e.muxCode===b.Ks.NETWORK_TOKEN_EXPIRED?(0,b.Ru)("The video’s secured {tokenNamePrefix}-token has expired.",t).format({tokenNamePrefix:n}):e.muxCode===b.Ks.NETWORK_TOKEN_SUB_MISMATCH?(0,b.Ru)("The video’s playback ID does not match the one encoded in the {tokenNamePrefix}-token.",t).format({tokenNamePrefix:n}):e.muxCode===b.Ks.NETWORK_TOKEN_MALFORMED?(0,b.Ru)("{category} URL is formatted incorrectly",t).format({category:r}):[b.Ks.NETWORK_TOKEN_AUD_MISMATCH,b.Ks.NETWORK_TOKEN_AUD_MISSING].includes(e.muxCode)?(0,b.Ru)("The {tokenNamePrefix}-token is formatted with incorrect information.",t).format({tokenNamePrefix:n}):[b.Ks.NETWORK_TOKEN_MISSING,b.Ks.NETWORK_INVALID_URL].includes(e.muxCode)?(0,b.Ru)("The video URL or {tokenNamePrefix}-token are formatted with incorrect or incomplete information.",t).format({tokenNamePrefix:n}):e.muxCode===b.Ks.NETWORK_NOT_FOUND?"":e.message}return e.code&&(e.code===b.FJ.MEDIA_ERR_NETWORK||e.code===b.FJ.MEDIA_ERR_DECODE||e.code===b.FJ.MEDIA_ERR_SRC_NOT_SUPPORTED),e.message})(e,t).toString()}))(e,!1);return`
      ${null!=a&&a.title?`<h3>${a.title}</h3>`:""}
      ${null!=a&&a.message||null!=a&&a.linkUrl?`<p>
        ${null==a?void 0:a.message}
        ${null!=a&&a.linkUrl?`<a
              href="${a.linkUrl}"
              target="_blank"
              rel="external noopener"
              aria-label="${null!=(t=a.linkText)?t:""} ${(0,b.Ru)("(opens in a new window)")}"
              >${null!=(i=a.linkText)?i:a.linkUrl}</a
            >`:""}
      </p>`:""}
    `}return uM(e)};var uO,uN,ux,uP,uU,uW,uB,uH,uV,u$,uK,uF,uY,uG,uq,uj=Object.values(R),uZ=Object.values(uw),uQ=Object.values(uC),uz="mux-player",uX={isDialogOpen:!1},uJ={redundant_streams:!0},u0=class extends uu{constructor(){super(),nB(this,uB),nB(this,uO),nB(this,uN,!1),nB(this,ux,{}),nB(this,uP,!0),nB(this,uU,new ue(this,"hotkeys")),nB(this,uW,{...uX,onCloseErrorDialog:e=>{var t;(null==(t=e.composedPath()[0])?void 0:t.localName)==="media-error-dialog"&&nV(this,uB,u$).call(this,{isDialogOpen:!1})},onFocusInErrorDialog:e=>{var t;(null==(t=e.composedPath()[0])?void 0:t.localName)==="media-error-dialog"&&(d5(this,dz.activeElement)||e.preventDefault())}}),nH(this,uO,(0,b.GI)()),this.attachShadow({mode:"open"}),nV(this,uB,uV).call(this),this.isConnected&&nV(this,uB,uH).call(this)}static get NAME(){return uz}static get VERSION(){return d8}static get observedAttributes(){var e;return[...null!=(e=uu.observedAttributes)?e:[],...uZ,...uj,...uQ]}get mediaTheme(){var e;return null==(e=this.shadowRoot)?void 0:e.querySelector("media-theme")}get mediaController(){var e,t;return null==(t=null==(e=this.mediaTheme)?void 0:e.shadowRoot)?void 0:t.querySelector("media-controller")}connectedCallback(){let e=this.media;e&&(e.metadata=uD(this))}attributeChangedCallback(e,t,i){var a;switch(nV(this,uB,uH).call(this),super.attributeChangedCallback(e,t,i),e){case uC.HOTKEYS:nW(this,uU).value=i;break;case uC.THUMBNAIL_TIME:null!=i&&this.tokens.thumbnail&&ui((0,b.Ru)("Use of thumbnail-time with thumbnail-token is currently unsupported. Ignore thumbnail-time.").toString());break;case uC.THUMBNAIL_TOKEN:if(i){let e=(0,b.$n)(i);if(e){let{aud:t}=e,i=b._G.THUMBNAIL;t!==i&&ui((0,b.Ru)("The {tokenNamePrefix}-token has an incorrect aud value: {aud}. aud value should be {expectedAud}.").format({aud:t,expectedAud:i,tokenNamePrefix:"thumbnail"}))}}break;case uC.STORYBOARD_TOKEN:if(i){let e=(0,b.$n)(i);if(e){let{aud:t}=e,i=b._G.STORYBOARD;t!==i&&ui((0,b.Ru)("The {tokenNamePrefix}-token has an incorrect aud value: {aud}. aud value should be {expectedAud}.").format({aud:t,expectedAud:i,tokenNamePrefix:"storyboard"}))}}break;case uC.DRM_TOKEN:if(i){let e=(0,b.$n)(i);if(e){let{aud:t}=e,i=b._G.DRM;t!==i&&ui((0,b.Ru)("The {tokenNamePrefix}-token has an incorrect aud value: {aud}. aud value should be {expectedAud}.").format({aud:t,expectedAud:i,tokenNamePrefix:"drm"}))}}break;case R.PLAYBACK_ID:null!=i&&i.includes("?token")&&ua((0,b.Ru)("The specificed playback ID {playbackId} contains a token which must be provided via the playback-token attribute.").format({playbackId:i}));break;case R.STREAM_TYPE:i&&![b.U4.LIVE,b.U4.ON_DEMAND,b.U4.UNKNOWN].includes(i)?["ll-live","live:dvr","ll-live:dvr"].includes(this.streamType)?this.targetLiveWindow=i.includes("dvr")?1/0:0:ur({file:"invalid-stream-type.md",message:(0,b.Ru)("Invalid stream-type value supplied: `{streamType}`. Please provide stream-type as either: `on-demand` or `live`").format({streamType:this.streamType})}):i===b.U4.LIVE?null==this.getAttribute(uC.TARGET_LIVE_WINDOW)&&(this.targetLiveWindow=0):this.targetLiveWindow=NaN;break;case uC.FULLSCREEN_ELEMENT:if(null!=i||i!==t){let e=dz.getElementById(i),t=null==e?void 0:e.querySelector("mux-player");this.mediaController&&e&&t&&(this.mediaController.fullscreenElement=e)}}[R.PLAYBACK_ID,uw.SRC,uC.PLAYBACK_TOKEN].includes(e)&&t!==i&&nH(this,uW,{...nW(this,uW),...uX}),nV(this,uB,uK).call(this,{[null!=(a=d7[e])?a:dJ(e)]:i})}async requestFullscreen(e){var t;if(!(!this.mediaController||this.mediaController.hasAttribute(z.MEDIA_IS_FULLSCREEN)))return null==(t=this.mediaController)||t.dispatchEvent(new dQ.CustomEvent(q.MEDIA_ENTER_FULLSCREEN_REQUEST,{composed:!0,bubbles:!0})),new Promise((e,t)=>{var i;null==(i=this.mediaController)||i.addEventListener(X.MEDIA_IS_FULLSCREEN,()=>e(),{once:!0})})}async exitFullscreen(){var e;if(!(!this.mediaController||!this.mediaController.hasAttribute(z.MEDIA_IS_FULLSCREEN)))return null==(e=this.mediaController)||e.dispatchEvent(new dQ.CustomEvent(q.MEDIA_EXIT_FULLSCREEN_REQUEST,{composed:!0,bubbles:!0})),new Promise((e,t)=>{var i;null==(i=this.mediaController)||i.addEventListener(X.MEDIA_IS_FULLSCREEN,()=>e(),{once:!0})})}get preferCmcd(){var e;return null!=(e=this.getAttribute(R.PREFER_CMCD))?e:void 0}set preferCmcd(e){e!==this.preferCmcd&&(e?b.WG.includes(e)?this.setAttribute(R.PREFER_CMCD,e):ui(`Invalid value for preferCmcd. Must be one of ${b.WG.join()}`):this.removeAttribute(R.PREFER_CMCD))}get hasPlayed(){var e,t;return null!=(t=null==(e=this.mediaController)?void 0:e.hasAttribute(z.MEDIA_HAS_PLAYED))&&t}get inLiveWindow(){var e;return null==(e=this.mediaController)?void 0:e.hasAttribute(z.MEDIA_TIME_IS_LIVE)}get _hls(){var e;return null==(e=this.media)?void 0:e._hls}get mux(){var e;return null==(e=this.media)?void 0:e.mux}get theme(){var e;return null!=(e=this.getAttribute(uC.THEME))?e:"gerwig"}set theme(e){this.setAttribute(uC.THEME,`${e}`)}get themeProps(){let e=this.mediaTheme;if(!e)return;let t={};for(let i of e.getAttributeNames()){if(uL.includes(i))continue;let a=e.getAttribute(i);t[dJ(i)]=""===a||a}return t}set themeProps(e){var t,i;nV(this,uB,uH).call(this);let a={...this.themeProps,...e};for(let r in a){if(uL.includes(r))continue;let a=null==e?void 0:e[r];"boolean"==typeof a||null==a?null==(t=this.mediaTheme)||t.toggleAttribute(dX(r),!!a):null==(i=this.mediaTheme)||i.setAttribute(dX(r),a)}}get playbackId(){var e;return null!=(e=this.getAttribute(R.PLAYBACK_ID))?e:void 0}set playbackId(e){e?this.setAttribute(R.PLAYBACK_ID,e):this.removeAttribute(R.PLAYBACK_ID)}get src(){var e,t;return this.playbackId?null!=(e=u1(this,uw.SRC))?e:void 0:null!=(t=this.getAttribute(uw.SRC))?t:void 0}set src(e){e?this.setAttribute(uw.SRC,e):this.removeAttribute(uw.SRC)}get poster(){var e;let t=this.getAttribute(uw.POSTER);if(null!=t)return t;let{tokens:i}=this;return i.playback&&!i.thumbnail?void ui("Missing expected thumbnail token. No poster image will be shown"):this.playbackId&&!this.audio?((e,{token:t,customDomain:i=d9,thumbnailTime:a,programTime:r}={})=>{var n;let s=null==t?a:void 0,{aud:o}=null!=(n=(0,b.$n)(t))?n:{};if(!(t&&"t"!==o))return`https://image.${i}/${e}/thumbnail.webp${d1({token:t,time:s,program_time:r})}`})(this.playbackId,{customDomain:this.customDomain,thumbnailTime:null!=(e=this.thumbnailTime)?e:this.startTime,programTime:this.programStartTime,token:i.thumbnail}):void 0}set poster(e){e||""===e?this.setAttribute(uw.POSTER,e):this.removeAttribute(uw.POSTER)}get storyboardSrc(){var e;return null!=(e=this.getAttribute(uC.STORYBOARD_SRC))?e:void 0}set storyboardSrc(e){e?this.setAttribute(uC.STORYBOARD_SRC,e):this.removeAttribute(uC.STORYBOARD_SRC)}get storyboard(){let{tokens:e}=this;return this.storyboardSrc&&!e.storyboard?this.storyboardSrc:this.audio||!this.playbackId||!this.streamType||[b.U4.LIVE,b.U4.UNKNOWN].includes(this.streamType)||e.playback&&!e.storyboard?void 0:((e,{token:t,customDomain:i=d9,programStartTime:a,programEndTime:r}={})=>{var n;let{aud:s}=null!=(n=(0,b.$n)(t))?n:{};if(!(t&&"s"!==s))return`https://image.${i}/${e}/storyboard.vtt${d1({token:t,format:"webp",program_start_time:a,program_end_time:r})}`})(this.playbackId,{customDomain:this.customDomain,token:e.storyboard,programStartTime:this.programStartTime,programEndTime:this.programEndTime})}get audio(){return this.hasAttribute(uC.AUDIO)}set audio(e){if(!e)return void this.removeAttribute(uC.AUDIO);this.setAttribute(uC.AUDIO,"")}get hotkeys(){return nW(this,uU)}get nohotkeys(){return this.hasAttribute(uC.NOHOTKEYS)}set nohotkeys(e){if(!e)return void this.removeAttribute(uC.NOHOTKEYS);this.setAttribute(uC.NOHOTKEYS,"")}get thumbnailTime(){return d0(this.getAttribute(uC.THUMBNAIL_TIME))}set thumbnailTime(e){this.setAttribute(uC.THUMBNAIL_TIME,`${e}`)}get videoTitle(){var e,t;return null!=(t=null!=(e=this.getAttribute(uC.VIDEO_TITLE))?e:this.getAttribute(uC.TITLE))?t:""}set videoTitle(e){e!==this.videoTitle&&(e?this.setAttribute(uC.VIDEO_TITLE,e):this.removeAttribute(uC.VIDEO_TITLE))}get placeholder(){var e;return null!=(e=u1(this,uC.PLACEHOLDER))?e:""}set placeholder(e){this.setAttribute(uC.PLACEHOLDER,`${e}`)}get primaryColor(){var e,t;let i=this.getAttribute(uC.PRIMARY_COLOR);if(null!=i||this.mediaTheme&&(i=null==(t=null==(e=dQ.getComputedStyle(this.mediaTheme))?void 0:e.getPropertyValue("--_primary-color"))?void 0:t.trim()))return i}set primaryColor(e){this.setAttribute(uC.PRIMARY_COLOR,`${e}`)}get secondaryColor(){var e,t;let i=this.getAttribute(uC.SECONDARY_COLOR);if(null!=i||this.mediaTheme&&(i=null==(t=null==(e=dQ.getComputedStyle(this.mediaTheme))?void 0:e.getPropertyValue("--_secondary-color"))?void 0:t.trim()))return i}set secondaryColor(e){this.setAttribute(uC.SECONDARY_COLOR,`${e}`)}get accentColor(){var e,t;let i=this.getAttribute(uC.ACCENT_COLOR);if(null!=i||this.mediaTheme&&(i=null==(t=null==(e=dQ.getComputedStyle(this.mediaTheme))?void 0:e.getPropertyValue("--_accent-color"))?void 0:t.trim()))return i}set accentColor(e){this.setAttribute(uC.ACCENT_COLOR,`${e}`)}get defaultShowRemainingTime(){return this.hasAttribute(uC.DEFAULT_SHOW_REMAINING_TIME)}set defaultShowRemainingTime(e){e?this.setAttribute(uC.DEFAULT_SHOW_REMAINING_TIME,""):this.removeAttribute(uC.DEFAULT_SHOW_REMAINING_TIME)}get playbackRates(){if(this.hasAttribute(uC.PLAYBACK_RATES))return this.getAttribute(uC.PLAYBACK_RATES).trim().split(/\s*,?\s+/).map(e=>Number(e)).filter(e=>!Number.isNaN(e)).sort((e,t)=>e-t)}set playbackRates(e){if(!e)return void this.removeAttribute(uC.PLAYBACK_RATES);this.setAttribute(uC.PLAYBACK_RATES,e.join(" "))}get forwardSeekOffset(){var e;return null!=(e=d0(this.getAttribute(uC.FORWARD_SEEK_OFFSET)))?e:10}set forwardSeekOffset(e){this.setAttribute(uC.FORWARD_SEEK_OFFSET,`${e}`)}get backwardSeekOffset(){var e;return null!=(e=d0(this.getAttribute(uC.BACKWARD_SEEK_OFFSET)))?e:10}set backwardSeekOffset(e){this.setAttribute(uC.BACKWARD_SEEK_OFFSET,`${e}`)}get defaultHiddenCaptions(){return this.hasAttribute(uC.DEFAULT_HIDDEN_CAPTIONS)}set defaultHiddenCaptions(e){e?this.setAttribute(uC.DEFAULT_HIDDEN_CAPTIONS,""):this.removeAttribute(uC.DEFAULT_HIDDEN_CAPTIONS)}get defaultDuration(){return d0(this.getAttribute(uC.DEFAULT_DURATION))}set defaultDuration(e){null==e?this.removeAttribute(uC.DEFAULT_DURATION):this.setAttribute(uC.DEFAULT_DURATION,`${e}`)}get playerInitTime(){return this.hasAttribute(R.PLAYER_INIT_TIME)?d0(this.getAttribute(R.PLAYER_INIT_TIME)):nW(this,uO)}set playerInitTime(e){e!=this.playerInitTime&&(null==e?this.removeAttribute(R.PLAYER_INIT_TIME):this.setAttribute(R.PLAYER_INIT_TIME,`${+e}`))}get playerSoftwareName(){var e;return null!=(e=this.getAttribute(R.PLAYER_SOFTWARE_NAME))?e:uz}get playerSoftwareVersion(){var e;return null!=(e=this.getAttribute(R.PLAYER_SOFTWARE_VERSION))?e:d8}get beaconCollectionDomain(){var e;return null!=(e=this.getAttribute(R.BEACON_COLLECTION_DOMAIN))?e:void 0}set beaconCollectionDomain(e){e!==this.beaconCollectionDomain&&(e?this.setAttribute(R.BEACON_COLLECTION_DOMAIN,e):this.removeAttribute(R.BEACON_COLLECTION_DOMAIN))}get maxResolution(){var e;return null!=(e=this.getAttribute(R.MAX_RESOLUTION))?e:void 0}set maxResolution(e){e!==this.maxResolution&&(e?this.setAttribute(R.MAX_RESOLUTION,e):this.removeAttribute(R.MAX_RESOLUTION))}get minResolution(){var e;return null!=(e=this.getAttribute(R.MIN_RESOLUTION))?e:void 0}set minResolution(e){e!==this.minResolution&&(e?this.setAttribute(R.MIN_RESOLUTION,e):this.removeAttribute(R.MIN_RESOLUTION))}get maxAutoResolution(){var e;return null!=(e=this.getAttribute(R.MAX_AUTO_RESOLUTION))?e:void 0}set maxAutoResolution(e){null==e?this.removeAttribute(R.MAX_AUTO_RESOLUTION):this.setAttribute(R.MAX_AUTO_RESOLUTION,e)}get renditionOrder(){var e;return null!=(e=this.getAttribute(R.RENDITION_ORDER))?e:void 0}set renditionOrder(e){e!==this.renditionOrder&&(e?this.setAttribute(R.RENDITION_ORDER,e):this.removeAttribute(R.RENDITION_ORDER))}get programStartTime(){return d0(this.getAttribute(R.PROGRAM_START_TIME))}set programStartTime(e){null==e?this.removeAttribute(R.PROGRAM_START_TIME):this.setAttribute(R.PROGRAM_START_TIME,`${e}`)}get programEndTime(){return d0(this.getAttribute(R.PROGRAM_END_TIME))}set programEndTime(e){null==e?this.removeAttribute(R.PROGRAM_END_TIME):this.setAttribute(R.PROGRAM_END_TIME,`${e}`)}get assetStartTime(){return d0(this.getAttribute(R.ASSET_START_TIME))}set assetStartTime(e){null==e?this.removeAttribute(R.ASSET_START_TIME):this.setAttribute(R.ASSET_START_TIME,`${e}`)}get assetEndTime(){return d0(this.getAttribute(R.ASSET_END_TIME))}set assetEndTime(e){null==e?this.removeAttribute(R.ASSET_END_TIME):this.setAttribute(R.ASSET_END_TIME,`${e}`)}get extraSourceParams(){return this.hasAttribute(uC.EXTRA_SOURCE_PARAMS)?[...new URLSearchParams(this.getAttribute(uC.EXTRA_SOURCE_PARAMS)).entries()].reduce((e,[t,i])=>(e[t]=i,e),{}):uJ}set extraSourceParams(e){null==e?this.removeAttribute(uC.EXTRA_SOURCE_PARAMS):this.setAttribute(uC.EXTRA_SOURCE_PARAMS,new URLSearchParams(e).toString())}get customDomain(){var e;return null!=(e=this.getAttribute(R.CUSTOM_DOMAIN))?e:void 0}set customDomain(e){e!==this.customDomain&&(e?this.setAttribute(R.CUSTOM_DOMAIN,e):this.removeAttribute(R.CUSTOM_DOMAIN))}get envKey(){var e;return null!=(e=u1(this,R.ENV_KEY))?e:void 0}set envKey(e){this.setAttribute(R.ENV_KEY,`${e}`)}get noVolumePref(){return this.hasAttribute(uC.NO_VOLUME_PREF)}set noVolumePref(e){e?this.setAttribute(uC.NO_VOLUME_PREF,""):this.removeAttribute(uC.NO_VOLUME_PREF)}get noMutedPref(){return this.hasAttribute(uC.NO_MUTED_PREF)}set noMutedPref(e){e?this.setAttribute(uC.NO_MUTED_PREF,""):this.removeAttribute(uC.NO_MUTED_PREF)}get debug(){return null!=u1(this,R.DEBUG)}set debug(e){e?this.setAttribute(R.DEBUG,""):this.removeAttribute(R.DEBUG)}get disableTracking(){return null!=u1(this,R.DISABLE_TRACKING)}set disableTracking(e){this.toggleAttribute(R.DISABLE_TRACKING,!!e)}get disableCookies(){return null!=u1(this,R.DISABLE_COOKIES)}set disableCookies(e){e?this.setAttribute(R.DISABLE_COOKIES,""):this.removeAttribute(R.DISABLE_COOKIES)}get streamType(){var e,t,i;return null!=(i=null!=(t=this.getAttribute(R.STREAM_TYPE))?t:null==(e=this.media)?void 0:e.streamType)?i:b.U4.UNKNOWN}set streamType(e){this.setAttribute(R.STREAM_TYPE,`${e}`)}get defaultStreamType(){var e,t,i;return null!=(i=null!=(t=this.getAttribute(uC.DEFAULT_STREAM_TYPE))?t:null==(e=this.mediaController)?void 0:e.getAttribute(uC.DEFAULT_STREAM_TYPE))?i:b.U4.ON_DEMAND}set defaultStreamType(e){e?this.setAttribute(uC.DEFAULT_STREAM_TYPE,e):this.removeAttribute(uC.DEFAULT_STREAM_TYPE)}get targetLiveWindow(){var e,t;return this.hasAttribute(uC.TARGET_LIVE_WINDOW)?+this.getAttribute(uC.TARGET_LIVE_WINDOW):null!=(t=null==(e=this.media)?void 0:e.targetLiveWindow)?t:NaN}set targetLiveWindow(e){e==this.targetLiveWindow||Number.isNaN(e)&&Number.isNaN(this.targetLiveWindow)||(null==e?this.removeAttribute(uC.TARGET_LIVE_WINDOW):this.setAttribute(uC.TARGET_LIVE_WINDOW,`${+e}`))}get liveEdgeStart(){var e;return null==(e=this.media)?void 0:e.liveEdgeStart}get startTime(){return d0(u1(this,R.START_TIME))}set startTime(e){this.setAttribute(R.START_TIME,`${e}`)}get preferPlayback(){let e=this.getAttribute(R.PREFER_PLAYBACK);if(e===b.Vi.MSE||e===b.Vi.NATIVE)return e}set preferPlayback(e){e!==this.preferPlayback&&(e===b.Vi.MSE||e===b.Vi.NATIVE?this.setAttribute(R.PREFER_PLAYBACK,e):this.removeAttribute(R.PREFER_PLAYBACK))}get metadata(){var e;return null==(e=this.media)?void 0:e.metadata}set metadata(e){if(nV(this,uB,uH).call(this),!this.media)return void ua("underlying media element missing when trying to set metadata. metadata will not be set.");this.media.metadata={...uD(this),...e}}get _hlsConfig(){var e;return null==(e=this.media)?void 0:e._hlsConfig}set _hlsConfig(e){if(nV(this,uB,uH).call(this),!this.media)return void ua("underlying media element missing when trying to set _hlsConfig. _hlsConfig will not be set.");this.media._hlsConfig=e}async addCuePoints(e){var t;return(nV(this,uB,uH).call(this),this.media)?null==(t=this.media)?void 0:t.addCuePoints(e):void ua("underlying media element missing when trying to addCuePoints. cuePoints will not be added.")}get activeCuePoint(){var e;return null==(e=this.media)?void 0:e.activeCuePoint}get cuePoints(){var e,t;return null!=(t=null==(e=this.media)?void 0:e.cuePoints)?t:[]}addChapters(e){var t;return(nV(this,uB,uH).call(this),this.media)?null==(t=this.media)?void 0:t.addChapters(e):void ua("underlying media element missing when trying to addChapters. chapters will not be added.")}get activeChapter(){var e;return null==(e=this.media)?void 0:e.activeChapter}get chapters(){var e,t;return null!=(t=null==(e=this.media)?void 0:e.chapters)?t:[]}getStartDate(){var e;return null==(e=this.media)?void 0:e.getStartDate()}get currentPdt(){var e;return null==(e=this.media)?void 0:e.currentPdt}get tokens(){let e=this.getAttribute(uC.PLAYBACK_TOKEN),t=this.getAttribute(uC.DRM_TOKEN),i=this.getAttribute(uC.THUMBNAIL_TOKEN),a=this.getAttribute(uC.STORYBOARD_TOKEN);return{...nW(this,ux),...null!=e?{playback:e}:{},...null!=t?{drm:t}:{},...null!=i?{thumbnail:i}:{},...null!=a?{storyboard:a}:{}}}set tokens(e){nH(this,ux,null!=e?e:{})}get playbackToken(){var e;return null!=(e=this.getAttribute(uC.PLAYBACK_TOKEN))?e:void 0}set playbackToken(e){this.setAttribute(uC.PLAYBACK_TOKEN,`${e}`)}get drmToken(){var e;return null!=(e=this.getAttribute(uC.DRM_TOKEN))?e:void 0}set drmToken(e){this.setAttribute(uC.DRM_TOKEN,`${e}`)}get thumbnailToken(){var e;return null!=(e=this.getAttribute(uC.THUMBNAIL_TOKEN))?e:void 0}set thumbnailToken(e){this.setAttribute(uC.THUMBNAIL_TOKEN,`${e}`)}get storyboardToken(){var e;return null!=(e=this.getAttribute(uC.STORYBOARD_TOKEN))?e:void 0}set storyboardToken(e){this.setAttribute(uC.STORYBOARD_TOKEN,`${e}`)}addTextTrack(e,t,i,a){var r;let n=null==(r=this.media)?void 0:r.nativeEl;if(n)return(0,b.KR)(n,e,t,i,a)}removeTextTrack(e){var t;let i=null==(t=this.media)?void 0:t.nativeEl;if(i)return(0,b.$V)(i,e)}get textTracks(){var e;return null==(e=this.media)?void 0:e.textTracks}get castReceiver(){var e;return null!=(e=this.getAttribute(uC.CAST_RECEIVER))?e:void 0}set castReceiver(e){e!==this.castReceiver&&(e?this.setAttribute(uC.CAST_RECEIVER,e):this.removeAttribute(uC.CAST_RECEIVER))}get castCustomData(){var e;return null==(e=this.media)?void 0:e.castCustomData}set castCustomData(e){if(!this.media)return void ua("underlying media element missing when trying to set castCustomData. castCustomData will not be set.");this.media.castCustomData=e}get noTooltips(){return this.hasAttribute(uC.NO_TOOLTIPS)}set noTooltips(e){if(!e)return void this.removeAttribute(uC.NO_TOOLTIPS);this.setAttribute(uC.NO_TOOLTIPS,"")}get proudlyDisplayMuxBadge(){return this.hasAttribute(uC.PROUDLY_DISPLAY_MUX_BADGE)}set proudlyDisplayMuxBadge(e){e?this.setAttribute(uC.PROUDLY_DISPLAY_MUX_BADGE,""):this.removeAttribute(uC.PROUDLY_DISPLAY_MUX_BADGE)}};function u1(e,t){return e.media?e.media.getAttribute(t):e.getAttribute(t)}uO=new WeakMap,uN=new WeakMap,ux=new WeakMap,uP=new WeakMap,uU=new WeakMap,uW=new WeakMap,uB=new WeakSet,uH=function(){var e,t,i,a;if(!nW(this,uN)){nH(this,uN,!0),nV(this,uB,uK).call(this);try{if(customElements.upgrade(this.mediaTheme),!(this.mediaTheme instanceof dQ.HTMLElement))throw""}catch{ua("<media-theme> failed to upgrade!")}try{customElements.upgrade(this.media)}catch{ua("underlying media element failed to upgrade!")}try{if(customElements.upgrade(this.mediaController),!(this.mediaController instanceof tq))throw""}catch{ua("<media-controller> failed to upgrade!")}nV(this,uB,uF).call(this),nV(this,uB,uY).call(this),nV(this,uB,uG).call(this),nH(this,uP,null==(t=null==(e=this.mediaController)?void 0:e.hasAttribute(e8.USER_INACTIVE))||t),nV(this,uB,uq).call(this),null==(i=this.media)||i.addEventListener("streamtypechange",()=>nV(this,uB,uK).call(this)),null==(a=this.media)||a.addEventListener("loadstart",()=>nV(this,uB,uK).call(this))}},uV=function(){var e,t;try{null==(e=null==window?void 0:window.CSS)||e.registerProperty({name:"--media-primary-color",syntax:"<color>",inherits:!0}),null==(t=null==window?void 0:window.CSS)||t.registerProperty({name:"--media-secondary-color",syntax:"<color>",inherits:!0})}catch{}},u$=function(e){Object.assign(nW(this,uW),e),nV(this,uB,uK).call(this)},uK=function(e={}){var t,i,a,r,n,s,o,l,d,u,h,m,c,p,E,v,g,f,A,T,y,_,k,I,S,w,C,L,M,D,O,N,x,P,U,W,B,H,V,$,K,F,Y,G,q,j;let Z,Q;t={...nW(this,uW),...e},Z={src:!this.playbackId&&this.src,playbackId:this.playbackId,hasSrc:!!this.playbackId||!!this.src||!!this.currentSrc,poster:this.poster,storyboard:(null==(i=this.media)?void 0:i.currentSrc)&&this.storyboard,storyboardSrc:this.getAttribute(uC.STORYBOARD_SRC),fullscreenElement:this.getAttribute(uC.FULLSCREEN_ELEMENT),placeholder:this.getAttribute("placeholder"),themeTemplate:function(e){var t,i;let a=e.theme;if(a){let r=null==(i=null==(t=e.getRootNode())?void 0:t.getElementById)?void 0:i.call(t,a);if(r&&r instanceof HTMLTemplateElement)return r;a.startsWith("media-theme-")||(a=`media-theme-${a}`);let n=dQ.customElements.get(a);if(null!=n&&n.template)return n.template}}(this),thumbnailTime:!this.tokens.thumbnail&&this.thumbnailTime,autoplay:this.autoplay,crossOrigin:this.crossOrigin,loop:this.loop,noHotKeys:this.hasAttribute(uC.NOHOTKEYS),hotKeys:this.getAttribute(uC.HOTKEYS),muted:this.muted,paused:this.paused,preload:this.preload,envKey:this.envKey,preferCmcd:this.preferCmcd,debug:this.debug,disableTracking:this.disableTracking,disableCookies:this.disableCookies,tokens:this.tokens,beaconCollectionDomain:this.beaconCollectionDomain,maxResolution:this.maxResolution,minResolution:this.minResolution,maxAutoResolution:this.maxAutoResolution,programStartTime:this.programStartTime,programEndTime:this.programEndTime,assetStartTime:this.assetStartTime,assetEndTime:this.assetEndTime,renditionOrder:this.renditionOrder,metadata:this.metadata,playerInitTime:this.playerInitTime,playerSoftwareName:this.playerSoftwareName,playerSoftwareVersion:this.playerSoftwareVersion,startTime:this.startTime,preferPlayback:this.preferPlayback,audio:this.audio,defaultStreamType:this.defaultStreamType,targetLiveWindow:this.getAttribute(R.TARGET_LIVE_WINDOW),streamType:d6(this.getAttribute(R.STREAM_TYPE)),primaryColor:this.getAttribute(uC.PRIMARY_COLOR),secondaryColor:this.getAttribute(uC.SECONDARY_COLOR),accentColor:this.getAttribute(uC.ACCENT_COLOR),forwardSeekOffset:this.forwardSeekOffset,backwardSeekOffset:this.backwardSeekOffset,defaultHiddenCaptions:this.defaultHiddenCaptions,defaultDuration:this.defaultDuration,defaultShowRemainingTime:this.defaultShowRemainingTime,hideDuration:(Q=null==(n=this.mediaController)?void 0:n.querySelector("media-time-display"))&&"none"===getComputedStyle(Q).getPropertyValue("--media-duration-display-display").trim(),playbackRates:this.getAttribute(uC.PLAYBACK_RATES),customDomain:null!=(a=this.getAttribute(R.CUSTOM_DOMAIN))?a:void 0,title:this.getAttribute(uC.TITLE),videoTitle:null!=(r=this.getAttribute(uC.VIDEO_TITLE))?r:this.getAttribute(uC.TITLE),novolumepref:this.hasAttribute(uC.NO_VOLUME_PREF),nomutedpref:this.hasAttribute(uC.NO_MUTED_PREF),proudlyDisplayMuxBadge:this.hasAttribute(uC.PROUDLY_DISPLAY_MUX_BADGE),castReceiver:this.castReceiver,disablePseudoEnded:this.hasAttribute(uC.DISABLE_PSEUDO_ENDED),...t,extraSourceParams:this.extraSourceParams},s=uf`
  <style>
    ${(e=>{let{tokens:t}=e;return t.drm?":host(:not([cast-receiver])) { --_cast-button-drm-display: none; }":""})(Z)}
    ${uh}
  </style>
  ${l=Z,uf`
  <media-theme
    template="${l.themeTemplate||!1}"
    defaultstreamtype="${null!=(d=l.defaultStreamType)&&d}"
    hotkeys="${(e=>{let t=e.hotKeys?`${e.hotKeys}`:"";return"live"===d6(e.streamType)&&(t+=" noarrowleft noarrowright"),t})(l)||!1}"
    nohotkeys="${l.noHotKeys||!l.hasSrc||!1}"
    noautoseektolive="${!!(null!=(u=l.streamType)&&u.includes(b.U4.LIVE))&&0!==l.targetLiveWindow}"
    novolumepref="${l.novolumepref||!1}"
    nomutedpref="${l.nomutedpref||!1}"
    disabled="${!l.hasSrc||l.isDialogOpen}"
    audio="${null!=(h=l.audio)&&h}"
    style="${null!=(m=function(e){let t="";return Object.entries(e).forEach(([e,i])=>{null!=i&&(t+=`${dX(e)}: ${i}; `)}),t?t.trim():void 0}({"--media-primary-color":l.primaryColor,"--media-secondary-color":l.secondaryColor,"--media-accent-color":l.accentColor}))&&m}"
    defaultsubtitles="${!l.defaultHiddenCaptions}"
    forwardseekoffset="${null!=(c=l.forwardSeekOffset)&&c}"
    backwardseekoffset="${null!=(p=l.backwardSeekOffset)&&p}"
    playbackrates="${null!=(E=l.playbackRates)&&E}"
    defaultshowremainingtime="${null!=(v=l.defaultShowRemainingTime)&&v}"
    defaultduration="${null!=(g=l.defaultDuration)&&g}"
    hideduration="${null!=(f=l.hideDuration)&&f}"
    title="${null!=(A=l.title)&&A}"
    videotitle="${null!=(T=l.videoTitle)&&T}"
    proudlydisplaymuxbadge="${null!=(y=l.proudlyDisplayMuxBadge)&&y}"
    exportparts="${uA}"
    onclose="${l.onCloseErrorDialog}"
    onfocusin="${l.onFocusInErrorDialog}"
  >
    <mux-video
      slot="media"
      inert="${null!=(_=l.noHotKeys)&&_}"
      target-live-window="${null!=(k=l.targetLiveWindow)&&k}"
      stream-type="${null!=(I=d6(l.streamType))&&I}"
      crossorigin="${null!=(S=l.crossOrigin)?S:""}"
      playsinline
      autoplay="${null!=(w=l.autoplay)&&w}"
      muted="${null!=(C=l.muted)&&C}"
      loop="${null!=(L=l.loop)&&L}"
      preload="${null!=(M=l.preload)&&M}"
      debug="${null!=(D=l.debug)&&D}"
      prefer-cmcd="${null!=(O=l.preferCmcd)&&O}"
      disable-tracking="${null!=(N=l.disableTracking)&&N}"
      disable-cookies="${null!=(x=l.disableCookies)&&x}"
      prefer-playback="${null!=(P=l.preferPlayback)&&P}"
      start-time="${null!=l.startTime&&l.startTime}"
      beacon-collection-domain="${null!=(U=l.beaconCollectionDomain)&&U}"
      player-init-time="${null!=(W=l.playerInitTime)&&W}"
      player-software-name="${null!=(B=l.playerSoftwareName)&&B}"
      player-software-version="${null!=(H=l.playerSoftwareVersion)&&H}"
      env-key="${null!=(V=l.envKey)&&V}"
      custom-domain="${null!=($=l.customDomain)&&$}"
      src="${l.src?l.src:!!l.playbackId&&(0,b.OR)(l)}"
      cast-src="${l.src?l.src:!!l.playbackId&&(0,b.OR)(l)}"
      cast-receiver="${null!=(K=l.castReceiver)&&K}"
      drm-token="${null!=(Y=null==(F=l.tokens)?void 0:F.drm)&&Y}"
      exportparts="video"
      disable-pseudo-ended="${null!=(G=l.disablePseudoEnded)&&G}"
      max-auto-resolution="${null!=(q=l.maxAutoResolution)&&q}"
    >
      ${l.storyboard?uf`<track label="thumbnails" default kind="metadata" src="${l.storyboard}" />`:uf``}
      <slot></slot>
    </mux-video>
    <slot name="poster" slot="poster">
      <media-poster-image
        part="poster"
        exportparts="poster, img"
        src="${!!l.poster&&l.poster}"
        placeholdersrc="${null!=(j=l.placeholder)&&j}"
      ></media-poster-image>
    </slot>
  </media-theme>
`}
`,o=this.shadowRoot,s.renderInto(o)},uF=function(){let e=e=>{var t,i;if(!(null!=e&&e.startsWith("theme-")))return;let a=e.replace(/^theme-/,"");if(uL.includes(a))return;let r=this.getAttribute(e);null!=r?null==(t=this.mediaTheme)||t.setAttribute(a,r):null==(i=this.mediaTheme)||i.removeAttribute(a)};new MutationObserver(t=>{for(let{attributeName:i}of t)e(i)}).observe(this,{attributes:!0}),this.getAttributeNames().forEach(e)},uY=function(){let e=e=>{var t;let i=null==(t=this.media)?void 0:t.error;if(!(i instanceof b.FJ)){let{message:e,code:t}=null!=i?i:{};i=new b.FJ(e,t)}if(!(null!=i&&i.fatal)){ui(i),i.data&&ui(`${i.name} data:`,i.data);return}let a=uy(i,!1);a.message&&ur(a),ua(i),i.data&&ua(`${i.name} data:`,i.data),nV(this,uB,u$).call(this,{isDialogOpen:!0})};this.addEventListener("error",e),this.media&&(this.media.errorTranslator=(e={})=>{var t,i,a;if(!((null==(t=this.media)?void 0:t.error)instanceof b.FJ))return e;let r=uy(null==(i=this.media)?void 0:i.error,!1);return{player_error_code:null==(a=this.media)?void 0:a.error.code,player_error_message:r.message?String(r.message):e.player_error_message,player_error_context:r.context?String(r.context):e.player_error_context}})},uG=function(){var e,t,i,a;let r=()=>nV(this,uB,uK).call(this);null==(t=null==(e=this.media)?void 0:e.textTracks)||t.addEventListener("addtrack",r),null==(a=null==(i=this.media)?void 0:i.textTracks)||a.addEventListener("removetrack",r)},uq=function(){var e,t;if(!/Firefox/i.test(navigator.userAgent))return;let i,a=new WeakMap,r=()=>this.streamType===b.U4.LIVE&&!this.secondaryColor&&this.offsetWidth>=800,n=(e,t,i=!1)=>{r()||Array.from(e&&e.activeCues||[]).forEach(e=>{if(!(!e.snapToLines||e.line<-5||e.line>=0&&e.line<10))if(!t||this.paused){let t=e.text.split(`
`).length,r=-3;this.streamType===b.U4.LIVE&&(r=-2);let n=r-t;if(e.line===n&&!i)return;a.has(e)||a.set(e,e.line),e.line=n}else setTimeout(()=>{e.line=a.get(e)||"auto"},500)})},s=()=>{var e,t;n(i,null!=(t=null==(e=this.mediaController)?void 0:e.hasAttribute(e8.USER_INACTIVE))&&t)},o=()=>{var e,t;let a=Array.from((null==(t=null==(e=this.mediaController)?void 0:e.media)?void 0:t.textTracks)||[]).filter(e=>["subtitles","captions"].includes(e.kind)&&"showing"===e.mode)[0];a!==i&&(null==i||i.removeEventListener("cuechange",s)),null==(i=a)||i.addEventListener("cuechange",s),n(i,nW(this,uP))};o(),null==(e=this.textTracks)||e.addEventListener("change",o),null==(t=this.textTracks)||t.addEventListener("addtrack",o),this.addEventListener("userinactivechange",()=>{var e,t;let a=null==(t=null==(e=this.mediaController)?void 0:e.hasAttribute(e8.USER_INACTIVE))||t;nW(this,uP)!==a&&(nH(this,uP,a),n(i,nW(this,uP)))})};var u2=e=>{throw TypeError(e)},u3=(e,t,i)=>t.has(e)||u2("Cannot "+i),u4=class{addEventListener(){}removeEventListener(){}dispatchEvent(e){return!0}};if("undefined"==typeof DocumentFragment){class e extends u4{}globalThis.DocumentFragment=e}var u5,u9=class extends u4{},u8=class{constructor(e,t={}){((e,t,i)=>t.has(e)?u2("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,i))(this,u5),((e,t,i,a)=>(u3(e,t,"write to private field"),a?a.call(e,i):t.set(e,i)))(this,u5,null==t?void 0:t.detail)}get detail(){let e,t;return u3(this,e=u5,"read from private field"),t?t.call(this):e.get(this)}initCustomEvent(){}};u5=new WeakMap;var u6={document:{createElement:function(e,t){return new u9}},DocumentFragment,customElements:{get(e){},define(e,t,i){},getName:e=>null,upgrade(e){},whenDefined:e=>Promise.resolve(u9)},CustomEvent:u8,EventTarget:u4,HTMLElement:u9,HTMLVideoElement:class extends u4{}},u7="undefined"==typeof window||void 0===globalThis.customElements,he=u7?u6:globalThis;u7?u6.document:globalThis.document,he.customElements.get("mux-player")||(he.customElements.define("mux-player",u0),he.MuxPlayerElement=u0)},60237:(e,t,i)=>{i.d(t,{Ay:()=>v});var a=i(12115),r=i(13852);i(15167);var n=parseInt(a.version)>=19,s={className:"class",classname:"class",htmlFor:"for",crossOrigin:"crossorigin",viewBox:"viewBox",playsInline:"playsinline",autoPlay:"autoplay",playbackRate:"playbackrate"},o=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},{ref:t,...i}=e;return Object.entries(i).reduce((e,t)=>{let[i,a]=t,r=((e,t)=>{if(!(!n&&"boolean"==typeof t&&!t)){let i,a;if(i=e,null!=(a=s)&&i in a)return s[e];if(void 0!==t)return/[A-Z]/.test(e)?e.replace(/[A-Z]/g,e=>"-".concat(e.toLowerCase())):e}})(i,a);if(!r)return e;let o=n||"boolean"!=typeof a?a:"";return e[r]=o,e},{})};function l(e,t){if("function"==typeof e)return e(t);null!=e&&(e.current=t)}var d=Object.prototype.hasOwnProperty,u=(e,t,i)=>!((e,t)=>{if(Object.is(e,t))return!0;if("object"!=typeof e||null===e||"object"!=typeof t||null===t)return!1;if(Array.isArray(e))return!!Array.isArray(t)&&e.length===t.length&&e.some((e,i)=>t[i]===e);let i=Object.keys(e),a=Object.keys(t);if(i.length!==a.length)return!1;for(let a=0;a<i.length;a++)if(!d.call(t,i[a])||!Object.is(e[i[a]],t[i[a]]))return!1;return!0})(t,e[i]),h=(e,t,i)=>{e[i]=t},m=function(e,t,i){let r=arguments.length>3&&void 0!==arguments[3]?arguments[3]:h,n=arguments.length>4&&void 0!==arguments[4]?arguments[4]:u;return(0,a.useEffect)(()=>{let a=null==i?void 0:i.current;a&&n(a,t,e)&&r(a,t,e)},[null==i?void 0:i.current,t])},c=(()=>{try{return"3.10.2"}catch(e){}return"UNKNOWN"})(),p=(e,t,i)=>(0,a.useEffect)(()=>{let a=null==t?void 0:t.current;if(a&&i)return a.addEventListener(e,i),()=>{a.removeEventListener(e,i)}},[null==t?void 0:t.current,i,e]),E=a.forwardRef((e,t)=>{let{children:i,...r}=e;return a.createElement("mux-player",{suppressHydrationWarning:!0,...o(r),ref:t},i)}),v=a.forwardRef((e,t)=>{var i;let n=(0,a.useRef)(null),s=function(){for(var e=arguments.length,t=Array(e),i=0;i<e;i++)t[i]=arguments[i];return a.useCallback(function(){for(var e=arguments.length,t=Array(e),i=0;i<e;i++)t[i]=arguments[i];return e=>{let i=!1,a=t.map(t=>{let a=l(t,e);return i||"function"!=typeof a||(i=!0),a});if(i)return()=>{for(let e=0;e<a.length;e++){let i=a[e];"function"==typeof i?i():l(t[e],null)}}}}(...t),t)}(n,t),[o]=((e,t)=>{let{onAbort:i,onCanPlay:a,onCanPlayThrough:r,onEmptied:n,onLoadStart:s,onLoadedData:o,onLoadedMetadata:l,onProgress:d,onDurationChange:h,onVolumeChange:c,onRateChange:E,onResize:v,onWaiting:b,onPlay:g,onPlaying:f,onTimeUpdate:A,onPause:T,onSeeking:y,onSeeked:_,onStalled:k,onSuspend:I,onEnded:S,onError:R,onCuePointChange:w,onChapterChange:C,metadata:L,tokens:M,paused:D,playbackId:O,playbackRates:N,currentTime:x,themeProps:P,extraSourceParams:U,castCustomData:W,_hlsConfig:B,...H}=t;return m("tokens",M,e),m("playbackId",O,e),m("playbackRates",N,e),m("metadata",L,e),m("extraSourceParams",U,e),m("_hlsConfig",B,e),m("themeProps",P,e),m("castCustomData",W,e),m("paused",D,e,(e,t)=>{null!=t&&(t?e.pause():e.play())},(e,t,i)=>(!e.hasAttribute("autoplay")||!!e.hasPlayed)&&u(e,t,i)),m("currentTime",x,e,(e,t)=>{null!=t&&(e.currentTime=t)}),p("abort",e,i),p("canplay",e,a),p("canplaythrough",e,r),p("emptied",e,n),p("loadstart",e,s),p("loadeddata",e,o),p("loadedmetadata",e,l),p("progress",e,d),p("durationchange",e,h),p("volumechange",e,c),p("ratechange",e,E),p("resize",e,v),p("waiting",e,b),p("play",e,g),p("playing",e,f),p("timeupdate",e,A),p("pause",e,T),p("seeking",e,y),p("seeked",e,_),p("stalled",e,k),p("suspend",e,I),p("ended",e,S),p("error",e,R),p("cuepointchange",e,w),p("chapterchange",e,C),[H]})(n,e),[d]=(0,a.useState)(null!=(i=e.playerInitTime)?i:(0,r.GI)());return a.createElement(E,{ref:s,defaultHiddenCaptions:e.defaultHiddenCaptions,playerSoftwareName:"mux-player-react",playerSoftwareVersion:c,playerInitTime:d,...o})})}}]);