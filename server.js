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

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
// Multer setup
const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files allowed"));
    }
  }
});

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.post("/upload", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // ✅ Respond immediately to Shopify
    res.json({ success: true });
console.log("SMTP CONFIG → PORT 587 ACTIVE");
    
    // ✅ Use IPv4 + Port 587 (Fix ENETUNREACH)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  },
  family: 4
});

    // Send admin email
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      subject: "New Form Submission with PDF",
      text: `
New Form Submission Details:

Name: ${req.body.name || ""}
Email: ${req.body.email || ""}
Phone: ${req.body.phone || ""}
Project Description: ${req.body.project_description || ""}
Quantity: ${req.body.quantity || ""}
Need Date: ${req.body.need_date || ""}
Logo: ${req.body.logo || ""}
Department: ${req.body.department || ""}
Site: ${req.body.site || ""}
Project Owner: ${req.body.project_owner || ""}
      `,
      attachments: [
        {
          filename: req.file.originalname,
          path: req.file.path
        }
      ]
    });

    // Send confirmation to client
    if (req.body.email) {
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: req.body.email,
        subject: "Thank You for Your Submission",
        text: "We have received your request successfully. Our team will contact you shortly."
      });
    }

    // Safely delete file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("File delete error:", err);
    });

  } catch (error) {
    console.error("UPLOAD ERROR:", error);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


