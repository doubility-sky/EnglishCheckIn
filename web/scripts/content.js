var _userId, _userIdStr, _userName
var _now, _nowY, _nowM, _nowDay
var _userPlans

var _RecordTableIdPrefix = 'records_'
var _recordTableIds = new Array()

var _Month = new Array('January','February','March','April','May','June','July','August','September','October','November','December');
var _MaxPlansNumber = 10

function gotoHome() {
    deleteCookieValue('auto_login')
    window.location.href = '/'
}

// check in function
function openCheckIn() {
    document.getElementById('div_check_in').hidden = false

    // init check in day
    document.getElementById('check_in_month').innerHTML = _nowY + '年' + (_nowM + 1) + '月'
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

    // init table
    var table = document.getElementById('check_in')
    var tableLen = table.rows.length
    for (i = 0; i < tableLen - 1; i++)
    {
        table.deleteRow(1);
    }

    for (var i in _userPlans) {
        var userPlan = _userPlans[i]

        var row = table.insertRow()

        var idCell = row.insertCell(0)
        idCell.innerHTML = userPlan['plan_id']
        idCell.hidden = true

        var idCell = row.insertCell(1)
        idCell.innerHTML = '<input type="checkbox" class="check_in_box" onchange="changeCheckIn(this.checked);"/>'
        
        var contentCell = row.insertCell(2)
        contentCell.setAttribute('class', 'table_td')
        // contentCell.innerHTML = '<marquee class="center" scrollamount="10" onmouseover="stopMarquee(this);" onmouseout="startMarquee(this);">'
        //     + '<span>' + userPlan['content'] + '</span></marquee>'
        // var contentMarquee = contentCell.firstChild
        // judgeMarqueeStop(contentMarquee, contentMarquee.firstChild.offsetWidth, contentCell.offsetWidth)
        contentCell.innerHTML = userPlan['content']

        var planCell = row.insertCell(3)
        planCell.setAttribute('class', 'table_td')
        // planCell.innerHTML = '<marquee class="center" scrollamount="10" onmouseover="stopMarquee(this);" onmouseout="startMarquee(this);">'
        //     + '<span>' + userPlan['plan'] + '</span></marquee>'
        // var planMarquee = planCell.firstChild
        // judgeMarqueeStop(planMarquee, planMarquee.firstChild.offsetWidth, planCell.offsetWidth)
        planCell.innerHTML = userPlan['plan']
    }

    document.getElementById('all_selected').checked = true
    changeAllCheckIn(true)
}

function closeCheckIn() {
    document.getElementById('div_check_in').hidden = true
}

function changeAllCheckIn(checked) {
    var table = document.getElementById('check_in')
    for (var i = 1; i < table.rows.length; i++) {
        var tr = table.rows[i]
        var checkbox = tr.children[1].firstChild

        checkbox.checked = checked
    }
}

function changeCheckIn(checked) {
    if (!checked) {
        document.getElementById('all_selected').checked = false
    } else {
        var allChecked = true
        var table = document.getElementById('check_in')
        for (var i = 1; i < table.rows.length; i++) {
            var tr = table.rows[i]
            var checkbox = tr.children[1].firstChild

            if (!checkbox.checked) {
                allChecked = false
                break
            }
        }
        document.getElementById('all_selected').checked = allChecked
    }
}

function confirmCheckIn() {
    var beginTime = parseInt(document.getElementById('check_in_date_begin').value)
    var endTime = parseInt(document.getElementById('check_in_date_end').value)
    
    if (beginTime > _nowDay || endTime > _nowDay) {
        alert('Date exceed today!')
        return
    }

    if (beginTime > endTime) {
        endTime = beginTime
    }

    var checkInPlans = new Array()

    var table = document.getElementById('check_in')
    for (var i = 1; i < table.rows.length; i++) {
        var tr = table.rows[i]
        var checkbox = tr.children[1].firstChild

        if (checkbox.checked) {
            checkInPlans.push(tr.children[0].innerHTML)
        }
    }

    if (checkInPlans.length == 0) {
        closeCheckIn()
    } else {
        checkIn(beginTime, endTime, checkInPlans, 'false', function() {
            closeCheckIn()
            query()
        }, true)
    }
}

function singleCheckIn(btn, planId, day) {
    var plans = new Array()
    plans.push(planId.toString())

    if (btn.innerHTML == '') {
        checkIn(day, day, plans, 'false', function() {
            btn.innerHTML = '&radic;'
        }, false)
    } else {
        checkIn(day, day, plans, 'true', function() {
            btn.innerHTML = ''
        }, false)
    }
}

