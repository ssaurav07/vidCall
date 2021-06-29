const socket = io('/')
// const myPeer = new Peer({host:'peerjs-server.herokuapp.com', secure:true, port:443})
const myPeer = new Peer({secure:true, port:443})

const videoGrid =  document.getElementById('video-grid');
const muteAudio = document.getElementById('mute-mic');
const muteVideo = document.getElementById('mute-vid');
const shareScreen = document.getElementById('share-screen');

muteAudio.onclick = function() { muteMic() }
muteVideo.onclick = function() { muteCam() }
shareScreen.onclick = function() { screenShare() }

let userName = currentUser;
let myStream;
var currPeer;
var perm;
var myId;
var participants = [];
var people = [];

$(".participants").append(`<li class="message"><b id="name">${userName}</b></li>`);

const myVideo = document.createElement('video')
myVideo.muted = true
const peers = {}
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myStream = stream;
  addVideoStream(myVideo, stream)

  myPeer.on('call', call => {
    call.answer(stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {      
      currPeer = call.peerConnection;

      addVideoStream(video, userVideoStream , call.peer)
    })
  })

  socket.on('know-my-id',(herObj)=>{
    if(herObj.userId == myId){
      participants.push(herObj.myId);
      console.log(herObj.myId);
    }
   
  })

  
  // socket.on("addParticipant",username =>{
  //   console.log("hi");
  //   console.log(username);
  //   $(".participants").append(`<li class="message"><b id="name">${username}</b></li>`);
  //   scrollToBottom()
  // })
  
  socket.on('user-connected', userId => {
    currId=userId;
    socket.emit('know-my-id',{myId: myId,userId: userId});
    console.log('New User Connected: ' + userId)
    const fc = () => connectToNewUser(userId, stream)
    timerid = setTimeout(fc, 0 )

    // socket.emit('joined',userName);
   
    })


    let text = $("input");
  // when press enter send message
  $('html').keydown(function (e) {
    if (e.which == 13 && text.val().length !== 0) {

      let msg = {
        text : text.val(), 
        name : userName
      }

      socket.emit('message',msg);
      text.val('')
    }
  });
  socket.on("createMessage", message => {
    $(".messages").append(`<li class="message"><b id="name">${message.name}</b><br/>${message.text}</li>`);
    scrollToBottom()
  })

})

const scrollToBottom = () => {
  var d = $('.main__chat_window');
  d.scrollTop(d.prop("scrollHeight"));
}


socket.on('user-disconnected', userId => {
  if (peers[userId]){
    peers[userId].close()
  }
  var left = document.getElementById(userId);
    console.log(left);
    if(left) left.parentNode.removeChild(left);
    console.log("child removed");
})

myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id)
  myId = id;
})


function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  call.on('stream', (userVideoStream) => {
    currPeer = call.peerConnection;
    addVideoStream(video, userVideoStream , call.peer)
  })
  call.on('close', () => {
    video.remove();
  })

  peers[userId] = call;

}

//adding new Video Stream

function addVideoStream(video, stream , id) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  if(id) video.id=id;
  videoGrid.appendChild(video);
}

//mute Mic

function muteMic() {
  myStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
  let ih = document.getElementById("mute-mic");
  if(ih.innerHTML==='<i class="fas fa-microphone-slash"></i>'){
    ih.innerHTML='<i class="fas fa-microphone"></i>';
    $("#mute-mic").css("color", "white")
  }
  else{
    ih.innerHTML='<i class="fas fa-microphone-slash"></i>';
    $("#mute-mic").css("color", "red")
  }

}

// mute Video

function muteCam() {
  myStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
  let ih = document.getElementById("mute-vid");
  if(ih.innerHTML==='<i class="fas fa-video-slash"></i>'){
    $("#mute-vid").css("color", "white")
    ih.innerHTML='<i class="fas fa-video"></i>'
  }
  else{
    ih.innerHTML='<i class="fas fa-video-slash"></i>';
    $("#mute-vid").css("color", "red")
  }
}



// For screen sharing 

function screenShare (){
  navigator.mediaDevices.getDisplayMedia({
    video: {
      cursor : "always"
    },
    audio: {
      echoCancellation : true,
      noiseSuppression : true
    }
  }).then((stream)=>{
    let videoTrack = stream.getVideoTracks()[0];
    for (let [key, rtcObj] of Object.entries(peers)) {
     let sender = rtcObj.peerConnection.getSenders().find( function(s){
        return s.track.kind === "video"
      })
      sender.replaceTrack(videoTrack);
  
    }
  }).catch((err)=>{
    console.log("unable to display media" + err);
  })
}



//Picture IN Picture

var pip = document.getElementById("pipButtonElement");

pip.addEventListener('click', async function() {
  pip.disabled = true;

  try {
    // If there is no element in Picture-in-Picture yet, request for it
    if (myVideo !== document.pictureInPictureElement) {
        await myVideo.requestPictureInPicture();
    }
    // If Picture-in-Picture already exists, exit the mode
    else {
        await document.exitPictureInPicture();
    }

} catch (error) {
    console.log(`Oh Horror! ${error}`);
} finally {
    pip.disabled = false; //enable toggle button after the event
}
})

// Toggle Calendar

function showCalendar(){
  if(document.getElementById('calendar').style.display==='none')
    $("#calendar").css("display", "block");
  else 
  $("#calendar").css("display", "none");
}



// Toggle Chat

function toggleChat(){
  if(document.querySelector('.main__right').style.display==='none')
    $(".main__right").css("display", "flex");
  else 
  $(".main__right").css("display", "none");
}


//Invite Participants

function invite(){
  let link = location.href;
  const el = document.createElement('textarea');
  el.value = link;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);

  alert("Invitation link copied to clipboard!" , link)
}


// Show Participants

function showParticipants(){
  
}