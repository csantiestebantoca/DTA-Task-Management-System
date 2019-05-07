let usersList;
let projectsList;
let authUser;
let actualProject;
let actualProjectKey;
let tasksList;
let newIndex = 0;
let showProjectInfo = true;

window.onload = function () {
    initializeFirebase();
    initializeUI();
    loadUsersFromFB();
    loadProjectsFromFB();
};

// #region Firebase

function initializeFirebase() {
    var config = {
        apiKey: "AIzaSyAhLsIT6egSpec2E93p1ZtlZEX2N4wySGs",
        authDomain: "dwplanning-fd04c.firebaseapp.com",
        databaseURL: "https://dwplanning-fd04c.firebaseio.com",
        projectId: "dwplanning-fd04c",
        storageBucket: "dwplanning-fd04c.appspot.com",
        messagingSenderId: "1042985627662"
    };
    firebase.initializeApp(config);
}

function loadUsersFromFB() {
    firebase.database().ref("users")
        .on("value", users => {
            usersList = users;
        });
}

function loadProjectsFromFB() {
    firebase.database().ref("projects")
        .on("value", projects => {
            projectsList = projects;
            if (actualProject) {
                selectProject(actualProjectKey);
            }
        });
}

function loadChatFromFB() {
    if (actualProject) {
        firebase.database().ref("projects/" + actualProject.key + "/chat")
            .on("value", messages => {
                updateChatFromFB(messages.val());
            });
    }
}

function loadNotificationsFromFB() {
    if (actualProject) {
        firebase.database().ref("projects/" + actualProject.key + "/tasks")
            .on("child_added", task => {
                launchNotifications(task);
            });
    }
}

function spawnNotification(theBody, theIcon, theTitle) {
    var options = {
        body: theBody,
        icon: theIcon
    }
    var n = new Notification(theTitle, options);

}

// #endregion

// #region Notifications

/*Notification.requestPermission().then(function (result) {
    console.log(result);
});*/

function launchNotifications(task) {
    let notificationTitle = task.val().task;
    let notificationOptions = {
        'body': 'Responsibles: ' + task.val().task + '\n Status: ' + +task.val().status,
        'icon': '',
        'tag': task.key
    };
    if (!("Notification" in window)) {
        alert("This browser does not support desktop notification");
    } else if (Notification.permission === "granted") {
        var notification = new Notification(notificationTitle, notificationOptions);
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission(function (permission) {
            if (permission === "granted") {
                var notification = new Notification(notificationTitle, notificationOptions);
            }
        });
    }
}

// #endregion

// #region Login

function pswKeyPressed() {
    if (event.keyCode == 13) {
        login();
    }
}

