const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const cors = require("cors");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// PDF Upload Configuration
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files allowed"));
    }
  }
});

app.post("/upload", upload.single("pdf"), async (req, res) => {
  try {

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "rajvip0409@gmail.com",   // 🔴 sender gmail
        pass: "zeff xcdu nwwz ielc" // 🔴 app password here
      }
    });

    // Send email to YOU (client)
    await transporter.sendMail({
      from: "rajvip0409@gmail.com",
      to: "rajvip0409@gmail.com",   // 🔴 YOU will receive data here
      subject: "New Form Submission with PDF",
      text: `
New Form Submission Details:

Name: ${req.body.name}
Email: ${req.body.email}
Phone: ${req.body.phone || "Not Provided"}
Message: ${req.body.message || "No Message"}
      `,
      attachments: [
        {
          filename: req.file.originalname,
          path: req.file.path
        }
      ]
    });

    // OPTIONAL: Send confirmation to customer
    if (req.body.email) {
      await transporter.sendMail({
        from: "rajvip0409@gmail.com",
        to: req.body.email,
        subject: "Thank You for Your Submission",
        text: "We have received your document successfully."
      });
    }

    // Delete file after sending email (clean server)
    fs.unlinkSync(req.file.path);

    res.json({ success: true });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));