// modify plan function
function openModifyPlans() {
    document.getElementById('div_modify_plans').hidden = false

    var table = document.getElementById('modify_plans')
    var tableLen = table.rows.length
    for (i = 0; i < tableLen - 1; i++)
    {
        table.deleteRow(1);
    }

    for (var i in _userPlans) {
        var userPlan = _userPlans[i]

        var row = table.insertRow()

        var idCell = row.insertCell(0)
        idCell.innerHTML = userPlan['plan_id']
        idCell.hidden = true
        
        var contentCell = row.insertCell(1)
        contentCell.setAttribute('class', 'table_td')
        // contentCell.innerHTML = '<marquee class="center" scrollamount="10" onmouseover="stopMarquee(this);" onmouseout="startMarquee(this);">'
        //     + '<span>' + userPlan['content'] + '</span></marquee>'
        // var contentMarquee = contentCell.firstChild
        // judgeMarqueeStop(contentMarquee, contentMarquee.firstChild.offsetWidth, contentCell.offsetWidth)
        contentCell.innerHTML = userPlan['content']

        var planCell = row.insertCell(2)
        planCell.setAttribute('class', 'table_td')
        // planCell.innerHTML = '<marquee class="center" scrollamount="10" onmouseover="stopMarquee(this);" onmouseout="startMarquee(this);">'
        //     + '<span>' + userPlan['plan'] + '</span></marquee>'
        // var planMarquee = planCell.firstChild
        // judgeMarqueeStop(planMarquee, planMarquee.firstChild.offsetWidth, planCell.offsetWidth)
        planCell.innerHTML = userPlan['plan']

        var optCell = row.insertCell(3)
        optCell.innerHTML = '<button class="plan_btn" onclick="deletePlan(this);"><span class="icon-minus"></span></button>'
    }

    if (table.rows.length > _MaxPlansNumber) {
        document.getElementById('add_new_plan').disabled = true
    }
}

function closeModifyPlans() {
    document.getElementById('div_modify_plans').hidden = true
}

function addPlan() {
    var table = document.getElementById('modify_plans')
    
    var row = table.insertRow()
    
    var idCell = row.insertCell(0)
    idCell.innerHTML = "0"
    idCell.hidden = true
    
    var contentCell = row.insertCell(1)
    contentCell.innerHTML = '<input type="text" class="modify_input center" name="modify_text" placeholder="e.g. 阅读5篇" maxlength="20" />'
    
    var planCell = row.insertCell(2)
    planCell.innerHTML = '<input type="text" class="modify_input center" name="modify_text" placeholder="e.g. 每周5次" maxlength="20" />'
    
    var optCell = row.insertCell(3)
    optCell.innerHTML = '<button class="plan_btn" onclick="deletePlan(this);"><span class="icon-minus"></span></button>'

    if (table.rows.length > _MaxPlansNumber) {
        document.getElementById('add_new_plan').disabled = true
    }
}

function deletePlan(btn) {
    var tr = btn.parentNode.parentNode
    tr.parentNode.removeChild(tr)
    document.getElementById('add_new_plan').disabled = false
}

// function judgeMarqueeStop(marquee, width, maxWidth) {
//     if (width < maxWidth) {
//         marquee.stop();
//         marquee.disabled = true;
//     }
// }

// function startMarquee(marquee) {
//     if (!marquee.disabled) {
//         marquee.start()
//     }
// }

// function stopMarquee(marquee) {
//     if (!marquee.disabled) {
//         marquee.stop()
//     }
// }

function getPlanText(node) {
    while (node.children.length > 0 && node.name != 'modify_text') {
        node = node.firstChild
    }
 
    if (node.name == 'modify_text') {
        ret = node.value
    } else {
        ret = node.innerHTML
    }
    return ret.replace(/(^\s*)|(\s*$)/g, "");
}