function login() {
    authUser = null;
    let userMail = document.getElementById('userMail').value;
    let userPassword = document.getElementById('userPassword').value;
    usersList.forEach(user => {
        let actualUser = user.val();
        if (actualUser.mail == userMail && actualUser.password == userPassword) {
            authUser = actualUser;
            authUser.key = user.key;
        }
    });
    if (authUser) {
        document.getElementById('userOptions').innerHTML = "<span id='userName'>" + authUser.name + " </span><img id='userAvatar' src='" + authUser.picture + "' class='avatar'>";
        showProjectsList();
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
}

// #endregion

// #region Projects

function closeAllWindows() {
    document.getElementById('login').style.display = 'none';
    document.getElementById('projectSelector').style.display = 'none';
    document.getElementById('projectData').style.display = 'none';
    document.getElementById('projectArea').style.display = 'none';
    document.getElementById('taskWindow').style.display = 'none';
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('optionsButtons').style.display = 'none';
}

function initializeUI() {
    closeAllWindows();
    document.getElementById('login').style.display = 'block';
}

function showProjectsList() {
    showProjectSelector();
    projectsList.forEach(project => {
        let actProject = project.val();
        actProject.key = project.key;
        if (actProject.leader == authUser.key || actProject.team.includes(authUser.key)) {
            showProjectTile(actProject);
        }
    });
}

function showProjectSelector() {
    closeAllWindows();
    document.getElementById('projectSelector').style.display = 'block';
}

function showProjectTile(project) {
    let projectTile = document.getElementById('projectList');
    let html = '';
    html += '<div class="projectBox">';
    html += '<div class="projectBoxName" onclick="selectProject(\'' + project.key + '\')">' + project.name + '</div>';
    html += '</div>';
    projectTile.innerHTML += html;
}

function selectProject(projectKey) {
    projectsList.forEach(project => {
        let actProject = project.val();
        actProject.key = project.key;
        if (actProject.key == projectKey) {
            actualProjectKey = projectKey;
            actualProject = actProject;
            tasksList = actProject.tasks;
            newIndex = getNewIndex(tasksList);
        }
    });
    setProjectData();
    setProjectArea();
    drawChartTasks(tasksList);
    drawChartUsers(tasksList, usersList);
    showSelectedProject();
    //loadNotificationsFromFB();
}

function getNewIndex(tasksList) {
    let result = 0;
    for (let task in tasksList) {
        let id = parseInt(task.split('_')[1]);
        if (id > result) {
            result = id;
        }
    }
    return "task_" + (result + 1);
}

function setProjectData() {
    document.getElementById('projectName').innerHTML = actualProject.name;
    document.getElementById('projectLeader').innerHTML = actualProject.leader;
    document.getElementById('projectStart').innerHTML = actualProject.startDate;
    document.getElementById('projectEnd').innerHTML = actualProject.endDate;
    document.getElementById('projectStatus').innerHTML = actualProject.status;
    showProjectUsers();
}

function setProjectArea() {
    setTaskArea('To do');
    setTaskArea('On schedule');
    setTaskArea('Overdue');
    setTaskArea('Completed');
    setTaskArea('Canceled');
}

function setTaskArea(taskArea) {
    let html = '';
    for (let task in tasksList) {
        let actTask = tasksList[task];
        if (actTask.status == taskArea || (taskArea == "To do" && actTask.status == "")) {
            html += '<div id="' + taskArea + '-' + task + '" class="taskTile" onclick="editTask(\'' + task + '\')" draggable="true" ondragstart="drag(event)">';
            html += '   <div class="taskTitle">' + actTask.task + '</div>';
            html += '   <div class="taskBar" draggable="false">';
            html += '       <div class="taskDates" draggable="false">' + actTask.startDate + '</div>';
            html += '       <div class="taskResponsibles" draggable="false">DW CS</div>';
            html += '   </div>';
            html += '</div>';
        }
    }
    document.getElementById('columnTitle_' + taskArea).innerHTML = taskArea;
    document.getElementById('columnContent_' + taskArea).innerHTML = html;
}

function showSelectedProject() {
    closeAllWindows();
    document.getElementById('projectData').style.display = 'block';
    document.getElementById('projectArea').style.display = 'block';
    document.getElementById('optionsButtons').style.display = 'block';
}

// #endregion

// #region Project Data

function showProjectUsers() {
    let element = document.getElementById('projectUsers');
    let usersPicture = "";
    usersList.forEach(user => {
        let actUser = user.val();
        usersPicture += "<div class='userPicture'><img src='" + actUser.picture + "' class='avatar'></div><div class='userInfo'><span class='userName'> " + actUser.name + "</span><br><span class='userPosition'> " + actUser.position + "</span></div>";
    });
    element.innerHTML = usersPicture;
}

function getUsersAvatars(responsible) {
    let avatars = [];
    usersList.forEach(user => {
        if (responsible.includes(user.key)) {
            avatars.push("<img src='" + user.val().picture + "' class='avatar'>");
        }
    });
    return avatars;
}

function openCloseProjectInfo() {
    showProjectInfo = !showProjectInfo;
    let display = (showProjectInfo) ? "block" : "none";
    document.getElementById('header-left').style.display = display;
    document.getElementById('header-right').style.display = display;
    document.getElementById('openCloseProjectInfo').innerHTML = "<b>" + ((showProjectInfo) ? " [ less... ] " : " [ more... ] ") + "</b>";
}

// #endregion

// #region Task

function getTask(id) {
    let result = null;
    for (let i = 0; i < tasksList.length; i++) {
        if (tasksList[i].id == id) {
            result = tasksList[i];
        }
    };
    return result;
}

function addNewTask() {
    let task = {
        task: "",
        responsible: "",
        startDate: getActualDate(),
        endDate: "",
        percentage: "",
        comments: "",
        area: "",
        status: "",
        repeat: ""
    }
    showFrom(task, newIndex, false);
}

function getActualDate() {
    let date = new Date();
    let year = date.getFullYear();
    let month = (date.getMonth() < 10) ? "0" + date.getMonth() : date.getMonth();
    let day = date.getDate();
    return year + "-" + month + "-" + day;
}

function editTask(taskKey) {
    for (let task in tasksList) {
        if (task == taskKey) {
            showFrom(tasksList[task], taskKey, true);
        }
    }
}

function showFrom(task, taskKey, showDeleteButton) {
    closeAllWindows();
    document.getElementById("taskWindow").style.display = "block";
    document.getElementById("deleteTaskButton").style.display = (showDeleteButton) ? "inline" : "none";
    document.getElementById("key").value = taskKey;
    document.getElementById("task").value = task.task;
    document.getElementById("responsible").value = task.responsible;
    document.getElementById("startDate").value = task.startDate;
    document.getElementById("endDate").value = task.endDate;
    document.getElementById("percentage").value = task.percentage;
    document.getElementById("comments").value = task.comments;
    document.getElementById("area").value = task.area;
    document.getElementById("status").value = task.status;
    document.getElementById("repeat").value = task.repeat;
}

function updateTask() {
    showSelectedProject();
    let taskKey = document.getElementById("key").value;
    let task = {
        task: document.getElementById("task").value,
        responsible: document.getElementById("responsible").value,
        startDate: document.getElementById("startDate").value,
        endDate: document.getElementById("endDate").value,
        percentage: document.getElementById("percentage").value,
        comments: document.getElementById("comments").value,
        area: document.getElementById("area").value,
        status: document.getElementById("status").value,
        repeat: document.getElementById("repeat").value,
        checkList: getTaskCheckList()
    }
    updateTaskInFB(task, taskKey);
}

function getTaskCheckList() {
    let checkList = [];
    let checkListItems = document.getElementById('checkList').getElementsByClassName('checkListItem');
    for(let i in checkListItems) {
        let item = checkList[i].value;
        checkList.push(item);
    }
    return checkList;
}

function updateTaskInFB(task, taskKey) {
    firebase.database().ref("projects/" + actualProject.key + "/tasks/" + taskKey).set(task);
}

function deleteTask() {
    let taskKey = document.getElementById("key").value;
    let task = document.getElementById("task").value;
    let confirmDelete = confirm("The task \"" + task + "\"will be eliminated");
    if (confirmDelete != null) {
        deleteTaskInFB(taskKey);
    }
}

function deleteTaskInFB(taskKey) {
    firebase.database().ref("projects/" + actualProject.key + "/tasks/" + taskKey).remove();
}

function newCheckListItemPressed() {
    if (event.keyCode == 13) {
        addNewCheckListItem();
    }
}

function addNewCheckListItem() {
    let newItem = document.getElementById('newCheckListItem').value;
    let itemHTML = '<input type="checkbox" class="checkListItem" value="' + newItem + '" style="width:20px;"> ' + newItem + '<br>';
    document.getElementById('checkList').innerHTML += itemHTML;
    document.getElementById('newCheckListItem').value = "";
}

// #endregion

// #region Drag&Drop

function allowDrop(ev) {
    ev.preventDefault();
    ev.target.style.backgroundColor = "#c3f1de";
}

function leaveDrop(ev) {
    ev.preventDefault();
    ev.target.style.backgroundColor = "#efefef";
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev, status) {
    ev.preventDefault();
    let taskId = ev.dataTransfer.getData("text");
    let target = ev.target;
    switch (target.getAttribute("class")) {
        case "taskTitle":
        case "taskBar":
            target = target.parentElement.parentElement;
            break;
        case "taskDates":
        case "taskResponsibles":
            target = target.parentElement.parentElement.parentElement;
            break;
    }
    target.appendChild(document.getElementById(taskId));
    updateTaskStatus(taskId, status)
    target.style.backgroundColor = "#efefef";
}

function updateTaskStatus(taskId, status) {
    let taskKey = taskId.split('-')[1];
    let actualTask = tasksList[taskKey];
    actualTask.status = status;
    updateTaskInFB(actualTask, taskKey);
}

// #endregion

// #region Chart

function drawChartTasks(tasksList) {
    let data = getChartData(tasksList);
    Highcharts.chart('chartTasks', {
        chart: {
            type: 'column'
        },
        title: {
            text: 'Project status chart'
        },
        subtitle: {
            text: 'DW Planning'
        },
        xAxis: {
            categories: [
                'To do',
                'Completed',
                'On schedule',
                'Overdue',
                'Canceled'
            ],
            crosshair: true
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Amount of tasks'
            }
        },
        tooltip: {
            headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
            pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                '<td style="padding:0"><b>{point.y}</b></td></tr>',
            footerFormat: '</table>',
            shared: true,
            useHTML: true
        },
        plotOptions: {
            column: {
                pointPadding: 0,
                borderWidth: 0
            }
        },
        series: [{
            name: 'Tasks status',
            data: data
        }]
    });
}

