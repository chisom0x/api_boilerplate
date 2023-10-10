const nodemailer = require('nodemailer');

const generateOtp = () => {
   const min = 1000;
   const max = 9999;
   let code = Math.floor(Math.random() * (max - min + 1)) + min;
   setTimeout(() => {
    code = undefined;
    console.log('OTP has been cleared');
  }, 10 * 60 * 1000);
   return code;
} ;

let signupOtp = generateOtp();
let resendOtp = generateOtp();



 class Email {
    constructor (email, url) {
        this.to = email;
        this.url = url;
    }
    newTransort() {
        if(process.env.NODE_ENV === 'production') {
            console.log('use production email service')
            // email service for production will be implemented here
        } else {
            return nodemailer.createTransport({
                host: "sandbox.smtp.mailtrap.io",
                port: 2525,
                auth: {
                user: "1b8fdd14bf303f",
                pass: "1dd4e9acce2be6"
                 }
            })
        }
    }
    async sendEmail(subject, text){
        const mailOptions = {
            from: 'onyenankiekelvin@gmail.com',
            to: this.to,
            subject,
            text
        };
        await this.newTransort().sendMail(mailOptions);
    }
    async sendPasswordReset() {
        await this.sendEmail(
            'APP - RESET PASSWORD LINK',
            this.url
        )
        }
    async sendSignupOtp(){
        await this.sendEmail(
            'APP - VERIFY YOUR ACCOUNT',
            `Your one time 4 digit password is ${signupOtp}`
        )
    }
    async resendSignupOtp(){
        await this.sendEmail(
            'APP - VERIFY YOUR ACCOUNT',
            `Your one time 4 digit password is ${resendOtp}`
        )
    }
}

module.exports = {
    Email,
    signupOtp,
    resendOtp
};