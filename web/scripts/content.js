var recordTableId = 'records'
var now, nowY, nowM, nowDay

function resetDate(d) {
    now = new Date()
    nowY = now.getFullYear()
    nowM = now.getMonth() + 1
    nowDay = now.getDate()
}

function createOption(value, text) {
    var option = document.createElement('option')
    option.value = value
    option.text = text
    return option
}

function openCheckIn() {
    document.getElementById('div_check_in').hidden = false

    // init check in day
    var beginSelect = document.getElementById('check_in_date_begin')
    var endSelect = document.getElementById('check_in_date_end')

    if (beginSelect.childNodes.length == 0) {
        var minDay = 1
        var maxDay = (new Date(nowY, nowM, 0)).getDate()
        do {
            var opt1 = createOption(minDay, minDay + "日")
            beginSelect.add(opt1, null)
            var opt2 = createOption(minDay, minDay + "日")
            endSelect.add(opt2, null)

            minDay = minDay + 1
        } while(minDay <= maxDay)
    }
        
    beginSelect.value = nowDay
    endSelect.value = nowDay
}
function closeCheckIn() {
    document.getElementById('div_check_in').hidden = true
}
function openOptPlans() {
    document.getElementById('div_opt_plans').hidden = false
}
function closeOptPlans() {
    document.getElementById('div_opt_plans').hidden = true
}

function TableToStr(tableid) {
    var tb = document.getElementById(tableid)
    if (tb == null || tb.rows.length == 0) {
        return null
    }

    var rows = tb.rows.length
    var columns = tb.rows[0].cells.length

    var rowArray = new Array()

    for (var i = 0; i < rows; i++) {
        var columnArray = new Array()
        for (var j = 0; j < columns; j++) {
            tdValue = tb.rows[i].cells[j].innerHTML
            columnArray.push(tdValue)
        }
        
        var s = columnArray.join(',')
        rowArray.push(s)
    }

    var str = rowArray.join('\n')
    return str
} 

function clickDownload(aLink) {  
     var str = TableToStr(recordTableId)
     if (str == null || str == "") {
        alert("There is no any records!")
        return
     }

     str =  encodeURIComponent(str)
     aLink.href = 'data:text/csv;charset=utf-8,\ufeff'+str
}

function createTable(columns, data) {
    var oldTable = document.getElementById(recordTableId)
    if (oldTable != null) {
        div.removeChild(oldTable)
        oldTable = null
    }

    var table = document.createElement('table')
    table.id = recordTableId
    table.border = '1'
    table.setAttribute('class', 'records')

    // create head
    for (var i = 0; i < columns; i++) {
        var th = document.createElement('th')
        var text
        if (i == 0) {
            text = "No."
        } else {
            text = ("0" + i).substr(-2)
        }
        var content = document.createTextNode(text)
        th.appendChild(content)
        table.appendChild(th)
    }

    for (var i = 0; i < 2; i++) {
        var row = table.insertRow(i)
        for (var j = 0; j < columns; j++) {
            var cell = row.insertCell(j)
            cell.innerHTML = "&#8730"
        }
    }

    var div = document.getElementById('div_record_sub')
    div.appendChild(table)

    document.getElementById('div_record').hidden = false
}

function gotoHome() {
    window.location.href = '/index.html'
}

function setClassCalender(id) {
    var obj = document.getElementById(id)
    if (obj != null) {
        var oldClass = obj.getAttribute('class')
        if (oldClass == null) {
            obj.setAttribute('class', 'Calender')
        } else {
            obj.setAttribute('class', oldClass + ' Calender')
        }
    }
}

function init() {
    // reset date
    resetDate()

    // url query params
    function getQueryString(name) {
        var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)')
        var r = window.location.search.substr(1).match(reg)
        if(r!=null)return  decodeURIComponent(r[2]); return null
    }

    var id = getQueryString('id')
    var name = getQueryString('name')
    document.getElementById('hello').value = 'Hi, ' + name

    // init query date selector
    var minYear = 2015
    var maxYear = nowY
    var yearSelect = document.getElementById('query_year')
    do {
        var opt = createOption(minYear, minYear + "年")
        yearSelect.add(opt, null)

        minYear = minYear + 1
    } while(minYear <= maxYear)
    yearSelect.value = nowY

    var minMonth = 1
    var maxMonth = 12
    var monthSelect = document.getElementById('query_month')
    do {
        var opt = createOption(minMonth, minMonth + "月")
        monthSelect.add(opt, null)

        minMonth = minMonth + 1
    } while(minMonth <= maxMonth)
    monthSelect.value = nowM

    // init query user
    document.getElementById('query_account').value = id
}