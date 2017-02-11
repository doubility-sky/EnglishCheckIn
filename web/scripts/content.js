var _userId, _userIdStr, _userName
var _now, _nowY, _nowM, _nowDay
var _userPlans

var _recordTableIdPrefix = 'records_'
var _recordTableIds = new Object()

function openCheckIn() {
    document.getElementById('div_check_in').hidden = false

    // init check in day
    var beginSelect = document.getElementById('check_in_date_begin')
    var endSelect = document.getElementById('check_in_date_end')

    if (beginSelect.childNodes.length == 0) {
        var minDay = 1
        var maxDay = (new Date(_nowY, _nowM + 1, 0)).getDate()
        do {
            var opt1 = createOption(minDay, minDay + '日')
            beginSelect.add(opt1, null)
            var opt2 = createOption(minDay, minDay + '日')
            endSelect.add(opt2, null)

            minDay = minDay + 1
        } while(minDay <= maxDay)
    }
        
    beginSelect.value = _nowDay
    endSelect.value = _nowDay
}
function closeCheckIn() {
    document.getElementById('div_check_in').hidden = true
}
function openModifyPlans() {
    document.getElementById('div_modify_plans').hidden = false
}
function closeModifyPlans() {
    document.getElementById('div_modify_plans').hidden = true
}

function TableToCSVArray(tableid, firstRow, firstColumn) {
    var tb = document.getElementById(tableid)
    if (tb == null || tb.rows.length == 0) {
        return null
    }

    var rows = tb.rows.length
    var minRow = firstRow ? 0 : 1

    var columns = tb.rows[0].cells.length
    var minColumns = firstColumn ? 0 : 1

    var rowArray = new Array()
    for (var i = minRow; i < rows; i++) {
        var columnArray = new Array()
        for (var j = minColumns; j < columns; j++) {
            tdValue = tb.rows[i].cells[j].innerHTML
            columnArray.push(tdValue)
        }
        
        var s = columnArray.join(',')
        rowArray.push(s)
    }

    return rowArray
    var str = rowArray.join('\n')
    return str
} 

function clickDownload(aLink) {

    var totalArray = new Array()

    for (var i in _recordTableIds) {
        var firstRow = (i == 0)

        var name = _recordTableIds[i]['name']
        var userTableIds = _recordTableIds[i]['ids']

        var userArray = new Array()
        for (var j in userTableIds) {
            var firstColumn = (j == 0)

            var arr = TableToCSVArray(userTableIds[j], firstRow, firstColumn)
            for (var k in arr) {
                if (userArray[k] == null || userArray[k] == undefined) {
                    userArray[k] = new Array()
                    userArray[k].push((firstRow && firstColumn && k == 0) ? 'Name' : name)
                }
                userArray[k].push(arr[k])
            }
        }

        for (var row in userArray) {
            totalArray.push(userArray[row].join(','))
        }

        firstRow = false
    }

    var str = totalArray.join('\n')

    if (str == null || str == '') {
        return
    }

    str =  encodeURIComponent(str)
    aLink.href = 'data:text/csv;charset=utf-8,\ufeff'+str
}

function createRecordTable(id, data, begin, len) {
    var table = document.createElement('table')
    table.id = id
    table.setAttribute('class', 'records_table')
    table.border = 1
    var width = 23 + len * 7
    table.setAttribute('style', 'width:' + width + '%;')

    // create head
    var row = table.insertRow(0)
    for (var i = -1; i < len; i++) {
        var cell = row.insertCell(i+1)
        var text
        if (i == -1) {
            text = 'Plan'
            cell.setAttribute('style', 'width:23%; font-weight: bold;')
            
        } else {
            text = ('0' + (i + begin)).substr(-2)
            cell.setAttribute('style', 'width:7%; font-weight: bold;')
        }
        cell.innerHTML = text
    }

    for (var i = 0; i < data.length; i++) {
        var row = table.insertRow(i+1)

        var rowData = data[i]
        for (var j = 0; j < rowData.length; j++) {
            var cell = row.insertCell(j)
            cell.setAttribute('class', 'records_table_td')
            cell.innerHTML = rowData[j]
        }
    }

    return table
}

function createRecordName(value) {
    var h3 = document.createElement('h3')
    h3.setAttribute('class', 'records_name')
    h3.innerHTML = value
    return h3
}

function createRecordTips(value) {
    var p = document.createElement('p')
    p.setAttribute('class', 'records_tips')
    p.innerHTML = value
    return p
}

