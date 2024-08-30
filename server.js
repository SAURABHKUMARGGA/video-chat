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
       users[username] = {username, id:username.id};
       //informed all user 
       io.emit("joined-user",users);
    })
})

console.log(process.env.PORT);
server.listen(process.env.PORT,()=>{
    console.log("server is started");
})
