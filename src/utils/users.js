const users = [];

const addUser = ({id, displayName, room}) => {
    const userName = displayName?.trim().toLowerCase();
    room?.trim().toLowerCase();

    if(!userName || !room) {
        return {
            error: 'display name and room are required!'
        }
    }

    //check for existing user:
    const existingUser = users.find( x => x.room === room && x.userName === userName);

    //validate username:
    if(existingUser) {
        return {
            error: 'Username is already used!'
        }
    }

    //store user:
    const user = {id, userName, displayName, room};
    users.push(user);
    return { user };
}

const removeUser = (id) => {
    const index = users.findIndex(x => x.id === id);
    if(index !== -1) {
        return users.splice(index, 1)[0];
    }
}

const getUser = (id) => users.find( x => x.id === id);

const getUsersInRoom = (room) => users.filter( x => x.room === room);

export default {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}