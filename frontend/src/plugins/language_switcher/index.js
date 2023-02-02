// ESDC - plugin to manage the changing of languages of the Authoring Tool
console.log('Language switcher plugin loaded')

var currlang = localStorage.getItem("lang");

if(!currlang){
  setLang('en');
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

function defcurrlang ()  {
     if(currlang === "fr"){
        document.querySelector("html").setAttribute('lang', 'fr');
      }else{
        document.querySelector("html").setAttribute('lang', 'en');
      }
}

function togglelang () {
  if(currlang === 'en'){
    setLang('fr')
    location.reload();
  } else {
    setLang('en');
    location.reload();
  }
}
