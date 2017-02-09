function login() {
	var select = document.getElementById('login_account')
	var id = select.value
	var name = select.options[select.selectedIndex].text
	window.location.href='/content.html?id=' + encodeURIComponent(id) + '&name=' + encodeURIComponent(name)
}

function createNewAccount(value) {
	alert('createNewAccount : ' + value)
	closeCreateDiv()
}

function openCreateDiv() {
	document.getElementById('div_new').removeAttribute('hidden')
	document.getElementById('new_account').value = "";
}

function closeCreateDiv() {
	document.getElementById('div_new').hidden = true
}