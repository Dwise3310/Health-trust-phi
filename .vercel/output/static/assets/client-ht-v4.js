import{i as e,r as t,t as n}from"./react-DB-4Zxce.js";
var Y={
signIn:{email:async(p)=>{try{let r=await fetch("/api/auth/sign-in/email",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)});let j=await r.json().catch(()=>({}));if(!r.ok)return{error:{message:j.message||j.error||"Sign-in failed"}};return{data:j,error:null}}catch(e){return{error:{message:e.message||"Sign-in failed"}}}}},
signUp:{email:async(p)=>{try{let r=await fetch("/api/auth/sign-up/email",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)});let j=await r.json().catch(()=>({}));if(!r.ok)return{error:{message:j.message||j.error||"Sign-up failed"}};return{data:j,error:null}}catch(e){return{error:{message:e.message||"Sign-up failed"}}}}},
forgetPassword:async(p)=>{try{let r=await fetch("/api/auth/forget-password",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)});let j=await r.json().catch(()=>({}));if(!r.ok)return{error:{message:j.message||"Failed"}};return{data:j,error:null}}catch(e){return{error:{message:e.message||"Failed"}}}},
signOut:async()=>{try{await fetch("/api/auth/sign-out",{method:"POST",credentials:"include"});return{error:null}}catch(e){return{error:{message:e.message}}}},
getSession:async()=>{try{let r=await fetch("/api/auth/get-session",{credentials:"include"});return{data:await r.json().catch(()=>null),error:null}}catch(e){return{data:null,error:{message:e.message}}}},
useSession:()=>({data:null,isPending:!1,error:null})
};
function Lt(e,t){throw Error("Social sign-in is not connected yet. Use email for now.")}
async function Bt(e="/"){await Y.signOut();if(typeof window!=="undefined")window.location.href=e}
var It={authClient:()=>Y,authEnabled:()=>!0,getBearerToken:()=>null,signIn:()=>Lt,signOut:()=>Bt};
export{Bt as i,It as n,Lt as r,Y as t};