function confirmModifyPlans() {
    var table = document.getElementById('modify_plans')
    var newPlans = new Array()

    for (var i = 1; i < table.rows.length; i++) {
        var tr = table.rows[i]

        var plan = new Object()
        plan['plan_id'] = getPlanText(tr.children[0])
        plan['content'] = getPlanText(tr.children[1])
        plan['plan'] = getPlanText(tr.children[2])

        if (plan['content'] != '' && plan['plan'] != '') {
            newPlans.push(plan)
        }
    }

    changedPlans = new Array()
    var oldIndex = 0
    var newIndex = 0
    for ( ; oldIndex < _userPlans.length; oldIndex++) {
        if (newIndex >= newPlans.length) {
            changedPlans = changedPlans.concat(_userPlans.slice(oldIndex))
            break
        }

        if (_userPlans[oldIndex]['plan_id'] == newPlans[newIndex]['plan_id']) {
            newIndex++
        } else {
            changedPlans.push(_userPlans[oldIndex])
        }
    }

    changedPlans = changedPlans.concat(newPlans.slice(newIndex))

    if (changedPlans.length == 0) {
        closeModifyPlans()
    } else {
        modify(changedPlans)
    }
}

// export function
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
            var tdValue = tb.rows[i].cells[j].innerHTML

            // escape CSV special character(, and "): add qoutation around tdValue, replace " to "" 
            columnArray.push('"' + tdValue.replace(/"/g,'""') + '"')
        }
        
        var s = columnArray.join(',')
        rowArray.push(s)
    }

    return rowArray
} 

function clickDownload(aLink) {
    aLink.removeAttribute('download')
    aLink.href = 'javascript:void(0);'

    if (_recordTableIds.length == 0) {
        return
    }

    var queryDate = _recordTableIds[0]['date']
    var days = (new Date(queryDate.getFullYear(), queryDate.getMonth() + 1, 0)).getDate()

    // one blank line, will see more clearly in CSV
    var blankArray = new Array()
    for (var m = 0; m < days; m++) {
        blankArray.push('')
    }
    var blankCSVLine = blankArray.join(',')

    var totalArray = new Array()
    for (var i = 1; i < _recordTableIds.length; i++) {
        var firstRow = (i == 1)

        var name = _recordTableIds[i]['name']
        var userTableIds = _recordTableIds[i]['ids']

        var userArray = new Array()
        for (var j in userTableIds) {
            var firstColumn = (j == 0)

            var arr = TableToCSVArray(userTableIds[j], firstRow, firstColumn)
            for (var k in arr) {
                if (userArray[k] == undefined) {
                    userArray[k] = new Array()
                    userArray[k].push((firstRow && firstColumn && k == 0) ? 'Name' : name)
                }
                userArray[k].push(arr[k])
            }
        }

        for (var row in userArray) {
            totalArray.push(userArray[row].join(','))
        }

        // add one blank line
        totalArray.push(blankCSVLine)

        firstRow = false
    }

    var str = totalArray.join('\n')
    if (str == '') {
        return
    }

    str = encodeURIComponent(str)
    aLink.download = queryDate.getFullYear() + '_' + (queryDate.getMonth() + 1) + "_record.csv"
    aLink.href = 'data:text/csv;charset=utf-8,\ufeff'+str
}

// query function
function createRecordTable(id, data, begin, len, isModify) {
    var table = document.createElement('table')
    table.id = id
    table.setAttribute('class', 'records_table')
    table.border = 1
    var width = 23 + len * 7
    table.setAttribute('style', 'width:' + width + '%;')

    // create head
    var row = table.insertRow()
    for (var i = -1; i < len; i++) {
        var cell = row.insertCell(i+1)
        var text
        if (i == -1) {
            text = 'Plan'
            cell.setAttribute('class', 'records_th_name')
            
        } else {
            text = ('0' + (i + begin)).substr(-2)
            cell.setAttribute('class', 'records_th_date')
        }
        cell.innerHTML = text
    }

    for (var i = 0; i < data.length; i++) {
        var row = table.insertRow()

        var rowData = data[i]
        var planId = rowData[0]

        for (var j = 0; j < rowData.length - 1; j++) {
            var cell = row.insertCell(j)
            cell.setAttribute('class', 'table_td records_table_td')
            cell.innerHTML = rowData[j + 1]
            if (j > 0 && isModify) {
                cell.setAttribute('onclick', 'singleCheckIn(this,' + planId + ',' + (j - 1 + begin) + ')')
            }
        }
    }

    return table
}

