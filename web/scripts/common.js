var xmlhttp;
function ajaxGet(url, fun) {
	if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
		xmlhttp = new XMLHttpRequest();
	} else { // code for IE6, IE5
		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	
	xmlhttp.onreadystatechange = fun
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}

function ajaxPost(url, data, fun) {
	if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
		xmlhttp = new XMLHttpRequest();
	} else { // code for IE6, IE5
		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	
	xmlhttp.onreadystatechange = fun
	xmlhttp.open("POST", url, true);
	xmlhttp.setRequestHeader("Content-type","application/json");
	xmlhttp.send(data);
}

function createOption(value, text) {
    var option = document.createElement('option')
    option.value = value
    option.text = text
    return option
}

function getCookieValue(name)
{
    var arr, reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
    if (arr = document.cookie.match(reg)) {
	    return unescape(arr[2]);
    } else {
	    return null;
    }
}

function deleteCookieValue(name)
{
	var value = getCookieValue(name)
	if (value != null) {
		document.cookie = name + "=" + value + ";max-age=-1"
	}
}