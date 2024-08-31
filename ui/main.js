
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
                        urls:"stun:stun.l.google.com:19302",
                    }
                ]
            }
            peerconnection = new RTCPeerConnection(config);
            //add local stream to peero connection
            streamvideo.getTracks().forEach((tracks)=>{
                peerconnection.addTrack(tracks,streamvideo);
            })
            peerconnection.ontrack = function(event) {
                console.log(event);
                remotevideo.srcObject = event.streams[0];
            };
            
            peerconnection.onicecandidate = function(event){
                if(event.candidate){
                    socket.emit("icecandidate",event.candidate);
                }
            }
            return peerconnection;
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
    //start call
    async function startCall(user){
        // console.log(user);
        const pc = PeerConnection.getInstance();
        // console.log(pc);
        const offer =await pc.createOffer();
        // console.log(offer);
        await pc.setLocalDescription(offer);

        // console.log(offer,pc.localDescription);
        socket.emit("offer",{from:userName.value,to:user,offer:pc.localDescription});
    }


    
    // function addPendingCandidates(pc) {
    //     if (pc.pendingCandidates) {
    //         pc.pendingCandidates.forEach(candidate => 
    //         pc.addIceCandidate(new RTCIceCandidate(candidate)));
    //         pc.pendingCandidates = [];
    //     }
    // }
    socket.on("offer",async({from,to,offer})=>{
        // console.log(socket);
        const pc = PeerConnection.getInstance();
        await pc.setRemoteDescription(offer);

        // console.log("DONE 1");
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        // addPendingCandidates(pc);
        // console.log(offer);
        socket.emit("answer",{from,to,answer:pc.localDescription})
    })
    socket.on("answer",async({from,to,answer})=>{
        const pc = PeerConnection.getInstance();
        await pc.setRemoteDescription(answer);
        console.log("DONE 2");
        // addPendingCandidates(pc);
    })

   
    socket.on("icecandidate",async(candiate)=>{
        const pc = PeerConnection.getInstance();
        // console.log(candiate);
        console.log(pc.remoteDescription);
        // console.log("DONE 3");
        if(pc.remoteDescription){
            await pc.addIceCandidate(new RTCIceCandidate(candiate));

            console.log("right");
        }else{
            console.log("wrong");
            // Store the candidate to add later
            // pc.pendingCandidates = pc.pendingCandidates || [];
            // pc.pendingCandidates.push(candiate);
        }
    })

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