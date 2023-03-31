const { pool } = require('../config/db')
const bcrypt = require('bcryptjs')

const loginQueries = require('../data/loginQueries');
const employerQueries = require('../data/employerQueries')
const employeeQueries = require('../data/employeeQueries')
const { generateAccessToken, generateRefreshToken } = require('../auth/auth')

const login = async (req, res) => {
    const { username, password } = req.body
    if (!username || !password) {
        res.status(404).send("Incorrect Username or Password.")
        return
    }

    const data = await pool.query(loginQueries.getUserLogin, [username])

    if (!data.rowCount) {
        res.status(404).send("Incorrect Username or Password.")
        return
    }

    const hashedDBPwd = data.rows[0].password

    if (!hashedDBPwd) {
        res.status(404).send("Incorrect Username or Password.")
        return
    }

    if (await bcrypt.compare(password, hashedDBPwd)) {
        const usertype = data.rows[0].user_type
        var userId = 0;
        if (usertype == "EMPLOYER") {
            const result = await pool.query(employerQueries.getIdFromUsername, [username]);
            userId = result.rows[0].employer_id;
        } else if (usertype == "EMPLOYEE") {
            const result = await pool.query(employeeQueries.getIdFromUsername, [username]);
            userId = result.rows[0].employee_id;
        }

        const user = { username: username, usertype: usertype, userId: userId }
        const accessToken = generateAccessToken(user)
        const refreshToken = generateRefreshToken(user)
        res.status(200).json({ accessToken: accessToken, refreshToken: refreshToken });
    } else {
        res.status(404).send("Incorrect Username or Password.")
    }
};

const refreshUserLogin = (req, res) => {
    const { username, usertype, userId } = req.user
    const user = { username: username, usertype: usertype, userId: userId }
    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)
    res.status(200).json({ accessToken: accessToken, refreshToken: refreshToken });
}

module.exports = {
    login,
    refreshUserLogin
}