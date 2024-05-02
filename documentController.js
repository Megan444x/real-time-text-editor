const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const DocumentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    version: { type: Number, default: 1 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
const Document = mongoose.model("Document", DocumentSchema);
exports.createDocument = async (req, res) => {
    try {
        const { title, content } = req.body;
        const document = new Document({ title, content });
        await document.save();
        res.status(201).send(document);
    } catch (error) {
        res.status(400).send(error);
    }
};
exports.getDocumentById = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).send();
        }
        res.send(document);
    } catch (error) {
        res.status(500).send(error);
    }
};
exports.updateDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).send();
        }
        document.title = req.body.title || document.title;
        document.content = req.body.content || document.content;
        document.version += 1;
        document.updatedAt = Date.now();
        await document.save();
        res.send(document);
    } catch (error) {
        res.status(400).send(error);
    }
};
exports.deleteDocument = async (req, res) => {
    try {
        const document = await Document.findByIdAndDelete(req.params.id);
        if (!document) {
            return res.status(404).send();
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).send(error);
    }
};
exports.listDocuments = async (req, res) => {
    try {
        const documents = await Document.find({});
        res.send(documents);
    } catch (error) {
        res.status(500).send(error);
    }
};