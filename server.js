import express from 'express'
import env from 'dotenv'
import {createServer} from 'node:http'
env.config();
import router from './Routes/routes.js';
import { Server } from 'socket.io';
const app = express();
const server  = createServer(app);
const io = new Server(server);
app.use(express.static("ui"));
app.use("/",router);
const users = {};
io.on("connection",(socket)=>{
    console.log("user connected");
    socket.on("username",(username)=>{
        console.log(username);
       users[username] = {username, id:socket.id};
       //informed all user 
       console.log(users);
       io.emit("joined-user",users);
    })
    socket.on("offer",({from,to,offer})=>{
        console.log(users[to]);
        console.log(users[to].id);
        // io.emit("offer",{hello:"hello"});
        io.to(users[to].id).emit("offer",{from,to,offer});
    })
    socket.on("answer",({from,to,answer})=>{
        io.to(users[from].id).emit("answer",{from ,to,answer});
    })
    socket.on("icecandidate",(icecandidate)=>{
        // console.log(icecandidate);
        socket.broadcast.emit("icecandidate",icecandidate);
    })
})

console.log(process.env.PORT);
server.listen(process.env.PORT,()=>{
    console.log("server is started");
})
