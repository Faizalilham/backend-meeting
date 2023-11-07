require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const upload = multer({ dest: 'tmp/' });
const db = require('./src/config/db');
const cloudinary = require('./src/config/cloudinary');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/create-meeting', upload.single('image'), async (req, res) => {
    try {
        const extension = path.extname(req.file.originalname).toLowerCase();

        if (extension === '.webp' || extension === '.svg') {
            return res.status(400).json({
                code: 400,
                message: 'Bad Request',
                status: 'Error',
                data: 'File format .webp and .svg are not allowed'
            });
        }

        const result = await cloudinary.uploader.upload(req.file.path); // Upload the file path to Cloudinary

        const sql = 'INSERT INTO meeting SET ?';
        const values = {
            title: req.body.title,
            location: req.body.location,
            notes: req.body.notes,
            participants: req.body.participants,
            longitude: req.body.longitude || '0',
            latitude: req.body.latitude,
            image_url: result.secure_url,
            address: req.body.address,
            date: req.body.date
        };

        db.query(sql, values, (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({
                    code: 500,
                    message: 'Internal Server Error',
                    status: 'Error',
                    data: err
                });
            }

            db.query('SELECT * FROM meeting WHERE id = ?', result.insertId, (err, rows) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({
                        code: 500,
                        message: 'Internal Server Error',
                        status: 'Error',
                        data: err
                    });
                }

                res.status(200).json({
                    code: 200,
                    message: 'OK',
                    status: 'Success',
                    data: rows[0]
                });
            });
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            code: 500,
            message: 'Internal Server Error',
            status: 'Error',
            data: err
        });
    }
});


app.get('/meetings', (req, res) => {
    const sql = 'SELECT * FROM meeting';

    db.query(sql, (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({
                code: 500,
                message: 'Internal Server Error',
                status: 'Error',
                data: err
            });
        }

        res.status(200).json({
            code: 200,
            message: 'OK',
            status: 'Success',
            data: results
        });
    });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});