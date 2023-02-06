// ESDC - plugin to manage the changing of languages of the Authoring Tool
console.log('Language switcher plugin loaded')
// rewrote switcher - removed unecessary parts and added 200 ms delay
var currlang = localStorage.getItem('lang') || 'en';

function defcurrlang ()  {
  if(currlang === "en"){
     document.querySelector("html").setAttribute('lang', 'en');
   }else{
     document.querySelector("html").setAttribute('lang', 'fr');
   }
}

if( document.readyState !== 'loading' ) {
  defcurrlang();
} else {
  document.addEventListener('DOMContentLoaded', function () {
      defcurrlang();
  });
}

function setLang(lang){
  localStorage.setItem('lang', lang);
}

function togglelang () {
  if(currlang === 'en'){
    setLang('fr');
    setTimeout(function(){
      location.reload();
    }, 200);
  } else {
    setLang('en');
    setTimeout(function(){
      location.reload();
    }, 200);
  }
}
