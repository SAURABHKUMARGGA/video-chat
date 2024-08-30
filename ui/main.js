
document.addEventListener("DOMContentLoaded",()=>{
    const socket = io();

    let userName = document.getElementById("userName");
    let createBtn = document.getElementById("createUserBtn");
    let userList = document.getElementById("user-list");
    let remotevideo = document.getElementById("video2");
    let streamvideo;
    const PeerConnection = (function(){
        let peerconnection;
        const createPeerConnection = ()=>{
            const config = {
                iceServers:[
                    {
                        urls:"stun:stun01.sipphone.com"
                    }
                ]
            }
            peerconnection = new RTCPeerConnection(config);
            //add local stream to peero connection
            streamvideo.getTracks().forEach((tracks)=>{
                peerconnection.addTrack(tracks,streamvideo);
            })
            peerconnection.ontrack = ({ streams: [stream] }) => (remotevideo.srcObject = stream);
            
            peerconnection.onicecandidate = function(event){
                if(event.candidate){
                    socket.emit("icecandidate",event.candidate);
                }
            }
        }
        return {
            getInstance:()=>{
                if(!peerconnection){
                    peerconnection = createPeerConnection();
                }
                return peerconnection;
            }
        }

    })();



    createBtn.addEventListener("click",()=>{

        socket.emit("username",userName.value);
      document.getElementById("userNameContainer").style.display = "none";
    })

    socket.on("joined-user",(users)=>{
        // console.log(users);
        userList.innerHTML="";
        for( const user in users){
            const element = document.createElement("li");
            element.textContent = `${user} ${user===userName.value?"(you)":""}`;
            console.log(user);
            if(user!==userName.value){
                const callButton = document.createElement("button");
                callButton.textContent = "call"
                callButton.classList.add("btn");
                callButton.classList.add("btn-success");
                callButton.addEventListener("click",()=>{
                    startCall(user);
                })
                element.appendChild(callButton);
            }
            userList.appendChild(element);
        }
    })
    socket.on("offer",async({from,to,offer})=>{
        const pc = PeerConnection.getInstance();
        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer",{from,to,answer:pc.localDescription})
    })
    socket.on("answer",async({from,to,answer})=>{
        const pc = PeerConnection.getInstance();
        await pc.setRemoteDescription(answer);
    })
    socket.on("icecandidate",async(candiate)=>{
        const pc = PeerConnection.getInstance();
        await pc.addIceCandidate(new RTCIceCandidate(candiate));
    })
//start call
async function startCall(user){
    console.log(user);
    const pc = PeerConnection.getInstance();
    const offer =await pc.createOffer();
    console.log(offer);
    await pc.setLocalDescription(offer);
    socket.emit("offer",{from:userName.value,to:user,offer:pc.localDescription});
}

//init local video start
const startLocalVideo = async()=>{
    const videoCameras =await getConnectedDevices('videoinput');
    updateCameraList(videoCameras);
    const constraints = {'video': true, 'audio': true};
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    streamvideo = stream;
    const videoElement = document.getElementById("video1");
    videoElement.srcObject = stream;
   
}

// Updates the select element with the provided set of cameras
function updateCameraList(cameras) {
    const listElement = document.querySelector('select#availableCameras');
    listElement.innerHTML = '';
    // startLocalVideo();
    for(let camera of cameras){
        let option = document.createElement("option");
        option.textContent = camera.label;
        option.value = camera.deviceId;
        listElement.appendChild(option);
    }
    // console.log(cameras);
}

// Fetch an array of devices of a certain type
async function getConnectedDevices(type) {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === type)
}

// Get the initial set of cameras connected


// Listen for changes to media devices and update the list accordingly
navigator.mediaDevices.addEventListener('devicechange', event => {
    const newCameraList = getConnectedDevices('videoinput');
    updateCameraList(newCameraList);
});
startLocalVideo();
})