function createRecordTitle(name, month) {
    var h3 = document.createElement('h3')
    h3.setAttribute('class', 'records_name')
    h3.innerHTML = 'Records of ' + name + ' in ' + _Month[month]
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

function resetRecords(userId, name, date, records) {
    _recordTableIds = new Array()

    var divRecord = document.getElementById('div_record')
    if (records == undefined) {
        divPlans.hidden = true
        return
    }
    document.getElementById('div_record').hidden = false

    // clear div
    var divRecordSub = document.getElementById('div_record_sub')
    divRecordSub.innerHTML = ''

    // query date
    var queryDate = new Date()
    queryDate.setTime(parseInt(date) * 1000)
    var minDay = 1
    var maxDay = (new Date(queryDate.getFullYear(), queryDate.getMonth() + 1, 0)).getDate()

    // no record
    var noRecord = true
    for (var i in records) {
        noRecord = false
        break
    }
    if (noRecord) {
        if (userId != '0') {
            var n = createRecordTitle(name, queryDate.getMonth())
            divRecordSub.appendChild(n)
        }
        var t = createRecordTips('Come on! Just persevere you are the best!  ^_^')
        divRecordSub.appendChild(t)

        var s = createRecordSplit()
        divRecordSub.appendChild(s)

        document.getElementById('export_query').disabled = true
        document.getElementById('export_query_a').setAttribute('onclick', 'return false;')
        document.getElementById('export_record').disabled = true
        document.getElementById('export_record_a').setAttribute('onclick', 'return false;')
        return
    }

    // put origin data into set
    var completedSet = new Object()
    for (var key in records) {
        var record = records[key]

        var userPlanObj = new Object()

        for (var i in record) {
            var oneRecord = record[i]
            var planId = oneRecord['plan_id']
            if (userPlanObj[planId] == undefined) {
                userPlanObj[planId] = new Object()
                userPlanObj[planId]['content'] = oneRecord['content']   // for show
                userPlanObj[planId]['plan'] = oneRecord['plan']         // not use
            }

            var checkinTime = parseInt(oneRecord['checkin_time'])
            if (checkinTime > 0) {
                var d = new Date()
                d.setTime(checkinTime * 1000)
                var day = d.getDate()
                userPlanObj[planId][day] = true
            }
        }

        completedSet[key] = userPlanObj
    }

    // algin data from set to array
    var showData = new Array()
    for (var key in completedSet) {
        var userPlanObj = completedSet[key]

        var showUser = new Object()

        var uid = key.split(',')[0]
        showUser['uid'] = uid
        var userName = key.split(',')[1]
        showUser['name'] = userName

        var showRecord = new Array()
        var noRecord = true

        for (var planId in userPlanObj) {            
            var planSet = userPlanObj[planId]

            var onePlanRecord = new Array()

            var planName = planSet['content']
            onePlanRecord.push(planId)
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
    _recordTableIds.push({
        'date': queryDate
    })

    var tableNumber = 0
    for (var i in showData) {
        var showUser = showData[i]

        var n = createRecordTitle(showUser['name'], queryDate.getMonth())
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

                    var onePart = onePlanRecord.slice(0, 2).concat(onePlanRecord.slice(begin + 1, begin + len + 1))
                    partRecord.push(onePart)
                }

                var tbId = _RecordTableIdPrefix + tableNumber
                tableNumber += 1
                tableIds.push(tbId)

                // var isModify = (showUser['uid'] == _userId) && (queryDate.getFullYear() == _nowY) && (queryDate.getMonth() == _nowM)
                var isModify = (showUser['uid'] == _userId)
                var tb = createRecordTable(tbId, partRecord, begin, len, isModify)
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


    if (isPC()) {
        document.getElementById('export_query').disabled = false
        document.getElementById('export_query_a').setAttribute('onclick', 'clickDownload(this);')
        document.getElementById('export_record').disabled = false
        document.getElementById('export_record_a').setAttribute('onclick', 'clickDownload(this);')
    }
}

function resetPlans(userId, name, plans) {
    var divPlans = document.getElementById('div_plans')
    if (plans == undefined) {
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
    if (showObj != undefined && showObj.length > 0) {
        for (var i in showObj) {
            var row = table.insertRow()

            var idCell = row.insertCell(0)
            idCell.innerHTML = showObj[i]['plan_id']
            idCell.hidden = true

            var contentCell = row.insertCell(1)
            contentCell.setAttribute('class', 'table_td plans_table_td')
            // contentCell.innerHTML = '<marquee class="center" scrollamount="10" onmouseover="stopMarquee(this);" onmouseout="startMarquee(this);">'
            //     + '<span>' + showObj[i]['content'] + '</span></marquee>'
            // var contentMarquee = contentCell.firstChild
            // judgeMarqueeStop(contentMarquee, contentMarquee.firstChild.offsetWidth, contentCell.offsetWidth)
            contentCell.innerHTML = showObj[i]['content']

            var planCell = row.insertCell(2)
            planCell.setAttribute('class', 'table_td plans_table_td')
            // planCell.innerHTML = '<marquee class="center" scrollamount="10" onmouseover="stopMarquee(this);" onmouseout="startMarquee(this);">'
            //     + '<span>' + showObj[i]['plan'] + '</span></marquee>'
            // var planMarquee = planCell.firstChild
            // judgeMarqueeStop(planMarquee, planMarquee.firstChild.offsetWidth, planCell.offsetWidth)
            planCell.innerHTML = showObj[i]['plan']
        }
        table.hidden = false
    } else {
        table.hidden = true
    }

    // disable 'modify' button when query user is not _userId
    if (showUserId == _userIdStr) {
        _userPlans = (showObj == undefined) ? new Array() : showObj
        document.getElementById('open_modify_plans').disabled = false
    } else {
        document.getElementById('open_modify_plans').disabled = true
    }
}

// ajax
function checkIn(beginDay, endDay, plans, isCancel, callback, isCurrent) {
    // var begin = parseInt((new Date(_nowY, _nowM, beginDay)).getTime() / 1000)
    // var end = parseInt((new Date(_nowY, _nowM, endDay)).getTime() / 1000)
    var begin, end
    var year, month
    if (!isCurrent && _recordTableIds.length > 0) {
        var date = _recordTableIds[0].date
        year = date.getFullYear()
        month = date.getMonth()
    } else {
        year = _nowY
        month = _nowM
    }
    var begin = parseInt((new Date(year, month, beginDay)).getTime() / 1000)
    var end = parseInt((new Date(year, month, endDay)).getTime() / 1000)

    var data = new Object()
    data['user_id'] = _userIdStr
    data['begin_time'] = begin.toString()
    data['end_time'] = end.toString()
    data['plan_ids'] = plans
    data['delete'] = isCancel

    var xmlhttp = newXmlhttp()
    ajaxPost(xmlhttp, '/checkin', JSON.stringify(data), function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            var obj = JSON.parse(xmlhttp.responseText)
            if (obj.errorno == 0 && callback != null) {
                callback()
            }
        }
    })
}

function modify(plans) {
    var data = new Object()
    data['user_id'] = _userIdStr
    data['data'] = plans

    var xmlhttp = newXmlhttp()
    ajaxPost(xmlhttp, '/modify', JSON.stringify(data), function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            closeModifyPlans()
            query()
        }
    })
}