function drawChartUsers(tasksList, usersList) {
    let data = getChartData(tasksList);
    let users = getUsers(usersList);
    Highcharts.chart('chartUsers', {
        chart: {
            type: 'column'
        },
        title: {
            text: 'Team behavior'
        },
        subtitle: {
            text: 'DW Planning'
        },
        xAxis: {
            categories: users,
            crosshair: true
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Tasks'
            }
        },
        tooltip: {
            headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
            pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                '<td style="padding:0"><b>{point.y}</b></td></tr>',
            footerFormat: '</table>',
            shared: true,
            useHTML: true
        },
        plotOptions: {
            column: {
                pointPadding: 0,
                borderWidth: 0
            }
        },
        series: getTaskStatusByUser()
    });
}

function getChartData(tasksList) {
    let result = [0, 0, 0, 0, 0];
    for (let task in tasksList) {
        switch (tasksList[task].status) {
            case "":
                result[0]++;
                break;
            case "Completed":
                result[1]++;
                break;
            case "On schedule":
                result[2]++;
                break;
            case "Overdue":
                result[3]++;
                break;
            case "Canceled":
                result[4]++;
                break;
        }
    }
    return result;
}

function getUsers(usersList) {
    let result = [];
    usersList.forEach(user => {
        result.push(user.val().name.split(' ')[0]);
    });
    return result;
}

