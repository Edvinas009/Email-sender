import express from "express";
import bodyParser from "body-parser";
import { engine } from "express-handlebars";
import path from "path";
import nodemailer from "nodemailer";
import Logging from "./lib/Logging";
import dotenv from "dotenv";
const app = express();
dotenv.config();

// View engine setup
app.engine(
  "handlebars",
  engine({
    extname: ".handlebars",
    defaultLayout: false,
    layoutsDir: "views/layouts/",
  })
);
app.set("view engine", "handlebars");

// Static folder
app.use("/public", express.static(path.join(__dirname, "public")));

// Body Parser Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.render("contact");
});
app.post("/send", (req, res) => {
  const output = `
    <h3>Hello ${req.body.friendName}, ${req.body.name} want's to contact you</h3>
    <h3>Message</h3>
    <p>${req.body.message}</p>
  `;
  const friendEmail = req.body.email;
  const yourName = req.body.name;

  //Create reusable transporter object using the default SMTP transport
  //You can use https://www.sendinblue.com/ for free hosting
  let transporter = nodemailer.createTransport({
    port: Number(process.env.SMTP_PORT),
    host: process.env.SMTP_HOST,
    secure: process.env.SMTP_TLS === "yes" ? true : false,
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  // setup email data with unicode symbols
  let mailOptions = {
    from: yourName + "<" + yourName + "@email.com>", // sender address
    to: friendEmail, // list of receivers
    subject: "Your friend want's to react you", // Subject line
    html: output, // html body
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return Logging.error(error);
    }
    Logging.success(`Message sent: %s", ${info.messageId}`);
    Logging.success(`Preview URL: %s", ${nodemailer.getTestMessageUrl(info)}`);

    res.render("contact", { msg: "You send a email" });
  });
});
const port = process.env.PORT || 5000;

const start = async () => {
  try {
    app.listen(port, () => {
      Logging.success(`Server is listening on port ${port}`);
    });
  } catch (error) {
    Logging.error(error);
  }
};
start();