function query() {
    var queryAccount = document.getElementById('query_account')
    var uid = queryAccount.value
    var name = queryAccount.options[queryAccount.selectedIndex].text

    var year = document.getElementById('query_year').value
    var month = document.getElementById('query_month').value
    
    var queryBegin = new Date(year, month, 1)
    var queryBeginUTC = parseInt(queryBegin.getTime() / 1000)
    
    var queryEnd = new Date(year,month,1)
    queryEnd.setMonth(queryEnd.getMonth() + 1)

    var queryEndUTC = parseInt(queryEnd.getTime() / 1000 - 1)

    var data = new Object()
    data['user_id'] = uid
    data['name'] = name
    data['begin'] = queryBeginUTC.toString()
    data['end'] = queryEndUTC.toString()

    var xmlhttp = newXmlhttp()
    ajaxPost(xmlhttp, '/query', JSON.stringify(data), function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            var obj = JSON.parse(xmlhttp.responseText)
            if (obj.errorno != 0) {
                alert(obj.msg)
            } else {
                resetPlans(obj.user_id, obj.name, obj.plans)
                resetRecords(obj.user_id, obj.name, obj.begin, obj.records)
            }
        }
    })

    // if query all, refresh user list
    if (uid == "0") {
        getUserList("0", true)
    }
}

function getUserList(defaultValue, notQuery) {
    if (defaultValue == undefined) {
        defaultValue = _userId
    }

    var xmlhttp = newXmlhttp()
    ajaxPost(xmlhttp, '/userlist', null, function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            var obj = JSON.parse(xmlhttp.responseText)
            if (obj.errorno != 0) {
                setLoginTips(obj.msg)
            } else {
                var accountSelect = document.getElementById('query_account')
                accountSelect.innerHTML = ""
                var allOpt = createOption("0", "All...")
                accountSelect.add(allOpt, null)

                for (var i = 0; i < obj.data.length; i++) {
                    var user = obj.data[i]
                    var opt = createOption(user.user_id, user.name)
                    accountSelect.add(opt, null)
                }
                accountSelect.value = defaultValue

                // auto query user self
                if (!notQuery) {
                    query()                    
                }
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