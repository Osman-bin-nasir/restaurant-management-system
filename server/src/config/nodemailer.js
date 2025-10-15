import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    auth: {
        user: 'arrazzaq7860@gmail.com',
        pass: 'zhlglneekiekelzd'
    }
});

export default transporter;