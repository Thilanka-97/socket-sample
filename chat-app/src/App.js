import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import './App.css';

function App() {
	const [isLogin, setLogin] = useState(false);
	const [ourDetails, setOurDetails] = useState({});
	const socket = useRef();

	const CONNECTION_PORT = 'http://localhost:4000/';

	useEffect(() => {
		socket.current = io.connect(CONNECTION_PORT);
	}, []);

	const LoginPage = () => {
		const [userName, setUserName] = useState('');
		const [groupName, setGroupName] = useState('');
		// const [groupId, setGroupId] = useState('');

		const connectToGroup = async () => {
			const userDetails = {
				groupId,
				groupName,
				userName
			};
			setOurDetails(userDetails);
			await socket.current.emit('joinGroup', userDetails);
			setLogin(true);
		};

		return (
			<div className='LoginContainer'>
				<h2 className='LoginHeader'>Join Chat Room</h2>
				<input
					type='text'
					placeholder='Username'
					className='InputField'
					onChange={(e) => {
						setUserName(e.target.value);
					}}
				/>
				<input
					type='text'
					placeholder='Group name'
					className='InputField'
					onChange={(e) => {
						setGroupName(e.target.value);
					}}
				/>
				{/* <input
				type="text"
				placeholder="Group id"
				className="InputField"
				onChange={(e) => {
					setGroupId(e.target.value)
				}}
				/> */}
				<button
					type='button'
					className='JoinButton'
					onClick={() => connectToGroup()}
				>
					Join to Group
				</button>
			</div>
		);
	};

	const ChatPage = () => {
		const [message, setMessage] = useState('');
		const [groupName, setGroupName] = useState('');
		const [messageList, setMessageList] = useState([]);
		const [isUserTyping, setUserTyping] = useState(false);
		const [nickName, setNickName] = useState('Thilanka');

		useEffect(() => {
			setGroupName(ourDetails.groupName);
			return () => {
				setGroupName('');
			};
		}, []);

		useEffect(() => {
			socket.current.on('receiveMessage', (data) => {
				console.log(data);
				console.log('hit msg');
				setMessageList([...messageList, data]);
			});
			socket.current.on('typing', (data) => {
				const { isTyping, nick } = data;

				if (!isTyping) {
					setUserTyping(false);
					setNickName('');
				} else {
					setUserTyping(true);
					setNickName(nick);
				}
			});
		});

		useEffect(() => {
			if (message.length > 0) {
				typingMessage(true);
			}
			const timeoutId = setTimeout(() => {
				typingMessage(false);
			}, 1000);
			return () => clearTimeout(timeoutId);
		}, [message]);

		const typingMessage = (data) => {
			socket.current.emit('typing', {
				isTyping: data,
				nick: ourDetails.userName,
				groupName
			});
		};

		const sendMessage = async () => {
			const messageDetails = {
				groupName,
				// groupId: ourDetails.groupId,
				message,
				userName: ourDetails.userName
			};
			setMessageList([...messageList, messageDetails]);
			setMessage('');
			await socket.current.emit('sendMessage', messageDetails);
		};

		return (
			<div className='MessagePageContainer'>
				<div className='MessageContainer'>
					<h2 className='GroupName'>{groupName}</h2>
					<div className='MessageListContainer'>
						{messageList.map((value, index) => (
							<div
								className='ChatBox'
								key={index}
								id={value.userName === ourDetails.userName ? 'Me' : 'Others'}
							>
								<h5 className='UserName'>{value.userName}</h5>
								<p className='userMessage'>{value.message}</p>
							</div>
						))}
					</div>
					{isUserTyping && (
						<div className='MessageTypingContainer'>
							<p className='userMessage'>{`${nickName} is typing...`}</p>
						</div>
					)}
					<div className='MessageInputContainer'>
						<input
							type='text'
							placeholder='Enter Message'
							className='MessageInputField'
							onChange={(e) => {
								setMessage(e.target.value);
							}}
							value={message}
						/>
						<button
							type='button'
							className='SendButton'
							onClick={() => sendMessage()}
						>
							Send
						</button>
					</div>
				</div>
			</div>
		);
	};

	return (
		<div className='App'>
			{!isLogin && <h1 className='AppHeader'>Chat App</h1>}
			{!isLogin ? <LoginPage /> : <ChatPage />}
		</div>
	);
}

export default App;
