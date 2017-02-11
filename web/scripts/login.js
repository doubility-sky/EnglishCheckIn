function setLoginTips(tips) {
	document.getElementById('login_tips').innerHTML = "&raquo; " + tips + " &laquo;"
}

function setRegisterTips(tips) {
	document.getElementById('register_tips').innerHTML = "&raquo; " + tips + " &laquo;"
}

function login() {
	var select = document.getElementById('login_account')
	var uid = select.value
	if (uid == '0') {
		setLoginTips("Please choose or sign up one account!")
		return
	}

	var data = new Object()
	data["user_id"] = uid
	ajaxPost("/login", JSON.stringify(data), function() {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			if (xmlhttp.responseText[0] == "<") {
				document.write(xmlhttp.responseText)
			} else {
				var obj = JSON.parse(xmlhttp.responseText)
				if (obj.errorno != 0) {
					setLoginTips(obj.msg)
				}
			}
		}
	})
}

function createNewAccount() {
	var name = document.getElementById('new_account').value
	if (name == "") {
		setRegisterTips("Name can't be empty!")
		return
	}

	// check special characters
	var re = new RegExp("[\u0000-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007F]")
	var arr = name.match(re)
	if (arr != null) {
		setRegisterTips("Name can't contain special character: " + arr[0])
		return
	}

	var data = new Object()
	data["name"] = name
	ajaxPost("/register", JSON.stringify(data), function() {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			if (xmlhttp.responseText[0] == "<") {
				document.write(xmlhttp.responseText)
			} else {
				var obj = JSON.parse(xmlhttp.responseText)
				if (obj.errorno != 0) {
					setRegisterTips(obj.msg)
				}
			}
		}
	})
}

function openCreateDiv() {
	document.getElementById('div_new').removeAttribute('hidden')
	document.getElementById('new_account').value = "";
}

function closeCreateDiv() {
	document.getElementById('div_new').hidden = true
}

function getUserList() {
	ajaxPost("/userlist", null, function() {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			var obj = JSON.parse(xmlhttp.responseText)
			if (obj.errorno != 0) {
				setLoginTips(obj.msg)
			} else {
				var accountSelect = document.getElementById('login_account')
				for (var i = 0; i < obj.data.length; i++) {
					var user = obj.data[i]
			        var opt = createOption(user.user_id, user.name)
			        accountSelect.add(opt, null)
				}
				var cookieUserId = getCookieValue("user_id")
				if (cookieUserId != null) {
					accountSelect.value = cookieUserId
				}
			}
		}
	})
}

function init() {
	getUserList()
}