
function cleanTabFigStr(str) 
{
   str = str.replace(".", "");
   str = str.replace(" ", "");
   str = str.replace("tab", "Tab ");
   str = str.replace("Tab", "Tab. ");
   str = str.replace("fig", "Fig ");
   str = str.replace("Fig", "Fig. ");   
   str = str.replace("eq", "Eq ");
   str = str.replace("Eq", "Eq. ");       

   return str;
}

function parseUrl() {

    params = window.location.search.slice(1)
              .split('&')
              .reduce(function _reduce (/*Object*/ a, /*String*/ b) {
              b = b.split('=');
              a[b[0]] = decodeURIComponent(b[1]);
              return a;
              }, {});

    return params;
}

function buildUrl(url, parameters)
{
     var qs = "";
     for(var key in parameters) 
     {
         var value = parameters[key];
         qs += encodeURIComponent(key) + "=" + encodeURIComponent(value) + "&";
     }
     
     if (qs.length > 0)
     {
         qs = qs.substring(0, qs.length-1); //chop off last "&"
         url = url + "?" + qs;
     }

     return url;
}

function getHash(s)
{
    return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
}

function getByLines(list,line,line_end,lstr,type)
{
    if (lstr===undefined || lstr===null) lstr = ""; 
    lstr = cleanTabFigStr(lstr);
    for ( var i in list)
    {
        if( list[i] == null ) continue;
        if( list[i].type != type ) continue;
        if( list[i].line == line && list[i].line_end == line_end ) 
        {
            if (lstr.indexOf('Tab') > -1 || lstr.indexOf('Fig') > -1 || lstr.indexOf('Eq') > -1) {
                if ( lstr == list[i].lstr ) return list[i]; } 
            else  return list[i];
        }
    }
    return null;
}

function getByHash(list,hash)
{
    for ( var i in list )
    {
        if( list[i] == null ) continue;
        if( list[i].hash == hash ) return list[i];
    }
    return null;
}

function generateUUID () { // Public Domain/MIT
    var d = new Date().getTime();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

function reformat(str,type) 
{
    if (type===undefined) type = 0;

    if (type == 1) {
        str = str.replace(/--nl----nl--/g," // ");
        str = str.replace(/--nl--/g," ");
    }
    else str = str.replace(/--nl--/g,"\n");   

    str = str.replace(/--dq--/g,"\"");

    return str;
}

function compare(a,b) 
{
    if (a.line == undefined) return -1;
    if (b.line == undefined) return 1;
    return (Number(a.line) > Number(b.line)) ? 1 : ((Number(b.line) > Number(a.line)) ? -1 : 0);
}
