javascript:(function(){
    function callback(){
        console.log('bookmarklet');
    }
    var s = document.createElement("script");
    s.src = "http://127.0.0.1:5000/stock-rotator.js";
    if (s.addEventListener){
        s.addEventListener("load", callback, false);
    } else if (s.readyState){
        s.onreadystatechange = callback;
    }
    document.body.appendChild(s);
})();


/*   Single Line Version */
javascript:(function(){function callback(){console.log('bookmarklet');}var s=document.createElement("script");s.src="http://127.0.0.1:5000/stock-rotator.js";if(s.addEventListener){s.addEventListener("load",callback,false);}else if(s.readyState){s.onreadystatechange=callback;}document.body.appendChild(s);})();


javascript:(function(){(async function load(){const module = await import("http://127.0.0.1:8080/investment-overrides.js");module.xhrInterceptor.setup();})()})()