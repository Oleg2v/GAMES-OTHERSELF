import { mount } from './main.js';
import './standalone.css';
import { t } from './i18n.js';
const root=document.querySelector('#app');
const observer=new MutationObserver(()=>{
  document.documentElement.lang=root.lang;
  document.documentElement.dir=root.dir;
  const url=new URL(location.href);
  if(url.searchParams.has('lang')&&url.searchParams.get('lang')!==root.lang){url.searchParams.set('lang',root.lang);history.replaceState(history.state,'',url);}
  document.title=`${t(root.lang,'title')} — OTHERSELF · Kikkey Games`;
  document.querySelector('meta[name=description]')?.setAttribute('content',t(root.lang,'intro'));
});
observer.observe(root,{attributes:true,attributeFilter:['lang','dir']});
mount(root);
