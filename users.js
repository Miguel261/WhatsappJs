const userContext = {};

function getUserContext(userId) {
    if (!userContext[userId]) {
        userContext[userId] = {};
    }
    return userContext[userId];
}

function setUserContext(userId, data) {
    userContext[userId] = {
        ...getUserContext(userId),
        ...data,
    };
}

function clearUserContext(userId) {
    delete userContext[userId];
}

function resetUserContext(userId) {
    const current = getUserContext(userId);
    const preserved = { menuSent: current.menuSent === true }; // preserva si ya estaba en true

    userContext[userId] = {
        ...preserved,
        flow: null,
        curp: null,
        userData: null,
        curpRequested: false,
        intentos: 0,
        blockedUntil: null
    };
}

module.exports = {
    getUserContext,
    setUserContext,
    clearUserContext,
    resetUserContext
};
