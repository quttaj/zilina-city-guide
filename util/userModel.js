const db = require('../data/database');

class User {
    static findById(userId) {
        return db.query('SELECT * FROM users WHERE id = ?', [userId]);
    }

    static delete(userId) {
        return db.query('DELETE FROM users WHERE id = ?', [userId]);
    }

    static update(userId, firstName, lastName, email) {
        return db.query('UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE id = ?', [firstName, lastName, email, userId]);
    }

    static findAll() {
        return db.query('SELECT * FROM users');
    }
}

module.exports = User;
