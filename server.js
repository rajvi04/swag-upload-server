const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const cors = require("cors");
const fs = require("fs");

const app = express();

// Allow all origins (Shopify compatible)
app.use(cors({ origin: "*" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File Upload Configuration
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
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

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      subject: "New Form Submission with PDF",
      text: `
New Form Submission Details:

Name: ${req.body.name || ""}
Email: ${req.body.email || ""}
Phone: ${req.body.phone || ""}
Message: ${req.body.message || ""}
      `,
      attachments: [
        {
          filename: req.file.originalname,
          path: req.file.path
        }
      ]
    });

    // Optional: Send confirmation to customer
    if (req.body.email) {
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: req.body.email,
        subject: "Thank You for Your Submission",
        text: "We have received your document successfully."
      });
    }

    // Delete file after email
    fs.unlinkSync(req.file.path);

    res.json({ success: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// IMPORTANT for Render
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
