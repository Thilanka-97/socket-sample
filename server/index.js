const express = require('express');
const socket = require('socket.io');

const app = express();

const cors = require('cors');

app.use(cors());

app.use(express.json());

const server = app.listen('4000', () => {
	console.log('server running on port 4000');
});

const io = socket(server, {
	cors: {
		origin: 'http://localhost:3000',
		methods: ['GET', 'POST']
	}
});

let users = [];

const addUser = (data, socketId) => {
	!users.some((user) => user.userName === data.userName) &&
		users.push({
			groupId: data.groupId,
			groupName: data.groupName,
			userName: data.userName,
			socketId
		});
};

const removeUser = (socketId) => {
	users = users.filter((user) => user.socketId !== socketId);
};

const getUserGroup = (data) => {
	return users.filter((user) => user.groupName === data.groupName);
};

io.on('connection', (socket) => {
	console.log(socket.id);

	socket.on('joinGroup', (data) => {
		addUser(data, socket.id);
	});

	socket.on('sendMessage', async (data) => {
		const userList = await getUserGroup(data);
		userList.forEach(async (user) => {
			if (user.userName !== data.userName) {
				const res = await socket.broadcast
					.to(user.socketId)
					.emit('receiveMessage', {
						groupName: data.groupName,
						userName: data.userName,
						message: data.message
					});
			}
		});
	});

	socket.on('typing', async (data) => {
		const userList = await getUserGroup(data);
		userList.forEach(async (user) => {
			socket.broadcast.to(user.socketId).emit('typing', data);
		});
	});

	socket.on('disconnect', () => {
		removeUser(socket.id);
	});
});