function getTaskStatusByUser() {
    let result = [{
        name: 'To do',
        data: getUserTasks('')
    }, {
        name: 'Completed',
        data: getUserTasks('Completed')
    }, {
        name: 'On schedule',
        data: getUserTasks('On schedule')
    }, {
        name: 'Overdue',
        data: getUserTasks('Overdue')
    }, {
        name: 'Canceled',
        data: getUserTasks('Canceled')
    }];
    return result;
}

function getUserTasks(status) {
    let result = [];
    usersList.forEach(user => {
        let taskNumber = 0;
        for (let task in tasksList) {
            if (tasksList[task].status == status && tasksList[task].responsible.includes(user.key)) {
                taskNumber++;
            }
        }
        result.push(taskNumber);
    });
    return result;
}

// #endregion

// #region Communications

function showVideoChat() {
    let chatIndex = "0000001";
    window.open("https://appr.tc/r/" + chatIndex, "Video chat", "_blank", "toolbar=yes,scrollbars=yes,resizable=yes,top=300,left=300,width=300,height=300");
}

function showMessenger() {
    if (actualProject) {
        document.getElementById("chatWindow").style.display = "block";
        loadChatFromFB();
    }
}

function updateChatFromFB(messages) {
    let chatList = document.getElementById("chatList");
    let html = "";
    for (let i in messages) {
        html += "<div><b>" + messages[i].name + ":</b><br>" + messages[i].message + "</div>";
    }
    chatList.innerHTML = html;
    chatList.scrollIntoView(false);
}

function keyPressed(event) {
    if (event.keyCode == 13) {
        sendMsg();
    }
}

function sendMsg() {
    let name = authUser.name;
    let message = document.getElementById("textMsg");
    if (message.value) {
        firebase.database().ref("projects/" + actualProject.key + "/chat").push({
            name: name,
            message: message.value
        });
    }
    message.value = "";
}

// #endregion