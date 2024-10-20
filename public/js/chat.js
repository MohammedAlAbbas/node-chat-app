const socket = io();
const { createApp } = Vue

createApp({
    data() {
        return {
            messages: [],
            messageValue: "",
            displayName: "",
            room: "",
            roomData: ""
        }
    },
    mounted() {
        const { displayName, room } = Qs.parse(location.search, {
            ignoreQueryPrefix: true
        });

        this.displayName = displayName;
        this.room = room;

        document.addEventListener('DOMContentLoaded', function () {
            var elems = document.querySelectorAll('.dropdown-trigger');
            var instances = M.Dropdown.init(elems, {
                alignment: 'left',
                constrainWidth: false
            });
            var connectedUsersModal = document.querySelectorAll('#connectedUsersModal');
            var connectedUsersModalInstance = M.Modal.init(connectedUsersModal, {});
        });
        this.initWebSocket();
    },
    methods: {
        initWebSocket() {
            // received messages from the server:
            socket.on('message', (obj) => {
                this.messages.push({
                    sender: obj.sender,
                    displayName: obj.displayName,
                    type: obj.type,
                    text: obj.msg,
                    date: moment(obj.date).calendar()
                })
                setTimeout(() => {
                    this.scrollToLastMessage();
                }, 0);
            });
            // received location from the server:
            socket.on('location', (obj) => {
                this.messages.push({
                    sender: obj.sender,
                    displayName: obj.displayName,
                    type: obj.type,
                    text: obj.url,
                    date: moment(obj.date).calendar()
                })
                setTimeout(() => {
                    this.scrollToLastMessage();
                }, 0);
            });
            // received connected user list from the server:
            socket.on('roomData', (obj) => {
                //display list of users:
                this.roomData = obj;
            });
            // received system messages from the server:
            socket.on('system_message', (obj) => {
                this.messages.push({
                    sender: 'system',
                    type: 'text',
                    text: obj.message,
                    date: moment(obj.date).calendar()
                })
                setTimeout(() => {
                    this.scrollToLastMessage();
                }, 0);
            });

            socket.emit('join', { displayName: this.displayName, room: this.room }, (error) => {
                if (error) {
                    alert(error);
                    location.href = '/';
                }
            });
        },
        sendMessage() {
            //e.preventDefault();
            if (!this.messageValue) {
                return;
            }
            // this.messages.push({
            //     sender: 'me',
            //     text: this.messageValue,
            //     date: moment().calendar()
            // })
            //const messageValue = document.querySelector("#messageInput").value;
            // send message from the client to the server:
            socket.emit('sendMessage', this.messageValue, () => {
                console.log('the message was delivered successfully! (Acknoledgment).');
            });
            this.messageValue = "";
            setTimeout(() => {
                this.scrollToLastMessage();
            }, 0);

        },
        shareLocation(e) {
            if (!navigator.geolocation) {
                return alert("Your browser doesn't support goe location services!");
            }

            navigator.geolocation.getCurrentPosition((position) => {
                socket.emit('sendLocation', {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            });
        },
        showConnectedUsersModal() {
            var connectedUsersModal = document.querySelector('#connectedUsersModal');
            var instance = M.Modal.getInstance(connectedUsersModal);
            instance.open();
        },
        scrollToLastMessage() {
            const lastChildElement =
                this.$refs.messagesContainer.lastElementChild;
            lastChildElement?.scrollIntoView({
                behavior: 'smooth',
            });
        },
    }
}).mount('#app')

// document.querySelector('#sendMessageBtn').addEventListener('click', (e) => {
//     e.preventDefault();
//     const messageValue = document.querySelector("#messageInput").value;
//     // send message from the client to the server:
//     socket.emit('sendMessage', messageValue);
// });