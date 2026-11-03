import mysql from 'mysql2';

const connection = mysql.createPool({
    host: "localhost",
    user: "Abubeker",
    database: "twitter_clone",
    password: "12345678"
});

export default connection;