function createRecordSplit() {
    var hr = document.createElement('hr')
    hr.setAttribute('class', 'records_split')
    return hr
}

function resetRecords(userId, name, date, records, plans) {
    var divRecord = document.getElementById('div_record')
    if (records == null || records == undefined) {
        divPlans.hidden = true
        return
    }
    document.getElementById('div_record').hidden = false

    // clear div
    var divRecordSub = document.getElementById('div_record_sub')
    divRecordSub.innerHTML = ''

    var plansLen = 0
    for (var i in plans) {
        plansLen += 1
    }
    if (plansLen == 0) {
        if (userId != '0') {
            var n = createRecordName(name)
            divRecordSub.appendChild(n)
        }
        var t = createRecordTips('Come on! Just persevere you are the best!  ^_^')
        divRecordSub.appendChild(t)

        var s = createRecordSplit()
        divRecordSub.appendChild(s)

        document.getElementById('export_query').disabled = true
        document.getElementById('export_query_a').setAttribute("onclick", "return false;")
        document.getElementById('export_record').disabled = true
        document.getElementById('export_record_a').setAttribute("onclick", "return false;")
        return
    }

    // compute days in date
    var queryDate = new Date()
    queryDate.setTime((parseInt(date) + queryDate.getTimezoneOffset() * 60) * 1000)
    var minDay = 1
    var maxDay = (new Date(queryDate.getFullYear(), queryDate.getMonth() + 1, 0)).getDate()
    // put origin data into set
    var completedSet = new Object()
    for (var key in plans) {
        var userPlanObj = new Object()

        var userPlan = plans[key]
        for (var i in userPlan) {
            var planId = userPlan[i]['plan_id']
            userPlanObj[planId] = new Object()
        }
        
        var record = records[key]
        if (record != null && record != undefined) {
            for (var i in record) {
                var planId = record[i]['plan_id']
                var checkinTime = parseInt(record[i]['checkin_time'])

                var d = new Date()
                d.setTime((checkinTime + queryDate.getTimezoneOffset() * 60) * 1000)
                var day = d.getDate()
                userPlanObj[planId][day] = true
            }
        }

        completedSet[key] = userPlanObj
    }

    // algin data from set to array
    var showData = new Array()
    for (var key in plans) {
        var showUser = new Object()

        var userName = key.split(',')[1]
        showUser['name'] = userName

        var showRecord = new Array()
        var noRecord = true

        var userPlanObj = completedSet[key]
        var userPlan = plans[key]
        for (var i in userPlan) {
            var planId = userPlan[i]['plan_id']
            var planSet = userPlanObj[planId]

            var onePlanRecord = new Array()

            var planName = userPlan[i]['content']
            onePlanRecord.push(planName)

            for (var j = minDay; j <= maxDay; j++) {
                if (planSet[j] != true) {
                    onePlanRecord.push('')
                } else {
                    onePlanRecord.push('&radic;')
                    noRecord = false
                }
            }
            showRecord.push(onePlanRecord)
        }

        if (noRecord) {
            showRecord = new Array()
        }
        showUser['record'] = showRecord

        showData.push(showUser)
    }

    // split array to show data, create table and show it.
    _recordTableIds = new Array()
    var tableNumber = 0
    for (var i in showData) {
        var showUser = showData[i]

        var n = createRecordName(showUser['name'])
        divRecordSub.appendChild(n)

        var showRecord = showUser['record']
        if (showRecord.length == 0) {
            var t = createRecordTips('Come on! Just persevere you are the best!  ^_^')
            divRecordSub.appendChild(t)
        } else {
            var tableIds = new Array()
            for (var i = 0; i < 3; i++) {
                var begin = 1 + i * 10
                var len = (i == 2) ? (maxDay - begin + 1) : 10

                var partRecord = new Array()
                for (var j in showRecord) {
                    var onePlanRecord = showRecord[j]

                    var onePart = onePlanRecord.slice(0, 1).concat(onePlanRecord.slice(begin, begin + len))
                    partRecord.push(onePart)
                }

                var tbId = _recordTableIdPrefix + tableNumber
                tableNumber += 1
                tableIds.push(tbId)

                var tb = createRecordTable(tbId, partRecord, begin, len)
                divRecordSub.appendChild(tb)
            }
            _recordTableIds.push({
                'name': showUser['name'],
                'ids': tableIds,
            })
        }

        var s = createRecordSplit()
        divRecordSub.appendChild(s)
    }


    document.getElementById('export_query').disabled = false
    document.getElementById('export_query_a').setAttribute("onclick", "clickDownload(this);")
    document.getElementById('export_record').disabled = false
    document.getElementById('export_record_a').setAttribute("onclick", "clickDownload(this);")
}

