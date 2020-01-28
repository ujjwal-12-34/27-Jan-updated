const socket = io.connect("http://localhost:3000");

let div = document.getElementById("chat");
let chatArea = document.getElementById("chatArea");
let roomID = "";
let roomsDiv = document.getElementById("allRooms");
let msg = document.getElementById("chatText");
let msgbtn = document.getElementById("sendMsg");
let createRoom = document.getElementById("createRoom");
let loadRoombtn = document.getElementById("loadRoom");
let backbtn = document.getElementById("back");
let chatRoom = document.getElementById("chatRoom");
let chatRoomHeader = document.getElementById("chatRoomHeader");

let lastmsg = "";

function init(){
    //hide
    chatArea.style.display = "none";
    msg.style.display = "none";
    msgbtn.style.display = "none";
    loadRoombtn.style.display = "none";
    backbtn.style.display = "none";
    chatRoom.style.display = "none";
    //show
    createRoom.style.display = "block";
    roomsDiv.style.display = "block";

    //delete previous chat
    chatArea.innerHTML= "";

    loadRooms();
}
init();


function addToRoom(id){
    console.log(id);
    roomID = id;
    socket.emit('switchRoom', roomID);
    chatRoomHeader.innerHTML= `<h1> Welcome to room ${roomID}</h1>`;

    //show items
    chatArea.style.display = "block";
    msg.style.display = "block";
    msgbtn.style.display = "block";
    backbtn.style.display = "block";
    chatRoom.style.display = "block";

    //hide area
    createRoom.style.display = "none";
    roomsDiv.style.display = "none";

    // console.log('roomID', roomID);
    // socket.emit(roomID, '')
    // socket.join(id);
}

socket.on(roomID,(data)=>{
    console.log(data);
    div.innerHTML += data;
});

function sendMsg() {
    if(msg.value==null){
        msg.value = "";
    }
    console.log('msg sent');
    console.log('msg',msg.value);
    socket.emit('chat',msg.value);
    lastmsg = msg.value;
    // socket.emit(roomID, msg.value);
    chatArea.innerHTML+= `<p align = "right">${msg.value}</p>`;
    // chatArea.innerHTML+= `</br>`;
    msg.value = "";
}
socket.on(roomID, (data)=>{
    console.log('msg received');
   chatArea.innerText += data;
    chatArea.innerHTML+= `</br>`;
});
// socket.on(roomID, data=>{
//     // chatArea.value+=data;
// });

socket.on('connection', function(socket){
    console.log('connected');
    socket.on('disconnect', function(){ });
});


async function loadRooms() {
    let response = await fetch("http://localhost:3000/getRooms");

    let rooms = await response.json();
    // console.log(JSON.parse(rooms));
    // let ans = rooms.totalRooms;
    // console.log(rooms);

    console.log(roomsDiv.innerHTML);
    roomsDiv.innerHTML = `<h1>Rooms to join</h1>`;
    for (let item in rooms) {
        console.log(rooms[item]);
        // console.log(this.id);
        roomsDiv.innerHTML += `
                    <button class = "btn btn-primary" id = "${rooms[item]}" onclick="addToRoom('${rooms[item]}')">${rooms[item]}</button>
            </br></br>`;
        // console.log("111");
    }
}

socket.on('updateChat',(data)=>{
    console.log(data);
    if(data!=lastmsg)
    chatArea.innerHTML += `<p align="left">${data}</p>`;
});