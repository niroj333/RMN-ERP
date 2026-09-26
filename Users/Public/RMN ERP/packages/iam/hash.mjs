import argon2 from 'argon2';
const h = await argon2.hash('Admin123!');
console.log(h);