function resetPlans(userId, name, plans) {
    var divPlans = document.getElementById('div_plans')
    if (plans == null || plans == undefined) {
        divPlans.hidden = true
        return
    }

    // only show one user's plan. _userId first.
    var showUserId, showUserName, showObj
    if (userId == '0') {
        showUserId = _userIdStr
        showUserName = _userName
    } else {
        showUserId = userId
        showUserName = name
    }
    showObj = plans[showUserId + ',' + showUserName]

    // delete table rows
    var table = document.getElementById('plans')
    var tableLen = table.rows.length
    for (i = 0; i < tableLen - 1; i++)
    {
        table.deleteRow(1);
    }

    // set name
    if (showUserName != null && showUserName != undefined) {
        document.getElementById('plans_name').innerHTML = showUserName
    }

    // add new rows
    if (showObj != null && showObj != undefined) {
        for (var i in showObj) {
            var row = table.insertRow(parseInt(i)+1)
            var contentCell = row.insertCell(0)
            contentCell.innerHTML = showObj[i]['content']
            var planCell = row.insertCell(1)
            planCell.innerHTML = showObj[i]['plan']
        }
    }

    // disable 'modify' button when query user is not _userId
    if (showUserId == _userIdStr) {
        _userPlans = showObj
        document.getElementById('open_operate_plans').disabled = false
    } else {
        document.getElementById('open_operate_plans').disabled = true
    }
}

// click action
function gotoHome() {
    deleteCookieValue('auto_login')
    window.location.href = '/'
}

function query() {
    var queryAccount = document.getElementById('query_account')
    var uid = queryAccount.value
    var name = queryAccount.options[queryAccount.selectedIndex].text

    var year = document.getElementById('query_year').value
    var month = document.getElementById('query_month').value
    var queryDate = new Date(year, month, 1)
    var queryUTC = parseInt(queryDate.getTime() / 1000 - queryDate.getTimezoneOffset() * 60)

    var data = new Object()
    data['user_id'] = uid.toString()
    data['name'] = name
    data['date'] = queryUTC.toString()
    ajaxPost('/query', JSON.stringify(data), function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            var obj = JSON.parse(xmlhttp.responseText)
            if (obj.errorno != 0) {
                alert(obj.msg)
            } else {
                resetPlans(obj.user_id, obj.name, obj.plans)
                resetRecords(obj.user_id, obj.name, obj.date, obj.records, obj.plans)
            }
        }
    })
}

// ajax
function getUserList() {
    ajaxPost('/userlist', null, function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            var obj = JSON.parse(xmlhttp.responseText)
            if (obj.errorno != 0) {
                setLoginTips(obj.msg)
            } else {
                var accountSelect = document.getElementById('query_account')
                for (var i = 0; i < obj.data.length; i++) {
                    var user = obj.data[i]
                    var opt = createOption(user.user_id, user.name)
                    accountSelect.add(opt, null)
                }
                accountSelect.value = _userId
            }
        }
    })
}

// initialize
function initLocalDate(ms) {
    if (ms != null) {
        _now = new Date(ms)
    } else {
        _now = new Date()
    }
    _nowY = _now.getFullYear()
    _nowM = _now.getMonth()
    _nowDay = _now.getDate()
}

function initQueryDate() {
    // init query date selector
    var minYear = 2017
    var maxYear = _nowY
    var yearSelect = document.getElementById('query_year')
    do {
        var opt = createOption(minYear, minYear + '年')
        yearSelect.add(opt, null)

        minYear = minYear + 1
    } while(minYear <= maxYear)
    yearSelect.value = _nowY

    var minMonth = 0
    var maxMonth = 11
    var monthSelect = document.getElementById('query_month')
    do {
        var opt = createOption(minMonth, minMonth + 1 + '月')
        monthSelect.add(opt, null)

        minMonth = minMonth + 1
    } while(minMonth <= maxMonth)
    monthSelect.value = _nowM
}

function init() {
    // reset date
    var serverTime = document.getElementById('server_time').value
    if (isNaN(parseInt(serverTime))) {
        initLocalDate(null)
    } else {
        initLocalDate(parseInt(serverTime) * 1000)
    }

    // init query date
    initQueryDate()

    // init query user
    _userIdStr = document.getElementById('user_id').value
    _userId = parseInt(_userIdStr)
    _userName = document.getElementById('user_name').value

    // get user list
    getUserList()
}