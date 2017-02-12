function newXmlhttp() {
	var xmlhttp
	if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
		xmlhttp = new XMLHttpRequest();
	} else { // code for IE6, IE5
		xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
	}

	return xmlhttp
}


function ajaxGet(xmlhttp, url, fun) {	
	xmlhttp.onreadystatechange = fun
	xmlhttp.open('GET', url, true);
	xmlhttp.send();
}

function ajaxPost(xmlhttp, url, data, fun) {
	xmlhttp.onreadystatechange = fun
	xmlhttp.open('POST', url, true);
	xmlhttp.setRequestHeader('Content-type','application/json');
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
    var arr, reg = new RegExp('(^| )' + name + '=([^;]*)(;|$)');
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
		document.cookie = name + '=' + value + ';max-age=-1'
	}
}

function detectOS() { 
	var platform = navigator.platform.toLowerCase();
	var userAgent = navigator.userAgent.toLowerCase();

	// windows
	if (platform.indexOf('win') > -1) {
		if (userAgent.indexOf('Windows NT 5.0') > -1 || userAgent.indexOf('Windows 2000') > -1) {
			return 'Windows 2000';
		} else if (userAgent.indexOf('Windows NT 5.1') > -1 || userAgent.indexOf('Windows XP') > -1) {
			return 'Windows XP';
		} else if (userAgent.indexOf('Windows NT 5.2') > -1 || userAgent.indexOf('Windows 2003') > -1) {
			return 'Windows 2003';
		} else if (userAgent.indexOf('Windows NT 6.0') > -1 || userAgent.indexOf('Windows Vista') > -1) {
			return 'Windows Vista';
		} else if (userAgent.indexOf('Windows NT 6.1') > -1 || userAgent.indexOf('Windows 7') > -1) {
			return 'Windows 7';
		} else if (userAgent.indexOf('Windows NT 10.0') > -1 || userAgent.indexOf('Windows 10') > -1) {
			return 'Windows 10';
		} else {
			return 'Windows Other';
		}
	} else if (platform.indexOf('mac') > -1) {
		return 'Mac';
	} else if (platform.indexOf('x11') > -1) {
		return 'Unix';
	} else if (platform.indexOf('linux') > -1) {
		if (userAgent.indexOf('android') > -1) {
			return 'Android';
		} else {
			return 'Linux';
		}
	} else if (platform.indexOf('iphone') > -1) {
		return 'iPhone';
	} else if (platform.indexOf('ipad') > -1) {
		return 'iPad';
	} else {
		return 'other. platform:' + platform + ' userAgent:' + userAgent;
	}
}

function isPC() {
	var os = detectOS()
	return (os.indexOf('Windows') == 0 || os == 'Mac' || os == 'Unix' || os == 'Linux')
}