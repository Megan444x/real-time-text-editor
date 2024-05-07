const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected successfully."))
  .catch(err => console.error("MongoDB connection error:", err));

const DocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  version: {
    type: Number,
    default: 1
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Document = mongoose.model('Document', DocumentSchema);

exports.createDocument = async (req, res) => {
    try {
        const { title, content } = req.body;
        const newDocument = new Document({ title, content });
        await newDocument.save();
        res.status(201).send(newDocument);
    } catch (error) {
        console.log("Create document error:", error.message);
        res.status(400).json({ error: "Error creating document", details: error.message });
    }
};

exports.getDocumentById = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ error: "Document not found." });
        }
        res.send(document);
    } catch (error) {
        console.log("Get document by ID error:", error.message);
        res.status(500).json({ error: "Error retrieving document", details: error.message });
    }
};

exports.updateDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ error: "Document not found." });
        }

        const updatedData = {
          title: req.body.title || document.title,
          content: req.body.content || document.content,
          version: document.version + 1,
          updatedAt: Date.now()
        };

        document.set(updatedData);
        await document.save();
        res.send(document);
    } catch (error) {
        console.log("Update document error:", error.message);
        res.status(400).json({ error: "Error updating document", details: error.message });
    }
};

exports.deleteDocument = async (req, res) => {
    try {
        const deletedDocument = await Document.findByIdAndDelete(req.params.id);
        if (!deletedDocument) {
            return res.status(404).json({ error: "Document not found." });
        }
        res.status(204).send();
    } catch (error) {
        console.log("Delete document error:", error.message);
        res.status(500).json({ error: "Error deleting document", details: error.message });
    }
};

exports.listDocuments = async (req, res) => {
    try {
        const documents = await Document.find({});
        res.send(documents);
    } catch (error) {
        console.log("List documents error:", error.message);
        res.status(500).json({ error: "Error listing documents", details: error.message });
    }
};