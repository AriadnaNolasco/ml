const bcrypt = require('bcrypt');
const saltRounds = 12;
const plainPassword = '12345678'; // Cambia esto por la contraseña que quieras hashear

bcrypt.genSalt(saltRounds, (err, salt) => {
    bcrypt.hash(plainPassword, salt, (err, hash) => {
        console.log('Salt:', salt);
        console.log('Hash:', hash);
        // Usa estos valores en el INSERT del usuario
    });
});