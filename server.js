require("dotenv").config();

const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* Create uploads folder if not exists */
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

/* Multer Setup */
const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 5 * 1024 * 1024 },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg"
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG PNG PDF allowed"));
    }
  }
});

/* Test route */
app.get("/", (req, res) => {
  res.send("Server is running");
});

/* Form Submit API */

app.post(
  "/submit",
  upload.fields([
    { name: "fileUpload", maxCount: 1 },
    { name: "sampleFile", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      res.json({ success: true });

      console.log("Form submission received");

      /* SMTP transporter */
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS
        },
        tls: { rejectUnauthorized: false },
        family: 4
      });

      /* Attachments */
      const attachments = [];

      const file1 = req.files?.fileUpload?.[0];
      const file2 = req.files?.sampleFile?.[0];

      if (file1) {
        attachments.push({
          filename: file1.originalname,
          path: file1.path
        });
      }

      if (file2) {
        attachments.push({
          filename: file2.originalname,
          path: file2.path
        });
      }

      /* Admin Email */
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: process.env.GMAIL_USER,
        subject: "New Swag Form Submission",
        text: `
New Form Submission

Name: ${req.body.name || ""}
Email: ${req.body.email || ""}
Phone: ${req.body.phone || ""}
Quantity: ${req.body.quantity || ""}

Project Description: ${req.body["contact[Project Description]"] || ""}
Product Details: ${req.body["contact[Product Details]"] || ""}
Need Date: ${req.body["contact[Need Date]"] || ""}
Logo: ${req.body["contact[Logo]"] || ""}
Department: ${req.body["contact[Department]"] || ""}
Site: ${req.body["contact[Site]"] || ""}
Project Owner: ${req.body["contact[Project Owner]"] || ""}
        `,
        attachments: attachments
      });

      /* Confirmation Email to User */

      if (req.body.email) {
        await transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: req.body.email,
          subject: "Thank You for Your Submission",
          text:
            "Thank you for submitting the Swag request form. Our team will review your request and contact you soon."
        });
      }

      /* Delete uploaded files */

      attachments.forEach(file => {
        fs.unlink(file.path, err => {
          if (err) console.log("Delete error:", err);
        });
      });
    } catch (error) {
      console.error("UPLOAD ERROR:", error);
    }
  }
);

/* Start server */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
